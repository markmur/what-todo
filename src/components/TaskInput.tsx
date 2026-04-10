import { Label as LabelType, Task } from "../index.d"

import Animate from "./Animate"
import Icon from "@meronex/icons/fi/FiArrowUpCircle"
import Label from "./Label"
import React, { useCallback } from "react"
import cx from "classnames"
import useOnClickOutside from "../hooks/onclickoutside"
import { useSettings } from "../context/SettingsContext"
import Textarea from "react-textarea-autosize"

const validTask = (task: Partial<Task>): boolean => {
  return (task.title || "").trim().length > 0
}

interface Props {
  placeholder: string
  labels: LabelType[]
  filters?: string[]
  onAdd: (task: Task) => void
}

const TaskInput: React.FC<Props> = ({
  placeholder,
  filters = [],
  labels,
  onAdd
}) => {
  const { settings } = useSettings()
  const ref = React.useRef<HTMLDivElement>(null)

  const defaultLabels = React.useMemo(() => {
    const base = [...filters]
    if (settings.defaultLabelId && !base.includes(settings.defaultLabelId)) {
      base.push(settings.defaultLabelId)
    }
    return base
  }, [filters, settings.defaultLabelId])

  const [task, setTask] = React.useState<Partial<Task>>({
    title: "",
    description: "",
    labels: defaultLabels
  })
  const [open, setOpen] = React.useState(false)
  const [showError, setShowError] = React.useState(false)

  const isValid = validTask(task)

  React.useEffect(() => {
    setTask({ ...task, labels: defaultLabels })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultLabels, setTask])

  const clearTask = useCallback(() => {
    setTask({
      ...task,
      title: "",
      description: ""
    })
  }, [task, setTask])

  const handleChange =
    (field: keyof Task) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (field === "title" && showError) setShowError(false)
      setTask({
        ...task,
        [field]: event.target.value
      })
    }

  const isMobile = window.matchMedia("(pointer: coarse)").matches

  const handleAdd = React.useCallback(() => {
    if (validTask(task)) {
      setShowError(false)
      onAdd(task as Task)
      clearTask()
      if (isMobile) setOpen(false)
    } else if (open) {
      setShowError(true)
      setTimeout(() => setShowError(false), 800)
    }
  }, [task, onAdd, clearTask, isMobile, open])

  const handleLabelClick = (id: string) => {
    const currentLabels = task.labels ?? []
    const nextLabels = currentLabels.includes(id)
      ? currentLabels.filter(l => l !== id)
      : [...currentLabels, id]

    setTask({ ...task, labels: nextLabels })
  }

  const handleKeyDown =
    (field: keyof Task) =>
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (field === "title" && event.key === "Enter") {
        handleAdd()
      }

      if (field === "description" && event.key === "Enter" && event.metaKey) {
        handleAdd()
      }
    }

  useOnClickOutside(ref, () => {
    setOpen(false)

    if (!task.title && !task.description) {
      setTask({
        title: "",
        description: "",
        labels: defaultLabels
      })
    }
  })

  return (
    <section
      ref={ref}
      aria-label="Add task"
      className={cx(
        "p-4 rounded-xl border-solid border-2 transition-all duration-200",
        open
          ? "bg-white dark:bg-navy-800 shadow-lg dark:shadow-navy-950/40"
          : "bg-slate-100 dark:bg-navy-800",
        showError
          ? "border-red-400 dark:border-red-500"
          : open
            ? "border-blue-200 dark:border-blue-500/30"
            : "border-slate-200 dark:border-navy-700"
      )}
    >
      <div className="flex justify-between items-center">
        <label htmlFor="task-title" className="sr-only">
          Task title
        </label>
        <input
          id="task-title"
          type="text"
          inputMode="text"
          autoComplete="off"
          className="text-md font-bold"
          value={task.title}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true)
          }}
          onChange={handleChange("title")}
          onKeyDown={handleKeyDown("title")}
        />
        {open && (
          <button
            type="button"
            className={cx(
              "no-style shrink-0 transition-all duration-150 active:scale-90",
              isValid
                ? "text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                : "text-slate-300 dark:text-navy-600"
            )}
            onClick={handleAdd}
            aria-label="Add task"
          >
            <Icon cursor="pointer" fontSize={26} />
          </button>
        )}
      </div>

      <Animate duration={0.2} active={open}>
        {open && (
          <div className="pt-1">
            <div className="border-t border-slate-200 dark:border-navy-700 my-2" />

            <label htmlFor="task-description" className="sr-only">
              Description
            </label>
            <Textarea
              id="task-description"
              minRows={1}
              maxRows={6}
              value={task.description}
              className="sm:text-md md:text-sm w-full bg-transparent py-1 mb-3 outline-hidden resize-none placeholder-slate-400 dark:placeholder-navy-400 dark:text-navy-100"
              placeholder="Add a description or URL..."
              onChange={handleChange("description")}
              onKeyDown={handleKeyDown("description")}
            />

            <div>
              <div className="mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-navy-300 uppercase tracking-wide">
                  Labels
                </span>
              </div>
              <div>
                {labels.map(label => (
                  <div className="inline-flex mr-1 mb-1" key={label.id}>
                    <Label
                      label={label}
                      active={task.labels?.includes(label.id) ?? false}
                      onClick={() => handleLabelClick(label.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Animate>
    </section>
  )
}

export default TaskInput
