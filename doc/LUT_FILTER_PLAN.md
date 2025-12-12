# LUT Filter System - Implementation Plan

## Overview

This document outlines the architecture and implementation plan for adding LUT (Look-Up Table) filter support to CanvasStudio. The design prioritizes:
- **Extensibility**: Easy to add new filter formats (cube, 3dl, png, json, etc.)
- **Non-breaking**: Zero impact on existing features
- **Performance**: Efficient real-time preview and export
- **Per-image**: Filters stored per image (like transform/crop)

## Architecture Design

### Core Principles

1. **Plugin Pattern**: Format-specific loaders implement a common interface
2. **Separation of Concerns**: Loading, parsing, and application are separate
3. **State Management**: Filters stored per-image in `ImageState`
4. **Rendering Integration**: Filters applied in `renderScene` for preview and export
5. **Lazy Processing**: Filter processing only when needed

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Filter System Architecture               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   UI Layer   │────▶│  State Store │────▶│   Renderer  │ │
│  │ FilterPanel  │     │ ImageState   │     │ renderScene │ │
│  └──────────────┘     └──────────────┘     └─────────────┘ │
│         │                      │                    │       │
│         │                      │                    │       │
│         ▼                      ▼                    ▼       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Filter Processing Pipeline                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  ┌─────────────┐    ┌──────────────┐   ┌──────────┐ │  │
│  │  │   Loader    │───▶│   Parser     │──▶│ Processor │ │  │
│  │  │  Interface  │    │  (format-     │   │  (LUT     │ │  │
│  │  │             │    │   specific)   │   │   apply)  │ │  │
│  │  └─────────────┘    └──────────────┘   └──────────┘ │  │
│  │       ▲                                              │  │
│  │       │                                              │  │
│  │  ┌────┴────┬─────────┬─────────┬─────────┐          │  │
│  │  │ Cube    │ 3DL     │ PNG     │ JSON    │ ...      │  │
│  │  │ Loader  │ Loader  │ Loader  │ Loader  │          │  │
│  │  └─────────┴─────────┴─────────┴─────────┘          │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
CanvasStudio/
├── public/
│   └── filters/                        # Built-in .cube filter files
│       ├── vintage.cube
│       ├── black-white.cube
│       └── ...
├── src/
│   ├── lib/
│   │   └── filters/
│   │       ├── index.ts                # Public API exports
│   │       ├── types.ts                # Core filter types
│   │       ├── loader.ts               # Loader interface & registry
│   │       ├── processor.ts            # LUT application logic
│   │       ├── presets.ts              # Built-in filter registry
│   │       ├── formats/
│   │       │   ├── index.ts            # Format loader exports
│   │       │   ├── base.ts             # Base loader class
│   │       │   ├── cube.ts             # .cube format loader
│   │       │   ├── png.ts              # PNG LUT loader (future)
│   │       │   ├── json.ts             # JSON LUT loader (future)
│   │       │   └── 3dl.ts              # 3DL format loader (future)
│   │       └── utils.ts                # Helper functions
│   ├── types/
│   │   └── filter.ts                   # Filter-related type definitions
│   ├── components/
│   │   └── controls/
│   │       └── FilterPanel.tsx         # Filter selection UI
│   └── state/
│       └── canvasStore.ts              # Add filter state management
```

**See `doc/FILTER_FILES_GUIDE.md` for detailed instructions on adding cube files.**

## Type Definitions

### Core Types

```typescript
// types/filter.ts

/**
 * Normalized LUT data structure (3D RGB lookup table)
 * All values are normalized 0-1, regardless of source format
 */
export interface LUTData {
  /** LUT size (e.g., 32 for 32x32x32 cube) */
  size: number
  /** RGB values in [R, G, B] format, length = size^3 * 3 */
  data: Float32Array
  /** Optional metadata from source file */
  metadata?: {
    title?: string
    domainMin?: [number, number, number]
    domainMax?: [number, number, number]
  }
}

/**
 * Filter state stored per image
 */
export interface FilterState {
  /** Unique filter ID (null = no filter) */
  filterId: string | null
  /** Cached LUT data (null if not loaded) */
  lutData: LUTData | null
  /** Filter intensity (0-1, default 1.0) */
  intensity: number
}

/**
 * Filter metadata (for UI display)
 */
export interface FilterMetadata {
  id: string
  name: string
  format: FilterFormat
  source: 'builtin' | 'user'
  filePath?: string
  thumbnail?: string
}

/**
 * Supported filter formats
 */
export type FilterFormat = 'cube' | '3dl' | 'png' | 'json'

/**
 * Loader result
 */
export interface LoaderResult {
  lutData: LUTData
  metadata?: Partial<FilterMetadata>
}
```

### Loader Interface

```typescript
// lib/filters/loader.ts

/**
 * Base interface for all filter format loaders
 */
export interface FilterLoader {
  /** Format identifier */
  format: FilterFormat
  
  /** File extensions this loader handles */
  extensions: string[]
  
  /** MIME types this loader handles (if applicable) */
  mimeTypes?: string[]
  
  /**
   * Load and parse a filter file
   * @param file - File object or file path
   * @returns Parsed LUT data
   */
  load(file: File | string): Promise<LoaderResult>
  
  /**
   * Validate if a file can be loaded by this loader
   * @param file - File to validate
   * @returns True if this loader can handle the file
   */
  canLoad(file: File): boolean
}

/**
 * Filter loader registry
 */
export class FilterLoaderRegistry {
  private loaders: Map<FilterFormat, FilterLoader> = new Map()
  
  register(loader: FilterLoader): void
  get(format: FilterFormat): FilterLoader | undefined
  findLoader(file: File): FilterLoader | undefined
  getSupportedFormats(): FilterFormat[]
}
```

## Integration Points

### 1. State Management (`canvasStore.ts`)

**Changes:**
- Add `filter: FilterState` to `ImageState` interface
- Add filter actions to `CanvasStoreState`:
  ```typescript
  setFilter: (filterId: string | null) => Promise<void>
  setFilterIntensity: (intensity: number) => void
  loadFilterFromFile: (file: File) => Promise<void>
  ```
- Update `ImageState` initialization to include default filter state

**Impact:** Minimal - only adds new optional fields

### 2. Rendering (`lib/canvas/render.ts`)

**Changes:**
- Add optional `filter?: FilterState` parameter to `renderScene`
- Apply filter after drawing image but before finalizing:
  ```typescript
  // Draw image
  ctx.drawImage(...)
  
  // Apply filter if present
  if (filter?.lutData) {
    applyLUTToCanvas(ctx, filter.lutData, filter.intensity, imageRect)
  }
  ```

**Impact:** Minimal - filter is optional, existing code unaffected

### 3. Export (`lib/export/exportCanvas.ts`)

**Changes:**
- Pass filter state from snapshot to `renderScene`
- Update `CanvasSnapshot` to include `filter?: FilterState`
- Update `createImageSnapshot` to include filter

**Impact:** Minimal - filter is optional parameter

### 4. UI Components

**New Component:** `FilterPanel.tsx`
- Filter selection dropdown/list
- File upload for custom filters
- Intensity slider
- Filter preview thumbnails (optional)

**Integration:** Add to `ControlPanel.tsx` alongside other panels

## Implementation Phases

### Phase 1: Core Infrastructure (Foundation)

1. **Create type definitions** (`types/filter.ts`)
   - Define `LUTData`, `FilterState`, `FilterMetadata`
   - Define `FilterLoader` interface

2. **Create loader registry** (`lib/filters/loader.ts`)
   - Implement `FilterLoaderRegistry`
   - Create base loader utilities

3. **Create processor** (`lib/filters/processor.ts`)
   - Implement `applyLUTToCanvas()` function
   - Handle intensity blending
   - Optimize for performance (use ImageData manipulation)

4. **Create base loader class** (`lib/filters/formats/base.ts`)
   - Abstract base class for format loaders
   - Common validation utilities

### Phase 2: Cube Format Support

1. **Implement Cube loader** (`lib/filters/formats/cube.ts`)
   - Parse .cube file format
   - Handle different cube sizes (8, 16, 32, 64)
   - Parse metadata (TITLE, DOMAIN_MIN, DOMAIN_MAX)
   - Error handling for malformed files

2. **Register Cube loader** in registry

3. **Add unit tests** for cube parser

### Phase 3: State Integration

1. **Update types** (`types/image.ts`, `types/canvas.ts`)
   - Add `filter: FilterState` to `ImageState`
   - Add filter to `CanvasSnapshot`

2. **Update store** (`state/canvasStore.ts`)
   - Add filter state to `ImageState` initialization
   - Implement filter actions:
     - `setFilter(filterId)`
     - `setFilterIntensity(intensity)`
     - `loadFilterFromFile(file)`
   - Update `snapshot()` to include filter

3. **Update renderer** (`lib/canvas/render.ts`)
   - Add filter parameter to `renderScene`
   - Integrate filter application
   - Ensure backward compatibility

4. **Update export** (`lib/export/exportCanvas.ts`)
   - Pass filter through export pipeline

### Phase 4: UI Integration

1. **Create FilterPanel** (`components/controls/FilterPanel.tsx`)
   - Filter list/selector
   - File upload button
   - Intensity slider
   - Remove filter button

2. **Add to ControlPanel** (`components/controls/ControlPanel.tsx`)
   - Insert FilterPanel in appropriate position

3. **Add built-in filters** (optional)
   - Create `lib/filters/presets.ts`
   - Include common filters (vintage, B&W, etc.)

### Phase 5: Future Format Support

When adding new formats (3DL, PNG, JSON):
1. Create new loader in `lib/filters/formats/[format].ts`
2. Implement `FilterLoader` interface
3. Register in loader registry
4. No changes needed to core system

## Technical Details

### LUT Processing Algorithm

```typescript
// lib/filters/processor.ts

/**
 * Apply LUT to canvas context
 * Uses trilinear interpolation for smooth results
 */
export function applyLUTToCanvas(
  ctx: CanvasRenderingContext2D,
  lutData: LUTData,
  intensity: number,
  imageRect: { x: number; y: number; width: number; height: number }
): void {
  // 1. Get ImageData from canvas
  const imageData = ctx.getImageData(imageRect.x, imageRect.y, imageRect.width, imageRect.height)
  
  // 2. Process each pixel
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i] / 255
    const g = imageData.data[i + 1] / 255
    const b = imageData.data[i + 2] / 255
    
    // 3. Apply LUT lookup with trilinear interpolation
    const [newR, newG, newB] = lookupLUT(lutData, r, g, b)
    
    // 4. Blend with original based on intensity
    imageData.data[i] = Math.round((r * (1 - intensity) + newR * intensity) * 255)
    imageData.data[i + 1] = Math.round((g * (1 - intensity) + newG * intensity) * 255)
    imageData.data[i + 2] = Math.round((b * (1 - intensity) + newB * intensity) * 255)
    // Alpha channel unchanged
  }
  
  // 5. Put processed data back
  ctx.putImageData(imageData, imageRect.x, imageRect.y)
}
```

### Cube File Format Parser

```typescript
// lib/filters/formats/cube.ts

/**
 * Parse .cube file format
 * Format spec: https://wwwimages2.adobe.com/content/dam/adobe/products/premiere/help/color-grading/LUT%20Documentation.pdf
 */
export class CubeLoader implements FilterLoader {
  format: FilterFormat = 'cube'
  extensions = ['.cube']
  
  async load(file: File | string): Promise<LoaderResult> {
    const text = await readFileAsText(file)
    const lines = text.split('\n').map(l => l.trim())
    
    let size = 32 // Default
    const data: number[] = []
    const metadata: any = {}
    
    for (const line of lines) {
      if (line.startsWith('LUT_3D_SIZE')) {
        size = parseInt(line.split(/\s+/)[1], 10)
      } else if (line.startsWith('TITLE')) {
        metadata.title = line.substring(5).trim().replace(/"/g, '')
      } else if (line.startsWith('DOMAIN_MIN')) {
        // Parse domain min
      } else if (line.startsWith('DOMAIN_MAX')) {
        // Parse domain max
      } else if (/^\d/.test(line)) {
        // RGB data line
        const [r, g, b] = line.split(/\s+/).map(parseFloat)
        data.push(r, g, b)
      }
    }
    
    return {
      lutData: {
        size,
        data: new Float32Array(data),
        metadata
      },
      metadata: {
        name: metadata.title || 'Untitled',
        format: 'cube'
      }
    }
  }
}
```

## Performance Considerations

1. **Lazy Loading**: Only load LUT data when filter is applied
2. **Caching**: Cache processed LUT data per filter
3. **Optimization**: Use Web Workers for large images (future enhancement)
4. **Preview Optimization**: Apply filters at lower resolution for preview, full resolution for export
5. **Intensity Blending**: Efficient blend calculation

## Testing Strategy

1. **Unit Tests**:
   - Cube parser with various file formats
   - LUT lookup accuracy
   - Intensity blending

2. **Integration Tests**:
   - Filter application in render pipeline
   - Export with filters
   - State management

3. **Manual Testing**:
   - Real-time preview performance
   - Export quality
   - Multiple filter formats

## Migration & Backward Compatibility

- **Existing images**: Default to `filter: null` (no filter)
- **Existing exports**: Unchanged behavior when no filter
- **State migration**: Not needed (new optional field)

## Future Enhancements

1. **WebGL Acceleration**: Use WebGL shaders for faster processing
2. **Filter Presets**: Built-in filter library
3. **Filter Stacking**: Multiple filters with blend modes
4. **Real-time Preview**: Optimized preview rendering
5. **Filter Thumbnails**: Visual preview of filters
6. **Filter Search**: Search/filter UI for large filter libraries

## Dependencies

No new external dependencies required. Uses:
- Native Canvas API
- Native File API
- TypeScript for type safety

## Timeline Estimate

- Phase 1 (Core): 2-3 days
- Phase 2 (Cube): 2-3 days
- Phase 3 (State): 1-2 days
- Phase 4 (UI): 2-3 days
- **Total**: ~7-11 days

## Success Criteria

✅ Filters can be loaded from .cube files
✅ Filters apply correctly in preview
✅ Filters apply correctly in export
✅ No performance degradation
✅ No breaking changes to existing features
✅ Easy to add new filter formats
