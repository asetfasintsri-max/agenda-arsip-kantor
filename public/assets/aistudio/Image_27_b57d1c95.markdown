---
name: SIMONAS Enterprise Command
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
  on-surface-variant: '#44474d'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#515f7a'
  primary: '#000412'
  on-primary: '#ffffff'
  primary-container: '#0f1e36'
  on-primary-container: '#7886a3'
  inverse-primary: '#b8c7e6'
  secondary: '#455f87'
  on-secondary: '#ffffff'
  secondary-container: '#b5d0fd'
  on-secondary-container: '#3e5980'
  tertiary: '#0e0300'
  on-tertiary: '#ffffff'
  tertiary-container: '#371400'
  on-tertiary-container: '#d16923'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#b8c7e6'
  on-primary-fixed: '#0c1b33'
  on-primary-fixed-variant: '#394761'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#adc8f5'
  on-secondary-fixed: '#001c3b'
  on-secondary-fixed-variant: '#2d486d'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-assurance, authoritative, and contemporary enterprise command environment tailored for military and institutional logistics governance. The visual language merges Modern Corporate discipline with utilitarian precision, projecting command clarity, operational vigilance, and unshakeable trust. 

The aesthetic eschews decorative noise and frivolous micro-interactions in favor of high-legibility typographic hierarchies, deliberate structural framing, and clear semantic state indicators. Surfaces are organized with architectural crispness to support mission-critical workflows: tracking classified official records, orchestrating multi-officer disposition chains, and reviewing time-sensitive logistical agendas. The user experience evokes absolute procedural control, administrative dignity, and zero-ambiguity status comprehension under intense operational cadences.

## Colors

The color architecture is anchored by institutional deep navy tones paired with ceremonial brass/gold accents and rigorous semantic signaling:

- **Primary (`#0f1e36` - Deep Command Navy)**: Applied to core structural surfaces, primary action triggers, global navigation rails, and dominant headers. Signifies authority, stability, and protocol.
- **Secondary (`#1e3a5f` - Tactical Slate Blue)**: Drives active interactive states, secondary navigation bars, container strokes, and focused item backdrops.
- **Tertiary (`#b45309` / `#d97706` - Insignia Brass & Gold)**: Reserved for command-level designations, high-value badge embellishments, official seals, and key priority indicators. Used judiciously to preserve institutional gravitas.
- **Neutral Core (`#0f172a` to `#f8fafc`)**: Neutral dark (`#0f172a`) anchors high-contrast text and critical numbers. Neutral backgrounds tier from `#f8fafc` (canvas base) to `#ffffff` (surface card), with `#f1f5f9` (container-subtle) and `#e2e8f0` (tactical structural borders).
- **Operational Semantic Accents**:
  - *Emerald Green (`#047857`, surface `#ecfdf5`)*: Selesai, Terverifikasi, status Aman / Terdistribusi.
  - *Amber (`#b45309`, surface `#fffbeb`)*: Menunggu Persetujuan, Sedang Proses, Perhatian.
  - *Crimson Red (`#b91c1c`, surface `#fef2f2`)*: Melewati Tenggat, Kilat/Sangat Rahasia, Urgent.
  - *Indigo Violet (`#4338ca`, surface `#eef2ff`)*: Konsep Naskah, Draf Disposisi, Paraf Hirarki.

## Typography

The dual-type system unites the authoritative, modern geometric structure of Plus Jakarta Sans for executive headlines and operational summary dashboards with the analytical clarity of Inter for dense administrative data, tables, disposition flows, and metadata labels.

- **Tabular Figures & Numeric Precision**: All data tables, registry serial numbers (Nomor Surat), timestamp tracks, and metric badges must render Inter with `font-feature-settings: "tnum" 1, "cv05" 1, "zero" 1` to ensure strict vertical alignment across comparative rows.
- **Hierarchical Discipline**: Section headings utilize Plus Jakarta Sans with controlled tracking to project command dignity. Multi-officer workflows and protocol statuses use small, uppercase tracking labels (`label-sm`) for rapid cognitive parsing under operational urgency.

## Layout & Spacing

The layout is built upon an 8pt structural spatial cadence tailored for data-dense, mission-critical operational displays.

- **Grid Architecture**: 
  - **Desktop (>= 1280px)**: 12-column responsive fluid grid with fixed 260px administrative command sidebar, 1.5rem (`24px`) gutters, and 2rem (`32px`) canvas margin.
  - **Tablet (768px - 1279px)**: 8-column layout with 1rem (`16px`) gutters and 1.5rem (`24px`) canvas margin; navigation compresses into an icon-dense compact rail or drawer.
  - **Mobile (< 768px)**: 4-column layout with 0.75rem (`12px`) gutters and 1rem (`16px`) safe edge margins, converting disposition pipelines and multi-column tables into stacked operational dossier cards.
- **Rhythm & Grouping**:
  - `space-xs` (4px) and `space-sm` (8px) govern micro-alignments, tag paddings, and table cell internal gaps.
  - `space-md` (16px) establishes internal card paddings and multi-input form spacing.
  - `space-lg` (24px) separates card clusters, metric zones, and disposition history nodes.
  - `space-xl` (32px) defines major operational module boundaries.

## Elevation & Depth

This design system rejects diffuse, playful, or blurred elevations in favor of precise tonal layering and crisp, low-contrast structural borders:

- **Surface Layering**:
  - `Base Canvas`: `#f8fafc` (Slate 50) establishes the background plane.
  - `Surface 1 (Panels & Tables)`: `#ffffff` with a crisp 1px perimeter border of `#e2e8f0`.
  - `Surface 2 (Nested Inspector / Inset Sections)`: `#f1f5f9` with an interior border of `#cbd5e1`.
  - `Command Overlay / Active Modal`: `#ffffff` resting above an authoritative `#0f172a` backdrop at 45% opacity.
- **Shadow Profile**:
  - Level 0 (Flat): Borders only (`1px solid #e2e8f0`). Applied to persistent panels and tabular grids.
  - Level 1 (Card Hover / Context Card): `0 1px 3px 0 rgba(15, 30, 54, 0.08), 0 1px 2px -1px rgba(15, 30, 54, 0.06)`.
  - Level 2 (Floating Dropdown / Filter Flyout): `0 4px 6px -1px rgba(15, 30, 54, 0.10), 0 2px 4px -2px rgba(15, 30, 54, 0.06)`.
  - Level 3 (Classified Verification Modal): `0 20px 25px -5px rgba(15, 30, 54, 0.15), 0 8px 10px -6px rgba(15, 30, 54, 0.10)`.

## Shapes

The design system adopts a calibrated "Soft" shape philosophy (`roundedness: 1`), conveying disciplined institutional formality:

- Standard controls, text fields, and primary buttons use a strict `0.25rem` (4px) corner radius.
- Cards, operational data surfaces, and modals utilize `rounded-lg` (`0.5rem` / 8px).
- Extended dashboard wrappers and flyout panels utilize `rounded-xl` (`0.75rem` / 12px).
- Circular pills (`rounded-full`) are strictly restricted to security clearance tags, officer rank avatars, and compact operational count badges.

## Components

### Buttons & Operational Actions
- **Primary Command Button**: Solid Deep Navy (`#0f1e36`) background with white typography, 4px corner radius, and subtle hover state (`#1e3a5f`). Active press triggers an internal inset tone. Padding: 10px 18px (`label-lg`).
- **Urgent / High-Priority Action**: Crimson Red (`#b91c1c`) fill with white text, strictly reserved for immediate disposition dispatch, reject notices, or deadline escalations.
- **Secondary / Terusan Button**: 1px solid stroke in `#cbd5e1`, white background, neutral-dark typography. Hover renders `#f8fafc`.
- **Brass / Approval Action**: Insignia Brass (`#b45309`) with gold highlight edges, utilized specifically for digital signatures (Tanda Tangan Elektronik / TTE) and official validation stamps.

### Disposition Badges & Operational Chips
- **Structure**: Height 24px, uppercase `label-sm` tracking, 4px border-radius, accompanied by an explicit status dot (6px).
- **Semantics**:
  - *Selesai / Terkirim*: Background `#ecfdf5`, border `#a7f3d0`, text `#047857`.
  - *Dalam Proses / Paraf*: Background `#fffbeb`, border `#fde68a`, text `#b45309`.
  - *Kilat / Terlambat*: Background `#fef2f2`, border `#fecaca`, text `#b91c1c`.
  - *Konsep / Draf*: Background `#eef2ff`, border `#c7d2fe`, text `#4338ca`.

### Data Tables & Agenda Registry
- Fixed-height header rows (40px) styled in `#f8fafc` with 1px border bottom `#cbd5e1`, typography set in `label-md` uppercase `#475569`.
- Body rows alternate with subtle striping or crisp 1px borders, offering 48px row heights for clear document scanning. Numbering and classification codes utilize monospace/tabular numerals.
- Selected rows highlight with 2px solid tactical navy left-edge accents and `#f1f5f9` fill.

### Form Fields & Signature Verification Blocks
- Inputs utilize 1px solid `#cbd5e1` with white background, transitioning on active focus to 2px solid `#1e3a5f` with a 2px outer ring in `#1e3a5f15`.
- Multi-officer disposition selectors include title, NIP/NRP, rank badge, and hierarchic routing indicators to prevent routing errors in chain of command workflows.

### Operational Metric Cards (KPI Logistik & Surat)
- Container: Surface white, 1px perimeter border `#e2e8f0`, 8px corner radius.
- Structure: Clear top label (`label-md` in `#64748b`), prominent metric number (`headline-lg` in Plus Jakarta Sans), and contextual trend indicator (positive/negative operational delta tag). A top-edge 3px colored accent line identifies functional categories (e.g., Red for Surat Rahasia, Gold for Agenda Pimpinan).