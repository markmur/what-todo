// Styles
import "../styles.scss"

// Types
import type { Data, Task, Label as LabelType } from "../index.d"
import React, { PropsWithChildren, useCallback } from "react"
// utils
import { formatDateHeading, today, yesterday } from "../utils"
import useMedia, { Breakpoints } from "../hooks/media"

import { Flex } from "rebass"
import Footer from "./Footer"
import Labels from "./Labels"
import List from "./List"
// Components
import TaskInput from "./TaskInput"
import colors from "../color-palette"
// Hooks
import { useStorage } from "../context/StorageContext"
import Label from "./Label"
import ToggleButton from "./ToggleButton"

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
    updateFilters,
    updateSection
  } = useStorage()

  const todayDateStr = today().toDateString()

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

  const completed = sections?.["completed"] ?? { collapsed: false }
  const sidebar = sections?.["sidebar"] ?? { collapsed: false }

  // When a section is collapsed, its content is unmounted and only the toggle
  // button remains. The grid fractions must account for this: collapsed sections
  // contribute no width, and the remaining sections fill the space.
  const grid = {
    completed: [0, 1 / 3],
    focus: completed.collapsed
      ? [1]                                         // completed collapsed: focus fills
      : sidebar.collapsed
        ? [1, 2 / 3]                                // sidebar collapsed: completed 1/3 + focus 2/3
        : [1, 3 / 5, 1 / 3, 1 / 2],                // both expanded
    sidebar: completed.collapsed
      ? [0, 2 / 5, 2 / 5, 4 / 12]                  // completed collapsed
      : [0, 2 / 5, 1 / 3]                           // completed expanded
  }

  const fullHeight = "calc(100dvh - 66px)"

  const completedContent = !completed.collapsed && (
    <Flex
      width={grid.completed}
      height={fullHeight}
      p={padding}
      pt={paddingTop}
      flexDirection="column"
      className="bg-slate-50/60"
    >
      <div className="pb-1">
        <Title>Completed</Title>
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

  const completedToggle = (
    <div className="flex items-center" style={{ height: fullHeight }}>
      <ToggleButton
        collapsed={completed.collapsed}
        side="left"
        onClick={() => updateSection("completed", { collapsed: !completed.collapsed })}
      />
    </div>
  )

  return (
    <main>
      <div className="flex">
        {breakpoint != Breakpoints.MOBILE && breakpoint != Breakpoints.TABLET
          ? <>{completedContent}{completedToggle}</>
          : null}

        <Flex
          width={grid.focus}
          px={[mobilePadding, padding]}
          pl={[mobilePadding, mobilePadding, 0]}
          pt={[paddingTop]}
          pb={[mobilePadding, padding]}
          height={fullHeight}
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

        {breakpoint != Breakpoints.MOBILE && breakpoint != Breakpoints.TABLET && (
          <>
            <div className="flex items-center" style={{ height: fullHeight }}>
              <ToggleButton
                collapsed={sidebar.collapsed}
                side="right"
                onClick={() => updateSection("sidebar", { collapsed: !sidebar.collapsed })}
              />
            </div>
            {!sidebar.collapsed && (
              <Flex
                width={grid.sidebar}
                p={padding}
                pt={paddingTop}
                height={fullHeight}
                className="bg-slate-50/60"
              >
                <div className="flex flex-col flex-grow justify-start">
                  <div className="pb-1">
                    <Title>Labels</Title>
                  </div>

                  <div className="flex-1 overflow-y-scroll pb-2">
                    <Labels
                      labels={data.labels}
                      limit={15}
                      colors={colors}
                      filters={data.filters}
                      onFilter={updateFilters}
                      onAddLabel={handleAddLabel}
                      onUpdateLabel={handleUpdateLabel}
                      onRemoveLabel={handleRemoveLabel}
                    />
                  </div>

                  <div className="h-[55px]">
                    <Footer />
                  </div>
                </div>
              </Flex>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default Todo
