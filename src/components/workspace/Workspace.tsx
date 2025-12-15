import { type ReactNode } from 'react'
import { useResponsive } from '../../hooks/useResponsive'
import { useCanvasStore } from '../../state/canvasStore'

interface WorkspaceProps {
  children: ReactNode
}


// Subtle gridlines overlay (like in preview design)
const GridlinesPattern = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: `
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px',
    }}
  />
)

/**
 * Workspace component - full-screen container with checkerboard pattern.
 * This layer is never exported and always fills the entire screen.
 * On mobile, accounts for bottom navigation bar.
 */
export const Workspace = ({ children }: WorkspaceProps) => {
  const { isMobile } = useResponsive()
  const mobileToolbarOpen = useCanvasStore((state) => state.mobileToolbarOpen)
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-[#181819] overflow-hidden"
      style={
        isMobile
          ? { 
              // Account for mobile nav bar + toolbar (if open, max ~250px) + safe area
              paddingBottom: mobileToolbarOpen
                ? 'calc(64px + 250px + env(safe-area-inset-bottom, 0px))'
                : 'calc(64px + env(safe-area-inset-bottom, 0px))'
            }
          : {}
      }
    >

      <GridlinesPattern />

      <div className="relative z-10 w-full h-full flex items-center justify-center">{children}</div>
    </div>
  )
}

