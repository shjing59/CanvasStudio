import { useState, useRef } from 'react'
import { useCanvasStore } from '../../state/canvasStore'
import { useResponsive } from '../../hooks/useResponsive'
import { PanelSection } from '../ui/PanelSection'
import { FilterPreview } from '../filters/FilterPreview'
import { BUILTIN_FILTERS } from '../../lib/filters/presets'

/**
 * Panel for applying LUT filters to images
 */
export const FilterPanel = () => {
  const { isMobile } = useResponsive()
  const activeImage = useCanvasStore((state) => state.getActiveImage())
  const setFilter = useCanvasStore((state) => state.setFilter)
  const setFilterIntensity = useCanvasStore((state) => state.setFilterIntensity)
  const loadFilterFromFile = useCanvasStore((state) => state.loadFilterFromFile)
  const removeFilter = useCanvasStore((state) => state.removeFilter)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentFilterId = activeImage?.filter?.filterId ?? null
  const currentIntensity = activeImage?.filter?.intensity ?? 1.0

  const handleFilterSelect = async (filterId: string | null) => {
    if (!activeImage) return

    setIsLoading(true)
    setError(null)

    try {
      if (filterId === null) {
        removeFilter()
      } else {
        await setFilter(filterId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load filter')
      console.error('Filter load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !activeImage) return

    setIsLoading(true)
    setError(null)

    try {
      await loadFilterFromFile(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load filter file')
      console.error('Filter file load error:', err)
    } finally {
      setIsLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleIntensityChange = (value: number) => {
    setFilterIntensity(value)
  }

  // Mobile layout: horizontal scrollable filter previews
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Filter Previews - Horizontal Scrollable */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {/* None Filter */}
          <FilterPreview
            filterId={null}
            filterName="None"
            isActive={currentFilterId === null}
            onClick={() => handleFilterSelect(null)}
          />
          {/* Built-in Filters */}
          {BUILTIN_FILTERS.map((filter) => (
            <FilterPreview
              key={filter.id}
              filterId={filter.id}
              filterName={filter.name}
              isActive={currentFilterId === filter.id}
              onClick={() => handleFilterSelect(filter.id)}
            />
          ))}
        </div>

        {/* Intensity Slider */}
        {currentFilterId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Intensity</label>
              <span className="text-xs text-slate-300">
                {Math.round(currentIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentIntensity}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-white"
              style={{
                background: `linear-gradient(to right, white 0%, white ${currentIntensity * 100}%, rgba(255,255,255,0.1) ${currentIntensity * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".cube"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
            id="filter-file-input-mobile"
          />
          <label
            htmlFor="filter-file-input-mobile"
            className={`block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Loading...' : 'Upload Custom Filter'}
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>
    )
  }

  // Desktop layout: original dropdown + controls
  if (!activeImage) {
    return (
      <PanelSection title="Filters" description="Import an image to apply filters">
        <p className="text-xs text-slate-400">No image loaded</p>
      </PanelSection>
    )
  }

  return (
    <PanelSection
      title="Filters"
      description="Apply color grading LUT filters to your image"
    >
      <div className="space-y-4">
        {/* Filter Selection */}
        <div className="space-y-2">
          <label className="block text-xs text-slate-400">Filter</label>
          <select
            value={currentFilterId ?? ''}
            onChange={(e) => handleFilterSelect(e.target.value || null)}
            disabled={isLoading}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">None</option>
            <optgroup label="Built-in Filters">
              {BUILTIN_FILTERS.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-xs text-slate-400">Custom Filter</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".cube"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
            id="filter-file-input"
          />
          <label
            htmlFor="filter-file-input"
            className={`block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Loading...' : 'Upload .cube File'}
          </label>
        </div>

        {/* Intensity Slider */}
        {currentFilterId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Intensity</label>
              <span className="text-xs text-slate-300">
                {Math.round(currentIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentIntensity}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-white"
              style={{
                background: `linear-gradient(to right, white 0%, white ${currentIntensity * 100}%, rgba(255,255,255,0.1) ${currentIntensity * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
          </div>
        )}

        {/* Remove Filter Button */}
        {currentFilterId && (
          <button
            type="button"
            onClick={() => handleFilterSelect(null)}
            disabled={isLoading}
            className="w-full rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remove Filter
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>
    </PanelSection>
  )
}
