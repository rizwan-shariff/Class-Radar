import type { AuthUser } from './auth';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}
