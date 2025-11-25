# CanvasStudio

CanvasStudio is a professional-grade canvas editor inspired by InShot’s Canvas feature. Import a high-resolution photo, reframe it across multiple aspect ratios, add custom top/bottom borders, and export in sRGB at either original or canvas resolution.

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 3 for layout + design tokens
- Zustand for global state and gesture coordination
- `@use-gesture/react` for drag / pinch / scroll support
- EXIF parsing powered by `exifr`

## Installation

```bash
yarn
```

## Development

```bash
# Start Vite in dev mode
yarn dev

# Type-check and bundle for production
yarn build
```

The dev server runs on `http://localhost:5173` by default.

## Image Controls
- Import any image; it auto-fits inside the canvas without cropping.
- Use the Position & Scale panel to:
  - Edit width/height (px) with optional aspect lock.
  - Adjust scale relative to the fitted size (`-100%` to shrink, `+100%` to zoom).
  - Recenter or Auto Fit at any time to snap back to contain.

## Screenshots

> _Add final UI captures or GIFs here once design reviews complete._

## How to Contribute

1. Fork/branch from `main`.
2. Implement core logic inside `src/state` or `src/lib`, then wire up UI components.
3. Run `yarn build` before opening a PR to ensure the TypeScript + Vite pipeline passes.
4. Update `FEATURES_AND_STRUCTURE.md` plus this README whenever behavior or architecture changes.
5. Prefer small, reviewable commits and reference specs/issues when applicable.

## Documentation

All architecture decisions, roadmap entries, coding conventions, and the “Update MD” template live in `FEATURES_AND_STRUCTURE.md`. Keep that file in sync with any new feature work.
