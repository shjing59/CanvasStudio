import { useState } from 'react'
import { BottomToolbar } from './components/BottomToolbar'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { CanvasStage } from './components/canvas/CanvasStage'
import { ControlPanel } from './components/controls/ControlPanel'

function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  return (
    <div className="relative min-h-screen text-white">
      <KeyboardShortcuts />
      <CanvasStage />
      
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="fixed top-4 right-4 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-canvas-control/80 backdrop-blur border border-white/10 text-white hover:bg-canvas-control transition-colors shadow-lg"
        aria-label={isPanelOpen ? 'Hide controls' : 'Show controls'}
      >
        {isPanelOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-20 h-screen w-full md:max-w-md bg-canvas-control/95 backdrop-blur-lg border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 lg:p-6">
          <ControlPanel />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden">
        <BottomToolbar />
      </div>
    </div>
  )
}

export default App
