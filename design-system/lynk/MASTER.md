# Lynk design system (master)

Source of truth for every Lynk surface. Page-specific overrides live in `pages/`.
Built from Apple's Human Interface Guidelines (color, typography, materials, buttons,
branding) and the UI/UX Pro Max "Chat & Messaging App" profile. Motion follows the
taste skill. Tokens are implemented in `apps/web/src/app/globals.css`.

## Principles

- Content first. Chrome is neutral grey so photos, names and messages carry the colour.
- One accent, used for actions and status only (HIG `branding.md`: apply the accent
  color judiciously).
- Familiar patterns: chat list, conversation, detail panel. Identity comes from type,
  restraint and a few defining moments, not unusual controls.

## Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F5F5F7` | `#0B0B0D` | Page |
| `--surface` | `#FFFFFF` | `#1C1C1E` | Cards, panels, list selection |
| `--surface-2` | `#E8E8ED` | `#2C2C2E` | Segmented controls, skeletons, quiet fills |
| `--ink` | `#1D1D1F` | `#F5F5F7` | Primary text |
| `--muted` | `#6E6E73` | `#98989D` | Secondary text |
| `--line` | `#D2D2D7` | `#38383A` | Separators, borders |
| `--accent` | `#0071E3` | `#0071E3` | Fills: primary buttons, unread badges, read marker, focus ring |
| `--accent-ink` | `#0066CC` | `#2997FF` | Blue text, links, tinted icons |
| `--accent-soft` | `#E8F1FC` | `#0F2A47` | Your own messages, highlighted rows |
| `--on-accent` | `#FFFFFF` | `#FFFFFF` | Text on accent fills |
| `--positive` | `#34C759` | `#30D158` | Online dot only |
| `--danger` | `#D70015` | `#D70015` | Destructive fills (white text 5.38:1) |
| `--danger-ink` | `#D70015` | `#FF6961` | Destructive text: 5.38:1 on white, 6.03:1 on `#1C1C1E` |
| `--stage` | `#1D1D1F` | `#1C1C1E` | Dark feature tiles on the landing page |

Contrast (WCAG AA, checked): body 15.5:1 light / 18.1:1 dark; secondary text 4.66:1 on
`--bg`, 5.07:1 on white; blue text 5.11:1 light / 6.52:1 dark; white on blue fill 4.7:1.

Don't: introduce a second accent, tint neutrals, use pure `#000`/`#FFF` for page
backgrounds, or put the accent on decorative elements.

## Typography

- Family: the platform typeface. SF Pro on Apple devices, Segoe UI Variable on Windows,
  Geist as the web fallback (`--font-sans`, `--font-display`). One family only.
- Weights: 400 body, 500 labels and buttons, 600 headings. No light or thin weights.
- Scale (px): 12 caption · 13 secondary · 15 message body · 16–18 body · 20 title ·
  24–30 section title · 36–48 display · 56–64 hero (max two lines).
- Headings track −0.022em; body text is untracked. Digits in lists and times use
  `tabular-nums`. No monospace in the product UI. Labels are sentence case, never
  all caps.

## Shape and depth

- Controls (buttons, icon buttons, chips, tabs, badges, search fields): full pill.
- Cards: 16px (`rounded-2xl`). Panels and large containers: 24px (`rounded-3xl`).
  List rows: 12–16px.
- Avatars: rounded squares (32% of size) with a graphite gradient and white initials
  (4.5:1 or better).
- Shadows: one soft shadow token (`shadow-soft`), used only on raised items.
- App atmosphere: two soft accent glows behind the app (≤10% strength) and a pointer
  glow behind conversations. Decorative only; never behind text at more than 10%.
- Glass: the fixed nav only (`.glass`), with a solid fallback under
  `prefers-reduced-transparency`. Never in content.

## Motion (taste skill)

- Every animation explains something (hierarchy, story, feedback or state change).
- Transitions: `MOTION.item` spring (stiffness 420, damping 36) for UI items;
  `MOTION.fade` 0.5s ease-out for content entering.
- Landing: hero demo plays the conversation then reveals the plan (story); "How it
  works" is a pinned scroll story with a progress line and a preview per step; tiles
  fade up once in view.
- App: messages slide in, panels and tabs animate position, status markers rotate
  when read.
- Reduced motion: by product decision (Sep 2026), the full motion plays for everyone;
  the OS "Reduce motion" setting is not honoured. Revisit before launch (WCAG 2.3.3).
- Physics: springs everywhere (pointer glows, magnetic buttons, draggable elements that
  snap home, a magnifying dock, message launch, reaction bursts).
- Never: infinite decorative loops, or motion that blocks reading.

## Accessibility floor

- Text contrast AA or better in both themes; focus ring always visible.
- Hit targets 40px or larger for primary controls (44px on touch).
- Every icon-only button has a label; nothing relies on colour alone (status markers
  also change shape).
