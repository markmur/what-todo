import { sync } from "./decorators/sync"
import { bytesToSize } from "./utils"
import { browser } from "webextension-polyfill-ts"
import { v4 as uuid } from "uuid"
import set from "lodash-es/set"
import colors from "./color-palette"
import sizeOf from "object-sizeof"

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
  public defaultData: Data

  public interactingWithDB: boolean

  public syncQueue: Array<(data: Data, ...args: any[]) => Data>

  constructor() {
    this.defaultData = {
      filters: [],
      tasks: {},
      notes: {},
      labels: defaultLabels
    }

    this.interactingWithDB = true

    this.syncQueue = []
  }

  private async sync(newData: Data, action: Action): Promise<Data> {
    if (this.interactingWithDB) {
      console.log(`>>> BUSY. Waiting...`, { queue: this.syncQueue })
    }

    console.groupCollapsed(`Sync (${action})`)

    await browser.storage.local.set(newData)

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

  private getTaskKey(task: Task) {
    return new Date(task.created_at).toDateString()
  }

  private getTodayKey = () => {
    return new Date().toDateString()
  }

  private cloneData(data: Data): Data {
    return { ...data }
  }

  private clearAllData(): Data {
    this.sync(this.defaultData, "CLEAR_DATA")

    return this.defaultData
  }

  private setBusyState() {
    this.interactingWithDB = true
  }

  private unsetBusyState(data: Data) {
    this.interactingWithDB = false
    const unsynced = this.syncQueue.length
    while (this.syncQueue.length) {
      const cb = this.syncQueue.shift()
      console.log(cb)
      cb(data)
    }
    if (unsynced) {
      console.log(`>>> SYNC_QUEUE_CLEARED (${unsynced})`)
    }
  }

  // PUBLIC API
  async getData(): Promise<{ data: Data; usage: string; quota: string }> {
    let parsedData: Data

    this.setBusyState()
    console.groupCollapsed("GET_STORAGE_DATA")
    try {
      const data = await browser.storage.local.get()

      console.log("Clearing all sync storage data")
      await browser.storage.sync.clear()

      const valid = this.validateData(data)
      parsedData = (valid ? data : this.defaultData) as Data

      console.log(parsedData)

      // Usage
      const usage = await this.getStorageUsagePercent(parsedData)
      const usagePct = Number(usage * 100).toFixed(1) + "%"

      this.unsetBusyState(parsedData)
      return {
        data: parsedData,
        usage: usagePct,
        quota: bytesToSize(browser.storage.local.QUOTA_BYTES)
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError)
        throw chrome.runtime.lastError
      }

      console.groupEnd()

      this.unsetBusyState(parsedData)
    }
  }

  getStorageUsagePercent = async (data: Data): Promise<number> => {
    const inUse = sizeOf(data)
    return inUse / browser.storage.local.QUOTA_BYTES
  }

  uploadData = (data: Data): void => {
    this.sync(data, "UPLOAD_DATA")
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
  @sync()
  addTask(data: Data, task: Task): Data {
    const newTask: Task = {
      ...task,
      completed: false,
      id: uuid()
    }
    const key = this.getTaskKey(task)
    const newData = this.cloneData(data)

    set(newData, `tasks.${key}`, [newTask, ...(newData.tasks[key] ?? [])])

    this.sync(newData, "ADD_TASK")

    return newData
  }

  @sync()
  updateTask(data: Data, task: Task): Data {
    const newData = this.cloneData(data)
    const key = this.getTaskKey(task)

    const index = newData.tasks[key]?.findIndex(t => t.id === task.id)

    if (index > -1) {
      set(newData, `tasks.${key}.${index}`, task)
    }

    this.sync(newData, "UPDATE_TASK")

    return newData
  }

  @sync()
  removeTask(data: Data, task: Task): Data {
    const newData = this.cloneData(data)
    const key = this.getTaskKey(task)

    set(
      newData,
      `tasks.${key}`,
      newData.tasks[key].filter(t => t.id !== task.id)
    )

    this.sync(newData, "REMOVE_TASK")

    return newData
  }

  @sync()
  moveTaskToToday(data: Data, task: Task): Data {
    const oldKey = this.getTaskKey(task)
    const todayKey = this.getTodayKey()
    const newData = this.cloneData(data)

    // Remove from yesterday
    set(
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
    set(newData, `tasks.${todayKey}`, todayTasks)

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
