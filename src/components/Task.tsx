import React from "react"
import cx from "classnames"
import { Flex, Box } from "rebass"

// Icons
import CrossIcon from "@meronex/icons/fi/FiX"
import RightArrowIcon from "@meronex/icons/fi/FiArrowRight"
import Pin from "@meronex/icons/ai/AiOutlinePushpin"
import PinFilled from "@meronex/icons/ai/AiFillPushpin"

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
  onPinTask?: (task: TaskType) => void
  onChange: (key: keyof TaskType) => (event: React.ChangeEvent) => void
  onMoveToToday: (task: TaskType) => void
  onRemoveTask: (task: TaskType) => void
  onChangeLabels: (labels: string[]) => void
}

const URL_RE = /(https?:\/\/[^\s]+)/g

function shortenURL(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function urlify(text: string): string | (string | JSX.Element)[] {
  const matches = text.match(URL_RE)

  if (!matches?.length) {
    return text
  }

  return text.split(URL_RE).map((str, i) =>
    URL_RE.test(str) ? (
      <a key={`${str}-${i}`} rel="noopener noreferer" href={str}>
        {shortenURL(str)}
      </a>
    ) : (
      str
    )
  )
}

const getDescription = (active: boolean, task: TaskType) => {
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
  onPinTask,
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
        <Textarea
          maxRows={3}
          value={task.title}
          spellCheck={active}
          className={cx("unstyled task-title-input", {
            strike: task.completed
          })}
          onChange={onChange("title")}
          onFocus={() => onSelect(task)}
        />

        {(active || task.description) && (
          <>
            {active ? (
              <Textarea
                maxRows={5}
                value={getDescription(active, task)}
                placeholder="Add description..."
                className="unstyled task-description-input"
                onChange={onChange("description")}
                onFocus={() => onSelect(task)}
              />
            ) : (
              <p className="unstyled task-description-input">
                {urlify(getDescription(active, task))}
              </p>
            )}
          </>
        )}

        {active && (
          <React.Fragment>
            <hr />
            <Flex mt={2} flexWrap="wrap">
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

      {onPinTask && (
        <div
          data-tip={task.pinned ? "Unpin task" : "Pin task"}
          className={cx("remove-icon", { active: task.pinned })}
          onClick={() => {
            onPinTask({
              ...task,
              pinned: !Boolean(task.pinned)
            })
          }}
        >
          {task.pinned ? <PinFilled /> : <Pin />}
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
