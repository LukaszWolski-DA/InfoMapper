"use client"

interface TopNavProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

  const sections = [
    { id: "instructions", label: "Instructions" },
    { id: "sources_v2", label: "Sources" },
    { id: "object_v2", label: "Object v2" },
    { id: "model_v2", label: "Model v2" },
    { id: "requirements_v2", label: "Requirements v2" },
    { id: "mapping", label: "Mapping" },
    { id: "catalog", label: "Catalog" },
    { id: "validation", label: "Validation" },
    { id: "export", label: "Export" },
    { id: "settings", label: "Settings" },
  ]

export function TopNav({ activeSection, onSectionChange }: TopNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="flex items-center h-12 px-6">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">IM</span>
          </div>
          <span className="font-semibold text-gray-900">InfoMapper</span>
        </div>
        <div className="flex items-center gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeSection === section.id ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {section.label}
              {activeSection === section.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
