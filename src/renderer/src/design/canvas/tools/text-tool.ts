import { useCanvasSelectionStore } from '../canvas-selection-store'
import { useCanvasShapeStore } from '../canvas-shape-store'
import { useCanvasViewportStore } from '../canvas-viewport-store'
import { createDefaultShape } from '../canvas-types'
import type { CanvasPointerEvent, CanvasToolHandler } from './tool-types'

export function createTextTool(): CanvasToolHandler {
  return {
    cursor: 'text',

    onPointerDown(e: CanvasPointerEvent) {
      const shape = createDefaultShape('text', e.canvasX, e.canvasY)
      useCanvasShapeStore.getState().addShape(shape)
      useCanvasSelectionStore.getState().select([shape.id])
      useCanvasSelectionStore.getState().setEditing(shape.id)
      useCanvasViewportStore.getState().setActiveTool('select')
    },

    onPointerMove() {},
    onPointerUp() {}
  }
}
