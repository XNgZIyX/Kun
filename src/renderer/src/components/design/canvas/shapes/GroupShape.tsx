import { memo } from 'react'
import type { CanvasShape } from '../../../../design/canvas/canvas-types'
import { ShapeDispatcher } from './ShapeDispatcher'

function GroupShapeInner({
  shape,
  objects
}: {
  shape: CanvasShape
  objects: Record<string, CanvasShape>
}) {
  return (
    <>
      {shape.children.map((childId) => {
        const child = objects[childId]
        if (!child || !child.visible) return null
        return <ShapeDispatcher key={childId} shapeId={childId} objects={objects} />
      })}
    </>
  )
}

export const GroupShape = memo(GroupShapeInner)
