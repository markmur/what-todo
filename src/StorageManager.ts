import { bytesToSize } from "./utils"
import { browser } from "webextension-polyfill-ts"
import { v4 as uuid } from "uuid"
import * as _ from "lodash-es"
import colors from "./color-palette"

// Types
import { Action, Data, Label, Task } from "./index.d"

type Item = Label
type ItemKey = "labels"

const defaultLabels: Label[] = [
  { id: uuid(), title: "Work", color: colors[0].backgroundColor },
  { id: uuid(), title: "Personal", color: colors[1].backgroundColor }
]

// Class
class StorageManager {
  defaultData: Data = {
    filters: [],
    tasks: {},
    notes: {},
    labels: defaultLabels
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

  private getTaskKey = (task: Task) => {
    return new Date(task.created_at).toDateString()
  }

  private getTodayKey = () => {
    return new Date().toDateString()
  }

  private cloneData = (data: Data): Data => {
    return { ...data }
  }

  // PUBLIC API
  async getData(): Promise<{ data: Data; usage: string; quota: string }> {
    console.groupCollapsed("GET_STORAGE_DATA")
    try {
      const data = await browser.storage.sync.get()
      // Do some data parsing here
      const parsedData = data

      const valid = this.validateData(parsedData)

      console.log(valid ? parsedData : this.defaultData)

      // Usage
      const usage = await this.getStorageUsagePercent()
      const usagePct = Number(usage * 100).toFixed(1) + "%"

      console.log("USAGE", usagePct)

      return {
        data: (valid ? parsedData : this.defaultData) as Data,
        usage: usagePct,
        quota: bytesToSize(browser.storage.sync.QUOTA_BYTES)
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError)
        throw chrome.runtime.lastError
      }

      console.groupEnd()
    }
  }

  clearAllData = (): Data => {
    this.sync(this.defaultData, "CLEAR_DATA")

    return this.defaultData
  }

  getStorageUsagePercent = async (): Promise<number> => {
    const inUse = await browser.storage.sync.getBytesInUse()
    return inUse / browser.storage.sync.QUOTA_BYTES
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
    const newTask: Task = {
      ...task,
      completed: false,
      id: uuid()
    }
    const key = this.getTaskKey(task)
    const newData = this.cloneData(data)

    _.set(newData, `tasks.${key}`, [newTask, ...(newData.tasks[key] ?? [])])

    this.sync(newData, "ADD_TASK")

    return newData
  }

  updateTask = (data: Data, task: Task): Data => {
    const newData = this.cloneData(data)
    const key = this.getTaskKey(task)

    const index = newData.tasks[key]?.findIndex(t => t.id === task.id)

    if (index > -1) {
      _.set(newData, `tasks.${key}.${index}`, task)
    }

    this.sync(newData, "UPDATE_TASK")

    return newData
  }

  removeTask = (data: Data, task: Task): Data => {
    const newData = this.cloneData(data)
    const key = this.getTaskKey(task)

    _.set(
      newData,
      `tasks.${key}`,
      newData.tasks[key].filter(t => t.id !== task.id)
    )

    this.sync(newData, "REMOVE_TASK")

    return newData
  }

  moveTaskToToday = (data: Data, task: Task): Data => {
    const oldKey = this.getTaskKey(task)
    const todayKey = this.getTodayKey()
    const newData = this.cloneData(data)

    // Remove from yesterday
    _.set(
      newData,
      `tasks.${oldKey}`,
      newData.tasks[oldKey]?.filter(t => t.id !== task.id)
    )

    const newTask = {
      ...task,
      created_at: new Date().toISOString()
    }

    const todayTasks =
      todayKey in newData.tasks
        ? [newTask, ...newData.tasks[todayKey]]
        : [newTask]

    // Add to today
    _.set(newData, `tasks.${todayKey}`, todayTasks)

    this.sync(newData, "MOVE_TASK")

    return newData
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

    const newData = this.cloneData(data)

    newData.notes[date] = note

    this.sync(newData, "UPDATE_NOTE")

    return newData
  }

  // Filters
  updateFilters = (data: Data, filters: string[]): Data => {
    const newData = this.cloneData(data)

    newData.filters = filters

    this.sync(newData, "UPDATE_FILTERS")

    return newData
  }
}

export default StorageManager
