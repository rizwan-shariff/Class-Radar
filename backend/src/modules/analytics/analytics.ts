import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authPreHandler, requireRole } from '../auth/auth.js';
import type { AuthDependencies } from '../auth/auth.js';

// ── Constants ──────────────────────────────────────────────────────────────

/** Total periods per week (8 periods × 6 days) */
export const PERIODS_PER_WEEK = 48;

/** Default attendance threshold (75%) – can be overridden by ATTENDANCE_THRESHOLD env var */
export const getAttendanceThreshold = (): number => {
  const val = process.env.ATTENDANCE_THRESHOLD;
  return val ? parseFloat(val) : 0.75;
};

// ── Pure calculation helpers ───────────────────────────────────────────────

/**
 * Calculate room utilisation for the current week.
 * utilisation = usedPeriods / PERIODS_PER_WEEK
 */
export const calcRoomUtilisation = (
  usedPeriods: number,
  periodsPerWeek = PERIODS_PER_WEEK,
): number => {
  if (periodsPerWeek <= 0) return 0;
  return Math.min(usedPeriods / periodsPerWeek, 1);
};

/**
 * Calculate whether a student is below the attendance threshold per subject.
 * Returns { canSkip } when >= threshold, or { mustAttend } when below.
 */
export const calcBunkStatus = (
  attended: number,
  total: number,
  threshold = 0.75,
): { canSkip: number } | { mustAttend: number } => {
  if (total === 0) return { canSkip: 0 };
  const pct = attended / total;
  if (pct >= threshold) {
    // Floor(4a/3 - t) for 75%
    const canSkip = Math.floor((4 * attended) / 3 - total);
    return { canSkip: Math.max(canSkip, 0) };
  } else {
    // ceil(3t - 4a) for 75%
    const mustAttend = Math.ceil(3 * total - 4 * attended);
    return { mustAttend: Math.max(mustAttend, 0) };
  }
};

// ── Dependency types ───────────────────────────────────────────────────────

export type AnalyticsDependencies = AuthDependencies & {
  room: {
    findMany(args?: object): Promise<{ id: string; name: string }[]>;
  };
  slot: {
    findMany(args: {
      where: { weekday?: { in: number[] }; roomId?: string };
    }): Promise<{ id: string; roomId: string; weekday: number; period: number }[]>;
  };
  roomBooking: {
    findMany(args: {
      where: { date: { gte: Date; lte: Date } };
    }): Promise<{ roomId: string; period: number }[]>;
  };
  attendanceRecord: {
    findMany(args: {
      where: { session: { slot: { subjectId?: string } } };
      include?: { session?: { include?: { slot?: boolean } }; student?: boolean };
    }): Promise<
      {
        id: string;
        sessionId: string;
        studentId: string;
        status: string;
        session?: {
          id: string;
          slotId: string;
          slot?: { id: string; subjectId: string; sectionId: string };
        };
      }[]
    >;
  };
  substitution: {
    findMany(args: {
      where: {
        status: string;
        date?: { gte: Date; lte: Date };
        substituteFacultyId?: { not: null };
      };
    }): Promise<{ id: string; substituteFacultyId: string | null }[]>;
  };
  user: AuthDependencies['user'] & {
    findMany(args: {
      where: { role: string };
      select?: { id: boolean; name: boolean };
    }): Promise<{ id: string; name: string }[]>;
  };
};

// ── Route registration ─────────────────────────────────────────────────────

export const registerAnalyticsRoutes = (
  app: FastifyInstance,
  deps: AnalyticsDependencies,
): void => {
  const preHandler = authPreHandler(deps);

  /**
   * GET /api/v1/analytics/room-utilization
   * Admin only. Returns used periods / 48 per room for the current week.
   */
  app.get(
    '/api/v1/analytics/room-utilization',
    { preHandler: [preHandler, requireRole('ADMIN')] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const { start, end } = currentWeekRange();

      // Get all rooms
      const rooms = await deps.room.findMany();

      // Timetable slots count per room (all 6 weekdays)
      const timetableSlots = await deps.slot.findMany({
        where: { weekday: { in: [1, 2, 3, 4, 5, 6] } },
      });

      const timetableByRoom = new Map<string, number>();
      for (const slot of timetableSlots) {
        timetableByRoom.set(slot.roomId, (timetableByRoom.get(slot.roomId) ?? 0) + 1);
      }

      // Bookings this week per room
      const bookings = await deps.roomBooking.findMany({
        where: { date: { gte: start, lte: end } },
      });

      const bookingsByRoom = new Map<string, number>();
      for (const booking of bookings) {
        bookingsByRoom.set(booking.roomId, (bookingsByRoom.get(booking.roomId) ?? 0) + 1);
      }

      const result = rooms.map((room) => {
        const timetableUsed = timetableByRoom.get(room.id) ?? 0;
        const bookingUsed = bookingsByRoom.get(room.id) ?? 0;
        const usedPeriods = timetableUsed + bookingUsed;
        const utilisation = calcRoomUtilisation(usedPeriods);

        return {
          roomId: room.id,
          roomName: room.name,
          usedPeriods,
          totalPeriods: PERIODS_PER_WEEK,
          utilisation: Math.round(utilisation * 10000) / 100, // percentage with 2 dp
        };
      });

      return reply.send(result);
    },
  );

  /**
   * GET /api/v1/analytics/low-attendance
   * Admin only. Returns students below ATTENDANCE_THRESHOLD per subject.
   */
  app.get(
    '/api/v1/analytics/low-attendance',
    { preHandler: [preHandler, requireRole('ADMIN')] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const threshold = getAttendanceThreshold();

      // Fetch all attendance records with session+slot info
      const records = await deps.attendanceRecord.findMany({
        where: { session: { slot: {} } },
        include: { session: { include: { slot: true } } },
      });

      // Build attendance map: studentId → subjectId → { attended, total }
      const attendanceMap = new Map<string, Map<string, { attended: number; total: number }>>();

      for (const record of records) {
        const subjectId = record.session?.slot?.subjectId;
        if (!subjectId) continue;

        if (!attendanceMap.has(record.studentId)) {
          attendanceMap.set(record.studentId, new Map());
        }
        const subMap = attendanceMap.get(record.studentId)!;
        if (!subMap.has(subjectId)) {
          subMap.set(subjectId, { attended: 0, total: 0 });
        }
        const entry = subMap.get(subjectId)!;
        entry.total += 1;
        if (record.status === 'PRESENT') {
          entry.attended += 1;
        }
      }

      // Filter students below threshold
      const result: {
        studentId: string;
        subjectId: string;
        attended: number;
        total: number;
        percentage: number;
        mustAttend?: number;
      }[] = [];

      for (const [studentId, subMap] of attendanceMap) {
        for (const [subjectId, stats] of subMap) {
          const pct = stats.total > 0 ? stats.attended / stats.total : 0;
          if (pct < threshold) {
            const bunk = calcBunkStatus(stats.attended, stats.total, threshold);
            result.push({
              studentId,
              subjectId,
              attended: stats.attended,
              total: stats.total,
              percentage: Math.round(pct * 10000) / 100,
              mustAttend: 'mustAttend' in bunk ? bunk.mustAttend : undefined,
            });
          }
        }
      }

      return reply.send(result);
    },
  );

  /**
   * GET /api/v1/analytics/substitutions
   * Admin only. Returns confirmed substitution count per faculty.
   */
  app.get(
    '/api/v1/analytics/substitutions',
    { preHandler: [preHandler, requireRole('ADMIN')] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const substitutions = await deps.substitution.findMany({
        where: {
          status: 'CONFIRMED',
          substituteFacultyId: { not: null },
        },
      });

      // Count per faculty
      const counts = new Map<string, number>();
      for (const sub of substitutions) {
        if (sub.substituteFacultyId) {
          counts.set(sub.substituteFacultyId, (counts.get(sub.substituteFacultyId) ?? 0) + 1);
        }
      }

      // Fetch all faculty names
      const facultyList = await deps.user.findMany({
        where: { role: 'FACULTY' },
        select: { id: true, name: true },
      });

      const result = facultyList.map((f) => ({
        facultyId: f.id,
        facultyName: f.name,
        confirmedSubstitutions: counts.get(f.id) ?? 0,
      }));

      // Sort descending by count
      result.sort((a, b) => b.confirmedSubstitutions - a.confirmedSubstitutions);

      return reply.send(result);
    },
  );
};

// ── Helper: current ISO week boundaries (Mon–Sat, UTC) ────────────────────

export const currentWeekRange = (now = new Date()): { start: Date; end: Date } => {
  const d = new Date(now);
  const jsDay = d.getUTCDay(); // 0=Sun
  const toMonday = jsDay === 0 ? -6 : 1 - jsDay;
  d.setUTCDate(d.getUTCDate() + toMonday);
  d.setUTCHours(0, 0, 0, 0);
  const start = new Date(d);
  d.setUTCDate(d.getUTCDate() + 5); // Mon+5=Sat
  d.setUTCHours(23, 59, 59, 999);
  const end = new Date(d);
  return { start, end };
};

