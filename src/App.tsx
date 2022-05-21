import * as React from "react"
import { ThemeProvider } from "@emotion/react"
import firebase from "./utils/firebase"

// Helpers
import { breakpoints } from "./hooks/media"

// Context
import AuthProvider from "./context/AuthContext"
import FirebaseProvider from "./context/FirebaseContext"
import StorageProvider from "./context/StorageContext"

function ContextWrapper({ children }: React.PropsWithChildren<unknown>): any {
  return (
    <AuthProvider firebase={firebase}>
      <StorageProvider>
        <FirebaseProvider>
          <ThemeProvider
            theme={{
              breakpoints
            }}
          >
            {children}
          </ThemeProvider>
        </FirebaseProvider>
      </StorageProvider>
    </AuthProvider>
  )
}

export default ContextWrapper
