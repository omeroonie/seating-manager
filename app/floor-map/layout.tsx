import Link from 'next/link'
import { ReactNode } from 'react'

interface FloorMapLayoutProps {
  children: ReactNode
  map: ReactNode
  assets: ReactNode
}

export default function FloorMapLayout({ children, map, assets }: FloorMapLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Floor Map</h1>
            <p className="text-gray-600">Visualize building floors and asset locations</p>
          </div>
          <Link
            href="/"
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Grid layout for parallel routes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map section - 2/3 width */}
          <div className="lg:col-span-2">
            {map}
          </div>

          {/* Assets section - 1/3 width */}
          <div className="lg:col-span-1">
            {assets}
          </div>
        </div>

        {/* Default children slot */}
        {children}
      </div>
    </div>
  )
}
