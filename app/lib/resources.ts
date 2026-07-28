export interface Resource {
  id: string
  name: string
  project: string
}

export interface Project {
  id: string
  name: string
}

export const resources: Resource[] = [
  { id: '1', name: 'John Doe', project: 'Phoenix Initiative' },
  { id: '2', name: 'Jane Smith', project: 'Alpha Platform' },
  { id: '3', name: 'Bob Johnson', project: 'Phoenix Initiative' },
  { id: '4', name: 'Alice Brown', project: 'Quantum Labs' },
  { id: '5', name: 'Charlie Wilson', project: 'Alpha Platform' },
  { id: '6', name: 'Diana Martinez', project: 'Digital Transformation' },
  { id: '7', name: 'Edward Davis', project: 'Phoenix Initiative' },
  { id: '8', name: 'Fiona Garcia', project: 'Quantum Labs' },
  { id: '9', name: 'George Rodriguez', project: 'Alpha Platform' },
  { id: '10', name: 'Helen Lee', project: 'Digital Transformation' },
  { id: '11', name: 'Ian Taylor', project: 'Phoenix Initiative' },
  { id: '12', name: 'Julia Anderson', project: 'Quantum Labs' },
  { id: '13', name: 'Kevin Thompson', project: 'Cloud Migration' },
  { id: '14', name: 'Laura White', project: 'Digital Transformation' },
  { id: '15', name: 'Michael Harris', project: 'Cloud Migration' }
]

// Extract unique projects from resources
export function getProjects(): Project[] {
  const uniqueProjects = Array.from(new Set(resources.map(r => r.project)))
  return uniqueProjects.map((name, index) => ({
    id: `proj_${index + 1}`,
    name
  }))
}
