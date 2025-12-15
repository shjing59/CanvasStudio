import { useEffect, useCallback } from 'react'
import { useCanvasStore } from '../../state/canvasStore'
import { useResponsive } from '../../hooks/useResponsive'
import { ControlPanel } from '../controls/ControlPanel'

/**
 * Right drawer containing all canvas control panels.
 * Wraps the existing ControlPanel component.
 */
export const RightDrawer = () => {
  const { isMobile } = useResponsive()
  const rightDrawerOpen = useCanvasStore((state) => state.rightDrawerOpen)
  const leftDrawerOpen = useCanvasStore((state) => state.leftDrawerOpen)
  const toggleRightDrawer = useCanvasStore((state) => state.toggleRightDrawer)
  const setLeftDrawerOpen = useCanvasStore((state) => state.setLeftDrawerOpen)

  // Auto-close left drawer when opening right drawer on mobile
  const handleToggle = useCallback(() => {
    if (isMobile && !rightDrawerOpen && leftDrawerOpen) {
      setLeftDrawerOpen(false)
    }
    toggleRightDrawer()
  }, [isMobile, rightDrawerOpen, leftDrawerOpen, toggleRightDrawer, setLeftDrawerOpen])

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (isMobile && rightDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else if (!leftDrawerOpen) {
      document.body.style.overflow = ''
    }
    return () => {
      if (!leftDrawerOpen) {
        document.body.style.overflow = ''
      }
    }
  }, [isMobile, rightDrawerOpen, leftDrawerOpen])

  // Hide right drawer on mobile (replaced by bottom toolbar)
  if (isMobile) {
    return null
  }

  return (
    <>
      {/* Toggle button on left edge */}
      <button
          type="button"
          onClick={handleToggle}
          className={`fixed top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-16 rounded-l-lg bg-canvas-control/80 backdrop-blur border border-r-0 border-white/10 text-white/60 hover:text-white hover:bg-canvas-control transition-all ${
            rightDrawerOpen ? 'right-[350px]' : 'right-0'
          }`}
          title={rightDrawerOpen ? 'Hide controls panel' : 'Show controls panel'}
        >
          <svg
            className={`w-4 h-4 transition-transform ${rightDrawerOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bg-canvas-control/90 backdrop-blur border-l border-white/10 transition-transform duration-300 ease-in-out overflow-y-auto overflow-x-hidden z-20 w-[350px] h-screen ${
          rightDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 lg:p-6 min-w-0">
          <ControlPanel />
        </div>
      </div>
    </>
  )
}
