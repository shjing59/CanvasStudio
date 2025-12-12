import { create } from 'zustand'
import { DEFAULT_RATIO_ID, findRatioValue } from '../lib/canvas/ratios'
import { SCALE, CANVAS, RESIZE } from '../lib/canvas/constants'
import { clamp, computeFitScale } from '../lib/canvas/math'
import { getEffectiveDimensions } from '../lib/canvas/crop'
import {
  computeInitialTransform,
  applySnapToTransform,
  createImageSnapshot,
  mergeTransform,
  applyPositionDelta,
} from '../lib/canvas/transform'
import { loadImageFromFile, loadImagesFromFiles } from '../lib/image/loadImage'
import { filterLoaderRegistry } from '../lib/filters/loader'
import { CubeLoader } from '../lib/filters/formats/cube'
import { BUILTIN_FILTERS, loadBuiltinFilter } from '../lib/filters/presets'
import { generateFilteredImageFull } from '../lib/filters/cache'
import type {
  BorderSetting,
  CanvasSnapshot,
  CropState,
  ExportOptions,
  RatioOptionId,
  TransformState,
} from '../types/canvas'
import type { ImageMetadata, ImageState } from '../types/image'
import type { FilterState } from '../types/filter'

type BorderKey = 'top' | 'bottom'

// ============================================================================
// LAYOUT STATE (drawer visibility)
// ============================================================================
interface LayoutState {
  /** Whether the left drawer (Import/Export) is open */
  leftDrawerOpen: boolean
  /** Whether the right drawer (Controls) is open */
  rightDrawerOpen: boolean
}

// ============================================================================
// CANVAS SETTINGS (shared across all images)
// ============================================================================
interface CanvasSettings {
  ratioId: RatioOptionId
  customRatio: { width: number; height: number }
  background: string
  centerSnap: boolean
  exportOptions: ExportOptions
  previewSize: { width: number; height: number } | null
  borders: Record<BorderKey, BorderSetting>
  /** Whether crop mode is currently active */
  cropMode: boolean
}

// ============================================================================
// IMAGE QUEUE STATE
// ============================================================================
interface ImageQueueState {
  /** All images in the queue */
  images: ImageState[]
  /** Currently active image ID (shown in main canvas) */
  activeImageId: string | null
}

// ============================================================================
// COMBINED STORE STATE
// ============================================================================
export interface CanvasStoreState extends CanvasSettings, ImageQueueState, LayoutState {
  /** Internal flag: when true, next setPreviewSize will fit the active image */
  _needsInitialFit: boolean

  // Image queue actions
  loadImage: (file: File) => Promise<void>
  loadImages: (files: File[]) => Promise<void>
  setActiveImage: (id: string) => void
  removeImage: (id: string) => void
  clearAllImages: () => void

  // Ratio actions
  setRatio: (id: RatioOptionId) => void
  setCustomRatio: (payload: { width: number; height: number }) => void

  // Transform actions (apply to active image)
  updateTransform: (transform: Partial<TransformState>) => void
  nudgePosition: (delta: { x: number; y: number }) => void
  adjustScale: (factor: number) => void
  setScale: (value: number) => void
  resetTransform: () => void
  fitImageToCanvas: () => void

  // Crop actions (apply to active image)
  setCrop: (crop: CropState | null) => void
  updateCrop: (partial: Partial<CropState>) => void
  resetCrop: () => void
  toggleCropMode: () => void
  setCropAspectLock: (lock: boolean, aspect?: number) => void

  // Filter actions (apply to active image)
  setFilter: (filterId: string | null) => Promise<void>
  setFilterIntensity: (intensity: number) => void
  loadFilterFromFile: (file: File) => Promise<void>
  removeFilter: () => void

  // Layout actions
  toggleLeftDrawer: () => void
  toggleRightDrawer: () => void
  setLeftDrawerOpen: (open: boolean) => void
  setRightDrawerOpen: (open: boolean) => void

  // Settings actions
  setCenterSnap: (value: boolean) => void
  setBorders: (payload: Partial<Record<BorderKey, BorderSetting>>) => void
  setBackground: (value: string) => void
  setPreviewSize: (size: { width: number; height: number }) => void
  setExportOptions: (options: Partial<ExportOptions>) => void

  // Computed / Selectors
  snapshot: () => CanvasSnapshot
  getActiveImage: () => ImageState | null
  getActiveImageMetadata: () => ImageMetadata | undefined
}

const initialBorder: BorderSetting = { value: 0, unit: 'px' }

// Initialize filter system - register loaders
if (filterLoaderRegistry.getSupportedFormats().length === 0) {
  filterLoaderRegistry.register(new CubeLoader())
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Get the active image state from the queue.
 */
function getActiveImageState(state: CanvasStoreState): ImageState | null {
  if (!state.activeImageId) return null
  return state.images.find((img) => img.image.id === state.activeImageId) ?? null
}

/**
 * Update a specific image in the queue.
 */
function updateImageInQueue(
  images: ImageState[],
  imageId: string,
  updater: (img: ImageState) => ImageState
): ImageState[] {
  return images.map((img) => (img.image.id === imageId ? updater(img) : img))
}

/**
 * Fits the active image (or cropped region) to the current preview canvas size.
 */
function fitActiveImageToPreview(): void {
  const state = useCanvasStore.getState()
  const activeImage = getActiveImageState(state)
  if (!activeImage || !state.previewSize) return

  const { width: canvasW, height: canvasH } = state.previewSize
  // Pass crop to compute transform based on cropped dimensions
  const initialTransform = computeInitialTransform(activeImage.image, canvasW, canvasH, activeImage.crop)

  useCanvasStore.setState({
    images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
      ...img,
      transform: initialTransform,
      isEdited: false,
    })),
    _needsInitialFit: false,
  })
}

/**
 * Calculates the fit scale based on current preview size and active image (or cropped region).
 */
function getFitScaleFromState(state: CanvasStoreState): number | null {
  const activeImage = getActiveImageState(state)
  if (!activeImage || !state.previewSize) return null
  const { width: canvasW, height: canvasH } = state.previewSize
  if (canvasW <= 0 || canvasH <= 0) return null
  // Pass crop to compute fit scale based on cropped dimensions
  return computeFitScale(activeImage.image, canvasW, canvasH, activeImage.crop)
}

/**
 * Derives the base dimensions for export (based on active image/crop or default).
 * When crop exists, uses cropped dimensions for export.
 */
function deriveDimensions(state: CanvasStoreState) {
  const activeImage = getActiveImageState(state)
  // Use effective (cropped) dimensions if crop exists
  const effectiveDims = activeImage 
    ? getEffectiveDimensions(activeImage.image, activeImage.crop)
    : null
  const baseWidth = effectiveDims?.width ?? CANVAS.DEFAULT_BASE_WIDTH
  const ratio = getRatioValue(state)
  const baseHeight = baseWidth / ratio
  return { baseWidth, baseHeight, ratio }
}

/**
 * Gets the current ratio value based on ratio ID, custom values, active image, and crop.
 */
function getRatioValue(state: CanvasStoreState): number {
  const activeImage = getActiveImageState(state)
  return findRatioValue(state.ratioId, { 
    custom: state.customRatio, 
    image: activeImage?.image,
    crop: activeImage?.crop,
  })
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
  cropMode: false,

  // Layout state
  leftDrawerOpen: true,
  rightDrawerOpen: true,

  // Image queue state
  images: [],
  activeImageId: null,
  _needsInitialFit: false,

  // ========================================================================
  // IMAGE QUEUE ACTIONS
  // ========================================================================

  async loadImage(file: File) {
    const image = await loadImageFromFile(file)
    const state = get()

    // Create new image state with default transform, no crop, and no filter
    const newImageState: ImageState = {
      image,
      transform: { x: 0, y: 0, scale: 1 },
      crop: null,
      filter: null,
      isEdited: false,
    }

    // Add to queue and make it active
    set({
      images: [...state.images, newImageState],
      activeImageId: image.id,
      _needsInitialFit: true,
    })

    // If preview size already known, fit immediately
    if (state.previewSize) {
      fitActiveImageToPreview()
    }
  },

  async loadImages(files: File[]) {
    if (files.length === 0) return

    const images = await loadImagesFromFiles(files)
    const state = get()

    // Create image states for all (with no crop and no filter)
    const newImageStates: ImageState[] = images.map((image) => ({
      image,
      transform: { x: 0, y: 0, scale: 1 },
      crop: null,
      filter: null,
      isEdited: false,
    }))

    // Add all to queue, make first one active
    const firstNewId = images[0].id
    set({
      images: [...state.images, ...newImageStates],
      activeImageId: state.activeImageId ?? firstNewId,
      _needsInitialFit: true,
    })

    // If preview size already known, fit immediately
    if (state.previewSize) {
      fitActiveImageToPreview()
    }
  },

  setActiveImage(id: string) {
    const state = get()
    const targetImage = state.images.find((img) => img.image.id === id)
    if (!targetImage) return

    // Check if this image needs initial fitting
    // (hasn't been edited and still has default scale of 1)
    const needsFit = !targetImage.isEdited && targetImage.transform.scale === 1

    set({
      activeImageId: id,
      _needsInitialFit: needsFit,
    })

    // Fit immediately if needed and preview size is available
    if (needsFit && state.previewSize) {
      fitActiveImageToPreview()
    }
  },

  removeImage(id: string) {
    const state = get()
    const newImages = state.images.filter((img) => img.image.id !== id)

    // If removing active image, select next or previous
    let newActiveId = state.activeImageId
    if (state.activeImageId === id) {
      const removedIndex = state.images.findIndex((img) => img.image.id === id)
      if (newImages.length > 0) {
        // Select next image, or last if we removed the last one
        const newIndex = Math.min(removedIndex, newImages.length - 1)
        newActiveId = newImages[newIndex].image.id
      } else {
        newActiveId = null
      }
    }

    set({
      images: newImages,
      activeImageId: newActiveId,
    })
  },

  clearAllImages() {
    set({
      images: [],
      activeImageId: null,
    })
  },

  // ========================================================================
  // RATIO ACTIONS
  // ========================================================================

  setRatio(id) {
    const state = get()
    const oldRatio = getRatioValue(state)

    set({ ratioId: id })

    const newState = get()
    const newRatio = getRatioValue(newState)

    // If ratio changed significantly, refit all images
    if (Math.abs(newRatio - oldRatio) > RESIZE.ASPECT_RATIO_THRESHOLD && newState.images.length > 0) {
      set({ _needsInitialFit: true })
    }
  },

  setCustomRatio(payload) {
    const state = get()
    const oldRatio = getRatioValue(state)

    set({ customRatio: payload, ratioId: 'custom' })

    const newState = get()
    const newRatio = getRatioValue(newState)

    if (Math.abs(newRatio - oldRatio) > RESIZE.ASPECT_RATIO_THRESHOLD && newState.images.length > 0) {
      set({ _needsInitialFit: true })
    }
  },

  // ========================================================================
  // TRANSFORM ACTIONS (apply to active image)
  // ========================================================================

  updateTransform(partial) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) return

    const merged = mergeTransform(activeImage.transform, partial)
    const snapped = applySnapToTransform(merged, state.centerSnap)

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        transform: snapped,
        isEdited: true,
      })),
    })
  },

  nudgePosition(delta) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) return

    const moved = applyPositionDelta(activeImage.transform, delta)
    const snapped = applySnapToTransform(moved, state.centerSnap)

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        transform: snapped,
        isEdited: true,
      })),
    })
  },

  adjustScale(factor) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) return

    const nextScale = clamp(activeImage.transform.scale * factor, SCALE.MIN, SCALE.MAX)

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        transform: { ...img.transform, scale: nextScale },
        isEdited: true,
      })),
    })
  },

  setScale(value) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) return

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        transform: { ...img.transform, scale: clamp(value, SCALE.MIN, SCALE.MAX) },
        isEdited: true,
      })),
    })
  },

  resetTransform() {
    fitActiveImageToPreview()
  },

  fitImageToCanvas() {
    fitActiveImageToPreview()
  },

  // ========================================================================
  // CROP ACTIONS (apply to active image)
  // ========================================================================

  setCrop(crop: CropState | null) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) return

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        crop,
        isEdited: true,
      })),
    })
  },

  updateCrop(partial: Partial<CropState>) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage || !activeImage.crop) return

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        crop: img.crop ? { ...img.crop, ...partial } : null,
        isEdited: true,
      })),
    })
  },

  resetCrop() {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) return

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        crop: null,
      })),
      cropMode: false,
    })
  },

  toggleCropMode() {
    const state = get()
    const activeImage = getActiveImageState(state)
    
    // Can only enter crop mode if there's an active image
    if (!activeImage && !state.cropMode) return

    const newCropMode = !state.cropMode

    // When entering crop mode, initialize crop if not set
    if (newCropMode && activeImage && !activeImage.crop) {
      const defaultCrop: CropState = {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        aspectLock: false,
      }
      set({
        images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
          ...img,
          crop: defaultCrop,
        })),
        cropMode: newCropMode,
      })
    } else {
      set({ cropMode: newCropMode })
    }
  },

  setCropAspectLock(lock: boolean, aspect?: number) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage || !activeImage.crop) return

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        crop: img.crop
          ? {
              ...img.crop,
              aspectLock: lock,
              lockedAspect: lock ? aspect : undefined,
            }
          : null,
      })),
    })
  },

  // ========================================================================
  // FILTER ACTIONS (apply to active image)
  // ========================================================================

  async setFilter(filterId: string | null) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) {
      console.warn('setFilter: No active image')
      return
    }

    // If removing filter
    if (filterId === null) {
      set({
        images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
          ...img,
          filter: null,
        })),
      })
      return
    }

    // Find built-in filter
    const filterMetadata = BUILTIN_FILTERS.find((f) => f.id === filterId)
    if (!filterMetadata) {
      throw new Error(`Filter not found: ${filterId}`)
    }

    try {
      // Load the filter file
      const file = await loadBuiltinFilter(filterMetadata)
      
      // Find appropriate loader
      const loader = filterLoaderRegistry.findLoader(file)
      if (!loader) {
        throw new Error(`No loader found for filter format: ${filterMetadata.format}`)
      }

      // Load and parse the filter
      const result = await loader.load(file)

      // Generate fully filtered image cache (expensive operation, done once when filter is applied)
      const filteredImageFull = generateFilteredImageFull(activeImage.image, result.lutData)

      // Use recommended intensity if provided, otherwise default to 1.0
      const defaultIntensity = filterMetadata.recommendedIntensity ?? 1.0
      const clampedIntensity = clamp(defaultIntensity, 0, 1)

      // Create filter state with cached fully filtered image
      const filterState: FilterState = {
        filterId,
        lutData: result.lutData,
        intensity: clampedIntensity,
        filteredImageFull,
      }

      // Update image state
      set({
        images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
          ...img,
          filter: filterState,
        })),
      })
    } catch (error) {
      console.error('Failed to load filter:', error)
      throw error
    }
  },

  setFilterIntensity(intensity: number) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage || !activeImage.filter) return

    const clampedIntensity = clamp(intensity, 0, 1)

    // Just update intensity - no need to regenerate cache!
    // The renderer will blend between original and filteredImageFull based on intensity
    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        filter: img.filter
          ? {
              ...img.filter,
              intensity: clampedIntensity,
              // filteredImageFull stays the same - we blend in real-time
            }
          : null,
      })),
    })
  },

  async loadFilterFromFile(file: File) {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) return

    try {
      // Find appropriate loader
      const loader = filterLoaderRegistry.findLoader(file)
      if (!loader) {
        throw new Error(`Unsupported filter format. Supported formats: ${filterLoaderRegistry.getSupportedFormats().join(', ')}`)
      }

      // Load and parse the filter
      const result = await loader.load(file)

      // Generate a unique ID for user-uploaded filter
      const filterId = `user-${crypto.randomUUID()}`

      // Generate fully filtered image cache (expensive operation, done once)
      const filteredImageFull = generateFilteredImageFull(activeImage.image, result.lutData)

      // Create filter state with cached fully filtered image
      const filterState: FilterState = {
        filterId,
        lutData: result.lutData,
        intensity: 1.0,
        filteredImageFull,
      }

      // Update image state
      set({
        images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
          ...img,
          filter: filterState,
        })),
      })
    } catch (error) {
      console.error('Failed to load filter from file:', error)
      throw error
    }
  },

  removeFilter() {
    const state = get()
    const activeImage = getActiveImageState(state)
    if (!activeImage) return

    set({
      images: updateImageInQueue(state.images, activeImage.image.id, (img) => ({
        ...img,
        filter: null,
      })),
    })
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
    if (state._needsInitialFit && state.images.length > 0) {
      fitActiveImageToPreview()
      return
    }

    // Case 2: First time getting size with existing images
    if (!oldSize && state.images.length > 0) {
      fitActiveImageToPreview()
      return
    }

    // Case 3: Aspect ratio changed
    if (oldSize && state.images.length > 0) {
      const oldAspect = oldSize.width / oldSize.height
      const newAspect = size.width / size.height
      if (Math.abs(newAspect - oldAspect) > RESIZE.ASPECT_RATIO_THRESHOLD) {
        fitActiveImageToPreview()
        return
      }
    }
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
  // LAYOUT ACTIONS
  // ========================================================================

  toggleLeftDrawer() {
    set((state) => ({ leftDrawerOpen: !state.leftDrawerOpen }))
  },

  toggleRightDrawer() {
    set((state) => ({ rightDrawerOpen: !state.rightDrawerOpen }))
  },

  setLeftDrawerOpen(open) {
    set({ leftDrawerOpen: open })
  },

  setRightDrawerOpen(open) {
    set({ rightDrawerOpen: open })
  },

  // ========================================================================
  // COMPUTED / SELECTORS
  // ========================================================================

  snapshot() {
    const state = get()
    const activeImage = getActiveImageState(state)

    if (activeImage && state.previewSize) {
      return createImageSnapshot({
        image: activeImage.image,
        transform: activeImage.transform,
        crop: activeImage.crop,
        filter: activeImage.filter,
        canvasWidth: state.previewSize.width,
        canvasHeight: state.previewSize.height,
        background: state.background,
        ratioId: state.ratioId,
        customRatio: state.customRatio,
      })
    }

    // Fallback for no active image
    return {
      image: undefined,
      transform: { x: 0, y: 0, scale: 1 },
      crop: null,
      filter: null,
      borders: state.borders,
      background: state.background,
      dimensions: deriveDimensions(state),
      ratioId: state.ratioId,
      previewSize: state.previewSize,
    }
  },

  getActiveImage() {
    return getActiveImageState(get())
  },

  getActiveImageMetadata() {
    return getActiveImageState(get())?.image
  },
}))

// ============================================================================
// EXPORTED SELECTORS
// ============================================================================

export const selectDimensions = deriveDimensions
export const selectRatioValue = getRatioValue
export const selectFitScale = getFitScaleFromState
export const selectActiveImage = getActiveImageState

export function selectCanvasSettings(state: CanvasStoreState): CanvasSettings {
  return {
    ratioId: state.ratioId,
    customRatio: state.customRatio,
    background: state.background,
    centerSnap: state.centerSnap,
    exportOptions: state.exportOptions,
    previewSize: state.previewSize,
    borders: state.borders,
    cropMode: state.cropMode,
  }
}
