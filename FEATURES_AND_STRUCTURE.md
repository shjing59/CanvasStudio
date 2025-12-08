## A. Overview

CanvasStudio is a production-ready Vite + React (TS) application that recreates InShot's canvas workflow with extra framing controls. It ingests high-resolution imagery, preserves EXIF metadata, lets the user stage any aspect ratio (including custom/original), and exports in sRGB at either canvas or source resolution.

## B. Feature List

- **Image ingestion**
  - Drag-and-drop or manual upload (single file, any image mime type).
  - Reads and surfaces key EXIF tags (e.g., camera model).
  - Caches an `HTMLImageElement` to keep the original resolution for export.
- **Canvas ratios**
  - Presets: 1:1, 3:2, 2:3, 5:4, 4:5, 16:9, 9:16.
  - Original ratio (enabled once an image is present).
  - Custom ratio via width/height inputs (validated 1-100 range); switching is instant and non-destructive.
- **Positioning + scale**
  - **Initial image import**: Images are automatically fitted to canvas at 95% of fit scale (leaving a small border visible). They start centered with the fitted scale applied.
  - **Manual controls**:
    - Scale slider represents `-100% … 0 … +100%` relative to the fitted size (negative = shrink, positive = zoom).
    - Drag (pointer events) to reposition, scroll wheel to zoom (cursor-centered), Shift + drag for centered zoom.
  - **Transform system**: Uses CSS positioning with calculated offsets based on scale and translation.
    - Image uses exact natural pixel dimensions; transform scale applies on top.
    - Auto Fit button recomputes the fit scale (95%) and recenters instantly; Recenter snaps translation back to `0,0`.
    - Center Snap toggles translation snapping near center (2px threshold); Reset restores fit scale and center.
- **Background colors**
  - Preset colors: White, Black, Light Gray, Dark Gray, Transparent.
  - Custom color via color picker and hex input.
- **Export**
  - Format: PNG or JPEG (sRGB).
  - Quality presets (100%, 90%, 80%) plus custom slider (50–100%).
  - Resolution: Uses base dimensions derived from image width and selected ratio.
  - Coordinate transformation scales preview space to export space uniformly.
- **UI & layout**
  - Canvas centered with responsive scaling (min 240px, max 1400px width).
  - Control panel on the right with collapsible drawer.
  - Bottom toolbar with Import/Replace, Center Snap toggle, and Export/Share button.

## C. File Structure

```
src/
  components/
    BottomToolbar.tsx          # Quick actions bar (import, snap, export)
    canvas/
      Canvas.tsx               # White rectangle representing export area
      CanvasStage.tsx          # Orchestrates Workspace + Canvas + ImageLayer
    controls/                  # Modular control groups
      BackgroundPanel.tsx      # Background color selection
      BorderPanel.tsx          # Top/bottom border controls (currently unused)
      ControlPanel.tsx         # Container for all control panels
      ExportSettingsPanel.tsx  # Export format and quality settings
      RatioPanel.tsx           # Aspect ratio selection + custom inputs
      TransformPanel.tsx       # Position & scale controls
    image/
      ImageLayer.tsx           # User-imported image (pure display + gestures)
    ui/
      PanelSection.tsx         # Reusable panel wrapper
      PresetButtons.tsx        # Reusable preset button group
      ToggleButton.tsx         # Reusable toggle button
    workspace/
      Workspace.tsx            # Checkerboard background (never exported)
  constants/
    presets.ts                 # UI presets for backgrounds, etc.
  hooks/
    useExportImage.ts          # Shared export logic with Web Share API
    useResizeObserver.ts       # Layout measurement helper
  lib/
    canvas/
      constants.ts             # Centralized constants (SCALE, CANVAS, RESIZE, etc.)
      math.ts                  # computeFitScale, computeDefaultScale, clamp
      ratios.ts                # Ratio catalog + findRatioValue helper
      render.ts                # Single draw routine for preview/export
    export/
      exportCanvas.ts          # Export pipeline with coordinate transformation
    image/
      loadImage.ts             # EXIF parsing + image loader
  state/
    canvasStore.ts             # Zustand store (single source of truth)
  types/
    canvas.ts                  # Canvas-related types (ratios, borders, transform)
    image.ts                   # ImageMetadata type
```

Additional root files: `FEATURES_AND_STRUCTURE.md`, `README.md`, `tailwind.config.js`, `postcss.config.js`, `vite.config.ts`.

## D. Architecture Decisions

1. **Zustand for state** – Lightweight global store keeps gesture handlers and UI controls in sync without prop drilling.

2. **Three-layer architecture** – Workspace (checkerboard background, never exported) → Canvas (white rectangle, export area) → ImageLayer (user-imported image, draggable/scalable).

3. **Single source of truth for scaling** – The store controls all scale initialization via `_needsInitialFit` flag and `fitImageToPreview()`. ImageLayer is a pure display component that never calculates or initializes scale.

4. **Centralized constants** – All magic numbers live in `lib/canvas/constants.ts`:
   - `SCALE.DEFAULT_MULTIPLIER = 0.95` (95% of fit)
   - `SCALE.MIN = 0.05`, `SCALE.MAX = 8`
   - `CANVAS.DEFAULT_BASE_WIDTH = 1600`
   - `RESIZE.ASPECT_RATIO_THRESHOLD = 0.01` (triggers refit on ratio change)
   - `SNAP.THRESHOLD = 2` (pixels for center snapping)

5. **Predictable initialization flow**:
   1. `loadImage()` → stores image, sets `_needsInitialFit: true`
   2. Canvas renders → reports size via `setPreviewSize()`
   3. `setPreviewSize()` → if `_needsInitialFit`, calls `fitImageToPreview()`
   4. ImageLayer → pure render, reads state only

6. **Two coordinate systems**:
   - **Preview space**: Actual screen pixels (responsive to window size)
   - **Export space**: Fixed resolution based on image dimensions and ratio
   - Export transforms preview coordinates to export coordinates uniformly

7. **Shared renderer** – `renderScene` is used by both the live canvas and the exporter, ensuring WYSIWYG parity.

8. **Modular controls** – Each concern (import, ratio, transform, background, export) lives in its own component.

9. **Pointer-based gestures** – Direct pointer event handling for drag/zoom provides precise control.

## E. Roadmap

- **Filters & adjustments** – Integrate GPU-accelerated filters (WebGL or Canvas2D) with stackable adjustment layers.
- **Cropping modes** – Add explicit crop handles separate from canvas ratios to isolate subject framing.
- **Multi-background system** – Extend background picker with gradients, textures, and color palettes tied to brand presets.
- **Preset management** – Allow saving/loading custom ratio + border + transform presets per social network.
- **Collaboration hooks** – Shareable links or JSON exports for designers to hand off settings.
- **Undo/redo** – Add history stack for transform operations.

## F. Coding Conventions

- TypeScript-first, strict typing for every exported helper.
- Tailwind utility classes for layout; shared colors live in `tailwind.config.js`.
- Constants extracted to `lib/canvas/constants.ts` – no magic numbers in components.
- Kommentar policy: concise top-of-module or block comments for every major subsystem.
- Zustand setters must remain pure (returning new slices) to keep time-travel/debugging reliable.
- Reuse helpers (e.g., `computeFitScale`, `renderScene`) everywhere to avoid drift between preview/export.
- Components should be pure display; all state logic belongs in the store.

## G. How to Contribute / Extend

1. **Install & run** – `yarn`, `yarn dev`.
2. **Add features** – Drop new logic under `lib/` or `state/` first, then bind UI.
3. **Add constants** – New magic numbers go in `lib/canvas/constants.ts`.
4. **Update docs** – Every feature change requires touching this file plus README when workflow changes.
5. **Testing** – Run `yarn build` before opening a PR to ensure TypeScript + Vite succeed.
6. **Accessibility & performance** – Favor keyboard access, memoized selectors, and defer heavyweight work off the main render.

---

## UPDATE TEMPLATE FOR CURSORAI

Whenever new features, components, or architecture changes are introduced, update this file by rewriting the relevant sections. Keep the documentation consistent with the latest codebase.
