interface AssetType {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

interface AssetTypeListProps {
  assetTypes: AssetType[]
  onAssetTypeClick: (assetType: AssetType) => void
  selectedAssetTypeId: string | null
}

export default function AssetTypeList({ assetTypes, onAssetTypeClick, selectedAssetTypeId }: AssetTypeListProps) {
  if (assetTypes.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4 text-sm">
        No asset types created yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {assetTypes.map((assetType) => (
        <button
          key={assetType.id}
          onClick={() => onAssetTypeClick(assetType)}
          className={`w-full text-left p-3 border rounded-lg transition-all ${
            selectedAssetTypeId === assetType.id
              ? 'bg-blue-50 border-blue-300 shadow-sm'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">{assetType.name}</h4>
            <span className="text-xs text-gray-500">
              {new Date(assetType.createdAt).toLocaleDateString()}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
