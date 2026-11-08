# ClassRadar Design System & Component Library Specification
**Product:** ClassRadar — *Your Campus. In Sync.*  
**Design System Identity:** Academic Utility Modern  
**Version:** 2.0.0 (Production Handoff Specification)  
**Target Viewports:** Responsive Web (Desktop 1920px/1366px, Tablet 768px, Mobile PWA 375px/390px)  
**Font Family:** Inter (Google Fonts)

---

## 1. Design Tokens & Foundations

### 1.1 Color Palette

The ClassRadar color palette is built on high-clarity academic utility: high-contrast surfaces, an authoritative institutional indigo/violet primary, an energetic academic accent emerald, and functional status semantics (emerald for safe/present, amber for substitutions/warnings, rose for critical debarment/cancellations).

#### Primary & Brand Tokens
| Token Name | HEX Value | RGB | Tailwind Utility | Semantic Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `primary` | `#4F46E5` | `rgb(79, 70, 229)` | `bg-primary`, `text-primary` | Main brand identity, primary CTA buttons, active navigation indicators, key highlights |
| `primary-hover` | `#4338CA` | `rgb(67, 56, 202)` | `hover:bg-indigo-700` | Hover state for primary buttons and interactive accents |
| `primary-light` | `#EEF2FF` | `rgb(238, 242, 255)` | `bg-indigo-50` | Primary tint container, soft highlight backgrounds, active row fills |
| `primary-border` | `#C7D2FE` | `rgb(199, 210, 254)` | `border-indigo-200` | Subtle active border outlines, focus rings |

#### Neutral & Surface Tokens (Light Mode Default)
| Token Name | HEX Value | RGB | Tailwind Utility | Semantic Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `surface` | `#FAFAFC` | `rgb(250, 250, 252)` | `bg-[#FAFAFC]` | Global canvas background, subtle off-white canvas |
| `surface-container-lowest` | `#FFFFFF` | `rgb(255, 255, 255)` | `bg-white` | Elevated cards, modal dialogs, input wells, top nav bar, data tables |
| `surface-container-low` | `#F1F5F9` | `rgb(241, 245, 249)` | `bg-slate-100` | Table headers, secondary pill tags, sidebar hover backdrops |
| `surface-container` | `#E2E8F0` | `rgb(226, 232, 240)` | `bg-slate-200` | Inactive tabs, divider lines, disabled buttons |
| `border-subtle` | `#E2E8F0` | `rgb(226, 232, 240)` | `border-slate-200` | Standard card borders, table cell horizontal borders, input borders |
| `border-strong` | `#CBD5E1` | `rgb(203, 213, 225)` | `border-slate-300` | Input hover borders, active card borders, tab underlines |

#### Typography & Content Neutrals
| Token Name | HEX Value | RGB | Tailwind Utility | Semantic Purpose & Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-primary` | `#0F172A` | `rgb(15, 23, 42)` | `text-slate-900` | Primary headlines, metric counters, student/faculty names, titles |
| `text-secondary` | `#475569` | `rgb(71, 85, 105)` | `text-slate-600` | Body copy, section descriptions, table cell text, form labels |
| `text-muted` | `#64748B` | `rgb(100, 116, 139)` | `text-slate-500` | Meta timestamps, sub-labels, period time slots (09:00 - 09:55) |
| `text-subtle` | `#94A3B8` | `rgb(148, 163, 184)` | `text-slate-400` | Input placeholder text, disabled text, breadcrumb slashes |

#### Functional & Semantic Status Tokens
| State / Context | Base Color | Tint Background | Border / Accent | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Safe (Emerald)** | `#10B981` (`emerald-600`) | `#ECFDF5` (`emerald-50`) | `#A7F3D0` (`emerald-200`) | Present attendance status, UGC >= 75% safe buffer, Room Approved, beacon verified |
| **Warning / Substituted (Amber)** | `#F59E0B` (`amber-500`) | `#FFFBEB` (`amber-50`) | `#FDE68A` (`amber-200`) | Faculty substitution notices, room reallocations, pending approval, expiring QR session |
| **Critical / Deficit (Rose)** | `#EF4444` (`rose-500`) | `#FEF2F2` (`rose-50`) | `#FECACA` (`rose-200`) | Debarment risk (<75% attendance), cancelled classes, critical error toasts, validation clash |
| **Informational / Telemetry (Sky/Blue)**| `#0284C7` (`sky-600`) | `#F0F9FF` (`sky-50`) | `#BAE6FD` (`sky-200`) | WebSocket live sync, timetable schedule notifications, room vacancy indicators |

---

### 1.2 Typography System

The typography scale utilizes **Inter** with standard tracking and open letterforms. Tabular figures (`font-variant-numeric: tabular-nums` / `font-mono`) are mandatory for roll numbers, USNs, timestamps, and percentages.

| Role | Font Size (px / rem) | Line Height | Font Weight | Letter Spacing | CSS Utility | Usage Context |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `32px / 2.0rem` | `40px (1.25)` | `700 (Bold)` | `-0.025em` | `text-3xl font-bold tracking-tight` | Auth portal headlines, marketing hero cards |
| **Headline Large** | `24px / 1.5rem` | `32px (1.33)` | `700 (Bold)` | `-0.02em` | `text-2xl font-bold tracking-tight` | Dashboard screen headers, modal titles |
| **Headline Medium**| `20px / 1.25rem` | `28px (1.4)` | `600 (Semibold)` | `-0.015em` | `text-xl font-semibold tracking-tight`| Widget titles, drawer headers, card groups |
| **Headline Small** | `18px / 1.125rem` | `26px (1.44)` | `600 (Semibold)` | `-0.01em` | `text-lg font-semibold` | Period timetable subject titles, metric card titles |
| **Title Medium** | `16px / 1.0rem` | `24px (1.5)` | `600 (Semibold)` | `0` | `text-base font-semibold` | Sub-section headings, table column groups |
| **Body Large** | `16px / 1.0rem` | `24px (1.5)` | `400 (Regular)` | `0` | `text-base font-normal` | Long descriptions, policy memos, notice text |
| **Body Regular** | `14px / 0.875rem` | `20px (1.43)` | `400 (Regular)` | `0` | `text-sm font-normal text-slate-600` | Standard table cell data, body text, form descriptions |
| **Body Medium** | `14px / 0.875rem` | `20px (1.43)` | `500 (Medium)` | `0` | `text-sm font-medium text-slate-700` | Form labels, active menu items, roster names |
| **Label Small** | `12px / 0.75rem` | `16px (1.33)` | `500 (Medium)` | `+0.01em` | `text-xs font-medium text-slate-500` | Status badges, timestamps, helper text, slot periods |
| **Label Caps** | `11px / 0.6875rem`| `14px (1.27)` | `600 (Semibold)` | `+0.05em` | `text-[11px] font-semibold uppercase tracking-wider` | Table header titles, section uppercase tags |
| **Data / Numbers** | `14px–28px` | `1.2` | `600–700` | `0` | `font-mono tabular-nums` | Attendance percentages (81.8%), USNs (`21CS042`), countdowns |

---

### 1.3 Spacing Scale

Based on an 8-point harmonic grid (with 4px micro-steps).

| Token | Size (px) | REM | Usage Guidelines |
| :--- | :--- | :--- | :--- |
| `space-1` | `4px` | `0.25rem` | Micro padding, badge horizontal padding, dot spacing |
| `space-2` | `8px` | `0.5rem` | Icon-to-text gap, compact card padding, inline element gap |
| `space-3` | `12px` | `0.75rem` | Input field vertical padding, badge group gap, list item vertical padding |
| `space-4` | `16px` | `1.0rem` | Default component padding, button horizontal padding, standard cell padding |
| `space-5` | `20px` | `1.25rem` | Card internal header gap, medium widget padding |
| `space-6` | `24px` | `1.5rem` | Card padding (`p-6`), standard dashboard grid gap (`gap-6`) |
| `space-8` | `32px` | `2.0rem` | Section vertical margins, header-to-content separation |
| `space-10` | `40px` | `2.5rem` | Page margins, empty state containers |
| `space-12` | `48px` | `3.0rem` | Major dashboard grid separation |

---

### 1.4 Border Radius Scale

Consistent rounded aesthetic using standard modern SaaS roundness (`ROUND_EIGHT`):

| Token | Radius Value | Tailwind Utility | Component Application |
| :--- | :--- | :--- | :--- |
| `radius-xs` | `2px` | `rounded-xs` | Progress bar sub-indicators, focus outlines |
| `radius-sm` | `4px` | `rounded` | Table inner tags, checkbox controls, micro badges |
| `radius-md` | `6px` | `rounded-md` | Standard status badges, small buttons, form controls |
| `radius-lg` | `8px` | `rounded-lg` | Standard buttons, input fields, dropdown menus, table containers |
| `radius-xl` | `12px` | `rounded-xl` | Dashboard cards, notification cards, timetable slot blocks |
| `radius-2xl`| `16px` | `rounded-2xl`| Modals, major hero widgets, mobile bottom sheets |
| `radius-full`| `9999px`| `rounded-full` | Avatars, pills, circular progress rings, floating action buttons |

---

### 1.5 Shadow & Elevation System

Flat, crisp academic utility aesthetic with soft ambient occlusion shadows (no noisy skeuomorphism):

| Elevation Level | CSS Shadow Value | Tailwind Utility | Component Usage |
| :--- | :--- | :--- | :--- |
| `elevation-none` | `none` | `shadow-none` | Flat cards with 1px border (`border-slate-200`) |
| `elevation-subtle` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | `shadow-sm` | Standard dashboard card, input fields at rest |
| `elevation-card` | `0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)` | `shadow` | Active cards, timetable period blocks on hover |
| `elevation-dropdown`| `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.08)` | `shadow-md` | Dropdown menus, tooltips, filter popovers |
| `elevation-modal` | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.08)` | `shadow-lg` | Modal dialogs, slide-over drawers, mobile QR action sheet |
| `elevation-float` | `0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)` | `shadow-xl` | Full screen focus dialogs, floating quick-scan FAB on mobile |

---

## 2. Core Component Library Specification

### 2.1 Buttons (`Button`)

Buttons are tactile, high-contrast, and keyboard accessible (`focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`).

#### Variants
1. **Primary (`btn-primary`)**:
   - *Default*: `bg-indigo-600 text-white font-medium shadow-sm border border-transparent`
   - *Hover*: `bg-indigo-700`
   - *Active / Focus*: `bg-indigo-800 ring-2 ring-indigo-500 ring-offset-2`
   - *Disabled*: `bg-slate-200 text-slate-400 cursor-not-allowed border-transparent shadow-none`
   - *Usage*: High-priority actions: "Launch QR Scanner", "Create Session", "Submit Leave", "Commit Timetable".

2. **Secondary (`btn-secondary`)**:
   - *Default*: `bg-white text-slate-700 border border-slate-300 font-medium shadow-sm`
   - *Hover*: `bg-slate-50 text-slate-900 border-slate-400`
   - *Active*: `bg-slate-100 border-slate-400`
   - *Disabled*: `bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed`
   - *Usage*: Supporting actions: "Cancel", "View Route", "Filter", "Download PDF".

3. **Subtle / Ghost (`btn-ghost`)**:
   - *Default*: `bg-transparent text-slate-600 font-medium border border-transparent`
   - *Hover*: `bg-slate-100 text-slate-900`
   - *Active*: `bg-slate-200`
   - *Disabled*: `text-slate-300 cursor-not-allowed`
   - *Usage*: Nav icons, "Dismiss", pagination controls, header utility buttons.

4. **Destructive (`btn-danger`)**:
   - *Default*: `bg-rose-50 text-rose-700 border border-rose-200 font-medium`
   - *Hover*: `bg-rose-600 text-white border-rose-600`
   - *Active*: `bg-rose-700`
   - *Disabled*: `bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed`
   - *Usage*: "Revoke Attendance", "Cancel Reservation", "Delete Session".

5. **Success / Emerald (`btn-success`)**:
   - *Default*: `bg-emerald-600 text-white font-medium shadow-sm border border-transparent`
   - *Hover*: `bg-emerald-700`
   - *Active*: `bg-emerald-800`
   - *Disabled*: `bg-slate-200 text-slate-400 cursor-not-allowed`
   - *Usage*: "Verify Present", "Check-in Room", "Approve Substitution".

#### Sizes
- **Small (`sm`)**: `h-8 px-2.5 text-xs rounded-md gap-1.5` (Table action buttons, badge actions)
- **Medium (`md` - Default)**: `h-9 px-3.5 text-sm rounded-lg gap-2` (Standard form buttons, header actions)
- **Large (`lg`)**: `h-11 px-5 text-base rounded-lg gap-2.5` (Primary CTA cards, mobile bottom scan buttons)
- **Icon Only**: `w-9 h-9 p-0 flex items-center justify-center rounded-lg`

---

### 2.2 Input Fields & Dropdowns

#### Text Inputs (`Input`)
- **Container Structure**: Vertical flex container with `Label` (`text-sm font-medium text-slate-700 mb-1.5`), `Input Wrapper` with optional leading/trailing icons, and `Helper / Error Text` (`text-xs mt-1`).
- **States**:
  - *Rest*: `bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg h-10 px-3 text-sm transition-colors`
  - *Hover*: `border-slate-400`
  - *Focus*: `border-indigo-600 ring-2 ring-indigo-500/20 outline-none`
  - *Error*: `border-rose-500 text-rose-900 ring-2 ring-rose-500/20` accompanied by an SVG warning icon and `text-rose-600 text-xs mt-1`.
  - *Disabled*: `bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed`

#### Select / Dropdowns (`Select`)
- **Visual Spec**: `h-10 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 appearance-none bg-[url('data:image/svg+xml;...')] bg-no-repeat bg-[right_10px_center]`
- **Interactive Role Switcher**: Pill-style header dropdown:
  - Container: `flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 shadow-sm`
  - Dropdown Menu: `absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 divide-y divide-slate-100`

---

### 2.3 Cards & Dashboard Widgets

Cards serve as the modular atomic container for timetables, metric summaries, and real-time feeds.

1. **Standard Data Card (`card-standard`)**:
   - `bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all`
   - Structure: `Card Header` (title, optional icon, trailing action/pill), `Divider` (optional `border-b border-slate-100`), `Card Body`, `Card Footer`.

2. **Metric Tile (`widget-kpi`)**:
   - Height: Compact 80px–110px.
   - Layout: Split flex container. Left side holds large metric figure (`text-2xl font-bold font-mono tracking-tight text-slate-900`) and descriptor label (`text-xs font-medium text-slate-500`). Right side holds status icon chip (`w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center`).

3. **Timetable Period Block (`card-slot`)**:
   - States:
     - *Past / Present*: Subtle border, green check pill, `bg-white`.
     - *Live Active Session*: Highlighted `border-2 border-indigo-500 bg-indigo-50/20 shadow-md ring-1 ring-indigo-500/10`. Displays pulsing live beacon.
     - *Substituted*: Amber accent border `border-l-4 border-l-amber-500 bg-amber-50/20 border-slate-200`.
     - *Cancelled*: Light strikethrough styling, muted grey text, red status pill (`bg-rose-50 text-rose-600`).
     - *Vacant / Recess*: Dashed border `border-dashed border-slate-300 bg-slate-50/50`.

---

### 2.4 Status Badges & Pills (`Badge`)

Badges indicate attendance health, verification status, and timetable dynamics.

| Badge Name | Visual Styling | Icon | Example Text |
| :--- | :--- | :--- | :--- |
| **Present / Verified** | `bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full text-xs` | `check_circle` | `● PRESENT` / `Verified` |
| **Active Live Session**| `bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold px-2.5 py-0.5 rounded-full text-xs animate-pulse`| `radio_button_checked` | `● LIVE CLASS` |
| **Substituted** | `bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-2 py-0.5 rounded-full text-xs` | `swap_horiz` | `⇄ SUBSTITUTED` |
| **Cancelled** | `bg-rose-50 text-rose-700 border border-rose-200 font-semibold px-2 py-0.5 rounded-full text-xs` | `cancel` | `✕ CANCELLED` |
| **Critical Deficit** | `bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2 py-0.5 rounded-full text-xs` | `warning` | `! DEFICIT (71.4%)` |
| **Safe Buffer** | `bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full text-xs` | `verified_user` | `+16 SAFE` |
| **Vacant / Free** | `bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2 py-0.5 rounded-full text-xs` | `meeting_room` | `VACANT` |

---

### 2.5 Data Tables & Pagination (`Table`)

Used in roster management, admin conflict inspection, and attendance audit logs.

#### Table Layout & Row Density
- **Container**: `w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm`
- **Table Head (`thead`)**: `bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider text-left py-3 px-4`
- **Table Body Row (`tbody tr`)**:
  - *Default*: `border-b border-slate-100 text-sm text-slate-800 py-3.5 px-4 transition-colors`
  - *Hover*: `hover:bg-slate-50/80`
  - *Selected*: `bg-indigo-50/50 border-indigo-100`
  - *Row Height*: Standard 48px row density. Compact 40px for admin data grids.
- **Data Formatting**: USN/Roll numbers styled with `font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded`.

#### Pagination Bar
- **Layout**: `flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white text-xs text-slate-600`
- **Elements**:
  - Left: `"Showing 1 to 10 of 64 entries"`
  - Right: Segmented button group (`Previous`, page number pills `1`, `2`, `3`, `Next`) with active state (`bg-indigo-600 text-white font-semibold rounded-md px-2.5 py-1`).

---

### 2.6 Navigation & Shell Components

#### Top Navigation Bar (`TopNavBar`)
- **Dimensions**: Fixed `h-14` docked at `top-0`, full-width, `z-40`.
- **Styling**: `bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs`
- **Components**:
  - Left: Brandmark (`ClassRadar`), active academic term badge (`Academic Term 2024-25 Active`).
  - Center: Nav link pills (`Timetable`, `Attendance`, `Substitutions`, `Rooms`) with active highlight (`text-indigo-600 border-b-2 border-indigo-600 pb-3 font-semibold`).
  - Right: Live telemetry badge (`● WebSocket Live Sync • 14ms Latency`), Notification Bell with unread counter, Role Switcher dropdown, User Profile avatar.

#### Side Navigation Rail (`SideNavBar` - Desktop)
- **Dimensions**: `w-64 fixed left-0 top-14 bottom-0` (or `h-screen` docked).
- **Styling**: `bg-white border-r border-slate-200 p-4 flex flex-col justify-between`
- **Tabs**:
  - Inactive: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors`
  - Active: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100`

#### Mobile PWA Bottom Navigation Bar (`BottomNavBar` - 375px/390px)
- **Dimensions**: `h-16 fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)]`
- **Items**: 5-column grid (`Home`, `Schedule`, `Scan QR` [Elevated center FAB], `Attendance`, `Profile`).
- **Scan QR FAB**: `w-12 h-12 -mt-5 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center border-4 border-white active:scale-95 transition-transform`.

---

### 2.7 Modals & Confirmation Dialogs (`Modal`)

- **Backdrop Overlay**: `fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4`
- **Modal Container**: `w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all`
- **Structure**:
  - *Header*: `px-6 py-4 border-b border-slate-100 flex items-center justify-between` with title (`text-lg font-bold text-slate-900`) and close icon.
  - *Content Well*: `p-6 text-sm text-slate-600 space-y-4`
  - *Footer Actions*: `px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3` (Cancel button + Primary Confirm button).

---

### 2.8 Charts & Progress Indicators

1. **UGC Radial Attendance Ring**:
   - Visual: Concentric SVG circular ring (`viewBox="0 0 100 100"`).
   - Track: `stroke="#E2E8F0"` (`stroke-width="8"`).
   - Progress Arc: `stroke="#10B981"` (`stroke-width="8"` with `stroke-linecap="round"`). Switches to `#EF4444` if `< 75%`.
   - Center Typography: Big percentage (`text-2xl font-bold font-mono text-slate-900`) and sub-label (`"OVERALL"`).
   - 75% Threshold Marker: Visual tick line marked at the 75% boundary with badge `"UGC Min 75%"`.

2. **What-If Bunk Sandbox Sliders**:
   - Track: `h-2 bg-slate-200 rounded-full`
   - Thumb: `w-5 h-5 bg-indigo-600 border-2 border-white rounded-full shadow-md cursor-pointer hover:scale-110`
   - Output readout: Live recalculated safe bunk margin `+X classes can be skipped` or `-Y classes needed to reach 75%`.

---

### 2.9 Notification Components (`NotificationCard`)

- **Card Layout**: `flex items-start gap-4 p-4 rounded-xl border transition-all mb-3`
- **Variants by Priority**:
  - *Session Live (Indigo)*: `bg-indigo-50/40 border-indigo-200 text-indigo-950`
  - *Substitution (Amber)*: `bg-amber-50/40 border-amber-200 text-amber-950`
  - *Critical Deficit (Rose)*: `bg-rose-50/40 border-rose-200 text-rose-950`
  - *Room Confirmed (Emerald)*: `bg-emerald-50/40 border-emerald-200 text-emerald-950`
- **Card Elements**: Category badge, relative timestamp (`"2 mins ago"`), unread dot (`w-2 h-2 rounded-full bg-indigo-600`), headline, descriptive body, and inline action buttons (*Launch Scanner*, *View Route*, *Open Bunk Calculator*).

---

## 3. Interactive States Matrix (Developer Handoff Guide)

| Component | Default / Rest | Hover | Active / Focus | Disabled | Error / Invalid |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Button** | `bg-indigo-600 text-white shadow-sm` | `bg-indigo-700` | `bg-indigo-800 ring-2 ring-indigo-500` | `bg-slate-200 text-slate-400 cursor-not-allowed` | N/A |
| **Secondary Button** | `bg-white border-slate-300 text-slate-700` | `bg-slate-50 border-slate-400 text-slate-900` | `bg-slate-100 ring-2 ring-slate-300` | `bg-slate-50 border-slate-200 text-slate-300` | N/A |
| **Text Input** | `bg-white border-slate-300 text-slate-900` | `border-slate-400` | `border-indigo-600 ring-2 ring-indigo-500/20` | `bg-slate-50 text-slate-400 border-slate-200` | `border-rose-500 ring-2 ring-rose-500/20 text-rose-900` |
| **Select Dropdown**| `bg-white border-slate-300 text-slate-800` | `border-slate-400` | `border-indigo-600 ring-2 ring-indigo-500/20` | `bg-slate-50 text-slate-400 border-slate-200` | `border-rose-500` |
| **Checkbox** | `w-4 h-4 border-slate-300 rounded text-indigo-600` | `border-indigo-500` | `ring-2 ring-indigo-500/20` | `bg-slate-100 border-slate-200 cursor-not-allowed` | `border-rose-500` |
| **Table Row** | `bg-white border-b border-slate-100` | `bg-slate-50/80 cursor-pointer` | `bg-indigo-50/50 border-indigo-100` | `opacity-50 pointer-events-none` | `bg-rose-50/50 border-rose-200` |
| **Navigation Tab** | `text-slate-600 hover:text-slate-900` | `bg-slate-100/70` | `text-indigo-600 bg-indigo-50 font-semibold` | `text-slate-300 pointer-events-none` | N/A |
| **Timetable Slot** | `bg-white border-slate-200` | `border-indigo-300 shadow-sm` | `border-indigo-600 ring-1 ring-indigo-500` | `bg-slate-100/50 border-dashed border-slate-200` | `border-rose-300 bg-rose-50/20` |

---

## 4. Frontend Implementation & Tailwind Preset Configuration

Frontend developers can drop the following theme configuration directly into `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          light: '#EEF2FF',
          border: '#C7D2FE',
        },
        surface: {
          DEFAULT: '#FAFAFC',
          card: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E2E8F0',
        },
        status: {
          safe: '#10B981',
          safeTint: '#ECFDF5',
          warning: '#F59E0B',
          warningTint: '#FFFBEB',
          danger: '#EF4444',
          dangerTint: '#FEF2F2',
          info: '#0284C7',
          infoTint: '#F0F9FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '12px',
        modal: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
        modal: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
      },
    },
  },
};
```
