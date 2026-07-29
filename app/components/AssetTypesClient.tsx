'use client'

import { useState } from 'react'
import AssetTypeForm from '@/app/components/AssetTypeForm'
import AssetManagement from '@/app/components/AssetManagement'

interface AssetTypesClientProps {
  readonly assetTypes: readonly any[]
}

export default function AssetTypesClient({ assetTypes }: Readonly<AssetTypesClientProps>) {
  const [selectedAssetType, setSelectedAssetType] = useState<any | null>(null)

  const handleAssetTypeClick = (assetType: any) => {
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
