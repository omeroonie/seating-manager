'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { createFloor, updateFloor, addFloorItem, updateFloorItem, deleteFloorItem, getFloors } from '@/app/lib/actions'

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

interface Asset {
  id: string
  label: string
  assignedTo: string
  assetTypeId: string
  assetType?: {
    name: string
  }
}

interface Resource {
  id: string
  name: string
}

interface FloorManagementProps {
  initialFloors: Floor[]
  availableAssets: Asset[]
}

function FloorForm({ floor, onCancel, onSuccess }: { floor?: Floor; onCancel: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(floor?.name || '')
  const [width, setWidth] = useState(floor?.width.toString() || '1000')
  const [height, setHeight] = useState(floor?.height.toString() || '800')
  
  const action = floor ? updateFloor : createFloor
  const [state, formAction, isPending] = useActionState(action, { success: false, error: '' })

  useEffect(() => {
    if (state.success) {
      onSuccess()
    }
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
      {floor && <input type="hidden" name="id" value={floor.id} />}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {floor ? 'Edit Floor' : 'Create New Floor'}
      </h3>
      
      <div className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Floor Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., First Floor, Basement..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
              Width (px)
            </label>
            <input
              type="number"
              id="width"
              name="width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              min="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
              Height (px)
            </label>
            <input
              type="number"
              id="height"
              name="height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isPending}
            />
          </div>
        </div>

        {state.error && (
          <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {state.error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
          >
            {isPending ? 'Saving...' : floor ? 'Update Floor' : 'Create Floor'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

function AddAssetToFloorForm({ 
  floorId, 
  availableAssets, 
  onSuccess 
}: { 
  floorId: string; 
  availableAssets: Asset[]; 
  onSuccess: () => void 
}) {
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [state, formAction, isPending] = useActionState(addFloorItem, { success: false, error: '' })

  useEffect(() => {
    if (state.success) {
      setSelectedAssetId('')
      onSuccess()
    }
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="p-3 bg-green-50 rounded-lg border border-green-200">
      <input type="hidden" name="floorId" value={floorId} />
      <input type="hidden" name="posX" value="0" />
      <input type="hidden" name="posY" value="0" />
      
      <h4 className="text-sm font-semibold text-gray-900 mb-2">Add Asset to Floor</h4>
      
      <div className="space-y-2">
        <select
          name="assetId"
          value={selectedAssetId}
          onChange={(e) => setSelectedAssetId(e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
          disabled={isPending}
        >
          <option value="">Select an asset...</option>
          {availableAssets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.label} ({asset.assetType?.name || 'Unknown'})
            </option>
          ))}
        </select>

        {state.error && (
          <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !selectedAssetId}
          className="w-full bg-green-600 text-white py-1.5 px-3 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          {isPending ? 'Adding...' : 'Add to Floor'}
        </button>
      </div>
    </form>
  )
}

function FloorItemCard({ 
  item, 
  resources, 
  onUpdate, 
  onDelete 
}: { 
  item: FloorItem; 
  resources: Resource[]; 
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(item.label || '')
  const [editAssignedTo, setEditAssignedTo] = useState(item.assignedTo || '')
  const [state, formAction, isPending] = useActionState(updateFloorItem, { success: false, error: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (state.success) {
      setIsEditing(false)
      onUpdate()
    }
  }, [state.success, onUpdate])

  const handleDelete = async () => {
    if (!confirm('Remove this asset from the floor?')) return
    
    setIsDeleting(true)
    const result = await deleteFloorItem(item.id)
    setIsDeleting(false)
    
    if (result.success) {
      onDelete()
    } else {
      alert(result.error || 'Failed to delete item')
    }
  }

  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId)
    return resource?.name || resourceId
  }

  if (isEditing) {
    return (
      <form action={formAction} className="p-2 border border-blue-300 rounded bg-blue-50">
        <input type="hidden" name="id" value={item.id} />
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Label
            </label>
            <input
              type="text"
              name="label"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Assigned To
            </label>
            <select
              name="assignedTo"
              value={editAssignedTo}
              onChange={(e) => setEditAssignedTo(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="">Not assigned</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </div>
          {state.error && (
            <div className="p-1 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
              {state.error}
            </div>
          )}
          <div className="flex gap-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
              className="flex-1 bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <div className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">{item.type}</div>
          <div className="text-xs text-gray-600 truncate">Label: {item.label || 'N/A'}</div>
          <div className="text-xs text-gray-600 truncate">
            Assigned: {item.assignedTo ? getResourceName(item.assignedTo) : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            Pos: ({item.pos.x.toFixed(0)}, {item.pos.y.toFixed(0)})
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            {isDeleting ? '...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FloorCard({ 
  floor, 
  availableAssets, 
  resources, 
  onUpdate 
}: { 
  floor: Floor; 
  availableAssets: Asset[]; 
  resources: Resource[];
  onUpdate: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)

  const handleSuccess = () => {
    setIsEditing(false)
    setShowAddAsset(false)
    onUpdate()
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div 
        className="p-4 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{floor.name}</h3>
            <p className="text-sm text-gray-600">
              {floor.width}×{floor.height}px • {floor.items.length} asset{floor.items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(!isEditing)
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Floor'}
            </button>
            <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {isEditing && (
            <FloorForm 
              floor={floor} 
              onCancel={() => setIsEditing(false)} 
              onSuccess={handleSuccess} 
            />
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Assets on Floor</h4>
              <button
                onClick={() => setShowAddAsset(!showAddAsset)}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                {showAddAsset ? 'Cancel' : '+ Add Asset'}
              </button>
            </div>

            {showAddAsset && (
              <div className="mb-3">
                <AddAssetToFloorForm 
                  floorId={floor.id} 
                  availableAssets={availableAssets} 
                  onSuccess={handleSuccess} 
                />
              </div>
            )}

            {floor.items.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No assets on this floor yet
              </p>
            ) : (
              <div className="space-y-2">
                {floor.items.map((item) => (
                  <FloorItemCard
                    key={item.id}
                    item={item}
                    resources={resources}
                    onUpdate={onUpdate}
                    onDelete={onUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FloorManagement({ initialFloors, availableAssets }: FloorManagementProps) {
  const [floors, setFloors] = useState<Floor[]>(initialFloors)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])

  useEffect(() => {
    fetch('/api/resources')
      .then(res => res.json())
      .then(data => setResources(data))
      .catch(error => console.error('Error fetching resources:', error))
  }, [])

  const loadFloors = async () => {
    const updatedFloors = await getFloors()
    setFloors(updatedFloors)
  }

  const handleFormSuccess = () => {
    setShowCreateForm(false)
    loadFloors()
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Floor Management</h2>
          <p className="text-gray-600 text-sm">Create and manage building floors</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ Create Floor'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <FloorForm 
            onCancel={() => setShowCreateForm(false)} 
            onSuccess={handleFormSuccess} 
          />
        </div>
      )}

      {floors.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No floors created yet. Click "Create Floor" to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {floors.map((floor) => (
            <FloorCard
              key={floor.id}
              floor={floor}
              availableAssets={availableAssets}
              resources={resources}
              onUpdate={loadFloors}
            />
          ))}
        </div>
      )}
    </div>
  )
}
