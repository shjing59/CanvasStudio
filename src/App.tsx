import { useCanvasStore } from './state/canvasStore'
import { LeftDrawer } from './components/drawers/LeftDrawer'
import { RightDrawer } from './components/drawers/RightDrawer'
import { CanvasStage } from './components/canvas/CanvasStage'

function App() {
  const leftDrawerOpen = useCanvasStore((state) => state.leftDrawerOpen)
  const rightDrawerOpen = useCanvasStore((state) => state.rightDrawerOpen)

  return (
    <div className="relative min-h-screen text-white">
      <LeftDrawer />
      
      {/* Center canvas area with dynamic margins */}
      <div 
        className="transition-all duration-300"
        style={{
          marginLeft: leftDrawerOpen ? '300px' : '0',
          marginRight: rightDrawerOpen ? '350px' : '0',
        }}
      >
        <CanvasStage />
      </div>
      
      <RightDrawer />
    </div>
  )
}

export default App
