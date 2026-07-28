'use client'

import { useState } from 'react'
import AvailableAssetsClient from './AvailableAssetsClient'
import CreatedAssetsClient from './CreatedAssetsClient'

interface AssetType {
  id: string
  name: string
  svgData: string
  createdAt: Date
  updatedAt: Date
}

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

interface AssetPanelClientProps {
  assetTypes: AssetType[]
  createdAssets: Asset[]
}

export default function AssetPanelClient({ assetTypes, createdAssets }: AssetPanelClientProps) {
  const [activeTab, setActiveTab] = useState<'types' | 'assets'>('types')

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('types')}
          className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
            activeTab === 'types'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Asset Types
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
            activeTab === 'assets'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Created Assets ({createdAssets.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'types' ? (
          <AvailableAssetsClient assetTypes={assetTypes} />
        ) : (
          <CreatedAssetsClient assets={createdAssets} />
        )}
      </div>
    </div>
  )
}
