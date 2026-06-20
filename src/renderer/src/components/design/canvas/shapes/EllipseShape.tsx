import { memo } from 'react'
import type { CanvasShape } from '../../../../design/canvas/canvas-types'

function EllipseShapeInner({ shape }: { shape: CanvasShape }) {
  const cx = shape.width / 2
  const cy = shape.height / 2
  const rx = shape.width / 2
  const ry = shape.height / 2
  const fill = shape.fills.length > 0 ? shape.fills[0].color : 'none'
  const fillOpacity = shape.fills.length > 0 ? shape.fills[0].opacity : 0

  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} fillOpacity={fillOpacity} />
      {shape.strokes.map((s, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
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

export const EllipseShape = memo(EllipseShapeInner)
