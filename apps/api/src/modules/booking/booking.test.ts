import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../realtime/realtime.js', () => ({
  emitToRoom: vi.fn(),
}));

import { emitToRoom } from '../realtime/realtime.js';
import { registerBookingRoutes, type BookingDependencies } from './booking.js';

process.env.JWT_SECRET = 'booking-test-secret';
const SECRET = 'booking-test-secret';

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
  name: 'Admin',
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

const makeToken = (user: typeof faculty | typeof admin | typeof student) =>
  jwt.sign({ role: user.role, sectionId: user.sectionId }, SECRET, {
    subject: user.id,
    expiresIn: '1h',
  });

/** Wednesday 2026-11-11 */
const WED = '2026-11-11';
/** Sunday 2026-11-08 */
const SUN = '2026-11-08';

type Booking = {
  id: string;
  roomId: string;
  date: Date;
  period: number;
  bookedById: string;
  purpose: string;
};

const createDeps = (overrides: Partial<BookingDependencies> = {}): BookingDependencies => {
  const bookings: Booking[] = [];

  return {
    user: {
      findUnique: async ({ where }) => {
        const id = 'id' in where ? where.id : undefined;
        if (id === faculty.id) return faculty;
        if (id === admin.id) return admin;
        if (id === student.id) return student;
        return null;
      },
    },
    room: {
      findUnique: async ({ where }) => {
        if (where.id === 'room-1') {
          return { id: 'room-1', name: 'Room 101', type: 'CLASSROOM', capacity: 60 };
        }
        return null;
      },
    },
    slot: {
      findFirst: async () => null, // No slot conflict by default
    },
    substitution: {
      findFirst: async () => null,
    },
    roomBooking: {
      findUnique: async ({ where }) => {
        const { roomId, date, period } = where.roomId_date_period;
        return bookings.find(
          (b) => b.roomId === roomId && b.date.getTime() === date.getTime() && b.period === period,
        ) ?? null;
      },
      create: async ({ data }) => {
        const booking: Booking = {
          id: `booking-${bookings.length + 1}`,
          roomId: data.roomId,
          date: data.date,
          period: data.period,
          bookedById: data.bookedById,
          purpose: data.purpose,
        };
        bookings.push(booking);
        return booking;
      },
      findFirst: async ({ where }) => {
        return bookings.find((b) => b.id === where.id) ?? null;
      },
      delete: async ({ where }) => {
        const idx = bookings.findIndex((b) => b.id === where.id);
        if (idx >= 0) bookings.splice(idx, 1);
      },
    },
    ...overrides,
  };
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/bookings', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = Fastify();
    registerBookingRoutes(app, createDeps());
  });

  it('faculty creates a booking for a free room', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: 'room-1', date: WED, period: 3, purpose: 'Office hours' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ roomId: 'room-1', period: 3 });
    expect(emitToRoom).toHaveBeenCalledWith('rooms', 'rooms:changed', expect.any(Object));
  });

  it('admin creates a booking', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(admin)}` },
      payload: { roomId: 'room-1', date: WED, period: 4, purpose: 'Meeting' },
    });

    expect(res.statusCode).toBe(201);
  });

  it('returns 409 when room has a timetable slot conflict', async () => {
    const app2 = Fastify();
    registerBookingRoutes(
      app2,
      createDeps({
        slot: { findFirst: async () => ({ id: 'slot-conflict' }) },
      }),
    );

    const res = await app2.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: 'room-1', date: WED, period: 3, purpose: 'Extra class' },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('ROOM_NOT_FREE');
  });

  it('returns 409 when room already booked', async () => {
    // Create a booking first
    const deps = createDeps();
    const app2 = Fastify();
    registerBookingRoutes(app2, deps);

    await app2.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: 'room-1', date: WED, period: 3, purpose: 'First booking' },
    });

    const res = await app2.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: 'room-1', date: WED, period: 3, purpose: 'Second booking' },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('ROOM_NOT_FREE');
  });

  it('returns 404 for unknown room', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: '00000000-0000-0000-0000-000000000000', date: WED, period: 3, purpose: 'x' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('returns 422 for Sunday', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: 'room-1', date: SUN, period: 3, purpose: 'Extra' },
    });

    expect(res.statusCode).toBe(422);
  });

  it('returns 403 for students', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(student)}` },
      payload: { roomId: 'room-1', date: WED, period: 3, purpose: 'x' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('validates request body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: 'not-a-uuid', period: 99 }, // missing fields, invalid values
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/v1/bookings/:id', () => {
  it('faculty deletes their own booking', async () => {
    const deps = createDeps();
    const app = Fastify();
    registerBookingRoutes(app, deps);

    // Create booking first
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: 'room-1', date: WED, period: 5, purpose: 'Study' },
    });
    const { id } = createRes.json() as { id: string };

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/bookings/${id}`,
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
    });

    expect(deleteRes.statusCode).toBe(204);
    expect(emitToRoom).toHaveBeenCalledWith('rooms', 'rooms:changed', expect.objectContaining({ event: 'booking:deleted' }));
  });

  it('faculty cannot delete another faculty booking', async () => {
    const deps = createDeps();
    const app = Fastify();
    registerBookingRoutes(app, deps);

    // Admin creates booking as fac-other
    // We simulate: booking exists but bookedById !== faculty.id
    const bookingId = 'booking-external';
    deps.roomBooking.findFirst = async ({ where }) => {
      if (where.id === bookingId) {
        return {
          id: bookingId,
          roomId: 'room-1',
          date: new Date(WED),
          period: 1,
          bookedById: 'fac-other', // different owner
          purpose: 'Other',
        };
      }
      return null;
    };

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/bookings/${bookingId}`,
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('admin can delete any booking', async () => {
    const deps = createDeps();
    const app = Fastify();
    registerBookingRoutes(app, deps);

    // Faculty creates it
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
      payload: { roomId: 'room-1', date: WED, period: 6, purpose: 'Study' },
    });
    const { id } = createRes.json() as { id: string };

    // Admin deletes it
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/bookings/${id}`,
      headers: { authorization: `Bearer ${makeToken(admin)}` },
    });

    expect(deleteRes.statusCode).toBe(204);
  });

  it('returns 404 for unknown booking', async () => {
    const app = Fastify();
    registerBookingRoutes(app, createDeps());

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/bookings/no-such-id',
      headers: { authorization: `Bearer ${makeToken(faculty)}` },
    });

    expect(res.statusCode).toBe(404);
  });
});
