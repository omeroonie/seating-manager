import { prisma } from '@/app/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { readOfflineData, writeOfflineData, STORAGE_KEYS } from '@/app/lib/offline-storage'


export async function GET() {
  try {
    // Try to read from offline storage first
    const cachedData = await readOfflineData(STORAGE_KEYS.ASSET_TYPES)
    
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // If no cached data, fetch from database
    const assetTypes = await prisma.assetType.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Save to offline storage
    await writeOfflineData(STORAGE_KEYS.ASSET_TYPES, assetTypes)
    
    return NextResponse.json(assetTypes)
  } catch (error) {
    console.error('Error fetching asset types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, svgData } = await request.json()
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Asset type name is required' },
        { status: 400 }
      )
    }

    if (!svgData || typeof svgData !== 'string' || svgData.trim().length === 0) {
      return NextResponse.json(
        { error: 'SVG data is required' },
        { status: 400 }
      )
    }

    // Validate JSON
    try {
      JSON.parse(svgData)
    } catch (e) {
      return NextResponse.json(
        { error: 'SVG data must be valid JSON' },
        { status: 400 }
      )
    }

    const assetType = await prisma.assetType.create({
      data: {
        name: name.trim(),
        svgData: svgData.trim()
      }
    })

    // Update offline storage
    const allAssetTypes = await prisma.assetType.findMany({
      orderBy: { createdAt: 'desc' }
    })
    await writeOfflineData(STORAGE_KEYS.ASSET_TYPES, allAssetTypes)

    return NextResponse.json(assetType, { status: 201 })
  } catch (error: any) {
    console.error('Error creating asset type:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Asset type with this name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create asset type' },
      { status: 500 }
    )
  }
}