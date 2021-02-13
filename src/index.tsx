import * as React from "react"
import * as ReactDOM from "react-dom"
import { browser } from "webextension-polyfill-ts"
import { ThemeProvider } from "@emotion/react"
import Tooltip from "react-tooltip"

// Helpers
import { breakpoints } from "./hooks/media"

// Components
import Todo from "./components/Todo"

// Types
import { Label, Task, Data, Filters } from "./index.d"
import StorageManager from "./StorageManager"
import { getPastSevenDays } from "./utils"

const storage = new StorageManager()

export const DataContext = React.createContext<{
  data: Data
  usage: string
  quota: string
}>({
  data: storage.defaultData,
  usage: "0%",
  quota: "0"
})

const App = () => {
  const [data, setData] = React.useState<Data>(storage.defaultData)
  const [dataUsage, setDataUsage] = React.useState<{
    usage: string
    quota: string
  }>({
    usage: "0%",
    quota: "0"
  })

  const fetchData = () => {
    storage.getData().then(({ data, usage, quota }) => {
      setData(data)
      setDataUsage({ usage, quota })
    })
  }

  React.useEffect(() => {
    fetchData()

    window.addEventListener("focus", fetchData)

    return () => {
      window.removeEventListener("focus", fetchData)
    }
  }, [])

  function createAction<T>(fn: (data: Data, dataType: T) => Data) {
    return React.useCallback(
      (item: T) => {
        const newData = fn(data, item)

        setData(newData)
      },
      [data]
    )
  }

  // Callbacks for tasks
  const handleAddTask = createAction<Task>(storage.addTask)
  const handleUpdateTask = createAction<Task>(storage.updateTask)
  const handleRemoveTask = createAction<Task>(storage.removeTask)
  const handleMoveToToday = createAction<Task>(storage.moveTaskToToday)

  // Callbacks for labels
  const handleAddLabel = createAction<Label>(storage.addLabel)
  const handleRemoveLabel = createAction<Label>(storage.removeLabel)
  const handleUpdateLabel = createAction<Label>(storage.updateLabel)

  // Callbacks for filters
  const handleUpdateFilters = createAction<Filters>(storage.updateFilters)

  // Callbacks for notes
  const handleUpdateNote = React.useCallback(
    (note, date) => {
      const newData = storage.updateNote(data, note, date)
      setData(newData)
    },
    [data]
  )

  const labelsById = storage.getLabelsById(data)
  const pastWeek = getPastSevenDays()

  return (
    <DataContext.Provider value={{ data, ...dataUsage }}>
      <ThemeProvider
        theme={{
          breakpoints
        }}
      >
        <Todo
          data={data}
          pastWeek={pastWeek}
          labelsById={labelsById}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onRemoveTask={handleRemoveTask}
          onMarkAsComplete={handleUpdateTask}
          onMoveToToday={handleMoveToToday}
          onAddLabel={handleAddLabel}
          onRemoveLabel={handleRemoveLabel}
          onUpdateLabel={handleUpdateLabel}
          onUpdateNote={handleUpdateNote}
          onUpdateFilters={handleUpdateFilters}
        />
      </ThemeProvider>

      <Tooltip
        multiline={false}
        place="top"
        effect="solid"
        type="dark"
        backgroundColor="black"
      />
    </DataContext.Provider>
  )
}

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(<App />, document.getElementById("todo"))
})
