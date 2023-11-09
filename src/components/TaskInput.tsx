import { Label as LabelType, Task } from "../index.d"

import Animate from "./Animate"
import Icon from "@meronex/icons/fi/FiArrowUpCircle"
import Label from "./Label"
import React from "react"
import cx from "classnames"
import useOnClickOutside from "../hooks/onclickoutside"

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
  const ref = React.useRef<HTMLDivElement>(null)

  const [task, setTask] = React.useState<Partial<Task>>({
    title: "",
    description: "",
    labels: [...filters]
  })
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setTask({ ...task, labels: [...filters] })
  }, [filters, setTask])

  const clearTask = () => {
    setTask({
      ...task,
      title: "",
      description: ""
    })
  }

  const handleChange =
    (field: keyof Task) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTask({
        ...task,
        [field]: event.target.value
      })
    }

  const handleAdd = React.useCallback(() => {
    if (validTask(task)) {
      onAdd(task as Task)
      clearTask()
    } else {
      console.error("Invalid task")
    }
  }, [task, onAdd, clearTask])

  const handleLabelClick = (id: string) => {
    const newTask = { ...task }

    if (task.labels?.includes(id)) {
      newTask.labels = task.labels.filter(l => l !== id)
    } else {
      newTask.labels?.push(id)
    }

    setTask(newTask)
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
        labels: [...filters]
      })
    }
  })

  return (
    <div
      ref={ref}
      className={cx(
        "bg-slate-100 p-4 rounded-lg transition-all border-solid border-slate-200 border-2"
      )}
    >
      <div className="flex justify-between items-center">
        <input
          type="text"
          className="text-md font-bold"
          value={task.title}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={handleChange("title")}
          onKeyDown={handleKeyDown("title")}
        />
        {open && (
          <Icon
            onClick={handleAdd}
            className="mb-2 text-slate-600 hover:text-slate-800"
            cursor="pointer"
            fontSize={24}
          />
        )}
      </div>

      <Animate active={open}>
        {open && (
          <>
            <textarea
              rows={2}
              value={task.description}
              className="text-sm border-top w-full bg-transparent py-2 mb-10 outline-none resize-none border-top border-slate-200 placeholder-slate-400"
              placeholder="Add a brief description or URL..."
              onChange={handleChange("description")}
              onKeyDown={handleKeyDown("description")}
            />

            <div>
              <div className="mb-2">
                <label htmlFor="">Labels</label>
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
