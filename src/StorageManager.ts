import { browser } from "webextension-polyfill-ts"
import { v4 as uuid } from "uuid"

// Types
import { Action, Data, Label, Task } from "./index.d"

type Item = Task | Label
type ItemKey = "tasks" | "labels"

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

  private add(
    data: Data,
    key: ItemKey,
    item: Item,
    action: Action,
    addToStart = false
  ) {
    const newItem = {
      ...item,
      id: uuid()
    }

    const newItems = [...data[key]]

    if (addToStart) {
      newItems.unshift(newItem)
    } else {
      newItems.push(newItem)
    }

    const newData = {
      ...data,
      [key]: newItems
    }

    this.sync(newData, action)

    return newData
  }

  private remove(data: Data, key: ItemKey, item: Item, action: Action) {
    const newItems = (data[key] as Item[]).filter((x: Item) => x.id !== item.id)

    const newData = {
      ...data,
      [key]: newItems
    }

    this.sync(newData, action)

    return newData
  }

  private update(data: Data, key: ItemKey, item: Item, action: Action) {
    const newItems = [...data[key]]

    for (let i = 0; i < newItems.length; i++) {
      if (newItems[i].id === item.id) {
        newItems[i] = item
      }
    }

    const newData = {
      ...data,
      [key]: newItems
    }

    this.sync(newData, action)

    return newData
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

  addLabel = (data: Data, label: Label): Data => {
    return this.add(data, "labels", label, "ADD_LABEL")
  }

  updateLabel = (data: Data, label: Label): Data => {
    return this.update(data, "labels", label, "UPDATE_LABEL")
  }

  removeLabel = (data: Data, label: Label): Data => {
    return this.remove(data, "labels", label, "REMOVE_LABEL")
  }

  addTask = (data: Data, task: Task): Data => {
    return this.add(data, "tasks", task, "ADD_TASK", true)
  }

  updateTask = (data: Data, task: Task): Data => {
    return this.update(data, "tasks", task, "UPDATE_TASK")
  }

  removeTask = (data: Data, task: Task): Data => {
    return this.remove(data, "tasks", task, "REMOVE_TASK")
  }
}

export default StorageManager
