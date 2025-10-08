// Styles
import "../styles.scss"

// Types
import type {
  Data,
  IntermediateLabel,
  Label as LabelType,
  Note,
  Task
} from "../index.d"
import React, { PropsWithChildren } from "react"
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
import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight
} from "@meronex/icons/fi"

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

// Layout constants
const MOBILE_PADDING = 3
const PADDING = 4
const PADDING_TOP = 2
const FULL_HEIGHT = "calc(100dvh - 66px)"

const Todo: React.FC = () => {
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

  const todayDateStr = today().toDateString()
  // const yesterdayDateStr = yesterday().toDateString()

  const [activeDay, setActiveDay] = React.useState(todayDateStr)
  const pastWeek = getPastSevenDays()

  const todaysTasks = React.useMemo(
    () => getTasksFor(todayDateStr)(data),
    [todayDateStr, data]
  )
  const yesterdaysTasks = React.useMemo(() => getOlderTasks(data), [data])

  // Move any pinned tasks to today
  React.useEffect(() => {
    yesterdaysTasks.forEach(task => {
      if (task.pinned) {
        moveToToday(task)
      }
    })
  }, [yesterdaysTasks, moveToToday])

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

  const handleUpdateTask = React.useCallback(
    (task: Task) => updateTask(task),
    [updateTask]
  )
  const handleRemoveTask = React.useCallback(
    (task: Task) => removeTask(task),
    [removeTask]
  )
  const handleMoveToToday = React.useCallback(
    (task: Task) => moveToToday(task),
    [moveToToday]
  )

  // Label callbacks
  const handleAddLabel = React.useCallback(
    (label: IntermediateLabel) => addLabel(label as LabelType),
    [addLabel]
  )
  const handleRemoveLabel = React.useCallback(
    (label: LabelType) => removeLabel(label),
    [removeLabel]
  )
  const handleUpdateLabel = React.useCallback(
    (label: LabelType) => updateLabel(label),
    [updateLabel]
  )

  // Notes callbacks
  const handleUpdateNote = React.useCallback(
    (note: Note, date: string) => {
      updateNote(note, date)
    },
    [updateNote]
  )

  const completed = sections?.["completed"] ?? { collapsed: false }
  const notesSection = sections?.["notes"] ?? { collapsed: false }

  const grid = React.useMemo(
    () => ({
      completed: completed.collapsed ? [0, 0, 0, 1 / 12] : [0, 1 / 3],
      focus: completed.collapsed ? [1] : [1, 3 / 5, 1 / 3, 1 / 2],
      notes: completed.collapsed ? [0, 2 / 5, 2 / 5, 4 / 12] : [0, 2 / 5, 1 / 3]
    }),
    [completed.collapsed]
  )

  const completedCollapsed = (
    <Animate active={completed.collapsed ?? false}>
      <Flex
        width="80px"
        flexDirection="column"
        height={FULL_HEIGHT}
        justifyContent={"center"}
        marginRight={PADDING}
        className="cursor-pointer hover:text-slate-400 text-slate-300 border-r-[2px] border-slate-50 hover:bg-slate-50"
        onClick={() => updateSection("completed", { collapsed: false })}
      >
        <p className="rotate-90 origin-center text-l font-bold m-[-16px] p-0 whitespace-nowrap">
          Show completed
        </p>
      </Flex>
    </Animate>
  )

  const completedExpanded = (
    <Flex
      width={grid.completed}
      height={FULL_HEIGHT}
      p={PADDING}
      pt={PADDING_TOP}
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

  const notesCollapsed = (
    <Animate active={notesSection.collapsed ?? false}>
      <Flex
        width="80px"
        flexDirection="column"
        height={FULL_HEIGHT}
        justifyContent={"center"}
        className="cursor-pointer hover:text-slate-400 text-slate-300 border-l-[2px] border-slate-50 hover:bg-slate-50"
        onClick={() => updateSection("notes", { collapsed: false })}
      >
        <p className="rotate-90 origin-center text-l font-bold m-[-16px] p-0 whitespace-nowrap">
          Show notes
        </p>
      </Flex>
    </Animate>
  )

  const notesExpanded = (
    <Flex
      width={grid.notes}
      p={PADDING}
      pl={0}
      pt={PADDING_TOP}
      height={FULL_HEIGHT}
    >
      <div className="flex flex-col flex-grow justify-start">
        <div className="mb-1">
          <div
            className="pb-1"
            onClick={() => updateSection("notes", { collapsed: true })}
          >
            <Title>Notes</Title>
            <div className="flex items-center cursor-pointer">
              <div className="flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                Hide section <ArrowRight size={16} className="mr-1" />
              </div>
            </div>
          </div>

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

        <div className="flex-1 mb-4">
          <Notes
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
          px={[MOBILE_PADDING, PADDING]}
          pl={[MOBILE_PADDING, MOBILE_PADDING, 0]}
          pt={[PADDING_TOP]}
          pb={[MOBILE_PADDING, PADDING]}
          height={FULL_HEIGHT}
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

        {breakpoint != Breakpoints.MOBILE && breakpoint != Breakpoints.TABLET
          ? notesSection.collapsed
            ? notesCollapsed
            : notesExpanded
          : null}
      </div>
    </main>
  )
}

export default Todo
