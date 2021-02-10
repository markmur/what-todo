import React from "react"
import { Box, Flex } from "rebass"
import colors from "../color-palette"

// Hooks
import { today, yesterday, formatDateHeading } from "../utils"

// Styles
import "../styles.scss"

// Types
import { Label, Task, Data, IntermediateLabel } from "../index.d"

// Components
import TaskInput from "@src/components/TaskInput"
import List from "@src/components/List"
import Labels from "@src/components/Labels"

const getTasksFor = (date: string) => (data: Data): Task[] => {
  return data.tasks.filter(
    task => date === new Date(task.created_at).toDateString()
  )
}

const getTasksForToday = getTasksFor(today().toDateString())
const getTasksForYesterday = getTasksFor(yesterday().toDateString())

const padding = 4

interface Props {
  data: Data
  labelsById: Record<string, Label>
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  onRemoveTask: (task: Task) => void
  onMarkAsComplete: (task: Task) => void
  onAddLabel: (label: IntermediateLabel) => void
  onUpdateLabel: (label: Label) => void
  onRemoveLabel: (label: Label) => void
}

const Todo: React.FC<Props> = ({
  data,
  labelsById,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onMarkAsComplete,
  onAddLabel,
  onUpdateLabel,
  onRemoveLabel
}: Props) => {
  const todaysTasks = getTasksForToday(data)
  const yesterdaysTasks = getTasksForYesterday(data)

  function createCallback<T>(fn: (item: T) => void) {
    return React.useCallback(
      (item: T) => {
        fn(item)
      },
      [fn]
    )
  }

  // Task callbacks
  const handleAddTask = React.useCallback(
    (task, created_at) => {
      onAddTask({
        ...task,
        created_at
      })
    },
    [onAddTask]
  )

  const handleUpdateTask = createCallback<Task>(onUpdateTask)
  const handleRemoveTask = createCallback<Task>(onRemoveTask)

  // Label callbacks
  const handleAddLabel = createCallback<Label>(onAddLabel)
  const handleRemoveLabel = createCallback<Label>(onRemoveLabel)
  const handleUpdateLabel = createCallback<Label>(onUpdateLabel)

  return (
    <main>
      <Flex>
        <Flex width={1 / 3} height="100vh" p={padding} flexDirection="column">
          <Box pb={1}>
            <h1>Yesterday</h1>
            <h5>{formatDateHeading(yesterday().toDateString())}</h5>
          </Box>
          <Box width={1} overflowY="auto" flex={2}>
            <Box>
              <List
                tasks={yesterdaysTasks}
                labels={labelsById}
                onUpdateTask={handleUpdateTask}
                onRemoveTask={handleRemoveTask}
                onMarkAsComplete={onMarkAsComplete}
              />
            </Box>
          </Box>

          <Box pt={3}>
            <TaskInput
              placeholder="Forget something?"
              labels={data.labels}
              onAdd={task => handleAddTask(task, yesterday().toISOString())}
            />
          </Box>
        </Flex>

        <Flex
          width={[1 / 3, 1 / 3, 1 / 2]}
          p={padding}
          pl={0}
          height="100vh"
          flexDirection="column"
        >
          <Box pb={1}>
            <h1>Today</h1>
            <h5>{formatDateHeading(today().toDateString())}</h5>
          </Box>
          <Box width={1} overflowY="auto" flex={2}>
            <Box>
              <List
                tasks={todaysTasks}
                labels={labelsById}
                onUpdateTask={handleUpdateTask}
                onRemoveTask={handleRemoveTask}
                onMarkAsComplete={onMarkAsComplete}
              />
            </Box>
          </Box>

          <Box pt={3}>
            <TaskInput
              placeholder="Write a todo for today..."
              labels={data.labels}
              onAdd={task => handleAddTask(task, today().toDateString())}
            />
          </Box>
        </Flex>

        <Flex width={[1 / 4, 1 / 4, 1 / 3]} p={padding} pl={0} height="100vh">
          <Flex flexDirection="column" flexGrow={1} justifyContent="flex-start">
            <Box flex={1} mb={padding}>
              <h1>Notes</h1>
              <textarea rows={25} placeholder="Notes" className="notes-input" />
            </Box>

            <Flex flexDirection="column" maxHeight="50%">
              <h1>Labels</h1>

              <Box flex={1} overflowY="scroll">
                <Labels
                  labels={data.labels}
                  limit={10}
                  colors={colors}
                  onAddLabel={handleAddLabel}
                  onUpdateLabel={handleUpdateLabel}
                  onRemoveLabel={handleRemoveLabel}
                />
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </main>
  )
}

export default Todo
