import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authPreHandler, requireRole } from '../auth/auth.js';
import type { AuthDependencies } from '../auth/auth.js';
import { emitToRoom } from '../realtime/realtime.js';

// ── Domain types ───────────────────────────────────────────────────────────

export type SlotInfo = {
  id: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  weekday: number;
  period: number;
  section?: { id: string; name: string };
  room?: { id: string; name: string; type: string; capacity: number };
};

export type RoomInfo = {
  id: string;
  name: string;
  type: string;
  capacity: number;
};

export type FacultyInfo = {
  id: string;
  name: string;
  department: string | null;
};

export type SubstituteSuggestion = {
  substitute: FacultyInfo;
  room: RoomInfo;
  substitutionsThisWeek: number;
};

export type SuggestSubstitutesInput = {
  /** Section size – used for room capacity matching */
  sectionSize: number;
  /** The slot being covered */
  slot: SlotInfo;
  /** All faculty in the same department */
  departmentFaculty: FacultyInfo[];
  /** Faculty IDs already absent on this date */
  absentFacultyIds: Set<string>;
  /** Faculty IDs already substituting in the same period on this date */
  alreadySubstitutingIds: Set<string>;
  /** Faculty IDs with an existing slot at this period */
  busyFacultyIds: Set<string>;
  /** Count of confirmed substitutions this week per faculty ID */
  substitutionCountsThisWeek: Map<string, number>;
  /** Free rooms for this period (pre-fetched by caller) */
  freeRooms: RoomInfo[];
  /** Absent faculty ID – also excluded from candidates */
  absentFacultyId: string;
};

// ── Pure business logic ────────────────────────────────────────────────────

/**
 * Suggests up to 3 substitute faculty members and an appropriate room for a
 * given slot affected by an absence.
 *
 * Rules:
 *  - Same department as the absent faculty
 *  - Not absent on the date
 *  - No slot at that period (not busy)
 *  - Not already substituting another slot in that period
 *  - Rank by: fewest confirmed substitutions this week (ascending), then name (ascending)
 *
 * Room selection:
 *  - Keep the slot's own room if it is free
 *  - Otherwise pick the free room with capacity >= section size, closest capacity
 */
export const suggestSubstitutes = (
  input: SuggestSubstitutesInput,
): SubstituteSuggestion[] => {
  const {
    sectionSize,
    slot,
    departmentFaculty,
    absentFacultyIds,
    alreadySubstitutingIds,
    busyFacultyIds,
    substitutionCountsThisWeek,
    freeRooms,
    absentFacultyId,
  } = input;

  // ── 1. Filter eligible candidates ──────────────────────────────────────
  const candidates = departmentFaculty.filter(
    (f) =>
      f.id !== absentFacultyId &&
      !absentFacultyIds.has(f.id) &&
      !alreadySubstitutingIds.has(f.id) &&
      !busyFacultyIds.has(f.id),
  );

  // ── 2. Rank ────────────────────────────────────────────────────────────
  candidates.sort((a, b) => {
    const countA = substitutionCountsThisWeek.get(a.id) ?? 0;
    const countB = substitutionCountsThisWeek.get(b.id) ?? 0;
    if (countA !== countB) return countA - countB;
    return a.name.localeCompare(b.name);
  });

  // ── 3. Take top 3 ─────────────────────────────────────────────────────
  const top3 = candidates.slice(0, 3);

  // ── 4. Room selection ──────────────────────────────────────────────────
  const slotRoomFree = freeRooms.some((r) => r.id === slot.roomId);
  let chosenRoom: RoomInfo | undefined;

  if (slotRoomFree && slot.room) {
    chosenRoom = slot.room;
  } else {
    // Find free room with capacity >= sectionSize, then pick closest capacity
    const eligible = freeRooms
      .filter((r) => r.capacity >= sectionSize)
      .sort((a, b) => a.capacity - b.capacity); // closest = smallest that fits
    chosenRoom = eligible[0];
  }

  if (!chosenRoom) {
    // No suitable room found – return candidates without a room (caller handles)
    return [];
  }

  const finalRoom = chosenRoom;
  return top3.map((f) => ({
    substitute: f,
    room: finalRoom,
    substitutionsThisWeek: substitutionCountsThisWeek.get(f.id) ?? 0,
  }));
};

// ── Dependency types ───────────────────────────────────────────────────────

export type SubstitutionDependencies = AuthDependencies & {
  absence: {
    findUnique(args: {
      where: { id: string };
      include?: {
        substitutions?: boolean;
        faculty?: boolean;
      };
    }): Promise<{
      id: string;
      facultyId: string;
      date: Date;
      periods: number[];
      reason: string | null;
      createdById: string;
      faculty?: { id: string; name: string; department: string | null };
      substitutions?: SubstitutionRow[];
    } | null>;
    findMany?(args: {
      where: { date: Date };
    }): Promise<{ facultyId: string }[]>;
  };
  slot: {
    findMany(args: {
      where: {
        facultyId?: string;
        weekday?: number;
        period?: { in: number[] };
      };
      include?: { room?: boolean; section?: boolean };
    }): Promise<SlotInfo[]>;
  };
  user: AuthDependencies['user'] & {
    findMany(args: {
      where: { department: string | null; role: string };
      select?: { id: boolean; name: boolean; department: boolean };
    }): Promise<FacultyInfo[]>;
    findUnique(args: {
      where: { id: string } | { email: string };
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
  substitution: {
    findMany(args: {
      where: {
        absenceId?: string;
        date?: Date | { gte: Date; lte: Date };
        status?: string;
        slotId?: { in: string[] };
        substituteFacultyId?: { not: null } | string;
      };
    }): Promise<SubstitutionRow[]>;
    createMany(args: {
      data: SubstitutionCreateData[];
    }): Promise<{ count: number }>;
    updateMany(args: {
      where: { absenceId: string };
      data: { status: string };
    }): Promise<{ count: number }>;
  };
  roomBooking: {
    findMany(args: {
      where: { date: Date; period: { in: number[] } };
    }): Promise<{ roomId: string; period: number }[]>;
  };
  room: {
    findMany(args: {
      where?: { id?: { in: string[] } };
    }): Promise<RoomInfo[]>;
  };
  section: {
    findUnique(args: {
      where: { id: string };
      select?: { _count?: { select: { users: boolean } } };
    }): Promise<{ _count?: { users: number } } | null>;
  };
  $transaction<T>(fn: (tx: SubstitutionDependencies) => Promise<T>): Promise<T>;
};

type SubstitutionRow = {
  id: string;
  absenceId: string;
  slotId: string;
  date: Date;
  substituteFacultyId: string | null;
  roomId: string;
  status: string;
};

type SubstitutionCreateData = {
  absenceId: string;
  slotId: string;
  date: Date;
  substituteFacultyId: string | null;
  roomId: string;
  status: 'CONFIRMED';
};

// ── Zod schemas ────────────────────────────────────────────────────────────

const confirmBodySchema = z.object({
  /** Array of { period, substituteFacultyId (null to cancel), roomId } */
  assignments: z.array(
    z.object({
      period: z.number().int().min(1).max(8),
      substituteFacultyId: z.string().min(1).nullable(),
      roomId: z.string().min(1),
    }),
  ),
});

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns Monday of the ISO week containing `date` (UTC) */
const weekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Returns Saturday of the ISO week containing `date` (UTC) */
const weekEnd = (date: Date): Date => {
  const start = weekStart(date);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 5); // Mon+5 = Sat
  end.setUTCHours(23, 59, 59, 999);
  return end;
};

// ── Route registration ─────────────────────────────────────────────────────

export const registerSubstitutionRoutes = (
  app: FastifyInstance,
  deps: SubstitutionDependencies,
): void => {
  const preHandler = authPreHandler(deps);

  /**
   * GET /api/v1/absences/:id/suggestions
   * Admin only – returns up to 3 substitute + room suggestions per affected slot.
   */
  app.get(
    '/api/v1/absences/:id/suggestions',
    { preHandler: [preHandler, requireRole('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const absence = await deps.absence.findUnique({
        where: { id },
        include: { faculty: true },
      });

      if (!absence) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Absence not found' } });
      }

      const absenceDate = absence.date;
      const jsDay = absenceDate.getUTCDay();
      const weekday = jsDay === 0 ? 7 : jsDay; // convert to 1-6 (we reject 7)

      // Slots for the absent faculty on that weekday / in those periods
      const affectedSlots = await deps.slot.findMany({
        where: {
          facultyId: absence.facultyId,
          weekday,
          period: { in: absence.periods },
        },
        include: { room: true, section: true },
      });

      if (affectedSlots.length === 0) {
        return reply.send([]);
      }

      // Department faculty
      const departmentFaculty = await deps.user.findMany({
        where: {
          department: absence.faculty?.department ?? null,
          role: 'FACULTY',
        },
        select: { id: true, name: true, department: true },
      });

      const absencesOnDate = deps.absence.findMany
        ? await deps.absence.findMany({ where: { date: absenceDate } })
        : [];
      const absentFacultyIds = new Set([
        absence.facultyId,
        ...absencesOnDate.map((absenceOnDate) => absenceOnDate.facultyId),
      ]);

      // Build set of faculty already substituting in each period
      // We need absence records for the date – fetch by slots
      const slotIds = affectedSlots.map((s) => s.id);
      const existingSubstitutions = await deps.substitution.findMany({
        where: {
          date: absenceDate,
          slotId: { in: slotIds },
          status: 'CONFIRMED',
        },
      });

      // Build busy map: period → Set<facultyId>
      const alreadySubstitutingByPeriod = new Map<number, Set<string>>();
      const busyFacultyByPeriod = new Map<number, Set<string>>();

      for (const sub of existingSubstitutions) {
        const slot = affectedSlots.find((s) => s.id === sub.slotId);
        if (!slot) continue;
        if (sub.substituteFacultyId) {
          if (!alreadySubstitutingByPeriod.has(slot.period)) {
            alreadySubstitutingByPeriod.set(slot.period, new Set());
          }
          alreadySubstitutingByPeriod.get(slot.period)!.add(sub.substituteFacultyId);
        }
      }

      // Faculty who have their own slot at that period
      const allSlotsOnPeriods = await deps.slot.findMany({
        where: { weekday, period: { in: absence.periods } },
      });
      for (const s of allSlotsOnPeriods) {
        const period = s.period;
        if (!busyFacultyByPeriod.has(period)) busyFacultyByPeriod.set(period, new Set());
        busyFacultyByPeriod.get(period)!.add(s.facultyId);
      }

      // Week substitution counts
      const weekSubs = await deps.substitution.findMany({
        where: {
          date: { gte: weekStart(absenceDate), lte: weekEnd(absenceDate) },
          status: 'CONFIRMED',
          substituteFacultyId: { not: null },
        },
      });

      const substitutionCountsThisWeek = new Map<string, number>();
      for (const sub of weekSubs) {
        if (sub.substituteFacultyId) {
          substitutionCountsThisWeek.set(
            sub.substituteFacultyId,
            (substitutionCountsThisWeek.get(sub.substituteFacultyId) ?? 0) + 1,
          );
        }
      }

      // Booked rooms that period
      const bookings = await deps.roomBooking.findMany({
        where: { date: absenceDate, period: { in: absence.periods } },
      });
      const bookedRoomsByPeriod = new Map<number, Set<string>>();
      for (const b of bookings) {
        if (!bookedRoomsByPeriod.has(b.period)) bookedRoomsByPeriod.set(b.period, new Set());
        bookedRoomsByPeriod.get(b.period)!.add(b.roomId);
      }

      // All rooms (we'll filter per period)
      const allRooms = await deps.room.findMany({});

      // Slots occupied by other classes in those periods
      const slotsByPeriod = new Map<number, Set<string>>();
      for (const s of allSlotsOnPeriods) {
        if (!slotsByPeriod.has(s.period)) slotsByPeriod.set(s.period, new Set());
        slotsByPeriod.get(s.period)!.add(s.roomId);
      }

      // Build suggestions per slot
      const result = affectedSlots.map((slot) => {
        const occupiedRooms = new Set([
          ...(slotsByPeriod.get(slot.period) ?? []),
          ...(bookedRoomsByPeriod.get(slot.period) ?? []),
        ]);

        // Exclude absent faculty room from occupied only if already in
        // Re-check: slot.roomId is "free" only if not occupied by others
        const slotRoomActuallyFree = !occupiedRooms.has(slot.roomId);
        const freeRoomsForSlot = slotRoomActuallyFree
          ? allRooms.filter((r) => !occupiedRooms.has(r.id))
          : allRooms.filter((r) => !occupiedRooms.has(r.id));

        // Section size
        const sectionSize = (slot.section as unknown as { _count?: { users: number } } | undefined)?._count?.users ?? 30;

        const suggestions = suggestSubstitutes({
          sectionSize,
          slot,
          departmentFaculty,
          absentFacultyIds,
          alreadySubstitutingIds: alreadySubstitutingByPeriod.get(slot.period) ?? new Set(),
          busyFacultyIds: busyFacultyByPeriod.get(slot.period) ?? new Set(),
          substitutionCountsThisWeek,
          freeRooms: freeRoomsForSlot,
          absentFacultyId: absence.facultyId,
        });

        return {
          slotId: slot.id,
          period: slot.period,
          suggestions,
        };
      });

      return reply.send(result);
    },
  );

  /**
   * POST /api/v1/absences/:id/confirm
   * Admin only – confirms substitution assignments in one transaction.
   * Re-checks availability inside the transaction to prevent races.
   * null substituteFacultyId → class is cancelled.
   */
  app.post(
    '/api/v1/absences/:id/confirm',
    { preHandler: [preHandler, requireRole('ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const parsed = confirmBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid body' },
        });
      }

      const absence = await deps.absence.findUnique({ where: { id } });
      if (!absence) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Absence not found' } });
      }

      const { assignments } = parsed.data;

      // Validate all requested periods are in the absence
      const absencePeriodSet = new Set(absence.periods);
      for (const a of assignments) {
        if (!absencePeriodSet.has(a.period)) {
          return reply.code(422).send({
            error: {
              code: 'INVALID_PERIOD',
              message: `Period ${a.period} is not in the absence record`,
            },
          });
        }
      }

      // Fetch affected slots
      const absenceDate = absence.date;
      const jsDay = absenceDate.getUTCDay();
      const weekday = jsDay === 0 ? 7 : jsDay;

      const slots = await deps.slot.findMany({
        where: {
          facultyId: absence.facultyId,
          weekday,
          period: { in: assignments.map((a) => a.period) },
        },
      });

      const slotByPeriod = new Map(slots.map((s) => [s.period, s]));
      for (const a of assignments) {
        if (!slotByPeriod.has(a.period)) {
          return reply.code(422).send({
            error: { code: 'NO_SLOT', message: `No slot found for period ${a.period}` },
          });
        }
      }

      // ── Run in a transaction to prevent race conditions ────────────────
      let substitutions: SubstitutionRow[] = [];

      try {
        await deps.$transaction(async (tx) => {
        // Inside the transaction: re-check that each substitute is still available
        for (const a of assignments) {
          if (!a.substituteFacultyId) continue; // class cancelled – skip availability check

          const slot = slotByPeriod.get(a.period)!;

          // Check: substitute is not busy (has own slot at that period+weekday)
          const conflictingSlots = await tx.slot.findMany({
            where: {
              facultyId: a.substituteFacultyId,
              weekday,
              period: { in: [a.period] },
            },
          });
          if (conflictingSlots.length > 0) {
            throw Object.assign(new Error(`Substitute ${a.substituteFacultyId} has a slot conflict for period ${a.period}`), {
              statusCode: 409,
              code: 'CONFLICT',
            });
          }

          // Check: substitute is not already confirmed as substitute in this period
          const slotIdsThisPeriod = (await tx.slot.findMany({
            where: { weekday, period: { in: [a.period] } },
          })).map((s) => s.id);

          const existingSub = await tx.substitution.findMany({
            where: {
              date: absenceDate,
              slotId: { in: slotIdsThisPeriod },
              status: 'CONFIRMED',
              substituteFacultyId: a.substituteFacultyId,
            },
          });
          if (existingSub.length > 0) {
            throw Object.assign(new Error(`Substitute ${a.substituteFacultyId} is already assigned for period ${a.period}`), {
              statusCode: 409,
              code: 'CONFLICT',
            });
          }

          // Check: room is free
          const roomBooked = await tx.roomBooking.findMany({
            where: { date: absenceDate, period: { in: [a.period] } },
          });
          if (roomBooked.some((b) => b.roomId === a.roomId)) {
            throw Object.assign(new Error(`Room ${a.roomId} is already booked for period ${a.period}`), {
              statusCode: 409,
              code: 'ROOM_CONFLICT',
            });
          }

          // Check: room is not occupied by another slot that period
          const occupyingSlots = await tx.slot.findMany({
            where: { weekday, period: { in: [a.period] } },
          });
          if (occupyingSlots.some((s) => s.roomId === a.roomId && s.id !== slot.id)) {
            throw Object.assign(new Error(`Room ${a.roomId} is occupied for period ${a.period}`), {
              statusCode: 409,
              code: 'ROOM_CONFLICT',
            });
          }
        }

        // Create CONFIRMED substitution rows
        const data: SubstitutionCreateData[] = assignments.map((a) => ({
          absenceId: id,
          slotId: slotByPeriod.get(a.period)!.id,
          date: absenceDate,
          substituteFacultyId: a.substituteFacultyId,
          roomId: a.roomId,
          status: 'CONFIRMED',
        }));

        await tx.substitution.createMany({ data });

        // Return created rows (we'll re-fetch minimal info)
        substitutions = data.map((d, i) => ({
          id: `sub-${i}`,
          absenceId: d.absenceId,
          slotId: d.slotId,
          date: d.date,
          substituteFacultyId: d.substituteFacultyId,
          roomId: d.roomId,
          status: d.status,
        }));
        });
      } catch (err: unknown) {
        const e = err as { statusCode?: number; code?: string; message?: string };
        const statusCode = e.statusCode ?? 500;
        const code = e.code ?? 'INTERNAL_ERROR';
        const message = e.message ?? 'An unexpected error occurred';
        return reply.code(statusCode).send({ error: { code, message } });
      }

      // ── After commit, emit events ──────────────────────────────────────
      const payload = {
        absenceId: id,
        date: absenceDate.toISOString().slice(0, 10),
        substitutions: substitutions.map((s) => ({
          slotId: s.slotId,
          substituteFacultyId: s.substituteFacultyId,
          roomId: s.roomId,
          status: s.status,
        })),
      };

      emitToRoom('admin', 'timetable:changed', payload);
      // Emit timetable:changed to affected sections
      for (const slot of slots) {
        emitToRoom(`section:${slot.sectionId}`, 'timetable:changed', payload);
      }
      emitToRoom('rooms', 'rooms:changed', payload);

      return reply.code(201).send({ substitutions: substitutions.length, absenceId: id });
    },
  );
};
