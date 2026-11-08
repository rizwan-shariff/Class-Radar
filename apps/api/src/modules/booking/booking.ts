import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authPreHandler, requireRole } from '../auth/auth.js';
import type { AuthDependencies } from '../auth/auth.js';
import { emitToRoom } from '../realtime/realtime.js';
import { isRoomFree } from '../rooms/rooms.js';

// ── Zod schemas ────────────────────────────────────────────────────────────

const createBookingBodySchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  period: z.number().int().min(1).max(8),
  purpose: z.string().min(1).max(500),
});

// ── Dependency types ───────────────────────────────────────────────────────

export type BookingDependencies = AuthDependencies & {
  room: {
    findUnique(args: { where: { id: string } }): Promise<{
      id: string;
      name: string;
      type: string;
      capacity: number;
    } | null>;
  };
  slot: {
    findFirst(args: {
      where: { roomId: string; weekday: number; period: number };
    }): Promise<{ id: string } | null>;
  };
  substitution: {
    findFirst(args: {
      where: {
        roomId: string;
        date: Date;
        status: 'CONFIRMED';
        slot: { weekday: number; period: number };
      };
    }): Promise<{ id: string } | null>;
  };
  roomBooking: {
    findUnique(args: {
      where: { roomId_date_period: { roomId: string; date: Date; period: number } };
    }): Promise<{ id: string } | null>;
    create(args: {
      data: {
        roomId: string;
        date: Date;
        period: number;
        bookedById: string;
        purpose: string;
      };
    }): Promise<{
      id: string;
      roomId: string;
      date: Date;
      period: number;
      bookedById: string;
      purpose: string;
    }>;
    findFirst(args: {
      where: { id: string; bookedById?: string };
    }): Promise<{
      id: string;
      roomId: string;
      date: Date;
      period: number;
      bookedById: string;
      purpose: string;
    } | null>;
    delete(args: { where: { id: string } }): Promise<void>;
  };
};

// ── Route registration ─────────────────────────────────────────────────────

export const registerBookingRoutes = (
  app: FastifyInstance,
  deps: BookingDependencies,
): void => {
  const preHandler = authPreHandler(deps);

  /**
   * POST /api/v1/bookings
   * Faculty or Admin only. Checks the room is free using the isRoomFree logic
   * (no timetable slot that period, no existing booking).
   */
  app.post(
    '/api/v1/bookings',
    { preHandler: [preHandler, requireRole('FACULTY', 'ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createBookingBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: { code: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid body' },
        });
      }

      const actor = request.authUser!;
      const { roomId, date, period, purpose } = parsed.data;

      // Validate room exists
      const room = await deps.room.findUnique({ where: { id: roomId } });
      if (!room) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Room not found' } });
      }

      const bookingDate = new Date(`${date}T00:00:00.000Z`);
      const jsDay = bookingDate.getUTCDay();
      if (jsDay === 0) {
        return reply.code(422).send({
          error: { code: 'INVALID_DATE', message: 'Cannot book a room on Sunday' },
        });
      }
      if (!(await isRoomFree(roomId, bookingDate, period, deps))) {
        return reply.code(409).send({
          error: { code: 'ROOM_NOT_FREE', message: 'Room is not available for this period' },
        });
      }

      const booking = await deps.roomBooking.create({
        data: {
          roomId,
          date: bookingDate,
          period,
          bookedById: actor.id,
          purpose,
        },
      });

      emitToRoom('rooms', 'rooms:changed', {
        event: 'booking:created',
        booking: {
          id: booking.id,
          roomId: booking.roomId,
          date: booking.date.toISOString().slice(0, 10),
          period: booking.period,
        },
      });

      return reply.code(201).send({
        id: booking.id,
        roomId: booking.roomId,
        date: booking.date.toISOString().slice(0, 10),
        period: booking.period,
        bookedById: booking.bookedById,
        purpose: booking.purpose,
      });
    },
  );

  /**
   * DELETE /api/v1/bookings/:id
   * Faculty can delete their own bookings; Admin can delete any.
   */
  app.delete(
    '/api/v1/bookings/:id',
    { preHandler: [preHandler, requireRole('FACULTY', 'ADMIN')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const actor = request.authUser!;

      const booking = await deps.roomBooking.findFirst({
        where: { id },
      });

      if (!booking) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
      }

      // Faculty can only delete their own bookings
      if (actor.role === 'FACULTY' && booking.bookedById !== actor.id) {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'You can only delete your own bookings' },
        });
      }

      await deps.roomBooking.delete({ where: { id } });

      emitToRoom('rooms', 'rooms:changed', {
        event: 'booking:deleted',
        bookingId: id,
      });

      return reply.code(204).send();
    },
  );
};
