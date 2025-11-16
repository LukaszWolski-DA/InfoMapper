"use client"

import { Dialog, DraggableDialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImInput } from "@/components/ui/im-input"
import { ImSelect } from "@/components/ui/im-select"
import { ImButton } from "@/components/ui/im-button"
import MDEditor from '@uiw/react-md-editor'

interface RequirementEditModalProps {
  // Modal state
  isOpen: boolean
  editingId: string | null
  formName: string
  formDesc: string
  formType: "Functional" | "Non-functional" | "Other"

  // Callbacks
  onModalChange: (modal: {
    isOpen: boolean
    editingId: string | null
    formName: string
    formDesc: string
    formType: "Functional" | "Non-functional" | "Other"
  }) => void
  onClose: () => void
  onSave: () => void
}

/**
 * RequirementEditModal - Globalny modal do edycji wymagań
 *
 * Wyodrębniony z RequirementsView, aby był dostępny globalnie
 * (używany w RequirementsView i MappingView przez DiagramCard)
 */
export function RequirementEditModal({
  isOpen,
  editingId,
  formName,
  formDesc,
  formType,
  onModalChange,
  onClose,
  onSave,
}: RequirementEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DraggableDialogContent className="w-[480px]" overlayClassName="bg-transparent">
        <DialogHeader>
          <DialogTitle className="dialog-drag-handle cursor-move">
            {editingId ? "Edit Requirement" : "Add Requirement"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Requirement Name</div>
            <ImInput
              value={formName}
              onChange={(e) => onModalChange({
                isOpen,
                editingId,
                formName: e.target.value,
                formDesc,
                formType,
              })}
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Requirement Description (Markdown supported)</div>
            <MDEditor
              value={formDesc}
              onChange={(val) => onModalChange({
                isOpen,
                editingId,
                formName,
                formDesc: val || "",
                formType,
              })}
              preview="edit"
              height={250}
              data-color-mode="light"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Requirement Type</div>
            <ImSelect
              value={formType}
              onChange={(e) => onModalChange({
                isOpen,
                editingId,
                formName,
                formDesc,
                formType: e.target.value as "Functional" | "Non-functional" | "Other",
              })}
            >
              <option value="Functional">Functional</option>
              <option value="Non-functional">Non-functional</option>
              <option value="Other">Other</option>
            </ImSelect>
          </div>
          <div className="flex gap-2 pt-2">
            <ImButton onClick={onSave} variant="success">Save</ImButton>
            <ImButton onClick={onClose} variant="neutral">Cancel</ImButton>
          </div>
        </div>
      </DraggableDialogContent>
    </Dialog>
  )
}
