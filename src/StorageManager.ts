import { browser } from "webextension-polyfill-ts"
import { v4 as uuid } from "uuid"

// Types
import { Action, Data, Label, Task } from "./index.d"
import { encrichItemWithId } from "./decorators"

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
    const newItems = [...data[key]]

    const newItem = {
      ...item,
      id: uuid()
    }

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
        console.groupCollapsed("GET_STORAGE_DATA")
        // Do some data parsing here
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError)
          console.groupEnd()
          return reject(chrome.runtime.lastError)
        }

        const valid = this.validateData(data)

        console.log(valid ? data : this.defaultData)
        console.groupEnd()
        return resolve((valid ? data : this.defaultData) as Data)
      })
    })
  }

  // Labels
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

  // Tasks
  addTask = (data: Data, task: Task): Data => {
    const newTask = {
      ...task,
      completed: false
    }
    return this.add(data, "tasks", newTask, "ADD_TASK", true)
  }

  updateTask = (data: Data, task: Task): Data => {
    return this.update(data, "tasks", task, "UPDATE_TASK")
  }

  removeTask = (data: Data, task: Task): Data => {
    return this.remove(data, "tasks", task, "REMOVE_TASK")
  }

  // Notes
  updateNote = (data: Data, note: string, date: string): Data => {
    if (note.trim().length === 0) {
      return data
    }

    if (!data) {
      return data
    }

    if (data.notes[date] && data.notes[date] === note) {
      return data
    }

    const newData = { ...data }

    newData.notes[date] = note

    this.sync(newData, "UPDATE_NOTE")

    return newData
  }
}

export default StorageManager
