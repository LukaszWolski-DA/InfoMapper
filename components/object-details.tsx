"use client"

import type { Concept, LogicalAttribute, LogicalEntity } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ImButton } from "./ui/im-button"
import { ImInput } from "./ui/im-input"
import { GripVertical } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useState, useMemo, useRef } from "react"
import { useSettings } from "@/lib/use-settings"
import { getStereotypeLabel } from "@/lib/utils"

interface ObjectDetailsProps {
  selected: { type: "concept" | "entity" | "attribute"; id: string } | null
  concepts: Concept[]
  entities: LogicalEntity[]
  attributes: LogicalAttribute[]
  onUpdateConcept: (id: string, updates: Partial<Concept>) => void
  onDeleteConcept: (id: string) => void
  onUpdateEntity: (id: string, updates: Partial<LogicalEntity>) => void
  onDeleteEntity: (id: string) => void
  onCreateAttribute: (entityId: string, name?: string) => LogicalAttribute
  onRestoreAttribute: (attr: LogicalAttribute) => void
  onUpdateAttribute: (id: string, updates: Partial<LogicalAttribute>) => void
  onDeleteAttribute: (id: string) => void
}

export function ObjectDetails({ selected, concepts, entities, attributes, onUpdateConcept, onDeleteConcept, onUpdateEntity, onDeleteEntity, onCreateAttribute, onRestoreAttribute, onUpdateAttribute, onDeleteAttribute }: ObjectDetailsProps) {
  const settings = useSettings()
  const [entityViewMode, setEntityViewMode] = useState<"details" | "table">("details")
  const selectedEntityId = selected?.type === "entity" ? selected.id : null
  const entityAttributes = useMemo(() => {
    if (!selectedEntityId) return [] as LogicalAttribute[]
    return attributes.filter((a) => a.entityId === selectedEntityId)
  }, [attributes, selectedEntityId])
  const nameErrorsById = useMemo(() => {
    const errors = new Map<string, string>()
    const freq = new Map<string, number>()
    for (const a of entityAttributes) {
      const key = (a.name || "").trim().toLowerCase()
      freq.set(key, (freq.get(key) || 0) + 1)
    }
    for (const a of entityAttributes) {
      const trimmed = (a.name || "").trim()
      if (!trimmed) {
        errors.set(a.id, "Name is required")
        continue
      }
      const key = trimmed.toLowerCase()
      if (freq.get(key)! > 1) {
        errors.set(a.id, "Duplicate name in entity")
      }
    }
    return errors
  }, [entityAttributes])

  // Debounce map for attribute updates (optimistic UI already applied by state handlers)
  const debounceTimersRef = useRef<Map<string, number>>(new Map())
  const scheduleDebouncedUpdate = (attrId: string, updater: () => void, delay = 400) => {
    const timers = debounceTimersRef.current
    const existing = timers.get(attrId)
    if (existing) {
      window.clearTimeout(existing)
    }
    const handle = window.setTimeout(() => {
      try {
        updater()
      } finally {
        timers.delete(attrId)
      }
    }, delay)
    timers.set(attrId, handle)
  }
  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-1">No selection</div>
          <div className="text-sm">Wybierz Koncept, Encję albo Atrybut z lewego panelu</div>
        </div>
      </div>
    )
  }

  if (selected.type === "concept") {
    const c = concepts.find((x) => x.id === selected.id)
    if (!c) return null
    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4">Concept</h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500">ID</div>
            <div className="font-mono text-sm">{c.id}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Name</div>
            <input className="mt-1 im-filter" value={c.name} onChange={(e) => onUpdateConcept(c.id, { name: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Description</div>
            <textarea className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" style={{ height: `calc(var(--size-textarea-row) * 3)` }} value={c.description || ""} onChange={(e) => onUpdateConcept(c.id, { description: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Color</div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: c.color || '#ffffff' }} />
              <Select value={c.color || "#ffffff"} onValueChange={(val) => onUpdateConcept(c.id, { color: val })}>
                <SelectTrigger size="sm" aria-label="Select concept color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#ffffff">White</SelectItem>
                  <SelectItem value="#f43f5e">Red</SelectItem>
                  <SelectItem value="#f97316">Orange</SelectItem>
                  <SelectItem value="#f59e0b">Amber</SelectItem>
                  <SelectItem value="#84cc16">Lime</SelectItem>
                  <SelectItem value="#22c55e">Green</SelectItem>
                  <SelectItem value="#14b8a6">Teal</SelectItem>
                  <SelectItem value="#06b6d4">Cyan</SelectItem>
                  <SelectItem value="#3b82f6">Blue</SelectItem>
                  <SelectItem value="#6366f1">Indigo</SelectItem>
                  <SelectItem value="#8b5cf6">Violet</SelectItem>
                  <SelectItem value="#a855f7">Purple</SelectItem>
                  <SelectItem value="#d946ef">Fuchsia</SelectItem>
                  <SelectItem value="#ec4899">Pink</SelectItem>
                  <SelectItem value="#64748b">Slate</SelectItem>
                  <SelectItem value="#94a3b8">Gray</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-2">
            <button className="px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded hover:bg-red-50" onClick={() => onDeleteConcept(c.id)}>Delete Concept</button>
          </div>
        </div>
      </div>
    )
  }

  if (selected.type === "entity") {
    const e = entities.find((x) => x.id === selected.id)
    if (!e) return null
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Entity</h3>
          <div className="inline-flex items-center gap-2">
            <ImButton
              variant="primary"
              onClick={() => setEntityViewMode("details")}
            >
              Details
            </ImButton>
            <ImButton
              variant="primary"
              onClick={() => setEntityViewMode("table")}
            >
              Table
            </ImButton>
          </div>
        </div>
        {entityViewMode === "details" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">ID</div>
              <div className="font-mono text-sm">{e.id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Concept</div>
              <div className="text-gray-900">{concepts.find((c) => c.id === e.conceptId)?.name || e.conceptId}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <input className="mt-1 im-filter" value={e.name} onChange={(ev) => onUpdateEntity(e.id, { name: ev.target.value })} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Stereotype</div>
              <div className="mt-1">
                <Select value={e.stereotype || "object"} onValueChange={(val) => onUpdateEntity(e.id, { stereotype: val })}>
                  <SelectTrigger size="sm" aria-label="Select stereotype" className="h-[var(--size-filter-height)] text-xs">
                    <SelectValue>
                      {getStereotypeLabel(e.stereotype, settings?.entityStereotypes)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(settings?.entityStereotypes || []).map((stereotype) => (
                      <SelectItem key={stereotype.id} value={stereotype.id}>
                        {stereotype.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs text-gray-500">Description</div>
            <textarea className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" style={{ height: `calc(var(--size-textarea-row) * 3)` }} value={e.description || ""} onChange={(ev) => onUpdateEntity(e.id, { description: ev.target.value })} />
          </div>
          <div className="mt-4">
            <ImButton variant="danger" onClick={() => onDeleteEntity(e.id)}>Delete</ImButton>
          </div>
        </>
        ) : (
          <div className="mt-2">
            <div className="mb-3 text-xs text-gray-600 flex flex-wrap gap-4 items-center">
              <div>
                <span className="text-gray-500 mr-1">Id:</span>
                <span className="font-mono text-gray-900">{e.id}</span>
              </div>
              <div>
                <span className="text-gray-500 mr-1">Concept:</span>
                <span className="text-gray-900">{concepts.find((c) => c.id === e.conceptId)?.name || e.conceptId}</span>
              </div>
              <div>
                <span className="text-gray-500 mr-1">Name:</span>
                <span className="text-gray-900">{e.name}</span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[48px] text-center">No.</TableHead>
                  <TableHead className="min-w-[320px] w-[40%]">Name</TableHead>
                  <TableHead className="w-[160px]">Data Type</TableHead>
              <TableHead className="w-[80px]">PK</TableHead>
              <TableHead className="w-[80px]">FK</TableHead>
                  <TableHead className="w-[100px]">Nullable</TableHead>
                  <TableHead className="w-[80px]">PII</TableHead>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entityAttributes
                  .slice()
                  .sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || x.name.localeCompare(y.name))
                  .map((a, rowIndex) => (
                  <TableRow key={a.id}
                    className={`${rowIndex % 2 === 1 ? 'bg-gray-50' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", a.id)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const draggedId = e.dataTransfer.getData("text/plain")
                      if (!draggedId || draggedId === a.id) return
                      const list = entityAttributes.slice().sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || x.name.localeCompare(y.name))
                      const fromIndex = list.findIndex((it) => it.id === draggedId)
                      const toIndex = list.findIndex((it) => it.id === a.id)
                      if (fromIndex === -1 || toIndex === -1) return
                      const from = list[fromIndex]
                      const to = list[toIndex]
                      const fromOrder = from.order ?? fromIndex
                      const toOrder = to.order ?? toIndex
                      onUpdateAttribute(from.id, { order: toOrder })
                      onUpdateAttribute(to.id, { order: fromOrder })
                    }}
                    onKeyDown={(ev) => {
                    if (ev.key === "Delete") {
                      ev.preventDefault()
                      const deleted = a
                      onDeleteAttribute(a.id)
                      toast("Attribute deleted", {
                        action: {
                          label: "Undo",
                          onClick: () => onRestoreAttribute(deleted),
                        },
                      })
                    } else if (ev.altKey && ev.key === "ArrowUp") {
                      ev.preventDefault()
                      // move up
                      const currentOrder = a.order ?? rowIndex
                      const prevAttr = entityAttributes
                        .slice()
                        .sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || x.name.localeCompare(y.name))
                        [Math.max(0, rowIndex - 1)]
                      if (prevAttr) {
                        onUpdateAttribute(a.id, { order: (prevAttr.order ?? currentOrder - 1) })
                        onUpdateAttribute(prevAttr.id, { order: currentOrder })
                      }
                    } else if (ev.altKey && ev.key === "ArrowDown") {
                      ev.preventDefault()
                      // move down
                      const currentOrder = a.order ?? rowIndex
                      const list = entityAttributes
                        .slice()
                        .sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || x.name.localeCompare(y.name))
                      const nextAttr = list[Math.min(list.length - 1, rowIndex + 1)]
                      if (nextAttr) {
                        onUpdateAttribute(a.id, { order: (nextAttr.order ?? currentOrder + 1) })
                        onUpdateAttribute(nextAttr.id, { order: currentOrder })
                      }
                    } else if (ev.ctrlKey && ev.key.toLowerCase() === "enter") {
                      ev.preventDefault()
                      const newAttr = onCreateAttribute(e.id, "new_attribute")
                    } else if (ev.ctrlKey && ev.key.toLowerCase() === "d") {
                      ev.preventDefault()
                      const dup = onCreateAttribute(e.id, a.name)
                      onUpdateAttribute(dup.id, { dataType: a.dataType, isPrimaryKey: a.isPrimaryKey, isNullable: a.isNullable, isPII: a.isPII, description: a.description })
                    }
                  }}>
                    <TableCell className="w-[48px] text-center align-middle cursor-grab">
                      <div className="flex items-center justify-center gap-1 text-gray-500">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-xs tabular-nums">{rowIndex + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[320px] w-[40%]">
                      <input
                        className={`w-full px-2 py-1 h-8 border rounded focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 ${nameErrorsById.has(a.id) ? "border-red-300" : "border-gray-300"}`}
                        value={a.name}
                        onChange={(ev) => {
                          const value = ev.target.value
                          // optimistic local state is immediate via onUpdateAttribute
                          onUpdateAttribute(a.id, { name: value })
                          // schedule debounced no-op (kept for parity; real remote save would be here)
                          scheduleDebouncedUpdate(a.id, () => {})
                        }}
                        placeholder="Attribute name"
                        aria-invalid={nameErrorsById.has(a.id) || undefined}
                        title={nameErrorsById.get(a.id) || undefined}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") {
                            ev.preventDefault()
                            const next = document.querySelector<HTMLInputElement>(`[data-cell=Name][data-row='${rowIndex + 1}']`)
                            next?.focus()
                          } else if (ev.key === "Escape") {
                            ;(ev.target as HTMLInputElement).blur()
                          }
                        }}
                        data-cell="Name"
                        data-row={rowIndex}
                      />
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <Select value={a.dataType || "String"} onValueChange={(val) => {
                        onUpdateAttribute(a.id, { dataType: val })
                        scheduleDebouncedUpdate(a.id, () => {})
                      }}>
                        <SelectTrigger size="sm" aria-label="Select data type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="String">String</SelectItem>
                          <SelectItem value="Integer">Integer</SelectItem>
                          <SelectItem value="Decimal">Decimal</SelectItem>
                          <SelectItem value="Boolean">Boolean</SelectItem>
                          <SelectItem value="Date">Date</SelectItem>
                          <SelectItem value="JSON">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="w-[80px] text-center">
                      <input type="checkbox" checked={!!a.isPrimaryKey} onChange={(ev) => {
                        onUpdateAttribute(a.id, { isPrimaryKey: ev.target.checked })
                        scheduleDebouncedUpdate(a.id, () => {})
                      }} />
                    </TableCell>
                    <TableCell className="w-[80px] text-center">
                      <input type="checkbox" checked={!!a.isNullable} onChange={(ev) => {
                        onUpdateAttribute(a.id, { isNullable: ev.target.checked })
                        scheduleDebouncedUpdate(a.id, () => {})
                      }} />
                    </TableCell>
                    <TableCell className="w-[80px] text-center">
                      <input type="checkbox" checked={!!a.isForeignKey} onChange={(ev) => {
                        onUpdateAttribute(a.id, { isForeignKey: ev.target.checked })
                        scheduleDebouncedUpdate(a.id, () => {})
                      }} />
                    </TableCell>
                    <TableCell className="w-[80px] text-center">
                      <input type="checkbox" checked={!!a.isPII} onChange={(ev) => {
                        onUpdateAttribute(a.id, { isPII: ev.target.checked })
                        scheduleDebouncedUpdate(a.id, () => {})
                      }} />
                    </TableCell>
                    <TableCell className="w-[40%]">
                      <Dialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger className="w-full text-left">
                              <div className="text-gray-700 whitespace-nowrap truncate min-h-[34px] px-2 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
                                {a.description ? (a.description.length > 150 ? a.description.slice(0, 150) + "…" : a.description) : <span className="text-gray-400">Add description…</span>}
                              </div>
                            </DialogTrigger>
                          </TooltipTrigger>
                          {a.description && (
                            <TooltipContent sideOffset={6}>{a.description}</TooltipContent>
                          )}
                        </Tooltip>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Description</DialogTitle>
                          </DialogHeader>
                          <textarea
                            className="w-full h-[240px] resize-y px-3 py-2 border border-gray-300 rounded-md"
                            value={a.description || ""}
                            onChange={(ev) => {
                              onUpdateAttribute(a.id, { description: ev.target.value })
                              scheduleDebouncedUpdate(a.id, () => {})
                            }}
                            placeholder="Enter detailed description"
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="w-[100px] text-right">
                      <ImButton variant="danger" onClick={() => onDeleteAttribute(a.id)}>Delete</ImButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  const a = attributes.find((x) => x.id === selected.id)
  if (!a) return null
  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4">Attribute</h3>
      <div className="grid grid-cols-2 gap-4 items-start">
        <div>
          <div className="text-xs text-gray-500">ID</div>
          <div className="font-mono text-sm">{a.id}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Entity</div>
          <div className="text-gray-900">{entities.find((e) => e.id === a.entityId)?.name || a.entityId}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Name</div>
          <ImInput className="mt-1" value={a.name} onChange={(ev) => onUpdateAttribute(a.id, { name: ev.target.value })} />
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-4">
            <div className="min-w-[200px]">
              <div className="text-xs text-gray-500">Data Type</div>
              <div className="mt-1">
                <Select value={a.dataType || "String"} onValueChange={(val) => onUpdateAttribute(a.id, { dataType: val })}>
                  <SelectTrigger size="sm" aria-label="Select data type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="String">String</SelectItem>
                    <SelectItem value="Integer">Integer</SelectItem>
                    <SelectItem value="Decimal">Decimal</SelectItem>
                    <SelectItem value="Boolean">Boolean</SelectItem>
                    <SelectItem value="Date">Date</SelectItem>
                    <SelectItem value="JSON">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!a.isPrimaryKey} onChange={(ev) => onUpdateAttribute(a.id, { isPrimaryKey: ev.target.checked })} /> Primary Key
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!a.isForeignKey} onChange={(ev) => onUpdateAttribute(a.id, { isForeignKey: ev.target.checked })} /> Foreign Key
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!a.isNullable} onChange={(ev) => onUpdateAttribute(a.id, { isNullable: ev.target.checked })} /> Nullable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!a.isPII} onChange={(ev) => onUpdateAttribute(a.id, { isPII: ev.target.checked })} /> PII
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs text-gray-500">Description</div>
        <textarea className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" value={a.description || ""} onChange={(ev) => onUpdateAttribute(a.id, { description: ev.target.value })} />
      </div>
      <div className="mt-4">
        <button className="px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded hover:bg-red-50" onClick={() => onDeleteAttribute(a.id)}>Delete Attribute</button>
      </div>
    </div>
  )
}


