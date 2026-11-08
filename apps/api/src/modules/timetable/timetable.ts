import '@fastify/multipart';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';

import { authPreHandler, requireRole } from '../auth/auth.js';
import type { AuthDependencies, AuthUser } from '../auth/auth.js';

type SlotRecord = {
  id: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  weekday: number;
  period: number;
  [key: string]: unknown;
};

type SubstitutionRecord = {
  slotId: string;
  date: Date;
  substituteFacultyId: string | null;
  roomId: string;
  status: 'CONFIRMED';
  [key: string]: unknown;
};

export type EffectiveTimetableDependencies = {
  slot: {
    findMany(args: { where: { sectionId: string; weekday: number }; include?: object }): Promise<SlotRecord[]>;
  };
  substitution: {
    findMany(args: {
      where: { date: Date; status: 'CONFIRMED'; slot: { sectionId: string } };
      include?: object;
    }): Promise<SubstitutionRecord[]>;
  };
};

export type TimetableDependencies = AuthDependencies & EffectiveTimetableDependencies & {
  slot: {
    findMany(args: { where: Record<string, unknown>; include?: object }): Promise<SlotRecord[]>;
    findUnique(args: { where: { id: string }; include?: object }): Promise<SlotRecord | null>;
    create(args: { data: SlotInput }): Promise<SlotRecord>;
    update(args: { where: { id: string }; data: Partial<SlotInput> }): Promise<SlotRecord>;
    delete(args: { where: { id: string } }): Promise<SlotRecord>;
  };
  substitution: {
    findMany(args: { where: Record<string, unknown>; include?: object }): Promise<SubstitutionRecord[]>;
  };
  user: AuthDependencies['user'] & {
    findUnique(args: { where: { id: string } | { email: string } }): Promise<UserLookup | null>;
  };
  section: {
    findFirst(args: { where: { name: string; department: string } }): Promise<{ id: string; name: string; department: string } | null>;
    findUnique(args: { where: { id: string } }): Promise<{ id: string; name: string; department: string } | null>;
  };
  subject: {
    findUnique(args: { where: { code: string } }): Promise<{ id: string; code: string; name: string } | null>;
  };
  room: {
    findUnique(args: { where: { name: string } }): Promise<{ id: string; name: string; type: string; capacity: number } | null>;
  };
  $transaction<T>(fn: (tx: TimetableDependencies) => Promise<T>): Promise<T>;
};

type UserLookup = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  sectionId: string | null;
  passwordHash: string;
};

export type SlotInput = {
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  weekday: number;
  period: number;
};

type SlotWithSubstitution = SlotRecord & {
  cancelled?: boolean;
  substitution?: SubstitutionRecord;
};

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
const slotInputSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  facultyId: z.string().min(1),
  roomId: z.string().min(1),
  weekday: z.number().int().min(1).max(6),
  period: z.number().int().min(1).max(8),
});
const slotPatchSchema = slotInputSchema.partial().refine((value) => Object.keys(value).length > 0);
const csvRowSchema = z.object({
  department: z.string().trim().min(1),
  section: z.string().trim().min(1),
  weekday: z.coerce.number().int().min(1).max(6),
  period: z.coerce.number().int().min(1).max(8),
  subject_code: z.string().trim().min(1),
  faculty_email: z.string().trim().email(),
  room: z.string().trim().min(1),
});

const toUtcDate = (date: Date | string): Date =>
  date instanceof Date ? date : new Date(`${date}T00:00:00.000Z`);

const weekdayOf = (date: Date): number => {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
};

const normalizeDate = (value: string): Date => {
  const date = toUtcDate(value);
  if (Number.isNaN(date.getTime()) || weekdayOf(date) === 7) {
    throw new Error('date must be a valid Monday-Saturday date');
  }
  return date;
};

export const getEffectiveTimetable = async (
  sectionId: string,
  date: Date | string,
  dependencies: EffectiveTimetableDependencies,
): Promise<SlotWithSubstitution[]> => {
  const effectiveDate = toUtcDate(date);
  const slots = await dependencies.slot.findMany({
    where: { sectionId, weekday: weekdayOf(effectiveDate) },
    include: { subject: true, faculty: true, room: true, section: true },
  });
  const substitutions = await dependencies.substitution.findMany({
    where: {
      date: effectiveDate,
      status: 'CONFIRMED',
      slot: { sectionId },
    },
    include: { slot: true, substituteFaculty: true, room: true },
  });
  const bySlot = new Map(substitutions.map((substitution) => [substitution.slotId, substitution]));

  return slots.map((slot) => {
    const substitution = bySlot.get(slot.id);
    if (!substitution) return slot;
    return {
      ...slot,
      facultyId: substitution.substituteFacultyId ?? slot.facultyId,
      roomId: substitution.roomId,
      cancelled: substitution.substituteFacultyId === null,
      substitution,
    };
  });
};

const clashMessage = (kind: string): string => `${kind} is already assigned at this weekday and period`;

export const detectSlotClashes = (
  existing: Array<SlotInput & { id?: string }>,
  input: SlotInput,
  excludeId?: string,
): string[] => {
  const comparable = existing.filter(
    (slot) =>
      slot.weekday === input.weekday &&
      slot.period === input.period &&
      (!excludeId || slot.id !== excludeId),
  );
  const errors: string[] = [];
  if (comparable.some((slot) => slot.facultyId === input.facultyId)) errors.push(clashMessage('Faculty'));
  if (comparable.some((slot) => slot.roomId === input.roomId)) errors.push(clashMessage('Room'));
  if (comparable.some((slot) => slot.sectionId === input.sectionId)) errors.push(clashMessage('Section'));
  return errors;
};

const findClashes = async (
  db: TimetableDependencies,
  input: SlotInput,
  excludeId?: string,
): Promise<string[]> => {
  const existing = await db.slot.findMany({
    where: {
      weekday: input.weekday,
      period: input.period,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return detectSlotClashes(existing, input, excludeId);
};

const parseCsv = (csv: string): Record<string, string>[] => {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let value = '';
    let quoted = false;
    for (const character of line) {
      if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) {
        values.push(value.trim());
        value = '';
      } else value += character;
    }
    values.push(value.trim());
    return values;
  };
  const headers = parseLine(lines[0]!).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
};

const resolveCsvRow = async (
  row: z.infer<typeof csvRowSchema>,
  db: TimetableDependencies,
): Promise<SlotInput> => {
  const [section, subject, faculty, room] = await Promise.all([
    db.section.findFirst({ where: { name: row.section, department: row.department } }),
    db.subject.findUnique({ where: { code: row.subject_code } }),
    db.user.findUnique({ where: { email: row.faculty_email } }),
    db.room.findUnique({ where: { name: row.room } }),
  ]);
  if (!section) throw new Error(`Section ${row.section} was not found`);
  if (!subject) throw new Error(`Subject ${row.subject_code} was not found`);
  if (!faculty || faculty.role !== 'FACULTY') throw new Error(`Faculty ${row.faculty_email} was not found`);
  if (!room) throw new Error(`Room ${row.room} was not found`);
  return {
    sectionId: section.id,
    subjectId: subject.id,
    facultyId: faculty.id,
    roomId: room.id,
    weekday: row.weekday,
    period: row.period,
  };
};

const sendBadRequest = (reply: FastifyReply, message: string) =>
  reply.code(400).send({ error: { code: 'BAD_REQUEST', message } });

export const registerTimetableRoutes = (
  app: FastifyInstance,
  dependencies: TimetableDependencies,
): void => {
  const auth = authPreHandler(dependencies);

  app.get('/api/v1/timetable/me', { preHandler: auth }, async (request, reply) => {
    const query = z.object({ date: dateSchema }).safeParse(request.query);
    if (!query.success) return sendBadRequest(reply, 'date is required');
    const date = normalizeDate(query.data.date);
    const user = request.authUser as AuthUser;
    if (user.role === 'STUDENT') {
      if (!user.sectionId) return reply.send([]);
      return reply.send(await getEffectiveTimetable(user.sectionId, date, dependencies));
    }
    const slots = await dependencies.slot.findMany({
      where: { weekday: weekdayOf(date), facultyId: user.id },
      include: { subject: true, faculty: true, room: true, section: true },
    });
    const substitutions = await dependencies.substitution.findMany({
      where: { date, status: 'CONFIRMED', substituteFacultyId: user.id },
      include: { slot: true, substituteFaculty: true, room: true },
    });
    return reply.send([
      ...slots,
      ...substitutions.map((substitution) => ({
        ...substitution,
        slotId: substitution.slotId,
        facultyId: substitution.substituteFacultyId,
        roomId: substitution.roomId,
      })),
    ]);
  });

  app.get('/api/v1/timetable/section/:id', { preHandler: auth }, async (request, reply) => {
    const query = z.object({ date: dateSchema }).safeParse(request.query);
    if (!query.success) return sendBadRequest(reply, 'date is required');
    const section = await dependencies.section.findUnique({
      where: { id: (request.params as { id: string }).id },
    });
    if (!section) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Section not found' } });
    return reply.send(await getEffectiveTimetable(section.id, normalizeDate(query.data.date), dependencies));
  });

  app.post('/api/v1/timetable/import', { preHandler: [auth, requireRole('ADMIN')] }, async (request, reply) => {
    const file = await request.file();
    if (!file) return sendBadRequest(reply, 'CSV file is required');
    const rows = parseCsv((await file.toBuffer()).toString('utf8'));
    const errors: { row: number; message: string }[] = [];
    const resolved: { row: number; input: SlotInput }[] = [];
    const seen: SlotInput[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const parsed = csvRowSchema.safeParse(rows[index]);
      if (!parsed.success) {
        errors.push({ row: rowNumber, message: parsed.error.issues[0]?.message ?? 'Invalid row' });
        continue;
      }
      try {
        const input = await resolveCsvRow(parsed.data, dependencies);
        const clashes = [
          ...await findClashes(dependencies, input),
          ...seen.flatMap((prior) =>
            prior.weekday === input.weekday && prior.period === input.period
              ? [
                  ...(prior.facultyId === input.facultyId ? [clashMessage('Faculty')] : []),
                  ...(prior.roomId === input.roomId ? [clashMessage('Room')] : []),
                  ...(prior.sectionId === input.sectionId ? [clashMessage('Section')] : []),
                ]
              : [],
          ),
        ];
        if (clashes.length > 0) errors.push({ row: rowNumber, message: clashes.join('; ') });
        else {
          seen.push(input);
          resolved.push({ row: rowNumber, input });
        }
      } catch (error) {
        errors.push({ row: rowNumber, message: error instanceof Error ? error.message : 'Invalid row' });
      }
    }
    if (errors.length > 0) return reply.code(422).send(errors);
    await dependencies.$transaction(async (tx) => {
      for (const item of resolved) await tx.slot.create({ data: item.input });
    });
    return reply.send({ imported: resolved.length });
  });

  app.post('/api/v1/timetable/slots', { preHandler: [auth, requireRole('ADMIN')] }, async (request, reply) => {
    const parsed = slotInputSchema.safeParse(request.body);
    if (!parsed.success) return sendBadRequest(reply, 'Invalid slot');
    const clashes = await findClashes(dependencies, parsed.data);
    if (clashes.length > 0) return reply.code(409).send({ error: { code: 'CLASH', message: clashes.join('; ') } });
    return reply.code(201).send(await dependencies.slot.create({ data: parsed.data }));
  });

  app.patch('/api/v1/timetable/slots/:id', { preHandler: [auth, requireRole('ADMIN')] }, async (request, reply) => {
    const parsed = slotPatchSchema.safeParse(request.body);
    if (!parsed.success) return sendBadRequest(reply, 'Invalid slot');
    const id = (request.params as { id: string }).id;
    const current = await dependencies.slot.findUnique({ where: { id } });
    if (!current) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Slot not found' } });
    const input = { ...current, ...parsed.data };
    const clashes = await findClashes(dependencies, input, id);
    if (clashes.length > 0) return reply.code(409).send({ error: { code: 'CLASH', message: clashes.join('; ') } });
    return reply.send(await dependencies.slot.update({ where: { id }, data: parsed.data }));
  });

  app.delete('/api/v1/timetable/slots/:id', { preHandler: [auth, requireRole('ADMIN')] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    try {
      await dependencies.slot.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Slot not found' } });
    }
  });
};
