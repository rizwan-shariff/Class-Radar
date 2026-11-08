---
name: Academic Utility Modern
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5a5e69'
  on-secondary: '#ffffff'
  secondary-container: '#dee2ef'
  on-secondary-container: '#60646f'
  tertiary: '#3a495f'
  on-tertiary: '#ffffff'
  tertiary-container: '#516177'
  on-tertiary-container: '#ccdcf7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dee2ef'
  secondary-fixed-dim: '#c2c6d3'
  on-secondary-fixed: '#171c25'
  on-secondary-fixed-variant: '#424751'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.005em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  tabular-mono:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system delivers a focused, high-density utility aesthetic tailored for higher-education schedule orchestration, attendance analytics, and academic tracking. It merges the disciplined precision of developer toolchains (Linear, Vercel) with the clear readability and calm workspace atmosphere of modern document software (Notion).

### Aesthetic Direction
- **Minimal Precision:** Prioritizes high information density, meticulous structural alignment, clean typographic hierarchies, and zero non-functional ornamentation.
- **Micro-Interactions & Restraint:** Visual feedback relies on subtle border shifts, precise background tints, and soft state transitions rather than heavy elevations or bright washes.
- **Academic Focus:** Interfaces feel deliberate, reliable, and sharp—eliminating clutter so students and faculty can digest multi-slot calendars, attendance percentages, and critical alerts at a single glance.

## Colors

The color system maintains a disciplined, light-dominant scheme that anchors data clarity and visual calm.

### Role Allocations
- **Primary (`#4F46E5`):** Reserved strictly for primary calls-to-action, current active timetable slots, selected navigation states, and focused tab indicators.
- **Primary Light (`#EEF2FF`):** Used as an interactive hover background for primary items, active navigational rail items, and soft highlights on the active schedule grid column.
- **Surface (`#FFFFFF`) & Background (`#F8FAFC`):** Creates subtle structural depth. Canvas background sits at `#F8FAFC`, while all structured cards, tables, headers, and floating overlays sit on `#FFFFFF`.
- **Neutral Foregrounds:** Main textual content uses `#0F172A` for high-contrast legibility. Metadata, column headers, timestamps, and secondary descriptions use `#64748B`.
- **System Borders (`#E2E8F0`):** Provides delicate 1px structural framing across cards, table cells, dividers, and modular containers.
- **Status Accents:**
  - **Success (`#16A34A`):** Safe attendance thresholds (e.g., ≥75%), confirmed sessions, present marks.
  - **Warning (`#F59E0B`):** Attendance at-risk zones (e.g., 75%–80%), schedule changes, pending verifications.
  - **Danger (`#DC2626`):** Attendance shortages (&lt;75%), class cancellations, missed requirements.

## Typography

The typography system is constructed entirely around **Inter**, leveraging its clean geometry, neutral curves, and deep OpenType feature support.

### Typographic Principles
- **Tabular Figures:** Timetable slots, attendance percentages, dates, and metric widgets must explicitly activate tabular numerals (`font-feature-settings: "tnum" 1`) to guarantee columnar vertical alignment.
- **Letter Spacing:** Tighter tracking (`-0.025em` to `-0.015em`) is applied to large sizes for crisp, authoritative titles. Labels and captions use neutral or slightly open tracking for rapid legibility at small scale.
- **Weight Restraint:** Styles are strictly confined to `400` (Regular), `500` (Medium), and `600` (Semi-bold). Avoid heavier weights to preserve the minimal engineering tone.

## Layout & Spacing

The layout model is designed for continuous data visibility across dense grid views and metric tables.

### Layout Philosophy
- **Deskstop & Widescreen (≥1024px):** Uses a persistent left-hand tool rail (compact or icon-expanded), flanked by an edge-to-edge flexible canvas partitioned by 1px subtle borders (`#E2E8F0`). High-density calendar matrices stretch fluids within constrained max-widths (up to 1600px).
- **Tablet (768px – 1023px):** Collapses the persistent rail into an expandable drawer. Timetable views compress into single-day tabs or horizontal scroll strips with sticky time indicators.
- **Mobile (&lt;768px):** Switches to a vertical timeline list feed for day-to-day classes. Grid cells collapse into distinct agenda cards. Global navigation drops to a compact bottom navigation bar.

### Spacing Scales
- Internal cell padding, table gaps, and chip margins operate strictly on 4px and 8px primitives (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 12px, `space-lg` = 16px).
- Component separation prioritizes clean 1px border dividers over wide open space, maintaining a dense, high-utility SaaS feel.

## Elevation & Depth

This system avoids expressive, dramatized drop shadows. Depth and visual hierarchy are instead articulated through **crisp surface boundaries, subtle 1px borders, and low-contrast ambient layering**.

### Elevation Hierarchy
1. **Base Floor (`#F8FAFC`):** Application canvas background.
2. **Surface Tier (`#FFFFFF`):** Cards, timetable blocks, panels, and sidebars. Separated from the base solely via `border: 1px solid #E2E8F0`. No drop shadow.
3. **Interactive Hover State:** Elements elevate slightly with a delicate border color transition to `#CBD5E1` and an ambient hairline shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
4. **Flyout / Popover / Command Palette:** Raised panels, modal dialogues, and contextual dropdowns float above the surface using a structured dual-layer drop shadow:
   - `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 0 0 1px #E2E8F0;`
5. **Overlays:** Modals and drawer backdrops utilize `rgba(15, 23, 42, 0.3)` with a gentle backdrop filter (`backdrop-filter: blur(4px)`) to keep background structural context visible while subduing noise.

## Shapes

The design system standardizes on a refined, modern curvature calibrated precisely to standard interface density.

### Radius Assignments
- **Containers, Cards, & Panels:** 12px (`rounded-xl` / 0.75rem). Gives modular elements a soft, contemporary silhouette without sacrificing internal grid packing.
- **Interactive Controls (Buttons, Inputs, Selectors):** 8px (`rounded-lg` / 0.5rem). Preserves geometric sharpness and reliable clickable cues.
- **Pills, Chips, & Status Badges:** Fully rounded 9999px (`rounded-full`) or 6px (`rounded-md` / 0.375rem) depending on tag hierarchy. Attendance indicator badges strictly use 6px rounded rectangles to preserve structural harmony inside data tables.

## Components

### Buttons
- **Primary:** Background `#4F46E5`, text `#FFFFFF`, border `transparent`, radius `8px`. Hover: `#4338CA`. Active: `#3730A3`. Focus-visible: 2px offset with `#4F46E5`.
- **Secondary / Subtle:** Background `#EEF2FF`, text `#4F46E5`, border `transparent`, radius `8px`. Hover: `#E0E7FF`.
- **Outline / Ghost:** Background `#FFFFFF`, text `#0F172A`, border `1px solid #E2E8F0`, radius `8px`. Hover: `#F8FAFC` with border `#CBD5E1`.
- **Danger:** Background `#FFFFFF`, text `#DC2626`, border `1px solid #FECACA`. Hover: `#FEF2F2`.

### Cards & Panels
- Background `#FFFFFF`, radius `12px`, border `1px solid #E2E8F0`.
- Card headers feature an explicit 1px divider border at the bottom when containing toolbar controls, search bars, or date switchers.

### Chips & Status Badges
- **Status Indicator Badges:** Height 22px, padding `2px 8px`, radius `6px`, font size `12px`, weight `500`.
  - **Present / Safe (≥75%):** Background `#F0FDF4`, border `1px solid #BBF7D0`, text `#16A34A`. Includes an optional 6px circular dot (`#16A34A`).
  - **Warning (75%–80%):** Background `#FFFBEB`, border `1px solid #FDE68A`, text `#D97706`.
  - **Shortage (&lt;75%):** Background `#FEF2F2`, border `1px solid #FECACA`, text `#DC2626`.
  - **Neutral / Meta:** Background `#F1F5F9`, border `1px solid #E2E8F0`, text `#475569`.

### Input Fields & Controls
- Height 36px, background `#FFFFFF`, border `1px solid #E2E8F0`, text `#0F172A`, radius `8px`, typography `14px`.
- Hover border: `#CBD5E1`. Focus state: border `#4F46E5` with `box-shadow: 0 0 0 1px #4F46E5`.
- Placeholder color: `#94A3B8`.

### Checkboxes & Attendance Switches
- Checkbox size 16px × 16px, radius 4px, border `1px solid #CBD5E1`. Checked state: background `#4F46E5`, border `#4F46E5`, white check icon.
- Attendance Mark Toggle: Segmented control (Present / Absent / Excused) with active state sliding pill indicator in `#FFFFFF` over `#F1F5F9` container.

### Tabular Grid & Class Blocks (Domain Specific)
- **Table Structure:** Headers sit on `#F8FAFC` with `11px` uppercase tracking (`#64748B`), bottom border `1px solid #E2E8F0`. Rows sit on `#FFFFFF`, hover `#F8FAFC`.
- **Timetable Class Tile:** Rendered as modular nested blocks inside schedule cells. Background `#FFFFFF`, left accent border 3px solid `#4F46E5`, surrounding border `1px solid #E2E8F0`, radius `8px`, padding `8px 10px`. Displays subject code in `13px` semi-bold, room/lecturer details in `11px` `#64748B`.
- **Current Live Class Block:** Glowing edge indicator or subtle background fill `#EEF2FF` with `#4F46E5` primary text.