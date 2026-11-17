import Fastify, { type FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

import {
  registerAuthRoutes,
  type AuthDependencies,
} from './modules/auth/auth.js';
import { attachRealtime } from './modules/realtime/realtime.js';
import { registerAbsenceRoutes } from './modules/absence/absence.js';
import { registerSubstitutionRoutes } from './modules/substitution/substitution.js';
import { registerBookingRoutes } from './modules/booking/booking.js';
import { registerAnalyticsRoutes } from './modules/analytics/analytics.js';
import type { AbsenceDependencies } from './modules/absence/absence.js';
import type { SubstitutionDependencies } from './modules/substitution/substitution.js';
import type { BookingDependencies } from './modules/booking/booking.js';
import type { AnalyticsDependencies } from './modules/analytics/analytics.js';
import { registerTimetableRoutes } from './modules/timetable/timetable.js';
import type { TimetableDependencies } from './modules/timetable/timetable.js';
import { registerRoomRoutes } from './modules/rooms/rooms.js';
import type { RoomDependencies } from './modules/rooms/rooms.js';

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
  subject: db.subject,
  $transaction: db.$transaction.bind(db),
});

export const buildServer = (
  dependencies: AuthDependencies = prisma,
): FastifyInstance => {
  const app = Fastify({ logger: true });
  void app.register(cors, { origin: true });
  void app.register(multipart);
  void app.register(rateLimit, { global: false });

  // Register route modules
  registerAuthRoutes(app, dependencies);
  const moduleDependencies = makePrismaDeps(prisma);
  registerAbsenceRoutes(app, moduleDependencies as unknown as AbsenceDependencies);
  registerSubstitutionRoutes(app, moduleDependencies as unknown as SubstitutionDependencies);
  registerBookingRoutes(app, moduleDependencies as unknown as BookingDependencies);
  registerAnalyticsRoutes(app, moduleDependencies as unknown as AnalyticsDependencies);
  registerTimetableRoutes(app, moduleDependencies as unknown as TimetableDependencies);
  registerRoomRoutes(app, moduleDependencies as unknown as RoomDependencies);

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
