import * as React from "react"
import * as ReactDOM from "react-dom"
import { browser } from "webextension-polyfill-ts"

// Helpers
import { v4 as uuid } from "uuid"
import colors from "./color-palette"

// Components
import Todo from "./components/Todo"

// Types
import { Label, Task, Data } from "./index.d"
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
  const handleTaskChange = createAction<Task>(storage.updateTask)
  const handleRemoveTask = createAction<Task>(storage.removeTask)

  // Callbacks for labels
  const handleAddLabel = createAction<Label>(storage.addLabel)
  const handleRemoveLabel = createAction<Label>(storage.removeLabel)
  const handleUpdateLabel = createAction<Label>(storage.updateLabel)

  const labelsById = storage.getLabelsById(data)

  return (
    <Todo
      data={data}
      labelsById={labelsById}
      onAddTask={handleAddTask}
      onRemoveTask={handleRemoveTask}
      onMarkAsComplete={handleTaskChange}
      onAddLabel={handleAddLabel}
      onRemoveLabel={handleRemoveLabel}
      onUpdateLabel={handleUpdateLabel}
    />
  )
}

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(<App />, document.getElementById("todo"))
})
