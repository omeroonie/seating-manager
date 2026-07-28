'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'
import { 
  readOfflineData, 
  writeOfflineData, 
  STORAGE_KEYS,
  
  
  addFloorItemToOfflineStorage,
  
} from '@/app/lib/offline-storage'

interface Position {
  x: number
  y: number
}

interface FloorItem {
  id: string
  type: string
  pos: Position
  rotation?: number
  label?: string | null
  assignedTo?: string | null
  project?: string | null
}

interface OfflineFloor {
  id: string
  name: string
  width: number
  height: number
  items?: FloorItem[]
}

interface OfflineAsset {
  id: string
  label: string
  assignedTo?: string | null
  project?: string | null
  assetTypeId: string
}

export async function createAssetType(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const svgData = formData.get('svgData') as string

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      success: false,
      error: 'Asset type name is required'
    }
  }

  if (!svgData || typeof svgData !== 'string' || svgData.trim().length === 0) {
    return {
      success: false,
      error: 'SVG data is required'
    }
  }

  // Validate JSON
  try {
    JSON.parse(svgData)
  } catch (e) {
    return {
      success: false,
      error: 'SVG data must be valid JSON'
    }
  }

  try {
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

    revalidatePath('/asset-types')
    
    return {
      success: true,
      data: assetType
    }
  } catch (error: any) {
    console.error('Error creating asset type:', error)
    
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Asset type with this name already exists'
      }
    }
    
    return {
      success: false,
      error: 'Failed to create asset type'
    }
  }
}

export async function getAssetTypes() {
  try {
    // Try to read from offline storage first
    const cachedData = await readOfflineData(STORAGE_KEYS.ASSET_TYPES)
    
    if (cachedData) {
      return cachedData
    }

    // If no cached data, fetch from database
    const assetTypes = await prisma.assetType.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Save to offline storage
    await writeOfflineData(STORAGE_KEYS.ASSET_TYPES, assetTypes)
    
    return assetTypes
  } catch (error) {
    console.error('Error fetching asset types:', error)
    return []
  }
}

export async function createAsset(prevState: any, formData: FormData) {
  const label = formData.get('label') as string
  const assignedTo = formData.get('assignedTo') as string
  const project = formData.get('project') as string
  const assetTypeId = formData.get('assetTypeId') as string

  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    return {
      success: false,
      error: 'Asset label is required'
    }
  }

  if (!assignedTo || typeof assignedTo !== 'string' || assignedTo.trim().length === 0) {
    return {
      success: false,
      error: 'Assigned to field is required'
    }
  }

  if (!project || typeof project !== 'string' || project.trim().length === 0) {
    return {
      success: false,
      error: 'Project field is required'
    }
  }

  if (!assetTypeId) {
    return {
      success: false,
      error: 'Asset type is required'
    }
  }

  try {
    const asset = await prisma.asset.create({
      data: {
        label: label.trim(),
        assignedTo: assignedTo.trim(),
        project: project.trim(),
        assetTypeId
      }
    })

    // Update offline storage for all assets
    const allAssets = await prisma.asset.findMany({
      include: { assetType: true },
      orderBy: { createdAt: 'desc' }
    })
    await writeOfflineData(STORAGE_KEYS.ASSETS, allAssets)

    revalidatePath('/asset-types')
    
    return {
      success: true,
      data: asset
    }
  } catch (error: any) {
    console.error('Error creating asset:', error)
    
    return {
      success: false,
      error: 'Failed to create asset'
    }
  }
}

export async function getAssetsByType(assetTypeId: string) {
  try {
    // Try to read from offline storage first
    const cachedData = await readOfflineData(STORAGE_KEYS.ASSETS)
    
    if (cachedData) {
      const assets = (cachedData as any[]).filter((asset: any) => asset.assetTypeId === assetTypeId)
      return assets
    }

    // If no cached data, fetch from database
    const assets = await prisma.asset.findMany({
      where: { assetTypeId },
      include: { assetType: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return assets
  } catch (error) {
    console.error('Error fetching assets:', error)
    return []
  }
}

export async function getAllAssets() {
  try {
    // Try to read from offline storage first
    const cachedData = await readOfflineData(STORAGE_KEYS.ASSETS)
    
    if (cachedData) {
      return cachedData
    }

    // If no cached data, fetch from database
    const assets = await prisma.asset.findMany({
      include: {
        assetType: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Save to offline storage
    await writeOfflineData(STORAGE_KEYS.ASSETS, assets)
    
    return assets
  } catch (error) {
    console.error('Error fetching all assets:', error)
    return []
  }
}

export async function updateAsset(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const label = formData.get('label') as string
  const assignedTo = formData.get('assignedTo') as string
  const project = formData.get('project') as string

  if (!id) {
    return {
      success: false,
      error: 'Asset ID is required'
    }
  }

  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    return {
      success: false,
      error: 'Asset label is required'
    }
  }

  if (!assignedTo || typeof assignedTo !== 'string' || assignedTo.trim().length === 0) {
    return {
      success: false,
      error: 'Assigned to field is required'
    }
  }

  if (!project || typeof project !== 'string' || project.trim().length === 0) {
    return {
      success: false,
      error: 'Project field is required'
    }
  }

  try {
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        label: label.trim(),
        assignedTo: assignedTo.trim(),
        project: project.trim()
      }
    })

    // Update offline storage for all assets
    const allAssets = await prisma.asset.findMany({
      include: { assetType: true },
      orderBy: { createdAt: 'desc' }
    })
    await writeOfflineData(STORAGE_KEYS.ASSETS, allAssets)

    revalidatePath('/asset-types')
    
    return {
      success: true,
      data: asset
    }
  } catch (error: any) {
    console.error('Error updating asset:', error)
    
    return {
      success: false,
      error: 'Failed to update asset'
    }
  }
}

export async function getFloors() {
  try {
    // Try to read from offline storage first
    const cachedData = await readOfflineData(STORAGE_KEYS.FLOORS)
    
    if (cachedData) {
      return cachedData
    }

    // If no cached data, fetch from database
    const floors = await prisma.floor.findMany({
      include: {
        items: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    // Transform the data to match the Floor interface
    interface FloorItemPosition {
      x: number
      y: number
    }

    interface TransformedFloorItem {
      id: string
      type: string
      pos: FloorItemPosition
      rotation: number
      label?: string
      assignedTo?: string
    }

    interface TransformedFloor {
      id: string
      name: string
      width: number
      height: number
      items: TransformedFloorItem[]
    }

    const transformedFloors: TransformedFloor[] = floors.map((floor: { id: any; name: any; width: any; height: any; items: any[] }) => ({
      id: floor.id,
      name: floor.name,
      width: floor.width,
      height: floor.height,
      items: floor.items.map(item => ({
        id: item.id,
        type: item.type,
        pos: { x: item.posX, y: item.posY },
        rotation: item.rotation,
        label: item.label || undefined,
        assignedTo: item.assignedTo || undefined
      }))
    }))
    
    // Save to offline storage
    await writeOfflineData(STORAGE_KEYS.FLOORS, transformedFloors)
    
    return transformedFloors
  } catch (error) {
    console.error('Error fetching floors:', error)
    return []
  }
}

export async function createFloor(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const width = formData.get('width') as string
  const height = formData.get('height') as string

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      success: false,
      error: 'Floor name is required'
    }
  }

  const widthNum = parseInt(width)
  const heightNum = parseInt(height)

  if (isNaN(widthNum) || widthNum <= 0) {
    return {
      success: false,
      error: 'Width must be a positive number'
    }
  }

  if (isNaN(heightNum) || heightNum <= 0) {
    return {
      success: false,
      error: 'Height must be a positive number'
    }
  }

  try {
    const floor = await prisma.floor.create({
      data: {
        name: name.trim(),
        width: widthNum,
        height: heightNum
      }
    })

    revalidatePath('/asset-types')
    revalidatePath('/floor-map')
    
    return {
      success: true,
      data: floor
    }
  } catch (error: any) {
    console.error('Error creating floor:', error)
    
    return {
      success: false,
      error: 'Failed to create floor'
    }
  }
}

export async function updateFloor(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const width = formData.get('width') as string
  const height = formData.get('height') as string

  if (!id) {
    return {
      success: false,
      error: 'Floor ID is required'
    }
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      success: false,
      error: 'Floor name is required'
    }
  }

  const widthNum = parseInt(width)
  const heightNum = parseInt(height)

  if (isNaN(widthNum) || widthNum <= 0) {
    return {
      success: false,
      error: 'Width must be a positive number'
    }
  }

  if (isNaN(heightNum) || heightNum <= 0) {
    return {
      success: false,
      error: 'Height must be a positive number'
    }
  }

  try {
    const floor = await prisma.floor.update({
      where: { id },
      data: {
        name: name.trim(),
        width: widthNum,
        height: heightNum
      }
    })

    revalidatePath('/asset-types')
    revalidatePath('/floor-map')
    
    return {
      success: true,
      data: floor
    }
  } catch (error: any) {
    console.error('Error updating floor:', error)
    
    return {
      success: false,
      error: 'Failed to update floor'
    }
  }
}

export async function addFloorItem(prevState: any, formData: FormData) {
  const floorId = formData.get('floorId') as string
  const assetId = formData.get('assetId') as string
  const posX = formData.get('posX') as string
  const posY = formData.get('posY') as string

  if (!floorId) {
    return {
      success: false,
      error: 'Floor ID is required'
    }
  }

  if (!assetId) {
    return {
      success: false,
      error: 'Asset is required'
    }
  }

  const posXNum = parseFloat(posX) || 0
  const posYNum = parseFloat(posY) || 0

  try {
    // Get the asset details
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { assetType: true }
    })

    if (!asset) {
      return {
        success: false,
        error: 'Asset not found'
      }
    }

    const floorItem = await prisma.floorItem.create({
      data: {
        floorId,
        type: asset.assetType.name,
        posX: posXNum,
        posY: posYNum,
        rotation: 0,
        label: asset.label,
        assignedTo: asset.assignedTo
      }
    })

    revalidatePath('/asset-types')
    revalidatePath('/floor-map')
    
    return {
      success: true,
      data: floorItem
    }
  } catch (error: any) {
    console.error('Error adding floor item:', error)
    
    return {
      success: false,
      error: 'Failed to add item to floor'
    }
  }
}

export async function updateFloorItem(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const label = formData.get('label') as string
  const assignedTo = formData.get('assignedTo') as string

  if (!id) {
    return {
      success: false,
      error: 'Floor item ID is required'
    }
  }

  try {
    const floorItem = await prisma.floorItem.update({
      where: { id },
      data: {
        label: label?.trim() || null,
        assignedTo: assignedTo?.trim() || null
      }
    })

    revalidatePath('/asset-types')
    revalidatePath('/floor-map')
    
    return {
      success: true,
      data: floorItem
    }
  } catch (error: any) {
    console.error('Error updating floor item:', error)
    
    return {
      success: false,
      error: 'Failed to update floor item'
    }
  }
}

export async function deleteFloorItem(floorItemId: string) {
  try {
    await prisma.floorItem.delete({
      where: { id: floorItemId }
    })

    revalidatePath('/asset-types')
    revalidatePath('/floor-map')
    
    return {
      success: true
    }
  } catch (error: any) {
    console.error('Error deleting floor item:', error)
    
    return {
      success: false,
      error: 'Failed to delete floor item'
    }
  }
}

export async function updateFloorItemPosition(floorItemId: string, posX: number, posY: number) {
  try {
    // Update in offline storage only
    const floors = await readOfflineData<any[]>(STORAGE_KEYS.FLOORS)
    if (!floors) {
      return {
        success: false,
        error: 'No floor data available'
      }
    }

    // Find the floor containing this item
    for (const floor of floors) {
      const itemIndex = floor.items?.findIndex((item: any) => item.id === floorItemId)
      if (itemIndex !== -1 && itemIndex !== undefined) {
        floor.items[itemIndex].pos = { x: posX, y: posY }
        await writeOfflineData(STORAGE_KEYS.FLOORS, floors)
        revalidatePath('/floor-map')
        return {
          success: true
        }
      }
    }
    
    return {
      success: false,
      error: 'Floor item not found'
    }
  } catch (error: any) {
    console.error('Error updating floor item position:', error)
    
    return {
      success: false,
      error: 'Failed to update position'
    }
  }
}

export async function createAssetOnFloor(
  floorId: string,
  assetTypeId: string,
  assetTypeName: string,
  posX: number,
  posY: number
) {
  try {
    // Generate IDs for new items
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const floorItemId = `flooritem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const label = `${assetTypeName}-${Date.now()}`

    // Create asset in offline storage
    const newAsset = {
      id: assetId,
      label,
      assignedTo: null,
      project: null,
      assetTypeId,
      assetType: { name: assetTypeName },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const allAssets = await readOfflineData<any[]>(STORAGE_KEYS.ASSETS) || []
    allAssets.unshift(newAsset)
    await writeOfflineData(STORAGE_KEYS.ASSETS, allAssets)

    // Add floor item to offline storage
    const newFloorItem = {
      id: floorItemId,
      type: assetTypeName,
      pos: { x: posX, y: posY },
      rotation: 0,
      label,
      assignedTo: null,
      project: null
    }
    
    await addFloorItemToOfflineStorage(floorId, newFloorItem)

    revalidatePath('/floor-map')
    revalidatePath('/asset-types')
    
    return {
      success: true,
      data: { asset: newAsset, floorItem: newFloorItem }
    }
  } catch (error: any) {
    console.error('Error creating asset on floor:', error)
    
    return {
      success: false,
      error: 'Failed to create asset on floor'
    }
  }
}

export async function addExistingAssetToFloor(
  floorId: string,
  assetId: string,
  posX: number,
  posY: number
) {
  try {
    // Get the existing asset from offline storage
    const allAssets = await readOfflineData<any[]>(STORAGE_KEYS.ASSETS)
    const asset = allAssets?.find((a: any) => a.id === assetId)

    if (!asset) {
      return {
        success: false,
        error: 'Asset not found'
      }
    }

    // Create floor item ID
    const floorItemId = `flooritem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Add it to the floor in offline storage
    const newFloorItem = {
      id: floorItemId,
      type: asset.assetType.name,
      pos: { x: posX, y: posY },
      rotation: 0,
      label: asset.label,
      assignedTo: asset.assignedTo,
      project: asset.project
    }
    
    await addFloorItemToOfflineStorage(floorId, newFloorItem)

    revalidatePath('/floor-map')
    revalidatePath('/asset-types')
    
    return {
      success: true,
      data: newFloorItem
    }
  } catch (error: any) {
    console.error('Error adding existing asset to floor:', error)
    
    return {
      success: false,
      error: 'Failed to add existing asset to floor'
    }
  }
}

// Save floors from offline storage to database
export async function saveFloorsToDatabase() {
  try {
    // Read offline floor data
    const offlineFloors = await readOfflineData<any[]>(STORAGE_KEYS.FLOORS)
    
    if (!offlineFloors) {
      return {
        success: false,
        error: 'No offline floor data found'
      }
    }

    // Start a transaction to save all data
    const result = await prisma.$transaction(async (tx: { floor: { findUnique: (arg0: { where: { id: any } }) => any; update: (arg0: { where: { id: any }; data: { name: any; width: any; height: any } }) => any; create: (arg0: { data: { id: any; name: any; width: any; height: any } }) => any }; floorItem: { deleteMany: (arg0: { where: { floorId: any } }) => any; create: (arg0: { data: { id: any; floorId: any; type: any; posX: any; posY: any; rotation: any; label: any; assignedTo: any; project: any } }) => any } }) => {
      const savedFloors = []
      
      for (const floor of offlineFloors as any[]) {
        // Check if floor exists in database
        const existingFloor = await tx.floor.findUnique({
          where: { id: floor.id }
        })

        let dbFloor
        if (existingFloor) {
          // Update existing floor
          dbFloor = await tx.floor.update({
            where: { id: floor.id },
            data: {
              name: floor.name,
              width: floor.width,
              height: floor.height
            }
          })
        } else {
          // Create new floor
          dbFloor = await tx.floor.create({
            data: {
              id: floor.id,
              name: floor.name,
              width: floor.width,
              height: floor.height
            }
          })
        }

        // Delete all existing floor items for this floor
        await tx.floorItem.deleteMany({
          where: { floorId: floor.id }
        })

        // Create new floor items
        if (floor.items && floor.items.length > 0) {
          for (const item of floor.items as any[]) {
            await tx.floorItem.create({
              data: {
                id: item.id,
                floorId: floor.id,
                type: item.type,
                posX: item.pos.x,
                posY: item.pos.y,
                rotation: item.rotation || 0,
                label: item.label || null,
                assignedTo: item.assignedTo || null,
                project: item.project || null
              }
            })
          }
        }

        savedFloors.push(dbFloor)
      }

      return savedFloors
    })

    // Also save any new assets that were created
    const offlineAssets = await readOfflineData<any[]>(STORAGE_KEYS.ASSETS)
    if (offlineAssets) {
      for (const asset of offlineAssets) {
        // Check if asset exists in database
        const existingAsset = await prisma.asset.findUnique({
          where: { id: asset.id }
        })

        if (!existingAsset) {
          // Create new asset in database
          await prisma.asset.create({
            data: {
              id: asset.id,
              label: asset.label,
              assignedTo: asset.assignedTo,
              project: asset.project,
              assetTypeId: asset.assetTypeId
            }
          })
        } else {
          // Update existing asset
          await prisma.asset.update({
            where: { id: asset.id },
            data: {
              label: asset.label,
              assignedTo: asset.assignedTo,
              project: asset.project
            }
          })
        }
      }
    }

    revalidatePath('/floor-map')
    revalidatePath('/asset-types')
    
    return {
      success: true,
      message: `Successfully saved ${result.length} floor(s) to database`
    }
  } catch (error: any) {
    console.error('Error saving floors to database:', error)
    
    return {
      success: false,
      error: 'Failed to save floors to database: ' + error.message
    }
  }
}
