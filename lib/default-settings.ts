import type { EntityStereotypeConfig, SourceColumnTagConfig } from "./types"

export const DEFAULT_ENTITY_STEREOTYPES: EntityStereotypeConfig[] = [
  {
    id: "object",
    label: "Object",
    color: "bg-blue-50 border-blue-200 text-blue-900",
    isDefault: true,
    order: 1
  },
  {
    id: "link",
    label: "Link",
    color: "bg-purple-50 border-purple-200 text-purple-900",
    isDefault: true,
    order: 2
  },
  {
    id: "dictionary",
    label: "Dictionary",
    color: "bg-green-50 border-green-200 text-green-900",
    isDefault: true,
    order: 3
  },
  {
    id: "context",
    label: "Context",
    color: "bg-orange-50 border-orange-200 text-orange-900",
    isDefault: true,
    order: 4
  },
  {
    id: "informative",
    label: "Informative",
    color: "bg-gray-50 border-gray-200 text-gray-900",
    isDefault: true,
    order: 5
  },
]

export const DEFAULT_SOURCE_COLUMN_TAGS: SourceColumnTagConfig[] = [
  {
    id: "BusinessKey",
    label: "BK",
    description: "Business Key - unique identifier from business perspective",
    color: "bg-blue-100 text-blue-800",
    borderColor: "border-blue-200",
    isDefault: true,
    order: 1
  },
  {
    id: "LinkBusinessKey",
    label: "LBK",
    description: "Link Business Key - business key in link tables",
    color: "bg-purple-100 text-purple-800",
    borderColor: "border-purple-200",
    isDefault: true,
    order: 2
  },
  {
    id: "ChildKey",
    label: "CK",
    description: "Child Key - key in child/dependent tables",
    color: "bg-green-100 text-green-800",
    borderColor: "border-green-200",
    isDefault: true,
    order: 3
  },
  {
    id: "DictionaryKey",
    label: "DK",
    description: "Dictionary Key - key in dictionary/lookup tables",
    color: "bg-orange-100 text-orange-800",
    borderColor: "border-orange-200",
    isDefault: true,
    order: 4
  },
  {
    id: "DictionaryChildKey",
    label: "DCK",
    description: "Dictionary Child Key - child key in dictionary tables",
    color: "bg-yellow-100 text-yellow-800",
    borderColor: "border-yellow-200",
    isDefault: true,
    order: 5
  },
  {
    id: "PIIAttribute",
    label: "PII",
    description: "Personally Identifiable Information - sensitive data",
    color: "bg-red-100 text-red-800",
    borderColor: "border-red-200",
    isDefault: true,
    order: 6
  },
]

export function getDefaultSettings() {
  return {
    entityStereotypes: DEFAULT_ENTITY_STEREOTYPES,
    sourceColumnTags: DEFAULT_SOURCE_COLUMN_TAGS,
  }
}
