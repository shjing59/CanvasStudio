import { useCanvasStore } from '../../state/canvasStore'
import { QueueThumbnail } from './QueueThumbnail'

interface ImageQueueProps {
  onAddMore: () => void
}

/**
 * Filmstrip queue showing all imported images.
 * Displays horizontally scrollable thumbnails with the active one highlighted.
 */
export const ImageQueue = ({ onAddMore }: ImageQueueProps) => {
  const images = useCanvasStore((state) => state.images)
  const activeImageId = useCanvasStore((state) => state.activeImageId)
  const setActiveImage = useCanvasStore((state) => state.setActiveImage)
  const removeImage = useCanvasStore((state) => state.removeImage)

  if (images.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-white/20">
      {images.map((imageState, index) => (
        <QueueThumbnail
          key={imageState.image.id}
          imageState={imageState}
          isActive={imageState.image.id === activeImageId}
          index={index + 1}
          onClick={() => setActiveImage(imageState.image.id)}
          onRemove={() => removeImage(imageState.image.id)}
        />
      ))}
      
      {/* Add more button */}
      <button
        type="button"
        onClick={onAddMore}
        className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-lg border-2 border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white/60 transition-colors"
        title="Add more images"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

