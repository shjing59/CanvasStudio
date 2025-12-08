import { create } from 'zustand'
import { DEFAULT_RATIO_ID, findRatioValue } from '../lib/canvas/ratios'
import { SCALE, CANVAS, RESIZE } from '../lib/canvas/constants'
import { clamp, computeFitScale } from '../lib/canvas/math'
import {
  computeInitialTransform,
  applySnapToTransform,
  createImageSnapshot,
  mergeTransform,
  applyPositionDelta,
} from '../lib/canvas/transform'
import { loadImageFromFile } from '../lib/image/loadImage'
import type {
  BorderSetting,
  CanvasSnapshot,
  ExportOptions,
  RatioOptionId,
  TransformState,
} from '../types/canvas'
import type { ImageMetadata } from '../types/image'

type BorderKey = 'top' | 'bottom'

// ============================================================================
// CANVAS SETTINGS (shared across all images in future filmstrip)
// ============================================================================
interface CanvasSettings {
  ratioId: RatioOptionId
  customRatio: { width: number; height: number }
  background: string
  centerSnap: boolean
  exportOptions: ExportOptions
  previewSize: { width: number; height: number } | null
  borders: Record<BorderKey, BorderSetting>
}

// ============================================================================
// ACTIVE IMAGE STATE (will become per-image in filmstrip queue)
// ============================================================================
interface ActiveImageState {
  image?: ImageMetadata
  transform: TransformState
  /** Internal flag: when true, next setPreviewSize will fit the image */
  _needsInitialFit: boolean
}

// ============================================================================
// COMBINED STORE STATE
// ============================================================================
export interface CanvasStoreState extends CanvasSettings, ActiveImageState {
  // Image actions
  loadImage: (file: File) => Promise<void>
  
  // Ratio actions
  setRatio: (id: RatioOptionId) => void
  setCustomRatio: (payload: { width: number; height: number }) => void
  
  // Transform actions
  updateTransform: (transform: Partial<TransformState>) => void
  nudgePosition: (delta: { x: number; y: number }) => void
  adjustScale: (factor: number) => void
  setScale: (value: number) => void
  resetTransform: () => void
  fitImageToCanvas: () => void
  
  // Settings actions
  setCenterSnap: (value: boolean) => void
  setBorders: (payload: Partial<Record<BorderKey, BorderSetting>>) => void
  setBackground: (value: string) => void
  setPreviewSize: (size: { width: number; height: number }) => void
  setExportOptions: (options: Partial<ExportOptions>) => void
  
  // Snapshot for export
  snapshot: () => CanvasSnapshot
}

const initialBorder: BorderSetting = { value: 0, unit: 'px' }

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Fits the current image to the current preview canvas size.
 * Uses pure function internally.
 */
function fitCurrentImageToPreview(): void {
  const state = useCanvasStore.getState()
  if (!state.image || !state.previewSize) return

  const { width: canvasW, height: canvasH } = state.previewSize
  const initialTransform = computeInitialTransform(state.image, canvasW, canvasH)

  useCanvasStore.setState({
    transform: initialTransform,
    _needsInitialFit: false,
  })
}

/**
 * Calculates the fit scale based on current preview size.
 * Returns null if image or preview size is not available.
 */
function getFitScaleFromState(state: CanvasStoreState): number | null {
  if (!state.image || !state.previewSize) return null
  const { width: canvasW, height: canvasH } = state.previewSize
  if (canvasW <= 0 || canvasH <= 0) return null
  return computeFitScale(state.image, canvasW, canvasH)
}

/**
 * Derives the base dimensions for export (based on image or default).
 */
function deriveDimensions(state: CanvasStoreState) {
  const baseWidth = state.image?.width ?? CANVAS.DEFAULT_BASE_WIDTH
  const ratio = getRatioValue(state)
  const baseHeight = baseWidth / ratio
  return { baseWidth, baseHeight, ratio }
}

/**
 * Gets the current ratio value based on ratio ID, custom values, and image.
 */
function getRatioValue(state: CanvasStoreState): number {
  return findRatioValue(state.ratioId, { custom: state.customRatio, image: state.image })
}

// ============================================================================
// STORE
// ============================================================================

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  // Canvas settings (shared)
  ratioId: DEFAULT_RATIO_ID,
  customRatio: { width: 4, height: 5 },
  background: '#ffffff',
  centerSnap: true,
  exportOptions: { format: 'png', quality: 1 },
  previewSize: null,
  borders: {
    top: { ...initialBorder },
    bottom: { ...initialBorder },
  },

  // Active image state
  image: undefined,
  transform: { x: 0, y: 0, scale: 1 },
  _needsInitialFit: false,

  // ========================================================================
  // IMAGE ACTIONS
  // ========================================================================

  async loadImage(file: File) {
    const image = await loadImageFromFile(file)
    const state = get()

    // Store image and mark for fitting
    set({
      image,
      _needsInitialFit: true,
      transform: { x: 0, y: 0, scale: 1 }, // Temporary until fit
    })

    // If preview size already known, fit immediately
    if (state.previewSize) {
      fitCurrentImageToPreview()
    }
    // Otherwise, setPreviewSize will handle it when Canvas reports size
  },

  // ========================================================================
  // RATIO ACTIONS
  // ========================================================================

  setRatio(id) {
    const state = get()
    const oldRatio = getRatioValue(state)

    set({ ratioId: id })

    // Calculate new ratio to check if it actually changed
    const newState = get()
    const newRatio = getRatioValue(newState)

    // If ratio changed significantly, refit the image
    if (Math.abs(newRatio - oldRatio) > RESIZE.ASPECT_RATIO_THRESHOLD && newState.image) {
      set({ _needsInitialFit: true })
      // The actual fit will happen when Canvas updates its size and calls setPreviewSize
    }
  },

  setCustomRatio(payload) {
    const state = get()
    const oldRatio = getRatioValue(state)

    set({ customRatio: payload, ratioId: 'custom' })

    const newState = get()
    const newRatio = getRatioValue(newState)

    // If ratio changed significantly, refit the image
    if (Math.abs(newRatio - oldRatio) > RESIZE.ASPECT_RATIO_THRESHOLD && newState.image) {
      set({ _needsInitialFit: true })
    }
  },

  // ========================================================================
  // TRANSFORM ACTIONS
  // ========================================================================

  updateTransform(partial) {
    set((state) => {
      const merged = mergeTransform(state.transform, partial)
      return { transform: applySnapToTransform(merged, state.centerSnap) }
    })
  },

  nudgePosition(delta) {
    set((state) => {
      const moved = applyPositionDelta(state.transform, delta)
      return { transform: applySnapToTransform(moved, state.centerSnap) }
    })
  },

  adjustScale(factor) {
    set((state) => {
      const nextScale = clamp(state.transform.scale * factor, SCALE.MIN, SCALE.MAX)
      return { transform: { ...state.transform, scale: nextScale } }
    })
  },

  setScale(value) {
    set((state) => ({
      transform: { ...state.transform, scale: clamp(value, SCALE.MIN, SCALE.MAX) },
    }))
  },

  resetTransform() {
    fitCurrentImageToPreview()
  },

  fitImageToCanvas() {
    fitCurrentImageToPreview()
  },

  // ========================================================================
  // SETTINGS ACTIONS
  // ========================================================================

  setCenterSnap(value) {
    set({ centerSnap: value })
  },

  setBorders(payload) {
    set((state) => ({
      borders: { ...state.borders, ...payload },
    }))
  },

  setBackground(value) {
    set({ background: value })
  },

  setPreviewSize(size) {
    const state = get()
    const oldSize = state.previewSize

    set({ previewSize: size })

    // Case 1: We have a pending fit (new image or ratio change)
    if (state._needsInitialFit && state.image) {
      fitCurrentImageToPreview()
      return
    }

    // Case 2: First time getting size with an existing image (shouldn't happen normally)
    if (!oldSize && state.image) {
      fitCurrentImageToPreview()
      return
    }

    // Case 3: Aspect ratio changed (ratio selector changed, Canvas resized accordingly)
    if (oldSize && state.image) {
      const oldAspect = oldSize.width / oldSize.height
      const newAspect = size.width / size.height
      if (Math.abs(newAspect - oldAspect) > RESIZE.ASPECT_RATIO_THRESHOLD) {
        fitCurrentImageToPreview()
        return
      }
    }

    // Case 4: Just a window resize - do NOT refit, preserve user's positioning
  },

  setExportOptions(options) {
    set((state) => ({
      exportOptions: {
        ...state.exportOptions,
        ...options,
        quality:
          options.quality !== undefined
            ? clamp(options.quality, 0.5, 1)
            : state.exportOptions.quality,
      },
    }))
  },

  // ========================================================================
  // SNAPSHOT
  // ========================================================================

  snapshot() {
    const state = get()
    
    // Use pure function if image exists
    if (state.image && state.previewSize) {
      return createImageSnapshot({
        image: state.image,
        transform: state.transform,
        canvasWidth: state.previewSize.width,
        canvasHeight: state.previewSize.height,
        background: state.background,
        ratioId: state.ratioId,
        customRatio: state.customRatio,
      })
    }
    
    // Fallback for no image
    return {
      image: state.image,
      transform: state.transform,
      borders: state.borders,
      background: state.background,
      dimensions: deriveDimensions(state),
      ratioId: state.ratioId,
      previewSize: state.previewSize,
    }
  },
}))

// ============================================================================
// EXPORTED SELECTORS
// ============================================================================

export const selectDimensions = deriveDimensions
export const selectRatioValue = getRatioValue
export const selectFitScale = getFitScaleFromState

// ============================================================================
// EXPORTED CANVAS SETTINGS SELECTOR (for future filmstrip)
// ============================================================================

export function selectCanvasSettings(state: CanvasStoreState): CanvasSettings {
  return {
    ratioId: state.ratioId,
    customRatio: state.customRatio,
    background: state.background,
    centerSnap: state.centerSnap,
    exportOptions: state.exportOptions,
    previewSize: state.previewSize,
    borders: state.borders,
  }
}
