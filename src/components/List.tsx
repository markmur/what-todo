import React from "react"
import { Flex, Box } from "rebass"

import { Task, Label } from "../index.d"

interface Props {
  tasks?: Task[]
  labels: Record<string, Label>
  onRemoveTask: (task: Task) => void
  onMarkAsComplete: (task: Task) => void
}

const List: React.FC<Props> = ({
  tasks = [],
  labels,
  onRemoveTask,
  onMarkAsComplete
}) => (
  <ul>
    {tasks.map((task) => (
      <li className="task" key={task.id}>
        <Flex alignItems="flex-start" py={3}>
          <Box width={20} mr={2}>
            <input
              type="checkbox"
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
            {task.completed ? (
              <div>
                <s>{task.title}</s>
              </div>
            ) : (
              <input value={task.title} />
            )}

            {task.description && !task.completed && (
              <small className="description">{task.description}</small>
            )}
          </Box>

          {task.labels.map((id) => (
            <span
              key={id}
              className="circle"
              style={{ backgroundColor: labels[id]?.color }}
            />
          ))}

          <span className="remove-icon" onClick={() => onRemoveTask(task)}>
            x
          </span>
        </Flex>
      </li>
    ))}
  </ul>
)

export default List
