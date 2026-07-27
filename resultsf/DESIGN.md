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

## Brand & Style

The design system is engineered for a high-performance incentive management environment, blending the precision of corporate finance with the energy of a cutting-edge tech startup. The brand personality is authoritative yet rebellious, designed to evoke a sense of momentum and "earned reward."

The visual language utilizes a **Modern Glassmorphic** style. It relies on multi-layered depth, where data containers float over a deep, dark slate canvas. The "Edgy" aspect is introduced through non-linear layouts, asymmetric grid placements, and a high-vibrancy primary accent that cuts through the dark backgrounds. The result is a dashboard that feels less like a spreadsheet and more like a flight deck for business growth.

## Colors

The palette is anchored by the primary **Vibrant Lime (#c3cd17)**, which serves as the "hero" color for call-to-actions, progress indicators, and interactive highlights. 

- **Background Strategy:** The interface uses a deep **Dark Slate (#1a1f24)** as the foundation. Secondary elevation tiers use **Charcoal (#2d343c)** to create subtle separation without relying on heavy borders.
- **Contrast:** Pure whites are reserved for primary headers and high-priority data points to ensure maximum legibility against the dark backdrop.
- **Gradients:** Use subtle linear gradients moving from the primary lime to a slightly more yellowish hue for "glowing" interactive states and glassmorphic background accents.

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

- **Glass Surface:** Cards use a semi-transparent fill (e.g., `rgba(45, 52, 60, 0.6)`) with a `backdrop-filter: blur(20px)`.
- **Borders:** "Ghost borders" are essential. Instead of shadows, use 1px solid borders with a very low opacity white or a subtle gradient that catches "light" from the top-left corner.
- **Glows:** High-priority elements use a soft, primary-colored outer glow (bloom) to signify activity or success, creating a sense of neon-tech influence.

## Shapes

The shape language is consistently **Rounded**, striking a balance between organic and technical.

- **Containers:** Dashboard cards and main navigation elements use the `rounded-lg` (1rem) setting.
- **Interactive Elements:** Buttons and input fields use the standard `rounded` (0.5rem) setting to feel precise.
- **Accents:** Small decorative elements or progress bar end-caps should use pill-shaping (full rounding) to contrast the more structural card shapes.

## Components

- **Buttons:** Primary buttons are solid lime (#c3cd17) with black text. Secondary buttons are ghost-style with a 1px lime border and white text. Use a "squeeze" animation on click for a tactile feel.
- **Cards:** Must feature the glassmorphic blur and a subtle 1px border. Background should be slightly lighter than the main canvas.
- **Input Fields:** Dark slate background with a bottom-only border that glows lime when focused.
- **Incentive Progress Bars:** Thick, 12px height bars with a gradient fill (Lime to Cyan-Green) and a subtle pulse animation for "active" incentives.
- **Icons:** Thin-stroke (1.5pt) vector icons. Use "Duotone" style where one element of the icon is the primary lime and the rest is white/grey.
- **Custom Component - "The Pulse":** A large, dynamic visualization area for real-time incentive tracking that uses organic, flowing gradients and high-density typography for "big numbers."