# ClassRadar Docker Infrastructure

This directory houses the containerization configurations for ClassRadar.

## Architecture

| Service | Container Name | Image / Base | Internal Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | `classradar-postgres` | `postgres:16-alpine` | `5432` | `5432` | Primary relational store for timetable and attendance records |
| **Redis** | `classradar-redis` | `redis:7-alpine` | `6379` | `6379` | Nonce store for 10-second rotating QR tokens and Socket.IO adapter |
| **Backend API** | `classradar-backend` | Multi-stage Node 20 | `3000` | `3000` | Fastify backend server with Prisma ORM and Socket.IO engine |
| **Frontend App** | `classradar-frontend` | Multi-stage Node 20 | `3001` | `3001` | Next.js 14 App Router optimized static & SSR production build |

## File Layout

- `Dockerfile.backend`: Optimized multi-stage build running Prisma generation and Fastify server.
- `Dockerfile.frontend`: Multi-stage Next.js production build running under an unprivileged `nextjs` system user.
- `docker-compose.yml`: Complete 4-service composition with network isolation, healthchecks, and persistent volume definitions.
- `.env.example`: Reference environment configuration for container deployments.
- `.dockerignore`: Exclusion rules preventing heavy build artifacts and cache folders from entering the Docker context.

## Usage

### 1. Launch All Services (Detached)
From the repository root or the `docker/` folder:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### 2. View Service Logs
```bash
docker compose -f docker/docker-compose.yml logs -f
```

### 3. Stop All Containers
```bash
docker compose -f docker/docker-compose.yml down
```

### 4. Database Migrations & Seeding inside Container
```bash
docker compose -f docker/docker-compose.yml exec backend npx prisma migrate deploy
docker compose -f docker/docker-compose.yml exec backend npx prisma db seed
```

