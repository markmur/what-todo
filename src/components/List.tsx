import React from "react"
import { Flex, Box } from "rebass"
import {
  FiX as CrossIcon,
  FiArrowRight as RightArrowIcon
} from "react-icons/fi"

import Label from "./Label"

import { Task, Label as LabelType } from "../index.d"
import Checkbox from "./Checkbox"

interface Props {
  tasks?: Task[]
  filters?: string[]
  labels: Record<string, LabelType>
  onFilter: (labelIds: string[]) => void
  onUpdateTask: (task: Task) => void
  onRemoveTask: (task: Task) => void
  onMarkAsComplete: (task: Task) => void
  onMoveToToday?: (task: Task) => void
}

const taskHasChanged = (prevTask: Task, newTask: Task): boolean => {
  return (
    prevTask.title !== newTask.title ||
    prevTask.description !== newTask.description ||
    prevTask.labels.length !== newTask.labels.length
  )
}

const isSelected = (selected: Task | undefined, task: Task) => {
  return task.id === selected?.id
}

const FEATURE_ENABLED = false

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
  const [selected, setSelectedTask] = React.useState<Task>()

  const handleChange = (field: keyof Task) => event => {
    setSelectedTask({
      ...selected,
      [field]: event.target.value
    })
  }

  const filteredTasks =
    filters.length > 0
      ? tasks.filter(task => {
          for (const id of filters) {
            if (task.labels.includes(id)) return true
          }

          return false
        })
      : tasks

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
        {filteredTasks.map(task => (
          <li className="task" key={task.id}>
            <Flex alignItems="flex-start" py={3}>
              <Box width={20} mr={2}>
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onChange={() =>
                    onMarkAsComplete({
                      ...task,
                      completed: !task.completed
                    })
                  }
                />
              </Box>

              <Box width={1}>
                {task.completed ? (
                  <div>
                    <s>{task.title}</s>
                  </div>
                ) : (
                  <input
                    value={
                      isSelected(selected, task) ? selected.title : task.title
                    }
                    onChange={handleChange("title")}
                    onBlur={() => {
                      if (taskHasChanged(task, selected)) {
                        onUpdateTask(selected)
                      }

                      setSelectedTask(undefined)
                    }}
                    onFocus={() => setSelectedTask(task)}
                  />
                )}

                {task.description && !task.completed && (
                  <div>
                    <small className="description">{task.description}</small>
                  </div>
                )}

                {isSelected(selected, task) && FEATURE_ENABLED && (
                  <Box mt={2}>
                    {task.labels.map(id => (
                      <Label key={id} active label={labels[id]} />
                    ))}
                  </Box>
                )}
              </Box>

              {onMoveToToday && (
                <div
                  data-tip="Move to today"
                  className="remove-icon"
                  onClick={() => onMoveToToday(task)}
                >
                  <RightArrowIcon />
                </div>
              )}

              {!isSelected(selected, task) || !FEATURE_ENABLED
                ? task.labels.map(id => (
                    <span
                      key={id}
                      className="circle"
                      data-tip={"labels[id].title"}
                      style={{ backgroundColor: labels[id]?.color }}
                      onClick={event => {
                        if (filters.includes(id)) {
                          onFilter(filters.filter(f => f !== id))
                        } else {
                          if (event.metaKey) {
                            onFilter([...filters, id])
                          } else {
                            onFilter([id])
                          }
                        }
                      }}
                    />
                  ))
                : null}

              <span className="remove-icon" onClick={() => onRemoveTask(task)}>
                <CrossIcon />
              </span>
            </Flex>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default List
