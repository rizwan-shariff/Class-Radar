import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../realtime/realtime.js', () => ({
  emitToRoom: vi.fn(),
}));

import { emitToRoom } from '../realtime/realtime.js';
import {
  suggestSubstitutes,
  registerSubstitutionRoutes,
  type SubstitutionDependencies,
  type FacultyInfo,
  type RoomInfo,
  type SlotInfo,
  type SubstituteSuggestion,
} from './substitution.js';

process.env.JWT_SECRET = 'sub-test-secret';
const SECRET = 'sub-test-secret';

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

const makeAdminToken = () =>
  jwt.sign({ role: admin.role, sectionId: null }, SECRET, {
    subject: admin.id,
    expiresIn: '1h',
  });

const makeSlot = (overrides: Partial<SlotInfo> = {}): SlotInfo => ({
  id: 'slot-1',
  sectionId: 'sec-1',
  subjectId: 'subj-1',
  facultyId: 'fac-absent',
  roomId: 'room-1',
  weekday: 3,
  period: 2,
  room: { id: 'room-1', name: 'Room 101', type: 'CLASSROOM', capacity: 60 },
  ...overrides,
});

const makeRoom = (overrides: Partial<RoomInfo> = {}): RoomInfo => ({
  id: 'room-1',
  name: 'Room 101',
  type: 'CLASSROOM',
  capacity: 60,
  ...overrides,
});

const makeFaculty = (id: string, name: string): FacultyInfo => ({
  id,
  name,
  department: 'CSE',
});

// ════════════════════════════════════════════════════════════════════════════
// UNIT TESTS: suggestSubstitutes()
// ════════════════════════════════════════════════════════════════════════════

describe('suggestSubstitutes – pure logic', () => {
  const baseInput = {
    sectionSize: 40,
    slot: makeSlot(),
    absentFacultyIds: new Set(['fac-absent']),
    alreadySubstitutingIds: new Set<string>(),
    busyFacultyIds: new Set<string>(),
    substitutionCountsThisWeek: new Map<string, number>(),
    freeRooms: [makeRoom()],
    absentFacultyId: 'fac-absent',
  };

  it('returns up to 3 suggestions', () => {
    const faculty: FacultyInfo[] = [
      makeFaculty('f1', 'Alice'),
      makeFaculty('f2', 'Bob'),
      makeFaculty('f3', 'Charlie'),
      makeFaculty('f4', 'Dave'),
    ];

    const result = suggestSubstitutes({ ...baseInput, departmentFaculty: faculty });
    expect(result).toHaveLength(3);
  });

  it('excludes the absent faculty from candidates', () => {
    const faculty: FacultyInfo[] = [
      makeFaculty('fac-absent', 'Absent'),
      makeFaculty('f1', 'Alice'),
    ];

    const result = suggestSubstitutes({ ...baseInput, departmentFaculty: faculty });
    expect(result.every((s) => s.substitute.id !== 'fac-absent')).toBe(true);
  });

  it('excludes faculty already absent that date', () => {
    const faculty: FacultyInfo[] = [
      makeFaculty('fac-also-absent', 'Also Absent'),
      makeFaculty('f1', 'Alice'),
    ];

    const result = suggestSubstitutes({
      ...baseInput,
      departmentFaculty: faculty,
      absentFacultyIds: new Set(['fac-absent', 'fac-also-absent']),
    });

    expect(result.every((s) => s.substitute.id !== 'fac-also-absent')).toBe(true);
  });

  it('excludes faculty busy in that period (own slot)', () => {
    const faculty: FacultyInfo[] = [
      makeFaculty('f-busy', 'Busy'),
      makeFaculty('f1', 'Alice'),
    ];

    const result = suggestSubstitutes({
      ...baseInput,
      departmentFaculty: faculty,
      busyFacultyIds: new Set(['f-busy']),
    });

    expect(result.every((s) => s.substitute.id !== 'f-busy')).toBe(true);
  });

  it('excludes faculty already substituting that period', () => {
    const faculty: FacultyInfo[] = [
      makeFaculty('f-subbing', 'Already Subbing'),
      makeFaculty('f1', 'Alice'),
    ];

    const result = suggestSubstitutes({
      ...baseInput,
      departmentFaculty: faculty,
      alreadySubstitutingIds: new Set(['f-subbing']),
    });

    expect(result.every((s) => s.substitute.id !== 'f-subbing')).toBe(true);
  });

  it('ranks by fewest substitutions this week first', () => {
    const faculty: FacultyInfo[] = [
      makeFaculty('f-heavy', 'Heavy'),
      makeFaculty('f-light', 'Light'),
    ];

    const counts = new Map([['f-heavy', 5], ['f-light', 1]]);
    const result = suggestSubstitutes({
      ...baseInput,
      departmentFaculty: faculty,
      substitutionCountsThisWeek: counts,
    });

    expect(result[0]?.substitute.id).toBe('f-light');
  });

  it('breaks ties by name alphabetically', () => {
    const faculty: FacultyInfo[] = [
      makeFaculty('f-z', 'Zara'),
      makeFaculty('f-a', 'Alice'),
    ];

    // Both have 0 substitutions – sort by name
    const result = suggestSubstitutes({ ...baseInput, departmentFaculty: faculty });
    expect(result[0]?.substitute.id).toBe('f-a');
  });

  it('keeps the slot room if it is free', () => {
    const result = suggestSubstitutes({
      ...baseInput,
      departmentFaculty: [makeFaculty('f1', 'Alice')],
      freeRooms: [makeRoom({ id: 'room-1' })], // slot.roomId === 'room-1'
    });

    expect(result[0]?.room.id).toBe('room-1');
  });

  it('picks a free room with capacity >= sectionSize when slot room is not free', () => {
    const slot = makeSlot({ roomId: 'room-occupied' });
    const result = suggestSubstitutes({
      ...baseInput,
      slot,
      sectionSize: 40,
      departmentFaculty: [makeFaculty('f1', 'Alice')],
      freeRooms: [
        makeRoom({ id: 'room-too-small', capacity: 20 }),
        makeRoom({ id: 'room-fits', capacity: 50 }),
        makeRoom({ id: 'room-big', capacity: 100 }),
      ],
    });

    // Should pick the closest fitting room (50)
    expect(result[0]?.room.id).toBe('room-fits');
  });

  it('returns empty array when no eligible candidates', () => {
    const result = suggestSubstitutes({
      ...baseInput,
      departmentFaculty: [],
    });

    expect(result).toHaveLength(0);
  });

  it('returns empty array when no suitable room', () => {
    const result = suggestSubstitutes({
      ...baseInput,
      departmentFaculty: [makeFaculty('f1', 'Alice')],
      sectionSize: 200, // no room has this capacity
      freeRooms: [makeRoom({ id: 'room-2', capacity: 30 })], // slot room not free
      slot: makeSlot({ roomId: 'room-occupied' }), // different from free room
    });

    expect(result).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS: HTTP routes
// ════════════════════════════════════════════════════════════════════════════

const makeAbsence = () => ({
  id: 'abs-1',
  facultyId: 'fac-1',
  date: new Date('2026-11-11T00:00:00.000Z'), // Wednesday
  periods: [2],
  reason: null,
  createdById: 'adm-1',
  faculty: { id: 'fac-1', name: 'Dr. Faculty', department: 'CSE' },
  substitutions: [],
});

type SubstitutionRow = {
  id: string;
  absenceId: string;
  slotId: string;
  date: Date;
  substituteFacultyId: string | null;
  roomId: string;
  status: string;
};

const createDeps = (overrides: Partial<SubstitutionDependencies> = {}): SubstitutionDependencies => {
  const store: SubstitutionRow[] = [];

  return {
    user: {
      findUnique: async ({ where }) => {
        const id = 'id' in where ? where.id : undefined;
        if (id === admin.id) return admin;
        return null;
      },
      findMany: async () => [
        { id: 'fac-2', name: 'Alice Sub', department: 'CSE' },
        { id: 'fac-3', name: 'Bob Sub', department: 'CSE' },
      ],
    },
    absence: {
      findUnique: async ({ where }) => {
        if (where.id === 'abs-1') return makeAbsence();
        return null;
      },
    },
    slot: {
      findMany: async ({ where }) => {
        if ((where as { facultyId?: string }).facultyId === 'fac-1') {
          return [
            {
              id: 'slot-1',
              sectionId: 'sec-1',
              subjectId: 'subj-1',
              facultyId: 'fac-1',
              roomId: 'room-1',
              weekday: 3,
              period: 2,
              room: { id: 'room-1', name: 'Room 101', type: 'CLASSROOM', capacity: 60 },
              section: { id: 'sec-1', name: 'CSE-A' },
            },
          ];
        }
        return [];
      },
    },
    substitution: {
      findMany: async () => store,
      createMany: async ({ data }) => {
        for (const d of data) {
          store.push({
            id: `sub-${store.length}`,
            absenceId: d.absenceId,
            slotId: d.slotId,
            date: d.date,
            substituteFacultyId: d.substituteFacultyId,
            roomId: d.roomId,
            status: d.status,
          });
        }
        return { count: data.length };
      },
      updateMany: async () => ({ count: 1 }),
    },
    roomBooking: {
      findMany: async () => [],
    },
    room: {
      findMany: async () => [
        { id: 'room-1', name: 'Room 101', type: 'CLASSROOM', capacity: 60 },
        { id: 'room-2', name: 'Room 202', type: 'CLASSROOM', capacity: 40 },
      ],
    },
    section: {
      findUnique: async () => ({ _count: { users: 30 } }),
    },
    $transaction: async (fn) => fn(createDeps(overrides) as unknown as SubstitutionDependencies),
    ...overrides,
  };
};

describe('GET /api/v1/absences/:id/suggestions', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    app = Fastify();
    registerSubstitutionRoutes(app, createDeps());
  });

  it('returns suggestions for each slot', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/absences/abs-1/suggestions',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { slotId: string; period: number; suggestions: SubstituteSuggestion[] }[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({ slotId: 'slot-1', period: 2 });
  });

  it('returns 404 for unknown absence', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/absences/unknown/suggestions',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
    });

    expect(res.statusCode).toBe(404);
  });

  it('requires admin role', async () => {
    const studentToken = jwt.sign({ role: 'STUDENT', sectionId: 'sec-1' }, SECRET, {
      subject: 'stu-1',
      expiresIn: '1h',
    });

    const app2 = Fastify();
    registerSubstitutionRoutes(app2, {
      ...createDeps(),
      user: {
        findUnique: async ({ where }) => {
          const id = 'id' in where ? where.id : undefined;
          if (id === 'stu-1') return { id: 'stu-1', name: 'Stu', email: 'stu@test.com', role: 'STUDENT', department: 'CSE', sectionId: 'sec-1', passwordHash: 'x' };
          return null;
        },
        findMany: async () => [],
      },
    });

    const res = await app2.inject({
      method: 'GET',
      url: '/api/v1/absences/abs-1/suggestions',
      headers: { authorization: `Bearer ${studentToken}` },
    });

    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/v1/absences/:id/confirm', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = Fastify();
    registerSubstitutionRoutes(app, createDeps());
  });

  it('confirms substitutions and emits events', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences/abs-1/confirm',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
      payload: {
        assignments: [
          { period: 2, substituteFacultyId: 'fac-2', roomId: 'room-1' },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ substitutions: 1, absenceId: 'abs-1' });
    expect(emitToRoom).toHaveBeenCalledWith('admin', 'timetable:changed', expect.any(Object));
    expect(emitToRoom).toHaveBeenCalledWith(expect.stringContaining('section:'), 'timetable:changed', expect.any(Object));
    expect(emitToRoom).toHaveBeenCalledWith('rooms', 'rooms:changed', expect.any(Object));
  });

  it('allows null substitute to cancel a class', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences/abs-1/confirm',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
      payload: {
        assignments: [
          { period: 2, substituteFacultyId: null, roomId: 'room-1' },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
  });

  it('returns 404 for unknown absence', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences/unknown/confirm',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
      payload: { assignments: [{ period: 2, substituteFacultyId: 'fac-2', roomId: 'room-1' }] },
    });

    expect(res.statusCode).toBe(404);
  });

  it('returns 422 when period is not in absence', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/absences/abs-1/confirm',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
      payload: {
        assignments: [{ period: 5, substituteFacultyId: 'fac-2', roomId: 'room-1' }],
      },
    });

    expect(res.statusCode).toBe(422);
  });

  it('detects race: substitute already has a slot conflict (throws 409)', async () => {
    const conflictDeps = createDeps({
      slot: {
        findMany: async ({ where }) => {
          const w = where as { facultyId?: string; weekday?: number; period?: { in: number[] } };
          // The absent faculty's slots (for route pre-flight)
          if (w.facultyId === 'fac-1') {
            return [{
              id: 'slot-1', sectionId: 'sec-1', subjectId: 'subj-1',
              facultyId: 'fac-1', roomId: 'room-1', weekday: 3, period: 2,
            }];
          }
          // Inside tx: fac-2 also has a slot at period 2
          if (w.facultyId === 'fac-2') {
            return [{
              id: 'slot-conflict', sectionId: 'sec-2', subjectId: 'subj-2',
              facultyId: 'fac-2', roomId: 'room-2', weekday: 3, period: 2,
            }];
          }
          return [];
        },
      },
    });

    const app2 = Fastify();
    registerSubstitutionRoutes(app2, conflictDeps);

    const res = await app2.inject({
      method: 'POST',
      url: '/api/v1/absences/abs-1/confirm',
      headers: { authorization: `Bearer ${makeAdminToken()}` },
      payload: {
        assignments: [{ period: 2, substituteFacultyId: 'fac-2', roomId: 'room-1' }],
      },
    });

    // The conflict error thrown inside $transaction should propagate as a 409
    expect(res.statusCode).toBe(409); // transaction detected the conflict
  });
});

// ── Substitute ranking: week boundary tests ────────────────────────────────

describe('suggestSubstitutes – week boundaries', () => {
  it('gives all candidates 0 count when none have substituted this week', () => {
    const faculty: FacultyInfo[] = [makeFaculty('f1', 'Alice'), makeFaculty('f2', 'Bob')];
    const result = suggestSubstitutes({
      sectionSize: 30,
      slot: makeSlot(),
      departmentFaculty: faculty,
      absentFacultyIds: new Set(['fac-absent']),
      alreadySubstitutingIds: new Set(),
      busyFacultyIds: new Set(),
      substitutionCountsThisWeek: new Map(), // empty
      freeRooms: [makeRoom()],
      absentFacultyId: 'fac-absent',
    });

    // Both have 0 – alphabetical tie-break
    expect(result[0]?.substitute.id).toBe('f1'); // Alice
    expect(result[0]?.substitutionsThisWeek).toBe(0);
    expect(result[1]?.substitute.id).toBe('f2'); // Bob
  });
});
