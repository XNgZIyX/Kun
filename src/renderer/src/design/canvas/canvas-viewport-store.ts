import { create } from 'zustand'
import type { CanvasTool, Rect, ViewBox } from './canvas-types'

const MIN_ZOOM = 0.02
const MAX_ZOOM = 50
const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 800

type ViewportState = {
  vbox: ViewBox
  containerWidth: number
  containerHeight: number
  activeTool: CanvasTool
  gridVisible: boolean
  snapEnabled: boolean

  setContainerSize: (width: number, height: number) => void
  setVbox: (vbox: ViewBox) => void
  pan: (dx: number, dy: number) => void
  zoomTo: (factor: number, center: { x: number; y: number }) => void
  zoomToFit: (bounds: Rect, padding?: number) => void
  resetView: () => void
  setActiveTool: (tool: CanvasTool) => void
  toggleGrid: () => void
  toggleSnap: () => void
  getZoom: () => number
}

function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
}

export const useCanvasViewportStore = create<ViewportState>((set, get) => ({
  vbox: { x: -DEFAULT_WIDTH / 2, y: -DEFAULT_HEIGHT / 2, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
  containerWidth: DEFAULT_WIDTH,
  containerHeight: DEFAULT_HEIGHT,
  activeTool: 'select',
  gridVisible: true,
  snapEnabled: true,

  setContainerSize: (width, height) => {
    set((s) => {
      const zoom = s.containerWidth / s.vbox.width
      return {
        containerWidth: width,
        containerHeight: height,
        vbox: { ...s.vbox, width: width / zoom, height: height / zoom }
      }
    })
  },

  setVbox: (vbox) => set({ vbox }),

  pan: (dx, dy) =>
    set((s) => ({
      vbox: { ...s.vbox, x: s.vbox.x - dx, y: s.vbox.y - dy }
    })),

  zoomTo: (factor, center) =>
    set((s) => {
      const currentZoom = s.containerWidth / s.vbox.width
      const newZoom = clampZoom(currentZoom * factor)
      const newWidth = s.containerWidth / newZoom
      const newHeight = s.containerHeight / newZoom
      const cx = center.x
      const cy = center.y
      return {
        vbox: {
          x: cx - (cx - s.vbox.x) * (newWidth / s.vbox.width),
          y: cy - (cy - s.vbox.y) * (newHeight / s.vbox.height),
          width: newWidth,
          height: newHeight
        }
      }
    }),

  zoomToFit: (bounds, padding = 40) =>
    set((s) => {
      const { containerWidth, containerHeight } = s
      if (bounds.width === 0 || bounds.height === 0) return s
      const scaleX = (containerWidth - padding * 2) / bounds.width
      const scaleY = (containerHeight - padding * 2) / bounds.height
      const zoom = clampZoom(Math.min(scaleX, scaleY))
      const newWidth = containerWidth / zoom
      const newHeight = containerHeight / zoom
      const cx = bounds.x + bounds.width / 2
      const cy = bounds.y + bounds.height / 2
      return {
        vbox: {
          x: cx - newWidth / 2,
          y: cy - newHeight / 2,
          width: newWidth,
          height: newHeight
        }
      }
    }),

  resetView: () =>
    set((s) => ({
      vbox: {
        x: -s.containerWidth / 2,
        y: -s.containerHeight / 2,
        width: s.containerWidth,
        height: s.containerHeight
      }
    })),

  setActiveTool: (tool) => set({ activeTool: tool }),

  toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),

  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  getZoom: () => {
    const s = get()
    return s.containerWidth / s.vbox.width
  }
}))
