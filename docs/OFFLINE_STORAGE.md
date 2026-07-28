# Offline Storage

This application includes an offline storage feature that caches data to disk for improved performance and offline access.

## How It Works

### Architecture

The offline storage system stores data as JSON files in the `data/offline/` directory. When data is fetched or modified, the system:

1. **On READ**: First checks the offline storage, returns cached data if available
2. **On WRITE**: Updates offline storage immediately (for floor maps), or both database and cache simultaneously (for assets and asset types)
3. **On SAVE**: For floor maps, a dedicated "Save to Database" button syncs offline changes to the database
4. **On INITIAL LOAD**: If no cached data exists, fetches from database and caches it

### Floor Map Workflow

The floor map has a special workflow for offline-first editing:

1. **All changes** (drag & drop, repositioning) update offline storage immediately
2. **Changes are local** until you click "Save to Database"
3. **Save button** syncs all offline floor data to PostgreSQL in a single transaction
4. This allows you to work offline and batch save changes

### Cached Data

The following data is cached offline:

- **Asset Types** (`asset-types.json`) - All asset type definitions and SVG data
- **Assets** (`assets.json`) - All created assets with their assignments
- **Floors** (`floors.json`) - Floor layouts and items with offline-first updates

### File Location

All offline data is stored in:
```
/data/offline/
  ├── asset-types.json
  ├── assets.json
  └── floors.json
```

## Usage

### Initial Setup

After setting up your database, initialize the offline storage:

```bash
npm run offline:sync
```

Or using pnpm:

```bash
pnpm offline:sync
```

This command will:
- Read all data from your PostgreSQL database
- Write it to JSON files in `data/offline/`
- Display a summary of synced items

### Automatic Updates

Once initialized, the offline storage automatically updates when you:

- Create a new asset type (saves to DB + cache)
- Create a new asset (saves to DB + cache)
- Update an asset (saves to DB + cache)
- Fetch asset types (caches on first fetch)
- Fetch assets (caches on first fetch)

### Floor Map Changes (Manual Save)

Floor map changes work differently:

- **Drag & drop assets** - Updates offline storage only
- **Reposition items** - Updates offline storage only
- **Add assets to floor** - Updates offline storage only
- **Click "Save to Database"** button - Syncs all changes to PostgreSQL

This offline-first approach allows you to:
- Work without database connection
- Make multiple changes before saving
- Batch updates for better performance

### Manual Sync

If you need to manually refresh the offline cache from the database:

```bash
npm run offline:sync
```

## API Routes

The following API routes have been enhanced with offline storage:

### GET /api/asset-types
- Returns cached asset types if available
- Falls back to database if cache doesn't exist
- Automatically caches database results

### POST /api/asset-types
- Creates new asset type in database
- Updates offline cache with all asset types

## Server Actions

The following server actions use offline storage:

### Asset Types & Assets
- `getAssetTypes()` - Returns cached asset types
- `createAssetType()` - Creates and caches asset type (updates DB + cache)
- `getAllAssets()` - Returns cached assets
- `getAssetsByType()` - Filters cached assets by type
- `createAsset()` - Creates and caches asset (updates DB + cache)
- `updateAsset()` - Updates asset in database and cache

### Floor Maps (Offline-First)
- `getFloors()` - Returns cached floor data
- `updateFloorItemPosition()` - Updates position in offline storage only
- `createAssetOnFloor()` - Creates asset and adds to floor in offline storage
- `addExistingAssetToFloor()` - Adds existing asset to floor in offline storage
- `saveFloorsToDatabase()` - **Syncs all offline floor data to database**

### Key Difference

Floor maps work differently:
- Changes update **offline storage only**
- User must click **"Save to Database"** button to persist
- This enables offline work and batched updates

## Benefits

1. **Faster Response Times** - Data is read from disk instead of database
2. **Reduced Database Load** - Fewer database queries
3. **Offline Capability** - App can read data even if database is unavailable
4. **Development Flexibility** - Easy to inspect and modify cached data

## Implementation Details

### Core Module

The offline storage logic is in `app/lib/offline-storage.ts`:

```typescript
// Read data
const data = await readOfflineData(STORAGE_KEYS.ASSET_TYPES)

// Write data
await writeOfflineData(STORAGE_KEYS.ASSET_TYPES, assetTypes)

// Add item to list
await addOfflineItem(STORAGE_KEYS.ASSETS, newAsset)

// Update item in list
await updateOfflineItem(STORAGE_KEYS.ASSETS, assetId, (asset) => ({
  ...asset,
  label: 'Updated Label'
}))

// Floor-specific operations
await updateFloorInOfflineStorage(floorId, (floor) => ({
  ...floor,
  name: 'Updated Name'
}))

await addFloorItemToOfflineStorage(floorId, newItem)

await updateFloorItemInOfflineStorage(floorId, itemId, (item) => ({
  ...item,
  pos: { x: 100, y: 200 }
}))

await removeFloorItemFromOfflineStorage(floorId, itemId)
```

### Storage Keys

Predefined keys are available in `STORAGE_KEYS`:

- `STORAGE_KEYS.ASSET_TYPES`
- `STORAGE_KEYS.ASSETS`
- `STORAGE_KEYS.FLOORS`
- `STORAGE_KEYS.RESOURCES`

## Troubleshooting

### Cache is stale

Run the sync command to refresh from database:
```bash
npm run offline:sync
```

### Files not being created

Check that the application has write permissions to the project directory.

### Data inconsistency

1. Delete the `data/offline/` directory
2. Run `npm run offline:sync` to rebuild cache

## Git Integration

The `data/offline/` directory is automatically ignored by Git (see `.gitignore`), so cached data won't be committed to your repository.

## Future Enhancements

Potential improvements:

- [ ] Add cache expiration/TTL
- [ ] Implement selective cache invalidation
- [ ] Add cache warming on app startup
- [ ] Support for real-time sync with database
- [ ] Cache versioning and migration support
