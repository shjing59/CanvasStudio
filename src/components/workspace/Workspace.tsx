import { type ReactNode } from 'react'
import { useResponsive } from '../../hooks/useResponsive'

interface WorkspaceProps {
  children: ReactNode
}

// Photoshop-style checkerboard pattern for the workspace background
const CheckerboardPattern = () => (
  <div
    className="absolute inset-0"
    style={{
      backgroundImage: `
        linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
        linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
        linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
      `,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
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
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-gray-200 overflow-hidden"
      style={
        isMobile
          ? { 
              paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' // Account for mobile nav bar + safe area
            }
          : {}
      }
    >
      <CheckerboardPattern />
      <div className="relative z-10 w-full h-full flex items-center justify-center">{children}</div>
    </div>
  )
}

