## A. Overview

CanvasStudio is a production-ready Vite + React (TS) application that recreates InShot's canvas workflow with extra framing controls. It ingests high-resolution imagery, preserves EXIF metadata, lets the user stage any aspect ratio (including custom/original), applies LUT color grading filters, and exports in sRGB at either canvas or source resolution.

## B. Feature List

- **Image ingestion**
  - Drag-and-drop or manual upload (supports multiple files, ready for filmstrip queue).
  - Each image gets a unique ID for queue management.
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
- **Image cropping**
  - Non-destructive crop with industry-standard overlay UI (transform + crop overlay model).
  - Crop mode toggle to enter/exit crop editing.
  - Aspect ratio presets: Free, 1:1, 3:2, 2:3, 4:5, 5:4, 16:9, 9:16, Original.
  - 8 resize handles (corners + edges) for precise crop adjustment with image-aware aspect locking.
  - Rule-of-thirds grid overlay during crop editing.
  - Drag inside crop area to reposition the crop selection.
  - Crop persists per-image and is applied during export.
- **Background colors**
  - Preset colors: White, Black, Light Gray, Dark Gray, Transparent.
  - Custom color via color picker and hex input.
- **LUT Filters**
  - Built-in color grading filters (Fujifilm F-Log to Rec709 conversions).
  - Custom filter upload (.cube format).
  - Real-time intensity control (0-100%) with smooth blending.
  - Per-image filter state (each image can have its own filter).
  - Cached filter processing for optimal performance during drag/resize.
  - Filters apply only to image pixels, preserving canvas background.
- **Export**
  - Format: PNG or JPEG (sRGB).
  - Quality presets (100%, 90%, 80%) plus custom slider (50–100%).
  - Resolution: Uses base dimensions derived from image width and selected ratio.
  - Coordinate transformation scales preview space to export space uniformly.
  - Pure export functions ready for batch export (`exportSingleImage`, `exportMultipleImages`).
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
      CropPanel.tsx            # Crop mode toggle and aspect presets
      ExportSettingsPanel.tsx  # Export format and quality settings
      FilterPanel.tsx          # LUT filter selection and intensity control
      RatioPanel.tsx           # Aspect ratio selection + custom inputs
      TransformPanel.tsx       # Position & scale controls
    image/
      CropOverlay.tsx          # Crop frame with resize handles (shown in crop mode)
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
      crop.ts                  # Pure crop math functions (cropToCanvasCoords, resizeCropFromHandle with imageAspect, etc.)
      math.ts                  # computeFitScale, computeDefaultScale, clamp
      ratios.ts                # Ratio catalog + findRatioValue helper
      render.ts                # Single draw routine for preview/export (with crop clipping and filter support)
      transform.ts             # Pure transform functions (computeInitialTransform, etc.)
    export/
      exportCanvas.ts          # Export pipeline (exportComposite, exportSingleImage, exportMultipleImages)
    filters/
      cache.ts                # Filter image caching (generateFilteredImageFull)
      formats/
        base.ts               # Base loader class for filter formats
        cube.ts               # .cube format loader and parser
        index.ts              # Format loader exports
      index.ts                # Public filter API exports
      loader.ts               # Filter loader registry and interface
      presets.ts              # Built-in filter definitions and metadata
      processor.ts            # LUT application logic (trilinear interpolation)
    image/
      loadImage.ts            # EXIF parsing + image loader (loadImageFromFile, loadImagesFromFiles)
  state/
    canvasStore.ts             # Zustand store (single source of truth)
  types/
    canvas.ts                  # Canvas-related types (ratios, borders, transform)
    filter.ts                  # Filter-related types (LUTData, FilterState, FilterMetadata)
    image.ts                   # ImageMetadata, ImageState types
```

Additional root files: `FEATURES_AND_STRUCTURE.md`, `README.md`, `tailwind.config.js`, `postcss.config.js`, `vite.config.ts`.

## D. Architecture Decisions

1. **Zustand for state** – Lightweight global store keeps gesture handlers and UI controls in sync without prop drilling.

2. **Four-layer architecture** – Workspace (checkerboard background, never exported) → Canvas (white rectangle, export area) → ImageLayer (user-imported image, draggable/scalable) → CropOverlay (shown only in crop mode).

3. **Single source of truth for scaling** – The store controls all scale initialization via `_needsInitialFit` flag and `fitCurrentImageToPreview()`. ImageLayer is a pure display component that never calculates or initializes scale.

4. **Pure transform functions** – `lib/canvas/transform.ts` contains stateless functions that work with any image:
   - `computeInitialTransform(image, canvasWidth, canvasHeight)` – Calculate initial fit transform
   - `createImageSnapshot(params)` – Create export snapshot for any image
   - `applySnapToTransform(transform, centerSnap)` – Apply center snapping
   - `mergeTransform(current, partial)` – Merge transform updates
   - `applyPositionDelta(transform, delta)` – Apply position changes

5. **Centralized constants** – All magic numbers live in `lib/canvas/constants.ts`:
   - `SCALE.DEFAULT_MULTIPLIER = 0.95` (95% of fit)
   - `SCALE.MIN = 0.05`, `SCALE.MAX = 8`
   - `CANVAS.DEFAULT_BASE_WIDTH = 1600`
   - `RESIZE.ASPECT_RATIO_THRESHOLD = 0.01` (triggers refit on ratio change)
   - `SNAP.THRESHOLD = 2` (pixels for center snapping)

6. **Predictable initialization flow**:
   1. `loadImage()` → stores image with unique ID, sets `_needsInitialFit: true`
   2. Canvas renders → reports size via `setPreviewSize()`
   3. `setPreviewSize()` → if `_needsInitialFit`, calls `fitCurrentImageToPreview()`
   4. ImageLayer → pure render, reads state only

7. **Two coordinate systems**:
   - **Preview space**: Actual screen pixels (responsive to window size)
   - **Export space**: Fixed resolution based on image dimensions and ratio
   - Export transforms preview coordinates to export coordinates uniformly

8. **Separation of canvas settings vs image state** – Store cleanly separates:
   - **CanvasSettings**: ratioId, customRatio, background, centerSnap, cropMode, exportOptions, previewSize (shared across all images)
   - **ActiveImageState**: image, transform, crop, filter, isEdited (per-image in filmstrip queue)

9. **Shared renderer** – `renderScene` is used by both the live canvas and the exporter, ensuring WYSIWYG parity. Handles filter application with cached filtered images (generated once when filter is applied) and real-time intensity blending (no reprocessing during intensity changes).

10. **Modular controls** – Each concern (import, ratio, transform, filter, background, export) lives in its own component.

11. **Pointer-based gestures** – Direct pointer event handling for drag/zoom provides precise control.

12. **Extensible for filmstrip queue** – Architecture is ready for multi-image support:
    - `ImageMetadata` has unique `id` field
    - `ImageState` type bundles image + transform + crop + filter + isEdited flag
    - `loadImagesFromFiles()` can load multiple images
    - `exportSingleImage()` / `exportMultipleImages()` for batch export
    - Dropzone accepts multiple files

13. **Extensible filter system** – Plugin-based architecture for filter formats:
    - `FilterLoader` interface allows easy addition of new formats (cube, 3dl, png, json)
    - `FilterLoaderRegistry` manages format detection and loading
    - Filter processing separated from loading/parsing
    - Cached filtered images for performance (generated once, reused during interactions)
    - Real-time intensity blending (no reprocessing needed)
    - Per-filter recommended intensity support

14. **Non-destructive crop system** – Follows industry-standard transform + crop overlay model:
    - `CropState` stored per-image (normalized 0-1 coordinates)
    - Crop is independent from transform (zoom/pan applies to full image)
    - `lib/canvas/crop.ts` contains pure functions for crop math
    - Rendering applies crop as clipping mask via `cropToCanvasCoords()`
    - Aspect ratio locking with common presets (1:1, 3:2, 4:5, 16:9, etc.)
    - **Image-aware aspect calculations**: `resizeCropFromHandle` converts target pixel aspect to normalized aspect using `normalizedAspect = lockedAspect / imageAspect`, ensuring crops maintain correct visual proportions regardless of source image dimensions
    - Template-ready: templates can set crop constraints, users adjust framing

## E. Roadmap

- **Photo templates** – Vintage film frames (Kodak, Polaroid, Instax), social media templates, and custom overlays that auto-set canvas ratio, crop constraints, and frame graphics.
- **Filmstrip queue** – Multi-image import with thumbnail strip, per-image transforms, batch export.
- **Filter enhancements**:
  - WebGL shader acceleration for faster processing on large images
  - Additional format support (3DL, PNG LUT, JSON)
  - Filter categories and search
  - Filter stacking (multiple filters with blend modes)
  - Filter presets (save filter + intensity combinations)
- **Multi-background system** – Extend background picker with gradients, textures, and color palettes tied to brand presets.
- **Preset management** – Allow saving/loading custom ratio + border + transform presets per social network.
- **Collaboration hooks** – Shareable links or JSON exports for designers to hand off settings.
- **Undo/redo** – Add history stack for transform and filter operations.

## F. Coding Conventions

- TypeScript-first, strict typing for every exported helper.
- Tailwind utility classes for layout; shared colors live in `tailwind.config.js`.
- Constants extracted to `lib/canvas/constants.ts` – no magic numbers in components.
- Pure functions in `lib/` – stateless, testable, reusable with any data.
- Kommentar policy: concise top-of-module or block comments for every major subsystem.
- Zustand setters must remain pure (returning new slices) to keep time-travel/debugging reliable.
- Reuse helpers (e.g., `computeFitScale`, `renderScene`, `createImageSnapshot`) everywhere to avoid drift between preview/export.
- Components should be pure display; all state logic belongs in the store.

## G. How to Contribute / Extend

1. **Install & run** – `yarn`, `yarn dev`.
2. **Add features** – Drop new logic under `lib/` as pure functions first, then bind to store/UI.
3. **Add constants** – New magic numbers go in `lib/canvas/constants.ts`.
4. **Add types** – New data structures go in `types/` with clear documentation.
5. **Update docs** – Every feature change requires touching this file plus README when workflow changes.
6. **Testing** – Run `yarn build` before opening a PR to ensure TypeScript + Vite succeed.
7. **Accessibility & performance** – Favor keyboard access, memoized selectors, and defer heavyweight work off the main render.

---

## UPDATE TEMPLATE FOR CURSORAI

Whenever new features, components, or architecture changes are introduced, update this file by rewriting the relevant sections. Keep the documentation consistent with the latest codebase.
