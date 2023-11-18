import {
  Data,
  Filters,
  Label,
  Note,
  Section,
  SectionData,
  Task
} from "../index.d"
import React, { PropsWithChildren, useCallback } from "react"

import StorageManager from "../StorageManager"

const storage = new StorageManager()

interface Storage {
  data: Data
  labelsById: Record<string, Label>
  storage: typeof storage
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
  updateNote: (note: Note, date: string) => void
  updateFilters: (filters: Filters) => void
  updateSection: (key: Section, data: SectionData) => void
  uploadData: typeof storage.uploadData
}

const noop = () => undefined

export const StorageContext = React.createContext<Storage>({
  data: storage.defaultData,
  labelsById: {},
  sections: storage.defaultData.sections,
  storage,
  fetchData: noop,
  addTask: noop,
  updateTask: noop,
  removeTask: noop,
  markAsComplete: noop,
  moveToToday: noop,
  addLabel: noop,
  updateLabel: noop,
  removeLabel: noop,
  updateNote: noop,
  updateFilters: noop,
  uploadData: noop,
  updateSection: noop
})

function StorageProvider({ children }: PropsWithChildren<unknown>): any {
  const [data, setDataFn] = React.useState<Data>(storage.defaultData)

  function setData(data: Data) {
    setDataFn(data)
  }

  const fetchData = () => {
    storage.getData().then(({ data }) => {
      setData(data)
    })
  }

  function useAction<A, B = any>(
    fn: (data: Data, dataType: A, otherType?: B) => Data
  ) {
    return useCallback(
      (dataType: A, otherType?: B) => {
        const newData = fn.call(storage, data, dataType, otherType)

        if (typeof newData === "undefined") {
          throw new Error("Trying to update storage data with undefined")
        }

        setData(newData)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fn, data]
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

  // Callbacks for secctions
  const updateSection = useAction<Section, any>(storage.updateSection)

  // Callbacks for notes
  const updateNote = React.useCallback(
    (note: Note, date: string) => {
      const newData = storage.updateNote(data, note, date)
      setData(newData)
    },
    [data]
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
    updateNote,
    updateTask,
    updateSection,
    uploadData: storage.uploadData
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
