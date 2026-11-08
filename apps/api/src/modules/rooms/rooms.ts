import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';

import { authPreHandler } from '../auth/auth.js';
import type { AuthDependencies } from '../auth/auth.js';

export type RoomAvailabilityDependencies = {
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
  };
};

export type RoomDependencies = AuthDependencies & RoomAvailabilityDependencies & {
  room: {
    findMany(args?: { where?: Record<string, unknown> }): Promise<RoomRecord[]>;
    findUnique(args: { where: { id: string } }): Promise<RoomRecord | null>;
  };
};

type RoomRecord = {
  id: string;
  name: string;
  type: string;
  capacity: number;
};

const freeRoomQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  period: z.coerce.number().int().min(1).max(8),
  type: z.enum(['CLASSROOM', 'LAB']).optional(),
  minCapacity: z.coerce.number().int().min(0).optional(),
});

const toUtcDate = (date: Date | string): Date =>
  date instanceof Date ? date : new Date(`${date}T00:00:00.000Z`);

const weekdayOf = (date: Date): number => {
  const weekday = date.getUTCDay();
  return weekday === 0 ? 7 : weekday;
};

export const isRoomFree = async (
  roomId: string,
  date: Date | string,
  period: number,
  dependencies: RoomAvailabilityDependencies,
): Promise<boolean> => {
  const effectiveDate = toUtcDate(date);
  const weekday = weekdayOf(effectiveDate);
  const [slot, substitution, booking] = await Promise.all([
    dependencies.slot.findFirst({ where: { roomId, weekday, period } }),
    dependencies.substitution.findFirst({
      where: {
        roomId,
        date: effectiveDate,
        status: 'CONFIRMED',
        slot: { weekday, period },
      },
    }),
    dependencies.roomBooking.findUnique({
      where: { roomId_date_period: { roomId, date: effectiveDate, period } },
    }),
  ]);
  return !slot && !substitution && !booking;
};

const invalidRequest = (reply: FastifyReply, message: string) =>
  reply.code(400).send({ error: { code: 'BAD_REQUEST', message } });

export const registerRoomRoutes = (
  app: FastifyInstance,
  dependencies: RoomDependencies,
): void => {
  const auth = authPreHandler(dependencies);

  app.get('/api/v1/rooms', { preHandler: auth }, async (_request, reply) => {
    return reply.send(await dependencies.room.findMany());
  });

  app.get('/api/v1/rooms/free', { preHandler: auth }, async (request, reply) => {
    const parsed = freeRoomQuerySchema.safeParse(request.query);
    if (!parsed.success) return invalidRequest(reply, parsed.error.issues[0]?.message ?? 'Invalid query');
    const date = toUtcDate(parsed.data.date);
    if (Number.isNaN(date.getTime()) || weekdayOf(date) === 7) {
      return invalidRequest(reply, 'date must be a valid Monday-Saturday date');
    }

    const rooms = await dependencies.room.findMany({
      where: {
        ...(parsed.data.type ? { type: parsed.data.type } : {}),
        ...(parsed.data.minCapacity !== undefined ? { capacity: { gte: parsed.data.minCapacity } } : {}),
      },
    });
    const freeRooms = [];
    for (const room of rooms) {
      if (await isRoomFree(room.id, date, parsed.data.period, dependencies)) freeRooms.push(room);
    }
    return reply.send(freeRooms);
  });
};
