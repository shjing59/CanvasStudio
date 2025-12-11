# Adding Cube Filter Files - Guide

This guide explains how to add LUT filter files (`.cube` format) to CanvasStudio.

## Two Approaches

### 1. Built-in Filters (Bundled with App)

Built-in filters are stored in the `public/` directory and are available immediately when the app loads. These are great for:
- Curated filter collections
- Popular filters users expect
- Filters that ship with the app

### 2. User-Uploaded Filters (Runtime)

Users can upload their own `.cube` files at runtime via the UI. These are:
- Loaded from user's file system
- Stored in memory/state (not saved to disk)
- Available only for the current session

---

## Method 1: Adding Built-in Filters

### Step 1: Create Filters Directory

Create a `filters` directory inside `public/`:

```bash
mkdir public/filters
```

### Step 2: Add Cube Files

Place your `.cube` files in `public/filters/`:

```
public/
└── filters/
    ├── vintage.cube
    ├── black-white.cube
    ├── cinematic.cube
    ├── warm-tones.cube
    └── cool-tones.cube
```

### Step 3: Create Filter Registry

Create a filter registry file that lists all built-in filters:

**File: `src/lib/filters/presets.ts`**

```typescript
import type { FilterMetadata } from '../types/filter'

/**
 * Built-in filter presets bundled with the app.
 * These filters are loaded from the public/filters/ directory.
 */
export const BUILTIN_FILTERS: FilterMetadata[] = [
  {
    id: 'vintage',
    name: 'Vintage',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/vintage.cube',
  },
  {
    id: 'black-white',
    name: 'Black & White',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/black-white.cube',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/cinematic.cube',
  },
  {
    id: 'warm-tones',
    name: 'Warm Tones',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/warm-tones.cube',
  },
  {
    id: 'cool-tones',
    name: 'Cool Tones',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/cool-tones.cube',
  },
]

/**
 * Get a built-in filter by ID
 */
export function getBuiltinFilter(id: string): FilterMetadata | undefined {
  return BUILTIN_FILTERS.find((f) => f.id === id)
}

/**
 * Load a built-in filter file
 */
export async function loadBuiltinFilter(metadata: FilterMetadata): Promise<File> {
  if (metadata.source !== 'builtin' || !metadata.filePath) {
    throw new Error('Not a built-in filter or missing file path')
  }

  const response = await fetch(metadata.filePath)
  if (!response.ok) {
    throw new Error(`Failed to load filter: ${response.statusText}`)
  }

  const blob = await response.blob()
  const fileName = metadata.filePath.split('/').pop() || 'filter.cube'
  
  return new File([blob], fileName, { type: 'text/plain' })
}
```

**Important Notes:**
- Use `/CanvasStudio/filters/` path prefix (matches `base` in `vite.config.ts`)
- In development, Vite serves from `public/` at root, so paths work
- In production (GitHub Pages), the base path is `/CanvasStudio/`

### Step 4: Using Built-in Filters

The filter system will:
1. Load filter metadata from `presets.ts`
2. Fetch the `.cube` file from `public/filters/` when selected
3. Parse and apply the filter

---

## Method 2: User-Uploaded Filters

Users can upload their own `.cube` files through the UI. The implementation will:

1. **File Input**: User selects a `.cube` file
2. **Validation**: Check file extension and format
3. **Loading**: Parse the cube file
4. **Storage**: Store in image state (in memory)
5. **Application**: Apply to current image

**Implementation** (will be in `FilterPanel.tsx`):

```typescript
const handleFileUpload = async (file: File) => {
  // Validate file
  if (!file.name.endsWith('.cube')) {
    alert('Please select a .cube file')
    return
  }

  // Load filter via store action
  await useCanvasStore.getState().loadFilterFromFile(file)
}
```

---

## Recommended Directory Structure

```
CanvasStudio/
├── public/
│   ├── filters/              # Built-in filter files
│   │   ├── vintage.cube
│   │   ├── black-white.cube
│   │   └── ...
│   ├── sample.jpg
│   └── vite.svg
├── src/
│   └── lib/
│       └── filters/
│           ├── presets.ts     # Built-in filter registry
│           └── ...
```

---

## Where to Get Cube Files

### Free Resources:
1. **Adobe Creative Cloud**: Includes many LUTs
2. **LUTs.com**: Free and premium LUTs
3. **RocketStock**: Free LUT collections
4. **PremiumBeat**: Free LUT packs
5. **GitHub**: Open-source LUT collections

### Creating Your Own:
- Use DaVinci Resolve, Adobe Premiere, or other color grading tools
- Export as `.cube` format
- Test in your application

---

## Example: Adding a New Built-in Filter

### Step 1: Add the file
```bash
# Download or create your filter
cp ~/Downloads/my-filter.cube public/filters/my-filter.cube
```

### Step 2: Update the registry
Edit `src/lib/filters/presets.ts`:

```typescript
export const BUILTIN_FILTERS: FilterMetadata[] = [
  // ... existing filters
  {
    id: 'my-filter',
    name: 'My Custom Filter',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/my-filter.cube',
  },
]
```

### Step 3: Done!
The filter will now appear in the filter selector UI.

---

## File Naming Conventions

**Recommended naming:**
- Use kebab-case: `vintage-film.cube`
- Descriptive names: `warm-sunset.cube` not `filter1.cube`
- Keep names short but clear

**Avoid:**
- Spaces: `vintage film.cube` ❌
- Special characters: `vintage@film.cube` ❌
- Uppercase (optional): `Vintage.cube` (works but inconsistent)

---

## Testing Your Filters

### Development:
1. Place `.cube` file in `public/filters/`
2. Add to `presets.ts`
3. Run `yarn dev`
4. Test in the filter panel

### Production:
1. Build: `yarn build`
2. Verify files in `dist/filters/`
3. Deploy: `yarn deploy`
4. Test on GitHub Pages

---

## Troubleshooting

### Filter not loading?
- ✅ Check file path matches `base` in `vite.config.ts`
- ✅ Verify file is in `public/filters/` (not `src/`)
- ✅ Check browser console for 404 errors
- ✅ Ensure file extension is `.cube`

### Filter not appearing in UI?
- ✅ Check `presets.ts` has the filter listed
- ✅ Verify `id` is unique
- ✅ Check filter format is `'cube'`

### Filter applies incorrectly?
- ✅ Validate `.cube` file format
- ✅ Check LUT size (should be power of 2: 8, 16, 32, 64)
- ✅ Verify RGB values are in correct range

---

## Best Practices

1. **Organize by category**: Consider subdirectories for large collections
   ```
   public/filters/
   ├── vintage/
   ├── cinematic/
   └── color-grades/
   ```

2. **Include metadata**: Add descriptions in `presets.ts`:
   ```typescript
   {
     id: 'vintage',
     name: 'Vintage Film',
     description: 'Warm, nostalgic film look',
     // ...
   }
   ```

3. **Optimize file size**: Large LUTs (64x64x64) are slower; use 32x32x32 when possible

4. **Test thoroughly**: Verify filters work on various image types

5. **Document sources**: Keep track of where filters came from (for licensing)

---

## Future Enhancements

- **Filter categories**: Group filters by style/type
- **Filter previews**: Thumbnail images for each filter
- **Filter search**: Search by name/category
- **Custom filter packs**: Allow users to import multiple filters at once
- **Filter sharing**: Export/import filter configurations
