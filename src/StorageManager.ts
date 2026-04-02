// Types
import { Action, Data, Label, Section, SectionData, Task } from "./index.d"

import { StorageAdapter } from "./adapters/StorageAdapter"
import colors from "./color-palette"
import set from "lodash-es/set"

const uuid = () => crypto.randomUUID()

type Item = Label
type ItemKey = "labels"

const isObj = (val: unknown) => {
  return typeof val === "object" && val !== null && !Array.isArray(val)
}

const defaultLabels: Label[] = [
  { id: uuid(), title: "Work", color: colors[9].backgroundColor },
  { id: uuid(), title: "Personal", color: colors[1].backgroundColor }
]

const defaultData: Data = {
  migrated: true,
  filters: [],
  tasks: {},
  labels: defaultLabels,
  sections: {
    completed: {
      collapsed: true
    },
    focus: {},
    sidebar: {
      collapsed: false
    }
  }
}

// Class
class StorageManager {
  public defaultData: Data = defaultData

  public busy = false

  public syncQueue: Array<(data: Data, ...args: unknown[]) => Data> = []

  private subscriptions: Array<(data: Data) => void> = []

  private adapter: StorageAdapter

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter
  }

  /** Swap the storage backend at runtime (e.g. when connecting Supabase). */
  setAdapter(adapter: StorageAdapter) {
    this.adapter = adapter
  }

  private async sync(newData: Data, action: Action): Promise<Data> {
    try {
      await this.adapter.set(newData)
    } catch (err) {
      console.error(`[StorageManager] sync failed (${action}):`, err)
      return newData
    }

    this.subscriptions.forEach(fn => {
      if (typeof fn === "function") {
        fn(newData)
      }
    })

    return newData
  }

  private validateData(data: Data | null): data is Data {
    if (!data || typeof data !== "object") return false
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
    return JSON.parse(JSON.stringify(data))
  }

  private setBusyState() {
    this.busy = true
  }

  private unsetBusyState(data: Data) {
    this.busy = false

    while (this.syncQueue.length) {
      this.syncQueue.shift()!(data)
    }
  }

  private validateSyncData(data: Data): Data {
    if (typeof data !== "object" || Array.isArray(data) || !data) {
      return this.defaultData
    }

    if (Object.keys(data).length === 0) {
      return this.defaultData
    }

    const returnValue: Data = { ...data }

    // Validate filters
    if (!Array.isArray(data.filters)) {
      returnValue.filters = this.defaultData.filters
    }

    // Validate labels
    if (!Array.isArray(data.labels)) {
      returnValue.labels = this.defaultData.labels
    }

    // Validate tasks
    if (!isObj(data.tasks)) {
      returnValue.tasks = this.defaultData.tasks
    }

    return returnValue
  }

  /**
   * Remove references to labels that no longer exist from tasks.
   * Returns the cleaned data without persisting — the caller decides
   * whether to sync, avoiding unnecessary write-backs on every read.
   */
  private cleanData(data: Data): { data: Data; changed: boolean } {
    const labelIds = data.labels?.map(x => x.id)
    const newData = this.cloneData(data)
    let changed = false

    for (const [, tasks] of Object.entries(newData.tasks || {})) {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        const { labels = [] } = task
        for (const label of labels) {
          if (!labelIds.includes(label)) {
            const newTask = {
              ...task,
              labels: labels.filter(x => x !== label)
            }
            set(newData, `tasks.${this.getTaskKey(task)}.${i}`, newTask)
            changed = true
          }
        }
      }
    }

    return { data: newData, changed }
  }

  // ======================= PUBLIC API ============================== //

  subscribe = (fn: (data: Data) => void): void => {
    this.subscriptions.push(fn)
  }

  unsubscribe = (fn: (data: Data) => void): void => {
    this.subscriptions = this.subscriptions.filter(x => x !== fn)
  }

  async getData(): Promise<{ data: Data }> {
    let parsedData: Data = this.defaultData

    this.setBusyState()
    try {
      const data = await this.adapter.get()

      if (this.validateData(data)) {
        parsedData = this.validateSyncData(data)
      }

      const cleaned = this.cleanData(parsedData)
      parsedData = cleaned.data
      if (cleaned.changed) {
        await this.sync(parsedData, "CLEAN_DATA")
      }

      const filteringByMissingLabels = parsedData.filters?.some(
        (filterId: string) => {
          return (
            (parsedData.labels || []).findIndex(({ id }) => filterId === id) < 0
          )
        }
      )

      if (filteringByMissingLabels) {
        parsedData = this.updateFilters(parsedData, [])
      }

      this.moveUncompletedTasksToToday(parsedData)

      return {
        data: parsedData
      }
    } catch (error) {
      console.error("[StorageManager] getData failed:", error)
      return { data: parsedData }
    } finally {
      this.unsetBusyState(parsedData)
    }
  }

  uploadData = (data: Data): void => {
    this.sync(data, "UPLOAD_DATA")
  }

  // Labels
  getLabelsById(data: Data): Record<string, Label> {
    return data?.labels.reduce(
      (state, label) => {
        state[label.id] = label
        return state
      },
      {} as Record<string, Label>
    )
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

  updateTask(data: Data, task: Task): Data {
    const newData = this.cloneData(data)
    const key = this.getTaskKey(task)
    const index = newData.tasks[key]?.findIndex(t => t.id === task.id)

    if (typeof index === "number" && index > -1) {
      const completedStateChanged =
        newData.tasks[key]?.[index].completed !== task.completed

      if (completedStateChanged) {
        task.completed_at = task.completed ? this.getDateString() : undefined
      }

      set(newData, `tasks.${key}.${index}`, task)

      this.sync(newData, "UPDATE_TASK")
    }

    return newData
  }

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

  private moveUncompletedTasksToToday(data: Data) {
    const todayKey = this.getTodayKey()
    const uncompletedTasks = Object.entries(data.tasks)
      .filter(([key]) => key !== todayKey)
      .map(([, tasks]) => tasks)
      .flat()
      .filter(task => !task.completed)

    if (uncompletedTasks?.length > 0) {
      return uncompletedTasks.reduce(
        (state, task) => {
          state = this.moveTaskToToday(data, task)
          return state
        },
        { ...data }
      )
    }

    return data
  }

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

  // Filters
  updateFilters = (data: Data, filters: string[]): Data => {
    const newData = this.cloneData(data)
    const labelIds = data.labels.map(x => x.id)

    // Only set filters as existing labels
    newData.filters = filters.filter(id => labelIds.includes(id))

    this.sync(newData, "UPDATE_FILTERS")

    return newData
  }

  updateSection = (data: Data, key: Section, section: SectionData) => {
    const newData = this.cloneData(data)

    if (typeof newData.sections !== "object") {
      newData.sections = defaultData.sections
    }

    set(newData, `sections.${key}`, section)

    this.sync(newData, "UPDATE_SECTION")

    return newData
  }

  updateSections = (data: Data, updates: Record<string, SectionData>) => {
    const newData = this.cloneData(data)

    if (typeof newData.sections !== "object") {
      newData.sections = defaultData.sections
    }

    for (const [key, section] of Object.entries(updates)) {
      set(newData, `sections.${key}`, section)
    }

    this.sync(newData, "UPDATE_SECTION")

    return newData
  }
}

export default StorageManager
