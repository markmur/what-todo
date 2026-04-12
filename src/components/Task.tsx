import type { Label as LabelType, Task as TaskType } from "../index.d"
// Types
import React, { FormEvent, MouseEvent, useCallback, useRef } from "react"

import Animate from "./Animate"
// Components
import Checkbox from "./Checkbox"
// Icons
import CrossIcon from "@meronex/icons/fi/FiX"
import Label from "./Label"
import Pin from "@meronex/icons/ai/AiOutlinePushpin"
import PinFilled from "@meronex/icons/ai/AiFillPushpin"
import RightArrowIcon from "@meronex/icons/fi/FiArrowRight"
import Textarea from "react-textarea-autosize"
import cx from "classnames"
import FiLink from "@meronex/icons/fi/FiLink"
import { useSettings } from "../context/SettingsContext"
import { contrastText, haptic } from "../utils"

const MAX_DESCRIPTION_LENGTH = 1000

interface Props {
  canPin?: boolean
  compact?: boolean
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
    prevTask.labels?.join(",") !== newTask.labels?.join(",") ||
    !!prevTask.pinned !== !!newTask.pinned

  return hasChanged
}

function getDescriptionURL(text: string | undefined): string | undefined {
  if (!text) return undefined

  const matches = text.match(URL_RE)

  if (!matches?.length) {
    return undefined
  }

  return matches[0]
}

const getDescription = (truncate: boolean, description: string | undefined) => {
  if (truncate) {
    return description
  }

  return (description?.length ?? 0) >= MAX_DESCRIPTION_LENGTH
    ? description?.slice(0, MAX_DESCRIPTION_LENGTH - 3) + "..."
    : description
}

const Task: React.FC<Props> = ({
  canPin = true,
  compact = false,
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
  const { settings } = useSettings()
  const ref = useRef<HTMLDivElement>(null)
  const [localState, setLocalState] = React.useState<TaskType | undefined>(task)

  // When the task prop changes externally, sync only the fields that differ
  // — preserving any in-progress local edits.
  const prevTaskRef = React.useRef<TaskType>(task)
  React.useEffect(() => {
    const prev = prevTaskRef.current
    if (prev !== task) {
      prevTaskRef.current = task
      setLocalState(current => {
        if (!current) return current
        const patch: Partial<TaskType> = {}
        if (prev.pinned !== task.pinned) patch.pinned = task.pinned
        if (prev.completed !== task.completed) patch.completed = task.completed
        if (prev.labels?.join(",") !== task.labels?.join(","))
          patch.labels = task.labels
        if (Object.keys(patch).length > 0) {
          return { ...current, ...patch }
        }
        return current
      })
    }
  }, [task])

  const state = localState
  const setState = (t: TaskType | undefined) => setLocalState(t)
  const descriptionURL = getDescriptionURL(state?.description)
  const [, setHovering] = React.useState<boolean>(false)
  const [glowing, setGlowing] = React.useState(false)

  React.useEffect(() => {
    if (task.completed) return
    const isNew = Date.now() - new Date(task.created_at).getTime() < 5000
    if (isNew) {
      setGlowing(true)
      const timer = setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [task.completed, task.created_at])

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

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement | HTMLDivElement>
  ) => {
    if (event.key === "Enter" && event.metaKey) {
      onDeselect()
    }
    if (event.key === "Escape") {
      onDeselect()
    }

    const target = event.target as HTMLElement
    const isTyping = ["TEXTAREA", "INPUT"].includes(target.tagName)
    if (isTyping) return

    if (event.key === "p" && state && !state.completed) {
      haptic()
      const pinning = !Boolean(state.pinned)
      const updated = { ...state, pinned: pinning }
      setState(updated)
      onUpdate(updated)
      if (pinning) setGlowing(true)
      onDeselect()
    }
    if (event.key === "x") {
      haptic()
      onRemoveTask(state ?? task)
    }
    if (event.key === "m" && onMoveToToday) {
      onMoveToToday(state ?? task)
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
      haptic()
      const updated = {
        ...state,
        completed: !state.completed,
        pinned: state.completed ? state.pinned : false
      }
      setState(updated)

      if (state.completed) {
        // Uncompleting — move immediately
        onMarkAsComplete(updated)
      } else {
        // Completing — let strikethrough animation play first
        setTimeout(() => {
          onMarkAsComplete(updated)
        }, 1500)
      }
    }
  }, [onMarkAsComplete, state])

  const handlePress = useCallback(
    (event: MouseEvent) => {
      if (active) return
      const target = event.target as HTMLElement
      if (target.closest(".checkbox, [aria-label='Task actions']")) return

      onSelect(task.id, event)
      setTimeout(() => {
        const title = ref.current?.querySelector("textarea")
        title?.focus()
        title?.setSelectionRange(title?.value.length, title?.value.length)
      })
    },
    [onSelect, task, active]
  )

  return (
    <Animate active duration={0.15} skipInitial>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={ref}
        role="article"
        aria-label={state?.title}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cx(
          "group flex items-start hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl px-3 h-auto border-2 outline-none",
          compact ? "py-2 mb-1" : "py-4 mb-3",
          active
            ? "bg-slate-100 dark:bg-navy-700"
            : "bg-slate-50 dark:bg-navy-800",
          state?.pinned && !state?.completed
            ? "border-blue-300 dark:border-blue-500/50"
            : "border-transparent",
          {
            ["cursor-pointer"]: !active,
            ["animate-glow"]: glowing
          }
        )}
        onClick={handlePress as any}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onAnimationEnd={() => setGlowing(false)}
      >
        <div className="mt-[2px] mr-3 shrink-0">
          <Checkbox
            id={task.id}
            checked={state?.completed ?? false}
            onChange={handleSelect}
          />
        </div>

        <div className="flex-1 overflow-clip min-w-0">
          <div className="flex items-start">
            <div className="flex-1 overflow-clip min-w-0">
              {active ? (
                <Textarea
                  maxRows={3}
                  name="title"
                  aria-label="Task title"
                  value={state?.title}
                  spellCheck={active}
                  className={cx(
                    "unstyled task-title-input text-sm font-semibold text-slate-700 dark:text-navy-100 leading-normal bg-transparent pt-0",
                    {
                      ["text-slate-400 dark:text-navy-400"]: state?.completed
                    }
                  )}
                  onKeyDown={handleKeyDown}
                  onChange={handleChange("title")}
                  onFocus={selectTask}
                  onBlur={handleBlur}
                />
              ) : (
                <div
                  data-testid="task-title"
                  data-completed={state?.completed || undefined}
                  className={cx(
                    "inline text-sm font-semibold text-slate-700 dark:text-navy-100",
                    {
                      ["text-slate-400 dark:text-navy-400"]: state?.completed
                    }
                  )}
                >
                  {state?.completed
                    ? state?.title
                        .split(/\s/)
                        .filter(Boolean)
                        .map((word, i) => (
                          <span
                            key={word}
                            className="strike-animated inline-flex mr-1"
                            style={
                              { "--strike-index": i } as React.CSSProperties
                            }
                          >
                            {word}
                          </span>
                        ))
                    : state?.title}
                </div>
              )}
            </div>

            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
            <div
              aria-label="Task actions"
              role="group"
              className="flex items-center ml-auto shrink-0"
              onClick={e => e.stopPropagation()}
            >
              {onMoveToToday && (
                <button
                  type="button"
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Move to today (M)"
                  aria-label="Move to today"
                  className="no-style remove-icon touch-target"
                  onClick={preventDefault(() => {
                    onMoveToToday(state ?? task)
                  })}
                >
                  <RightArrowIcon fontSize={20} />
                </button>
              )}

              {canPin && !state?.completed && (
                <button
                  type="button"
                  data-tooltip-id="tooltip"
                  data-tooltip-content={
                    state?.pinned ? "Unpin task (P)" : "Pin task (P)"
                  }
                  aria-label={state?.pinned ? "Unpin task" : "Pin task"}
                  className={cx("no-style remove-icon touch-target", {
                    active: state?.pinned
                  })}
                  style={state?.pinned ? { color: "#93c5fd" } : undefined}
                  onClick={preventDefault(() => {
                    if (!state) return
                    haptic()
                    const pinning = !Boolean(state.pinned)
                    const updated = { ...state, pinned: pinning }
                    setState(updated)
                    onUpdate(updated)
                    if (pinning) setGlowing(true)
                    onDeselect()
                  })}
                >
                  {state?.pinned ? (
                    <PinFilled fontSize={20} />
                  ) : (
                    <Pin fontSize={20} />
                  )}
                </button>
              )}

              {descriptionURL && (
                <button
                  type="button"
                  data-tooltip-id="tooltip"
                  data-tooltip-content={shortenURL(descriptionURL)}
                  aria-label="Open link"
                  className={cx("no-style remove-icon touch-target", {
                    active: true
                  })}
                  onClick={preventDefault(() => {
                    window.open(descriptionURL, "_blank")
                  })}
                >
                  <FiLink fontSize={20} />
                </button>
              )}

              {!active &&
                (state?.labels ?? task.labels)
                  ?.sort((a, b) => a.localeCompare(b))
                  ?.map(id => {
                    const handleLabelClick = preventDefault(
                      (event: MouseEvent<any>) => {
                        if (filters.includes(id)) {
                          onFilter(filters.filter(f => f !== id))
                        } else {
                          if (event.metaKey) {
                            onFilter([...filters, id])
                          } else {
                            onFilter([id])
                          }
                        }
                      }
                    )

                    if (settings.labelStyle === "pill") {
                      const bg = labels[id]?.color
                      return (
                        <button
                          type="button"
                          key={id}
                          className="no-style touch-target inline-flex items-center text-xs font-bold rounded-full px-2 py-1 ml-1 cursor-pointer"
                          style={{
                            backgroundColor: bg,
                            color: bg ? contrastText(bg) : undefined
                          }}
                          onClick={handleLabelClick}
                        >
                          {labels[id]?.title}
                        </button>
                      )
                    }

                    return (
                      <button
                        type="button"
                        key={id}
                        className="no-style touch-target w-[20px] h-[20px] rounded-full p-0 ml-2 grow-0 shrink-0 cursor-pointer"
                        data-tooltip-id="tooltip"
                        data-tooltip-content={labels[id]?.title}
                        aria-label={labels[id]?.title}
                        style={{ backgroundColor: labels[id]?.color }}
                        onClick={handleLabelClick}
                      />
                    )
                  })}

              <button
                type="button"
                className="no-style remove-icon touch-target overflow-hidden transition-all duration-200 max-w-[44px] opacity-100 md:max-w-0 md:opacity-0 group-hover:max-w-[44px] group-hover:opacity-100"
                data-tooltip-id="tooltip"
                data-tooltip-content="Delete (X)"
                aria-label="Delete task"
                onPointerUp={e => {
                  e.stopPropagation()
                  haptic()
                  onRemoveTask(state ?? task)
                }}
              >
                <CrossIcon fontSize={20} />
              </button>
            </div>
          </div>

          {(state?.description || active) && (
            <div className="mt-1">
              <Textarea
                maxRows={10}
                name="description"
                value={getDescription(active, state?.description)}
                placeholder={active ? "Add description..." : ""}
                className="unstyled text-slate-600 dark:text-navy-300 text-sm bg-transparent max-h-[800px] w-full max-w-prose"
                onChange={handleChange("description")}
                onKeyDown={handleKeyDown}
                onFocus={selectTask}
                onBlur={handleBlur}
              />
            </div>
          )}

          <Animate active={active}>
            <div className="flex mt-2 flex-wrap">
              {Object.entries(labels).map(([id, label]) => (
                <div className="mr-1 mb-1" key={id}>
                  <Label
                    small
                    active={state?.labels?.includes(id) ?? false}
                    label={label}
                    onClick={preventDefault(() => {
                      if (!state) return
                      const currentLabels = state.labels ?? []
                      const nextLabels = currentLabels.includes(id)
                        ? currentLabels.filter(l => l !== id)
                        : [...currentLabels, id]
                      const updated = { ...state, labels: nextLabels }
                      setState(updated)
                      onUpdate(updated)
                    })}
                  />
                </div>
              ))}
            </div>
          </Animate>
        </div>
      </div>
    </Animate>
  )
}

export default Task
