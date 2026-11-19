import Fastify, { type FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production');
}
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_classradar_2026';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://test:test@localhost:5432/classradar_test?schema=public';

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
import { registerAttendanceRoutes } from './modules/attendance/attendance.js';
import { registerCommunityRoutes } from './modules/community/community.js';

const databaseUrl = process.env.DATABASE_URL;
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

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
  attendanceSession: db.attendanceSession,
  subject: db.subject,
  $transaction: db.$transaction.bind(db),
});

export const buildServer = (
  dependencies: AuthDependencies = prisma as unknown as AuthDependencies,
): FastifyInstance => {
  const app = Fastify({ logger: true });
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : true;
  void app.register(cors, { origin: corsOrigin });
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
  registerAttendanceRoutes(app, moduleDependencies as any);
  registerCommunityRoutes(app, prisma as any);

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
