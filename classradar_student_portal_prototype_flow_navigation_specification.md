# ClassRadar — Connected Student Portal Interactive Prototype Specification & Playable User Flow

**Ecosystem:** ClassRadar (*"Your Campus. In Sync."*)  
**Design System:** Academic Utility Modern (`Academic Utility Modern`)  
**Scope:** Student Portal Screen Navigation & Playable Sequence  
**Mode:** Prototype Connection (Zero duplicate screens generated; existing screens interconnected)

---

## 1. Sequence Mapping: Student Portal Flow

All destinations in the requested flow exist directly on the canvas and are mapped below:

```
[1. Student Dashboard] (SCREEN_13 / SCREEN_16)
          │
          ├─► [2. Today's Timetable] ──────────► Embedded section on SCREEN_13 & SCREEN_16 / Mobile timeline on SCREEN_8
          │
          ├─► [3. Weekly Timetable] ───────────► Weekly Matrix grid (Mon–Sat) embedded on SCREEN_13
          │
          ├─► [4. My Attendance] ──────────────► Dedicated screen: Student Attendance Hub (SCREEN_10)
          │
          ├─► [5. Bunk Calculator] ────────────► What-if calculation sandbox on SCREEN_13 & SCREEN_10
          │
          ├─► [6. QR Scanner] ─────────────────► Dedicated screen: Student Mobile QR Scanner & Verification (SCREEN_11)
          │
          └─► [7. Find Free Rooms] ────────────► Campus Free Room Finder on SCREEN_13 (with date/slot filters)
```

---

## 2. Interactive Clickable Entry Points & Navigation Matrix

| Step | User Action / Trigger Element | Source Screen | Target Destination Screen / Anchor | Functional Behavior |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Root Starting Point** | Canvas | `{{DATA:SCREEN:SCREEN_13}}` ("ClassRadar - Student Timetable, Attendance & Bunk Calculator") | Displays Aarav Sharma (CSE-A) unified dashboard with schedule, attendance KPIs, matrix, and room finder. |
| **2** | **"Today's Timetable"** | Top Nav / Side Nav (`Overview` / `Today's Classes`) | Anchor `#todays-timetable` on `{{DATA:SCREEN:SCREEN_13}}` (or `{{DATA:SCREEN:SCREEN_8}}` for Mobile PWA) | Smoothly scrolls to the 8-period daily timeline with Period 2 live countdown and Period 3 substitution alert. |
| **3** | **"Weekly Timetable"** | Side Nav (`Schedule Matrix`) / Tab `Weekly Timetable` | Anchor `#weekly-matrix` on `{{DATA:SCREEN:SCREEN_13}}` | Activates the complete Monday-to-Saturday master slot grid with faculty tags, room numbers, and conflict-free status. |
| **4** | **"My Attendance"** | Side Nav (`Attendance Monitor`) / Top Nav (`Attendance`) | `{{DATA:SCREEN:SCREEN_10}}` ("ClassRadar - Student Attendance & Bunk Management Hub") | Navigates to the comprehensive subject-wise breakdown (88.9% DSA, 82.4% DBMS, 71.4% OS Deficit) and verified audit log. |
| **5** | **"Bunk Calculator"** | Dashboard Card ("Attendance & Bunk Predictor") / Hub Tab | Sliders on `{{DATA:SCREEN:SCREEN_13}}` and drawer on `{{DATA:SCREEN:SCREEN_10}}` | Interactive dual-range sliders (*Classes to Skip* vs. *Classes to Attend*) with dynamic safe/debarment margin projection. |
| **6** | **"QR Scanner"** | Period 2 "Scan Now" Button / Top Nav "Quick Scan" / FAB on `{{DATA:SCREEN:SCREEN_8}}` | `{{DATA:SCREEN:SCREEN_11}}` ("ClassRadar - Student Mobile QR Scanner & Attendance Verification") | Launches the optical camera reticle, geofence beacon check, fallback 6-digit PIN input, and verification result states. |
| **7** | **"Find Free Rooms"** | Side Nav (`Room Allocation`) / Card "Campus Free Room Finder" | Anchor `#campus-free-rooms` on `{{DATA:SCREEN:SCREEN_13}}` | Filters vacant lecture halls and labs (Systems Lab 2, Tutorial Room 104, Seminar Hall B) with 1-click study check-in. |

---

## 3. Absence / Gap Audit

As instructed, rather than generating duplicate screens:
- **Today's Timetable**: Present directly as the primary interactive timeline on `{{DATA:SCREEN:SCREEN_13}}` and `{{DATA:SCREEN:SCREEN_8}}`.
- **Weekly Timetable**: Present directly as the comprehensive Mon–Sat scheduling grid on `{{DATA:SCREEN:SCREEN_13}}`.
- **My Attendance**: Fully realized on `{{DATA:SCREEN:SCREEN_10}}` with subject-level telemetry and audit trail.
- **Bunk Calculator**: Fully realized with dynamic sliders on `{{DATA:SCREEN:SCREEN_13}}` and `{{DATA:SCREEN:SCREEN_10}}`.
- **QR Scanner**: Fully realized on `{{DATA:SCREEN:SCREEN_11}}` (mobile scanner with manual PIN and state previewer).
- **Find Free Rooms**: Fully realized on `{{DATA:SCREEN:SCREEN_13}}` with date, slot, type, and capacity filters.

All 7 nodes are 100% accounted for and connected across the existing student screens. Neither Faculty nor Admin screens were modified.
