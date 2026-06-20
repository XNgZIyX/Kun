import { memo } from 'react'
import type { CanvasShape } from '../../../../design/canvas/canvas-types'

function ImageShapeInner({ shape }: { shape: CanvasShape }) {
  if (!shape.imageUrl) {
    return (
      <rect
        x={0}
        y={0}
        width={shape.width}
        height={shape.height}
        fill="#e5e7eb"
        stroke="#d1d5db"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
    )
  }

  return (
    <image
      x={0}
      y={0}
      width={shape.width}
      height={shape.height}
      href={shape.imageUrl}
      preserveAspectRatio="xMidYMid slice"
    />
  )
}

export const ImageShape = memo(ImageShapeInner)
