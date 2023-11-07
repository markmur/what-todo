import * as React from "react"

// Context
import StorageProvider from "./context/StorageContext"
import { ThemeProvider } from "@emotion/react"
// Helpers
import { breakpoints } from "./hooks/media"

function ContextWrapper({ children }: React.PropsWithChildren<unknown>): any {
  return (
    <StorageProvider>
      <ThemeProvider
        theme={{
          breakpoints
        }}
      >
        {children}
      </ThemeProvider>
    </StorageProvider>
  )
}

export default ContextWrapper
