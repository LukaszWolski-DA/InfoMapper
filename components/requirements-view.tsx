"use client"

import { useEffect, useMemo, useState } from "react"
import { addRequirement, deleteRequirement, updateRequirement } from "@/lib/commands"
import { getObjectState, subscribe } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImInput } from "@/components/ui/im-input"
import { ImSelect } from "@/components/ui/im-select"
import { ImButton } from "@/components/ui/im-button"

interface RequirementRow {
  id: string
  name: string
  description?: string
  type?: "Functional" | "Non-functional" | "Other"
  displayId: number
}

export function RequirementsView() {
  const [items, setItems] = useState<RequirementRow[]>(getObjectState().requirements as any)
  const [filter, setFilter] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formType, setFormType] = useState<"Functional" | "Non-functional" | "Other">("Functional")
  const [viewDescId, setViewDescId] = useState<string | null>(null)

  // Subskrybuj store
  useEffect(() => {
    const unsub = subscribe(() => {
      setItems((getObjectState().requirements as any) || [])
    })
    return () => unsub()
  }, [])
  // Uwaga: zapis/emit realizujemy tylko w handlerach Add/Edit/Remove,
  // aby uniknąć pętli aktualizacji. Tu nie zapisujemy nic na zmianę items.

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    return items.filter((r) => r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q))
  }, [items, filter])

  const openCreate = () => {
    setEditingId(null)
    setFormName("")
    setFormDesc("")
    setFormType("Functional")
    setIsFormOpen(true)
  }

  const openEdit = (row: RequirementRow) => {
    setEditingId(row.id)
    setFormName(row.name)
    setFormDesc(row.description || "")
    setFormType(row.type || "Functional")
    setIsFormOpen(true)
  }

  const saveForm = () => {
    const name = formName.trim()
    if (!name) return
    if (editingId) {
      updateRequirement(editingId, { name, description: formDesc, type: formType })
    } else {
      addRequirement(name, formType, formDesc)
    }
    setIsFormOpen(false)
  }

  const removeRequirement = (id: string) => {
    deleteRequirement(id)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImInput value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter requirements..." />
          <span className="text-xs text-gray-500">Items: {filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <ImButton variant="primary" onClick={openCreate}>Add</ImButton>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Requirement" : "Add Requirement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Requirement Name</div>
              <ImInput value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Requirement Description</div>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" style={{ height: `calc(var(--size-textarea-row) * 3)` }} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Requirement Type</div>
              <ImSelect value={formType} onChange={(e) => setFormType(e.target.value as any)}>
                <option value="Functional">Functional</option>
                <option value="Non-functional">Non-functional</option>
                <option value="Other">Other</option>
              </ImSelect>
            </div>
            <div className="flex gap-2 pt-2">
              <ImButton onClick={saveForm} variant="success">Save</ImButton>
              <ImButton onClick={() => setIsFormOpen(false)} variant="neutral">Cancel</ImButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-auto">
        <table className="im-table">
          <thead className="im-thead">
            <tr>
              <th className="im-th">REQ_ID</th>
              <th className="im-th">Requirement Name</th>
              <th className="im-th">Requirement Description</th>
              <th className="im-th">Requirement Type</th>
              <th className="im-th"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => (
              <tr
                key={r.id}
                className={idx % 2 === 1 ? "bg-gray-50" : ""}
                draggable
                onDragStart={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest("button") || target.closest("a") || target.closest("[role='button']")) {
                    e.preventDefault()
                    return
                  }
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ type: "requirement", itemId: r.id, itemType: "requirement", name: r.name }),
                  )
                  e.dataTransfer.effectAllowed = "copyMove"
                }}
              >
                <td className="im-td font-mono text-gray-700">{r.displayId}</td>
                <td className="im-td text-gray-900">{r.name}</td>
                <td className="im-td text-gray-700">
                  <Dialog open={viewDescId === r.id} onOpenChange={(o) => setViewDescId(o ? r.id : null)}>
                    <DialogTrigger asChild>
                      <button className="text-left text-xs px-2 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50">
                        {(r.description || "").length > 300 ? (r.description || "").slice(0, 300) + "…" : (r.description || "")}
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{r.name}</DialogTitle>
                      </DialogHeader>
                      <div className="text-sm whitespace-pre-wrap">{r.description || ""}</div>
                    </DialogContent>
                  </Dialog>
                </td>
                <td className="im-td">{r.type || "Functional"}</td>
                <td className="im-td">
                  <div className="flex items-center gap-2">
                    <ImButton
                      variant="primary"
                      draggable={false}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(r)
                      }}
                    >
                      Edit
                    </ImButton>
                    <ImButton
                      variant="danger"
                      draggable={false}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRequirement(r.id)
                      }}
                    >
                      Remove
                    </ImButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


