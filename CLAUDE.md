# InfoMapper - AI Context Guide

## Project Overview

InfoMapper is a Data Warehouse metadata automation tool that helps manage:
- Logical data models (entities, attributes, relationships)
- Source system metadata (databases, tables, columns)
- Mappings between sources and logical models
- Requirements and catalog management

## Tech Stack

- **Framework:** Next.js 15.2 (App Router)
- **UI:** React 19, TypeScript 5, Tailwind CSS, shadcn/ui
- **State:** Custom store (lib/store.ts) with localStorage persistence
- **Icons:** Lucide React

## Key Views

1. **Object View** - Manage concepts, entities, and attributes
2. **Model View** - Entity relationship diagrams
3. **Mapping View** - Map sources to logical entities
4. **Sources View** - Import and manage source metadata
5. **Requirements View** - Manage requirements
6. **Catalog View** - Flat table view of all metadata

## Important Files

- `lib/store.ts` - Global state management
- `lib/types.ts` - Core domain types
- `lib/commands.ts` - State mutation functions
- `lib/projections.ts` - Domain to UI transformations
- `lib/ui-prefs.ts` - Centralized UI preferences management
- `components/` - All UI components

## Architecture Principles

### Single Source of Truth

InfoMapper follows a clean separation between **domain data** and **UI state**:

- **Domain Data** (`lib/store.ts`): Business entities, relationships, mappings
  - Storage key: `infoMapperStateV1`
  - Managed via commands in `lib/commands.ts`

- **UI State** (`lib/ui-prefs.ts`): Panel visibility, tree expansion, widths
  - Storage key: `infoMapperUIv1`
  - View-specific namespaces for each view's UI preferences

### UI State Persistence Pattern

**IMPORTANT**: Every view with collapsible trees, resizable panels, or filters **MUST** persist its UI state to provide a consistent user experience across view switches and page refreshes.

#### Pattern A: Parent-Managed Persistence
Use when the tree component is highly reusable across multiple contexts.

**Tree component** (controlled):
```typescript
interface TreeProps {
  openIds: Set<string>
  onToggle: (id: string) => void
}
```

**Parent component** (manages persistence):
```typescript
import { getObjectTreePrefs, setObjectTreePrefs } from "@/lib/ui-prefs"

const [openIds, setOpenIds] = useState(() => {
  const prefs = getObjectTreePrefs()
  return new Set(prefs.openConceptIds || [])
})

useEffect(() => {
  setObjectTreePrefs({ openConceptIds: Array.from(openIds) })
}, [openIds])
```

**Example**: [ObjectTree](components/object-tree.tsx) used in [Object View](components/object-view-v2.tsx)

#### Pattern B: Self-Managed Persistence
Use when the tree component is specialized and not reused across many contexts.

**Tree component** (self-persisting):
```typescript
import { getSourcesTreePrefs, setSourcesTreePrefs } from "@/lib/ui-prefs"

const [openIds, setOpenIds] = useState(() => {
  const prefs = getSourcesTreePrefs()
  return new Set(prefs.openSystemIds || [])
})

useEffect(() => {
  setSourcesTreePrefs({ openSystemIds: Array.from(openIds) })
}, [openIds])
```

**Example**: [SourcesTree](components/sources-tree.tsx), [ModelObjectTree](components/model-object-tree.tsx)

#### When to Add Persistence

Add UI state persistence for:
- ✅ Collapsible tree expansion states
- ✅ Resizable panel widths
- ✅ Panel visibility toggles (show/hide)
- ✅ Filter panel collapse states
- ❌ Search/filter **values** (these should be transient)
- ❌ Selected items (unless explicitly needed for bookmarking)
- ❌ Modal open/closed state (always transient)

### Storage Keys Reference

All UI preferences are stored in a single localStorage key `infoMapperUIv1` with namespaces:

| Namespace | View | Contains |
|-----------|------|----------|
| `objectTree` | Object View | `isLeftPanelVisible`, `leftPanelWidth`, `openConceptIds`, `openEntityIds` |
| `modelTree` | Model View | `leftPanelWidth`, `isLeftPanelVisible`, `openConceptIds` |
| `sourcesTree` | Sources View | `leftPanelWidth`, `isLeftPanelVisible`, `openSystemIds`, `openDatabaseIds`, `openSchemaIds`, `openObjectIds` |
| `mappingSidebar` | Mapping View | `sidebarWidth`, `openConceptIds`, `openEntityIds` |
| `requirementsView` | Requirements View | `isFilterPanelVisible`, `isEntityFilterVisible` |

**Specialized storage** (not in ui-prefs):
- `infoMapperCatalogConfig` - Catalog view configuration (complex config warrants dedicated key)
- `infoMapperSourcesV1` - Source system metadata (domain data)

### Adding a New View

When creating a new view with UI state:

1. **Define type** in `lib/ui-prefs.ts`:
```typescript
export type MyViewPrefs = {
  panelWidth?: number
  isExpanded?: boolean
}
```

2. **Add to UIPrefs union**:
```typescript
type UIPrefs = {
  // ... existing
  myView?: MyViewPrefs
}
```

3. **Add getter/setter**:
```typescript
export function getMyViewPrefs(): MyViewPrefs {
  return getUIPrefs().myView || {}
}

export function setMyViewPrefs(prefs: Partial<MyViewPrefs>): void {
  const existing = getUIPrefs()
  setUIPrefs({
    ...existing,
    myView: { ...existing.myView, ...prefs },
  })
}
```

4. **Use in component**:
```typescript
import { getMyViewPrefs, setMyViewPrefs } from "@/lib/ui-prefs"

const [panelWidth, setPanelWidth] = useState(() => {
  const prefs = getMyViewPrefs()
  return prefs.panelWidth || 300
})

useEffect(() => {
  setMyViewPrefs({ panelWidth })
}, [panelWidth])
```

## Documentation

Comprehensive documentation available in:
- `docs/INFOMAPPER_DATA_MODEL_v1.0.md`
- `docs/INFOMAPPER_COMPONENT_REFERENCE_v1.0.md`
- `docs/ui-ux-consistency v1.md`
