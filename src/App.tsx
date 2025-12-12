import { useCanvasStore } from './state/canvasStore'
import { useResponsive } from './hooks/useResponsive'
import { LeftDrawer } from './components/drawers/LeftDrawer'
import { RightDrawer } from './components/drawers/RightDrawer'
import { CanvasStage } from './components/canvas/CanvasStage'
import { MobileNav } from './components/navigation/MobileNav'

function App() {
  const { isMobile } = useResponsive()
  const leftDrawerOpen = useCanvasStore((state) => state.leftDrawerOpen)
  const rightDrawerOpen = useCanvasStore((state) => state.rightDrawerOpen)

  return (
    <div className="relative min-h-screen text-white">
      <LeftDrawer />
      
      {/* Center canvas area with dynamic margins (desktop only) */}
      <div 
        className="transition-all duration-300"
        style={
          isMobile
            ? {} // No margins on mobile - drawers are overlays
            : {
                marginLeft: leftDrawerOpen ? '300px' : '0',
                marginRight: rightDrawerOpen ? '350px' : '0',
              }
        }
      >
        <CanvasStage />
      </div>
      
      <RightDrawer />
      
      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  )
}

export default App
