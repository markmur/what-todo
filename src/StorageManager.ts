import { sync } from "./decorators/sync"
import { bytesToSize } from "./utils"
// import { browser } from "webextension-polyfill-ts"
import { v4 as uuid } from "uuid"
import set from "lodash-es/set"
import colors from "./color-palette"
import sizeOf from "object-sizeof"

// Types
import { Action, Data, Label, Task } from "./index.d"

type Item = Label
type ItemKey = "labels"

const isObj = (val: any) => {
  return typeof val === "object" && val !== null && !Array.isArray(val)
}

const defaultLabels: Label[] = [
  { id: uuid(), title: "Work", color: colors[0].backgroundColor },
  { id: uuid(), title: "Personal", color: colors[1].backgroundColor }
]

interface Browser {
  storage: {
    sync: {
      get: () => any
      clear: () => void
    }
    local: {
      set: (data: any) => void
      get: () => any
    }
  }
}

const defaultData = {
  migrated: true,
  filters: [],
  tasks: {},
  notes: {},
  labels: defaultLabels
}

const browser: Browser = {
  storage: {
    sync: {
      get: () => ({}),
      clear: () => undefined
    },
    local: {
      set: data => localStorage.setItem("what-todo", JSON.stringify(data)),
      get: () =>
        JSON.parse(
          localStorage.getItem("what-todo") || JSON.stringify(defaultData)
        )
    }
  }
}

// Class
class StorageManager {
  public defaultData: Data = defaultData

  public busy = false

  public syncQueue: Array<(data: Data, ...args: any[]) => Data> = []

  private subscriptions: Array<(data: Data) => void> = []

  private async sync(newData: Data, action: Action): Promise<Data> {
    if (this.busy && this.syncQueue.length) {
      console.log(`>>> BUSY. Waiting...`, { queue: this.syncQueue })
    }

    console.group(`Sync (${action})`)

    console.time("sync")
    await browser.storage.local.set(newData)
    console.timeEnd("sync")

    console.time("emit subscriptions")
    this.subscriptions.forEach(fn => {
      if (typeof fn === "function") {
        fn(newData)
      }
    })
    console.timeEnd("emit subscriptions")

    console.debug(action, newData)
    console.groupEnd()
    return newData
  }

  private validateData(data: Record<string, any>): boolean {
    const hasData = Object.keys(data).length > 0

    return hasData
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

  private getTaskKey(task: Task): string {
    return new Date(task.created_at).toDateString()
  }

  private getTodayKey(): string {
    return new Date().toDateString()
  }

  private getDateString(): string {
    return new Date().toISOString()
  }

  private cloneData(data: Data): Data {
    return { ...data }
  }

  private clearAllData(): Data {
    this.sync(this.defaultData, "CLEAR_DATA")

    return this.defaultData
  }

  private async clearLegacyData() {
    console.log("Clearing all legacy sync storage data")
    try {
      await browser.storage.sync.clear()
    } catch {}
  }

  private setBusyState() {
    this.busy = true
  }

  private unsetBusyState(data: Data) {
    this.busy = false
    const unsynced = this.syncQueue.length
    while (this.syncQueue.length) {
      this.syncQueue.shift()(data)
    }
    if (unsynced) {
      console.log(`>>> SYNC_QUEUE_CLEARED (${unsynced})`)
    }
  }

  private validateSyncData(data: any): Data {
    if (typeof data !== "object" || Array.isArray(data) || !data) {
      return this.defaultData
    }

    if (Object.keys(data).length === 0) {
      return this.defaultData
    }

    const returnValue: Data = data

    // Validate filters
    if (!Array.isArray(data.filters)) {
      returnValue.filters = this.defaultData.filters
    }

    // Validate labels
    if (!Array.isArray(data.labels)) {
      returnValue.labels = this.defaultData.labels
    }

    // Validate notes
    if (!isObj(data.notes)) {
      returnValue.notes = this.defaultData.notes
    }

    // Validate tasks
    if (!isObj(data.tasks)) {
      returnValue.tasks = this.defaultData.tasks
    }

    return returnValue
  }

  private async transformSyncDataToLocalStorage(): Promise<Data | undefined> {
    console.time("transformSyncDataToLocalStorage()")

    try {
      const oldData = await browser.storage.sync.get()

      console.log({ oldData })

      if (Object.keys(oldData).length < 1) {
        await browser.storage.local.set({ migrated: false })

        return undefined
      }

      const validatedData = this.validateSyncData(oldData)

      // Update local storage
      const newData = {
        ...validatedData,
        migrated: true
      }

      await this.sync(newData, "MIGRATE_DATA_FROM_SYNC")

      // Clear old data
      this.clearLegacyData()

      return newData
    } catch (error) {
      console.error(error)
      return undefined
    } finally {
      console.timeEnd("transformSyncDataToLocalStorage()")
    }
  }

  private cleanData(data: Data) {
    console.time("cleanData()")
    const labelIds = data.labels?.map(x => x.id)
    const newData = this.cloneData(data)

    for (const [, tasks] of Object.entries(newData.tasks || {})) {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        for (const label of task.labels) {
          if (!labelIds.includes(label)) {
            const newTask = {
              ...task,
              labels: task.labels.filter(x => x !== label)
            }
            set(newData, `tasks.${this.getTaskKey(task)}.${i}`, newTask)
          }
        }
      }
    }

    console.timeEnd("cleanData()")
    return this.sync(newData, "CLEAN_DATA")
  }

  // ======================= PUBLIC API ============================== //

  subscribe = (fn: (data: Data) => void): void => {
    this.subscriptions.push(fn)
  }

  unsubscribe = (fn: (data: Data) => void): void => {
    this.subscriptions = this.subscriptions.filter(x => x !== fn)
  }

  async getData(): Promise<{
    data: Data
    usage: string
    quota: string
  }> {
    let parsedData: Data

    this.setBusyState()
    console.groupCollapsed("GET_STORAGE_DATA")
    console.time("getData()")
    try {
      const data = await browser.storage.local.get()
      console.log({ data })

      const valid = this.validateData(data)
      parsedData = (valid ? data : this.defaultData) as Data
      parsedData = await this.cleanData(parsedData)

      console.log(parsedData)

      if (!Boolean(parsedData.migrated)) {
        // Migrate data from Release #1 from sync storage to local storage
        const migratedData = await this.transformSyncDataToLocalStorage()

        if (migratedData) parsedData = migratedData
      }

      const filteringByMissingLabels = data.filters?.some(filterId => {
        return (
          (parsedData.labels || []).findIndex(({ id }) => filterId === id) < 0
        )
      })

      if (filteringByMissingLabels) {
        parsedData = this.updateFilters(parsedData, [])
      }

      // Usage
      const usage = await this.getStorageUsagePercent(parsedData)
      const usagePct = Number(usage * 100).toFixed(1) + "%"

      return {
        data: parsedData,
        usage: usagePct,
        quota: bytesToSize(browser.storage.local.QUOTA_BYTES)
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (chrome?.runtime?.lastError) {
        console.error(chrome.runtime.lastError)
        throw chrome.runtime.lastError
      }

      console.timeEnd("getData()")
      console.groupEnd()

      this.unsetBusyState(parsedData)
    }
  }

  getStorageUsagePercent = async (data: Data): Promise<number> => {
    const inUse = sizeOf(data)
    return inUse / browser.storage.local.QUOTA_BYTES
  }

  mergePersistedFirebaseData(data: Data): void {
    this.sync({ ...data, lastMerged: Date.now() }, "MERGE_PERSISTED_DATA")
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
  // @sync()
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

  // @sync()
  updateTask(data: Data, task: Task): Data {
    const newData = this.cloneData(data)
    const key = this.getTaskKey(task)

    const index = newData.tasks[key]?.findIndex(t => t.id === task.id)

    if (index > -1) {
      const completedStateChanged =
        newData.tasks[key]?.[index].completed !== task.completed

      if (completedStateChanged) {
        task.completed_at = task.completed ? this.getDateString() : undefined
      }

      set(newData, `tasks.${key}.${index}`, task)
    }

    this.sync(newData, "UPDATE_TASK")

    return newData
  }

  // @sync()
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

  // @sync()
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
      created_at: this.getDateString()
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
    const previousState = data.notes[date]

    // No note content
    if (note.trim().length === 0 && previousState?.length === 0) {
      return data
    }

    if (!data) {
      return data
    }

    // Note is the same
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
    const labelIds = data.labels.map(x => x.id)

    // Only set filters as existing labels
    newData.filters = filters.filter(id => labelIds.includes(id))

    this.sync(newData, "UPDATE_FILTERS")

    return newData
  }
}

export default StorageManager
