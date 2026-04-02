import { Data, Filters, Label, Section, SectionData, Task } from "../index.d"
import React, { PropsWithChildren, useCallback, useRef, useState } from "react"

import StorageManager from "../StorageManager"
import { StorageAdapter } from "../adapters/StorageAdapter"
import { LocalStorageAdapter } from "../adapters/LocalStorageAdapter"
import { SupabaseStorageAdapter } from "../adapters/SupabaseStorageAdapter"
import { DebouncedAdapter, SyncStatus } from "../adapters/DebouncedAdapter"
import { migrateData } from "../adapters/migrateData"
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig
} from "../adapters/supabaseConfig"

function createInitialAdapter(): StorageAdapter {
  const config = getSupabaseConfig()
  if (config) {
    try {
      return new DebouncedAdapter(
        new SupabaseStorageAdapter(config.url, config.anonKey)
      )
    } catch {
      // Invalid stored config — fall back to localStorage
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
  disconnectSupabase: () => Promise.resolve()
})

function StorageProvider({
  children
}: PropsWithChildren<unknown>): React.ReactNode {
  // Lazy-init: create the adapter and StorageManager once on first render
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

  const attachSyncListener = useCallback((adapter: DebouncedAdapter) => {
    adapter.onSyncChange((status, syncedAt) => {
      setSyncStatus(status)
      if (syncedAt) setLastSyncedAt(syncedAt)
    })
  }, [])

  // Attach listener to the initial adapter if it's debounced (Supabase)
  React.useEffect(() => {
    const adapter = initialAdapterRef.current
    if (adapter instanceof DebouncedAdapter) {
      attachSyncListener(adapter)
    }
  }, [attachSyncListener])

  function setData(data: Data) {
    setDataFn(data)
  }

  const fetchData = () => {
    storage.getData().then(({ data }) => {
      setData(data)
    })
  }

  const dataRef = React.useRef(data)
  dataRef.current = data

  const connectSupabase = async (url: string, anonKey: string) => {
    // Create and test the new adapter
    const rawAdapter = new SupabaseStorageAdapter(url, anonKey)
    if (rawAdapter.testConnection) {
      await rawAdapter.testConnection()
    }

    // Migrate from current local data to Supabase
    const currentAdapter = new LocalStorageAdapter()
    await migrateData(currentAdapter, rawAdapter)

    // Wrap in debounced adapter to coalesce rapid writes
    const newAdapter = new DebouncedAdapter(rawAdapter)
    attachSyncListener(newAdapter)

    // Persist config and swap — only after migration succeeds
    setSupabaseConfig({ url, anonKey })
    storage.setAdapter(newAdapter)
    setIsSupabaseConnected(true)

    // Reload data from the new adapter
    fetchData()
  }

  const disconnectSupabase = async () => {
    const localAdapter = new LocalStorageAdapter()

    // Copy current Supabase data to localStorage before disconnecting
    const currentData = data
    await localAdapter.set(currentData)

    clearSupabaseConfig()
    storage.setAdapter(localAdapter)
    setIsSupabaseConnected(false)
    setSyncStatus("idle")
    setLastSyncedAt(null)

    // Refresh UI from the local adapter
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

  // Callbacks for tasks
  const addTask = useAction<Task>(storage.addTask)
  const updateTask = useAction<Task>(storage.updateTask)
  const removeTask = useAction<Task>(storage.removeTask)
  const moveToToday = useAction<Task>(storage.moveTaskToToday)

  // Callbacks for labels
  const addLabel = useAction<Label>(storage.addLabel)
  const removeLabel = useAction<Label>(storage.removeLabel)
  const updateLabel = useAction<Label>(storage.updateLabel)

  // Callbacks for filters
  const updateFilters = useAction<Filters>(storage.updateFilters)

  // Callbacks for sections
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
    disconnectSupabase
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
