# Deploying ClassRadar

## Render backend and PostgreSQL

1. Create a new Render Blueprint from this repository.
2. Render will create `classradar-api` and `classradar-postgres`.
3. Set `CORS_ORIGIN` to the exact Vercel frontend URL, for example `https://classradar.vercel.app`.
4. Set `REDIS_URL` to a managed Redis connection string. Redis is optional for local development, but production deployments should use it for Socket.IO and rotating QR nonce support.
5. Deploy the Blueprint. Render runs the Prisma migration before starting the API.
6. Open a Render Shell for `classradar-api` and run `pnpm prisma:seed` once to load the real CSE-3F CSV data.

## Vercel frontend

1. Import the repository into Vercel.
2. Set the root directory to `frontend`.
3. Configure these environment variables:
   - `NEXT_PUBLIC_API_URL=https://<render-api-host>/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL=https://<render-api-host>`
4. Redeploy the frontend.

Do not use Docker or container startup commands for this deployment path.

## Manual production setup

Provision PostgreSQL and set `DATABASE_URL` to its connection string.

```bash
cd backend
pnpm install --frozen-lockfile
pnpm prisma:migrate:deploy
pnpm prisma:seed
pnpm build
pnpm start
```

Set `JWT_SECRET` to a cryptographically strong secret, `CORS_ORIGIN` to the frontend origin, `REDIS_URL` to Redis, and `ATTENDANCE_THRESHOLD=75`.
