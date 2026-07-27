<!--
  Zambon OS — Shared Tailwind theme + design tokens.
  Include this block verbatim in the <head> of every page, right after the
  Tailwind CDN <script>. It is the single source of truth for colors,
  typography, spacing, radii and animation. Do NOT redefine these inline.

  Usage in each HTML page:
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    ...paste the <script id="tailwind-config"> and <style id="zambon-base"> blocks below...
-->
<script id="tailwind-config">
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          // Surfaces (dark tonal ladder)
          "background": "#121414",
          "on-background": "#e2e2e2",
          "surface": "#121414",
          "surface-dim": "#121414",
          "surface-bright": "#37393a",
          "surface-container-lowest": "#0c0f0f",
          "surface-container-low": "#1a1c1c",
          "surface-container": "#1e2020",
          "surface-container-high": "#282a2b",
          "surface-container-highest": "#333535",
          "surface-variant": "#333535",
          "on-surface": "#e2e2e2",
          "on-surface-variant": "#c8c8ae",
          "inverse-surface": "#e2e2e2",
          "inverse-on-surface": "#2f3131",
          "surface-tint": "#c5cf1b",
          // Primary (hero lime)
          "primary": "#dfea3a",
          "on-primary": "#303300",
          "primary-container": "#c3cd17",
          "on-primary-container": "#505500",
          "primary-fixed": "#e1ec3d",
          "primary-fixed-dim": "#c5cf1b",
          "on-primary-fixed": "#1b1d00",
          "on-primary-fixed-variant": "#464a00",
          "inverse-primary": "#5e6300",
          // Secondary / tertiary
          "secondary": "#c2c7ce",
          "on-secondary": "#2c3136",
          "secondary-container": "#42474d",
          "on-secondary-container": "#b1b5bc",
          "secondary-fixed": "#dee3ea",
          "secondary-fixed-dim": "#c2c7ce",
          "on-secondary-fixed": "#171c21",
          "on-secondary-fixed-variant": "#42474d",
          "tertiary": "#dae1eb",
          "on-tertiary": "#2a3139",
          "tertiary-container": "#bec5cf",
          "on-tertiary-container": "#4b525a",
          "tertiary-fixed": "#dce3ed",
          "tertiary-fixed-dim": "#c0c7d1",
          "on-tertiary-fixed": "#151c24",
          "on-tertiary-fixed-variant": "#404750",
          // Outline / error
          "outline": "#92927a",
          "outline-variant": "#474834",
          "error": "#ffb4ab",
          "on-error": "#690005",
          "error-container": "#93000a",
          "on-error-container": "#ffdad6"
        },
        borderRadius: {
          // Reconciled with DESIGN.md (was contradicting the HTML configs).
          "DEFAULT": "0.5rem",
          "sm": "0.25rem",
          "md": "0.75rem",
          "lg": "1rem",
          "xl": "1.5rem",
          "full": "9999px"
        },
        spacing: {
          "unit": "4px",
          "xs": "0.5rem",
          "sm": "1rem",
          "md": "1.5rem",
          "lg": "2.5rem",
          "xl": "4rem",
          "gutter": "24px",
          "margin": "32px"
        },
        fontFamily: {
          "display-xl": ["Poppins"],
          "headline-lg": ["Poppins"],
          "headline-md": ["Poppins"],
          "body-lg": ["Poppins"],
          "body-md": ["Poppins"],
          "label-bold": ["Poppins"],
          "label-sm": ["Poppins"]
        },
        fontSize: {
          "display-xl": ["48px", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "700" }],
          "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "600" }],
          "headline-md": ["24px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
          "body-lg": ["18px", { lineHeight: "1.6", letterSpacing: "-0.01em", fontWeight: "400" }],
          "body-md": ["16px", { lineHeight: "1.5", letterSpacing: "-0.01em", fontWeight: "400" }],
          "label-bold": ["14px", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "600" }],
          "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.01em", fontWeight: "500" }]
        },
        zIndex: {
          // Semantic scale — never 999/9999.
          "dropdown": "1000",
          "sticky": "1100",
          "modal-backdrop": "1200",
          "modal": "1300",
          "toast": "1400",
          "tooltip": "1500"
        }
      }
    }
  }
</script>
