"use client"

export function InstructionsView() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-12 py-10">
        {/* Header */}
        <div className="mb-10 pb-8 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Welcome to InfoMapper</h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
            InfoMapper is a Data Warehouse metadata automation tool for data modeling, source mapping,
            and DWH development. Below you'll find a description of all available views and their purposes.
          </p>
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          {/* Sources */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Sources – Source Systems</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Import metadata from source systems (databases, files, APIs). Browse the structure
              of tables, views, and columns from systems that will feed your data warehouse.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Hierarchy:</p>
              <p className="text-xs text-gray-600">System → Database → Schema → Table/View → Column</p>
              <p className="text-xs text-gray-500 mt-1">Example: HR.hrdta.dbo.employee_t.empl_id</p>
            </div>
            <p className="text-xs text-gray-600"><strong>Features:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Browse imported source metadata</li>
              <li>• Search by table/column names</li>
              <li>• Preview data types and column properties</li>
              <li>• Copy FQN (fully qualified names) paths</li>
              <li>• Apply custom tags (Business Keys, PII, etc.)</li>
            </ul>
          </div>

          {/* Object */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Object – Logical Model</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Create your logical data model. Define <strong>Concepts</strong> (logical groups),
              <strong>Entities</strong> (business objects/tables), and <strong>Attributes</strong> (columns).
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Hierarchy:</p>
              <p className="text-xs text-gray-600">Concept → Entity → Attribute</p>
              <p className="text-xs text-gray-500 mt-1">Example: Customer → Customer → customer_id</p>
            </div>
            <p className="text-xs text-gray-600"><strong>Features:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Create and edit concepts, entities, and attributes</li>
              <li>• Define primary keys (PK) and foreign keys (FK)</li>
              <li>• Mark personal identifiable information (PII)</li>
              <li>• Apply entity stereotypes (Object, Link, Dictionary, Context, Informative, custom)</li>
              <li>• Assign source column tags for data governance</li>
            </ul>
          </div>

          {/* Model */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Model – Entity Relationship Diagram</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Visualize your data model as an entity relationship diagram. Drag entities from the sidebar
              onto the diagram, connect them with relationships, and define cardinalities (1:1, 1:N, M:N).
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Relationships:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>1:1</strong> – one-to-one (e.g., Person → Passport)</li>
                <li>• <strong>1:N</strong> – one-to-many (e.g., Customer → Orders)</li>
                <li>• <strong>M:N</strong> – many-to-many (e.g., Students ↔ Courses)</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600"><strong>Features:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Drag & drop entities onto the diagram</li>
              <li>• Create relationships between entities (Bezier curves)</li>
              <li>• Edit cardinality and relationship direction (double-click)</li>
              <li>• Zoom (Ctrl + scroll), Pan (Space + drag)</li>
              <li>• Filter attributes (All / Keys)</li>
            </ul>
          </div>

          {/* Requirements */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Requirements – Business Requirements</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Manage functional and non-functional requirements. Add, edit, and track
              business requirements that must be fulfilled by your data model.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Requirement types:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>Functional</strong> – functional requirements</li>
                <li>• <strong>Non-functional</strong> – non-functional requirements</li>
                <li>• <strong>Other</strong> – other requirements</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600"><strong>Features:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Create and edit requirements</li>
              <li>• Add descriptions and categories</li>
              <li>• Link requirements to entities in Mapping view</li>
            </ul>
          </div>

          {/* Mapping */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Mapping – Data Mapping</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Visual mapping of source data to your logical model. Drag entities, sources, and requirements
              onto the diagram, then connect source attributes to target attributes.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Mapping types:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>Attribute Mapping</strong> – source attribute → entity attribute</li>
                <li>• <strong>Requirement Mapping</strong> – requirement → entity/attribute</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600"><strong>Features:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Drag & drop entities, sources, and requirements</li>
              <li>• Connect attributes with lines (click → drag → click)</li>
              <li>• Filter attributes (All / Mapped / Unmapped)</li>
              <li>• Export/Import mappings to JSON</li>
            </ul>
          </div>

          {/* Catalog */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Catalog – Data Catalog</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Tabular view of all model elements. Browse concepts, entities, attributes,
              and mappings in an organized table format.
            </p>
            <p className="text-xs text-gray-600"><strong>Features:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Sort and filter data with intelligent filter syntax</li>
              <li>• Search by names and descriptions</li>
              <li>• Configurable column visibility</li>
              <li>• Quick overview of all elements</li>
              <li>• Filter persistence across sessions</li>
            </ul>
          </div>

          {/* Settings */}
          <div className="bg-white border border-gray-200 rounded p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Settings – Configuration</h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Configure application preferences, manage entity stereotypes, source column tags,
              and data management operations.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Settings sections:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>Entity Stereotypes</strong> – customize entity classification (Object, Link, Dictionary, Context, Informative)</li>
                <li>• <strong>Source Column Tags</strong> – manage custom tags (Business Keys, PII, etc.) with color coding</li>
                <li>• <strong>Data Management</strong> – export, import, and reset application data</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600"><strong>Features:</strong></p>
            <ul className="text-xs text-gray-600 space-y-0.5 mt-1 ml-4">
              <li>• Add/edit/delete custom stereotypes with color pickers</li>
              <li>• Create custom source column tags with descriptions</li>
              <li>• Drag & drop reordering of stereotypes and tags</li>
              <li>• Export entire application state to JSON (with timestamp)</li>
              <li>• Import data with Merge or Replace modes</li>
              <li>• Reset all data with confirmation safeguard</li>
            </ul>
          </div>

          {/* Validation */}
          <div className="bg-white border border-gray-200 rounded p-5 opacity-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Validation – Model Validation
              <span className="ml-2 text-xs font-normal text-gray-500">Coming Soon</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Automatic model validation and issue detection (missing PKs, duplicates, inconsistencies).
            </p>
          </div>

          {/* Advanced Export */}
          <div className="bg-white border border-gray-200 rounded p-5 opacity-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Advanced Export – Artifact Generation
              <span className="ml-2 text-xs font-normal text-gray-500">Coming Soon</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Generate DDL scripts, ELT/ETL code, documentation, and test cases based on your model.
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Start</h3>
          <div className="bg-white border border-gray-200 rounded p-5">
            <ol className="space-y-2 text-xs text-gray-700">
              <li><strong>1. Sources:</strong> Import source metadata (if available)</li>
              <li><strong>2. Object:</strong> Create a concept and add your first entity with attributes (e.g., Customer with customer_id as PK)</li>
              <li><strong>3. Model:</strong> Drag entities onto the diagram and connect with relationships</li>
              <li><strong>4. Requirements:</strong> Add business requirements (optional)</li>
              <li><strong>5. Mapping:</strong> Map attributes from sources to your logical model</li>
              <li><strong>6. Catalog:</strong> Review the complete catalog of all elements</li>
              <li><strong>7. Settings:</strong> Configure stereotypes, tags, and export your work</li>
            </ol>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tips & Shortcuts</h3>
          <div className="bg-white border border-gray-200 rounded p-5">
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li>• <strong>Autosave:</strong> All data is automatically saved to browser localStorage</li>
              <li>• <strong>Export/Import:</strong> Use Settings → Data Management to export to JSON and import back (Merge or Replace modes)</li>
              <li>• <strong>Keyboard shortcuts:</strong> Ctrl+Scroll (zoom), Space+Drag (pan), Delete (remove selected element)</li>
              <li>• <strong>Filters:</strong> Each view has its own filters - use them to quickly find needed elements</li>
              <li>• <strong>Stereotypes:</strong> Customize entity stereotypes in Settings to match your modeling conventions</li>
              <li>• <strong>Tags:</strong> Use source column tags for data governance (PII, Business Keys, etc.)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <p>InfoMapper v1.0 • Data stored locally in browser (localStorage)</p>
        </div>
      </div>
    </div>
  )
}
