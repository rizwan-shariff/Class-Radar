# ClassRadar — Interactive Unified Prototype & User Journey Specification

**Product:** ClassRadar (*"Your Campus. In Sync."*)  
**Architecture:** Single Unified Interactive Multi-Role Campus Management Ecosystem  
**Design System Identity:** Academic Utility Modern (`Academic Utility Modern`)  
**Design Tokens Reference:** Primary Indigo (`#4F46E5`), Emerald Safe/Present (`#10B981`), Amber Substituted/Warning (`#F59E0B`), Rose Critical/Debarred (`#EF4444`), Neutral Canvas (`#FAFAFC` / `#FFFFFF`), Dark Navy Display Canvas (`#0A0F1D`).

---

## 1. Master Screen-to-Screen Mapping & Navigation Inventory

All screens are active and preserved on the Canvas. No duplicate screens were generated.

| Screen Role / Title | Canvas Item Reference | Primary Route / Hash | Key Interaction Points |
| :--- | :--- | :--- | :--- |
| **Authentication & Role Selection** | `{{DATA:SCREEN:SCREEN_8}}` | `/login` | Segmented Role Selector, Autofill Accounts, Sign In redirect to Student/Faculty/Admin |
| **Student Timetable, Attendance & Bunk Calculator** | `{{DATA:SCREEN:SCREEN_12}}` | `/student/dashboard` | Today's & Weekly Timetable, Sandbox Sliders, Quick Scan FAB modal, Free Room Finder |
| **Student Attendance & Bunk Management Hub** | `{{DATA:SCREEN:SCREEN_9}}` | `/student/attendance` | Course breakdown, What-if bunk sliders, Verified session audit log, Dispute modal |
| **Student Mobile PWA Dashboard & Timetable** | `{{DATA:SCREEN:SCREEN_7}}` | `/m/home` | Today's timeline, substitution route banner, bottom navigation bar, quick scan FAB |
| **Student Mobile QR Scanner & Attendance Verification** | `{{DATA:SCREEN:SCREEN_10}}` | `/m/scan` | Optical camera reticle, fallback 6-digit PIN, state switcher (Success/Expired/Out Range) |
| **Faculty Attendance & Lecture Operations Hub** | `{{DATA:SCREEN:SCREEN_13}}` | `/faculty/dashboard` | Workload analytics, launch QR attendance CTA, today's schedule, quick roster drawer |
| **Faculty Live QR Attendance Engine & Roster Control** | `{{DATA:SCREEN:SCREEN_11}}` | `/faculty/session-live` | 15s rotating TOTP QR, fallback PIN `#CR-8492-T3`, headcount bar, live manual overrides |
| **Admin Timetable, Substitutions & Analytics Console** | `{{DATA:SCREEN:SCREEN_14}}` | `/admin/dashboard` | Master timetable matrix, AI substitution matchmaker, CSV ingestion zone, debarment roster |
| **Notifications & Real-Time Campus Updates Center** | `{{DATA:SCREEN:SCREEN_6}}` | `/notifications` | Live dispatch feed, category tabs, channel preferences, room occupancy heatmap |
| **Lecture Hall & Classroom Display (Dark Mode)** | `{{DATA:SCREEN:SCREEN_3}}` | `/kiosk/room-301` | 16:9 ambient display, distance-legible clock, active session countdown, walk-in check-in QR |
| **Campus Timetable & Attendance Platform (Master Canvas)** | `{{DATA:SCREEN:SCREEN_15}}` | `/overview` | Universal campus architectural overview and demo launchpad |

---

## 2. Complete User Journey Architecture

### Journey 1: The Student Flow
```
[Institutional Portal Login] ({{DATA:SCREEN:SCREEN_8}})
       │ Select "Student Role" / Instant Autofill: Aarav Sharma (CSE-A)
       │ Click "Sign In to Portal"
       ▼
[Student Timetable, Attendance & Bunk Calculator] ({{DATA:SCREEN:SCREEN_12}})
       │
       ├─► [Today's Timetable & Live Period 2 (DSA)] ──► Click "Scan Now" ──► [Mobile Scanner] ({{DATA:SCREEN:SCREEN_10}})
       │
       ├─► [Weekly Timetable Matrix] (Mon–Sat Grid) ──► Inspect slots & filter by semester
       │
       ├─► [Campus Free Room Finder] ──► Inspect vacant labs/rooms (Systems Lab 2, Room 104) ──► Click "Check-in / Study"
       │
       ├─► [Attendance & Bunk Sandbox] ──► Click "Attendance" in Top/Side Nav
       │                                         │
       │                                         ▼
       │               [Student Attendance & Bunk Management Hub] ({{DATA:SCREEN:SCREEN_9}})
       │               ├── Course Cards (88.9% DSA, 82.4% DBMS, 71.4% OS Deficit)
       │               ├── Interactive What-If Bunk Sandbox Sliders
       │               ├── Verified Session Audit Log Table
       │               └── Click "Receipt" / "Dispute Discrepancy"
       │
       └─► [Mobile On-the-Go Experience] ({{DATA:SCREEN:SCREEN_7}})
               ├── Tap Bottom Nav: [Schedule] ──► Full daily timeline
               ├── Tap Center FAB: [Quick Scan] ──► [Mobile QR Scanner] ({{DATA:SCREEN:SCREEN_10}})
               ├── Tap Bottom Nav: [Attendance] ──► UGC Radial Tracker (81.8%)
               └── Substitution Alert Banner ──► "View Route (Wing B, 3rd Flr)"
```

### Journey 2: The Faculty Flow
```
[Institutional Portal Login] ({{DATA:SCREEN:SCREEN_8}})
       │ Select "Faculty Role" / Instant Autofill: Prof. K. Sharma (CSE)
       │ Click "Sign In to Portal"
       ▼
[Faculty Attendance & Lecture Operations Hub] ({{DATA:SCREEN:SCREEN_13}})
       │
       ├─► [Workload Summary] (4 Classes, 1 Lab Session, 94.2% Term Attendance)
       │
       ├─► [Upcoming Lecture Banner] ──► "Data Structures & Algorithms (CSE-A, Room 204)"
       │                                  │
       │                                  ▼ Click "Launch QR Beacon" / "Open QR Beacon"
       │
       │                 [Faculty Live QR Attendance Engine & Roster Control] ({{DATA:SCREEN:SCREEN_11}})
       │                 ├── Rotating Dynamic TOTP QR Code (Auto-refreshes every 15s)
       │                 ├── Fallback PIN Display: #CR-8492-T3
       │                 ├── Real-Time Telemetry Bar: 58/64 Present (90.6%)
       │                 ├── Searchable Live Student Roster
       │                 ├── Row Actions: "Verify Present", "Excuse Late", "Revoke Scan"
       │                 └── Session Controls: "Pause Rotation", "Enlarge for Projector", "Close Attendance Session"
       │
       ├─► [Mark Absence & Leave Delegation] ──► Triggers automated substitution requisition to Admin Console
       │
       └─► [Room Booking & Quick Roster] ──► Real-time student verification stream
```

### Journey 3: The Administrator Flow
```
[Institutional Portal Login] ({{DATA:SCREEN:SCREEN_8}})
       │ Select "Administrator Role" / Instant Autofill: Dr. V. Menon (Dean Academics)
       │ Click "Sign In to Portal"
       ▼
[Admin Timetable, Substitutions & Analytics Console] ({{DATA:SCREEN:SCREEN_14}})
       │
       ├─► [Executive Telemetry Bar] (1,420 Students Enrolled, 84/88 Faculty on Duty, 42 Rooms, 83.8% Campus Avg)
       │
       ├─► [Smart Substitution Management Console]
       │   ├── Reported Absence: Prof. R. Verma (Medical Emergency, DBMS Period 3)
       │   ├── AI Matchmaker Scoring:
       │   │   ├── Dr. P. Rao (98% Match — DBMS Expert, Free in Period 3) ──► SELECTED
       │   │   ├── Prof. S. Sen (92% Match)
       │   │   └── Dr. K. Raman (76% Match)
       │   └── 1-Click Action: "Dispatch Timetable Push Alert" ──► Broadcasts WebSocket update to Students & Screens
       │
       ├─► [Timetable CSV Ingestion & Pre-Flight Clash Validator]
       │   ├── Drag-and-drop CSV upload zone (Drop timetable master file)
       │   ├── Conflict Alert: "Warning: Prof. N. Iyer double-booked in Room 205 & Lab 1"
       │   └── In-line resolution matrix
       │
       └─► [Defaulters & Institutional Attendance Analytics]
           └── High-risk roster (<75% attendance) with 1-click guardian notice dispatch
```

### Journey 4: The Ambient Classroom & Kiosk Flow
```
[Lecture Hall Smart Display / TV / Projector] ({{DATA:SCREEN:SCREEN_3}})
       ├── Location & Capacity: LECTURE HALL 301 • Max Cap: 90 Seats • EB3-301
       ├── Digital Synchronized Clock: 06:14:55 AM
       ├── Active Class Stage: CS302 Data Structures & Algorithms • Prof. K. Sharma
       │   ├── Countdown: 26m 14s remaining (48% elapsed)
       │   ├── Live Attendance Telemetry: 82 / 88 Present (93.1%)
       │   └── Quick Hall Check-In QR: Rotating 15s TOTP Token #TRM-301-B
       ├── Next in This Hall Rail:
       │   ├── Period 4: CS303 Database Systems (Amber "Faculty Substitution: Dr. P. Rao" tag)
       │   ├── Period 5: CS305 OS Lab (Batch A)
       │   ├── Period 6: Lunch Recess / Free Quiet Study Permitted
       │   └── Period 7: Special Guest Lecture: Cloud Native Infrastructure
       └── Campus Broadcast Ticker: Real-time lab shift bulletins
```

---

## 3. Interactive Component & Navigation Connectivity Matrix

| Trigger Element | Source Screen | Target Destination Screen | Functional State / Dialog Triggered |
| :--- | :--- | :--- | :--- |
| **"Sign In to Portal" (Student tab active)** | `{{DATA:SCREEN:SCREEN_8}}` | `{{DATA:SCREEN:SCREEN_12}}` | Authenticates student session; redirects to Student Timetable & Dashboard |
| **"Sign In to Portal" (Faculty tab active)** | `{{DATA:SCREEN:SCREEN_8}}` | `{{DATA:SCREEN:SCREEN_13}}` | Authenticates faculty session; redirects to Faculty Operations Hub |
| **"Sign In to Portal" (Admin tab active)** | `{{DATA:SCREEN:SCREEN_8}}` | `{{DATA:SCREEN:SCREEN_14}}` | Authenticates administrator session; redirects to Dean's Operations Console |
| **"Autofill Aarav Sharma (Student)"** | `{{DATA:SCREEN:SCREEN_8}}` | `{{DATA:SCREEN:SCREEN_12}}` | Instant demo login as CSE-A student |
| **"Autofill Prof. K. Sharma (Faculty)"** | `{{DATA:SCREEN:SCREEN_8}}` | `{{DATA:SCREEN:SCREEN_13}}` | Instant demo login as CSE Department faculty |
| **"Autofill Dr. V. Menon (Admin)"** | `{{DATA:SCREEN:SCREEN_8}}` | `{{DATA:SCREEN:SCREEN_14}}` | Instant demo login as Academic Dean |
| **"Attendance Monitor" (Side Nav)** | `{{DATA:SCREEN:SCREEN_12}}` | `{{DATA:SCREEN:SCREEN_9}}` | Transitions to Subject-Wise Attendance & Bunk Management Hub |
| **"Timetable" (Top Nav)** | `{{DATA:SCREEN:SCREEN_9}}` | `{{DATA:SCREEN:SCREEN_12}}` | Returns to Student Dashboard & Weekly Schedule Matrix |
| **"Quick Scan" CTA / Live Slot Button** | `{{DATA:SCREEN:SCREEN_12}}` | `{{DATA:SCREEN:SCREEN_10}}` | Opens Student Mobile QR Scanner & Attendance Verification |
| **"Launch QR Beacon" (Top Banner)** | `{{DATA:SCREEN:SCREEN_13}}` | `{{DATA:SCREEN:SCREEN_11}}` | Launches live podium QR attendance engine |
| **"Open QR Beacon" (Schedule Row)** | `{{DATA:SCREEN:SCREEN_13}}` | `{{DATA:SCREEN:SCREEN_11}}` | Launches session for CS303 in Room 204 |
| **"Close Attendance Session"** | `{{DATA:SCREEN:SCREEN_11}}` | `{{DATA:SCREEN:SCREEN_13}}` | Locks session roster, computes final headcounts, returns to Faculty Hub |
| **"Enlarge for Projector"** | `{{DATA:SCREEN:SCREEN_11}}` | `{{DATA:SCREEN:SCREEN_3}}` | Opens classroom high-visibility 16:9 Dark Mode kiosk display |
| **"Notification Bell" (Any Top Nav)** | All Desktop Screens | `{{DATA:SCREEN:SCREEN_6}}` | Opens Central Notifications & Real-Time Campus Updates Center |
| **"Active Role Switcher" Dropdown** | All Desktop Screens | `{{DATA:SCREEN:SCREEN_12}}` / `13` / `14` | Instant seamless context switching across Student, Faculty, and Admin personas |
| **Mobile Bottom Nav: "Home"** | `{{DATA:SCREEN:SCREEN_7}}`, `{{DATA:SCREEN:SCREEN_10}}` | `{{DATA:SCREEN:SCREEN_7}}` | Returns to Mobile PWA Student Dashboard |
| **Mobile Bottom Nav: "Scan QR" (FAB)** | `{{DATA:SCREEN:SCREEN_7}}` | `{{DATA:SCREEN:SCREEN_10}}` | Activates full-screen camera QR scanner |
| **Mobile Bottom Nav: "Attendance"** | `{{DATA:SCREEN:SCREEN_7}}` | `{{DATA:SCREEN:SCREEN_9}}` | Views comprehensive UGC 75% attendance audit |
| **"Back Arrow" (Scanner Header)** | `{{DATA:SCREEN:SCREEN_10}}` | `{{DATA:SCREEN:SCREEN_7}}` | Exits scanner and returns to mobile home |

---

## 4. Verification of Specification Gaps vs. Existing Screens

As confirmed in the requirements audit:
1. **Student Space Finder**: Full functional block embedded directly on `{{DATA:SCREEN:SCREEN_12}}` (Campus Free Room Finder with Date, Slot, Room Type, and Capacity filters).
2. **Admin Timetable CSV Ingestion**: Embedded directly on `{{DATA:SCREEN:SCREEN_14}}` (Drag-and-drop ingestion zone with clash validator banner).
3. **Faculty Absence & Substitution Matchmaker**: Embedded on `{{DATA:SCREEN:SCREEN_14}}` and `{{DATA:SCREEN:SCREEN_13}}` with live algorithmic substitute scoring.
4. **Distance Lecture Kiosk**: Fully implemented on `{{DATA:SCREEN:SCREEN_3}}` with real-time countdown, attendance telemetry, and 15s TOTP token.

All 11 screens operate cohesively under the `Academic Utility Modern` design system. No duplicate screens were created; existing screens have been unified into an end-to-end interactive campus prototype.
