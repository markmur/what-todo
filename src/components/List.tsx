import React from "react"
import { Box } from "rebass"
import Tooltip from "react-tooltip"

import Label from "./Label"

import { Task as TaskType, Label as LabelType } from "../index.d"
import useOnClickOutside from "@src/hooks/onclickoutside"
import Task from "./Task"

interface Props {
  tasks?: TaskType[]
  filters?: string[]
  labels: Record<string, LabelType>
  onFilter: (labelIds: string[]) => void
  onUpdateTask: (task: TaskType) => void
  onRemoveTask: (task: TaskType) => void
  onMarkAsComplete: (task: TaskType) => void
  onMoveToToday?: (task: TaskType) => void
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
  return task.id && task.id === selected?.id
}

const getFilteredTasks = (tasks: TaskType[], filters: string[]) => {
  if (!filters.length) {
    return tasks
  }

  // If more than one selected, filter by tasks containing only both
  if (filters.length > 1) {
    return tasks.filter(task => {
      return task.labels.sort().join(",") === filters.sort().join(",")
    })
  }

  // By default include any task that includes a selected filter
  return tasks.filter(task => {
    for (const id of filters) {
      if (task.labels.includes(id)) return true
    }

    return false
  })
}

const List: React.FC<Props> = ({
  filters = [],
  tasks = [],
  labels,
  onFilter,
  onUpdateTask,
  onRemoveTask,
  onMarkAsComplete,
  onMoveToToday
}) => {
  const selectedRef = React.useRef<any>()
  const [selected, setSelectedTask] = React.useState<TaskType>()

  useOnClickOutside(selectedRef, () => {
    setTimeout(() => {
      setSelectedTask(undefined)
    })
  })

  React.useEffect(() => {
    Tooltip.rebuild()
  })

  const handleLabelsChange = (newLabels: string[]) => {
    setSelectedTask({
      ...selected,
      labels: newLabels
    })
  }

  const handleChange = (field: keyof TaskType) => (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setSelectedTask({
      ...selected,
      [field]: event.target.value
    })
  }

  const filteredTasks = getFilteredTasks(tasks, filters)

  const sortedTasks = filteredTasks.sort((a, b) => +a.completed - +b.completed)

  const handleFocus = (originalTask: TaskType) => () => {
    if (!isSelected(selected, originalTask)) {
      setSelectedTask(originalTask)
    }
  }

  const handleBlur = (originalTask: TaskType) => () => {
    setTimeout(() => {
      if (taskHasChanged(selected, originalTask)) {
        onUpdateTask(selected)
      }
    })
  }

  return (
    <div>
      {filters.length ? (
        <Box my={2}>
          <small>Showing: </small>
          {filters.map(id => (
            <Label
              active
              key={id}
              label={labels[id]}
              onRemove={() => {
                onFilter(filters.filter(x => x !== id))
              }}
            />
          ))}
        </Box>
      ) : null}
      <ul>
        {sortedTasks.map(task => {
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
                onDeselect={handleBlur(task)}
                onChange={handleChange}
                onChangeLabels={handleLabelsChange}
                onRemoveTask={onRemoveTask}
                onMarkAsComplete={onMarkAsComplete}
                onMoveToToday={onMoveToToday}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default List
