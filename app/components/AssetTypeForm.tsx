'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createAssetType } from '@/app/lib/actions'
import { useEffect, useRef } from 'react'

const initialState = {
  success: false,
  error: '',
  data: null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Creating...' : 'Create Asset Type'}
    </button>
  )
}

interface AssetTypeFormProps {
  assetTypes: any[]
  onAssetTypeClick?: (assetType: any) => void
  selectedAssetTypeId?: string | null
}

export default function AssetTypeForm({ assetTypes, onAssetTypeClick, selectedAssetTypeId }: AssetTypeFormProps) {
  const [state, formAction] = useActionState(createAssetType, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Create Asset Type</h2>
      
      <form ref={formRef} action={formAction} className="space-y-4 mb-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Asset Type Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter asset type name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            required
          />
        </div>

        <div>
          <label htmlFor="svgData" className="block text-sm font-medium text-gray-700 mb-2">
            SVG Data (JSON)
          </label>
          <textarea
            id="svgData"
            name="svgData"
            placeholder='{"color": "#8B4513", "width": 30, "height": 30}'
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Enter SVG configuration as JSON</p>
        </div>

        {state.error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
            Asset type created successfully!
          </div>
        )}

        <SubmitButton />
      </form>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Existing Asset Types</h3>
        {assetTypes.length === 0 ? (
          <p className="text-gray-500 text-center py-4 text-sm">
            No asset types created yet.
          </p>
        ) : (
          <div className="space-y-2">
            {assetTypes.map((assetType) => (
              <button
                key={assetType.id}
                onClick={() => onAssetTypeClick?.(assetType)}
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
        )}
      </div>
    </div>
  )
}