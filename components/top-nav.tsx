"use client"

import type { ViewType } from "@/app/router/view-router"

interface TopNavProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

  const sections: Array<{ id: ViewType; label: string }> = [
    { id: "instructions", label: "Instructions" },
    { id: "sources", label: "Sources" },
    { id: "object", label: "Object" },
    { id: "model", label: "Model" },
    { id: "requirements", label: "Requirements" },
    { id: "mapping", label: "Mapping" },
    { id: "catalog", label: "Catalog" },
    { id: "documentation", label: "Documentation" },
    { id: "settings", label: "Settings" },
  ]

export function TopNav({ activeView, onViewChange }: TopNavProps) {
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
              onClick={() => onViewChange(section.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeView === section.id ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {section.label}
              {activeView === section.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
