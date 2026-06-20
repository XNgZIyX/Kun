import { create } from 'zustand'
import type { Rect } from './canvas-types'

type SelectionState = {
  selectedIds: Set<string>
  editingId: string | null
  hoverTargetId: string | null
  marqueeRect: Rect | null

  select: (ids: string[]) => void
  toggle: (id: string) => void
  addToSelection: (id: string) => void
  selectAll: (allIds: string[]) => void
  clearSelection: () => void
  setEditing: (id: string | null) => void
  setHoverTarget: (id: string | null) => void
  setMarquee: (rect: Rect | null) => void
}

export const useCanvasSelectionStore = create<SelectionState>((set) => ({
  selectedIds: new Set(),
  editingId: null,
  hoverTargetId: null,
  marqueeRect: null,

  select: (ids) => set({ selectedIds: new Set(ids), editingId: null }),

  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next, editingId: null }
    }),

  addToSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      next.add(id)
      return { selectedIds: next }
    }),

  selectAll: (allIds) => set({ selectedIds: new Set(allIds), editingId: null }),

  clearSelection: () => set({ selectedIds: new Set(), editingId: null }),

  setEditing: (id) => set({ editingId: id }),

  setHoverTarget: (id) => set({ hoverTargetId: id }),

  setMarquee: (rect) => set({ marqueeRect: rect })
}))
