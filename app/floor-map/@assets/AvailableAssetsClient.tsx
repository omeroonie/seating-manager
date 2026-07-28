'use client'

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

interface AvailableAssetsClientProps {
  assetTypes: AssetType[]
}

function AssetTypePreview({ assetType }: { assetType: AssetType }) {
  let parsed: SVGData
  try {
    parsed = JSON.parse(assetType.svgData)
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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify({
      assetTypeId: assetType.id,
      assetTypeName: assetType.name,
      svgData: assetType.svgData
    }))
  }

  return (
    <div 
      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-center gap-3">
        <svg
          width="60"
          height="60"
          viewBox="-60 -60 120 120"
          className="bg-white border border-gray-300 rounded shrink-0 pointer-events-none"
        >
          {parsed.elements.map((element, index) => renderElement(element, index))}
        </svg>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 capitalize truncate">{assetType.name}</h4>
          <p className="text-xs text-gray-500">Drag to add to floor</p>
        </div>
      </div>
    </div>
  )
}

export default function AvailableAssetsClient({ assetTypes }: AvailableAssetsClientProps) {
  return (
    <>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">Available Asset Types</h3>
        <p className="text-sm text-gray-600">Drag to add to floor map</p>
      </div>

      {assetTypes.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm">
          No asset types available. Create some in the Asset Management page.
        </p>
      ) : (
        <div className="space-y-3">
          {assetTypes.map((assetType) => (
            <AssetTypePreview key={assetType.id} assetType={assetType} />
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-gray-700">
            <strong className="text-blue-700">How to use:</strong> Drag an asset type onto the floor map to create a new asset at your desired location.
          </p>
        </div>
      </div>
    </>
  )
}
