import React, { PropsWithChildren } from "react"
import StorageManager from "../StorageManager"
import { Data, Note, Task, Label, Filters } from "../index.d"

const storage = new StorageManager()

interface Storage {
  data: Data
  labelsById: Record<string, Label>
  storage: typeof storage
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
  uploadData: typeof storage.uploadData
}

const noop = () => undefined

export const StorageContext = React.createContext<Storage>({
  data: storage.defaultData,
  labelsById: {},
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
  uploadData: noop
})

function StorageProvider({ children }: PropsWithChildren<unknown>): any {
  const [data, setData] = React.useState<Data>(storage.defaultData)

  const fetchData = () => {
    storage.getData().then(({ data }) => {
      setData(data)
    })
  }

  function createAction<T>(fn: (data: Data, dataType: T) => Data) {
    return React.useCallback(
      (item: T) => {
        const newData = fn.call(storage, data, item)

        setData(newData)
      },
      [data]
    )
  }

  // Callbacks for tasks
  const addTask = createAction<Task>(storage.addTask)
  const updateTask = createAction<Task>(storage.updateTask)
  const removeTask = createAction<Task>(storage.removeTask)
  const moveToToday = createAction<Task>(storage.moveTaskToToday)

  // Callbacks for labels
  const addLabel = createAction<Label>(storage.addLabel)
  const removeLabel = createAction<Label>(storage.removeLabel)
  const updateLabel = createAction<Label>(storage.updateLabel)

  // Callbacks for filters
  const updateFilters = createAction<Filters>(storage.updateFilters)

  // Callbacks for notes
  const updateNote = React.useCallback(
    (note, date) => {
      const newData = storage.updateNote(data, note, date)
      setData(newData)
    },
    [data]
  )

  const labelsById = storage.getLabelsById(data)

  const api = {
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
    updateFilters,
    updateLabel,
    updateNote,
    updateTask,
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
