import { memo } from 'react'
import type { CanvasShape, Rect } from '../../../design/canvas/canvas-types'
import { getSelectionBounds } from '../../../design/canvas/canvas-hit-test'

const HANDLE_SIZE = 8
const SELECTION_COLOR = '#3b82f6'

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

function SelectionOverlayInner({
  selectedIds,
  hoverTargetId,
  marqueeRect,
  objects,
  zoom
}: {
  selectedIds: Set<string>
  hoverTargetId: string | null
  marqueeRect: Rect | null
  objects: Record<string, CanvasShape>
  zoom: number
}) {
  const sw = Math.max(1, 1 / zoom)
  const hs = HANDLE_SIZE / zoom

  const hoverShape = hoverTargetId && !selectedIds.has(hoverTargetId) ? objects[hoverTargetId] : null

  const bounds = selectedIds.size > 0 ? getSelectionBounds(objects, selectedIds) : null

  const handlePositions: { pos: HandlePosition; cx: number; cy: number }[] = bounds
    ? [
        { pos: 'nw', cx: bounds.x, cy: bounds.y },
        { pos: 'n', cx: bounds.x + bounds.width / 2, cy: bounds.y },
        { pos: 'ne', cx: bounds.x + bounds.width, cy: bounds.y },
        { pos: 'e', cx: bounds.x + bounds.width, cy: bounds.y + bounds.height / 2 },
        { pos: 'se', cx: bounds.x + bounds.width, cy: bounds.y + bounds.height },
        { pos: 's', cx: bounds.x + bounds.width / 2, cy: bounds.y + bounds.height },
        { pos: 'sw', cx: bounds.x, cy: bounds.y + bounds.height },
        { pos: 'w', cx: bounds.x, cy: bounds.y + bounds.height / 2 }
      ]
    : []

  return (
    <>
      {hoverShape && (
        <rect
          x={hoverShape.x}
          y={hoverShape.y}
          width={hoverShape.width}
          height={hoverShape.height}
          fill="none"
          stroke={SELECTION_COLOR}
          strokeWidth={sw}
          strokeOpacity={0.5}
          pointerEvents="none"
        />
      )}

      {bounds && (
        <rect
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          fill="none"
          stroke={SELECTION_COLOR}
          strokeWidth={sw}
          pointerEvents="none"
        />
      )}

      {handlePositions.map(({ pos, cx, cy }) => (
        <rect
          key={pos}
          x={cx - hs / 2}
          y={cy - hs / 2}
          width={hs}
          height={hs}
          fill="#ffffff"
          stroke={SELECTION_COLOR}
          strokeWidth={sw}
          style={{ cursor: handleCursor(pos) }}
          data-handle={pos}
          pointerEvents="all"
        />
      ))}

      {marqueeRect && (
        <rect
          x={marqueeRect.x}
          y={marqueeRect.y}
          width={marqueeRect.width}
          height={marqueeRect.height}
          fill="rgba(59,130,246,0.08)"
          stroke={SELECTION_COLOR}
          strokeWidth={sw}
          strokeDasharray={`${4 / zoom} ${4 / zoom}`}
          pointerEvents="none"
        />
      )}
    </>
  )
}

function handleCursor(pos: HandlePosition): string {
  switch (pos) {
    case 'nw':
    case 'se':
      return 'nwse-resize'
    case 'ne':
    case 'sw':
      return 'nesw-resize'
    case 'n':
    case 's':
      return 'ns-resize'
    case 'e':
    case 'w':
      return 'ew-resize'
  }
}

export const SelectionOverlay = memo(SelectionOverlayInner)
