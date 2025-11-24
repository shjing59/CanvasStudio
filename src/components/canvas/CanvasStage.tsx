import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useGesture } from '@use-gesture/react'
import { useResizeObserver } from '../../hooks/useResizeObserver'
import { DEFAULT_BASE_WIDTH, convertBorderToBasePx } from '../../lib/canvas/math'
import { findRatioValue } from '../../lib/canvas/ratios'
import { renderScene } from '../../lib/canvas/render'
import { useCanvasStore } from '../../state/canvasStore'

const MIN_PREVIEW_WIDTH = 240
type CanvasDimensions = { baseWidth: number; baseHeight: number; ratio: number }

export const CanvasStage = () => {
  const image = useCanvasStore((state) => state.image)
  const transform = useCanvasStore((state) => state.transform)
  const borders = useCanvasStore((state) => state.borders)
  const background = useCanvasStore((state) => state.background)
  const nudgePosition = useCanvasStore((state) => state.nudgePosition)
  const adjustScale = useCanvasStore((state) => state.adjustScale)
  const setPreviewSize = useCanvasStore((state) => state.setPreviewSize)
  const ratioId = useCanvasStore((state) => state.ratioId)
  const customRatio = useCanvasStore((state) => state.customRatio)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { ref, size } = useResizeObserver<HTMLDivElement>()

  const dimensions = useMemo(() => {
    const baseWidth = image?.width ?? DEFAULT_BASE_WIDTH
    const ratio = findRatioValue(ratioId, { custom: customRatio, image })
    const baseHeight = baseWidth / ratio
    return { baseWidth, baseHeight, ratio }
  }, [customRatio, image, ratioId])

  const display = useMemo(() => {
    const width = Math.max(
      MIN_PREVIEW_WIDTH,
      Math.min(size.width || MIN_PREVIEW_WIDTH, 1400)
    )
    const scale = width / dimensions.baseWidth
    const height = dimensions.baseHeight * scale
    return { width, height, scale }
  }, [size.width, dimensions.baseWidth, dimensions.baseHeight])

  const lastPreviewSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  useEffect(() => {
    if (display.width <= 0 || display.height <= 0) {
      return
    }
    const sameWidth = Math.abs(lastPreviewSize.current.width - display.width) < 0.5
    const sameHeight = Math.abs(lastPreviewSize.current.height - display.height) < 0.5
    if (sameWidth && sameHeight) {
      return
    }
    lastPreviewSize.current = { width: display.width, height: display.height }
    setPreviewSize({ width: display.width, height: display.height })
  }, [display.width, display.height, setPreviewSize])

  useCanvasDrawing({
    canvasRef,
    background,
    borders,
    display,
    image,
    transform,
    dimensions,
  })

  // Gesture binding keeps the surface feature-parity with mobile + desktop input.
  const bind = useGesture(
    {
      onDrag: ({ delta: [dx, dy], shiftKey, event }) => {
        event?.preventDefault()
        if (shiftKey) {
          const factor = Math.max(0.5, 1 - dy * 0.002)
          adjustScale(factor)
          return
        }
        nudgePosition({
          x: dx / display.scale,
          y: dy / display.scale,
        })
      },
      onWheel: ({ delta: [, dy], event }) => {
        event.preventDefault()
        const factor = Math.exp(-dy / 600)
        adjustScale(factor)
      },
      onPinch: ({ delta: [d], event }) => {
        event.preventDefault()
        const factor = Math.max(0.5, 1 + d / 200)
        adjustScale(factor)
      },
    },
    {
      eventOptions: { passive: false },
    }
  )

  return (
    <div
      ref={ref}
      className="relative w-full flex-1 flex items-center justify-center"
    >
      <div
        {...bind()}
        className="relative shadow-2xl shadow-black/50 rounded-3xl overflow-hidden bg-white/5"
        style={{
          width: display.width,
          height: display.height,
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none select-none"
          style={{
            width: display.width,
            height: display.height,
            background,
          }}
        />
        {!image && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Import an image to begin
          </div>
        )}
      </div>
    </div>
  )
}

interface DrawingArgs {
  canvasRef: RefObject<HTMLCanvasElement | null>
  background: string
  borders: CanvasStageProps['borders']
  display: { width: number; height: number; scale: number }
  image: CanvasStageProps['image']
  transform: CanvasStageProps['transform']
  dimensions: CanvasDimensions
}

interface CanvasStageProps {
  image?: ReturnType<typeof useCanvasStore.getState>['image']
  transform: ReturnType<typeof useCanvasStore.getState>['transform']
  borders: ReturnType<typeof useCanvasStore.getState>['borders']
}

// Draw the latest state snapshot whenever any visual dependency changes.
const useCanvasDrawing = ({
  canvasRef,
  background,
  borders,
  display,
  image,
  transform,
  dimensions,
}: DrawingArgs) => {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })
    if (!ctx) return
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    canvas.width = Math.round(display.width * dpr)
    canvas.height = Math.round(display.height * dpr)
    ctx.scale(dpr, dpr)
    const topPx = convertBorderToBasePx(borders.top, dimensions.baseHeight) * display.scale
    const bottomPx =
      convertBorderToBasePx(borders.bottom, dimensions.baseHeight) * display.scale
    renderScene({
      ctx,
      width: display.width,
      height: display.height,
      background,
      transform: {
        x: transform.x * display.scale,
        y: transform.y * display.scale,
        scale: transform.scale,
      },
      borders: { top: topPx, bottom: bottomPx },
      image,
    })
  }, [
    canvasRef,
    background,
    borders.bottom,
    borders.top,
    dimensions.baseHeight,
    display.height,
    display.scale,
    display.width,
    image,
    transform.scale,
    transform.x,
    transform.y,
  ])
}

