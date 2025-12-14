import { useState, useEffect } from 'react'

/**
 * Responsive breakpoint detection hook
 * 
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1023px
 * - Desktop: ≥ 1024px
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight }
    }
    return { width: 0, height: 0 }
  })

  useEffect(() => {
    let ticking = false
    let rafId: number | null = null

    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
      ticking = false
    }

    const handleResize = () => {
      if (!ticking) {
        ticking = true
        // Use requestAnimationFrame to batch resize updates
        rafId = requestAnimationFrame(updateSize)
      }
    }

    // Initial size
    updateSize()
    
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  const isMobile = windowSize.width < 768
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024
  const isDesktop = windowSize.width >= 1024

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
  }
}

