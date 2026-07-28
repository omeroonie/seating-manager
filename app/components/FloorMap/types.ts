export interface Position {
  x: number
  y: number
}

export interface FloorItem {
  id: string
  type: string // Asset type name
  pos: Position
  rotation?: number
  label?: string
  assignedTo?: string // Resource ID
}

export interface Floor {
  id: string
  name: string
  width: number
  height: number
  items: FloorItem[]
}

export interface FloorMapProps {
  floors: Floor[]
}
