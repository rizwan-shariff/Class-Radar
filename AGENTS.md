# Rules for AI coding agents on ClassRadar
- Read SPEC.md and openapi.yaml before writing any code.
- You are working for one human teammate. Edit only the folders named in
their assignment.
- Stack: TypeScript everywhere. Next.js 14 (App Router) + Tailwind + TanStack
Query on the web; Node 20 + Fastify + Zod on the API; PostgreSQL via Prisma;
Redis; Socket.IO; Vitest + Supertest.
- Before coding, post a short plan (files to create, endpoints, tests). Wait
for the human to approve it.
- Work in small steps. After each step run `pnpm lint && pnpm test` and fix
failures before continuing.
- Every request body and query is validated with Zod. Errors are returned as
{ error: { code, message } } with the correct HTTP status.
- Timestamps are ISO 8601 UTC. Periods are integers 1 to 8. Weekdays are 1
(Monday) to 6 (Saturday).
- Enforce roles on the server with the shared auth middleware. Never trust
the client.
- Never invent an endpoint or change the database schema. If the contract is
missing something, stop and tell the human to open a PR changing openapi.yaml
or schema.prisma.
- Write tests together with each feature. Business rules (clash detection,
substitution ranking, token verification, bunk calculator) must have unit
tests.
- Do not add a dependency without saying why. Never commit secrets or .env.
- Keep functions small, name things after the domain (Slot, Section,
Session), and add short comments only where the logic is non-obvious.