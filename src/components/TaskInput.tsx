import React from "react"
import { Flex, Box } from "rebass"
import { FiPlusCircle as PlusIcon } from "react-icons/fi"

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
  }, [filters])

  const clearTask = () => {
    setTask({
      ...task,
      title: "",
      description: ""
    })
  }

  const handleChange = (field: keyof Task) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
    <Box className="task-input" backgroundColor="#eee" p={1} px={3} ref={ref}>
      <Flex justifyContent="space-between" alignItems="center">
        <input
          type="text"
          className="task-title"
          value={task.title}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={handleChange("title")}
          onKeyPress={handleKeyPress}
        />
        {open && (
          <PlusIcon onClick={handleAdd} cursor="pointer" fontSize={24} />
        )}
      </Flex>

      {open && (
        <React.Fragment>
          <Box>
            <textarea
              rows={2}
              value={task.description}
              className="task-description"
              placeholder="Brief description"
              onChange={handleChange("description")}
            />
          </Box>

          <Box>
            <Box mb={2}>
              <label htmlFor="">Labels</label>
            </Box>
            <Box>
              {labels.map(label => (
                <Box display="inline-flex" key={label.id} mr={1}>
                  <Label
                    label={label}
                    active={task.labels.includes(label.id)}
                    onClick={() => handleLabelClick(label.id)}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </React.Fragment>
      )}
    </Box>
  )
}

export default TaskInput
