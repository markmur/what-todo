import type { Label as LabelType, Task as TaskType } from "../index.d"
// Types
import React, { FormEvent, MouseEvent, useRef } from "react"

import Animate from "./Animate"
// Components
import Checkbox from "./Checkbox"
// Icons
import CrossIcon from "@meronex/icons/fi/FiX"
import Label from "./Label"
import Pin from "@meronex/icons/ai/AiOutlinePushpin"
import PinFilled from "@meronex/icons/ai/AiFillPushpin"
import ReactTooltip from "react-tooltip"
import RightArrowIcon from "@meronex/icons/fi/FiArrowRight"
import Textarea from "react-textarea-autosize"
import cx from "classnames"

const MAX_DESCRIPTION_LENGTH = 140

interface Props {
  task: TaskType
  active: boolean
  labels: Record<string, LabelType>
  filters: string[]
  onFilter: (filters: string[]) => void
  onSelect: (task: TaskType, event: FormEvent) => void
  onDeselect: () => void
  onUpdate: (task: TaskType) => void
  onMarkAsComplete: (task: TaskType) => void
  onPinTask?: (task: TaskType) => void
  onChange: (
    key: keyof TaskType
  ) => (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void
  onMoveToToday?: (task: TaskType) => void
  onRemoveTask: (task: TaskType) => void
  onChangeLabels: (labels: string[]) => void
}

const URL_RE = /(https?:\/\/[^\s]+)/g

function shortenURL(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.hostname + parsed.pathname
  } catch {
    return url
  }
}

function urlify(text: string | undefined): string | (string | JSX.Element)[] {
  if (!text) return ""

  const matches = text.match(URL_RE)

  if (!matches?.length) {
    return text
  }

  return text.split(URL_RE).map((str, i) =>
    URL_RE.test(str) ? (
      <a
        key={`${str}-${i}`}
        rel="noopener noreferrer"
        href={str}
        target="_blank"
      >
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
    : (task.description?.length ?? 0) >= MAX_DESCRIPTION_LENGTH
    ? task.description?.slice(0, MAX_DESCRIPTION_LENGTH - 3) + "..."
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
  onUpdate,
  onMarkAsComplete,
  onChange,
  onMoveToToday,
  onRemoveTask,
  onPinTask,
  onChangeLabels
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.metaKey) {
      onDeselect()
    }
  }

  const preventDefault =
    (fn: (event: MouseEvent<any>) => any) => (event: MouseEvent<any>) => {
      event.preventDefault()
      event.stopPropagation()
      return fn(event)
    }

  return (
    <Animate active duration={0.15}>
      <div
        ref={ref}
        className={cx(
          "flex items-start hover:bg-slate-100 bg-slate-50 rounded-xl px-3 py-4 mb-3 overflow-hidden h-auto",
          {
            ["cursor-pointer"]: !active
          }
        )}
        onClick={event => {
          if (active) return

          if (event.currentTarget.nodeName !== "TEXTAREA") {
            onSelect(task, event)
            setTimeout(() => {
              const title = ref.current?.querySelector("textarea")
              title?.focus()
              title?.setSelectionRange(title?.value.length, title?.value.length)
            })
          }
        }}
      >
        <div className="mt-[2px] mr-3">
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
        </div>

        <div className="w-full">
          <Textarea
            maxRows={3}
            value={task.title}
            spellCheck={active}
            className={cx(
              "unstyled task-title-input leading-normal bg-transparent pt-0",
              {
                ["strike text-slate-400"]: task.completed
              }
            )}
            onKeyDown={handleKeyDown}
            onChange={onChange("title")}
            onFocus={event => {
              if (!active) {
                onSelect(task, event)
              }
            }}
            onBlur={() => onUpdate(task)}
          />

          {(active || task.description) && (
            <>
              {active ? (
                <div className="mt-1">
                  <Textarea
                    maxRows={5}
                    value={getDescription(active, task)}
                    placeholder="Add description..."
                    className="unstyled text-slate-500 text-sm bg-transparent"
                    onChange={onChange("description")}
                    onKeyDown={handleKeyDown}
                    onFocus={event => onSelect(task, event)}
                    onBlur={() => onUpdate(task)}
                  />
                </div>
              ) : (
                <p
                  className="unstyled text-slate-500 text-sm cursor-text"
                  onClick={event => onSelect(task, event)}
                >
                  {urlify(getDescription(active, task))}
                </p>
              )}
            </>
          )}

          <Animate active={active}>
            {active && (
              <div className="flex mt-2 flex-wrap">
                {Object.entries(labels).map(([id, label]) => (
                  <div className="mr-1 mb-1" key={id}>
                    <Label
                      small
                      active={task.labels?.includes(id) ?? false}
                      label={label}
                      onClick={() => {
                        const nextLabels = task.labels?.includes(id)
                          ? task.labels.filter(l => l !== id)
                          : [...(task.labels ?? []), id]
                        onChangeLabels(nextLabels)
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Animate>
        </div>

        <div id="actions" className="flex mt-1">
          {onMoveToToday && (
            <div
              data-tip="Move to today"
              className="remove-icon"
              onClick={preventDefault(() => {
                onMoveToToday(task)
                ReactTooltip.hide()
              })}
            >
              <RightArrowIcon />
            </div>
          )}

          {onPinTask && (
            <div
              data-tip={task.pinned ? "Unpin task" : "Pin task"}
              className={cx("remove-icon", { active: task.pinned })}
              onClick={preventDefault(() => {
                onPinTask({
                  ...task,
                  pinned: !Boolean(task.pinned)
                })
              })}
            >
              {task.pinned ? <PinFilled /> : <Pin />}
            </div>
          )}

          {task.labels
            ?.sort((a, b) => a.localeCompare(b))
            ?.map(id => (
              <span
                key={id}
                className="w-[16px] h-[16px] rounded-lg p-0 mx-1 flex-grow-0 flex-shrink-0 flex-basis-[16px] cursor-pointer"
                data-tip={labels[id]?.title}
                data-background-color={labels[id]?.color}
                style={{ backgroundColor: labels[id]?.color, marginRight: 2 }}
                onClick={preventDefault(event => {
                  if (filters.includes(id)) {
                    onFilter(filters.filter(f => f !== id))
                  } else {
                    if (event.metaKey) {
                      onFilter([...filters, id])
                    } else {
                      onFilter([id])
                    }
                  }
                })}
              />
            ))}

          <span className="remove-icon" onClick={() => onRemoveTask(task)}>
            <CrossIcon />
          </span>
        </div>
      </div>
    </Animate>
  )
}

export default Task
