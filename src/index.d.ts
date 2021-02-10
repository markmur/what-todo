export interface Label {
  id: string
  title: string
  color: string
}

export interface Task {
  id: string
  title: string
  description?: string
  created_at: string
  completed: boolean
  labels?: string[]
}

export interface Data {
  tasks: Task[]
  notes?: {}
  labels: Label[]
}

export type IntermediateLabel = Partial<Label> & {
  title: string
  color: string
}

type TaskAction = "ADD_TASK" | "REMOVE_TASK" | "UPDATE_TASK"
type LabelAction = "ADD_LABEL" | "REMOVE_LABEL" | "UPDATE_LABEL"

export type Action = TaskAction | LabelAction
