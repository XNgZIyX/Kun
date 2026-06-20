import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useCanvasShapeStore } from '../../../design/canvas/canvas-shape-store'
import { useCanvasViewportStore } from '../../../design/canvas/canvas-viewport-store'
import { useCanvasSelectionStore } from '../../../design/canvas/canvas-selection-store'
import { createSelectTool } from '../../../design/canvas/tools/select-tool'
import { createRectTool } from '../../../design/canvas/tools/rect-tool'
import { createEllipseTool } from '../../../design/canvas/tools/ellipse-tool'
import { createTextTool } from '../../../design/canvas/tools/text-tool'
import { createFrameTool } from '../../../design/canvas/tools/frame-tool'
import { createHandTool } from '../../../design/canvas/tools/hand-tool'
import type { CanvasToolHandler } from '../../../design/canvas/tools/tool-types'
import type { CanvasTool } from '../../../design/canvas/canvas-types'
import { handleCanvasKeyDown, handleCanvasKeyUp } from '../../../design/canvas/canvas-shortcuts'
import { ShapeDispatcher } from './shapes/ShapeDispatcher'
import { CanvasGrid } from './CanvasGrid'
import { CanvasToolbar } from './CanvasToolbar'
import { SelectionOverlay } from './SelectionOverlay'

const toolFactories: Record<CanvasTool, () => CanvasToolHandler> = {
  select: createSelectTool,
  rect: createRectTool,
  ellipse: createEllipseTool,
  text: createTextTool,
  frame: createFrameTool,
  image: createSelectTool,
  hand: createHandTool
}

export function CanvasViewport() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const document = useCanvasShapeStore((s) => s.document)
  const vbox = useCanvasViewportStore((s) => s.vbox)
  const activeTool = useCanvasViewportStore((s) => s.activeTool)
  const gridVisible = useCanvasViewportStore((s) => s.gridVisible)
  const containerWidth = useCanvasViewportStore((s) => s.containerWidth)
  const setContainerSize = useCanvasViewportStore((s) => s.setContainerSize)

  const selectedIds = useCanvasSelectionStore((s) => s.selectedIds)
  const hoverTargetId = useCanvasSelectionStore((s) => s.hoverTargetId)
  const marqueeRect = useCanvasSelectionStore((s) => s.marqueeRect)

  const zoom = containerWidth / vbox.width

  const tool = useMemo(() => toolFactories[activeTool](), [activeTool])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize(entry.contentRect.width, entry.contentRect.height)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [setContainerSize])

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      const sx = (clientX - rect.left) / rect.width
      const sy = (clientY - rect.top) / rect.height
      return {
        x: vbox.x + sx * vbox.width,
        y: vbox.y + sy * vbox.height
      }
    },
    [vbox]
  )

  const makePointerEvent = useCallback(
    (e: React.PointerEvent) => {
      const canvas = screenToCanvas(e.clientX, e.clientY)
      return {
        canvasX: canvas.x,
        canvasY: canvas.y,
        clientX: e.clientX,
        clientY: e.clientY,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey
      }
    },
    [screenToCanvas]
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      tool.onPointerDown(makePointerEvent(e))
    },
    [tool, makePointerEvent]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      tool.onPointerMove(makePointerEvent(e))
    },
    [tool, makePointerEvent]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      tool.onPointerUp(makePointerEvent(e))
    },
    [tool, makePointerEvent]
  )

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const store = useCanvasViewportStore.getState()
      const canvas = screenToCanvas(e.clientX, e.clientY)

      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY > 0 ? 0.9 : 1.1
        store.zoomTo(factor, canvas)
      } else {
        const scaleX = store.vbox.width / store.containerWidth
        const scaleY = store.vbox.height / store.containerHeight
        store.pan(e.deltaX * scaleX, e.deltaY * scaleY)
      }
    },
    [screenToCanvas]
  )

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleCanvasKeyDown(e)
    const onKeyUp = (e: KeyboardEvent) => handleCanvasKeyUp(e)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const viewBoxStr = `${vbox.x} ${vbox.y} ${vbox.width} ${vbox.height}`
  const cursor = activeTool === 'hand' ? 'grab' : tool.cursor

  return (
    <div className="flex flex-col h-full w-full">
      <CanvasToolbar />
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ background: '#f8f8f8' }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox={viewBoxStr}
          xmlns="http://www.w3.org/2000/svg"
          style={{ cursor }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
        >
          {gridVisible && <CanvasGrid zoom={zoom} />}

          <g id="shape-layer">
            {document.objects[document.rootId]?.children.map((childId) => {
              const child = document.objects[childId]
              if (!child || !child.visible) return null
              return (
                <ShapeDispatcher
                  key={childId}
                  shapeId={childId}
                  objects={document.objects}
                />
              )
            })}
          </g>

          <g id="overlay-layer" style={{ pointerEvents: 'none' }}>
            <SelectionOverlay
              selectedIds={selectedIds}
              hoverTargetId={hoverTargetId}
              marqueeRect={marqueeRect}
              objects={document.objects}
              zoom={zoom}
            />
          </g>
        </svg>
      </div>
    </div>
  )
}
