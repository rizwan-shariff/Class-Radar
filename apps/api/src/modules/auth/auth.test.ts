import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(async (password: string, passwordHash: string) =>
      password === 'correct-password' && passwordHash === 'hashed-password',
    ),
  },
}));

import {
  authPreHandler,
  registerAuthRoutes,
  requireRole,
  type AuthDependencies,
} from './auth';

const user = {
  id: 'user-1',
  name: 'Ada Student',
  email: 'ada@example.com',
  role: 'STUDENT' as const,
  department: 'CSE',
  sectionId: 'section-1',
  passwordHash: '',
};

const createDependencies = (): AuthDependencies => ({
  user: {
    findUnique: async ({ where }) => {
      if ('email' in where && where.email === user.email) return user;
      if ('id' in where && where.id === user.id) return user;
      return null;
    },
  },
});

describe('auth routes', () => {
  beforeEach(async () => {
    user.passwordHash = 'hashed-password';
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns 401 for invalid credentials', async () => {
    const app = Fastify();
    registerAuthRoutes(app, createDependencies());

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: user.email, password: 'wrong-password' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
    });
  });

  it('returns 401 for missing authentication', async () => {
    const app = Fastify();
    registerAuthRoutes(app, createDependencies());

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 when a valid user has the wrong role', async () => {
    const app = Fastify();
    app.addHook('preHandler', authPreHandler(createDependencies()));
    app.get('/admin-only', { preHandler: requireRole('ADMIN') }, async () => ({ ok: true }));
    const token = jwt.sign(
      { role: user.role, sectionId: user.sectionId },
      process.env.JWT_SECRET!,
      { subject: user.id, expiresIn: '8h' },
    );

    const response = await app.inject({
      method: 'GET',
      url: '/admin-only',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
    });
  });
});
