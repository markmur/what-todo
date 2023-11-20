import type { Label as LabelType, Task as TaskType } from "../index.d"
// Types
import React, {
  FormEvent,
  MouseEvent,
  TouchEvent,
  useCallback,
  useRef
} from "react"

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
  canPin?: boolean
  task: TaskType
  active: boolean
  labels: Record<string, LabelType>
  filters: string[]
  onFilter: (filters: string[]) => void
  onSelect: (taskId: TaskType["id"], event: FormEvent) => void
  onDeselect: () => void
  onUpdate: (task: TaskType) => void
  onMarkAsComplete: (task: TaskType) => void
  onMoveToToday?: (task: TaskType) => void
  onRemoveTask: (task: TaskType) => void
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

const taskHasChanged = (
  prevTask: TaskType | undefined,
  newTask: TaskType
): boolean => {
  if (!prevTask) return false

  const hasChanged =
    prevTask.title !== newTask.title ||
    prevTask.description !== newTask.description ||
    prevTask.labels?.join(",") !== newTask.labels?.join(",")

  return hasChanged
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

const getDescription = (active: boolean, task?: TaskType) => {
  return active
    ? task?.description
    : (task?.description?.length ?? 0) >= MAX_DESCRIPTION_LENGTH
    ? task?.description?.slice(0, MAX_DESCRIPTION_LENGTH - 3) + "..."
    : task?.description
}

const Task: React.FC<Props> = ({
  canPin = true,
  task,
  active,
  labels,
  filters,
  onFilter,
  onSelect,
  onDeselect,
  onUpdate,
  onMarkAsComplete,
  onMoveToToday,
  onRemoveTask
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = React.useState<TaskType | undefined>(task)

  const handleChange =
    (field: keyof TaskType) =>
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (state) {
        setState({
          ...state,
          [field]: event.target.value
        })
      }
    }

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

  const handleBlur = useCallback(() => {
    if (state && taskHasChanged(task, state)) {
      onUpdate(state)
    }
  }, [state, task, onUpdate])

  const selectTask = useCallback(
    (event: any) => {
      if (!active) {
        onSelect(task.id, event)
      }
    },
    [active, onSelect, task]
  )

  const handleSelect = useCallback(() => {
    if (state) {
      const prevState = state.completed
      setState({
        ...task,
        completed: !state.completed
      })

      if (prevState) {
        onMarkAsComplete({
          ...task,
          completed: !task.completed
        })
      } else {
        setTimeout(() => {
          onMarkAsComplete({
            ...task,
            completed: !task.completed
          })
        }, 1500)
      }
    }
  }, [onMarkAsComplete, state, task])

  const handlePress = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (active) return

      const target = event.target as HTMLElement

      if (
        !["TEXTAREA"].includes(event.currentTarget.nodeName) &&
        !["INPUT", "svg"].includes(target.nodeName)
      ) {
        onSelect(task.id, event)
        setTimeout(() => {
          const title = ref.current?.querySelector("textarea")
          title?.focus()
          title?.setSelectionRange(title?.value.length, title?.value.length)
        })
      }
    },
    [onSelect, task, active]
  )

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
        onClick={handlePress}
        onTouchStart={handlePress}
      >
        <div className="mt-[2px] mr-3">
          <Checkbox
            id={task.id}
            checked={state?.completed ?? false}
            onChange={handleSelect}
          />
        </div>

        <div className="w-full">
          {active ? (
            <Textarea
              maxRows={3}
              value={state?.title}
              spellCheck={active}
              className={cx(
                "unstyled task-title-input leading-normal bg-transparent pt-0",
                {
                  ["text-slate-400"]: state?.completed
                }
              )}
              onKeyDown={handleKeyDown}
              onChange={handleChange("title")}
              onFocus={selectTask}
              onBlur={handleBlur}
            />
          ) : (
            <div
              className={cx("inline", {
                ["text-slate-400"]: state?.completed
              })}
            >
              {state?.completed
                ? state?.title
                    .split(/\s/)
                    .filter(Boolean)
                    .map(word => (
                      <span
                        key={word}
                        className="strike-animated inline-flex mr-1"
                      >
                        {word}
                      </span>
                    ))
                : state?.title}
            </div>
          )}

          <Animate active={task.description && !active}>
            <p
              className="unstyled text-slate-500 text-sm cursor-text"
              onClick={preventDefault(event => {
                onSelect(task.id, event)
                setTimeout(() => {
                  const description = ref.current?.querySelector(
                    "textarea[name='description']"
                  ) as HTMLTextAreaElement
                  description?.focus()
                  description?.setSelectionRange(
                    description?.value.length,
                    description?.value.length
                  )
                })
              })}
            >
              {urlify(getDescription(active, state))}
            </p>
          </Animate>

          <Animate active={active}>
            <div className="mt-1">
              <Textarea
                maxRows={5}
                name="description"
                value={getDescription(active, state)}
                placeholder="Add description..."
                className="unstyled text-slate-500 text-sm bg-transparent"
                onChange={handleChange("description")}
                onKeyDown={handleKeyDown}
                onFocus={selectTask}
                onBlur={handleBlur}
              />
            </div>
          </Animate>

          <Animate active={active}>
            <div className="flex mt-2 flex-wrap">
              {Object.entries(labels).map(([id, label]) => (
                <div className="mr-1 mb-1" key={id}>
                  <Label
                    small
                    active={task.labels?.includes(id) ?? false}
                    label={label}
                    onClick={preventDefault(() => {
                      const nextLabels = task.labels?.includes(id)
                        ? task.labels.filter(l => l !== id)
                        : [...(task.labels ?? []), id]
                      onUpdate({
                        ...task,
                        labels: nextLabels
                      })
                    })}
                  />
                </div>
              ))}
            </div>
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

          {canPin && (
            <div
              data-tip={task.pinned ? "Unpin task" : "Pin task"}
              className={cx("remove-icon", { active: task.pinned })}
              onClick={preventDefault(() => {
                onUpdate({
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
