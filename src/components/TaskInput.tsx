import React from "react"
import { Flex, Box } from "rebass"
import { FiPlusCircle as PlusIcon } from "react-icons/fi"

import { Label as LabelType, Task } from "../index.d"
import useOnClickOutside from "../hooks/onclickoutside"
import Label from "./Label"

const emptyTask = {
  title: "",
  description: "",
  labels: []
}

const validTask = (task: Partial<Task>): boolean => {
  return task.title.trim().length > 0
}

interface Props {
  placeholder: string
  labels: LabelType[]
  onAdd: (task: Task) => void
}

const TaskInput: React.FC<Props> = ({ placeholder, labels, onAdd }) => {
  const ref = React.useRef()

  const [task, setTask] = React.useState<Partial<Task>>(emptyTask)
  const [open, setOpen] = React.useState(false)

  useOnClickOutside(ref, () => setOpen(false))

  const clearTask = () => {
    setTask({
      title: "",
      description: "",
      labels: []
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
            <label htmlFor="">Labels</label>
            <Box>
              {labels.map(label => (
                <Label
                  key={label.id}
                  label={label}
                  active={task.labels.includes(label.id)}
                  onClick={() => handleLabelClick(label.id)}
                />
              ))}
            </Box>
          </Box>
        </React.Fragment>
      )}
    </Box>
  )
}

export default TaskInput
