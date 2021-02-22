import React from "react"
import { Flex, Box } from "rebass"
import {
  FiArrowRight as RightArrowIcon,
  FiX as CrossIcon
} from "react-icons/fi"
import Textarea from "react-textarea-autosize"

// Components
import Checkbox from "./Checkbox"
import Label from "./Label"

// Types
import { Task as TaskType, Label as LabelType } from "../index.d"
import ReactTooltip from "react-tooltip"

const MAX_DESCRIPTION_LENGTH = 140

interface Props {
  task: TaskType
  active: boolean
  labels: Record<string, LabelType>
  filters: string[]
  onFilter: (filters: string[]) => void
  onSelect: (task: TaskType) => void
  onDeselect: (task: TaskType) => void
  onMarkAsComplete: (task: TaskType) => void
  onChange: (key: keyof TaskType) => (event: React.ChangeEvent) => void
  onMoveToToday: (task: TaskType) => void
  onRemoveTask: (task: TaskType) => void
  onChangeLabels: (labels: string[]) => void
}

const getDescription = (active: boolean, task: TaskType): string => {
  return active
    ? task.description
    : task.description.length >= MAX_DESCRIPTION_LENGTH
    ? task.description.slice(0, MAX_DESCRIPTION_LENGTH - 3) + "..."
    : task.description
}

const Task: React.FC<Props> = ({
  task,
  active,
  labels,
  filters,
  onFilter,
  onSelect,
  onDeselect,
  onMarkAsComplete,
  onChange,
  onMoveToToday,
  onRemoveTask,
  onChangeLabels
}) => {
  return (
    <Flex alignItems="flex-start" py={3} onBlur={() => onDeselect(task)}>
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
            value={task.title}
            onChange={onChange("title")}
            onFocus={() => onSelect(task)}
          />
        )}

        {(active || task.description) && (
          <Textarea
            maxRows={5}
            value={getDescription(active, task)}
            placeholder="Add description..."
            className="unstyled task-description-input"
            onChange={onChange("description")}
            onFocus={() => onSelect(task)}
          />
        )}

        {active && (
          <React.Fragment>
            <hr />
            <Flex mt={2}>
              {Object.entries(labels).map(([id, label]) => (
                <Box key={id} mr={1} mb={1}>
                  <Label
                    small
                    active={task.labels.includes(id)}
                    label={label}
                    onClick={() => {
                      const nextLabels = task.labels.includes(id)
                        ? task.labels.filter(l => l !== id)
                        : [...task.labels, id]
                      onChangeLabels(nextLabels)
                    }}
                  />
                </Box>
              ))}
            </Flex>
          </React.Fragment>
        )}
      </Box>

      {onMoveToToday && (
        <div
          data-tip="Move to today"
          className="remove-icon"
          onClick={() => {
            onMoveToToday(task)
            ReactTooltip.hide()
          }}
        >
          <RightArrowIcon />
        </div>
      )}

      {!active
        ? task.labels.map(id => (
            <span
              key={id}
              className="circle"
              data-tip={labels[id]?.title}
              data-background-color={labels[id]?.color}
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
  )
}

export default Task
