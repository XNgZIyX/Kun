import { useCanvasViewportStore } from './canvas-viewport-store'
import { useCanvasShapeStore } from './canvas-shape-store'
import { useCanvasSelectionStore } from './canvas-selection-store'
import type { CanvasTool } from './canvas-types'

const KEY_TO_TOOL: Record<string, CanvasTool> = {
  v: 'select',
  r: 'rect',
  o: 'ellipse',
  t: 'text',
  f: 'frame',
  h: 'hand'
}

export function handleCanvasKeyDown(e: KeyboardEvent): boolean {
  const meta = e.metaKey || e.ctrlKey
  const shift = e.shiftKey
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) return false

  const key = e.key.toLowerCase()

  if (meta && key === 'z') {
    e.preventDefault()
    if (shift) {
      useCanvasShapeStore.getState().redo()
    } else {
      useCanvasShapeStore.getState().undo()
    }
    return true
  }

  if (meta && key === 'a') {
    e.preventDefault()
    const doc = useCanvasShapeStore.getState().document
    const root = doc.objects[doc.rootId]
    if (root) useCanvasSelectionStore.getState().selectAll(root.children)
    return true
  }

  if (meta && key === 'd') {
    e.preventDefault()
    const { selectedIds } = useCanvasSelectionStore.getState()
    for (const id of selectedIds) {
      useCanvasShapeStore.getState().duplicateShape(id)
    }
    return true
  }

  if (!meta && (key === 'delete' || key === 'backspace')) {
    e.preventDefault()
    const { selectedIds, clearSelection } = useCanvasSelectionStore.getState()
    for (const id of selectedIds) {
      useCanvasShapeStore.getState().deleteShape(id)
    }
    clearSelection()
    return true
  }

  if (!meta && KEY_TO_TOOL[key]) {
    e.preventDefault()
    useCanvasViewportStore.getState().setActiveTool(KEY_TO_TOOL[key])
    return true
  }

  if (key === ' ' && !meta) {
    e.preventDefault()
    useCanvasViewportStore.getState().setActiveTool('hand')
    return true
  }

  if (key === 'escape') {
    e.preventDefault()
    useCanvasSelectionStore.getState().clearSelection()
    useCanvasViewportStore.getState().setActiveTool('select')
    return true
  }

  return false
}

export function handleCanvasKeyUp(e: KeyboardEvent): void {
  if (e.key === ' ') {
    const tool = useCanvasViewportStore.getState().activeTool
    if (tool === 'hand') {
      useCanvasViewportStore.getState().setActiveTool('select')
    }
  }
}
