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
      setTask({
        ...task,
        [field]: event.target.value
      })
    }

  const isMobile = window.matchMedia("(pointer: coarse)").matches

  const handleAdd = React.useCallback(() => {
    if (validTask(task)) {
      onAdd(task as Task)
      clearTask()
      if (isMobile) setOpen(false)
    }
  }, [task, onAdd, clearTask, isMobile])

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
    <div
      ref={ref}
      className={cx(
        "bg-slate-100 dark:bg-navy-800 p-4 rounded-lg transition-all border-solid border-slate-200 dark:border-navy-700 border-2"
      )}
    >
      <div className="flex justify-between items-center">
        <label htmlFor="task-title" className="sr-only">
          Task title
        </label>
        <input
          id="task-title"
          type="text"
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
            className="no-style mb-2 text-slate-600 hover:text-slate-800"
            onClick={handleAdd}
            aria-label="Add task"
          >
            <Icon cursor="pointer" fontSize={24} />
          </button>
        )}
      </div>

      <Animate duration={0.15} active={open}>
        {open && (
          <>
            <label htmlFor="task-description" className="sr-only">
              Description
            </label>
            <Textarea
              id="task-description"
              minRows={1}
              maxRows={6}
              value={task.description}
              className="sm:text-md md:text-sm border-top w-full bg-transparent py-2 mb-3 outline-hidden resize-none border-top border-slate-200 dark:border-navy-700 placeholder-slate-400 dark:placeholder-navy-400 dark:text-navy-100"
              placeholder="Add a description or URL..."
              onChange={handleChange("description")}
              onKeyDown={handleKeyDown("description")}
            />

            <div>
              <div className="mb-2">
                <span className="text-sm">Labels</span>
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
          </>
        )}
      </Animate>
    </div>
  )
}

export default TaskInput
