import { browser } from "webextension-polyfill-ts"
import { v4 as uuid } from "uuid"

// Types
import { Action, Data, Label, IntermediateLabel, Task } from "./index.d"

// Class
class StorageManager {
  defaultData: Data

  constructor(defaultData?: Data) {
    this.defaultData = defaultData
  }

  private async sync(newData: Data, action: Action): Promise<Data> {
    console.groupCollapsed(`Sync (${action})`)

    await browser.storage.sync.set(newData)

    console.debug("Sync successful")
    console.debug(action, newData)
    console.groupEnd()
    return newData
  }

  private validateData(data: Record<string, any>): boolean {
    return Object.keys(data).length > 0
  }

  // PUBLIC API
  getData(): Promise<Data> {
    return new Promise((resolve, reject) => {
      browser.storage.sync.get().then(data => {
        // Do some data parsing here
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError)
        }

        const valid = this.validateData(data)

        return resolve((valid ? data : this.defaultData) as Data)
      })
    })
  }

  getLabelsById(data: Data): Record<string, Label> {
    return data.labels.reduce((state, label) => {
      state[label.id] = label
      return state
    }, {})
  }

  addLabel = (data: Data, label: IntermediateLabel): Data => {
    const newLabel: Label = {
      ...label,
      id: uuid()
    }

    const newData = {
      ...data,
      labels: [...data.labels, newLabel]
    }

    this.sync(newData, "ADD_LABEL")

    return newData
  }

  updateLabel = (data: Data, label: Label): Data => {
    const newLabels = [...data.labels]

    for (let i = 0; i < newLabels.length; i++) {
      if (newLabels[i].id === label.id) {
        newLabels[i] = label
      }
    }

    const newData = {
      ...data,
      labels: newLabels
    }

    this.sync(newData, "UPDATE_LABEL")

    return newData
  }

  removeLabel = (data: Data, label: Label): Data => {
    const newLabels = data.labels.filter(l => l.id !== label.id)

    const newData = {
      ...data,
      labels: newLabels
    }

    this.sync(newData, "REMOVE_LABEL")

    return newData
  }

  addTask = (data: Data, task: Task): Data => {
    const newTask: Task = {
      ...task,
      id: uuid()
    }

    // add it to the top of the list
    const newData = {
      ...data,
      tasks: [newTask, ...data.tasks]
    }

    console.log(this)
    this.sync(newData, "ADD_TASK")

    return newData
  }

  updateTask = (data: Data, task: Task): Data => {
    const newTasks = [...data.tasks]

    for (let i = 0; i < newTasks.length; i++) {
      if (newTasks[i].id === task.id) {
        newTasks[i] = task
      }
    }

    const newData = {
      ...data,
      tasks: newTasks
    }

    this.sync(newData, "UPDATE_TASK")

    return newData
  }

  removeTask = (data: Data, task: Task): Data => {
    const newTasks = data.tasks.filter(t => t.id !== task.id)

    const newData = {
      ...data,
      tasks: newTasks
    }

    this.sync(newData, "REMOVE_TASK")

    return newData
  }
}

export default StorageManager
