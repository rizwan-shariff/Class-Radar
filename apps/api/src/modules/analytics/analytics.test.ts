import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  calcRoomUtilisation,
  calcBunkStatus,
  currentWeekRange,
  PERIODS_PER_WEEK,
  registerAnalyticsRoutes,
  type AnalyticsDependencies,
} from './analytics.js';

process.env.JWT_SECRET = 'analytics-test-secret';
const SECRET = 'analytics-test-secret';

// ── Fixtures ───────────────────────────────────────────────────────────────

const admin = {
  id: 'adm-1',
  name: 'Admin',
  email: 'admin@test.com',
  role: 'ADMIN' as const,
  department: 'Admin',
  sectionId: null,
  passwordHash: 'x',
};

const faculty1 = { id: 'fac-1', name: 'Alice' };
const faculty2 = { id: 'fac-2', name: 'Bob' };

const makeAdminToken = () =>
  jwt.sign({ role: admin.role, sectionId: null }, SECRET, {
    subject: admin.id,
    expiresIn: '1h',
  });

// ════════════════════════════════════════════════════════════════════════════
// UNIT TESTS: pure calculation helpers
// ════════════════════════════════════════════════════════════════════════════

describe('calcRoomUtilisation', () => {
  it('returns 0 for 0 used periods', () => {
    expect(calcRoomUtilisation(0)).toBe(0);
  });

  it('returns 1 for 48 used periods (fully utilised)', () => {
    expect(calcRoomUtilisation(48)).toBe(1);
  });

  it('returns 0.5 for 24/48', () => {
    expect(calcRoomUtilisation(24)).toBe(0.5);
  });

  it('caps at 1 even if used > 48', () => {
    expect(calcRoomUtilisation(100)).toBe(1);
  });

  it('handles 0 periodsPerWeek gracefully', () => {
    expect(calcRoomUtilisation(10, 0)).toBe(0);
  });
});

describe('calcBunkStatus', () => {
  it('returns canSkip when at exactly 75%', () => {
    // 75% with 40 total: attended = 30
    const result = calcBunkStatus(30, 40);
    expect('canSkip' in result).toBe(true);
  });

  it('returns mustAttend when below 75%', () => {
    // 60% with 10 total: attended = 6
    const result = calcBunkStatus(6, 10);
    expect('mustAttend' in result).toBe(true);
  });

  it('computes canSkip correctly: floor(4a/3 - t)', () => {
    // attended=30, total=40 → floor(4*30/3 - 40) = floor(40-40) = 0
    const r1 = calcBunkStatus(30, 40) as { canSkip: number };
    expect(r1.canSkip).toBe(0);

    // attended=36, total=40 → floor(4*36/3 - 40) = floor(48-40) = 8
    const r2 = calcBunkStatus(36, 40) as { canSkip: number };
    expect(r2.canSkip).toBe(8);
  });

  it('computes mustAttend correctly: ceil(3t - 4a)', () => {
    // attended=6, total=10 → ceil(30-24) = 6
    const r = calcBunkStatus(6, 10) as { mustAttend: number };
    expect(r.mustAttend).toBe(6);
  });

  it('never returns negative canSkip', () => {
    // Exactly at threshold
    const r = calcBunkStatus(3, 4) as { canSkip: number };
    expect(r.canSkip).toBeGreaterThanOrEqual(0);
  });

  it('handles 0 total', () => {
    const r = calcBunkStatus(0, 0) as { canSkip: number };
    expect(r.canSkip).toBe(0);
  });

  it('uses custom threshold', () => {
    // Threshold 0.5: attended=6, total=10 → 60% ≥ 50%
    const r = calcBunkStatus(6, 10, 0.5) as { canSkip: number };
    expect('canSkip' in r).toBe(true);
  });
});

describe('currentWeekRange', () => {
  it('start is Monday', () => {
    const { start } = currentWeekRange(new Date('2026-11-11T12:00:00Z')); // Wednesday
    expect(start.getUTCDay()).toBe(1); // Monday
    expect(start.toISOString().slice(0, 10)).toBe('2026-11-09');
  });

  it('end is Saturday', () => {
    const { end } = currentWeekRange(new Date('2026-11-11T12:00:00Z')); // Wednesday
    expect(end.getUTCDay()).toBe(6); // Saturday
    expect(end.toISOString().slice(0, 10)).toBe('2026-11-14');
  });

  it('works when input is Sunday', () => {
    const { start, end } = currentWeekRange(new Date('2026-11-15T00:00:00Z')); // Sunday
    expect(start.toISOString().slice(0, 10)).toBe('2026-11-09'); // Previous Monday
    expect(end.toISOString().slice(0, 10)).toBe('2026-11-14'); // Previous Saturday
  });
});

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS: HTTP routes
// ════════════════════════════════════════════════════════════════════════════

const createDeps = (overrides: Partial<AnalyticsDependencies> = {}): AnalyticsDependencies => ({
  user: {
    findUnique: async ({ where }) => {
      const id = 'id' in where ? where.id : undefined;
      if (id === admin.id) return admin;
      return null;
    },
    findMany: async () => [faculty1, faculty2],
  },
  room: {
    findMany: async () => [
      { id: 'room-1', name: 'Room 101' },
      { id: 'room-2', name: 'Room 202' },
    ],
  },
  slot: {
    findMany: async () => [
      { id: 'slot-1', roomId: 'room-1', weekday: 1, period: 1 },
      { id: 'slot-2', roomId: 'room-1', weekday: 2, period: 2 },
      { id: 'slot-3', roomId: 'room-2', weekday: 1, period: 1 },
    ],
  },
  roomBooking: {
    findMany: async () => [
      { roomId: 'room-1', period: 3 },
    ],
  },
  attendanceRecord: {
    findMany: async () => [
      {
        id: 'ar-1',
        sessionId: 'sess-1',
        studentId: 'stu-1',
        status: 'PRESENT',
        session: { id: 'sess-1', slotId: 'slot-1', slot: { id: 'slot-1', subjectId: 'subj-1', sectionId: 'sec-1' } },
      },
      {
        id: 'ar-2',
        sessionId: 'sess-2',
        studentId: 'stu-1',
        status: 'ABSENT',
        session: { id: 'sess-2', slotId: 'slot-2', slot: { id: 'slot-2', subjectId: 'subj-1', sectionId: 'sec-1' } },
      },
      {
        id: 'ar-3',
        sessionId: 'sess-3',
        studentId: 'stu-1',
        status: 'ABSENT',
        session: { id: 'sess-3', slotId: 'slot-3', slot: { id: 'slot-3', subjectId: 'subj-1', sectionId: 'sec-1' } },
      },
      {
        id: 'ar-4',
        sessionId: 'sess-4',
        studentId: 'stu-1',
        status: 'ABSENT',
        session: { id: 'sess-4', slotId: 'slot-4', slot: { id: 'slot-4', subjectId: 'subj-1', sectionId: 'sec-1' } },
      },
      // stu-2 is above threshold
      {
        id: 'ar-5',
        sessionId: 'sess-5',
        studentId: 'stu-2',
        status: 'PRESENT',
        session: { id: 'sess-5', slotId: 'slot-5', slot: { id: 'slot-5', subjectId: 'subj-1', sectionId: 'sec-1' } },
      },
      {
        id: 'ar-6',
        sessionId: 'sess-6',
        studentId: 'stu-2',
        status: 'PRESENT',
        session: { id: 'sess-6', slotId: 'slot-6', slot: { id: 'slot-6', subjectId: 'subj-1', sectionId: 'sec-1' } },
      },
      {
        id: 'ar-7',
        sessionId: 'sess-7',
        studentId: 'stu-2',
        status: 'PRESENT',
        session: { id: 'sess-7', slotId: 'slot-7', slot: { id: 'slot-7', subjectId: 'subj-1', sectionId: 'sec-1' } },
      },
      {
        id: 'ar-8',
        sessionId: 'sess-8',
        studentId: 'stu-2',
        status: 'PRESENT',
        session: { id: 'sess-8', slotId: 'slot-8', slot: { id: 'slot-8', subjectId: 'subj-1', sectionId: 'sec-1' } },
      },
    ],
  },
  substitution: {
    findMany: async () => [
      { id: 'sub-1', substituteFacultyId: 'fac-1' },
      { id: 'sub-2', substituteFacultyId: 'fac-1' },
      { id: 'sub-3', substituteFacultyId: 'fac-2' },
    ],
  },
  ...overrides,
});

describe('GET /api/v1/analytics/room-utilization', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    app = Fastify();
    registerAnalyticsRoutes(app, createDeps());
  });

  it('returns utilisation per room', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/room-utilization',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { roomId: string; usedPeriods: number; utilisation: number }[];
    expect(Array.isArray(body)).toBe(true);

    const room1 = body.find((r) => r.roomId === 'room-1');
    // room-1 has 2 timetable slots + 1 booking = 3 used periods
    expect(room1?.usedPeriods).toBe(3);
    expect(room1?.utilisation).toBeCloseTo(3 / PERIODS_PER_WEEK * 100, 1);
  });

  it('calculates utilisation as percentage with 2 dp', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/room-utilization',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    const body = res.json() as { utilisation: number }[];
    for (const item of body) {
      expect(typeof item.utilisation).toBe('number');
      expect(item.utilisation).toBeGreaterThanOrEqual(0);
      expect(item.utilisation).toBeLessThanOrEqual(100);
    }
  });

  it('requires admin', async () => {
    const app2 = Fastify();
    registerAnalyticsRoutes(app2, {
      ...createDeps(),
      user: {
        findUnique: async ({ where }) => {
          const id = 'id' in where ? where.id : undefined;
          if (id === 'fac-1') return { id: 'fac-1', name: 'Faculty', email: 'f@test.com', role: 'FACULTY', department: 'CSE', sectionId: null, passwordHash: 'x' };
          return null;
        },
        findMany: async () => [],
      },
    });

    const facultyToken = jwt.sign({ role: 'FACULTY', sectionId: null }, SECRET, { subject: 'fac-1', expiresIn: '1h' });
    const res = await app2.inject({
      method: 'GET',
      url: '/api/v1/analytics/room-utilization',
      headers: { authorization: `Bearer ${facultyToken}` },
    });

    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/v1/analytics/low-attendance', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    app = Fastify();
    registerAnalyticsRoutes(app, createDeps());
  });

  it('returns students below threshold', async () => {
    // stu-1 has 1/4 = 25% attendance → below 75%
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/low-attendance',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { studentId: string; percentage: number }[];
    expect(body.some((s) => s.studentId === 'stu-1')).toBe(true);
  });

  it('excludes students at or above threshold', async () => {
    // stu-2 has 4/4 = 100% → above threshold, should not appear
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/low-attendance',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    const body = res.json() as { studentId: string }[];
    expect(body.some((s) => s.studentId === 'stu-2')).toBe(false);
  });

  it('includes mustAttend for below-threshold students', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/low-attendance',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    const body = res.json() as { studentId: string; mustAttend?: number }[];
    const stu1 = body.find((s) => s.studentId === 'stu-1');
    expect(stu1?.mustAttend).toBeDefined();
    expect(stu1?.mustAttend).toBeGreaterThan(0);
  });
});

describe('GET /api/v1/analytics/substitutions', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    app = Fastify();
    registerAnalyticsRoutes(app, createDeps());
  });

  it('returns confirmed substitution count per faculty', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/substitutions',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { facultyId: string; confirmedSubstitutions: number }[];
    expect(Array.isArray(body)).toBe(true);

    const fac1 = body.find((f) => f.facultyId === 'fac-1');
    expect(fac1?.confirmedSubstitutions).toBe(2);

    const fac2 = body.find((f) => f.facultyId === 'fac-2');
    expect(fac2?.confirmedSubstitutions).toBe(1);
  });

  it('returns 0 for faculty with no substitutions', async () => {
    // Add a faculty with no substitutions
    const depsWithExtra = createDeps({
      user: {
        findUnique: async ({ where }) => {
          const id = 'id' in where ? where.id : undefined;
          if (id === admin.id) return admin;
          return null;
        },
        findMany: async () => [faculty1, faculty2, { id: 'fac-3', name: 'Charlie' }],
      },
    });
    const app2 = Fastify();
    registerAnalyticsRoutes(app2, depsWithExtra);

    const res = await app2.inject({
      method: 'GET',
      url: '/api/v1/analytics/substitutions',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    const body = res.json() as { facultyId: string; confirmedSubstitutions: number }[];
    const fac3 = body.find((f) => f.facultyId === 'fac-3');
    expect(fac3?.confirmedSubstitutions).toBe(0);
  });

  it('sorts by count descending', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/substitutions',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    const body = res.json() as { confirmedSubstitutions: number }[];
    for (let i = 0; i < body.length - 1; i++) {
      expect(body[i]!.confirmedSubstitutions).toBeGreaterThanOrEqual(body[i + 1]!.confirmedSubstitutions);
    }
  });
});
