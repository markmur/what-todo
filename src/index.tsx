import * as React from "react"
import * as ReactDOM from "react-dom"
import { browser } from "webextension-polyfill-ts"
import { ThemeProvider } from "@emotion/react"
import theme from "@rebass/preset"

// Helpers
import { v4 as uuid } from "uuid"
import colors from "./color-palette"

// Components
import Todo from "./components/Todo"

// Types
import { Label, Task, Data, Note } from "./index.d"
import StorageManager from "./StorageManager"

const defaultLabels: Label[] = [
  { id: uuid(), title: "Work", color: colors[0].backgroundColor },
  { id: uuid(), title: "Personal", color: colors[1].backgroundColor }
]

const defaultData: Data = {
  tasks: [],
  notes: {},
  labels: defaultLabels
}

const storage = new StorageManager(defaultData)

const App = () => {
  const [data, setData] = React.useState<Data>(defaultData)

  React.useEffect(() => {
    storage.getData().then(setData)
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

  // Callbacks for labels
  const handleAddLabel = createAction<Label>(storage.addLabel)
  const handleRemoveLabel = createAction<Label>(storage.removeLabel)
  const handleUpdateLabel = createAction<Label>(storage.updateLabel)

  // Callbacks for notes
  const handleUpdateNote = createAction<Note>(storage.updateNote)

  const labelsById = storage.getLabelsById(data)

  return (
    <ThemeProvider
      theme={{
        breakpoints: ["40em", "52em", "64em"]
      }}
    >
      <Todo
        data={data}
        labelsById={labelsById}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
        onRemoveTask={handleRemoveTask}
        onMarkAsComplete={handleUpdateTask}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
        onUpdateLabel={handleUpdateLabel}
        onUpdateNote={handleUpdateNote}
      />
    </ThemeProvider>
  )
}

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(<App />, document.getElementById("todo"))
})
