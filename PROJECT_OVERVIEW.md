# ClassRadar — Project Overview & Architecture Guide

> **Live Academic Schedule, Automated Substitution Intelligence, Anti-Proxy Rotating QR Attendance & Campus Room Allocation Platform**

---

## 1. Executive Summary & Problem Statement

In most higher education institutions and colleges:
- Timetables are static, unwieldy PDF files shared over WhatsApp or printed on noticeboards.
- When faculty members are absent, students and departments find out late, resulting in wasted academic hours and disorderly class periods.
- Students and faculties never have clear visibility into which lecture halls, classrooms, or computer labs are free at any given period.
- Traditional paper attendance or static QR sheets are prone to proxy attendance, take up valuable class time, and students cannot easily calculate how close they are to the mandatory 75% attendance threshold until it is too late.

**ClassRadar** solves these problems by providing an installable, mobile-first Progressive Web App (PWA) with real-time timetable synchronization, algorithmic substitute suggestions, a free-room search engine, and anti-proxy rotating QR attendance tracking.

---

## 2. Core Personas & Features

### 🎓 1. Student Portal
- **Today's Timeline & Schedule:** Real-time view of daily lecture slots with dynamic badges for `SUBSTITUTED` faculty or `CANCELLED` periods.
- **Weekly Matrix:** Monday to Saturday 8-period comprehensive institutional timetable view.
- **Anti-Proxy QR Scanner:** Optical camera-based QR code scanner with multi-camera selection (environment/user) and manual token entry fallback.
- **Attendance & Bunk Calculator:** Subject-wise percentage radial meters with predictive calculations:
  - $\text{Can Skip} = \max\left(0, \left\lfloor\frac{4a}{3} - t\right\rfloor\right)$ (classes safe to skip while maintaining $\ge 75\%$).
  - $\text{Must Attend} = \max\left(0, \left\lceil 3t - 4a \right\rceil\right)$ (consecutive classes needed to recover from below $75\%$).
- **Free Room Finder:** Live room availability lookup filtered by date, period (1–8), and room type.

### 👨‍🏫 2. Faculty Portal
- **Teaching Schedule:** Overview of assigned lecture slots and substituted classes.
- **Mark Me Absent Drawer:** Quick leave declaration interface allowing faculty to select dates, multi-select unavailable periods (1–8), and submit with reason.
- **Rotating QR Attendance Session:**
  - Dynamic cryptographic SVG QR code rotating every 10–15 seconds.
  - Live SVG countdown timer and attendee counter (`Present / Total`).
  - Single-click session finalization that automatically marks remaining students absent.
- **Instant Room Booking:** On-demand reservation of vacant lecture halls or labs for extra classes or remedial sessions.

### 🛡️ 3. Admin & Academic Dean Operations Suite
- **Absences Inbox:** Real-time incoming queue of faculty leave declarations.
- **Algorithmic Substitution Matcher:** Automatically suggests clash-free substitute faculty from the same department (ranked by least substitutions assigned this week) and assigns free rooms matching section capacity.
- **Curriculum Slot Editor:** Interactive section/day/period timetable slot manager with instant clash prevention.
- **CSV Timetable Importer:** Drag-and-drop batch CSV schedule upload with atomic transaction validation (rejects files on any faculty, room, or section clash).
- **Academic Analytics Dashboard:** Real-time visualization of weekly room utilization loads (out of 48 periods), low-attendance watch lists ($<75\%$), and faculty substitution distribution.

---

## 3. Technology Stack & Monorepo Architecture

The project is structured as a **pnpm workspaces monorepo**:

```
Class-Radar/
├── apps/
│   ├── api/             # Backend Fastify API, Prisma ORM, Socket.IO & Redis
│   └── web/             # Frontend Next.js 14 (App Router), Tailwind CSS & PWA
├── templates/           # 17 Exported Google Stitch High-Fidelity Design Templates
├── openapi.yaml         # Single Source of Truth REST API Contract
├── SPEC.md              # Project Specifications & Feature Acceptance Criteria
├── DESIGN.md            # Sand & Titanium Liquid Glass UI Design System
├── package.json         # Monorepo Workspace Configuration
└── pnpm-workspace.yaml  # pnpm Package Workspace Setup
```

### Frontend (`apps/web`)
- **Framework:** Next.js 14 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with Sand & Titanium Liquid Glass tokens
- **State & Data Fetching:** TanStack React Query (`@tanstack/react-query`)
- **Realtime Client:** Socket.IO Client (`socket.io-client`)
- **Camera & QR:** `qrcode.react` (generation) & `html5-qrcode` (camera capture)
- **UI Components & Icons:** Lucide React icons, floating liquid glass bottom navigation

### Backend (`apps/api`)
- **Runtime & Server:** Node.js 20, Fastify
- **Data Validation:** Zod schemas for all request payloads and queries
- **Database:** PostgreSQL 16 managed via Prisma ORM
- **Cache & Message Broker:** Redis (stores rotating QR nonces and powers Socket.IO multi-room broadcasts)
- **Security & Auth:** JWT bearer tokens (8-hour expiry), bcrypt password hashing, role-based access control middleware

---

## 4. Design System: Sand & Titanium Liquid Glass

Inspired by minimal, ultra-clean aesthetic standards:
- **Porcelain (`#FCF9F4`):** Warm, soft light background surface.
- **Warm Sand (`#F0EEE9`):** Card and container surface fill.
- **Stone (`#E5E2DD` / `#CFC5B8`):** Subtle glass border outlines and dividers.
- **Graphite (`#1B1C19`):** High-contrast typography and icon glyphs.
- **Champagne Gold / Bronze (`#6C5939` / `#86724F`):** Primary action accents and brand marks.
- **White Glass (`rgba(255, 255, 255, 0.72)`):** Frosted glass panels with `backdrop-filter: blur(16px)`.
- **Navigation:** Floating translucent bottom navigation pill for intuitive mobile-first navigation across all roles.

---

## 5. Live Real-Time Socket.IO Synchronization

| Event Name | Room Scope | Trigger Condition | Frontend Behavior |
| :--- | :--- | :--- | :--- |
| `timetable:changed` | `section:<id>` | Admin confirms a faculty substitution or cancellation | Instant banner and toast alert to affected students in $<2$ seconds without manual page refresh. |
| `absence:created` | `admin` | Faculty submits a leave request | Instantly increments admin inbox badge and loads suggestions. |
| `rooms:changed` | `rooms` | A classroom or lab is booked or released | Invalidates Free Room query and updates live vacancy list. |
| `attendance:count` | `session:<id>` | A student scans a valid QR code | Faculty live counter increments in real-time. |
| `attendance:marked` | `user:<id>` | Student scan successfully verified | Real-time push notification and checkmark on student device. |

---

## 6. How Anti-Proxy QR Security Operates

1. **Short Token TTL:** Each token is a signed JWT with a 20-second expiration window.
2. **Periodic Token Rotation:** Faculty screens request a new cryptographic token every 10–15 seconds.
3. **Redis Single-Use Nonce:** Every token carries a random nonce with a 25-second TTL in Redis.
4. **Physical Presence Verification:** Taking a photo or screenshot and sending it via messaging apps takes longer than the rotation interval, rendering forwarded images expired and invalid when scanned off-campus.

---

## 7. Running the Project Locally

### Prerequisites
- Node.js 20+
- `pnpm` (`npm install -g pnpm`)

### Installation & Launch
```bash
# 1. Install all monorepo dependencies
pnpm install

# 2. Run backend API tests (apps/api)
cd apps/api
pnpm test

# 3. Start Frontend Development Server (apps/web)
cd ../web
pnpm dev -p 3001
```

- **Frontend Application:** [http://localhost:3001](http://localhost:3001)
- **Login Portal:** [http://localhost:3001/login](http://localhost:3001/login) (with 1-click Student, Faculty, and Admin demo persona logins)
