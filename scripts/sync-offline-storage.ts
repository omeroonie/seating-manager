/**
 * Offline Storage Sync Script
 * 
 * This script initializes or syncs the offline storage with the database.
 * Run this after setting up the database or when you need to refresh the offline cache.
 * 
 * Usage: npx tsx scripts/sync-offline-storage.ts
 */

import { PrismaClient } from '@prisma/client'
import { writeOfflineData, STORAGE_KEYS } from '../app/lib/offline-storage'

const prisma = new PrismaClient()

async function syncOfflineStorage() {
  console.log('🔄 Starting offline storage sync...\n')

  try {
    // Sync Asset Types
    console.log('📦 Syncing asset types...')
    const assetTypes = await prisma.assetType.findMany({
      orderBy: { createdAt: 'desc' }
    })
    await writeOfflineData(STORAGE_KEYS.ASSET_TYPES, assetTypes)
    console.log(`✅ Synced ${assetTypes.length} asset types\n`)

    // Sync Assets
    console.log('🏷️  Syncing assets...')
    const assets = await prisma.asset.findMany({
      include: { assetType: true },
      orderBy: { createdAt: 'desc' }
    })
    await writeOfflineData(STORAGE_KEYS.ASSETS, assets)
    console.log(`✅ Synced ${assets.length} assets\n`)

    // Sync Floors
    console.log('🏢 Syncing floors...')
    const floors = await prisma.floor.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })
    
    // Transform floors to match the application format
    const transformedFloors = floors.map(floor => ({
      id: floor.id,
      name: floor.name,
      width: floor.width,
      height: floor.height,
      items: floor.items.map(item => ({
        id: item.id,
        type: item.type,
        pos: { x: item.posX, y: item.posY },
        rotation: item.rotation || 0,
        label: item.label || undefined,
        assignedTo: item.assignedTo || undefined
      }))
    }))
    
    await writeOfflineData(STORAGE_KEYS.FLOORS, transformedFloors)
    console.log(`✅ Synced ${floors.length} floors\n`)

    console.log('✨ Offline storage sync completed successfully!')
  } catch (error) {
    console.error('❌ Error syncing offline storage:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

syncOfflineStorage()
