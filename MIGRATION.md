# Database Setup Instructions

## Migration Changes

The AssetType model has been updated to include an `svgData` field that stores SVG configuration as JSON.

### Steps to Apply Changes:

1. **Push the schema changes to the database:**
   ```bash
   pnpm db:push
   ```

2. **Generate Prisma Client:**
   ```bash
   pnpm db:generate
   ```

3. **Seed the database with asset types:**
   ```bash
   pnpm db:seed
   ```

This will populate the database with 7 asset types:
- Chair
- Desk
- Table
- Cabinet
- Plant
- Door
- Window

Each asset type includes SVG configuration data that defines how it renders on the floor map.

## What Changed:

1. **Prisma Schema** - Added `svgData` field to AssetType model
2. **Asset Type Form** - Now includes textarea for SVG data input
3. **API & Actions** - Updated to handle and validate SVG data
4. **Floor Map** - Now dynamically renders items from database asset types
5. **Seed Script** - Populates database with predefined SVG configurations

## Usage:

After seeding, you can:
- View existing asset types in the asset management page
- Create new asset types with custom SVG data
- Floor map automatically uses asset types from the database
