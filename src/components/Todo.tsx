import React from "react"
import cx from "classnames"
import { Box, Flex } from "rebass"
import colors from "../color-palette"

// Hooks
import { today, yesterday, formatDateHeading } from "../utils"
import useMedia, { Breakpoints } from "@src/hooks/media"

// Styles
import "../styles.scss"

// Types
import { Label, Task, Data, IntermediateLabel, Note, Day } from "../index.d"

// Components
import TaskInput from "@src/components/TaskInput"
import List from "@src/components/List"
import Labels from "@src/components/Labels"
import Notes from "./Notes"
import Footer from "./Footer"

const getTasksFor = (date: string) => (data: Data): Task[] => {
  return data.tasks[date] ?? []
}

const mobilePadding = 3
const padding = 4

interface Props {
  data: Data
  pastWeek: Day[]
  labelsById: Record<string, Label>
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  onRemoveTask: (task: Task) => void
  onMarkAsComplete: (task: Task) => void
  onMoveToToday: (task: Task) => void
  onAddLabel: (label: IntermediateLabel) => void
  onUpdateLabel: (label: Label) => void
  onRemoveLabel: (label: Label) => void
  onUpdateNote: (note: Note, date: string) => void
}

const Todo: React.FC<Props> = ({
  data,
  pastWeek,
  labelsById,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onMarkAsComplete,
  onMoveToToday,
  onAddLabel,
  onUpdateLabel,
  onRemoveLabel,
  onUpdateNote
}: Props) => {
  // Hooks
  const breakpoint = useMedia()

  // Refs
  const heightRef = React.createRef<HTMLDivElement>()

  const todayDateStr = today().toDateString()
  const yesterdayDateStr = yesterday().toDateString()

  const [filters, setFilters] = React.useState<string[]>([])
  const [activeDay, setActiveDay] = React.useState(todayDateStr)

  const todaysTasks = getTasksFor(todayDateStr)(data)
  const yesterdaysTasks = getTasksFor(yesterdayDateStr)(data)

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
        created_at: new Date(created_at).toISOString()
      })
    },
    [onAddTask]
  )

  const handleUpdateTask = createCallback<Task>(onUpdateTask)
  const handleRemoveTask = createCallback<Task>(onRemoveTask)
  const handleMoveToToday = createCallback<Task>(onMoveToToday)

  // Label callbacks
  const handleAddLabel = createCallback<Label>(onAddLabel)
  const handleRemoveLabel = createCallback<Label>(onRemoveLabel)
  const handleUpdateLabel = createCallback<Label>(onUpdateLabel)

  // Notes callbacks
  const handleUpdateNote = React.useCallback(
    (note, date) => {
      onUpdateNote(note, date)
    },
    [onUpdateNote]
  )

  return (
    <main>
      <Flex>
        {breakpoint != Breakpoints.MOBILE && breakpoint != Breakpoints.TABLET && (
          <Flex
            width={[0, 1 / 3]}
            height="100vh"
            p={padding}
            flexDirection="column"
          >
            <Box pb={1}>
              <h1>Yesterday</h1>
              <h5>{formatDateHeading(yesterdayDateStr)}</h5>
            </Box>
            <Box width={1} overflowY="auto" flex={2}>
              <Box>
                <List
                  tasks={yesterdaysTasks}
                  labels={labelsById}
                  filters={filters}
                  onFilter={setFilters}
                  onUpdateTask={handleUpdateTask}
                  onRemoveTask={handleRemoveTask}
                  onMarkAsComplete={onMarkAsComplete}
                  onMoveToToday={handleMoveToToday}
                />
              </Box>
            </Box>

            <Box pt={3}>
              <TaskInput
                placeholder="Forget something?"
                labels={data.labels}
                filters={filters}
                onAdd={task => handleAddTask(task, yesterday())}
              />
            </Box>
          </Flex>
        )}

        <Flex
          width={[1, 3 / 5, 1 / 3, 1 / 2]}
          p={[mobilePadding, padding]}
          pl={[mobilePadding, mobilePadding, 0]}
          height="100vh"
          flexDirection="column"
        >
          <Box pb={1}>
            <h1>Today</h1>
            <h5>{formatDateHeading(todayDateStr)}</h5>
          </Box>
          <Box width={1} overflowY="auto" flex={2}>
            <Box>
              <List
                tasks={todaysTasks}
                labels={labelsById}
                filters={filters}
                onFilter={setFilters}
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
              filters={filters}
              onAdd={task => handleAddTask(task, today())}
            />
          </Box>
        </Flex>

        {breakpoint != Breakpoints.MOBILE && (
          <Flex width={[0, 2 / 5, 1 / 3]} p={padding} pl={0} height="100vh">
            <Flex
              flexDirection="column"
              flexGrow={1}
              justifyContent="flex-start"
            >
              <Box mb={1}>
                <h1>Notes</h1>

                <Flex width="100%">
                  {pastWeek.map(day => (
                    <Box
                      pb={1}
                      key={day.number}
                      flex={1}
                      onClick={() => setActiveDay(day.date.toDateString())}
                    >
                      <Box
                        className={cx("calendar-day", {
                          active: day.date.toDateString() === activeDay,
                          today: day.isToday
                        })}
                        p={1}
                      >
                        <div>
                          <small>{day.name}</small>
                        </div>
                        <div>
                          <em>{day.number}</em>
                        </div>
                      </Box>
                    </Box>
                  ))}
                </Flex>
              </Box>

              <Box ref={heightRef} flex={1} mb={4}>
                <Notes
                  heightRef={heightRef}
                  note={data.notes[activeDay] || ""}
                  onChange={note => handleUpdateNote(note, activeDay)}
                />
              </Box>

              <Flex flexDirection="column" height="34%">
                <h1>Labels</h1>

                <Box flex={1} overflowY="scroll" pb={2}>
                  <Labels
                    labels={data.labels}
                    limit={10}
                    colors={colors}
                    filters={filters}
                    onFilter={setFilters}
                    onAddLabel={handleAddLabel}
                    onUpdateLabel={handleUpdateLabel}
                    onRemoveLabel={handleRemoveLabel}
                  />
                </Box>
              </Flex>

              <Box height="55px">
                <Footer />
              </Box>
            </Flex>
          </Flex>
        )}
      </Flex>
    </main>
  )
}

export default Todo
