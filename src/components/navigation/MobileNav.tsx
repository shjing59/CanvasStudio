import { useCanvasStore } from '../../state/canvasStore'
import { useResponsive } from '../../hooks/useResponsive'
import { useExportImage } from '../../hooks/useExportImage'

/**
 * Mobile bottom navigation bar
 * Only visible on mobile devices (< 768px)
 */
export const MobileNav = () => {
  const { isMobile } = useResponsive()
  const leftDrawerOpen = useCanvasStore((state) => state.leftDrawerOpen)
  const rightDrawerOpen = useCanvasStore((state) => state.rightDrawerOpen)
  const toggleLeftDrawer = useCanvasStore((state) => state.toggleLeftDrawer)
  const toggleRightDrawer = useCanvasStore((state) => state.toggleRightDrawer)
  const setRightDrawerOpen = useCanvasStore((state) => state.setRightDrawerOpen)
  const setLeftDrawerOpen = useCanvasStore((state) => state.setLeftDrawerOpen)
  const images = useCanvasStore((state) => state.images)
  const { exportImage, exportAllImages, isExporting, canShare } = useExportImage()

  // Don't render on desktop
  if (!isMobile) return null

  const hasImages = images.length > 0
  const hasMultipleImages = images.length > 1
  const isReady = hasImages && !isExporting

  const handleImportClick = () => {
    if (rightDrawerOpen) {
      setRightDrawerOpen(false)
    }
    toggleLeftDrawer()
  }

  const handleControlsClick = () => {
    if (leftDrawerOpen) {
      setLeftDrawerOpen(false)
    }
    toggleRightDrawer()
  }

  const handleExportClick = async () => {
    // Close any open drawers
    if (leftDrawerOpen) setLeftDrawerOpen(false)
    if (rightDrawerOpen) setRightDrawerOpen(false)

    if (hasMultipleImages) {
      await exportAllImages()
    } else {
      await exportImage()
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-canvas-control/95 backdrop-blur border-t border-white/10 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {/* Import/Close Button */}
        <button
          type="button"
          onClick={leftDrawerOpen ? handleImportClick : handleImportClick}
          className={`flex flex-col items-center justify-center gap-1 min-w-[60px] h-12 rounded-lg transition-colors ${
            leftDrawerOpen
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          aria-label={leftDrawerOpen ? 'Close import panel' : 'Import images'}
        >
          {leftDrawerOpen ? (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-[10px] font-medium">Close</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span className="text-[10px] font-medium">Import</span>
            </>
          )}
        </button>

        {/* Controls/Close Button */}
        <button
          type="button"
          onClick={handleControlsClick}
          className={`flex flex-col items-center justify-center gap-1 min-w-[60px] h-12 rounded-lg transition-colors ${
            rightDrawerOpen
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          aria-label={rightDrawerOpen ? 'Close controls panel' : 'Canvas controls'}
        >
          {rightDrawerOpen ? (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-[10px] font-medium">Close</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span className="text-[10px] font-medium">Controls</span>
            </>
          )}
        </button>

        {/* Export Button */}
        <button
          type="button"
          onClick={handleExportClick}
          disabled={!isReady}
          className={`flex flex-col items-center justify-center gap-1 min-w-[60px] h-12 rounded-lg transition-colors ${
            isReady
              ? 'bg-white text-black hover:bg-slate-100'
              : 'bg-white/10 text-slate-500 cursor-not-allowed'
          }`}
          aria-label={isExporting ? 'Exporting...' : 'Export image'}
        >
          {isExporting ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-[10px] font-medium">Exporting</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="text-[10px] font-medium">
                {hasMultipleImages ? `Export (${images.length})` : canShare ? 'Share' : 'Export'}
              </span>
            </>
          )}
        </button>
      </div>
    </nav>
  )
}
