import { Data, Filters, Label, Section, SectionData, Task } from "../index.d"
import React, { PropsWithChildren, useCallback, useRef, useState } from "react"

import StorageManager from "../StorageManager"
import { StorageAdapter } from "../adapters/StorageAdapter"
import { LocalStorageAdapter } from "../adapters/LocalStorageAdapter"
import { AppSupabaseAdapter } from "../adapters/AppSupabaseAdapter"
import { SupabaseStorageAdapter } from "../adapters/SupabaseStorageAdapter"
import { DebouncedAdapter, SyncStatus } from "../adapters/DebouncedAdapter"
import { migrateData } from "../adapters/migrateData"
import { mergeData } from "../adapters/mergeData"
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig
} from "../adapters/supabaseConfig"
import { useAuth } from "./AuthContext"

function createInitialAdapter(): StorageAdapter {
  const config = getSupabaseConfig()
  if (config) {
    try {
      return new DebouncedAdapter(
        new SupabaseStorageAdapter(config.url, config.anonKey)
      )
    } catch {
      clearSupabaseConfig()
    }
  }
  return new LocalStorageAdapter()
}

interface Storage {
  data: Data
  labelsById: Record<string, Label>
  storage: StorageManager
  sections?: Record<Section, SectionData>
  fetchData: () => void
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  removeTask: (task: Task) => void
  markAsComplete: (task: Task) => void
  moveToToday: (task: Task) => void
  addLabel: (label: Label) => void
  updateLabel: (label: Label) => void
  removeLabel: (label: Label) => void
  updateFilters: (filters: Filters) => void
  updateSection: (key: Section, data: SectionData) => void
  updateSections: (updates: Record<string, SectionData>) => void
  uploadData: (data: Data) => void
  isSupabaseConnected: boolean
  syncStatus: SyncStatus
  lastSyncedAt: Date | null
  connectSupabase: (url: string, anonKey: string) => Promise<void>
  disconnectSupabase: () => Promise<void>
  dataConflict: { local: Data; remote: Data } | null
  resolveConflict: (choice: "remote" | "merge") => void
}

const noop = () => undefined

const defaultStorage = new StorageManager(new LocalStorageAdapter())

export const StorageContext = React.createContext<Storage>({
  data: defaultStorage.defaultData,
  labelsById: {},
  sections: defaultStorage.defaultData.sections,
  storage: defaultStorage,
  fetchData: noop,
  addTask: noop,
  updateTask: noop,
  removeTask: noop,
  markAsComplete: noop,
  moveToToday: noop,
  addLabel: noop,
  updateLabel: noop,
  removeLabel: noop,
  updateFilters: noop,
  uploadData: noop,
  updateSection: noop,
  updateSections: noop,
  isSupabaseConnected: false,
  syncStatus: "idle",
  lastSyncedAt: null,
  connectSupabase: () => Promise.resolve(),
  disconnectSupabase: () => Promise.resolve(),
  dataConflict: null,
  resolveConflict: noop
})

function StorageProvider({
  children
}: PropsWithChildren<unknown>): React.ReactNode {
  const { isAuthenticated } = useAuth()

  const storageRef = useRef<StorageManager | null>(null)
  const initialAdapterRef = useRef<StorageAdapter | null>(null)
  if (!storageRef.current) {
    const adapter = createInitialAdapter()
    initialAdapterRef.current = adapter
    storageRef.current = new StorageManager(adapter)
  }
  const storage = storageRef.current

  const [data, setDataFn] = React.useState<Data>(storage.defaultData)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(
    () => getSupabaseConfig() !== null
  )
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [dataConflict, setDataConflict] = useState<{
    local: Data
    remote: Data
    adapter: AppSupabaseAdapter
  } | null>(null)

  const attachSyncListener = useCallback((adapter: DebouncedAdapter) => {
    adapter.onSyncChange((status, syncedAt) => {
      setSyncStatus(status)
      if (syncedAt) setLastSyncedAt(syncedAt)
    })
  }, [])

  React.useEffect(() => {
    const adapter = initialAdapterRef.current
    if (adapter instanceof DebouncedAdapter) {
      attachSyncListener(adapter)
    }
  }, [attachSyncListener])

  function setData(data: Data) {
    setDataFn(data)
  }

  const fetchData = useCallback(() => {
    storage.getData().then(({ data }) => {
      setData(data)
    })
  }, [storage])

  const dataRef = React.useRef(data)
  dataRef.current = data

  // Switch adapter when auth state changes.
  // Custom Supabase (Layer 2) takes priority — only switch to AppSupabaseAdapter
  // if the user hasn't connected their own project.
  React.useEffect(() => {
    if (getSupabaseConfig()) return

    if (isAuthenticated) {
      const appAdapter = new AppSupabaseAdapter()
      const newAdapter = new DebouncedAdapter(appAdapter)
      attachSyncListener(newAdapter)

      const localAdapter = new LocalStorageAdapter()

      Promise.all([localAdapter.get(), appAdapter.get()]).then(
        ([local, remote]) => {
          const hasLocal =
            local && Object.values(local.tasks ?? {}).flat().length > 0
          const hasRemote =
            remote && Object.values(remote.tasks ?? {}).flat().length > 0

          if (hasLocal && hasRemote) {
            // Both have data — let the user decide
            setDataConflict({ local, remote, adapter: appAdapter })
            storage.setAdapter(newAdapter)
            fetchData()
          } else if (hasLocal && !hasRemote) {
            // Only local data — migrate it up
            migrateData(localAdapter, appAdapter).finally(() => {
              storage.setAdapter(newAdapter)
              fetchData()
            })
          } else {
            // No local data or only remote — just switch
            storage.setAdapter(newAdapter)
            fetchData()
          }
        }
      )
    } else {
      storage.setAdapter(new LocalStorageAdapter())
      setSyncStatus("idle")
      setLastSyncedAt(null)
      setDataConflict(null)
      fetchData()
    }
  }, [isAuthenticated, attachSyncListener, storage, fetchData])

  const resolveConflict = useCallback(
    (choice: "remote" | "merge") => {
      if (!dataConflict) return
      const { local, remote, adapter } = dataConflict
      const resolved = choice === "merge" ? mergeData(local, remote) : remote
      adapter.set(resolved).then(() => {
        new LocalStorageAdapter().clear()
        setDataConflict(null)
        fetchData()
      })
    },
    [dataConflict, fetchData]
  )

  const connectSupabase = async (url: string, anonKey: string) => {
    const rawAdapter = new SupabaseStorageAdapter(url, anonKey)
    if (rawAdapter.testConnection) {
      await rawAdapter.testConnection()
    }

    const currentAdapter = new LocalStorageAdapter()
    await migrateData(currentAdapter, rawAdapter)

    const newAdapter = new DebouncedAdapter(rawAdapter)
    attachSyncListener(newAdapter)

    setSupabaseConfig({ url, anonKey })
    storage.setAdapter(newAdapter)
    setIsSupabaseConnected(true)

    fetchData()
  }

  const disconnectSupabase = async () => {
    const localAdapter = new LocalStorageAdapter()
    await localAdapter.set(data)

    clearSupabaseConfig()
    storage.setAdapter(localAdapter)
    setIsSupabaseConnected(false)
    setSyncStatus("idle")
    setLastSyncedAt(null)

    fetchData()
  }

  function useAction<A, B = any>(
    fn: (data: Data, dataType: A, otherType?: B) => Data
  ) {
    return useCallback(
      (dataType: A, otherType?: B) => {
        const newData = fn.call(storage, dataRef.current, dataType, otherType)

        if (typeof newData === "undefined") {
          throw new Error("Trying to update storage data with undefined")
        }

        dataRef.current = newData
        setData(newData)
      },
      [fn]
    )
  }

  const addTask = useAction<Task>(storage.addTask)
  const updateTask = useAction<Task>(storage.updateTask)
  const removeTask = useAction<Task>(storage.removeTask)
  const moveToToday = useAction<Task>(storage.moveTaskToToday)

  const addLabel = useAction<Label>(storage.addLabel)
  const removeLabel = useAction<Label>(storage.removeLabel)
  const updateLabel = useAction<Label>(storage.updateLabel)

  const updateFilters = useAction<Filters>(storage.updateFilters)

  const updateSection = useAction<Section, any>(storage.updateSection)
  const updateSections = useAction<Record<string, SectionData>>(
    storage.updateSections
  )

  const labelsById = storage.getLabelsById(data)

  const api: Storage = {
    addLabel,
    addTask: addTask.bind(storage),
    data,
    fetchData,
    labelsById,
    markAsComplete: updateTask,
    moveToToday,
    removeLabel,
    removeTask,
    storage,
    sections: data.sections,
    updateFilters,
    updateLabel,
    updateTask,
    updateSection,
    updateSections,
    uploadData: storage.uploadData,
    isSupabaseConnected,
    syncStatus,
    lastSyncedAt,
    connectSupabase,
    disconnectSupabase,
    dataConflict: dataConflict
      ? { local: dataConflict.local, remote: dataConflict.remote }
      : null,
    resolveConflict
  }

  return (
    <StorageContext.Provider value={api}>{children}</StorageContext.Provider>
  )
}

export function useStorage(): Storage {
  const context = React.useContext(StorageContext)

  if (context == null) {
    throw new Error("Missing StorageContext")
  }

  return context
}

export default StorageProvider
