import { getFloors } from '@/app/lib/actions'

export default async function FloorMapPage() {
  const floors = await getFloors()

  return (
    <div className="mt-8">
      {/* Development Debug View */}
      <div className="bg-white rounded-lg shadow-md">
        <details className="group">
          <summary className="cursor-pointer list-none px-6 py-4 font-semibold text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="inline-block w-4 mr-2 transition-transform group-open:rotate-90">▶</span>
            Floor Data (Dev)
          </summary>
          <div className="px-6 py-4 border-t border-gray-200">
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs text-gray-800">
              {JSON.stringify(floors, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  )
}

