import { FloorItem } from './types'
import { Resource } from '@/app/lib/resources'
import { useState, useRef, useEffect } from 'react'

interface SVGElement {
  type: 'rect' | 'circle' | 'line' | 'path'
  [key: string]: any
}

interface SVGData {
  type: string
  elements: SVGElement[]
}

interface DynamicItemProps {
  item: FloorItem
  svgData: string
  resources?: Resource[]
  onPositionChange?: (id: string, x: number, y: number) => void
  svgRef?: React.RefObject<SVGSVGElement>
}

export function DynamicSVGItem({ item, svgData, resources, onPositionChange, svgRef }: DynamicItemProps) {
  const { pos, rotation = 0, label, assignedTo } = item
  const [isDragging, setIsDragging] = useState(false)
  const [dragPos, setDragPos] = useState(pos)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  
  let parsedSVG: SVGData
  try {
    parsedSVG = JSON.parse(svgData)
  } catch (e) {
    console.error('Invalid SVG data:', e)
    return null
  }

  // Get resource name from ID
  const assignedName = assignedTo 
    ? resources?.find(r => r.id === assignedTo)?.name 
    : undefined

  const renderElement = (element: SVGElement, index: number) => {
    const { type, ...props } = element

    switch (type) {
      case 'rect':
        return <rect key={index} {...props} />
      case 'circle':
        return <circle key={index} {...props} />
      case 'line':
        return <line key={index} {...props} />
      case 'path':
        return <path key={index} {...props} />
      default:
        return null
    }
  }

  const getSVGCoordinates = (clientX: number, clientY: number) => {
    if (!svgRef?.current) return { x: clientX, y: clientY }
    
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    return { x: svgP.x, y: svgP.y }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag on left mouse button
    if (e.button !== 0) return
    
    e.stopPropagation()
    e.preventDefault()
    
    const svgCoords = getSVGCoordinates(e.clientX, e.clientY)
    dragStartRef.current = {
      x: svgCoords.x - dragPos.x,
      y: svgCoords.y - dragPos.y
    }
    setIsDragging(true)
  }

  // Use useEffect to attach/detach global listeners during drag
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      
      const svgCoords = getSVGCoordinates(e.clientX, e.clientY)
      const newX = svgCoords.x - dragStartRef.current.x
      const newY = svgCoords.y - dragStartRef.current.y
      
      setDragPos({ x: newX, y: newY })
    }

    const handleGlobalMouseUp = (e: MouseEvent) => {
      setIsDragging(false)
      const svgCoords = getSVGCoordinates(e.clientX, e.clientY)
      const finalX = svgCoords.x - (dragStartRef.current?.x ?? 0)
      const finalY = svgCoords.y - (dragStartRef.current?.y ?? 0)
      
      dragStartRef.current = null
      
      // Save position to database if it changed
      if (onPositionChange && (Math.abs(finalX - pos.x) > 1 || Math.abs(finalY - pos.y) > 1)) {
        onPositionChange(item.id, finalX, finalY)
      }
    }

    // Attach global listeners
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)

    // Cleanup on unmount or when drag ends
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, dragPos.x, dragPos.y, pos.x, pos.y, item.id, onPositionChange])

  return (
    <g 
      transform={`translate(${dragPos.x}, ${dragPos.y}) rotate(${rotation})`}
      onMouseDown={handleMouseDown}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.7 : 1,
        pointerEvents: 'all'
      }}
    >
      {parsedSVG.elements.map((element, index) => renderElement(element, index))}
      
      {/* Render label */}
      {label && (
        <text 
          x="0" 
          y={parsedSVG.type === 'desk' ? 50 : 40} 
          fontSize={parsedSVG.type === 'desk' ? 12 : 10}
          fill="#333" 
          textAnchor="middle"
          fontWeight={parsedSVG.type === 'desk' ? 'bold' : 'normal'}
          pointerEvents="none"
        >
          {label}
        </text>
      )}
      
      {/* Render assigned name for desks */}
      {assignedName && parsedSVG.type === 'desk' && (
        <text 
          x="0" 
          y="65" 
          fontSize="10" 
          fill="#666" 
          textAnchor="middle"
          pointerEvents="none"
        >
          {assignedName}
        </text>
      )}
    </g>
  )
}

