"use client"

import { useEffect, useState } from "react"
import { getObjectState, subscribe } from "@/lib/store"
import type { EntityStereotypeConfig } from "@/lib/types"
import {
  addEntityStereotype,
  updateEntityStereotype,
  deleteEntityStereotype,
  reorderEntityStereotypes,
} from "@/lib/commands"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, GripVertical, Check, X, Pencil } from "lucide-react"
import { toast } from "sonner"

const AVAILABLE_COLORS = [
  { label: "Blue", value: "bg-blue-50 border-blue-200 text-blue-900" },
  { label: "Purple", value: "bg-purple-50 border-purple-200 text-purple-900" },
  { label: "Green", value: "bg-green-50 border-green-200 text-green-900" },
  { label: "Orange", value: "bg-orange-50 border-orange-200 text-orange-900" },
  { label: "Red", value: "bg-red-50 border-red-200 text-red-900" },
  { label: "Yellow", value: "bg-yellow-50 border-yellow-200 text-yellow-900" },
  { label: "Pink", value: "bg-pink-50 border-pink-200 text-pink-900" },
  { label: "Indigo", value: "bg-indigo-50 border-indigo-200 text-indigo-900" },
  { label: "Gray", value: "bg-gray-50 border-gray-200 text-gray-900" },
]

export function EntityStereotypesSettings() {
  const [stereotypes, setStereotypes] = useState<EntityStereotypeConfig[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<EntityStereotypeConfig>>({})

  useEffect(() => {
    const state = getObjectState()
    setStereotypes([...state.settings.entityStereotypes].sort((a, b) => a.order - b.order))

    const unsub = subscribe(() => {
      const s = getObjectState()
      setStereotypes([...s.settings.entityStereotypes].sort((a, b) => a.order - b.order))
    })

    return () => unsub()
  }, [])

  const handleAdd = () => {
    const maxOrder = stereotypes.length > 0 ? Math.max(...stereotypes.map((s) => s.order)) : 0
    const newStereotype: EntityStereotypeConfig = {
      id: `custom_${Date.now()}`,
      label: "New Stereotype",
      color: AVAILABLE_COLORS[0].value,
      isDefault: false,
      order: maxOrder + 1,
    }
    addEntityStereotype(newStereotype)
    toast.success("Stereotype added")
  }

  const handleDelete = (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error("Cannot delete default stereotypes")
      return
    }
    deleteEntityStereotype(id)
    toast.success("Stereotype deleted")
  }

  const startEdit = (stereotype: EntityStereotypeConfig) => {
    setEditingId(stereotype.id)
    setEditForm({ ...stereotype })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = () => {
    if (!editingId || !editForm.label?.trim()) {
      toast.error("Label is required")
      return
    }

    updateEntityStereotype(editingId, editForm)
    toast.success("Stereotype updated")
    setEditingId(null)
    setEditForm({})
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const updated = [...stereotypes]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }))
    reorderEntityStereotypes(reordered)
  }

  const moveDown = (index: number) => {
    if (index === stereotypes.length - 1) return
    const updated = [...stereotypes]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }))
    reorderEntityStereotypes(reordered)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Entity Stereotypes</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage entity types used in your logical data model
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Stereotype
        </Button>
      </div>

      <div className="space-y-3">
        {stereotypes.map((stereotype, index) => (
          <div
            key={stereotype.id}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            {/* Drag handle */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === stereotypes.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </div>

            {editingId === stereotype.id ? (
              <>
                {/* Edit mode */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Label</Label>
                    <Input
                      value={editForm.label || ""}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Color</Label>
                    <select
                      value={editForm.color || ""}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="h-9 mt-1 w-full rounded-md border border-gray-300 px-3 text-sm"
                    >
                      {AVAILABLE_COLORS.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveEdit} size="sm" variant="default">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* View mode */}
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{stereotype.label}</span>
                      {stereotype.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">ID: {stereotype.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Preview:</span>
                    <div
                      className={`px-3 py-1 rounded border text-xs font-medium ${stereotype.color || AVAILABLE_COLORS[0].value}`}
                    >
                      {stereotype.label}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => startEdit(stereotype)} size="sm" variant="outline">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!stereotype.isDefault && (
                    <Button
                      onClick={() => handleDelete(stereotype.id, stereotype.isDefault)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {stereotypes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No stereotypes configured</p>
          <p className="text-sm mt-1">Click "Add Stereotype" to create one</p>
        </div>
      )}
    </div>
  )
}
