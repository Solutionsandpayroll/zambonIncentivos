---
name: Zambon OS
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#37393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c8c8ae'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#92927a'
  outline-variant: '#474834'
  surface-tint: '#c5cf1b'
  primary: '#dfea3a'
  on-primary: '#303300'
  primary-container: '#c3cd17'
  on-primary-container: '#505500'
  inverse-primary: '#5e6300'
  secondary: '#c2c7ce'
  on-secondary: '#2c3136'
  secondary-container: '#42474d'
  on-secondary-container: '#b1b5bc'
  tertiary: '#dae1eb'
  on-tertiary: '#2a3139'
  tertiary-container: '#bec5cf'
  on-tertiary-container: '#4b525a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1ec3d'
  primary-fixed-dim: '#c5cf1b'
  on-primary-fixed: '#1b1d00'
  on-primary-fixed-variant: '#464a00'
  secondary-fixed: '#dee3ea'
  secondary-fixed-dim: '#c2c7ce'
  on-secondary-fixed: '#171c21'
  on-secondary-fixed-variant: '#42474d'
  tertiary-fixed: '#dce3ed'
  tertiary-fixed-dim: '#c0c7d1'
  on-tertiary-fixed: '#151c24'
  on-tertiary-fixed-variant: '#404750'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-xl:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Poppins
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Poppins
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Poppins
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: -0.01em
  label-bold:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2.5rem
  xl: 4rem
  gutter: 24px
  margin: 32px
---

> **Scope.** This file is the same in the six screen folders (adminf, calculof, home, loginf, reportesf, resultsf) — it is one system, not six. The implementation lives in `shared/zambon-base.html` (classes and tokens), `shared/zambon-sidebar.html` (canonical sidebar) and `shared/api.js` (dialogs, toasts, role permissions). **If this document and the code disagree, the code wins and this file is the one to fix.**

## Brand & Style

The design system is engineered for a high-performance incentive management environment, blending the precision of corporate finance with the energy of a cutting-edge tech startup. The brand personality is authoritative yet rebellious, designed to evoke a sense of momentum and "earned reward."

The visual language utilizes a **Modern Glassmorphic** style. It relies on multi-layered depth, where data containers float over a deep, dark slate canvas. The "Edgy" aspect is introduced through non-linear layouts, asymmetric grid placements, and a high-vibrancy primary accent that cuts through the dark backgrounds. The result is a dashboard that feels less like a spreadsheet and more like a flight deck for business growth.

## Colors

The palette is anchored by the primary **Vibrant Lime (#c3cd17)**, which serves as the "hero" color for call-to-actions, progress indicators, and interactive highlights. 

- **Background Strategy:** The canvas is `surface` **#121414**; elevation tiers climb through `surface-container-low` **#1a1c1c**, `surface-container` **#1e2020** and `surface-container-high` **#282a2b**. Use the tokens above — never a literal hex in a screen.
- **Contrast:** Body text is `on-surface` **#e2e2e2** and secondary text `on-surface-variant` **#c8c8ae**. Pure white is not used: it glares against a canvas this dark.
- **Dark only:** `:root` declares `color-scheme: dark`. Without it the browser paints every native control (inputs, date pickers, scrollbars, `<select>` popups) with its light defaults. This is the root of the theme, not a detail — see `shared/zambon-base.html`.
- **No gradients:** Fills are solid. Lime→cyan or lime→yellow gradients were tried and dropped; they muddy the accent and read as decoration. "Glow" is done with `box-shadow` (`.glow-lime`), not with a gradient.

## Typography

This design system utilizes **Poppins** exclusively to maintain a clean, geometric sans-serif aesthetic. To achieve the "high-density" requirement, negative letter spacing (kerning) is applied to all headline and display styles.

- **Headlines:** Should be bold and tight, creating a "blocky" and impactful presence on the page.
- **Body:** Maintains a slightly more relaxed line height than headlines to ensure readability in data-heavy views, but retains a tight letter spacing to match the brand voice.
- **Labels:** Used for metadata and small button text, often uppercase when used for categorization to increase the "corporate/tech" feel.

## Layout & Spacing

The layout philosophy follows a **Fluid-Dynamic Grid**. While based on a 12-column structure, the system encourages "breaking the box" through the use of offset containers and varying card heights.

- **Rhythm:** A 4px baseline grid ensures vertical consistency.
- **Layout Model:** Use wide margins (32px+) to give the dashboard breathing room, contrasting the "tight" typography with "loose" spatial distribution.
- **Daring Layouts:** Important KPIs should occupy non-standard widths (e.g., a 5-column wide card next to a 7-column chart) to avoid the traditional "tile-only" dashboard look.

## Elevation & Depth

Depth is conveyed through **Glassmorphism and Tonal Layering** rather than traditional drop shadows.

- **Glass Surface:** Cards use `rgba(30, 32, 32, 0.6)` — `surface-container` at 60% — with `backdrop-filter: blur(20px)`. Encapsulated as `.glass-card`; do not reimplement it per screen.
- **Borders:** "Ghost borders" are essential. Instead of shadows, a 1px solid `rgba(255,255,255,0.06)`. Flat, not a gradient border.
- **Glows:** High-priority elements use a soft, primary-colored outer glow (bloom) to signify activity or success, creating a sense of neon-tech influence.

## Shapes

The shape language is consistently **Rounded**, striking a balance between organic and technical.

- **Containers:** Cards use `rounded-xl` (1.5rem); the sidebar and topbar are square-edged, anchored to the viewport.
- **Interactive Elements:** Buttons use `rounded` 1rem; inputs use 0.5rem — and `.z-input` rounds only the top corners (`0.5rem 0.5rem 0 0`) because its border lives on the bottom edge.
- **Accents:** Pills, progress bars and their fills are fully rounded (`9999px`).

## Components

Every component below lives in `shared/zambon-base.html`. Copy the class, don't restyle it in the screen.

- **Buttons (`.z-btn`):** `--primary` solid lime #c3cd17 on `on-primary` #303300; `--secondary` ghost with a 1px lime border; `--ghost` a white 5% fill. All three squeeze on click (`scale(0.97)`, 160ms).
- **Cards (`.glass-card`):** blur + ghost border. Nested cards are not used — a card inside a card reads as noise.
- **Input Fields (`.z-input`):** dark fill, bottom-only 2px border that turns lime on focus. `<select>` uses the same class, plus explicit rules for its `<option>`s so the native Windows popup doesn't paint them light.
- **Editable table cells (`.cell-input`):** for quota/weight/curve grids. The background is set explicitly, never `transparent`: browsers keep their white fill on `<input type="number">` otherwise. An empty cell shows a reddish border — a missing value is not a zero.
- **Progress bars (`.z-progress`):** 8px tall, solid `#c3cd17` fill, no gradient. They animate in with a 600ms `scaleX` and hold still afterwards: the dashboard is read many times a day, and a permanent pulse would be noise.
- **Pills (`.z-pill`):** `--active` lime, `--muted` grey, `--error` reddish for states and counters.
- **Icons:** Material Symbols Outlined at `wght 300`, single-colour. The active nav item fills its icon (`FILL 1`) instead of recolouring it.
- **Own dialogs:** `A.confirmAction()` and `A.promptForm()` from `shared/api.js`, never the browser's `alert`/`confirm`, which break the dark theme.

> **Not built:** earlier drafts described a component called *"The Pulse"* — a large real-time visualization with flowing gradients. It was never implemented and it contradicts the no-gradient rule above. It is listed here only so it isn't reintroduced from an old draft.

## Navigation

The sidebar is copied verbatim from `shared/zambon-sidebar.html`. Labels are in **Spanish** (`docs/diseno/diseno-frontend.md` §4), with a fixed icon per destination:

| Section | Icon | Target |
|---|---|---|
| Inicio | `dashboard` | `../home/code.html` |
| Cálculo | `calculate` | `../calculof/code.html` |
| Resultados | `analytics` | `../resultsf/code.html` |
| Reportes | `description` | `../reportesf/code.html` |
| Admin | `admin_panel_settings` | `../adminf/code.html` |

- **Active item:** add `z-nav-item--active` and `aria-current="page"`, and set the icon to `FILL 1`.
- **Profile:** the name and role are **never** written by hand. `ZambonAPI.fillSidebar()` fills the `data-user-name` and `data-user-role` attributes from the session (`GET /auth/me`); the `—` in the HTML is just the placeholder shown while it loads. A hardcoded name is a fake value on screen.
- **Permissions:** `requireAuth()` removes the sections the role cannot see, so screens never condition the menu themselves.