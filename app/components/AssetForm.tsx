'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createAsset } from '@/app/lib/actions'
import { useEffect, useRef, useState } from 'react'

const initialState = {
  success: false,
  error: ''
}

interface Resource {
  id: string
  name: string
  project: string
}

interface Project {
  id: string
  name: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Creating...' : 'Create Asset'}
    </button>
  )
}

interface AssetFormProps {
  assetTypeId: string
  assetTypeName: string
}

export default function AssetForm({ assetTypeId, assetTypeName }: AssetFormProps) {
  const [state, formAction] = useActionState(createAsset, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(true)

  useEffect(() => {
    fetch('/api/resources')
      .then(res => res.json())
      .then(data => {
        setResources(data.resources || data)
        setProjects(data.projects || [])
        setIsLoadingResources(false)
      })
      .catch(error => {
        console.error('Error fetching resources:', error)
        setIsLoadingResources(false)
      })
  }, [])

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Asset for {assetTypeName}</h3>
      
      <form ref={formRef} action={formAction} className="space-y-3">
        <input type="hidden" name="assetTypeId" value={assetTypeId} />
        
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            id="label"
            name="label"
            placeholder="Enter asset label..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
            required
          />
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
            Assigned To
          </label>
          {isLoadingResources ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
              Loading resources...
            </div>
          ) : (
            <select
              id="assignedTo"
              name="assignedTo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              required
            >
              <option value="">Select a resource...</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} - {resource.project}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          {isLoadingResources ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
              Loading projects...
            </div>
          ) : (
            <select
              id="project"
              name="project"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              required
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {state.error && (
          <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="p-2 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
            Asset created successfully!
          </div>
        )}

        <SubmitButton />
      </form>
    </div>
  )
}
