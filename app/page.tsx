import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Seating Planner
          </h1>
          <p className="text-gray-600 mb-8">
            Manage your events and asset types
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/asset-types"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 block text-center transition-colors"
          >
            Manage Asset Types
          </Link>
          <Link
            href="/floor-map"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 block text-center transition-colors"
          >
            View Floor Map
          </Link>
        </div>
      </div>
    </div>
  )
}
