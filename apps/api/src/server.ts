import Fastify, { type FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

import {
  registerAuthRoutes,
  type AuthDependencies,
} from './modules/auth/auth.js';

export const prisma = new PrismaClient();

export const buildServer = (
  dependencies: AuthDependencies = prisma,
): FastifyInstance => {
  const app = Fastify({ logger: true });
  registerAuthRoutes(app, dependencies);
  return app;
};

export const startServer = async (): Promise<void> => {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    await prisma.$disconnect();
    throw error;
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}
