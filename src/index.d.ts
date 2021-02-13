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
}

export type Note = string

export type Notes = Record<string, Note>
export type Tasks = Record<string, Task[]>

// Array of label id strings
export type Filters = string[]

export interface Data {
  filters: Filters
  tasks: Tasks
  notes: Notes
  labels: Label[]
}

export type IntermediateLabel = Partial<Label> & {
  title: string
  color: string
}

type TaskAction = "ADD_TASK" | "REMOVE_TASK" | "UPDATE_TASK" | "MOVE_TASK"
type LabelAction = "ADD_LABEL" | "REMOVE_LABEL" | "UPDATE_LABEL"
type NoteAction = "UPDATE_NOTE"
type FilterAction = "UPDATE_FILTERS"
type StorageAction = "CLEAR_DATA"

export type Action =
  | TaskAction
  | LabelAction
  | NoteAction
  | FilterAction
  | StorageAction
