import React, { createContext, useContext, useCallback, useState } from "react"
import type { Settings } from "../index.d"

const STORAGE_KEY = "what-todo-settings"

const defaultSettings: Settings = {
  defaultLabelId: null,
  sortBy: "pinned",
  compactMode: false,
  undoOnDelete: true,
  labelStyle: "circle"
}

interface SettingsContextValue {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSetting: () => {}
})

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch {}
  return defaultSettings
}

export function SettingsProvider({ children }: React.PropsWithChildren) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings(prev => {
        const next = { ...prev, [key]: value }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    []
  )

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
