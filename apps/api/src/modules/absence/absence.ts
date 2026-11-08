import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authPreHandler, requireRole } from '../auth/auth.js';
import type { AuthDependencies } from '../auth/auth.js';
import { emitToRoom } from '../realtime/realtime.js';

// ── Zod schemas ────────────────────────────────────────────────────────────

const createAbsenceBodySchema = z.object({
  facultyId: z.string().min(1).optional(), // admin can specify; faculty defaults to self
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  periods: z
    .array(z.number().int().min(1).max(8))
    .min(1)
    .refine((arr) => new Set(arr).size === arr.length, 'periods must be unique'),
  reason: z.string().max(500).optional(),
});

const getAbsencesQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

// ── Dependency types ───────────────────────────────────────────────────────

export type AbsenceDependencies = AuthDependencies & {
  user: AuthDependencies['user'] & {
    findUnique(args: {
      where: { id: string } | { email: string };
      select?: { id: boolean; role: boolean; department: boolean | undefined };
    }): Promise<{
      id: string;
      name: string;
      email: string;
      role: string;
      department: string | null;
      sectionId: string | null;
      passwordHash: string;
    } | null>;
  };
  slot: {
    findMany(args: {
      where: { facultyId: string; weekday: number };
    }): Promise<{ id: string; period: number; weekday: number }[]>;
  };
  absence: {
    create(args: {
      data: {
        facultyId: string;
        date: Date;
        periods: number[];
        reason?: string;
        createdById: string;
      };
      include?: { faculty: boolean };
    }): Promise<{
      id: string;
      facultyId: string;
      date: Date;
      periods: number[];
      reason: string | null;
      createdById: string;
      faculty?: { id: string; name: string; email: string };
    }>;
    findMany(args: {
      where: { date: Date };
      include?: { faculty: boolean };
    }): Promise<
      {
        id: string;
        facultyId: string;
        date: Date;
        periods: number[];
        reason: string | null;
        createdById: string;
        faculty?: { id: string; name: string; email: string };
      }[]
    >;
  };
};

// ── Route registration ─────────────────────────────────────────────────────

export const registerAbsenceRoutes = (
  app: FastifyInstance,
  deps: AbsenceDependencies,
): void => {
  const preHandler = authPreHandler(deps);

  /**
   * POST /api/v1/absences
   * Faculty marks themselves absent; admin can mark any faculty absent.
   */
  app.post(
    '/api/v1/absences',
    { preHandler: [preHandler, requireRole('FACULTY', 'ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createAbsenceBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid body' },
        });
      }

      const actor = request.authUser!;
      const { date, periods, reason } = parsed.data;

      // Faculty can only mark themselves; admin can specify any facultyId
      let facultyId: string;
      if (actor.role === 'FACULTY') {
        if (parsed.data.facultyId && parsed.data.facultyId !== actor.id) {
          return reply.code(403).send({
            error: { code: 'FORBIDDEN', message: 'Faculty may only mark themselves absent' },
          });
        }
        facultyId = actor.id;
      } else {
        // ADMIN
        facultyId = parsed.data.facultyId ?? actor.id;
      }

      // Validate the faculty exists
      const faculty = await deps.user.findUnique({ where: { id: facultyId } });
      if (!faculty || (faculty.role !== 'FACULTY' && faculty.role !== 'ADMIN')) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Faculty not found' },
        });
      }

      // Determine the weekday (1=Mon … 6=Sat) of the given date
      const absenceDate = new Date(`${date}T00:00:00.000Z`);
      const jsDay = absenceDate.getUTCDay(); // 0=Sun, 1=Mon, …, 6=Sat
      // Convert: Sun→not allowed, Mon→1, Tue→2, … Sat→6
      if (jsDay === 0) {
        return reply.code(422).send({
          error: { code: 'INVALID_DATE', message: 'Absences cannot be on a Sunday' },
        });
      }
      const weekday = jsDay; // 1–6 matches our schema

      // Fetch faculty's slots for that weekday
      const slots = await deps.slot.findMany({
        where: { facultyId, weekday },
      });

      const slotPeriods = new Set(slots.map((s) => s.period));
      const invalidPeriods = periods.filter((p) => !slotPeriods.has(p));

      if (invalidPeriods.length > 0) {
        return reply.code(422).send({
          error: {
            code: 'NO_SLOT',
            message: `Faculty has no slot on this weekday for period(s): ${invalidPeriods.join(', ')}`,
          },
        });
      }

      // Create the absence record
      const absence = await deps.absence.create({
        data: {
          facultyId,
          date: absenceDate,
          periods,
          reason,
          createdById: actor.id,
        },
        include: { faculty: true },
      });

      // Emit to admin room
      emitToRoom('admin', 'absence:created', {
        id: absence.id,
        facultyId: absence.facultyId,
        date: absence.date.toISOString().slice(0, 10),
        periods: absence.periods,
        reason: absence.reason,
      });

      return reply.code(201).send({
        id: absence.id,
        facultyId: absence.facultyId,
        date: absence.date.toISOString().slice(0, 10),
        periods: absence.periods,
        reason: absence.reason,
        createdById: absence.createdById,
      });
    },
  );

  /**
   * GET /api/v1/absences?date=YYYY-MM-DD
   * Admin only – list all absences for a date.
   */
  app.get(
    '/api/v1/absences',
    { preHandler: [preHandler, requireRole('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = getAbsencesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'date required' },
        });
      }

      const absences = await deps.absence.findMany({
        where: { date: new Date(`${parsed.data.date}T00:00:00.000Z`) },
        include: { faculty: true },
      });

      return reply.send(
        absences.map((a) => ({
          id: a.id,
          facultyId: a.facultyId,
          date: a.date.toISOString().slice(0, 10),
          periods: a.periods,
          reason: a.reason,
          createdById: a.createdById,
        })),
      );
    },
  );
};
