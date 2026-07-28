# Skill: Implement Offline-First Data Sync

**Purpose**: Enable AI agents to correctly implement offline-first read/write patterns and avoid cache sync pitfalls when adding new features to the resource manager.

**When to use**: Adding new data entities, API endpoints, or server actions that need offline support.

---

## Quick Reference: Choose Your Sync Pattern

| Scenario | Pattern | When to Use | Revalidate |
|----------|---------|------------|-----------|
| **Read operation** | Cache-first with DB fallback | Fetching existing data (asset types, assets, floors) | No |
| **Create/Update/Delete** | Eager sync (DB → cache) | Asset types, assets — immediate consistency required | `revalidatePath()` |
| **Floor edits** | Lazy sync (cache → manual save) | Floor maps, floor items — batch updates before DB commit | `revalidatePath()` on save |

---

## Pattern 1: Read with Cache-First + DB Fallback

**When**: Fetching data that should be cached locally (assetTypes, assets, floors).

**Goal**: Return cached data if available; fetch from DB and populate cache on miss.

### Implementation Template

```typescript
export async function getAllAssets() {
  try {
    // Step 1: Try to read from offline storage
    const cachedData = await readOfflineData(STORAGE_KEYS.ASSETS)
    
    if (cachedData) {
      return cachedData  // Return immediately
    }

    // Step 2: Cache miss — fetch from database
    const assets = await prisma.asset.findMany({
      include: { assetType: true },
      orderBy: { createdAt: 'desc' }
    })
    
    // Step 3: Populate cache for next read
    await writeOfflineData(STORAGE_KEYS.ASSETS, assets)
    
    return assets
  } catch (error) {
    console.error('Error fetching assets:', error)
    return []
  }
}
```

### Checklist

- [ ] Try `readOfflineData()` first with appropriate STORAGE_KEY
- [ ] If cache hit, return immediately (no DB query)
- [ ] If cache miss, query Prisma with `include` for related data
- [ ] Always write to cache after DB fetch
- [ ] Return same data structure from both paths
- [ ] Wrap in try-catch; return empty fallback on error

---

## Pattern 2: Eager Sync (DB → Cache) for Atomic Operations

**When**: Create/update/delete operations where cache must stay in sync immediately (assets, asset types).

**Goal**: Write to DB, then sync entire collection to cache in one operation.

### Implementation Template

```typescript
export async function createAsset(prevState: any, formData: FormData) {
  const label = formData.get('label') as string
  // ... other field extractions

  // Step 1: Validate input
  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    return {
      success: false,
      error: 'Asset label is required'
    }
  }

  try {
    // Step 2: Write to database
    const asset = await prisma.asset.create({
      data: {
        label: label.trim(),
        assignedTo: assignedTo.trim(),
        project: project.trim(),
        assetTypeId
      }
    })

    // Step 3: Fetch updated collection from DB
    const allAssets = await prisma.asset.findMany({
      include: { assetType: true },
      orderBy: { createdAt: 'desc' }
    })

    // Step 4: Sync entire collection to cache
    await writeOfflineData(STORAGE_KEYS.ASSETS, allAssets)

    // Step 5: Trigger ISR revalidation
    revalidatePath('/assets')
    
    return {
      success: true,
      data: asset
    }
  } catch (error: any) {
    console.error('Error creating asset:', error)
    
    // Handle known error codes
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Asset with this name already exists'
      }
    }
    
    return {
      success: false,
      error: 'Failed to create asset'
    }
  }
}
```

### Checklist

- [ ] Validate all input fields before DB operation
- [ ] Perform single DB write (create/update/delete)
- [ ] After success, fetch the **entire collection** from DB (not just the modified item)
- [ ] Write full collection to cache (maintains consistency across clients)
- [ ] Call `revalidatePath()` to trigger ISR
- [ ] Handle specific Prisma error codes (e.g., `P2002` for unique constraints)
- [ ] Return structured response: `{ success: boolean, error?: string, data?: T }`

---

## Pattern 3: Lazy Sync (Cache-First) for Batch Operations

**When**: Floor map edits where multiple changes happen before final DB save (floor items, positioning).

**Goal**: Update cache immediately for instant UI feedback; defer DB sync to explicit save action.

### Step 1: Optimistic Cache Update

```typescript
export async function updateFloorItemPosition(floorItemId: string, posX: number, posY: number) {
  try {
    // Read floors from cache
    const floors = await readOfflineData<any[]>(STORAGE_KEYS.FLOORS)
    if (!floors) {
      return { success: false, error: 'No floor data available' }
    }

    // Find floor containing this item
    for (const floor of floors) {
      const itemIndex = floor.items?.findIndex((item: any) => item.id === floorItemId)
      if (itemIndex !== -1 && itemIndex !== undefined) {
        // Update item position
        floor.items[itemIndex].pos = { x: posX, y: posY }
        
        // Write updated floors back to cache
        await writeOfflineData(STORAGE_KEYS.FLOORS, floors)
        
        // Revalidate for ISR (UI updates across clients)
        revalidatePath('/floor-map')
        
        return { success: true }
      }
    }
    
    return { success: false, error: 'Floor item not found' }
  } catch (error: any) {
    console.error('Error updating floor item position:', error)
    return { success: false, error: 'Failed to update position' }
  }
}
```

### Step 2: Batch Save to Database

```typescript
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

    // Use transaction to save all changes atomically
    const result = await prisma.$transaction(async (tx) => {
      const savedFloors = []
      
      for (const floor of offlineFloors) {
        // Check if floor exists
        const existingFloor = await tx.floor.findUnique({
          where: { id: floor.id }
        })

        let dbFloor
        if (existingFloor) {
          // Update existing
          dbFloor = await tx.floor.update({
            where: { id: floor.id },
            data: {
              name: floor.name,
              width: floor.width,
              height: floor.height
            }
          })
        } else {
          // Create new
          dbFloor = await tx.floor.create({
            data: {
              id: floor.id,
              name: floor.name,
              width: floor.width,
              height: floor.height
            }
          })
        }

        // Delete old floor items and create new ones
        await tx.floorItem.deleteMany({
          where: { floorId: floor.id }
        })

        if (floor.items && floor.items.length > 0) {
          for (const item of floor.items) {
            await tx.floorItem.create({
              data: {
                id: item.id,
                floorId: floor.id,
                type: item.type,
                posX: item.pos.x,
                posY: item.pos.y,
                rotation: item.rotation || 0,
                label: item.label || null,
                assignedTo: item.assignedTo || null
              }
            })
          }
        }

        savedFloors.push(dbFloor)
      }

      return savedFloors
    })

    revalidatePath('/floor-map')
    
    return {
      success: true,
      message: `Successfully saved ${result.length} floor(s)`
    }
  } catch (error: any) {
    console.error('Error saving to database:', error)
    return {
      success: false,
      error: 'Failed to save floors: ' + error.message
    }
  }
}
```

### Checklist

- [ ] Update cache immediately for instant UI feedback
- [ ] Each change writes to cache only (not DB)
- [ ] Provide explicit "Save" action to persist changes
- [ ] In save action, use `prisma.$transaction()` to batch all floor + item updates
- [ ] Handle both create and update cases for floors
- [ ] Recreate floor items from scratch (delete old, insert new)
- [ ] Call `revalidatePath()` after save to sync ISR

---

## Pattern 4: Data Transformation (Critical!)

**Important**: When data shape differs between DB and app cache, maintain transformation consistency.

### Problem

The `FloorItem` table stores position as separate `posX` and `posY` fields, but the app cache uses `pos: { x, y }`. This transformation must happen in **both**:
1. The sync script (`scripts/sync-offline-storage.ts`)
2. Server actions (`app/lib/actions.ts`)

### Solution: Central Transformation Function

**Create** `app/lib/transforms.ts`:

```typescript
export function transformFloorItem(dbItem: any) {
  return {
    id: dbItem.id,
    type: dbItem.type,
    pos: { x: dbItem.posX, y: dbItem.posY },
    rotation: dbItem.rotation || 0,
    label: dbItem.label || undefined,
    assignedTo: dbItem.assignedTo || undefined
  }
}

export function transformFloor(dbFloor: any) {
  return {
    id: dbFloor.id,
    name: dbFloor.name,
    width: dbFloor.width,
    height: dbFloor.height,
    items: (dbFloor.items || []).map(transformFloorItem)
  }
}
```

**Use in sync script** (`scripts/sync-offline-storage.ts`):

```typescript
const floors = await prisma.floor.findMany({
  include: { items: true },
  orderBy: { createdAt: 'desc' }
})

const transformedFloors = floors.map(transformFloor)
await writeOfflineData(STORAGE_KEYS.FLOORS, transformedFloors)
```

**Use in server actions** (`app/lib/actions.ts`):

```typescript
export async function getFloors() {
  // ... cache check ...
  
  const floors = await prisma.floor.findMany({
    include: { items: true },
    orderBy: { createdAt: 'asc' }
  })
  
  const transformedFloors = floors.map(transformFloor)
  await writeOfflineData(STORAGE_KEYS.FLOORS, transformedFloors)
  
  return transformedFloors
}
```

### Checklist

- [ ] Identify data shape differences (DB ↔ app cache)
- [ ] Create transformation functions in `lib/transforms.ts`
- [ ] Use the same transformation in **all** places:
  - Sync script
  - Initial read server actions
  - Batch save operations
- [ ] Export functions for reuse; don't duplicate logic
- [ ] Add comments explaining why transformation exists

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Offline Cache Gets Out of Sync

**Symptom**: Cache has stale data; UI shows old values after DB update.

**Root Cause**: Wrote to DB but forgot to sync cache.

**Fix**:
```typescript
// ❌ BAD: DB update without cache sync
await prisma.asset.update({ where: { id }, data: {...} })
revalidatePath('/assets')

// ✅ GOOD: DB update + cache sync
await prisma.asset.update({ where: { id }, data: {...} })
const allAssets = await prisma.asset.findMany({...})
await writeOfflineData(STORAGE_KEYS.ASSETS, allAssets)
revalidatePath('/assets')
```

### ❌ Pitfall 2: Duplicate Data Transformations

**Symptom**: Sync script transforms data differently than server action; cache mismatch.

**Root Cause**: Logic duplicated across files without shared function.

**Fix**: Extract to `lib/transforms.ts`, import in both locations.

### ❌ Pitfall 3: Inconsistent Return Types

**Symptom**: Sometimes API returns transformed data, sometimes raw DB data.

**Root Cause**: Cache-first path returns cache format; DB fallback returns different format.

**Fix**: Ensure cache and DB both use same transformation before caching.

### ❌ Pitfall 4: Missing `include` for Relations

**Symptom**: Cache has assets without `assetType` relation; app crashes when accessing `asset.assetType.name`.

**Root Cause**: Fetched assets without `include: { assetType: true }`.

**Fix**:
```typescript
// ❌ BAD
const assets = await prisma.asset.findMany()

// ✅ GOOD
const assets = await prisma.asset.findMany({
  include: { assetType: true },
  orderBy: { createdAt: 'desc' }
})
```

### ❌ Pitfall 5: Lazy Sync Without Explicit Save

**Symptom**: User makes floor edits, closes browser, changes are lost.

**Root Cause**: Changes were cache-only; never persisted to DB.

**Fix**: Provide explicit "Save to Database" button that calls the batch save action.

---

## Checklist: Adding Offline Support to New Feature

Use this checklist when implementing a new data entity with offline sync:

### Step 1: Define Storage Key
- [ ] Add key to `STORAGE_KEYS` enum in `app/lib/offline-storage.ts`
- [ ] Key format: `ENTITY_NAME` (uppercase, snake_case)

### Step 2: Create CRUD Server Actions
- [ ] `get[Entity]()` — cache-first read (Pattern 1)
- [ ] `create[Entity]()` — eager sync (Pattern 2)
- [ ] `update[Entity]()` — eager sync (Pattern 2)
- [ ] `delete[Entity]()` — eager sync (Pattern 2)

### Step 3: Handle Data Transformation
- [ ] Identify shape differences between DB and app
- [ ] Create transform functions in `lib/transforms.ts` if needed
- [ ] Use consistently in sync script + server actions

### Step 4: Sync Script
- [ ] Add fetch + transform + write in `scripts/sync-offline-storage.ts`
- [ ] Test: `pnpm offline:sync` produces correct JSON

### Step 5: API Endpoint (if needed)
- [ ] Implement cache-first read in `app/api/[entity]/route.ts`
- [ ] Match validation logic from server actions
- [ ] Return consistent JSON format

### Step 6: Testing
- [ ] Verify initial fetch populates cache
- [ ] Verify create/update/delete syncs cache
- [ ] Verify sync script generates correct JSON
- [ ] Verify offline cache has correct data shape

---

## Example: Adding Location Entity

Let's say you need to add a `Location` entity (name, building, floor).

### 1. Add Storage Key
```typescript
// app/lib/offline-storage.ts
export const STORAGE_KEYS = {
  // ...existing...
  LOCATIONS: 'locations'
} as const
```

### 2. Create Server Actions
```typescript
// app/lib/actions.ts
export async function getLocations() {
  try {
    const cachedData = await readOfflineData(STORAGE_KEYS.LOCATIONS)
    if (cachedData) return cachedData

    const locations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    await writeOfflineData(STORAGE_KEYS.LOCATIONS, locations)
    return locations
  } catch (error) {
    console.error('Error fetching locations:', error)
    return []
  }
}

export async function createLocation(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const building = formData.get('building') as string

  if (!name?.trim()) {
    return { success: false, error: 'Name required' }
  }

  try {
    const location = await prisma.location.create({
      data: { name: name.trim(), building: building?.trim() || null }
    })

    const allLocations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' }
    })
    await writeOfflineData(STORAGE_KEYS.LOCATIONS, allLocations)

    revalidatePath('/locations')
    
    return { success: true, data: location }
  } catch (error) {
    return { success: false, error: 'Failed to create location' }
  }
}
```

### 3. Add to Sync Script
```typescript
// scripts/sync-offline-storage.ts
console.log('📍 Syncing locations...')
const locations = await prisma.location.findMany({
  orderBy: { createdAt: 'desc' }
})
await writeOfflineData(STORAGE_KEYS.LOCATIONS, locations)
console.log(`✅ Synced ${locations.length} locations\n`)
```

---

## Debugging Cache Issues

### Q: Cache exists but is stale
**A**: Run `pnpm offline:sync` to rebuild cache from database.

### Q: Cache file is invalid JSON
**A**: Delete the file in `data/offline/` and restart dev server (will rebuild on next fetch).

### Q: Data mismatch between DB and cache
**A**: 
1. Check that all write operations call `writeOfflineData()` after DB mutation
2. Verify transformation functions match between sync script and server actions
3. Run `pnpm offline:sync` to rebuild

### Q: App crashes because cached data is missing a relation
**A**: 
1. Check that Prisma query includes all needed relations: `include: { relatedEntity: true }`
2. Run `pnpm offline:sync` to rebuild with correct shape
3. Update other server actions to use same `include` pattern

---

## Key Files to Reference

- **Offline utilities**: [app/lib/offline-storage.ts](../../app/lib/offline-storage.ts)
- **Server actions**: [app/lib/actions.ts](../../app/lib/actions.ts) (see `getFloors()`, `createAsset()`, `saveFloorsToDatabase()`)
- **Sync script**: [scripts/sync-offline-storage.ts](../../scripts/sync-offline-storage.ts)
- **Storage keys**: [app/lib/offline-storage.ts](../../app/lib/offline-storage.ts#L68) `STORAGE_KEYS` enum
- **Architecture doc**: [docs/OFFLINE_STORAGE.md](../OFFLINE_STORAGE.md)

---

**Version**: Resource Manager | Updated 2026-07-28
