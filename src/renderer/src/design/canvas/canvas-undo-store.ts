import { create } from 'zustand'
import type { CanvasShape } from './canvas-types'

export type ShapePatch = {
  id: string
  before: Partial<CanvasShape>
  after: Partial<CanvasShape>
}

export type CanvasChange = {
  patches: ShapePatch[]
}

const MAX_UNDO = 50

type UndoState = {
  undoStack: CanvasChange[]
  redoStack: CanvasChange[]
  pushChange: (change: CanvasChange) => void
  undo: () => CanvasChange | null
  redo: () => CanvasChange | null
  clear: () => void
}

export const useCanvasUndoStore = create<UndoState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushChange: (change) => {
    if (change.patches.length === 0) return
    set((s) => ({
      undoStack: [...s.undoStack.slice(-MAX_UNDO + 1), change],
      redoStack: []
    }))
  },

  undo: () => {
    const { undoStack } = get()
    if (undoStack.length === 0) return null
    const change = undoStack[undoStack.length - 1]
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, change]
    }))
    return change
  },

  redo: () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return null
    const change = redoStack[redoStack.length - 1]
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, change]
    }))
    return change
  },

  clear: () => set({ undoStack: [], redoStack: [] })
}))
