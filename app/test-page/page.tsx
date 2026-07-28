import Buttonish from "./button";


export default async function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Page</h1>
        <p className="text-gray-600">This is a test page for development purposes.</p>
        <Buttonish />
      </div>
    </div>
  )
}