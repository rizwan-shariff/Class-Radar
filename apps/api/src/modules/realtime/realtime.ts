import type { FastifyInstance } from 'fastify';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export type RealtimeDependencies = {
  user: {
    findUnique(args: { where: { id: string } }): Promise<{
      id: string;
      role: string;
      sectionId: string | null;
    } | null>;
  };
};

/** Singleton IO instance – exported so other modules can emit. */
let _io: SocketIOServer | null = null;

const authClaimsSchema = z.object({
  sub: z.string(),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  sectionId: z.string().nullable(),
});

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
};

/**
 * Emit an event to a named Socket.IO room.
 * No-ops gracefully when realtime has not been initialised (e.g. in unit tests
 * that don't boot Socket.IO).
 */
export const emitToRoom = (
  room: string,
  event: string,
  payload: unknown,
): void => {
  _io?.to(room).emit(event, payload);
};

/**
 * Attach Socket.IO to the Fastify server.
 * Must be called after `app.listen()` or on the raw http.Server.
 */
export const attachRealtime = (
  app: FastifyInstance,
  deps: RealtimeDependencies,
  redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379',
): SocketIOServer => {
  const io = new SocketIOServer(app.server, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  });

  // Redis pub/sub adapter for horizontal scaling
  if (process.env.NODE_ENV !== 'test') {
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient as never, subClient as never));
  }

  // ── JWT Authentication middleware ──────────────────────────────────────────
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.auth as { token?: string }).token ??
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, getJwtSecret());
      if (typeof decoded === 'string') {
        return next(new Error('Invalid token'));
      }

      const claims = authClaimsSchema.parse(decoded);
      const user = await deps.user.findUnique({ where: { id: claims.sub } });

      if (!user || user.role !== claims.role) {
        return next(new Error('Invalid token'));
      }

      // Attach user context to socket data
      socket.data.userId = user.id;
      socket.data.role = user.role;
      socket.data.sectionId = user.sectionId;

      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const { userId, role, sectionId } = socket.data as {
      userId: string;
      role: string;
      sectionId: string | null;
    };

    // Every user joins their personal room
    void socket.join(`user:${userId}`);

    // Students auto-join their section room
    if (role === 'STUDENT' && sectionId) {
      void socket.join(`section:${sectionId}`);
    }

    // Admins auto-join the admin room
    if (role === 'ADMIN') {
      void socket.join('admin');
    }

    // Faculty: join:rooms – subscribe to room availability updates
    socket.on('join:rooms', () => {
      void socket.join('rooms');
    });

    // Faculty only: join:session – subscribe to a specific attendance session
    socket.on('join:session', (sessionId: string) => {
      if (role !== 'FACULTY' && role !== 'ADMIN') {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Faculty only' });
        return;
      }
      if (typeof sessionId !== 'string' || !sessionId) {
        socket.emit('error', { code: 'BAD_REQUEST', message: 'sessionId required' });
        return;
      }
      void socket.join(`session:${sessionId}`);
    });
  });

  _io = io;
  return io;
};
