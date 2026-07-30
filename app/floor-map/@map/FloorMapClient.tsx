'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { updateFloorItemPosition, createAssetOnFloor, addExistingAssetToFloor, saveFloorsToDatabase } from '@/app/lib/actions'
import type { AssetDroppedDetail } from '@/app/components/FloorMap/floor-map-canvas'

// ssr:false ensures the Lit module (and customElements.define) runs before
// the component mounts, preventing the property-before-upgrade timing issue.
const FloorMapCanvasWrapper = dynamic(
  () => import('@/app/components/FloorMap/FloorMapCanvas').then(m => ({ default: m.FloorMapCanvasWrapper })),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-wrapper flex items-center justify-center"
           style={{ minHeight: '400px', border: '2px solid #E5E7EB', borderRadius: '8px', background: '#F9FAFB' }}>
        <p className="text-gray-400 text-sm">Loading map…</p>
      </div>
    ),
  },
)

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
  project: string
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
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const selectedFloor = floors.find(f => f.id === selectedFloorId) ?? null

  // ── Save ─────────────────────────────────────────────────────────────────

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
    } catch {
      alert('Failed to save floors to database')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Events from the Lit canvas ────────────────────────────────────────────

  const handleItemMoved = useCallback(
    async (id: string, x: number, y: number) => {
      const result = await updateFloorItemPosition(id, x, y)
      if (result.success) {
        router.refresh()
      } else {
        console.error('Failed to update position:', result.error)
        alert('Failed to update asset position')
      }
    },
    [router],
  )

  const handleAssetDropped = useCallback(
    async (detail: AssetDroppedDetail) => {
      if (!selectedFloor) return
      const { x, y, isExistingAsset, assetId, assetTypeId, assetTypeName } = detail
      let result

      if (isExistingAsset && assetId) {
        result = await addExistingAssetToFloor(selectedFloor.id, assetId, x, y)
      } else if (assetTypeId && assetTypeName) {
        result = await createAssetOnFloor(selectedFloor.id, assetTypeId, assetTypeName, x, y)
      } else {
        console.error('Invalid drop data', detail)
        return
      }

      if (result.success) {
        router.refresh()
      } else {
        console.error('Failed to add asset:', result.error)
        alert(`Failed to add asset to floor: ${result.error}`)
      }
    },
    [selectedFloor, router],
  )

  // ── Empty state ───────────────────────────────────────────────────────────

  if (floors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No floors available</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Floor selector + save button — React controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="floor-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Floor
            </label>
            <select
              id="floor-select"
              value={selectedFloorId}
              onChange={e => setSelectedFloorId(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {floors.map(floor => (
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
            {isSaving ? 'Saving…' : 'Save to Database'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Changes are saved locally. Click "Save to Database" to persist all floor changes.
        </p>
      </div>

      {/* Lit web component handles all SVG rendering and interaction */}
      {selectedFloor && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{selectedFloor.name}</h2>
            <p className="text-sm text-gray-600">
              Dimensions: {selectedFloor.width} × {selectedFloor.height} units
              {' | '}
              Items: {selectedFloor.items.length}
              {' | '}
              <span className="text-blue-600 font-medium">
                Drag assets from the list to add them, or drag existing assets to reposition
              </span>
            </p>
          </div>

          <FloorMapCanvasWrapper
            floor={selectedFloor}
            assetTypes={assetTypes}
            resources={resources}
            onItemMoved={handleItemMoved}
            onAssetDropped={handleAssetDropped}
          />

          {/* Legend — React control */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from(new Set(selectedFloor.items.map(item => item.type))).map(type => (
                <div key={type} className="flex items-center space-x-2 text-sm">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
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

