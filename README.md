# ClassRadar 📡

Institutional Academic Copilot, Timetable Radar, and Real-Time Smart Attendance Platform for NIE North Campus.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shaikzayanahmed/Class_Radar_Minor_Project)

---

## 🚀 100% Full-Stack Deployment on Render

ClassRadar is fully configured to run entirely on **Render** (Frontend + Backend + PostgreSQL Database) with zero external cloud dependencies.

Click the **Deploy to Render** button above or use **New + Blueprint** in Render:
- **`classradar-postgres`**: Managed PostgreSQL Database.
- **`classradar-api`**: Fastify Backend API + Socket.IO real-time WebSocket server with automatic Prisma migrations on deploy.
- **`classradar-web`**: Next.js 16 Web Application with NVIDIA NIM Voice AI chatbot.

### Environment Setup on Render
When Render launches the blueprint, simply enter your `NVIDIA_API_KEY` (from [build.nvidia.com](https://build.nvidia.com)). The database connections and API/WebSocket URLs between services are automatically linked!
