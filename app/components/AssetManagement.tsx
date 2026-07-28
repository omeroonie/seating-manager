'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import AssetForm from './AssetForm'
import { getAssetsByType, updateAsset } from '@/app/lib/actions'

interface AssetType {
  id: string
  name: string
  svgData: string
  createdAt: Date
  updatedAt: Date
}

interface SVGElement {
  type: 'rect' | 'circle' | 'line' | 'path'
  [key: string]: any
}

interface SVGData {
  type: string
  elements: SVGElement[]
}

function SVGPreview({ svgData }: { svgData: string }) {
  let parsed: SVGData
  try {
    parsed = JSON.parse(svgData)
  } catch (e) {
    return <div className="text-red-500 text-xs">Invalid SVG data</div>
  }

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

  return (
    <svg
      width="80"
      height="80"
      viewBox="-60 -60 120 120"
      className="bg-gray-50 border border-gray-300 rounded"
    >
      {parsed.elements.map((element, index) => renderElement(element, index))}
    </svg>
  )
}

interface Asset {
  id: string
  label: string
  assignedTo: string
  project: string
  assetTypeId: string
  createdAt: Date
  updatedAt: Date
}

interface Resource {
  id: string
  name: string
  project: string
}

interface Project {
  id: string
  name: string
}

interface EditableAssetItemProps {
  asset: Asset
  resources: Resource[]
  projects: Project[]
  getResourceName: (resourceId: string) => string
  onUpdate: () => void
}

function EditableAssetItem({ asset, resources, projects, getResourceName, onUpdate }: EditableAssetItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(asset.label)
  const [editAssignedTo, setEditAssignedTo] = useState(asset.assignedTo)
  const [editProject, setEditProject] = useState(asset.project)
  const [state, formAction, isPending] = useActionState(updateAsset, { success: false, error: '' })

  useEffect(() => {
    if (state.success) {
      setIsEditing(false)
      onUpdate()
    }
  }, [state.success, onUpdate])

  const handleCancel = () => {
    setEditLabel(asset.label)
    setEditAssignedTo(asset.assignedTo)
    setEditProject(asset.project)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <form action={formAction} className="p-3 border border-blue-300 rounded-lg bg-blue-50">
        <input type="hidden" name="id" value={asset.id} />
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              name="label"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <select
              name="assignedTo"
              value={editAssignedTo}
              onChange={(e) => setEditAssignedTo(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={isPending}
            >
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} - {resource.project}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              name="project"
              value={editProject}
              onChange={(e) => setEditProject(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={isPending}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {state.error && (
            <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
              {state.error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 bg-gray-200 text-gray-700 py-1.5 px-3 rounded text-sm hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900">{asset.label}</h5>
          <p className="text-sm text-gray-600">Assigned to: {getResourceName(asset.assignedTo)}</p>
          <p className="text-xs text-gray-500">Project: {asset.project}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {new Date(asset.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

interface AssetManagementProps {
  selectedAssetType: AssetType | null
}

export default function AssetManagement({ selectedAssetType }: AssetManagementProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)

  useEffect(() => {
    fetch('/api/resources')
      .then(res => res.json())
      .then(data => {
        setResources(data.resources || data)
        setProjects(data.projects || [])
      })
      .catch(error => console.error('Error fetching resources:', error))
  }, [])

  useEffect(() => {
    if (selectedAssetType) {
      loadAssets()
    } else {
      setAssets([])
    }
  }, [selectedAssetType])

  const loadAssets = () => {
    if (!selectedAssetType) return
    
    setIsLoadingAssets(true)
    getAssetsByType(selectedAssetType.id).then((data) => {
      setAssets(data)
      setIsLoadingAssets(false)
    })
  }

  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId)
    return resource?.name || resourceId
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {selectedAssetType ? `Assets: ${selectedAssetType.name}` : 'Select an Asset Type'}
        </h3>
        
        {selectedAssetType ? (
          <>
            {/* SVG Preview Section */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <SVGPreview svgData={selectedAssetType.svgData} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">
                    Asset Type Preview
                  </h4>
                  <p className="text-xs text-gray-600">
                    This is how <span className="font-medium">{selectedAssetType.name}</span> will appear on the floor map
                  </p>
                </div>
              </div>
            </div>

            <AssetForm 
              assetTypeId={selectedAssetType.id}
              assetTypeName={selectedAssetType.name}
            />
            
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Existing Assets</h4>
              
              {isLoadingAssets ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : assets.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No assets created yet for this type.
                </p>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <EditableAssetItem
                      key={asset.id}
                      asset={asset}
                      resources={resources}
                      projects={projects}
                      getResourceName={getResourceName}
                      onUpdate={loadAssets}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-12">
            Click on an asset type to manage its assets
          </p>
        )}
    </div>
  )
}
