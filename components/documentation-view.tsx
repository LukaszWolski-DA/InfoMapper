"use client"

import { useEffect, useState } from "react"
import type { Concept, LogicalEntity, LogicalAttribute, Requirement, Connection, Relationship, DiagramItem } from "@/lib/types"
import { getDocumentationViewPrefs, setDocumentationViewPrefs } from "@/lib/ui-prefs"
import { ImButton } from "./ui/im-button"
import { FileText, Download, Copy } from "lucide-react"
import { toast } from "sonner"
import { generateMarkdown } from "@/lib/generators/markdown-generator"
import { generateHTML } from "@/lib/generators/html-generator"
import { generateERDSvg } from "@/lib/generators/svg-erd-generator"

interface DocumentationViewProps {
  concepts: Concept[]
  logicalEntities: LogicalEntity[]
  logicalAttributes: LogicalAttribute[]
  requirements: Requirement[]
  connections: Connection[]
  modelRelationships: Relationship[]
  modelItems: DiagramItem[]
}

interface DocumentationSections {
  executiveSummary: boolean
  entityDefinitions: boolean
  attributes: boolean
  sourceMappings: boolean
  relationships: boolean
  requirements: boolean
  diagrams: boolean
}

export function DocumentationView({
  concepts,
  logicalEntities,
  logicalAttributes,
  requirements,
  connections,
  modelRelationships,
  modelItems,
}: DocumentationViewProps) {
  // UI state
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true)
  const [leftPanelWidth, setLeftPanelWidth] = useState(340)

  // Selection state
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(() => {
    const prefs = getDocumentationViewPrefs()
    return new Set(prefs.selectedConcepts || [])
  })

  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(() => {
    const prefs = getDocumentationViewPrefs()
    return new Set(prefs.selectedEntities || [])
  })

  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(() => {
    const prefs = getDocumentationViewPrefs()
    return new Set(prefs.selectedRequirements || [])
  })

  const [openConceptIds, setOpenConceptIds] = useState<Set<string>>(() => {
    const prefs = getDocumentationViewPrefs()
    return new Set(prefs.openConceptIds || [])
  })

  // Section toggles
  const [sections, setSections] = useState<DocumentationSections>(() => {
    const prefs = getDocumentationViewPrefs()
    return {
      executiveSummary: prefs.sections?.executiveSummary ?? true,
      entityDefinitions: prefs.sections?.entityDefinitions ?? true,
      attributes: prefs.sections?.attributes ?? true,
      sourceMappings: prefs.sections?.sourceMappings ?? true,
      relationships: prefs.sections?.relationships ?? true,
      requirements: prefs.sections?.requirements ?? true,
      diagrams: prefs.sections?.diagrams ?? true,
    }
  })

  const [format, setFormat] = useState<'markdown' | 'html'>(() => {
    const prefs = getDocumentationViewPrefs()
    return prefs.format || 'markdown'
  })

  // Load UI preferences
  useEffect(() => {
    const prefs = getDocumentationViewPrefs()
    if (typeof prefs.isLeftPanelVisible === 'boolean') {
      setIsLeftPanelVisible(prefs.isLeftPanelVisible)
    }
    if (typeof prefs.leftPanelWidth === 'number') {
      setLeftPanelWidth(prefs.leftPanelWidth)
    }
  }, [])

  // Persist UI state
  useEffect(() => {
    setDocumentationViewPrefs({
      isLeftPanelVisible,
      leftPanelWidth,
      selectedConcepts: Array.from(selectedConcepts),
      selectedEntities: Array.from(selectedEntities),
      selectedRequirements: Array.from(selectedRequirements),
      openConceptIds: Array.from(openConceptIds),
      sections,
      format,
    })
  }, [isLeftPanelVisible, leftPanelWidth, selectedConcepts, selectedEntities, selectedRequirements, openConceptIds, sections, format])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault()
        setIsLeftPanelVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Toggle concept selection (auto-selects child entities)
  const toggleConcept = (conceptId: string) => {
    const newSelected = new Set(selectedConcepts)
    const newSelectedEntities = new Set(selectedEntities)

    if (newSelected.has(conceptId)) {
      newSelected.delete(conceptId)
      // Don't auto-deselect entities - allow independent selection
    } else {
      newSelected.add(conceptId)
      // Auto-select all child entities
      const childEntities = logicalEntities.filter(e => e.conceptId === conceptId)
      childEntities.forEach(e => newSelectedEntities.add(e.id))
    }

    setSelectedConcepts(newSelected)
    setSelectedEntities(newSelectedEntities)
  }

  // Toggle entity selection
  const toggleEntity = (entityId: string) => {
    const newSelected = new Set(selectedEntities)
    if (newSelected.has(entityId)) {
      newSelected.delete(entityId)
    } else {
      newSelected.add(entityId)
    }
    setSelectedEntities(newSelected)
  }

  // Toggle requirement selection
  const toggleRequirement = (reqId: string) => {
    const newSelected = new Set(selectedRequirements)
    if (newSelected.has(reqId)) {
      newSelected.delete(reqId)
    } else {
      newSelected.add(reqId)
    }
    setSelectedRequirements(newSelected)
  }

  // Toggle section
  const toggleSection = (section: keyof DocumentationSections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Select/clear all
  const selectAll = () => {
    setSelectedConcepts(new Set(concepts.map(c => c.id)))
    setSelectedEntities(new Set(logicalEntities.map(e => e.id)))
    setSelectedRequirements(new Set(requirements.map(r => r.id)))
  }

  const clearAll = () => {
    setSelectedConcepts(new Set())
    setSelectedEntities(new Set())
    setSelectedRequirements(new Set())
  }

  // Export handlers
  const handleDownload = () => {
    if (selectedEntities.size === 0) {
      toast.error("Please select at least one entity")
      return
    }

    try {
      // Prepare scope and data
      const scope = {
        selectedEntityIds: Array.from(selectedEntities),
        selectedRequirementIds: Array.from(selectedRequirements),
        sections,
      }

      const data = {
        concepts,
        entities: logicalEntities,
        attributes: logicalAttributes,
        requirements,
        connections,
        relationships: modelRelationships,
      }

      // Generate ERD if diagrams section is enabled
      let erdSvg: string | undefined
      if (sections.diagrams) {
        const selectedEntitiesData = logicalEntities.filter(e => selectedEntities.has(e.id))
        erdSvg = generateERDSvg(
          selectedEntitiesData,
          logicalAttributes,
          modelRelationships,
          modelItems
        )
      }

      // Generate documentation
      let content: string
      let filename: string
      let mimeType: string

      if (format === 'markdown') {
        content = generateMarkdown(scope, data, erdSvg)
        filename = 'documentation.md'
        mimeType = 'text/markdown'
      } else {
        content = generateHTML(scope, data, erdSvg)
        filename = 'documentation.html'
        mimeType = 'text/html'
      }

      // Download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Documentation downloaded as ${filename}`)
    } catch (error) {
      console.error('Error generating documentation:', error)
      toast.error('Failed to generate documentation')
    }
  }

  const handleCopyToClipboard = async () => {
    if (selectedEntities.size === 0) {
      toast.error("Please select at least one entity")
      return
    }

    try {
      // Prepare scope and data
      const scope = {
        selectedEntityIds: Array.from(selectedEntities),
        selectedRequirementIds: Array.from(selectedRequirements),
        sections,
      }

      const data = {
        concepts,
        entities: logicalEntities,
        attributes: logicalAttributes,
        requirements,
        connections,
        relationships: modelRelationships,
      }

      // Generate ERD if diagrams section is enabled
      let erdSvg: string | undefined
      if (sections.diagrams) {
        const selectedEntitiesData = logicalEntities.filter(e => selectedEntities.has(e.id))
        erdSvg = generateERDSvg(
          selectedEntitiesData,
          logicalAttributes,
          modelRelationships,
          modelItems
        )
      }

      // Always copy as Markdown (more compatible with various tools)
      const content = generateMarkdown(scope, data, erdSvg)

      await navigator.clipboard.writeText(content)
      toast.success('Documentation copied to clipboard')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const selectedEntityCount = selectedEntities.size
  const selectedRequirementCount = selectedRequirements.size
  const hasSelection = selectedEntityCount > 0

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900">Documentation Generator</h1>
          <div className="text-sm text-gray-500">
            {selectedEntityCount > 0 && `${selectedEntityCount} entities selected`}
            {selectedRequirementCount > 0 && `, ${selectedRequirementCount} requirements`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Format selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setFormat('markdown')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                format === 'markdown'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Markdown
            </button>
            <button
              onClick={() => setFormat('html')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                format === 'html'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              HTML
            </button>
          </div>

          {/* Export buttons */}
          <ImButton
            onClick={handleDownload}
            disabled={!hasSelection}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </ImButton>

          <ImButton
            onClick={handleCopyToClipboard}
            disabled={!hasSelection}
            variant="neutral"
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </ImButton>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Scope selector */}
        {isLeftPanelVisible && (
          <div
            className="bg-white border-r border-gray-200 flex flex-col overflow-hidden"
            style={{ width: leftPanelWidth }}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Select Scope</h2>

              {/* Quick actions */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Selection summary */}
              <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">
                Selected: {selectedEntityCount} entities, {selectedRequirementCount} requirements
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Concepts tree - Placeholder */}
              <div className="space-y-1 mb-4">
                <div className="text-xs font-semibold text-gray-700 mb-2">Concepts</div>
                {concepts.map(concept => {
                  const childEntities = logicalEntities.filter(e => e.conceptId === concept.id)
                  const isOpen = openConceptIds.has(concept.id)
                  const isSelected = selectedConcepts.has(concept.id)

                  return (
                    <div key={concept.id}>
                      <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50">
                        <button
                          onClick={() => {
                            const newOpen = new Set(openConceptIds)
                            if (isOpen) {
                              newOpen.delete(concept.id)
                            } else {
                              newOpen.add(concept.id)
                            }
                            setOpenConceptIds(newOpen)
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isOpen ? '▼' : '▶'}
                        </button>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleConcept(concept.id)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700 flex-1">{concept.name}</span>
                        <span className="text-xs text-gray-400">({childEntities.length})</span>
                      </div>

                      {isOpen && (
                        <div className="ml-6 space-y-1 mt-1">
                          {childEntities.map(entity => (
                            <div key={entity.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedEntities.has(entity.id)}
                                onChange={() => toggleEntity(entity.id)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-600">{entity.name}</span>
                              {entity.stereotype && (
                                <span className="text-xs text-gray-400">({entity.stereotype})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Requirements list */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-700 mb-2">Requirements</div>
                {requirements.slice(0, 10).map(req => (
                  <div key={req.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedRequirements.has(req.id)}
                      onChange={() => toggleRequirement(req.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600 truncate flex-1" title={req.name}>
                      REQ-{req.displayId}: {req.name}
                    </span>
                  </div>
                ))}
                {requirements.length > 10 && (
                  <div className="text-xs text-gray-400 px-2">
                    ...and {requirements.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main area - Section toggles and preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Section toggles */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Sections to Include</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({
                executiveSummary: 'Executive Summary',
                entityDefinitions: 'Entity Definitions',
                attributes: 'Attributes (detailed)',
                sourceMappings: 'Source Mappings',
                relationships: 'Relationships',
                requirements: 'Requirements',
                diagrams: 'Diagrams (ERD)',
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded px-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sections[key as keyof DocumentationSections]}
                    onChange={() => toggleSection(key as keyof DocumentationSections)}
                    className="rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Preview area (placeholder) */}
          <div className="flex-1 overflow-y-auto p-6">
            {!hasSelection ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select at least one entity to generate documentation</p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview</h3>
                  <p className="text-sm text-gray-600">
                    Documentation preview will appear here once generation is implemented.
                  </p>
                  <div className="mt-4 text-xs text-gray-500 space-y-1">
                    <div>• Selected entities: {selectedEntityCount}</div>
                    <div>• Selected requirements: {selectedRequirementCount}</div>
                    <div>• Format: {format.toUpperCase()}</div>
                    <div>• Sections enabled: {Object.values(sections).filter(Boolean).length}/7</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
