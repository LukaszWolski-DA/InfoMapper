"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EntityStereotypesSettings } from "@/components/entity-stereotypes-settings"
import { SourceColumnTagsSettings } from "@/components/source-column-tags-settings"
import { DataManagementSettings } from "@/components/data-management-settings"

export function SettingsView() {
  const [activeTab, setActiveTab] = useState("stereotypes")

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Configure entity stereotypes, source column tags, and data management
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="stereotypes">Entity Stereotypes</TabsTrigger>
              <TabsTrigger value="tags">Source Column Tags</TabsTrigger>
              <TabsTrigger value="data">Data Management</TabsTrigger>
            </TabsList>

            <TabsContent value="stereotypes" className="mt-0">
              <EntityStereotypesSettings />
            </TabsContent>

            <TabsContent value="tags" className="mt-0">
              <SourceColumnTagsSettings />
            </TabsContent>

            <TabsContent value="data" className="mt-0">
              <DataManagementSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
