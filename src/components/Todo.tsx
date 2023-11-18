// Styles
import "../styles.scss"

// Types
import type { Data, Task, Label as LabelType, Note } from "../index.d"
import React, { PropsWithChildren, useCallback } from "react"
// utils
import { formatDateHeading, getPastSevenDays, today, yesterday } from "../utils"
import useMedia, { Breakpoints } from "../hooks/media"

import { Flex } from "rebass"
import Footer from "./Footer"
import Labels from "./Labels"
import List from "./List"
import Notes from "./Notes"
// Components
import TaskInput from "./TaskInput"
import colors from "../color-palette"
import cx from "classnames"
// Hooks
import { useStorage } from "../context/StorageContext"
import Label from "./Label"
import Animate from "./Animate"
import { FiArrowLeft as ArrowLeft } from "@meronex/icons/fi"

function Title({ children }: PropsWithChildren) {
  return (
    <h1 className="text-4xl mt-4 mb-3 text-slate-300 font-bold">{children}</h1>
  )
}

function Subtitle({ children }: PropsWithChildren) {
  return <h2 className="text-sm mb-4 text-slate-500">{children}</h2>
}

const getTasksFor =
  (date: string) =>
  (data: Data): Task[] => {
    return data.tasks[date] ?? []
  }

const getOlderTasks = (data: Data): Task[] => {
  const todayDateStr = today().toDateString()
  let list: Task[] = []

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
    sections,
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
    updateFilters,
    updateSection
  } = useStorage()

  // Refs
  const heightRef = React.createRef<HTMLDivElement>()

  const todayDateStr = today().toDateString()
  // const yesterdayDateStr = yesterday().toDateString()

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

  function useAction<T>(fn: (item: T) => void) {
    return useCallback(
      (item: T) => {
        fn(item)
      },
      [fn]
    )
  }

  // Task callbacks
  const handleAddTask = React.useCallback(
    (task: Task, created_at: Date) => {
      addTask({
        ...task,
        created_at: new Date(created_at).toISOString()
      })
    },
    [addTask]
  )

  const handleUpdateTask = useAction<Task>(updateTask)
  const handleRemoveTask = useAction<Task>(removeTask)
  const handleMoveToToday = useAction<Task>(moveToToday)

  // Label callbacks
  const handleAddLabel = useAction<LabelType>(addLabel)
  const handleRemoveLabel = useAction<LabelType>(removeLabel)
  const handleUpdateLabel = useAction<LabelType>(updateLabel)

  // Notes callbacks
  const handleUpdateNote = React.useCallback(
    (note: Note, date: string) => {
      updateNote(note, date)
    },
    [updateNote]
  )

  const completed = sections?.["completed"] ?? { collapsed: false }

  const grid = {
    completed: completed.collapsed ? [0, 0, 0, 1 / 12] : [0, 1 / 3],
    focus: completed.collapsed
      ? [1, 3 / 5, 3 / 5, 7 / 12]
      : [1, 3 / 5, 1 / 3, 1 / 2],
    notes: completed.collapsed ? [0, 2 / 5, 2 / 5, 4 / 12] : [0, 2 / 5, 1 / 3]
  }

  const completedCollapsed = (
    <Animate active={completed.collapsed}>
      <Flex
        width={1}
        flexDirection="column"
        height="calc(100vh - 66px)"
        className="pr-8"
        onClick={() => updateSection("completed", { collapsed: false })}
      >
        <div className="border-r-slate-100  border-r-[2px] items-center flex col cursor-pointer hover:bg-slate-50 hover:text-slate-400 text-slate-300 max-h-fit flex-1">
          <p className="rotate-90 text-l flex items-center font-bold m-[-16px] p-0 whitespace-nowrap">
            Show completed
          </p>
        </div>
      </Flex>
    </Animate>
  )

  const completedExpanded = (
    <Flex
      width={grid.completed}
      height="calc(100vh - 66px)"
      p={padding}
      pt={paddingTop}
      flexDirection="column"
    >
      <div
        className="pb-1"
        onClick={() => updateSection("completed", { collapsed: true })}
      >
        <Title>Completed</Title>
        <div className="flex items-center cursor-pointer">
          <div className="flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
            <ArrowLeft size={16} className="mr-1" /> Hide section
          </div>
        </div>
      </div>

      {data.filters.length > 0 && (
        <div className="my-2">
          <small>Showing: </small>
          {data.filters.map(id => (
            <div className="inline mb-1 mr-1" key={id}>
              <Label
                active
                label={labelsById[id]}
                onRemove={() => {
                  updateFilters(data.filters.filter(x => x !== id))
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="w-full overflow-y-auto flex-[2]">
        <div>
          <List
            tasks={yesterdaysTasks}
            labels={labelsById}
            filters={data.filters}
            collapseCompleted={true}
            canPinTasks={false}
            canCollapse={false}
            onFilter={updateFilters}
            onUpdateTask={handleUpdateTask}
            onRemoveTask={handleRemoveTask}
            onMarkAsComplete={markAsComplete}
            onMoveToToday={handleMoveToToday}
          />
        </div>
      </div>

      <div className="pt-3">
        <TaskInput
          placeholder="Forget something?"
          labels={data.labels}
          filters={data.filters}
          onAdd={task => handleAddTask(task, yesterday())}
        />
      </div>
    </Flex>
  )

  return (
    <main>
      <div className="flex">
        {breakpoint != Breakpoints.MOBILE && breakpoint != Breakpoints.TABLET
          ? completed.collapsed
            ? completedCollapsed
            : completedExpanded
          : null}

        <Flex
          width={grid.focus}
          px={[mobilePadding, padding]}
          pl={[mobilePadding, mobilePadding, 0]}
          pt={[paddingTop]}
          pb={[mobilePadding, padding]}
          height="calc(100vh - 66px)"
          flexDirection="column"
        >
          <div className="pb-1">
            <Title>Focus</Title>
            <Subtitle>{formatDateHeading(todayDateStr)}</Subtitle>
          </div>

          {data.filters.length > 0 && (
            <div className="my-2">
              <small>Showing: </small>
              {data.filters.map(id => (
                <div className="inline mb-1 mr-1" key={id}>
                  <Label
                    active
                    label={labelsById[id]}
                    onRemove={() => {
                      updateFilters(data.filters.filter(x => x !== id))
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="w-full flex-[2] overflow-y-scroll">
            <List
              tasks={todaysTasks}
              labels={labelsById}
              filters={data.filters}
              onFilter={updateFilters}
              onUpdateTask={handleUpdateTask}
              onRemoveTask={handleRemoveTask}
              onMarkAsComplete={markAsComplete}
            />
          </div>

          <div className="pt-3">
            <TaskInput
              placeholder="Write a todo for today..."
              labels={data.labels}
              filters={data.filters}
              onAdd={task => handleAddTask(task, today())}
            />
          </div>
        </Flex>

        {breakpoint != Breakpoints.MOBILE && (
          <Flex
            width={grid.notes}
            p={padding}
            pl={0}
            pt={paddingTop}
            height="calc(100vh - 66px)"
          >
            <div className="flex flex-col flex-grow justify-start">
              <div className="mb-1">
                <Title>Notes</Title>

                <div className="flex w-full">
                  {pastWeek.map(day => (
                    <div
                      className="flex-1 pb-1"
                      key={day.number}
                      onClick={() => setActiveDay(day.date.toDateString())}
                    >
                      <div
                        className={cx("calendar-day p-1", {
                          active: day.date.toDateString() === activeDay,
                          hasNote: !!data.notes[day.date.toDateString()],
                          today: day.isToday
                        })}
                      >
                        <div>
                          <small>{day.name}</small>
                        </div>
                        <div>
                          <em>{day.number}</em>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 mb-4" ref={heightRef}>
                <Notes
                  heightRef={heightRef}
                  note={data.notes[activeDay] || ""}
                  onChange={note => handleUpdateNote(note, activeDay)}
                />
              </div>

              <div className="flex flex-col h-[34%]">
                <Title>Labels</Title>

                <div className="flex-1 overflow-y-scroll pb-2">
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
                </div>
              </div>

              <div className="h-[55px]">
                <Footer />
              </div>
            </div>
          </Flex>
        )}
      </div>
    </main>
  )
}

export default Todo
