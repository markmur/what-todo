import { Label as LabelType, Task as TaskType } from "../index.d"

// Icons
import ChevronDown from "@meronex/icons/fi/FiChevronDown"
import ChevronUp from "@meronex/icons/fi/FiChevronUp"
import Label from "./Label"
import React, { useCallback, useRef } from "react"
import Task from "./Task"
import Tooltip from "react-tooltip"
import cx from "classnames"
import useOnClickOutside from "../hooks/onclickoutside"

interface Props {
  tasks?: TaskType[]
  filters?: string[]
  labels: Record<string, LabelType>
  collapseCompleted?: boolean
  canPinTasks?: boolean
  onFilter: (labelIds: string[]) => void
  onUpdateTask: (task: TaskType) => void
  onRemoveTask: (task: TaskType) => void
  onMarkAsComplete: (task: TaskType) => void
  onMoveToToday?: (task: TaskType) => void
  onPinTask?: (task: TaskType) => void
}

const taskHasChanged = (
  prevTask: TaskType | undefined,
  newTask: TaskType
): boolean => {
  if (!prevTask) return false

  return (
    prevTask.title !== newTask.title ||
    prevTask.description !== newTask.description ||
    prevTask.labels.join(",") !== newTask.labels.join(",")
  )
}

const isSelected = (selected: TaskType | undefined, task: TaskType) => {
  return selected && task.id === selected.id
}

const getFilteredTasks = (tasks: TaskType[], filters: string[]): TaskType[] => {
  if (!filters.length) {
    return tasks
  }

  // If more than one selected, filter by tasks containing only both
  if (filters.length > 1) {
    return tasks.filter(task => {
      return task.labels?.sort().join(",") === filters.sort().join(",")
    })
  }

  // By default include any task that includes a selected filter
  return tasks.filter(task => {
    for (const id of filters) {
      if (task.labels?.includes(id)) return true
    }

    return false
  })
}

const List: React.FC<Props> = ({
  filters = [],
  tasks = [],
  labels,
  collapseCompleted = false,
  canPinTasks = true,
  onFilter,
  onUpdateTask,
  onRemoveTask,
  onMarkAsComplete,
  onMoveToToday
}) => {
  const selectedRef = useRef<any>()
  const [selected, setSelectedTask] = React.useState<TaskType>()
  const [displayCompleted, setDisplayCompleted] = React.useState(
    !collapseCompleted
  )
  const filteredTasks = getFilteredTasks(tasks, filters)

  const [uncompleted, completed] = filteredTasks.reduce(
    (state, task) => {
      state[task.completed ? 1 : 0].push(task)
      return state
    },
    [[] as TaskType[], [] as TaskType[]]
  )

  // Sort uncompleted by pinned state
  uncompleted.sort((a, b) => {
    const ap = typeof a.pinned === "boolean" && +a.pinned
    const bp = typeof b.pinned === "boolean" && +b.pinned
    const createdAt = a.created_at.localeCompare(b.created_at)

    return bp - ap || createdAt
  })

  // Sort completed tasks by when they were completed
  completed.sort(
    (a, b) => Number(b.completed_at?.localeCompare(a.completed_at ?? "")) ?? 0
  )
  const hasCompletedTasks = completed.length > 0

  const clickOutsideHandler = () => {
    setTimeout(() => {
      console.log("onClickOutside::deselecting")
      setSelectedTask(undefined)
    })
  }

  useOnClickOutside(selectedRef, clickOutsideHandler, {
    ignore: "task-list"
  })

  React.useEffect(() => {
    Tooltip.rebuild()
  })

  const handleLabelsChange = (newLabels: string[]) => {
    if (selected) {
      const newTask = {
        ...selected,
        labels: newLabels
      }
      setSelectedTask(newTask)
      onUpdateTask(newTask)
    }
  }

  const handleChange =
    (field: keyof TaskType) =>
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (selected) {
        setSelectedTask({
          ...selected,
          [field]: event.target.value
        })
      }
    }

  const handleFocus = useCallback(
    (originalTask: TaskType) => {
      if (!isSelected(selected, originalTask)) {
        setSelectedTask(originalTask)
      }
    },
    [selected]
  )

  const handleUpdate = (originalTask: TaskType) => () => {
    setTimeout(() => {
      if (selected && taskHasChanged(selected, originalTask)) {
        onUpdateTask(selected)
      }
    })
  }

  const handleDeselect = () => {
    console.log("Focus::deselecting")
    setSelectedTask(undefined)
    ;(document.activeElement as HTMLElement)?.blur()
  }

  const handleMarkAsComplete = (task: TaskType) => {
    onMarkAsComplete(task)
    handleDeselect()
  }

  return (
    <div>
      {filters.length ? (
        <div className="my-2">
          <small>Showing: </small>
          {filters.map(id => (
            <div className="inline mb-1 mr-1" key={id}>
              <Label
                active
                label={labels[id]}
                onRemove={() => {
                  onFilter(filters.filter(x => x !== id))
                }}
              />
            </div>
          ))}
        </div>
      ) : null}
      <ul className="task-list">
        {uncompleted.map(task => {
          const active = isSelected(selected, task)

          if (!task) return null

          return (
            <li
              key={task.id}
              className="task"
              ref={active ? selectedRef : undefined}
            >
              <Task
                active={active}
                task={active ? selected : task}
                labels={labels}
                filters={filters}
                onFilter={onFilter}
                onSelect={handleFocus}
                onUpdate={handleUpdate(task)}
                onDeselect={handleDeselect}
                onChange={handleChange}
                onChangeLabels={handleLabelsChange}
                onPinTask={canPinTasks ? onUpdateTask : undefined}
                onRemoveTask={onRemoveTask}
                onMarkAsComplete={handleMarkAsComplete}
                onMoveToToday={onMoveToToday}
              />
            </li>
          )
        })}

        {hasCompletedTasks && (
          <div
            className={cx("flex mb-2 items-center cursor-pointer", {
              "mt-10": uncompleted.length > 0,
              "mt-4": uncompleted.length === 0
            })}
            onClick={() => setDisplayCompleted(!displayCompleted)}
          >
            <h4 className="text-slate-600 hover:text-black font-bold">
              {completed.length} Completed
            </h4>
            <div className="align-center">
              {displayCompleted ? (
                <ChevronUp style={{ verticalAlign: "middle" }} />
              ) : (
                <ChevronDown style={{ verticalAlign: "middle" }} />
              )}
            </div>
          </div>
        )}

        {displayCompleted
          ? completed.map(task => {
              const active = isSelected(selected, task)

              return (
                <li
                  key={task.id}
                  className="task"
                  ref={active ? selectedRef : undefined}
                >
                  <Task
                    active={active}
                    task={active ? selected : task}
                    labels={labels}
                    filters={filters}
                    onFilter={onFilter}
                    onSelect={handleFocus(task)}
                    onUpdate={handleUpdate(task)}
                    onDeselect={handleDeselect}
                    onChange={handleChange}
                    onChangeLabels={handleLabelsChange}
                    onPinTask={canPinTasks ? onUpdateTask : undefined}
                    onRemoveTask={onRemoveTask}
                    onMarkAsComplete={handleMarkAsComplete}
                    onMoveToToday={onMoveToToday}
                  />
                </li>
              )
            })
          : null}
      </ul>
    </div>
  )
}

export default List
