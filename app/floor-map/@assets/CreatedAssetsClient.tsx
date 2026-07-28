'use client'

interface Asset {
  id: string
  label: string
  assignedTo: string | null
  assetTypeId: string
  createdAt: Date
  updatedAt: Date
  assetType: {
    id: string
    name: string
    svgData: string
  }
}

interface SVGElement {
  type: 'rect' | 'circle' | 'line' | 'path'
  [key: string]: any
}

interface SVGData {
  type: string
  elements: SVGElement[]
}

interface CreatedAssetsClientProps {
  assets: Asset[]
}

function AssetCard({ asset }: { asset: Asset }) {
  let parsed: SVGData
  try {
    parsed = JSON.parse(asset.assetType.svgData)
  } catch (e) {
    return null
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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify({
      isExistingAsset: true,
      assetId: asset.id,
      assetTypeId: asset.assetType.id,
      assetTypeName: asset.assetType.name,
      svgData: asset.assetType.svgData
    }))
  }

  return (
    <div 
      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-start gap-3">
        <svg
          width="50"
          height="50"
          viewBox="-60 -60 120 120"
          className="bg-white border border-gray-300 rounded shrink-0 pointer-events-none"
        >
          {parsed.elements.map((element, index) => renderElement(element, index))}
        </svg>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate text-sm">{asset.label}</h4>
          <p className="text-xs text-gray-500 capitalize">{asset.assetType.name}</p>
          {asset.assignedTo && (
            <p className="text-xs text-blue-600 mt-1">Assigned</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(asset.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CreatedAssetsClient({ assets }: CreatedAssetsClientProps) {
  // Group assets by asset type
  const groupedAssets = assets.reduce((acc, asset) => {
    const typeName = asset.assetType.name
    if (!acc[typeName]) {
      acc[typeName] = []
    }
    acc[typeName].push(asset)
    return acc
  }, {} as Record<string, Asset[]>)

  return (
    <>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">Created Assets</h3>
        <p className="text-sm text-gray-600">All assets created in the system</p>
      </div>

      {assets.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm">
          No assets created yet. Create assets in the Asset Management page.
        </p>
      ) : (
        <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
          {Object.entries(groupedAssets).map(([typeName, typeAssets]) => (
            <div key={typeName}>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize sticky top-0 bg-white py-1">
                {typeName} ({typeAssets.length})
              </h4>
              <div className="space-y-2">
                {typeAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-gray-700">
            <strong className="text-green-700">Note:</strong> Dragging an existing asset adds it to the floor without creating a new asset. To create a new asset, drag from the "Asset Types" tab.
          </p>
        </div>
      </div>
    </>
  )
}
