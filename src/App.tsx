import { BottomToolbar } from './components/BottomToolbar'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { CanvasStage } from './components/canvas/CanvasStage'
import { ControlPanel } from './components/controls/ControlPanel'

function App() {
  return (
    <div className="min-h-screen bg-canvas-surface text-white">
      <KeyboardShortcuts />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:py-10">
        <header className="space-y-3 text-center lg:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            CanvasStudio
          </p>
          <h1 className="text-3xl font-semibold text-white lg:text-4xl">
            Pixel-perfect canvases, pro borders, instant exports.
          </h1>
          <p className="text-base text-slate-400 lg:text-lg">
            Import any photo, reframe for social ratios, and export in original resolution
            — all inside a minimal interface inspired by InShot.
          </p>
        </header>
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <CanvasStage />
          </div>
          <ControlPanel />
        </section>
        <BottomToolbar />
      </main>
    </div>
  )
}

export default App
