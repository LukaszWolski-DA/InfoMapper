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
- `components/` - All UI components

## Documentation

Comprehensive documentation available in:
- `docs/INFOMAPPER_DATA_MODEL_v1.0.md`
- `docs/INFOMAPPER_COMPONENT_REFERENCE_v1.0.md`
- `docs/ui-ux-consistency v1.md`
