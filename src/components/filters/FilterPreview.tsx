import { useState, useEffect } from 'react'
import { generateSampleFilterPreview, generateSamplePreviewNoFilter } from '../../lib/filters/previewGenerator'

interface FilterPreviewProps {
  filterId: string | null
  filterName: string
  isActive: boolean
  onClick: () => void
}

/**
 * Circular filter preview component for mobile toolbar
 * Always uses the static sample image from public folder
 */
export const FilterPreview = ({ filterId, filterName, isActive, onClick }: FilterPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    
    const generatePreview = async () => {
      try {
        let url: string
        if (!filterId) {
          // "None" filter - show sample image without filter
          url = await generateSamplePreviewNoFilter(80)
        } else {
          // Apply filter to sample image
          url = await generateSampleFilterPreview(filterId, 80)
        }
        setPreviewUrl(url)
      } catch (error) {
        console.error('Failed to load filter preview:', error)
        setPreviewUrl(null)
      } finally {
        setIsLoading(false)
      }
    }

    generatePreview()
  }, [filterId])

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-shrink-0 transition-transform active:scale-95"
      disabled={isLoading}
    >
      <div
        className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all ${
          isActive
            ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.3)]'
            : 'border-white/20'
        }`}
      >
        {isLoading ? (
          <div className="w-full h-full bg-slate-700 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={filterName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-700" />
        )}
      </div>
      <span
        className={`text-[11px] text-center max-w-[80px] truncate ${
          isActive ? 'text-white font-medium' : 'text-slate-400'
        }`}
      >
        {filterName}
      </span>
    </button>
  )
}

