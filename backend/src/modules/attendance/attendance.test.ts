import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../realtime/realtime.js', () => ({
  emitToRoom: vi.fn(),
}));

import { clearActiveQrBeacons, registerAttendanceRoutes, type AttendanceDependencies } from './attendance.js';

process.env.JWT_SECRET = 'attendance-test-secret';
const secret = 'attendance-test-secret';

const makeToken = (role = 'STUDENT', sectionId: string | null = 'sec-1') =>
  jwt.sign({ role, sectionId }, secret, { subject: 'stu-1', expiresIn: '1h' });

const createDeps = (): AttendanceDependencies => ({
  section: {
    findFirst: async () => ({ id: 'sec-1', name: 'CSE-3F', department: 'CSE' }),
  },
  room: {
    findFirst: async () => ({ id: 'room-1', name: 'Room 406' }),
  },
  user: {
    findMany: async () => [
      { id: 'stu-1', name: 'Student One', email: 'student1@test.com' },
      { id: 'stu-2', name: 'Student Two', email: 'student2@test.com' },
      { id: 'stu-3', name: 'Student Three', email: 'student3@test.com' },
    ],
    findUnique: async () => ({ id: 'stu-1', name: 'Student One', email: 'student1@test.com' }),
  },
  slot: {
    findUnique: async () => ({ id: 'slot-1', sectionId: 'sec-1' }),
    findFirst: async () => ({ id: 'slot-1', sectionId: 'sec-1', period: 1, subject: { name: 'Course' }, room: { name: 'Room 406' } }),
    create: async ({ data }: { data: any }) => ({ id: 'adhoc-slot-1', ...data }),
  },
  attendanceSession: {
    create: async () => ({ id: 'session-1', slotId: 'slot-1', status: 'OPEN' }),
    findFirst: async () => null,
    findUnique: async ({ where }) => where.id === 'closed-session'
      ? { id: 'closed-session', slotId: 'slot-1', status: 'CLOSED', slot: { sectionId: 'sec-1' } }
      : { id: 'session-1', slotId: 'slot-1', status: 'OPEN', slot: { sectionId: 'sec-1' } },
    findMany: async ({ where }: { where?: { status?: string } } = {}) =>
      where?.status === 'OPEN'
        ? [{ id: 'session-1', slotId: 'slot-1', status: 'OPEN', startedAt: new Date(), slot: { sectionId: 'sec-1', subject: { code: 'CSE301', name: 'Course' }, faculty: { name: 'Faculty' }, room: { name: 'Room 406' } } }]
        : [],
    update: async ({ where }) => ({ id: where.id, status: 'CLOSED' }),
  },
  attendanceRecord: {
    findUnique: async () => null,
    create: async () => ({ id: 'record-1', markedAt: new Date() }),
    findMany: async () => [
      { studentId: 'stu-1', status: 'PRESENT', method: 'SCAN', markedAt: new Date(), student: { name: 'Student One', email: 'student1@test.com' } },
    ],
    update: async () => ({ id: 'record-1' }),
  },
  subject: {
    findMany: async () => [],
    findFirst: async () => ({ id: 'sub-1', code: 'CSE301', name: 'Course' }),
  },
});

describe('attendance bug fixes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    clearActiveQrBeacons();
    app = Fastify();
    registerAttendanceRoutes(app, createDeps());
  });

  it('does not allow scanning until the faculty has fetched a QR beacon', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/attendance/active-session',
      headers: { authorization: `Bearer ${makeToken('STUDENT', 'sec-1')}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ active: false, session: null });
  });

  it('returns 5-second QR refresh metadata with a server acceptance window', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/attendance/sessions/session-1/token',
      headers: { authorization: `Bearer ${makeToken('FACULTY', null)}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeTypeOf('string');
    expect(new Date(res.json().expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('allows a faculty member to launch an ad-hoc session for any period', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/sessions',
      headers: { authorization: `Bearer ${makeToken('FACULTY', null)}` },
      payload: { period: 8, date: '2026-11-09' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ status: 'OPEN' });
  });

  it('returns present and total turnout counts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/attendance/sessions/session-1/records',
      headers: { authorization: `Bearer ${makeToken('FACULTY', null)}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      presentCount: 1,
      totalStudents: 3,
      absentCount: 2,
    });
  });

  it('rejects a scan for a closed session', async () => {
    const closedToken = jwt.sign(
      { sessionId: 'closed-session', slotId: 'slot-1', nonce: 'TEST' },
      secret,
      { expiresIn: '20s' },
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/scan',
      headers: { authorization: `Bearer ${makeToken('STUDENT', 'sec-1')}` },
      payload: { token: closedToken },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('already closed');
  });

  it('creates and counts a closed-session absent student', async () => {
    const deps = createDeps();
    deps.attendanceRecord.findMany = async ({ where }: { where?: { sessionId?: string } } = {}) =>
      where?.sessionId
        ? [
            { studentId: 'stu-1', status: 'PRESENT', method: 'SCAN', markedAt: new Date(), student: { name: 'Student One', email: 'student1@test.com' } },
            { studentId: 'stu-2', status: 'ABSENT', method: 'SYSTEM', markedAt: new Date(), student: { name: 'Student Two', email: 'student2@test.com' } },
            { studentId: 'stu-3', status: 'ABSENT', method: 'SYSTEM', markedAt: new Date(), student: { name: 'Student Three', email: 'student3@test.com' } },
          ]
        : [];

    const appWithRecords = Fastify();
    registerAttendanceRoutes(appWithRecords, deps);
    const res = await appWithRecords.inject({
      method: 'GET',
      url: '/api/v1/attendance/sessions/closed-session/records',
      headers: { authorization: `Bearer ${makeToken('FACULTY', null)}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      presentCount: 1,
      absentCount: 2,
      totalStudents: 3,
    });
  });
});
