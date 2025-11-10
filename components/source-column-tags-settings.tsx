"use client"

import { useEffect, useState } from "react"
import { getObjectState, subscribe } from "@/lib/store"
import type { SourceColumnTagConfig } from "@/lib/types"
import {
  addSourceColumnTag,
  updateSourceColumnTag,
  deleteSourceColumnTag,
  reorderSourceColumnTags,
} from "@/lib/commands"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, GripVertical, Check, X, Pencil } from "lucide-react"
import { toast } from "sonner"

const AVAILABLE_COLOR_SCHEMES = [
  { label: "Blue", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  { label: "Purple", bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  { label: "Green", bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  { label: "Orange", bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  { label: "Red", bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  { label: "Yellow", bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  { label: "Pink", bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
  { label: "Indigo", bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" },
  { label: "Gray", bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" },
  { label: "Teal", bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" },
]

export function SourceColumnTagsSettings() {
  const [tags, setTags] = useState<SourceColumnTagConfig[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<SourceColumnTagConfig>>({})

  useEffect(() => {
    const state = getObjectState()
    setTags([...state.settings.sourceColumnTags].sort((a, b) => a.order - b.order))

    const unsub = subscribe(() => {
      const s = getObjectState()
      setTags([...s.settings.sourceColumnTags].sort((a, b) => a.order - b.order))
    })

    return () => unsub()
  }, [])

  const handleAdd = () => {
    const maxOrder = tags.length > 0 ? Math.max(...tags.map((t) => t.order)) : 0
    const newTag: SourceColumnTagConfig = {
      id: `CustomTag_${Date.now()}`,
      label: "CT",
      description: "Custom Tag",
      color: `${AVAILABLE_COLOR_SCHEMES[0].bg} ${AVAILABLE_COLOR_SCHEMES[0].text}`,
      borderColor: AVAILABLE_COLOR_SCHEMES[0].border,
      isDefault: false,
      order: maxOrder + 1,
    }
    addSourceColumnTag(newTag)
    toast.success("Tag added")
  }

  const handleDelete = (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error("Cannot delete default tags")
      return
    }
    deleteSourceColumnTag(id)
    toast.success("Tag deleted")
  }

  const startEdit = (tag: SourceColumnTagConfig) => {
    setEditingId(tag.id)
    setEditForm({ ...tag })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = () => {
    if (!editingId || !editForm.label?.trim() || !editForm.id?.trim()) {
      toast.error("ID and Label are required")
      return
    }

    updateSourceColumnTag(editingId, editForm)
    toast.success("Tag updated")
    setEditingId(null)
    setEditForm({})
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const updated = [...tags]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    const reordered = updated.map((t, i) => ({ ...t, order: i + 1 }))
    reorderSourceColumnTags(reordered)
  }

  const moveDown = (index: number) => {
    if (index === tags.length - 1) return
    const updated = [...tags]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    const reordered = updated.map((t, i) => ({ ...t, order: i + 1 }))
    reorderSourceColumnTags(reordered)
  }

  const handleColorSchemeChange = (scheme: typeof AVAILABLE_COLOR_SCHEMES[0]) => {
    setEditForm({
      ...editForm,
      color: `${scheme.bg} ${scheme.text}`,
      borderColor: scheme.border,
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Source Column Tags</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage tags for source column metadata (Business Keys, PII, etc.)
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      <div className="space-y-3">
        {tags.map((tag, index) => (
          <div
            key={tag.id}
            className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            {/* Drag handle */}
            <div className="flex flex-col gap-1 pt-2">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === tags.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </div>

            {editingId === tag.id ? (
              <>
                {/* Edit mode */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">ID</Label>
                      <Input
                        value={editForm.id || ""}
                        onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
                        className="h-9 mt-1"
                        disabled={tag.isDefault}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Label (Badge Text)</Label>
                      <Input
                        value={editForm.label || ""}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        className="h-9 mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Description</Label>
                    <Textarea
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="mt-1 h-20 resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">Color Scheme</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {AVAILABLE_COLOR_SCHEMES.map((scheme) => (
                        <button
                          key={scheme.label}
                          onClick={() => handleColorSchemeChange(scheme)}
                          className={`px-3 py-2 rounded border text-xs font-medium ${scheme.bg} ${scheme.text} ${scheme.border} hover:opacity-80 transition-opacity`}
                        >
                          {scheme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Preview:</span>
                    <span
                      className={`px-2 py-1 rounded border text-xs font-medium ${editForm.color} ${editForm.borderColor}`}
                    >
                      {editForm.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
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
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">{tag.id}</span>
                    {tag.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        Default
                      </span>
                    )}
                  </div>
                  {tag.description && (
                    <p className="text-sm text-gray-600 mb-3">{tag.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Preview:</span>
                    <span
                      className={`px-2 py-1 rounded border text-xs font-medium ${tag.color} ${tag.borderColor}`}
                    >
                      {tag.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => startEdit(tag)} size="sm" variant="outline">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!tag.isDefault && (
                    <Button
                      onClick={() => handleDelete(tag.id, tag.isDefault)}
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

      {tags.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No tags configured</p>
          <p className="text-sm mt-1">Click "Add Tag" to create one</p>
        </div>
      )}
    </div>
  )
}
