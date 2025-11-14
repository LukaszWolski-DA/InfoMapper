"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Trash2 } from "lucide-react"
import { clearAllData } from "@/lib/import-export"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function DataManagementSettings() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleResetData = async () => {
    setIsClearing(true)
    try {
      await clearAllData({
        showToast: true,
        reload: true,
      })
    } catch (error) {
      console.error("Failed to clear data:", error)
      setIsClearing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-700">
            Irreversible actions that will permanently delete your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 bg-white rounded-lg border border-red-200">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Reset All Application Data</h3>
              <p className="text-sm text-gray-600">
                This will permanently delete all your data including:
              </p>
              <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc space-y-1">
                <li>All concepts, entities, and attributes</li>
                <li>All mappings and connections</li>
                <li>All imported sources</li>
                <li>All requirements</li>
                <li>All diagram layouts and settings</li>
              </ul>
              <p className="text-sm text-red-600 font-medium mt-2">
                This action cannot be undone!
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowConfirmDialog(true)}
              disabled={isClearing}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Reset App Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action will permanently delete all your data and cannot be undone.
              </p>
              <p className="font-semibold text-red-600">
                All concepts, entities, mappings, sources, and requirements will be lost.
              </p>
              <p>
                The application will reload after clearing the data.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClearing ? "Clearing..." : "Yes, delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
