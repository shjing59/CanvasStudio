import { create } from 'zustand'
import { DEFAULT_RATIO_ID, findRatioValue } from '../lib/canvas/ratios'
import { SCALE, CANVAS, RESIZE, SNAP } from '../lib/canvas/constants'
import { clamp, computeFitScale, computeDefaultScale } from '../lib/canvas/math'
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

export interface CanvasStoreState {
  image?: ImageMetadata
  ratioId: RatioOptionId
  customRatio: { width: number; height: number }
  transform: TransformState
  borders: Record<BorderKey, BorderSetting>
  centerSnap: boolean
  background: string
  previewSize: { width: number; height: number } | null
  exportOptions: ExportOptions
  /** Internal flag: when true, next setPreviewSize will fit the image */
  _needsInitialFit: boolean
  loadImage: (file: File) => Promise<void>
  setRatio: (id: RatioOptionId) => void
  setCustomRatio: (payload: { width: number; height: number }) => void
  updateTransform: (transform: Partial<TransformState>) => void
  nudgePosition: (delta: { x: number; y: number }) => void
  adjustScale: (factor: number) => void
  setScale: (value: number) => void
  setCenterSnap: (value: boolean) => void
  resetTransform: () => void
  setBorders: (payload: Partial<Record<BorderKey, BorderSetting>>) => void
  fitImageToCanvas: () => void
  setBackground: (value: string) => void
  setPreviewSize: (size: { width: number; height: number }) => void
  setExportOptions: (options: Partial<ExportOptions>) => void
  snapshot: () => CanvasSnapshot
}

const initialBorder: BorderSetting = { value: 0, unit: 'px' }

// ============================================================================
// INTERNAL HELPERS (not exported, called only within store)
// ============================================================================

/**
 * Fits the image to the current preview canvas size.
 * This is the SINGLE source of truth for scale initialization.
 */
function fitImageToPreview(): void {
  const state = useCanvasStore.getState()
  if (!state.image || !state.previewSize) return

  const { width: canvasW, height: canvasH } = state.previewSize
  const defaultScale = computeDefaultScale(state.image, canvasW, canvasH)

  useCanvasStore.setState({
    transform: {
      x: 0,
      y: 0,
      scale: defaultScale,
    },
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

/**
 * Applies center snapping to transform if enabled.
 */
function applySnap(transform: TransformState, centerSnap: boolean): TransformState {
  if (!centerSnap) return transform
  return {
    ...transform,
    x: Math.abs(transform.x) < SNAP.THRESHOLD ? 0 : transform.x,
    y: Math.abs(transform.y) < SNAP.THRESHOLD ? 0 : transform.y,
  }
}

// ============================================================================
// STORE
// ============================================================================

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  ratioId: DEFAULT_RATIO_ID,
  customRatio: { width: 4, height: 5 },
  transform: { x: 0, y: 0, scale: 1 },
  borders: {
    top: { ...initialBorder },
    bottom: { ...initialBorder },
  },
  centerSnap: true,
  background: '#ffffff',
  previewSize: null,
  exportOptions: { format: 'png', quality: 1 },
  _needsInitialFit: false,

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
      // Need to get fresh state after set
      fitImageToPreview()
    }
    // Otherwise, setPreviewSize will handle it when Canvas reports size
  },

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

  updateTransform(transform) {
    set((state) => {
      const merged = { ...state.transform, ...transform }
      return { transform: applySnap(merged, state.centerSnap) }
    })
  },

  nudgePosition(delta) {
    set((state) => {
      const moved = {
        ...state.transform,
        x: state.transform.x + delta.x,
        y: state.transform.y + delta.y,
      }
      return { transform: applySnap(moved, state.centerSnap) }
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

  setCenterSnap(value) {
    set({ centerSnap: value })
  },

  resetTransform() {
    fitImageToPreview()
  },

  setBorders(payload) {
    set((state) => ({
      borders: { ...state.borders, ...payload },
    }))
    // Note: Border changes no longer auto-refit the image
  },

  fitImageToCanvas() {
    fitImageToPreview()
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
      fitImageToPreview()
      return
    }

    // Case 2: First time getting size with an existing image (shouldn't happen normally)
    if (!oldSize && state.image) {
      fitImageToPreview()
      return
    }

    // Case 3: Aspect ratio changed (ratio selector changed, Canvas resized accordingly)
    if (oldSize && state.image) {
      const oldAspect = oldSize.width / oldSize.height
      const newAspect = size.width / size.height
      if (Math.abs(newAspect - oldAspect) > RESIZE.ASPECT_RATIO_THRESHOLD) {
        fitImageToPreview()
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

  snapshot() {
    const state = get()
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
