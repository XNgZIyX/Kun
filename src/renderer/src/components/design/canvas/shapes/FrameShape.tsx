import { memo } from 'react'
import type { CanvasShape } from '../../../../design/canvas/canvas-types'
import { ShapeDispatcher } from './ShapeDispatcher'

function FrameShapeInner({
  shape,
  objects
}: {
  shape: CanvasShape
  objects: Record<string, CanvasShape>
}) {
  const fill = shape.fills.length > 0 ? shape.fills[0].color : 'none'
  const fillOpacity = shape.fills.length > 0 ? shape.fills[0].opacity : 0
  const clipId = shape.clipContent ? `clip-${shape.id}` : undefined

  return (
    <>
      <rect
        x={0}
        y={0}
        width={shape.width}
        height={shape.height}
        fill={fill}
        fillOpacity={fillOpacity}
      />
      {shape.strokes.map((s, i) => (
        <rect
          key={i}
          x={0}
          y={0}
          width={shape.width}
          height={shape.height}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          strokeOpacity={s.opacity}
        />
      ))}
      {clipId && (
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={shape.width} height={shape.height} />
          </clipPath>
        </defs>
      )}
      <g clipPath={clipId ? `url(#${clipId})` : undefined}>
        {shape.children.map((childId) => {
          const child = objects[childId]
          if (!child || !child.visible) return null
          return <ShapeDispatcher key={childId} shapeId={childId} objects={objects} />
        })}
      </g>
    </>
  )
}

export const FrameShape = memo(FrameShapeInner)
