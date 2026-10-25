# Design record — Exaggerated Minimalism

Built. This records the decisions and where they came from, so the next change
does not have to re-derive them.

Source: the `ui-ux-pro-max` skill
(github.com/nextlevelbuilder/ui-ux-pro-max-skill), queried against its local
`styles.csv`, `typography.csv`, `colors.csv`, `motion.csv` and
`google-fonts.csv`.

## Style — Exaggerated Minimalism (`styles.csv`, row 47)

Chosen over Swiss Modernism, Editorial Grid and Academia. Spec as written:

- Primary colors: `#000000`, `#FFFFFF`, **single vibrant accent only**
- `font-size: clamp(3rem, 10vw, 12rem)`, `font-weight: 900`,
  `letter-spacing: -0.05em`, massive whitespace
- "no secondary colors, extreme restraint"

The accent is the only colour on the page. The photograph is desaturated so it
does not break that rule.

## Type

- Display: **Big Shoulders** — variable, `opsz 10..72`, `wght 100..900`,
  condensed. From the skill's `google-fonts.csv`.
- Body: **Public Sans**.
- Deliberately not Archivo, Space Grotesk or Inter. The skill's aggregate
  generator suggested Archivo/Space Grotesk; that was rejected because the
  previous, rejected design already used Archivo and Space Grotesk is a common
  generated-design tell.

## Colour and contrast

Two accent tones, because one cannot do both jobs:

| Token | Value | Use | On white |
| --- | --- | --- | --- |
| `--accent` | `#ff3d00` | display type ≥24px, numerals, rules | 3.55 (passes ≥3:1 for large) |
| `--accent-ink` | `#d92f00` | buttons, small text, hovers | 4.82 (passes ≥4.5:1) |
| `--fg-3` | `#6b6b6b` | muted copy | 5.33 |
| `--fg-2` | `#3d3d3d` | body copy | 10.86 |

Buttons use `--accent-ink`: their label is 13px bold, which is **not** "large
text", so white on `#ff3d00` (3.55) would have failed.

## Motion — GSAP 3.13.0, "Complex" tier (`motion.csv`)

Loaded from cdnjs, pinned. Everything uses `gsap.from()`, so the page renders
complete without JS and nothing is invisible by default.

1. **SplitText** on the name — chars, `stagger 0.015`, `expo.out`. Reverted on
   cleanup so screen readers get the original text nodes.
2. **One pinned, scrub-driven section** — the hero, `scrub: 1`, desktop only.
   The skill's rule is at most 1–2 pinned sections per page.
3. Section headings wipe up; `[data-reveal]` containers stagger, capped at 9
   children.
4. All of it inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`.
5. `ScrollTrigger.refresh()` after `document.fonts.ready` and on `load`,
   because pinning needs the final layout height.

## Checklist (the skill's own, verified)

- [x] No emoji as icons
- [x] `cursor-pointer` on clickable elements
- [x] Hover transitions 180–200ms
- [x] Light-mode text contrast ≥ 4.5:1 (table above)
- [x] Visible keyboard focus — 3px accent outline
- [x] `prefers-reduced-motion` respected
- [x] Responsive at 375 / 768 / 1024 / 1440, plus an intermediate type step at
      56–78rem so the name clears the photograph

## Rejected

The first build — dark navy `#0d141c` with amber `#f2b544`, Archivo and IBM
Plex Mono, terminal/ledger framing — read as generic AI output. Do not return
to: dark background plus a single bright accent, monospace as label
decoration, or uniform bordered cards.
