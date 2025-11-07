# InfoMapper - Component Reference Guide

**Version:** 1.0  
**Last Updated:** 2025-11-04  
**Purpose:** Standardized component naming and visual reference for communication  
**Author:** Architecture Documentation

---

## 📋 Table of Contents

1. [Naming Convention](#naming-convention)
2. [Application Layout](#application-layout)
3. [View-Level Components](#view-level-components)
4. [Mapping View Components](#mapping-view-components)
5. [Model View Components](#model-view-components)
6. [Object View Components](#object-view-components)
7. [Sources View Components](#sources-view-components)
8. [Requirements View Components](#requirements-view-components)
9. [Catalog View Components](#catalog-view-components)
10. [Shared UI Components](#shared-ui-components)
11. [Quick Reference Index](#quick-reference-index)

---

## 1. Naming Convention

### Standard Format
```
{type}_{object}_{context}
```

**Examples:**
- `card_entity_mapping` - Card component for entity in Mapping view
- `line_connection_mapping` - Connection line in Mapping view
- `tree_object` - Object tree (sidebar)
- `filter_search` - Search filter component

### Type Prefixes

| Prefix | Description | Examples |
|--------|-------------|----------|
| `view_` | Top-level view | view_mapping, view_model |
| `diagram_` | Canvas/diagram area | diagram_mapping_area, diagram_model_area |
| `card_` | Draggable cards on diagram | card_entity, card_source |
| `line_` | Connection/relationship lines | line_connection, line_relationship |
| `tree_` | Hierarchical tree components | tree_object, tree_sources |
| `panel_` | Side panels | panel_details, panel_dependency |
| `filter_` | Filter controls | filter_search, filter_attributes |
| `button_` | Action buttons | button_delete, button_expand |
| `input_` | Input fields | input_search, input_text |
| `modal_` | Modal dialogs | modal_edit, modal_confirm |

---

## 2. Application Layout

### 2.1 Overall Structure

```
┌─────────────────────────────────────────────────────────────┐
│ top_nav (Top Navigation Bar)                                │
│ [Mapping] [Model] [Object] [Sources] [Requirements] ...     │
└─────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────────────┐
│              │                                              │
│ sidebar_left │ main_content_area                            │
│              │                                              │
│ - Filters    │ (View-specific content)                      │
│ - Trees      │                                              │
│ - Actions    │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### top_nav

**Component:** `TopNav`  
**File:** `components/top-nav.tsx`  
**Purpose:** Main navigation between views

**Visual:**
```
┌────────────────────────────────────────────────────────────┐
│ InfoMapper  [Mapping] [Model] [Object] [Sources] [Req]    │
│             ^^^^^^^^                                  [⚙]  │
│             Active                                Settings │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Tab-based navigation
- Active view highlighting
- Settings/config menu
- Import/Export actions

**State:**
- `activeView`: Current selected view

---

### sidebar_left

**Component:** `Sidebar`  
**File:** `components/sidebar.tsx`  
**Purpose:** Left sidebar with filters and navigation trees

**Visual:**
```
┌───────────────┐
│ [Search...]   │  ← filter_search
├───────────────┤
│ ☐ Has PK      │  ← filter_checkbox
│ ☐ Has PII     │
├───────────────┤
│ ▼ Concept A   │  ← tree_concept
│   ▶ Entity 1  │
│   ▼ Entity 2  │  ← tree_entity
│     - attr_1  │    ← tree_attribute
│     - attr_2  │
└───────────────┘
```

**Features:**
- Collapsible/expandable
- Context-specific content per view
- Filters
- Tree navigation

**Variants by View:**
- Mapping: Object tree + filters
- Model: Object tree + attribute filters
- Object: Object tree + CRUD actions
- Sources: Sources tree + filters

---

### main_content_area

**Component:** View-specific  
**File:** `app/page.tsx` (routing logic)  
**Purpose:** Main workspace area

**Content varies by active view:**
- Mapping → `diagram_mapping_area`
- Model → `diagram_model_area`
- Object → `panel_object_details`
- Sources → `tree_sources_full`
- Requirements → `table_requirements`
- Catalog → `table_catalog`

---

## 3. View-Level Components

### view_mapping

**Component:** Rendering via DiagramArea  
**File:** `app/page.tsx` (line ~869-930)  
**Purpose:** Mapping view - connect sources to entities

**Structure:**
```
view_mapping
├── sidebar_left
│   ├── tree_object
│   └── filter_search
├── diagram_mapping_area
│   ├── card_entity_mapping (multiple)
│   ├── card_source_mapping (multiple)
│   ├── card_requirement_mapping (multiple)
│   └── line_connection_mapping (multiple)
└── panel_dependency (right side, optional)
```

---

### view_model

**Component:** Rendering via ModelView  
**File:** `app/page.tsx` (line ~796-848)  
**Purpose:** Model view - entity relationships

**Structure:**
```
view_model
├── sidebar_left
│   ├── tree_object
│   └── filter_attributes
├── diagram_model_area
│   ├── card_entity_model (multiple)
│   └── line_relationship (multiple)
└── panel_dependency (optional)
```

---

### view_object

**Component:** `ObjectView` / `ObjectViewV2`  
**File:** `components/object-view-v2.tsx`  
**Purpose:** Manage concepts, entities, attributes

**Structure:**
```
view_object
├── sidebar_left
│   ├── tree_object
│   │   ├── tree_concept
│   │   ├── tree_entity
│   │   └── tree_attribute
│   └── filter_search
└── panel_details_entity (right)
    ├── section_details
    ├── section_attributes
    └── panel_issues
```

---

### view_sources

**Component:** `SourcesView` / `SourcesViewV2`  
**File:** `components/sources-view-v2.tsx`  
**Purpose:** Import and manage source metadata

**Structure:**
```
view_sources
├── sidebar_left
│   ├── tree_sources
│   │   ├── tree_system
│   │   ├── tree_database
│   │   ├── tree_schema
│   │   └── tree_object
│   └── filter_search
└── panel_details_source (right)
    ├── section_details
    ├── section_columns
    └── panel_issues
```

---

### view_requirements

**Component:** `RequirementsView` / `RequirementsViewV2`  
**File:** `components/requirements-view-v2.tsx`  
**Purpose:** Manage requirements

**Structure:**
```
view_requirements
├── sidebar_left (optional)
│   └── filter_search
└── table_requirements
    ├── row_requirement (multiple)
    └── actions_row
```

---

### view_catalog

**Component:** `CatalogView`  
**File:** `components/catalog-view.tsx`  
**Purpose:** Browse all metadata in table format

**Structure:**
```
view_catalog
├── filter_bar
│   ├── filter_search
│   └── filter_type
└── table_catalog
    └── row_catalog_item (multiple)
```

---

## 4. Mapping View Components

### diagram_mapping_area

**Component:** `DiagramArea`  
**File:** `components/diagram-area.tsx`  
**Purpose:** Canvas for mapping entities to sources

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ diagram_mapping_area                                    │
│                                                         │
│  ┌──────────────┐                 ┌─────────────────┐  │
│  │ card_entity  │                 │ card_source     │  │
│  │ Customer     │                 │ crm.customers   │  │
│  │ • id     (PK)│ ══line══════════│ • customer_id   │  │
│  │ • name       │    connection   │ • cust_name     │  │
│  │ • email      │                 │ • cust_email    │  │
│  └──────────────┘                 └─────────────────┘  │
│                                                         │
│  ┌──────────────────┐                                  │
│  │ card_requirement │                                  │
│  │ REQ-001          │                                  │
│  │ User Auth        │                                  │
│  └──────────────────┘                                  │
│                ↓ line_requirement                      │
│         (to entity)                                    │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Drag & drop cards from sidebar
- Zoom (Ctrl + scroll)
- Pan (Space + drag)
- Grid snapping (16px)
- Multi-select (future)

**Keyboard Shortcuts:**
- `Ctrl + Scroll`: Zoom
- `Space + Drag`: Pan
- `Delete`: Delete selected (future)

---

### card_entity_mapping

**Component:** `DiagramCard` (itemType="entity")  
**File:** `components/diagram-card.tsx`  
**Purpose:** Entity card on mapping diagram

**Visual:**
```
┌──────────────────────┐
│ Customer        [×]  │  ← header_card (name + close button)
│ Object              │  ← badge_stereotype
├──────────────────────┤
│ ☑ All Attributes ▼  │  ← filter_attributes_dropdown
├──────────────────────┤
│ 🔑 customer_id (PK) │  ← row_attribute_pk
│ 📝 name             │  ← row_attribute_regular
│ 📧 email       (PII)│  ← row_attribute_pii
│ 🔗 address_id  (FK) │  ← row_attribute_fk
│ ...                 │
└──────────────────────┘
    ↕ Resize handle
```

**Features:**
- **Draggable** - Move on diagram
- **Resizable** - Width adjustment (200-600px)
- **Collapsible** - Hide/show attributes
- **Filterable attributes**:
  - All
  - Mapped (has connections)
  - Unmapped (no connections)
  - Keys (PK/FK only)
- **Delete** - Remove from diagram (not from model)
- **Data attributes** for connection detection:
  - `data-item-id`: Card ID
  - `data-attr-id`: Attribute ID (for each row)

**Props:**
```typescript
{
  item: DiagramItem
  onHide: (itemId) => void
  onUpdatePosition: (itemId, left, top) => void
  onAddConnection: (connection) => void
  connections: Connection[]
  searchQuery: string
  onSelectAttribute: (attr) => void
  onToggleCollapsed: (itemId) => void
  onUpdateObjectType: (itemId, objectType) => void
  onSetAttributeFilter: (itemId, filter) => void
  onUpdateWidth: (itemId, width) => void
  allEntities: Entity[]
  allSources: Source[]
  mode: "mapping"
  zoom: number
}
```

**States:**
- Position (left, top)
- Collapsed (boolean)
- AttributeFilter ("all" | "mapped" | "unmapped" | "keys")
- Width (number)
- Hidden (boolean)

---

### card_source_mapping

**Component:** `DiagramCard` (itemType="source")  
**File:** `components/diagram-card.tsx`  
**Purpose:** Source card on mapping diagram

**Visual:**
```
┌──────────────────────┐
│ crm.customers   [×]  │  ← header_card
│ Table               │  ← badge_object_type
├──────────────────────┤
│ ☑ All Columns    ▼  │  ← filter_columns_dropdown
├──────────────────────┤
│ 🔑 customer_id (PK) │  ← row_column_pk
│ 📝 cust_name        │  ← row_column_regular
│ 📧 cust_email       │
│ 🗓️ created_at       │
│ ...                 │
└──────────────────────┘
```

**Features:**
- Same as card_entity_mapping
- Shows source columns (not attributes)
- Source metadata (database.schema.table)

**Differences from Entity Card:**
- Label shows: `database.schema.table`
- Badge shows: "Table" or "View"
- Columns instead of attributes

---

### card_requirement_mapping

**Component:** `DiagramCard` (itemType="requirement")  
**File:** `components/diagram-card.tsx`  
**Purpose:** Requirement card on mapping diagram

**Visual:**
```
┌──────────────────────┐
│ REQ-001         [×]  │  ← header_card (displayId)
│ User Authentication  │  ← requirement_name
│ Functional           │  ← badge_type
├──────────────────────┤
│ "System must allow   │  ← description_preview
│  users to login..."  │
└──────────────────────┘
```

**Features:**
- Simpler than entity/source cards
- No attributes (no expandable list)
- Shows requirement summary
- Can connect to entities/sources

---

### line_connection_mapping

**Component:** `ConnectionLine`  
**File:** `components/connection-line.tsx`  
**Purpose:** Visual connection between attributes

**Visual:**
```
card_entity              card_source
┌─────────┐              ┌─────────┐
│ • email │══════════════│ • email │  ← line_connection_mapping
└─────────┘              └─────────┘
            ↑
         hover: [×] delete button
```

**Features:**
- **Dynamic positioning** - Follows cards on drag
- **Hover to delete** - Shows [×] button
- **Color coded**:
  - Blue: Attribute mappings
  - Purple: Requirement mappings
- **Types**:
  - Attribute-to-attribute (most common)
  - Entity-level (when attrId is empty)
  - Requirement-to-entity

**Line Calculation:**
- Finds source/target elements via querySelector
- Uses `data-attr-id` and `data-item-id`
- Calculates center points
- Draws straight line (SVG-like positioning)
- Updates on:
  - Card drag
  - Scroll
  - Zoom
  - Collapse/expand

**Connection Object:**
```typescript
{
  id: "conn_abc123"
  type: "attribute-mapping" | "requirement-mapping"
  source: {
    attrId: "latr_xyz"      // Empty = entity-level
    attrName: "email"
    parentId: "lent_abc"     // Entity ID
    parentType: "entity"
    itemId: "item_123"       // DiagramItem ID
  }
  target: {
    attrId: "col_def"
    attrName: "email"
    parentId: "obj_456"      // Source object ID
    parentType: "source"
    itemId: "item_789"
  }
}
```

---

### line_requirement_mapping

**Component:** `ConnectionLine` (type="requirement-mapping")  
**File:** `components/connection-line.tsx`  
**Purpose:** Visual link from requirement to entity/source

**Visual:**
```
card_requirement
┌──────────────┐
│ REQ-001      │
│ GDPR         │
└──────────────┘
       │
       │ line_requirement_mapping (purple)
       ↓
┌──────────────┐
│ Customer     │  ← card_entity
│ • email (PII)│
└──────────────┘
```

**Features:**
- Same as line_connection_mapping
- Different color (purple vs blue)
- Usually entity-level (no specific attribute)
- Shows traceability

---

## 5. Model View Components

### diagram_model_area

**Component:** `ModelDiagramArea`  
**File:** `components/model-diagram-area.tsx`  
**Purpose:** Canvas for entity relationship diagram

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ diagram_model_area                                      │
│                                                         │
│  ┌──────────────┐     line_relationship    ┌─────────┐ │
│  │ Customer     │─────────────────────────→│ Order   │ │
│  │ • id     (PK)│    "places" (1:N)        │ • id    │ │
│  │ • name       │                          │ • date  │ │
│  └──────────────┘                          └─────────┘ │
│         │                                      │        │
│         │ line_relationship                    │        │
│         ↓                                      ↓        │
│  ┌──────────────┐                      ┌───────────┐   │
│  │ Address      │                      │ OrderItem │   │
│  │ • id     (PK)│                      │ Link      │   │
│  └──────────────┘                      └───────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Similar to diagram_mapping_area
- Focus on entity relationships (not mappings)
- Bezier curves for relationship lines
- Relationship creation mode

---

### card_entity_model

**Component:** `DiagramCard` (mode="model")  
**File:** `components/diagram-card.tsx`  
**Purpose:** Entity card on model diagram

**Visual:**
```
┌──────────────────────┐
│ Customer        [×]  │
│ Object              │
├──────────────────────┤
│ ☑ All Attributes ▼  │
├──────────────────────┤
│ 🔑 customer_id (PK) │
│ 📝 name             │
│ 📧 email       (PII)│
│ 🔗 address_id  (FK) │
└──────────────────────┘
```

**Features:**
- Nearly identical to card_entity_mapping
- Different mode affects behavior:
  - Can create relationships (drag from one entity to another)
  - No source connections
  - Focus on PK/FK visualization

**Additional Actions:**
- **Create Relationship** - Drag from entity to entity
- **Show Keys** - Filter to show only PK/FK

---

### line_relationship

**Component:** `RelationshipLine`  
**File:** `components/relationship-line.tsx`  
**Purpose:** Visual relationship between entities

**Visual:**
```
┌──────────────┐                        ┌──────────────┐
│ Customer     │                        │ Order        │
│              │    "places"            │              │
│              ├────────────────────────┤              │
│              │    1          N        │              │
└──────────────┘                        └──────────────┘
                 ↑        ↑        ↑
            label    cardinality  direction
                     source  target
```

**Features:**
- **Bezier curves** - Smooth curved lines
- **Cardinality indicators**:
  - `1` = One (mandatory or optional)
  - `0..1` = Optional one
  - `1..N` = One or many
  - `N` = Many
- **Direction arrow**:
  - source-to-target
  - target-to-source
  - none (bidirectional)
- **Label** - Relationship name (optional)
- **Editable** - Double-click to edit
- **Hover to delete** - Shows [×] button

**Relationship Object:**
```typescript
{
  id: "rel_abc123"
  sourceEntityId: "lent_customer"
  targetEntityId: "lent_order"
  label: "places"
  cardinality: "1:N"
  
  // Extended (optional)
  minSource: 1
  maxSource: 1
  minTarget: 0
  maxTarget: "N"
  direction: "source-to-target"
}
```

**Line Rendering:**
- Finds entity cards by ID
- Calculates attachment points (sides of cards)
- Draws Bezier curve
- Positions label at midpoint
- Shows cardinality near attachment points

---

## 6. Object View Components

### panel_object_details

**Component:** Part of `ObjectView`  
**File:** `components/object-view-v2.tsx`  
**Purpose:** Right panel showing selected item details

**Structure:**
```
panel_object_details
├── header_panel
│   └── title (selected item name)
├── section_general
│   ├── input_name
│   ├── input_description
│   └── dropdown_stereotype
├── section_attributes
│   ├── list_attributes
│   │   └── row_attribute (multiple)
│   └── button_add_attribute
└── panel_issues (bottom)
    └── list_issues
```

**Visual:**
```
┌────────────────────────────────────┐
│ Customer                           │  ← header_panel
├────────────────────────────────────┤
│ General                            │  ← section_general
│ Name: [Customer____________]       │
│ Type: [Object         ▼]           │
│ Description: [.............]       │
├────────────────────────────────────┤
│ Attributes                         │  ← section_attributes
│ ┌────────────────────────────────┐│
│ │ • customer_id    Integer  (PK) ││  ← row_attribute
│ │ • name           String        ││
│ │ • email          String   (PII)││
│ └────────────────────────────────┘│
│ [+ Add Attribute]                  │  ← button_add_attribute
├────────────────────────────────────┤
│ Issues (2)                         │  ← panel_issues
│ ⚠️ Missing PK                      │
│ ⚠️ No description                  │
└────────────────────────────────────┘
```

---

### tree_object

**Component:** `ObjectTree`  
**File:** `components/object-tree.tsx`  
**Purpose:** Hierarchical tree of concepts/entities/attributes

**Visual:**
```
┌──────────────────────┐
│ [Search concepts...] │  ← filter_search
├──────────────────────┤
│ ▼ Customer Domain    │  ← tree_concept (expanded)
│   ▶ Customer         │    ← tree_entity (collapsed)
│   ▼ Address          │    ← tree_entity (expanded)
│     • address_id PK  │      ← tree_attribute
│     • street         │
│     • city           │
│   ▶ Phone            │
│                      │
│ ▶ Product Catalog    │  ← tree_concept (collapsed)
│ ▶ Orders             │
└──────────────────────┘
```

**Features:**
- **Hierarchical** - Concept > Entity > Attribute
- **Expand/Collapse** - Click to toggle
- **Selection** - Click to select item (shows in panel_object_details)
- **Drag & Drop** - Drag entity to diagram
- **Context Menu** - Right-click for actions
- **Filters**:
  - Search query
  - Has PK
  - Has PII
  - Only issues

**Tree Node Types:**

**tree_concept** (Level 1):
```
▼ Customer Domain  [•••]  ← badge_count (5 entities)
                   ↑ 
             dropdown_actions
```

**tree_entity** (Level 2):
```
  ▼ Customer  Object  [•••]
              ↑       ↑
          badge_stereotype  dropdown_actions
```

**tree_attribute** (Level 3):
```
    • email  String  PII
             ↑      ↑
         badge_datatype  badge_flags
```

**Actions (dropdown_actions):**
- **Concept:** Add Entity, Edit, Delete, Expand All
- **Entity:** Add Attribute, Edit, Delete, Add to Diagram
- **Attribute:** Edit, Delete

---

### tree_concept

**Component:** Part of `ObjectTree` (Concept node)  
**File:** `components/object-tree.tsx`  
**Purpose:** Top-level concept in tree

**Visual:**
```
▼ Customer Domain                    [•••]
  ↑                                   ↑
expand/collapse                   actions menu
```

**Features:**
- Click name → Select concept (show details)
- Click ▼ → Collapse/expand children
- Click [•••] → Show actions menu
- Badge shows entity count
- Color indicator (if concept has color)

---

### tree_entity

**Component:** Part of `ObjectTree` (Entity node)  
**File:** `components/object-tree.tsx`  
**Purpose:** Entity within concept

**Visual:**
```
  ▼ Customer  Object                 [•••]
    ↑         ↑                        ↑
 expand    badge_stereotype       actions
```

**Features:**
- Indented under concept
- Shows stereotype badge
- Draggable to diagram
- Shows attribute count
- Icons for issues (⚠️)

---

### tree_attribute

**Component:** Part of `ObjectTree` (Attribute node)  
**File:** `components/object-tree.tsx`  
**Purpose:** Attribute within entity

**Visual:**
```
    • email  String  PII  PK
      ↑      ↑       ↑    ↑
    bullet  type   flags flags
```

**Features:**
- Further indented under entity
- Shows data type
- Shows flags (PK, FK, PII)
- Click → Select attribute

**Flag Badges:**
- 🔑 **PK** - Primary Key
- 🔗 **FK** - Foreign Key
- 🔒 **PII** - Personal Identifiable Information
- ❓ **NULL** - Nullable

---

### panel_issues

**Component:** `ObjectIssues`  
**File:** `components/object-issues.tsx`  
**Purpose:** Show validation issues for selected item

**Visual:**
```
┌────────────────────────────────┐
│ Issues (3)              [Revalidate] │
├────────────────────────────────┤
│ ⚠️ ERROR: Missing Primary Key  │  ← issue_error
│ ⚠️ WARNING: No description     │  ← issue_warning
│ ℹ️ INFO: Consider adding tags  │  ← issue_info
└────────────────────────────────┘
```

**Issue Types:**
- **ERROR** (red) - Must fix (e.g., missing PK)
- **WARNING** (yellow) - Should fix (e.g., no description)
- **INFO** (blue) - Nice to have (e.g., add tags)

**Common Issues:**
- Entity without PK
- Entity without attributes
- Attribute without data type
- Duplicate names
- Orphaned attributes
- Circular relationships (future)

---

## 7. Sources View Components

### tree_sources

**Component:** `SourcesTree`  
**File:** `components/sources-tree.tsx`  
**Purpose:** Hierarchical tree of source metadata

**Visual:**
```
┌──────────────────────┐
│ [Search sources...]  │  ← filter_search
├──────────────────────┤
│ ▼ HR System          │  ← tree_system (expanded)
│   ▼ hrdta            │    ← tree_database
│     ▼ dbo            │      ← tree_schema
│       ▶ employee_t   │        ← tree_object (table)
│       ▶ department_t │
│                      │
│ ▶ CRM System         │  ← tree_system (collapsed)
│ ▶ Finance System     │
└──────────────────────┘
```

**Hierarchy:**
```
System → Database → Schema → Object (Table/View) → Column
```

**Features:**
- 5-level hierarchy
- Expand/collapse at each level
- Drag table to mapping diagram
- Shows object type (table/view)
- Shows row count (if available)

---

### tree_system

**Component:** Part of `SourcesTree` (System node)  
**File:** `components/sources-tree.tsx`  
**Purpose:** Top-level source system

**Visual:**
```
▼ HR System  (2 databases)              [•••]
  ↑                                      ↑
expand                                actions
```

---

### tree_database

**Component:** Part of `SourcesTree` (Database node)  
**File:** `components/sources-tree.tsx`  
**Purpose:** Database within system

**Visual:**
```
  ▼ hrdta  (3 schemas)                  [•••]
```

---

### tree_schema

**Component:** Part of `SourcesTree` (Schema node)  
**File:** `components/sources-tree.tsx`  
**Purpose:** Schema within database

**Visual:**
```
    ▼ dbo  (15 objects)                [•••]
```

---

### tree_object

**Component:** Part of `SourcesTree` (Object node)  
**File:** `components/sources-tree.tsx`  
**Purpose:** Table or view within schema

**Visual:**
```
      ▶ employee_t  Table  (8 cols)    [•••]
                    ↑      ↑
                  type   column_count
```

**Features:**
- Shows object type badge (Table/View)
- Shows column count
- Shows row count (if available)
- Draggable to mapping diagram
- Click → Show details (columns)

---

### panel_details_source

**Component:** `SourcesDetails`  
**File:** `components/sources-details.tsx`  
**Purpose:** Show selected source object details

**Visual:**
```
┌────────────────────────────────────┐
│ HR.hrdta.dbo.employee_t            │  ← header (full path)
├────────────────────────────────────┤
│ Type: Table                        │
│ Rows: 15,420                       │
│ Comment: Employee master data      │
├────────────────────────────────────┤
│ Columns (8)                        │
│ ┌────────────────────────────────┐│
│ │ 🔑 empl_id       numeric(10)  ││  ← row_column_pk
│ │ 📝 empl_first_name varchar(50)││  ← row_column
│ │ 📝 empl_last_name  varchar(50)││
│ │ 📧 empl_email      varchar(100)│
│ │ 🔗 dept_id         int        ││  ← row_column_fk
│ │ 🗓️ hire_date       date       ││
│ │ 💰 salary          decimal(10,2)│
│ │ ✅ is_active       boolean    ││
│ └────────────────────────────────┘│
└────────────────────────────────────┘
```

---

## 8. Requirements View Components

### table_requirements

**Component:** `RequirementsView` / `RequirementsViewV2`  
**File:** `components/requirements-view-v2.tsx`  
**Purpose:** List of all requirements

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ Requirements                    [+ Add] [Import] [Export]│
├────┬──────────────┬─────────────┬──────────┬───────────┤
│ ID │ Name         │ Type        │ Status   │ Actions   │
├────┼──────────────┼─────────────┼──────────┼───────────┤
│100│User Auth    │ Functional  │ Draft    │ [Edit][Del]│  ← row_requirement
│101│GDPR         │ Non-func    │ Approved │ [Edit][Del]│
│102│Performance  │ Non-func    │ Draft    │ [Edit][Del]│
└────┴──────────────┴─────────────┴──────────┴───────────┘
```

**Features:**
- Sortable columns (click header)
- Row actions (Edit, Delete)
- Add new requirement
- Import/Export
- Filter by type/status (future)

---

### row_requirement

**Component:** Part of table_requirements  
**File:** `components/requirements-view-v2.tsx`  
**Purpose:** Single requirement row

**Visual:**
```
│ 100234 │ User Authentication │ Functional │ Draft │ [Edit] [Delete] │
```

**Features:**
- Click row → Show details/edit
- Click [Edit] → Open edit modal
- Click [Delete] → Delete requirement
- Shows: displayId, name, type, status (future: priority, tags)

---

## 9. Catalog View Components

### table_catalog

**Component:** `CatalogView`  
**File:** `components/catalog-view.tsx`  
**Purpose:** Flat table view of all metadata

**Visual:**
```
┌────────────────────────────────────────────────────────────┐
│ Catalog                              [Search...] [Filter ▼]│
├──────┬──────────────┬──────────┬─────────────┬────────────┤
│ Type │ Name         │ Parent   │ Description │ Actions    │
├──────┼──────────────┼──────────┼─────────────┼────────────┤
│ 📦   │Customer Dom  │ -        │ ...         │ [View]     │  ← row_concept
│ 📋   │ Customer     │ Cust Dom │ ...         │ [View]     │  ← row_entity
│ 📝   │  customer_id │ Customer │ PK          │ [View]     │  ← row_attribute
│ 📝   │  email       │ Customer │ PII         │ [View]     │
│ 📦   │Product Cat   │ -        │ ...         │ [View]     │
└──────┴──────────────┴──────────┴─────────────┴────────────┘
```

**Features:**
- All metadata in one table
- Hierarchical indentation
- Type icons
- Parent relationship shown
- Click [View] → Navigate to item

---

## 10. Shared UI Components

### filter_search

**Component:** Part of various views  
**File:** `components/ui/im-input.tsx` (wrapper)  
**Purpose:** Search/filter input

**Visual:**
```
┌──────────────────────────┐
│ 🔍 Search...             │
└──────────────────────────┘
```

**Features:**
- Live search (filters as you type)
- Debounced (300ms)
- Clear button (×) when has text
- Keyboard: Enter to search, Esc to clear

---

### filter_checkbox

**Component:** Checkbox filters  
**File:** `components/ui/checkbox.tsx`  
**Purpose:** Boolean filters

**Visual:**
```
☐ Has PK
☑ Has PII
☐ Only issues
```

---

### filter_attributes_dropdown

**Component:** Dropdown filter  
**File:** Part of DiagramCard  
**Purpose:** Filter attributes on card

**Visual:**
```
☑ All Attributes ▼
  ├ All Attributes
  ├ Mapped Only
  ├ Unmapped Only
  └ Keys Only (PK/FK)
```

---

### button_delete

**Component:** Delete button  
**File:** Various  
**Purpose:** Delete action

**Visual:**
```
[×]  or  [Delete]  or  [🗑️]
```

**Variations:**
- Icon only ([×])
- Text button
- Icon + Text

---

### button_expand

**Component:** Expand/collapse button  
**File:** Part of tree components  
**Purpose:** Toggle expand/collapse

**Visual:**
```
▶  (collapsed)
▼  (expanded)
```

---

### button_add

**Component:** Add/create button  
**File:** Various  
**Purpose:** Create new item

**Visual:**
```
[+ Add Entity]
[+ Add Attribute]
[+ Add Connection]
```

---

### dropdown_actions

**Component:** Context menu dropdown  
**File:** `components/ui/dropdown-menu.tsx`  
**Purpose:** Item actions menu

**Visual:**
```
[•••]
  ↓ (click)
┌─────────────┐
│ Edit        │
│ Duplicate   │
│ Add to Map  │
├─────────────┤
│ Delete      │
└─────────────┘
```

---

### modal_edit

**Component:** Edit modal/dialog  
**File:** `components/ui/dialog.tsx`  
**Purpose:** Edit item in modal

**Visual:**
```
┌───────────────────────────────────┐
│ Edit Customer             [×]     │
├───────────────────────────────────┤
│ Name: [Customer____________]      │
│ Type: [Object         ▼]          │
│ Description:                      │
│ [................................]│
│                                   │
│        [Cancel]  [Save]           │
└───────────────────────────────────┘
```

---

### badge_stereotype

**Component:** Stereotype badge  
**File:** Various  
**Purpose:** Show entity stereotype

**Visual:**
```
Object      (blue)
Link        (teal)
Dictionary  (green)
Context     (amber)
Informative (gray)
```

---

### badge_datatype

**Component:** Data type badge  
**File:** Various  
**Purpose:** Show attribute data type

**Visual:**
```
String   Integer   Decimal   Boolean   Date   JSON
```

---

### badge_flags

**Component:** Attribute flags  
**File:** Various  
**Purpose:** Show attribute properties

**Visual:**
```
PK  FK  PII  NULL
```

---

## 11. Quick Reference Index

### Alphabetical Component List

| Component Name | File | View | Description |
|----------------|------|------|-------------|
| badge_datatype | Various | All | Data type indicator |
| badge_flags | Various | All | Attribute flags (PK/FK/PII) |
| badge_stereotype | Various | All | Entity stereotype badge |
| button_add | Various | All | Create new item |
| button_delete | Various | All | Delete item |
| button_expand | Tree components | All | Expand/collapse toggle |
| card_entity_mapping | diagram-card.tsx | Mapping | Entity card on mapping diagram |
| card_entity_model | diagram-card.tsx | Model | Entity card on model diagram |
| card_requirement_mapping | diagram-card.tsx | Mapping | Requirement card on diagram |
| card_source_mapping | diagram-card.tsx | Mapping | Source card on mapping diagram |
| diagram_mapping_area | diagram-area.tsx | Mapping | Mapping canvas |
| diagram_model_area | model-diagram-area.tsx | Model | Model canvas |
| dropdown_actions | ui/dropdown-menu.tsx | All | Context actions menu |
| filter_attributes_dropdown | Part of card | Mapping/Model | Attribute filter on card |
| filter_checkbox | ui/checkbox.tsx | All | Boolean filter |
| filter_search | ui/im-input.tsx | All | Search input |
| line_connection_mapping | connection-line.tsx | Mapping | Connection line |
| line_relationship | relationship-line.tsx | Model | Relationship line |
| line_requirement_mapping | connection-line.tsx | Mapping | Requirement link line |
| main_content_area | page.tsx | All | Main workspace |
| modal_edit | ui/dialog.tsx | All | Edit dialog |
| panel_details_entity | object-view-v2.tsx | Object | Entity details panel |
| panel_details_source | sources-details.tsx | Sources | Source details panel |
| panel_dependency | dependency-panel.tsx | Mapping/Model | Dependency panel |
| panel_issues | object-issues.tsx | Object | Issues panel |
| panel_object_details | object-view-v2.tsx | Object | Right panel |
| row_attribute | Various | All | Attribute row |
| row_catalog_item | catalog-view.tsx | Catalog | Catalog row |
| row_column | Various | Sources | Source column row |
| row_requirement | requirements-view-v2.tsx | Requirements | Requirement row |
| sidebar_left | sidebar.tsx | All | Left sidebar |
| table_catalog | catalog-view.tsx | Catalog | Catalog table |
| table_requirements | requirements-view-v2.tsx | Requirements | Requirements table |
| top_nav | top-nav.tsx | All | Top navigation |
| tree_attribute | object-tree.tsx | Object | Attribute tree node |
| tree_concept | object-tree.tsx | Object | Concept tree node |
| tree_database | sources-tree.tsx | Sources | Database tree node |
| tree_entity | object-tree.tsx | Object | Entity tree node |
| tree_object | object-tree.tsx | Object/Mapping | Object tree |
| tree_schema | sources-tree.tsx | Sources | Schema tree node |
| tree_sources | sources-tree.tsx | Sources | Sources tree |
| tree_system | sources-tree.tsx | Sources | System tree node |
| view_catalog | page.tsx | - | Catalog view |
| view_mapping | page.tsx | - | Mapping view |
| view_model | page.tsx | - | Model view |
| view_object | page.tsx | - | Object view |
| view_requirements | page.tsx | - | Requirements view |
| view_sources | page.tsx | - | Sources view |

---

## Appendix A: Component Relationships

### Mapping View Hierarchy
```
view_mapping
├── top_nav
├── sidebar_left
│   ├── tree_object
│   │   ├── tree_concept
│   │   ├── tree_entity
│   │   └── tree_attribute
│   ├── filter_search
│   └── filter_checkbox (multiple)
└── diagram_mapping_area
    ├── card_entity_mapping (multiple)
    │   ├── filter_attributes_dropdown
    │   └── row_attribute (multiple)
    ├── card_source_mapping (multiple)
    │   ├── filter_attributes_dropdown
    │   └── row_column (multiple)
    ├── card_requirement_mapping (multiple)
    ├── line_connection_mapping (multiple)
    └── line_requirement_mapping (multiple)
```

### Model View Hierarchy
```
view_model
├── top_nav
├── sidebar_left
│   ├── tree_object
│   └── filter_attributes_dropdown
└── diagram_model_area
    ├── card_entity_model (multiple)
    └── line_relationship (multiple)
```

### Object View Hierarchy
```
view_object
├── top_nav
├── sidebar_left
│   ├── tree_object
│   │   ├── tree_concept
│   │   ├── tree_entity
│   │   └── tree_attribute
│   └── filter_search
└── panel_object_details
    ├── section_general
    ├── section_attributes
    │   └── row_attribute (multiple)
    └── panel_issues
```

---

## Appendix B: Usage Examples

### Example 1: Bug Report
**Before:** "Linia nie podąża za kartą"  
**After:** "line_connection_mapping nie aktualizuje pozycji gdy przeciągam card_entity_mapping"

### Example 2: Feature Request
**Before:** "Dodaj filtr w drzewie"  
**After:** "Dodaj filter_checkbox 'Has Description' w tree_object obok 'Has PK'"

### Example 3: UI Issue
**Before:** "Przycisk usuń nie działa"  
**After:** "button_delete w row_attribute w panel_object_details nie wywołuje onDelete"

### Example 4: Enhancement
**Before:** "Potrzebuję lepszą tabelę"  
**After:** "table_requirements potrzebuje sortowania kolumn i badge_priority dla każdego row_requirement"

---

**End of Component Reference**

For questions or additions, refer to this document as the standard naming convention for InfoMapper components.
