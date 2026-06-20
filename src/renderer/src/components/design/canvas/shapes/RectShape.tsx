import { memo } from 'react'
import type { CanvasShape } from '../../../../design/canvas/canvas-types'

function fillToSvg(shape: CanvasShape): string {
  if (shape.fills.length === 0) return 'none'
  return shape.fills[0].color
}

function fillOpacity(shape: CanvasShape): number {
  if (shape.fills.length === 0) return 0
  return shape.fills[0].opacity
}

function RectShapeInner({ shape }: { shape: CanvasShape }) {
  const r = shape.cornerRadius
  const rx = typeof r === 'number' ? r : r[0]
  const ry = typeof r === 'number' ? r : r[1]

  return (
    <>
      <rect
        x={0}
        y={0}
        width={shape.width}
        height={shape.height}
        rx={rx}
        ry={ry}
        fill={fillToSvg(shape)}
        fillOpacity={fillOpacity(shape)}
      />
      {shape.strokes.map((s, i) => (
        <rect
          key={i}
          x={0}
          y={0}
          width={shape.width}
          height={shape.height}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          strokeOpacity={s.opacity}
        />
      ))}
    </>
  )
}

export const RectShape = memo(RectShapeInner)
