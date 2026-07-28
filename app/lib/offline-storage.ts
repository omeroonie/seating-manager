import { promises as fs } from 'fs'
import path from 'path'

// Data directory for offline storage
const DATA_DIR = path.join(process.cwd(), 'data', 'offline')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating data directory:', error)
  }
}

// Get path for a specific data file
function getFilePath(key: string): string {
  return path.join(DATA_DIR, `${key}.json`)
}

// Read data from disk
export async function readOfflineData<T>(key: string): Promise<T | null> {
  try {
    await ensureDataDir()
    const filePath = getFilePath(key)
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist or is invalid
    return null
  }
}

// Write data to disk
export async function writeOfflineData<T>(key: string, data: T): Promise<void> {
  try {
    await ensureDataDir()
    const filePath = getFilePath(key)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`Error writing offline data for ${key}:`, error)
  }
}

// Update specific item in a list
export async function updateOfflineItem<T extends { id: string }>(
  key: string,
  itemId: string,
  updater: (item: T) => T
): Promise<void> {
  try {
    const data = await readOfflineData<T[]>(key)
    if (!data) return
    
    const index = data.findIndex(item => item.id === itemId)
    if (index === -1) return
    
    data[index] = updater(data[index])
    await writeOfflineData(key, data)
  } catch (error) {
    console.error(`Error updating offline item in ${key}:`, error)
  }
}

// Add item to a list
export async function addOfflineItem<T>(key: string, item: T): Promise<void> {
  try {
    const data = await readOfflineData<T[]>(key)
    const list = data || []
    list.unshift(item) // Add to beginning
    await writeOfflineData(key, list)
  } catch (error) {
    console.error(`Error adding offline item to ${key}:`, error)
  }
}

// Remove item from a list
export async function removeOfflineItem<T extends { id: string }>(
  key: string,
  itemId: string
): Promise<void> {
  try {
    const data = await readOfflineData<T[]>(key)
    if (!data) return
    
    const filtered = data.filter(item => item.id !== itemId)
    await writeOfflineData(key, filtered)
  } catch (error) {
    console.error(`Error removing offline item from ${key}:`, error)
  }
}

// Storage keys
export const STORAGE_KEYS = {
  ASSET_TYPES: 'asset-types',
  ASSETS: 'assets',
  FLOORS: 'floors',
  RESOURCES: 'resources'
} as const

// Floor-specific operations
export async function updateFloorInOfflineStorage<T extends { id: string, items?: any[] }>(
  floorId: string,
  updater: (floor: T) => T
): Promise<void> {
  try {
    const data = await readOfflineData<T[]>(STORAGE_KEYS.FLOORS)
    if (!data) return
    
    const index = data.findIndex(floor => floor.id === floorId)
    if (index === -1) return
    
    data[index] = updater(data[index])
    await writeOfflineData(STORAGE_KEYS.FLOORS, data)
  } catch (error) {
    console.error('Error updating floor in offline storage:', error)
  }
}

export async function updateFloorItemInOfflineStorage(
  floorId: string,
  floorItemId: string,
  updater: (item: any) => any
): Promise<void> {
  try {
    const data = await readOfflineData<any[]>(STORAGE_KEYS.FLOORS)
    if (!data) return
    
    const floorIndex = data.findIndex((floor: any) => floor.id === floorId)
    if (floorIndex === -1) return
    
    const floor = data[floorIndex]
    if (!floor.items) return
    
    const itemIndex = floor.items.findIndex((item: any) => item.id === floorItemId)
    if (itemIndex === -1) return
    
    floor.items[itemIndex] = updater(floor.items[itemIndex])
    await writeOfflineData(STORAGE_KEYS.FLOORS, data)
  } catch (error) {
    console.error('Error updating floor item in offline storage:', error)
  }
}

export async function addFloorItemToOfflineStorage(
  floorId: string,
  item: any
): Promise<void> {
  try {
    const data = await readOfflineData<any[]>(STORAGE_KEYS.FLOORS)
    if (!data) return
    
    const floorIndex = data.findIndex((floor: any) => floor.id === floorId)
    if (floorIndex === -1) return
    
    if (!data[floorIndex].items) {
      data[floorIndex].items = []
    }
    
    data[floorIndex].items.push(item)
    await writeOfflineData(STORAGE_KEYS.FLOORS, data)
  } catch (error) {
    console.error('Error adding floor item to offline storage:', error)
  }
}

export async function removeFloorItemFromOfflineStorage(
  floorId: string,
  floorItemId: string
): Promise<void> {
  try {
    const data = await readOfflineData<any[]>(STORAGE_KEYS.FLOORS)
    if (!data) return
    
    const floorIndex = data.findIndex((floor: any) => floor.id === floorId)
    if (floorIndex === -1) return
    
    const floor = data[floorIndex]
    if (!floor.items) return
    
    floor.items = floor.items.filter((item: any) => item.id !== floorItemId)
    await writeOfflineData(STORAGE_KEYS.FLOORS, data)
  } catch (error) {
    console.error('Error removing floor item from offline storage:', error)
  }
}

