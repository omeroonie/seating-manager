'use client'

import { useState } from 'react'
import AssetTypeForm from '@/app/components/AssetTypeForm'
import AssetManagement from '@/app/components/AssetManagement'

interface AssetType {
  id: string
  name: string
  svgData: string
  createdAt: Date
  updatedAt: Date
}

interface AssetTypesClientProps {
  assetTypes: AssetType[]
}

export default function AssetTypesClient({ assetTypes }: AssetTypesClientProps) {
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null)

  const handleAssetTypeClick = (assetType: AssetType) => {
    if (selectedAssetType?.id === assetType.id) {
      setSelectedAssetType(null)
    } else {
      setSelectedAssetType(assetType)
    }
  }

  return (
    <>
      <div className="mb-8">
        <AssetTypeForm 
          assetTypes={assetTypes}
          onAssetTypeClick={handleAssetTypeClick}
          selectedAssetTypeId={selectedAssetType?.id || null}
        />
      </div>

      {selectedAssetType && (
        <AssetManagement selectedAssetType={selectedAssetType} />
      )}
    </>
  )
}
