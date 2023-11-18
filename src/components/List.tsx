import { Label as LabelType, Task as TaskType } from "../index.d"
import React, { useCallback, useRef } from "react"

// Icons
import ChevronDown from "@meronex/icons/fi/FiChevronDown"
import ChevronUp from "@meronex/icons/fi/FiChevronUp"
import Label from "./Label"
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
  canCollapse?: boolean
  onFilter: (labelIds: string[]) => void
  onUpdateTask: (task: TaskType) => void
  onRemoveTask: (task: TaskType) => void
  onMarkAsComplete: (task: TaskType) => void
  onMoveToToday?: (task: TaskType) => void
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
  canCollapse = true,
  onFilter,
  onUpdateTask,
  onRemoveTask,
  onMarkAsComplete,
  onMoveToToday
}) => {
  const selectedRef = useRef<any>()
  const [selected, setSelected] = React.useState<TaskType["id"] | undefined>()
  const [displayCompleted, setDisplayCompleted] = React.useState(
    !collapseCompleted
  )
  const filteredTasks = getFilteredTasks(tasks, filters)

  function setSelectedTask(taskId: TaskType["id"] | undefined) {
    setSelected(taskId)
  }

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
      setSelectedTask(undefined)
    })
  }

  useOnClickOutside(selectedRef, clickOutsideHandler)

  React.useEffect(() => {
    Tooltip.rebuild()
  })

  const handleFocus = useCallback(
    (taskId: string) => {
      if (selected !== taskId) {
        setSelectedTask(taskId)
      }
    },
    [selected]
  )

  const handleUpdate = useCallback(
    (task: TaskType) => onUpdateTask(task),
    [onUpdateTask]
  )

  const handleDeselect = () => {
    setSelectedTask(undefined)
    ;(document.activeElement as HTMLElement)?.blur()
  }

  const handleMarkAsComplete = (task: TaskType) => {
    onMarkAsComplete(task)
    handleDeselect()
  }

  const callbackHandlers = {
    onFilter: onFilter,
    onSelect: handleFocus,
    onUpdate: handleUpdate,
    onDeselect: handleDeselect,
    onRemoveTask: onRemoveTask,
    onMarkAsComplete: handleMarkAsComplete,
    onMoveToToday: onMoveToToday
  }

  return (
    <div>
      <ul className="task-list" ref={selectedRef}>
        {uncompleted.map(task => {
          if (!task) return null

          return (
            <li key={task.id} className="task">
              <Task
                {...callbackHandlers}
                active={task.id === selected}
                task={task}
                labels={labels}
                filters={filters}
                canPin={canPinTasks}
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
              if (!task) return null

              return (
                <li key={task.id} className="task">
                  <Task
                    {...callbackHandlers}
                    active={task.id === selected}
                    task={task}
                    canPin={canPinTasks}
                    labels={labels}
                    filters={filters}
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
