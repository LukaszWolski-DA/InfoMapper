import { useEffect, useState } from "react"
import { getObjectState, subscribe } from "./store"
import type { SettingsConfig } from "./store"

/**
 * Hook to access settings from global store
 * Automatically subscribes to settings changes
 */
export function useSettings(): SettingsConfig {
  const [settings, setSettings] = useState<SettingsConfig>(getObjectState().settings)

  useEffect(() => {
    const unsub = subscribe(() => {
      setSettings(getObjectState().settings)
    })
    return () => unsub()
  }, [])

  return settings
}
