## A. Overview

CanvasStudio is a production-ready Vite + React (TS) application that recreates InShot’s canvas workflow with extra framing controls. It ingests high-resolution imagery, preserves EXIF metadata, lets the user stage any aspect ratio (including custom/original), and exports in sRGB at either canvas or source resolution.

## B. Feature List

- **Image ingestion**
  - Drag-and-drop or manual upload (single file, any image mime type).
  - Reads and surfaces key EXIF tags (e.g., camera model).
  - Caches an `HTMLImageElement` to keep the original resolution for export.
- **Canvas ratios**
  - Presets: 1:1, 3:2, 2:3, 4:5, 9:16.
  - Original ratio (enabled once an image is present).
  - Custom ratio via width/height inputs; switching is instant and non-destructive.
- **Positioning + scale**
  - Drag (pointer or touch) to reposition.
  - Scroll wheel, Shift + drag, or pinch gestures to scale while maintaining aspect ratio.
  - Center-snap toggle, Auto Fit toggle, and Reset (or `R`) shortcut.
- **Adjustable top/bottom borders**
  - Independent height inputs with px/% units.
  - Auto-calculates the minimum scale so the visible portion always remains covered.
  - Keeps user translation unless Auto Fit is enabled (then recenters between borders).
- **Export**
  - Format: PNG or JPEG (sRGB).
  - Quality presets plus custom slider (50–100%).
  - Resolution modes: “Scale to Original” (match source pixels) or “Use Canvas Size”.
  - Keyboard shortcut `Cmd/Ctrl + E`.
- **Keyboard shortcuts**
  - `Cmd/Ctrl + E` export, `R` reset, `Shift + drag` zoom modifier, `Shift + scroll` for precision zoom (wheel handler already scales, shift boosts control).
- **UI & layout**
  - Canvas centered with responsive scaling (max-width guard).
  - Control stack on the right (desktop) / stacked (mobile) and a sticky mobile toolbar.

## C. File Structure

```
src/
  components/
    BottomToolbar.tsx        # Mobile-first quick actions
    KeyboardShortcuts.tsx    # Global keymap bindings
    canvas/CanvasStage.tsx   # Rendering surface + gestures
    controls/                # Modular control groups
      BorderPanel.tsx
      ControlPanel.tsx
      ExportPanel.tsx
      ImportPanel.tsx
      RatioPanel.tsx
      TransformPanel.tsx
  hooks/
    useExportImage.ts        # Shared export logic
    useResizeObserver.ts     # Layout measurement helper
  lib/
    canvas/
      math.ts                # Shared math helpers
      ratios.ts              # Ratio catalog + helpers
      render.ts              # Single draw routine
    export/exportCanvas.ts   # Export pipeline
    image/loadImage.ts       # EXIF + image loader
  state/canvasStore.ts       # Zustand store + helpers
  types/                     # Shared DTOs
```

Additional root files: `FEATURES_AND_STRUCTURE.md`, `README.md`, `tailwind.config.js`, `postcss.config.js`.

## D. Architecture Decisions

1. **Zustand for state** – Lightweight global store keeps gesture handlers and UI controls in sync without prop drilling.
2. **Canvas base coordinate system** – Transform state is stored relative to the original image resolution so exports and preview remain pixel-identical.
3. **Shared renderer** – `renderScene` is used by both the live canvas and the exporter, ensuring WYSIWYG parity.
4. **Modular controls** – Each requirement (import, ratio, transform, borders, export) lives in its own component to keep future additions isolated.
5. **Gesture layer via `@use-gesture/react`** – One binding handles drag, pinch, wheel, and modifier gestures across desktop/mobile.
6. **Documentation-driven** – This file plus README act as living specs so future contributors know exactly how to extend the system.

## E. Roadmap

- **Filters & adjustments** – Integrate GPU-accelerated filters (WebGL or Canvas2D) with stackable adjustment layers.
- **Cropping modes** – Add explicit crop handles separate from canvas ratios to isolate subject framing.
- **Multi-background system** – Extend background picker with gradients, textures, and color palettes tied to brand presets.
- **Preset management** – Allow saving/loading custom ratio + border + transform presets per social network.
- **Collaboration hooks** – Shareable links or JSON exports for designers to hand off settings.

## F. Coding Conventions

- TypeScript-first, strict typing for every exported helper.
- Tailwind utility classes for layout; shared colors live in `tailwind.config.js`.
- Kommentar policy: concise top-of-module or block comments for every major subsystem.
- Zustand setters must remain pure (returning new slices) to keep time-travel/debugging reliable.
- Reuse helpers (e.g., `convertBorderToBasePx`, `renderScene`) everywhere to avoid drift between preview/export.

## G. How to Contribute / Extend

1. **Install & run** – `yarn`, `yarn dev`.
2. **Add features** – Drop new logic under `lib/` or `state/` first, then bind UI.
3. **Update docs** – Every feature change requires touching this file (see template below) plus README when workflow changes.
4. **Testing** – Run `yarn build` before opening a PR to ensure TypeScript + Vite succeed.
5. **Accessibility & performance** – Favor keyboard access, memoized selectors, and defer heavyweight work off the main render.

---

## UPDATE TEMPLATE FOR CURSORAI

Whenever new features, components, or architecture changes are introduced, update this file by rewriting the relevant sections. Keep the documentation consistent with the latest codebase.

