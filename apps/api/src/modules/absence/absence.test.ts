import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stub emitToRoom before importing absence module
vi.mock('../realtime/realtime.js', () => ({
  emitToRoom: vi.fn(),
}));

import { emitToRoom } from '../realtime/realtime.js';
import { registerAbsenceRoutes, type AbsenceDependencies } from './absence.js';

process.env.JWT_SECRET = 'absence-test-secret';
const SECRET = 'absence-test-secret';

// ── Fixtures ───────────────────────────────────────────────────────────────

const faculty = {
  id: 'fac-1',
  name: 'Dr. Faculty',
  email: 'faculty@test.com',
  role: 'FACULTY' as const,
  department: 'CSE',
  sectionId: null,
  passwordHash: 'x',
};

const admin = {
  id: 'adm-1',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'ADMIN' as const,
  department: 'Admin',
  sectionId: null,
  passwordHash: 'x',
};

const student = {
  id: 'stu-1',
  name: 'Student',
  email: 'stu@test.com',
  role: 'STUDENT' as const,
  department: 'CSE',
  sectionId: 'sec-1',
  passwordHash: 'x',
};

/** Wednesday 2026-11-11 is weekday 3 */
const WED = '2026-11-11';
/** Sunday 2026-11-08 */
const SUN = '2026-11-08';

const makeToken = (user: typeof faculty | typeof admin | typeof student) =>
  jwt.sign({ role: user.role, sectionId: user.sectionId }, SECRET, {
    subject: user.id,
    expiresIn: '1h',
  });

// ── Dep factory ────────────────────────────────────────────────────────────

const createDeps = (overrides: Partial<AbsenceDependencies> = {}): AbsenceDependencies => ({
  user: {
    findUnique: async ({ where }) => {
      const id = 'id' in where ? where.id : undefined;
      if (id === faculty.id) return faculty;
      if (id === admin.id) return admin;
      if (id === student.id) return student;
      return null;
    },
  },
  slot: {
    findMany: async ({ where }) => {
      // Faculty has slots on Wednesday (weekday=3) for periods 2 and 3
      if (where.facultyId === faculty.id && where.weekday === 3) {
        return [
          { id: 'slot-1', period: 2, weekday: 3 },
          { id: 'slot-2', period: 3, weekday: 3 },
        ];
      }
      return [];
    },
  },
  absence: {
    create: async ({ data }) => ({
      id: 'abs-1',
      facultyId: data.facultyId,
      date: data.date,
      periods: data.periods,
      reason: data.reason ?? null,
      createdById: data.createdById,
    }),
    findMany: async () => [
      {
        id: 'abs-1',
        facultyId: faculty.id,
        date: new Date(`${WED}T00:00:00.000Z`),
        periods: [2],
        reason: null,
        createdById: admin.id,
      },
    ],
  },
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/absences', () => {
  let app: ReturnType<typeof Fastify>;
  let deps: AbsenceDependencies;

  beforeEach(() => {
    vi.clearAllMocks();
    deps = createDeps();
    app = Fastify();
    registerAbsenceRoutes(app, deps);
  });

  it('faculty marks themselves absent', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { date: WED, periods: [2, 3] },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ facultyId: faculty.id, periods: [2, 3] });
    expect(emitToRoom).toHaveBeenCalledWith('admin', 'absence:created', expect.objectContaining({ facultyId: faculty.id }));
  });

  it('admin marks any faculty absent', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(admin)}` },
      payload: { facultyId: faculty.id, date: WED, periods: [2] },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ facultyId: faculty.id });
  });

  it('faculty cannot mark another faculty absent', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { facultyId: 'some-other-id', date: WED, periods: [2] },
    });

    expect(res.statusCode).toBe(403);
  });

  it('student is forbidden', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(student)}` },
      payload: { date: WED, periods: [2] },
    });

    expect(res.statusCode).toBe(403);
  });

  it('rejects periods with no faculty slot that weekday', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { date: WED, periods: [1, 5] }, // faculty only has 2 & 3
    });

    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('NO_SLOT');
  });

  it('rejects Sunday dates', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { date: SUN, periods: [2] },
    });

    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('INVALID_DATE');
  });

  it('rejects invalid period values', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { date: WED, periods: [0, 9] },
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects duplicate periods', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { date: WED, periods: [2, 2] },
    });

    expect(res.statusCode).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences',
      payload: { date: WED, periods: [2] },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/absences', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    app = Fastify();
    registerAbsenceRoutes(app, createDeps());
  });

  it('admin can list absences by date', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/absences?date=${WED}`,
      headers: { authorization: `Bearer ${makeToken(admin)}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('faculty is forbidden from listing all absences', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/absences?date=${WED}`,
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('requires date query param', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/absences',
      headers: { authorization: `Bearer ${makeToken(admin)}` },
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid date format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/absences?date=11-11-2026',
      headers: { authorization: `Bearer ${makeToken(admin)}` },
    });

    expect(res.statusCode).toBe(400);
  });
});
