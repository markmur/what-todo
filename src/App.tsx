import * as React from "react"

// Context
import StorageProvider from "./context/StorageContext"
import { ThemeProvider } from "@emotion/react"
// Helpers
import { breakpoints } from "./hooks/media"
import ErrorBoundary from "./components/ErrorBoundary"

function ContextWrapper({
  children
}: React.PropsWithChildren<unknown>): JSX.Element {
  return (
    <ErrorBoundary>
      <StorageProvider>
        <ThemeProvider
          theme={{
            breakpoints
          }}
        >
          {children}
        </ThemeProvider>
      </StorageProvider>
    </ErrorBoundary>
  )
}

export default ContextWrapper
