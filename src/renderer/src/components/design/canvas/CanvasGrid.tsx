import { memo } from 'react'

function CanvasGridInner({ zoom }: { zoom: number }) {
  const smallSize = 10
  const largeSize = 100
  const dotRadius = Math.max(0.5, 1 / zoom)
  const dotColor = 'rgba(0,0,0,0.12)'
  const lineColor = 'rgba(0,0,0,0.06)'

  return (
    <>
      <defs>
        <pattern id="grid-small" width={smallSize} height={smallSize} patternUnits="userSpaceOnUse">
          <circle cx={smallSize / 2} cy={smallSize / 2} r={dotRadius} fill={dotColor} />
        </pattern>
        <pattern id="grid-large" width={largeSize} height={largeSize} patternUnits="userSpaceOnUse">
          <rect width={largeSize} height={largeSize} fill="url(#grid-small)" />
          <line x1={0} y1={0} x2={largeSize} y2={0} stroke={lineColor} strokeWidth={Math.max(0.5, 1 / zoom)} />
          <line x1={0} y1={0} x2={0} y2={largeSize} stroke={lineColor} strokeWidth={Math.max(0.5, 1 / zoom)} />
        </pattern>
      </defs>
      <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid-large)" />
    </>
  )
}

export const CanvasGrid = memo(CanvasGridInner)
