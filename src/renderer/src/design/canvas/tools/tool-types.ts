export type CanvasPointerEvent = {
  canvasX: number
  canvasY: number
  clientX: number
  clientY: number
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  ctrlKey: boolean
}

export interface CanvasToolHandler {
  onPointerDown(e: CanvasPointerEvent): void
  onPointerMove(e: CanvasPointerEvent): void
  onPointerUp(e: CanvasPointerEvent): void
  cursor: string
}
