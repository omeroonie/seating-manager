# AI Agent Guide: Resource Manager

A Next.js 16 asset/resource management application with PostgreSQL backend, offline-first architecture, and SVG-based floor mapping.

## Quick Start Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm db:push          # Sync Prisma schema to database
pnpm db:studio        # Open Prisma Studio UI
pnpm db:seed          # Run seed.ts to populate database
pnpm offline:sync     # Sync offline storage from DB
```

## Project Structure

```
app/
  page.tsx                 # Home page
  api/
    asset-types/route.ts   # Asset type API (GET/POST)
    resources/route.ts     # Resources endpoint
  components/              # Reusable UI components (AssetForm, AssetManagement, etc.)
  floor-map/               # Floor mapping feature
    layout.tsx             # Parallel routes layout
    @map/                  # Map slot (floor visualization)
    @assets/               # Assets panel slot (asset management)

lib/
  actions.ts               # Server actions for form submissions
  offline-storage.ts       # JSON file-based offline cache (data/offline/*.json)
  prisma.ts                # Prisma singleton
  resources.ts             # Resource utilities

prisma/
  schema.prisma            # Database schema (4 core entities)
  seed.ts                  # Database seed script
```

## Architecture Overview

### Data Model
**Core entities** (in `prisma/schema.prisma`):
- **AssetType** — Reusable asset definitions (name, SVG representation)
- **Asset** — Individual asset instances (label, assignedTo, project, FK to AssetType)
- **Floor** — Building floor definitions (name, width, height dimensions)
- **FloorItem** — Asset placement on floors (position/rotation, linked to Floor)

All use CUID PKs with cascading deletes.

### Component Architecture: Server vs Client

**Server Components (default):**
- Async data fetching directly via Prisma
- Examples: `floor-map/layout.tsx`, `floor-map/@assets/page.tsx`
- Pattern: `async function Page() { const data = await db.query(...) }`

**Client Components (`'use client'`):**
- Interactivity, forms, and state management
- Suffixed with "Client": `AssetFormClient`, `FloorMapClient`, `AssetPanelClient`
- Use React 19's `useActionState()` for form submission + `useFormStatus()` for button state

### Offline-First Architecture

**Pattern:** API reads/writes to PostgreSQL, then syncs to JSON cache (`data/offline/`).

**Key functions** in `lib/offline-storage.ts`:
- `readOfflineData<T>(key)` — Read from cache
- `writeOfflineData<T>(key, data)` — Write to cache
- `updateOfflineItem<T>()` — Modify single item in cache
- `addOfflineItem<T>()`, `removeOfflineItem<T>()` — Batch operations

**Usage pattern:**
1. API route queries Prisma
2. After successful write, call `writeOfflineData()` to sync cache
3. Call `revalidatePath()` for ISR (no manual cache invalidation)
4. Client-side `useEffect()` fetches from `/api/*` (no SWR/Tanstack Query)

### Parallel Routes (Slots)

`floor-map/` uses Next.js parallel routes for concurrent rendering:
- `@map/` — Floor map visualization
- `@assets/` — Asset panel
- Layout receives both slots: `layout.tsx` → `children`, `map`, `assets`

This allows independent loading and error handling per section.

## Development Conventions

### Naming Conventions
- **Server components**: Generic names (`page.tsx`, `layout.tsx`, `AssetsPage`)
- **Client components**: Explicitly suffixed (`AssetFormClient`, `FloorMapClient`)
- **API routes**: `app/api/[resource]/route.ts`
- **Shared utilities**: Placed in `app/lib/`
- **Path aliases**: Use `@/*` for root-relative imports (e.g., `@/lib/prisma`)

### Form Submission Pattern (React 19)
```typescript
// Server Action (app/lib/actions.ts)
'use server'
export async function createAsset(formData: FormData) {
  const validated = validateInput(formData);
  const result = await db.asset.create({...});
  await writeOfflineData('ASSETS', [...]); // Sync cache
  revalidatePath('/assets');              // ISR
  return { success: true, data: result };
}

// Client Component
'use client'
function AssetForm() {
  const [state, formAction] = useActionState(createAsset, null);
  const { pending } = useFormStatus();
  return <form action={formAction}>...</form>;
}
```

### Data Fetching Patterns

**Server component** (parallel fetching):
```typescript
const [assetTypes, assets] = await Promise.all([
  db.assetType.findMany(),
  db.asset.findMany()
]);
```

**Client component** (via fetch API):
```typescript
useEffect(() => {
  fetch('/api/asset-types').then(r => r.json()).then(setData);
}, []);
```

### Error Handling
- **Validation errors**: Return 400 with consistent JSON format
- **Duplicate key errors**: Check `error.code === 'P2002'` (Prisma unique constraint)
- **Server errors**: Return 500 with error message
- Both API routes and Server Actions must validate separately

### Type Safety
- `strict: true` in `tsconfig.json` — no implicit any
- TypeScript 7.0.2
- Interfaces often duplicated across API routes + Client components for consistency

## Styling & UI

- **Framework**: Tailwind CSS 4.3.3 (utility-first, no component library)
- **Icons**: Lucide React
- **Utility**: `cn()` function in `lib/utils.ts` (clsx + twMerge for class merging)
- **CVA**: class-variance-authority available but not heavily used

**Example:**
```typescript
import { cn } from '@/lib/utils';
export function Button({ variant, className, ...props }) {
  return <button className={cn('px-4 py-2', variant && variantClass[variant], className)} {...props} />;
}
```

## SVG Asset System

Assets are stored as **JSON-serialized SVG objects**, not strings:
```json
{ "type": "rect", "x": 0, "y": 0, "width": 50, "height": 50, "fill": "blue" }
```

**Rendering**: `FloorMap/DynamicSVGItem.tsx` dynamically renders based on object type.

## Database & ORM

- **ORM**: Prisma 7.9.0 with PrismaPg adapter (edge-friendly)
- **Database**: PostgreSQL
- **Schema location**: `prisma/schema.prisma`
- **Singleton pattern**: `lib/prisma.ts` (prevents connection pool issues in dev)

**Key commands:**
- `pnpm db:push` — Sync schema changes (dev only, no migrations)
- `pnpm db:generate` — Regenerate Prisma client
- `pnpm db:seed` — Populate test data

## Common Pitfalls & Solutions

| Issue | Solution |
|-------|----------|
| **Offline cache out of sync** | Always call `writeOfflineData()` after Prisma writes; use `revalidatePath()` |
| **Server/Client boundary violations** | Keep async functions (`db.*`, `fs.*`) in Server components or Actions only |
| **Duplicate validation logic** | Maintain matching validation in both API routes and Server Actions |
| **Missing `'use client'` directive** | Client-side hooks (useState, useEffect) require this; check compilation errors |
| **Connection pool exhaustion** | Use Prisma singleton (`lib/prisma.ts`); don't create new PrismaClient instances |
| **Type mismatches in parallel routes** | Define slot types in layout signature: `({ children, map, assets })` |

## Key Files to Know

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema; start here for data model |
| `app/lib/actions.ts` | All Server Actions (form submissions) |
| `app/lib/offline-storage.ts` | Offline cache read/write utilities |
| `app/components/AssetForm.tsx` | Example Client Component with useActionState |
| `app/components/FloorMap/DynamicSVGItem.tsx` | SVG rendering logic |
| `app/floor-map/layout.tsx` | Parallel routes setup; routing architecture |
| `app/api/asset-types/route.ts` | API pattern example (offline-first, validation) |
| `.eslintrc.config.mjs` | ESLint rules (extends next/core-web-vitals) |

## Performance Considerations

- **ISR**: Use `revalidatePath()` after mutations (not `revalidateTag()`)
- **Parallel routes**: Leverage `@slots` for concurrent rendering and error isolation
- **Offline cache**: No versioning/migration logic; assumes single writer
- **Styling**: Tailwind + PostCSS; no runtime CSS-in-JS

## Testing & Debugging

- **ESLint**: `pnpm lint` (enforces Next.js best practices)
- **Prisma Studio**: `pnpm db:studio` (visual DB browser)
- **Offline sync**: `pnpm offline:sync` (rebuild cache from DB)
- **Development**: `pnpm dev` with hot module reloading enabled by default

---

**Version**: Next.js 16.2.12 | React 19.2.8 | Prisma 7.9.0 | TypeScript 7.0.2
