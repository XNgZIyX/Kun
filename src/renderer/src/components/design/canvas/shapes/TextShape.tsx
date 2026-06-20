import { memo } from 'react'
import type { CanvasShape } from '../../../../design/canvas/canvas-types'

function TextShapeInner({ shape }: { shape: CanvasShape }) {
  return (
    <foreignObject x={0} y={0} width={shape.width} height={shape.height}>
      <div
        style={{
          width: '100%',
          height: '100%',
          fontFamily: shape.fontFamily ?? 'Inter, system-ui, sans-serif',
          fontSize: `${shape.fontSize ?? 16}px`,
          fontWeight: shape.fontWeight ?? 400,
          lineHeight: shape.lineHeight ?? 1.5,
          textAlign: shape.textAlign ?? 'left',
          color: shape.fontColor ?? '#000000',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {shape.textContent ?? ''}
      </div>
    </foreignObject>
  )
}

export const TextShape = memo(TextShapeInner)
