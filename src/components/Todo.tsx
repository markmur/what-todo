import React from "react"
import cx from "classnames"
import { Box, Flex } from "rebass"
import colors from "../color-palette"

// utils
import { today, yesterday, formatDateHeading, getPastSevenDays } from "../utils"

// Hooks
import { useStorage } from "../context/StorageContext"
import useMedia, { Breakpoints } from "../hooks/media"

// Styles
import "../styles.scss"

// Types
import { Label, Task, Data } from "../index.d"

// Components
import TaskInput from "./TaskInput"
import List from "./List"
import Labels from "./Labels"
import Notes from "./Notes"
import Footer from "./Footer"

const getTasksFor = (date: string) => (data: Data): Task[] => {
  return data.tasks[date] ?? []
}

const getOlderTasks = (data: Data): Task[] => {
  const todayDateStr = today().toDateString()
  let list = []

  for (const [date, tasks] of Object.entries(data.tasks)) {
    if (date !== todayDateStr) {
      list = list.concat(tasks)
    }
  }

  return list
}

const mobilePadding = 3
const padding = 4
const paddingTop = 2

const Todo: React.FC = ({}) => {
  const breakpoint = useMedia()
  const {
    data,
    labelsById,
    addTask,
    updateTask,
    removeTask,
    markAsComplete,
    moveToToday,
    addLabel,
    updateLabel,
    removeLabel,
    updateNote,
    updateFilters
  } = useStorage()

  // Refs
  const heightRef = React.createRef<HTMLDivElement>()

  const todayDateStr = today().toDateString()
  const yesterdayDateStr = yesterday().toDateString()

  const [activeDay, setActiveDay] = React.useState(todayDateStr)
  const pastWeek = getPastSevenDays()

  const todaysTasks = getTasksFor(todayDateStr)(data)
  const yesterdaysTasks = getOlderTasks(data)

  // Move any pinned tasks to today
  yesterdaysTasks.map(task => {
    if (task.pinned) {
      moveToToday(task)
    }
  })

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
      addTask({
        ...task,
        created_at: new Date(created_at).toISOString()
      })
    },
    [addTask]
  )

  const handleUpdateTask = createCallback<Task>(updateTask)
  const handleRemoveTask = createCallback<Task>(removeTask)
  const handleMoveToToday = createCallback<Task>(moveToToday)

  // Label callbacks
  const handleAddLabel = createCallback<Label>(addLabel)
  const handleRemoveLabel = createCallback<Label>(removeLabel)
  const handleUpdateLabel = createCallback<Label>(updateLabel)

  // Notes callbacks
  const handleUpdateNote = React.useCallback(
    (note, date) => {
      updateNote(note, date)
    },
    [updateNote]
  )

  return (
    <main>
      <Flex>
        {breakpoint != Breakpoints.MOBILE && breakpoint != Breakpoints.TABLET && (
          <Flex
            width={[0, 1 / 3]}
            height="calc(100vh - 66px)"
            p={padding}
            pt={paddingTop}
            flexDirection="column"
          >
            <Box pb={1}>
              <h1>Older</h1>
              <h5>
                Older -{" "}
                {formatDateHeading(yesterdayDateStr, {
                  weekday: undefined,
                  year: undefined,
                  month: "long",
                  day: "numeric"
                })}
              </h5>
            </Box>
            <Box width={1} overflowY="auto" flex={2}>
              <Box>
                <List
                  tasks={yesterdaysTasks}
                  labels={labelsById}
                  filters={data.filters}
                  collapseCompleted
                  canPinTasks={false}
                  onFilter={updateFilters}
                  onUpdateTask={handleUpdateTask}
                  onRemoveTask={handleRemoveTask}
                  onMarkAsComplete={markAsComplete}
                  onMoveToToday={handleMoveToToday}
                />
              </Box>
            </Box>

            <Box pt={3}>
              <TaskInput
                placeholder="Forget something?"
                labels={data.labels}
                filters={data.filters}
                onAdd={task => handleAddTask(task, yesterday())}
              />
            </Box>
          </Flex>
        )}

        <Flex
          width={[1, 3 / 5, 1 / 3, 1 / 2]}
          px={[mobilePadding, padding]}
          pl={[mobilePadding, mobilePadding, 0]}
          pt={[paddingTop]}
          pb={[mobilePadding, padding]}
          height="calc(100vh - 66px)"
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
                filters={data.filters}
                onFilter={updateFilters}
                onPinTask={handleUpdateTask}
                onUpdateTask={handleUpdateTask}
                onRemoveTask={handleRemoveTask}
                onMarkAsComplete={markAsComplete}
              />
            </Box>
          </Box>

          <Box pt={3}>
            <TaskInput
              placeholder="Write a todo for today..."
              labels={data.labels}
              filters={data.filters}
              onAdd={task => handleAddTask(task, today())}
            />
          </Box>
        </Flex>

        {breakpoint != Breakpoints.MOBILE && (
          <Flex
            width={[0, 2 / 5, 1 / 3]}
            p={padding}
            pl={0}
            pt={paddingTop}
            height="calc(100vh - 66px)"
          >
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
                          hasNote: !!data.notes[day.date.toDateString()],
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
                    filters={data.filters}
                    onFilter={updateFilters}
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
