import { NextResponse } from 'next/server'
import { resources, getProjects } from '@/app/lib/resources'

export async function GET() {
  return NextResponse.json({
    resources,
    projects: getProjects()
  })
}
