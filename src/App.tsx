import * as React from "react"

// Context
import StorageProvider from "./context/StorageContext"
import { DarkModeProvider } from "./context/DarkModeContext"
import { SettingsProvider } from "./context/SettingsContext"

function ContextWrapper({ children }: React.PropsWithChildren<unknown>): any {
  return (
    <DarkModeProvider>
      <SettingsProvider>
        <StorageProvider>{children}</StorageProvider>
      </SettingsProvider>
    </DarkModeProvider>
  )
}

export default ContextWrapper
