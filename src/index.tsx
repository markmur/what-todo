import * as React from "react"
import * as ReactDOM from "react-dom"
import { browser } from "webextension-polyfill-ts"
import { ThemeProvider } from "@emotion/react"
import Tooltip from "react-tooltip"

// Helpers
import { v4 as uuid } from "uuid"
import colors from "./color-palette"

// Components
import Todo from "./components/Todo"

// Types
import { Label, Task, Data } from "./index.d"
import StorageManager from "./StorageManager"
import { getPastSevenDays } from "./utils"
import { clearInterval } from "timers"

const defaultLabels: Label[] = [
  { id: uuid(), title: "Work", color: colors[0].backgroundColor },
  { id: uuid(), title: "Personal", color: colors[1].backgroundColor }
]

const defaultData: Data = {
  tasks: {},
  notes: {},
  labels: defaultLabels
}

export const DataContext = React.createContext<Data>(defaultData)

const storage = new StorageManager(defaultData)

const App = () => {
  const [data, setData] = React.useState<Data>(defaultData)

  const fetchData = () => {
    storage.getData().then(setData)
  }

  React.useEffect(() => {
    fetchData()

    // Fetch data every 30mins
    const interval = setInterval(fetchData, 1000 * 60 * 30)
    window.addEventListener("focus", fetchData)

    return () => {
      window.removeEventListener("focus", fetchData)
      clearTimeout(interval)
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
    <DataContext.Provider value={data}>
      <ThemeProvider
        theme={{
          breakpoints: ["40em", "52em", "64em"]
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
