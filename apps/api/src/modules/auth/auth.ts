import bcrypt from 'bcrypt';
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from 'fastify';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export type AuthRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  department: string | null;
  sectionId: string | null;
};

type UserRecord = AuthUser & {
  passwordHash: string;
};

export type AuthDependencies = {
  user: {
    findUnique(args: {
      where: { email: string } | { id: string };
    }): Promise<UserRecord | null>;
  };
};

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const authClaimsSchema = z.object({
  sub: z.string(),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  sectionId: z.string().nullable(),
  exp: z.number(),
});

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

const unauthorized = (reply: FastifyReply, message = 'Authentication required') =>
  reply.code(401).send({ error: { code: 'UNAUTHORIZED', message } });

export const getCurrentUser = async (
  request: FastifyRequest,
  dependencies: AuthDependencies,
): Promise<AuthUser> => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authorization.slice('Bearer '.length);
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === 'string') {
    throw new Error('Invalid token');
  }

  const claims = authClaimsSchema.parse(decoded);
  const user = await dependencies.user.findUnique({
    where: { id: claims.sub },
  });
  if (!user || user.role !== claims.role || user.sectionId !== claims.sectionId) {
    throw new Error('Invalid token');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    sectionId: user.sectionId,
  };
};

export const authPreHandler = (
  dependencies: AuthDependencies,
): preHandlerHookHandler => async (request, reply) => {
  try {
    request.authUser = await getCurrentUser(request, dependencies);
  } catch {
    return unauthorized(reply, 'Invalid or missing token');
  }
};

export const requireRole = (
  ...roles: AuthRole[]
): preHandlerHookHandler => async (request, reply) => {
  if (!request.authUser) {
    return unauthorized(reply);
  }
  if (!roles.includes(request.authUser.role)) {
    return reply.code(403).send({
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
    });
  }
};

export const registerAuthRoutes = (
  app: Pick<FastifyInstance, 'post' | 'get'>,
  dependencies: AuthDependencies,
): void => {
  app.post('/api/v1/auth/login', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
    }

    const user = await dependencies.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return reply.code(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
    }

    const token = jwt.sign(
      { role: user.role, sectionId: user.sectionId },
      getJwtSecret(),
      { subject: user.id, expiresIn: '8h' },
    );
    return reply.send({ token });
  });

  app.get(
    '/api/v1/auth/me',
    { preHandler: authPreHandler(dependencies) },
    async (request: FastifyRequest, reply: FastifyReply) => reply.send(request.authUser),
  );
};
