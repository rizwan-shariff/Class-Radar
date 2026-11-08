import Fastify, { type FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

import {
  registerAuthRoutes,
  type AuthDependencies,
} from './modules/auth/auth.js';
import { attachRealtime } from './modules/realtime/realtime.js';
import { registerAbsenceRoutes } from './modules/absence/absence.js';
import { registerSubstitutionRoutes } from './modules/substitution/substitution.js';
import { registerBookingRoutes } from './modules/booking/booking.js';
import { registerAnalyticsRoutes } from './modules/analytics/analytics.js';

export const prisma = new PrismaClient();

/** Prisma-backed dependency object for modules that share the same DB client. */
const makePrismaDeps = (db: PrismaClient) => ({
  user: db.user,
  slot: db.slot,
  absence: db.absence,
  substitution: db.substitution,
  roomBooking: db.roomBooking,
  room: db.room,
  section: db.section,
  attendanceRecord: db.attendanceRecord,
  $transaction: db.$transaction.bind(db),
});

export const buildServer = (
  dependencies: AuthDependencies = prisma,
): FastifyInstance => {
  const app = Fastify({ logger: true });

  // Register route modules
  registerAuthRoutes(app, dependencies);
  registerAbsenceRoutes(app, makePrismaDeps(prisma) as any);
  registerSubstitutionRoutes(app, makePrismaDeps(prisma) as any);
  registerBookingRoutes(app, makePrismaDeps(prisma) as any);
  registerAnalyticsRoutes(app, makePrismaDeps(prisma) as any);

  return app;
};

export const startServer = async (): Promise<void> => {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await app.listen({ port, host });
    // Attach Socket.IO after server is listening
    attachRealtime(app, prisma);
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
