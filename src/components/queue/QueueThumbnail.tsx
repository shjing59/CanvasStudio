import type { ImageState } from '../../types/image'

interface QueueThumbnailProps {
  imageState: ImageState
  isActive: boolean
  index: number
  onClick: () => void
  onRemove: () => void
}

/**
 * Individual thumbnail in the filmstrip queue.
 * Shows image preview, index number, edit indicator, and remove button.
 */
export const QueueThumbnail = ({
  imageState,
  isActive,
  index,
  onClick,
  onRemove,
}: QueueThumbnailProps) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove()
  }

  return (
    <div
      className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden cursor-pointer transition-all ${
        isActive
          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
          : 'opacity-60 hover:opacity-100'
      }`}
      onClick={onClick}
      title={imageState.image.fileName}
    >
      {/* Thumbnail image */}
      <img
        src={imageState.image.src}
        alt={imageState.image.fileName}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Index badge */}
      <div className="absolute top-0.5 left-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-black/60 text-white text-[10px] font-semibold px-1">
        {index}
      </div>

      {/* Edit indicator */}
      {imageState.isEdited && (
        <div
          className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-400"
          title="Edited"
        />
      )}

      {/* Remove button (only visible on hover) */}
      <button
        type="button"
        onClick={handleRemove}
        className="absolute bottom-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ opacity: isActive ? 1 : undefined }}
        title="Remove image"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
      )}
    </div>
  )
}

