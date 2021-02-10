import React from "react"
import { Flex, Box } from "rebass"
import { FiX as CrossIcon } from "react-icons/fi"

import Label from "./Label"

import { Task, Label as LabelType } from "../index.d"
import Checkbox from "./Checkbox"

interface Props {
  tasks?: Task[]
  labels: Record<string, LabelType>
  onUpdateTask: (task: Task) => void
  onRemoveTask: (task: Task) => void
  onMarkAsComplete: (task: Task) => void
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
  tasks = [],
  labels,
  onUpdateTask,
  onRemoveTask,
  onMarkAsComplete
}) => {
  const [selected, setSelectedTask] = React.useState<Task>()

  const handleChange = (field: keyof Task) => event => {
    setSelectedTask({
      ...selected,
      [field]: event.target.value
    })
  }

  return (
    <ul>
      {tasks.map(task => (
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

            {!isSelected(selected, task) || !FEATURE_ENABLED
              ? task.labels.map(id => (
                  <span
                    key={id}
                    className="circle"
                    style={{ backgroundColor: labels[id]?.color }}
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
  )
}

export default List
