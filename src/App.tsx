import * as React from "react"

import StorageProvider from "./context/StorageContext"
import { DarkModeProvider } from "./context/DarkModeContext"
import { SettingsProvider } from "./context/SettingsContext"
import { AuthProvider } from "./context/AuthContext"
import DataConflictSheet from "./components/DataConflictSheet"
import { useStorage } from "./context/StorageContext"

function ConflictHandler() {
  const { dataConflict, resolveConflict } = useStorage()
  return (
    <DataConflictSheet
      open={!!dataConflict}
      local={dataConflict?.local ?? null}
      remote={dataConflict?.remote ?? null}
      onUseRemote={() => resolveConflict("remote")}
      onMerge={() => resolveConflict("merge")}
    />
  )
}

function ContextWrapper({ children }: React.PropsWithChildren<unknown>): any {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <SettingsProvider>
          <StorageProvider>
            {children}
            <ConflictHandler />
          </StorageProvider>
        </SettingsProvider>
      </AuthProvider>
    </DarkModeProvider>
  )
}

export default ContextWrapper
