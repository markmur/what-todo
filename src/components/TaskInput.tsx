import React from "react"

import Icon from "@meronex/icons/fi/FiArrowUpCircle"

import { Label as LabelType, Task } from "../index.d"
import useOnClickOutside from "../hooks/onclickoutside"
import Label from "./Label"

const validTask = (task: Partial<Task>): boolean => {
  return task.title.trim().length > 0
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
  const ref = React.useRef()

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

    if (task.labels.includes(id)) {
      newTask.labels = task.labels.filter(l => l !== id)
    } else {
      newTask.labels.push(id)
    }

    setTask(newTask)
  }

  const handleKeyPress = event => {
    if (event.key === "Enter") {
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
    <div className="bg-slate-100 p-4 rounded-lg" ref={ref}>
      <div className="flex justify-between items-center">
        <input
          type="text"
          className="text-md font-bold"
          value={task.title}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={handleChange("title")}
          onKeyPress={handleKeyPress}
        />
        {open && (
          <Icon
            onClick={handleAdd}
            className="mb-3 text-slate-600 hover:text-slate-800"
            cursor="pointer"
            fontSize={24}
          />
        )}
      </div>

      {open && (
        <React.Fragment>
          <textarea
            rows={2}
            value={task.description}
            className="text-sm border-top w-full bg-transparent py-2 mb-10 outline-none resize-none border-top border-slate-200 placeholder-slate-400"
            placeholder="Brief description"
            onChange={handleChange("description")}
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
                    active={task.labels.includes(label.id)}
                    onClick={() => handleLabelClick(label.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  )
}

export default TaskInput
