import * as React from "react"

// Context
import StorageProvider from "./context/StorageContext"
import { DarkModeProvider } from "./context/DarkModeContext"
import { ThemeProvider } from "@emotion/react"
// Helpers
import { breakpoints } from "./hooks/media"

function ContextWrapper({ children }: React.PropsWithChildren<unknown>): any {
  return (
    <DarkModeProvider>
      <StorageProvider>
        <ThemeProvider
          theme={{
            breakpoints
          }}
        >
          {children}
        </ThemeProvider>
      </StorageProvider>
    </DarkModeProvider>
  )
}

export default ContextWrapper
