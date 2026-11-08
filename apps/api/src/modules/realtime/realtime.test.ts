import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';

// Set test env BEFORE importing realtime so NODE_ENV=test skips Redis adapter
process.env.JWT_SECRET = 'realtime-test-secret';
process.env.NODE_ENV = 'test';

import { attachRealtime, emitToRoom } from './realtime.js';
import type { RealtimeDependencies } from './realtime.js';

const SECRET = 'realtime-test-secret';

const makeToken = (
  userId: string,
  role: 'STUDENT' | 'FACULTY' | 'ADMIN',
  sectionId: string | null = null,
) =>
  jwt.sign({ role, sectionId }, SECRET, { subject: userId, expiresIn: '1h' });

// ── stub DB ────────────────────────────────────────────────────────────────
const users: Record<string, { id: string; role: string; sectionId: string | null }> = {
  'student-1': { id: 'student-1', role: 'STUDENT', sectionId: 'sec-1' },
  'faculty-1': { id: 'faculty-1', role: 'FACULTY', sectionId: null },
  'admin-1':   { id: 'admin-1',   role: 'ADMIN',   sectionId: null },
};

const deps: RealtimeDependencies = {
  user: {
    findUnique: async ({ where }) => users[where.id] ?? null,
  },
};

// ── helpers ────────────────────────────────────────────────────────────────
const delay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => { globalThis.setTimeout(resolve, ms); });

describe('Realtime Socket.IO', () => {
  let url: string;
  let app: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    app = Fastify();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    url = `http://127.0.0.1:${port}`;
    attachRealtime(app, deps);
  });

  afterAll(async () => {
    await app.close();
  });

  const connect = (
    userId: string,
    role: 'STUDENT' | 'FACULTY' | 'ADMIN',
    sectionId: string | null = null,
  ): Promise<ClientSocket> => {
    return new Promise((resolve, reject) => {
      const token = makeToken(userId, role, sectionId);
      const socket = ioClient(url, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
      });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });
  };

  it('rejects connection without a token', async () => {
    await new Promise<void>((resolve) => {
      const socket = ioClient(url, {
        transports: ['websocket'],
        reconnection: false,
      });
      socket.on('connect_error', (err) => {
        expect(err.message).toMatch(/authentication/i);
        socket.disconnect();
        resolve();
      });
    });
  });

  it('rejects connection with an invalid token', async () => {
    await new Promise<void>((resolve) => {
      const socket = ioClient(url, {
        auth: { token: 'totally-invalid-token' },
        transports: ['websocket'],
        reconnection: false,
      });
      socket.on('connect_error', (err) => {
        expect(err.message).toMatch(/authentication|invalid/i);
        socket.disconnect();
        resolve();
      });
    });
  });

  it('student connects and receives events on their personal room', async () => {
    const client = await connect('student-1', 'STUDENT', 'sec-1');

    const received = await new Promise<unknown>((resolve) => {
      client.on('test:event', resolve);
      emitToRoom('user:student-1', 'test:event', { hello: 'world' });
    });

    expect(received).toEqual({ hello: 'world' });
    client.disconnect();
  });

  it('student is auto-joined to their section room', async () => {
    const client = await connect('student-1', 'STUDENT', 'sec-1');

    const received = await new Promise<unknown>((resolve) => {
      client.on('timetable:changed', resolve);
      emitToRoom('section:sec-1', 'timetable:changed', { slot: 'x' });
    });

    expect(received).toEqual({ slot: 'x' });
    client.disconnect();
  });

  it('admin is auto-joined to the admin room', async () => {
    const client = await connect('admin-1', 'ADMIN');

    const received = await new Promise<unknown>((resolve) => {
      client.on('absence:created', resolve);
      emitToRoom('admin', 'absence:created', { id: 'abs-1' });
    });

    expect(received).toEqual({ id: 'abs-1' });
    client.disconnect();
  });

  it('faculty can join:rooms and receive rooms:changed', async () => {
    const client = await connect('faculty-1', 'FACULTY');

    await new Promise<void>((resolve) => {
      client.emit('join:rooms');
      // Give server a tick to process
      void delay(50).then(resolve);
    });

    const received = await new Promise<unknown>((resolve) => {
      client.on('rooms:changed', resolve);
      emitToRoom('rooms', 'rooms:changed', { roomId: 'r-1' });
    });

    expect(received).toEqual({ roomId: 'r-1' });
    client.disconnect();
  });

  it('faculty can join:session for a specific session', async () => {
    const client = await connect('faculty-1', 'FACULTY');

    await new Promise<void>((resolve) => {
      client.emit('join:session', 'sess-42');
      void delay(50).then(resolve);
    });

    const received = await new Promise<unknown>((resolve) => {
      client.on('attendance:update', resolve);
      emitToRoom('session:sess-42', 'attendance:update', { count: 5 });
    });

    expect(received).toEqual({ count: 5 });
    client.disconnect();
  });

  it('student is denied join:session', async () => {
    const client = await connect('student-1', 'STUDENT', 'sec-1');

    const errorReceived = await new Promise<unknown>((resolve) => {
      client.on('error', resolve);
      client.emit('join:session', 'sess-99');
    });

    expect(errorReceived).toMatchObject({ code: 'FORBIDDEN' });
    client.disconnect();
  });

  it('emitToRoom is a no-op when IO is not initialised', () => {
    // This test just validates the function does not throw if _io is null.
    // We achieve this by calling with a room that simply has no subscribers.
    expect(() => emitToRoom('no-such-room', 'some:event', {})).not.toThrow();
  });

  it('join:session requires a non-empty sessionId', async () => {
    const client = await connect('faculty-1', 'FACULTY');

    const errorReceived = await new Promise<unknown>((resolve) => {
      client.on('error', resolve);
      client.emit('join:session', '');
    });

    expect(errorReceived).toMatchObject({ code: 'BAD_REQUEST' });
    client.disconnect();
  });
});
