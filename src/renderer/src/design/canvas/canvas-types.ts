export type ShapeType = 'rect' | 'ellipse' | 'text' | 'image' | 'frame' | 'group'

export type Fill = {
  type: 'solid'
  color: string
  opacity: number
}

export type StrokePosition = 'center' | 'inside' | 'outside'

export type Stroke = {
  color: string
  width: number
  opacity: number
  position: StrokePosition
}

export type CanvasShape = {
  id: string
  type: ShapeType
  name: string
  parentId: string | null
  frameId: string | null
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  fills: Fill[]
  strokes: Stroke[]
  cornerRadius: number | [number, number, number, number]
  children: string[]
  textContent?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: number
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
  fontColor?: string
  imageUrl?: string
  clipContent?: boolean
}

export type CanvasDocument = {
  version: 1
  rootId: string
  objects: Record<string, CanvasShape>
}

export type CanvasTool = 'select' | 'rect' | 'ellipse' | 'text' | 'frame' | 'image' | 'hand'

export type Rect = { x: number; y: number; width: number; height: number }

export type ViewBox = { x: number; y: number; width: number; height: number }

export const ROOT_SHAPE_ID = '__root__'

export const DEFAULT_FILL: Fill = { type: 'solid', color: '#d9d9d9', opacity: 1 }
export const DEFAULT_FRAME_FILL: Fill = { type: 'solid', color: '#ffffff', opacity: 1 }
export const DEFAULT_TEXT_COLOR = '#000000'

let _counter = 0
export function createShapeId(): string {
  return `s_${Date.now().toString(36)}_${(++_counter).toString(36)}`
}

export function createDefaultShape(type: ShapeType, x: number, y: number): CanvasShape {
  const id = createShapeId()
  const base: CanvasShape = {
    id,
    type,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    parentId: null,
    frameId: null,
    x,
    y,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fills: [{ ...DEFAULT_FILL }],
    strokes: [],
    cornerRadius: 0,
    children: []
  }
  switch (type) {
    case 'frame':
      base.name = 'Frame'
      base.width = 360
      base.height = 640
      base.fills = [{ ...DEFAULT_FRAME_FILL }]
      base.clipContent = true
      break
    case 'text':
      base.name = 'Text'
      base.width = 200
      base.height = 24
      base.fills = []
      base.textContent = 'Text'
      base.fontSize = 16
      base.fontFamily = 'Inter, system-ui, sans-serif'
      base.fontWeight = 400
      base.textAlign = 'left'
      base.lineHeight = 1.5
      base.fontColor = DEFAULT_TEXT_COLOR
      break
    case 'ellipse':
      base.name = 'Ellipse'
      break
    case 'image':
      base.name = 'Image'
      base.fills = []
      break
    case 'group':
      base.name = 'Group'
      base.fills = []
      break
  }
  return base
}

export function createEmptyDocument(): CanvasDocument {
  const root: CanvasShape = {
    id: ROOT_SHAPE_ID,
    type: 'frame',
    name: 'Root',
    parentId: null,
    frameId: null,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fills: [],
    strokes: [],
    cornerRadius: 0,
    children: []
  }
  return { version: 1, rootId: ROOT_SHAPE_ID, objects: { [ROOT_SHAPE_ID]: root } }
}

export function shapeBounds(shape: CanvasShape): Rect {
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
}
