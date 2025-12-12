import type { FilterMetadata } from '../../types/filter'

/**
 * Built-in filter presets bundled with the app.
 * These filters are loaded from the public/filters/ directory.
 */
export const BUILTIN_FILTERS: FilterMetadata[] = [
  // X-Pro3 Filters
  {
    id: 'xpro3-eterna',
    name: 'X-Pro3 ETERNA',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/XPro3_FLog_FGamut_to_ETERNA_BT.709_33grid_V.1.01.cube',
    description: 'F-Log to ETERNA color grade',
  },
  {
    id: 'xpro3-flog',
    name: 'X-Pro3 F-Log',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/XPro3_FLog_FGamut_to_FLog_BT.709_33grid_V.1.01.cube',
    description: 'F-Log to F-Log color grade',
  },
  {
    id: 'xpro3-wdr',
    name: 'X-Pro3 WDR',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/XPro3_FLog_FGamut_to_WDR_BT.709_33grid_V.1.01.cube',
    description: 'F-Log to WDR color grade',
  },
  // X-T30III F-Log Filters
  {
    id: 'xt30iii-flog-eterna',
    name: 'X-T30III F-Log ETERNA',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/XT30III_FLog_FGamut_to_ETERNA_BT.709_33grid_V.1.00.cube',
    description: 'F-Log to ETERNA color grade',
  },
  {
    id: 'xt30iii-flog-eterna-bb',
    name: 'X-T30III F-Log ETERNA-BB',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/XT30III_FLog_FGamut_to_ETERNA-BB_BT.709_33grid_V.1.00.cube',
    description: 'F-Log to ETERNA-BB color grade',
  },
  {
    id: 'xt30iii-flog-flog',
    name: 'X-T30III F-Log',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/XT30III_FLog_FGamut_to_FLog_BT.709_33grid_V.1.00.cube',
    description: 'F-Log to F-Log color grade',
  },
  {
    id: 'xt30iii-flog-wdr',
    name: 'X-T30III F-Log WDR',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/XT30III_FLog_FGamut_to_WDR_BT.709_33grid_V.1.00.cube',
    description: 'F-Log to WDR color grade',
  },
  // X-T30III F-Log2 Filters
  {
    id: 'xt30iii-flog2-eterna',
    name: 'X-T30III F-Log2 ETERNA',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/X-T30III_FLog2_FGamut_to_ETERNA_BT.709_33grid_V.1.00.cube',
    description: 'F-Log2 to ETERNA color grade',
  },
  {
    id: 'xt30iii-flog2-eterna-bb',
    name: 'X-T30III F-Log2 ETERNA-BB',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/X-T30III_FLog2_FGamut_to_ETERNA-BB_BT.709_33grid_V.1.00.cube',
    description: 'F-Log2 to ETERNA-BB color grade',
  },
  {
    id: 'xt30iii-flog2-flog2',
    name: 'X-T30III F-Log2',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/X-T30III_FLog2_FGamut_to_FLog2_BT.709_33grid_V.1.00.cube',
    description: 'F-Log2 to F-Log2 color grade',
  },
  {
    id: 'xt30iii-flog2-wdr',
    name: 'X-T30III F-Log2 WDR',
    format: 'cube',
    source: 'builtin',
    filePath: '/CanvasStudio/filters/X-T30III_FLog2_FGamut_to_WDR_BT.709_33grid_V.1.00.cube',
    description: 'F-Log2 to WDR color grade',
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
