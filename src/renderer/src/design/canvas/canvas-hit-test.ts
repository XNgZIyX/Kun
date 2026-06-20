import type { CanvasDocument, CanvasShape } from './canvas-types'
import { ROOT_SHAPE_ID } from './canvas-types'

function pointInBounds(px: number, py: number, shape: CanvasShape): boolean {
  if (!shape.visible || shape.locked) return false
  return px >= shape.x && px <= shape.x + shape.width && py >= shape.y && py <= shape.y + shape.height
}

function hitTestChildren(
  objects: Record<string, CanvasShape>,
  parentId: string,
  px: number,
  py: number
): string | null {
  const parent = objects[parentId]
  if (!parent) return null

  for (let i = parent.children.length - 1; i >= 0; i--) {
    const childId = parent.children[i]
    const child = objects[childId]
    if (!child || !child.visible) continue

    if (child.children.length > 0) {
      const deepHit = hitTestChildren(objects, childId, px, py)
      if (deepHit) return deepHit
    }

    if (pointInBounds(px, py, child)) return childId
  }

  return null
}

export function hitTest(doc: CanvasDocument, px: number, py: number): string | null {
  return hitTestChildren(doc.objects, doc.rootId, px, py)
}

export function hitTestAll(doc: CanvasDocument, rect: { x: number; y: number; width: number; height: number }): string[] {
  const result: string[] = []
  const { objects, rootId } = doc

  function walk(parentId: string): void {
    const parent = objects[parentId]
    if (!parent) return
    for (const childId of parent.children) {
      const child = objects[childId]
      if (!child || !child.visible) continue
      if (
        child.x + child.width >= rect.x &&
        child.x <= rect.x + rect.width &&
        child.y + child.height >= rect.y &&
        child.y <= rect.y + rect.height &&
        childId !== rootId
      ) {
        result.push(childId)
      }
      if (child.children.length > 0) walk(childId)
    }
  }

  walk(rootId)
  return result
}

export function getSelectionBounds(
  objects: Record<string, CanvasShape>,
  ids: Set<string>
): { x: number; y: number; width: number; height: number } | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let found = false

  for (const id of ids) {
    const shape = objects[id]
    if (!shape) continue
    found = true
    minX = Math.min(minX, shape.x)
    minY = Math.min(minY, shape.y)
    maxX = Math.max(maxX, shape.x + shape.width)
    maxY = Math.max(maxY, shape.y + shape.height)
  }

  if (!found) return null
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
