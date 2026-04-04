import * as React from "react"

// Context
import StorageProvider from "./context/StorageContext"
import { DarkModeProvider } from "./context/DarkModeContext"
import { SettingsProvider } from "./context/SettingsContext"
import { ThemeProvider } from "@emotion/react"
// Helpers
import { breakpoints } from "./hooks/media"

function ContextWrapper({ children }: React.PropsWithChildren<unknown>): any {
  return (
    <DarkModeProvider>
      <SettingsProvider>
      <StorageProvider>
        <ThemeProvider
          theme={{
            breakpoints
          }}
        >
          {children}
        </ThemeProvider>
      </StorageProvider>
      </SettingsProvider>
    </DarkModeProvider>
  )
}

export default ContextWrapper
