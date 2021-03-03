export interface Day {
  date: Date
  name: string
  number: number
  isToday: boolean
}

export interface Label {
  id: string
  title: string
  color: string
}

export interface Task {
  id: string
  title: string
  description?: string
  url?: string
  created_at: string
  completed: boolean
  labels?: string[]

  // Fields after release #1
  pinned?: boolean
  completed_at?: string | undefined
}

export type Note = string

export type Notes = Record<string, Note>
export type Tasks = Record<string, Task[]>

// Array of label id strings
export type Filters = string[]

export type Data = {
  filters: Filters
  tasks: Tasks
  notes: Notes
  labels: Label[]
  /**
   * This field indicates whether the data from sync storage was migrated to local storage
   */
  migrated?: boolean
}

export type IntermediateLabel = Partial<Label> & {
  title: string
  color: string
}

type TaskAction = "ADD_TASK" | "REMOVE_TASK" | "UPDATE_TASK" | "MOVE_TASK"
type LabelAction = "ADD_LABEL" | "REMOVE_LABEL" | "UPDATE_LABEL"
type NoteAction = "UPDATE_NOTE"
type FilterAction = "UPDATE_FILTERS"
type StorageAction =
  | "CLEAR_DATA"
  | "UPLOAD_DATA"
  | "MIGRATE_DATA_FROM_SYNC"
  | "CLEAN_DATA"

export type Action =
  | TaskAction
  | LabelAction
  | NoteAction
  | FilterAction
  | StorageAction
