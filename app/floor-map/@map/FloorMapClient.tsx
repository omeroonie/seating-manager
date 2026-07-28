'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DynamicSVGItem } from '@/app/components/FloorMap/DynamicSVGItem'
import { updateFloorItemPosition, createAssetOnFloor, addExistingAssetToFloor, saveFloorsToDatabase } from '@/app/lib/actions'

interface Floor {
  id: string
  name: string
  width: number
  height: number
  items: FloorItem[]
}

interface FloorItem {
  id: string
  type: string
  pos: { x: number; y: number }
  rotation?: number
  label?: string
  assignedTo?: string
}

interface Resource {
  id: string
  name: string
}

interface AssetType {
  id: string
  name: string
  svgData: string
  createdAt: Date
  updatedAt: Date
}

interface FloorMapClientProps {
  floors: Floor[]
  resources: Resource[]
  assetTypes: AssetType[]
}

export default function FloorMapClient({ floors: initialFloors, resources, assetTypes }: FloorMapClientProps) {
  const [floors, setFloors] = useState(initialFloors)
  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    initialFloors.length > 0 ? initialFloors[0].id : ''
  )
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId)

  const handleFloorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFloorId(e.target.value)
  }

  const handleSaveToDatabase = async () => {
    if (isSaving) return
    
    setIsSaving(true)
    try {
      const result = await saveFloorsToDatabase()
      if (result.success) {
        alert(result.message || 'Floors saved to database successfully!')
        router.refresh()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving floors:', error)
      alert('Failed to save floors to database')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePositionChange = async (itemId: string, x: number, y: number) => {
    const result = await updateFloorItemPosition(itemId, x, y)
    if (result.success) {
      router.refresh()
    } else {
      console.error('Failed to update position:', result.error)
      alert('Failed to update asset position')
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only show drag-over state if there's actual data being transferred
    const hasData = e.dataTransfer.types.includes('application/json')
    if (hasData) {
      e.dataTransfer.dropEffect = 'copy'
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag-over state if leaving the container, not child elements
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (!selectedFloor) {
      console.warn('No floor selected for drop')
      return
    }

    try {
      const dataString = e.dataTransfer.getData('application/json')
      if (!dataString) {
        console.warn('No drag data found')
        return
      }
      
      const data = JSON.parse(dataString)

      // Validate drag data
      if (!data.isExistingAsset && !data.assetTypeId) {
        console.error('Invalid drag data: missing asset type id')
        return
      }
      if (data.isExistingAsset && !data.assetId) {
        console.error('Invalid drag data: missing asset id')
        return
      }

      // Get SVG coordinates from drop position
      const { x, y } = getSVGCoordinates(e.clientX, e.clientY)

      let result

      // Check if dragging an existing asset or a new asset type
      if (data.isExistingAsset) {
        // Add existing asset to floor
        result = await addExistingAssetToFloor(
          selectedFloor.id,
          data.assetId,
          x,
          y
        )
      } else {
        // Create new asset from asset type
        result = await createAssetOnFloor(
          selectedFloor.id,
          data.assetTypeId,
          data.assetTypeName,
          x,
          y
        )
      }

      if (result.success) {
        // Refresh to show the new asset
        router.refresh()
      } else {
        console.error('Failed to add asset:', result.error)
        alert(`Failed to add asset to floor: ${result.error}`)
      }
    } catch (error) {
      console.error('Error handling drop:', error)
      alert('An error occurred while adding the asset')
    }
  }

  if (floors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No floors available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Floor Selector and Save Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="floor-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Floor
            </label>
            <select
              id="floor-select"
              value={selectedFloorId}
              onChange={handleFloorChange}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save to Database'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Changes are saved locally. Click "Save to Database" to persist all floor changes.
        </p>
      </div>

      {/* Floor Map */}
      {selectedFloor && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{selectedFloor.name}</h2>
            <p className="text-sm text-gray-600">
              Dimensions: {selectedFloor.width} x {selectedFloor.height} units
              {' | '}
              Items: {selectedFloor.items.length}
              {' | '}
              <span className="text-blue-600 font-medium">Drag assets from the list to add them, or drag existing assets to reposition</span>
            </p>
          </div>

          <div 
            className={`overflow-auto border rounded-lg transition-colors ${
              isDragOver 
                ? 'border-blue-500 border-2 bg-blue-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <svg
              ref={svgRef}
              width={selectedFloor.width}
              height={selectedFloor.height}
              viewBox={`0 0 ${selectedFloor.width} ${selectedFloor.height}`}
              className="w-full h-auto"
              style={{ minHeight: '400px', maxHeight: '800px' }}
            >
              {/* Floor background */}
              <rect
                x="0"
                y="0"
                width={selectedFloor.width}
                height={selectedFloor.height}
                fill="#F5F5F5"
                stroke="#CCCCCC"
                strokeWidth="2"
              />

              {/* Grid pattern */}
              <defs>
                <pattern
                  id="grid"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="#E0E0E0"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect
                x="0"
                y="0"
                width={selectedFloor.width}
                height={selectedFloor.height}
                fill="url(#grid)"
              />

              {/* Render floor items */}
              {selectedFloor.items.map((item) => {
                const assetType = assetTypes.find(at => at.name.toLowerCase() === item.type.toLowerCase())
                if (!assetType) {
                  console.warn(`No asset type found for: ${item.type}`)
                  return null
                }
                return (
                  <DynamicSVGItem 
                    key={item.id} 
                    item={item} 
                    svgData={assetType.svgData}
                    resources={resources}
                    onPositionChange={handlePositionChange}
                    svgRef={svgRef}
                  />
                )
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from(new Set(selectedFloor.items.map(item => item.type))).map((type) => (
                <div key={type} className="flex items-center space-x-2 text-sm">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-700 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
