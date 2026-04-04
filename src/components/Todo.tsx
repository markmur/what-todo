// Styles
import "../styles.scss"

// Types
import type { Data, Task, Label as LabelType } from "../index.d"
import React, { PropsWithChildren, useCallback, useState } from "react"
// utils
import { formatDateHeading, today, yesterday } from "../utils"
import useMedia, { Breakpoints } from "../hooks/media"

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
import { AnimatePresence, motion } from "framer-motion"
import Header from "./Header"
import MobileDrawer from "./MobileDrawer"
import Settings from "./Settings"
import { useSettings } from "../context/SettingsContext"
import useResize from "../hooks/useResize"

function Title({ children }: PropsWithChildren) {
  return (
    <h1 className="text-4xl mt-4 mb-3 text-slate-300 dark:text-navy-500 font-bold">
      {children}
    </h1>
  )
}

function Subtitle({ children }: PropsWithChildren) {
  return (
    <h2 className="text-sm mb-4 text-slate-500 dark:text-navy-400">
      {children}
    </h2>
  )
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

// Content fade/slide animation shared by both sidebars
const contentTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] }

const Todo: React.FC = ({}) => {
  const breakpoint = useMedia()
  const { settings } = useSettings()
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

  const MIN_SIDEBAR_WIDTH = 0.2
  const defaultSidebarWidth = completed.collapsed ? 2 / 5 : 1 / 3
  const completedWidth = 1 / 3
  const [sidebarWidth, setSidebarWidth] = useState(
    Math.max(MIN_SIDEBAR_WIDTH, sidebar.width ?? defaultSidebarWidth)
  )

  React.useEffect(() => {
    if (sidebar.width != null) {
      setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, sidebar.width))
    }
  }, [sidebar.width])

  const { handleMouseDown: handleResizeMouseDown } = useResize({
    minWidth: 0.2,
    maxWidth: 0.45,
    onResize: setSidebarWidth,
    onResizeEnd: width => {
      updateSection("sidebar", { ...sidebar, width })
    }
  })

  const activeSidebarWidth = sidebar.collapsed ? 0 : sidebarWidth

  const grid = {
    completed: [0, completedWidth],
    focus: completed.collapsed
      ? sidebar.collapsed
        ? [1]
        : [1, 1 - activeSidebarWidth]
      : sidebar.collapsed
        ? [1, 1 - completedWidth]
        : [1, 1 - completedWidth - activeSidebarWidth],
    sidebar: [0, activeSidebarWidth]
  }

  const fullHeight = "calc(100dvh - 66px)"

  const isDesktop =
    breakpoint != Breakpoints.MOBILE && breakpoint != Breakpoints.TABLET

  const [drawerOpen, setDrawerOpen] = useState(false)

  const completedContent = !completed.collapsed && (
    <div
      className="flex-col bg-slate-50/60 dark:bg-navy-800 hidden md:flex"
      style={{
        width: `${(isDesktop ? grid.completed[1] : 0) * 100}%`,
        height: fullHeight,
        padding: 32,
        paddingTop: 8,
        overflow: "hidden"
      }}
    >
      <AnimatePresence>
        <motion.div
          key="completed-content"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={contentTransition}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden"
          }}
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

          <div className="w-full overflow-y-auto flex-1 min-h-0">
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
        </motion.div>
      </AnimatePresence>
    </div>
  )

  return (
    <>
      <Header
        onMenuClick={
          !isDesktop ? () => setDrawerOpen(prev => !prev) : undefined
        }
        taskCount={
          settings.showTaskCount
            ? todaysTasks.filter(t => !t.completed).length
            : undefined
        }
      />
      <main>
        <div className="flex">
          {isDesktop && completedContent}

          {isDesktop && (
            <div
              className={`flex items-center transition-opacity duration-200 ${
                completed.collapsed
                  ? "opacity-100"
                  : "opacity-0 hover:opacity-100"
              }`}
              style={{ height: fullHeight }}
            >
              <ToggleButton
                collapsed={completed.collapsed}
                side="left"
                onClick={() =>
                  updateSection("completed", {
                    collapsed: !completed.collapsed
                  })
                }
              />
            </div>
          )}

          <div
            className="flex flex-col"
            style={{
              width: `${grid.focus[isDesktop ? Math.min(grid.focus.length - 1, breakpoint) : 0] * 100}%`,
              paddingLeft: isDesktop ? 16 : 16,
              paddingRight: isDesktop ? 16 : 16,
              paddingTop: 8,
              paddingBottom: isDesktop ? 32 : 16,
              height: fullHeight
            }}
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
                hideCompleted={settings.moveCompletedToYesterday}
                onFilter={updateFilters}
                onUpdateTask={handleUpdateTask}
                onRemoveTask={handleRemoveTask}
                onMarkAsComplete={markAsComplete}
              />
            </div>

            <div className="pt-3 sticky bottom-0 bg-white dark:bg-navy-900 z-10">
              <TaskInput
                placeholder="Write a todo for today..."
                labels={data.labels}
                filters={data.filters}
                onAdd={task => handleAddTask(task, today())}
              />
            </div>
          </div>

          {isDesktop && (
            <div
              className={`flex items-center justify-center transition-opacity duration-200 ${
                sidebar.collapsed
                  ? "opacity-100"
                  : "opacity-0 hover:opacity-100"
              }`}
              style={{
                height: fullHeight,
                cursor: sidebar.collapsed ? undefined : "col-resize",
                width: sidebar.collapsed ? undefined : 8
              }}
              onMouseDown={
                sidebar.collapsed ? undefined : handleResizeMouseDown
              }
              onDoubleClick={() => {
                if (!sidebar.collapsed) {
                  setSidebarWidth(defaultSidebarWidth)
                  updateSection("sidebar", { ...sidebar, width: undefined })
                }
              }}
            >
              <div onMouseDown={e => e.stopPropagation()}>
                <ToggleButton
                  collapsed={sidebar.collapsed}
                  side="right"
                  onClick={() => {
                    const expanding = sidebar.collapsed
                    if (expanding) {
                      setSidebarWidth(
                        Math.max(
                          MIN_SIDEBAR_WIDTH,
                          sidebar.width ?? defaultSidebarWidth
                        )
                      )
                    }
                    updateSection("sidebar", {
                      ...sidebar,
                      collapsed: !sidebar.collapsed
                    })
                  }}
                />
              </div>
            </div>
          )}
          {isDesktop && !sidebar.collapsed && (
            <div
              className="bg-slate-50/60 dark:bg-navy-800 flex flex-col"
              style={{
                width: `${activeSidebarWidth * 100}%`,
                padding: 32,
                paddingTop: 8,
                height: fullHeight,
                overflow: "hidden"
              }}
            >
              <AnimatePresence>
                <motion.div
                  key="sidebar-content"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={contentTransition}
                  className="flex flex-col flex-grow justify-start"
                  style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
                >
                  <div className="pb-1">
                    <Title>Labels</Title>
                  </div>

                  <div className="flex-1 overflow-y-auto pb-2 min-h-0 pr-2">
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

                    <div className="mt-4">
                      <Settings labels={data.labels} />
                    </div>
                  </div>

                  <div className="h-[55px]">
                    <Footer />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {!isDesktop && (
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          footer={<Footer />}
        >
          <div className="pb-1">
            <Title>Labels</Title>
          </div>

          <div className="flex-1 overflow-y-auto pb-2">
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

            <div className="mt-4">
              <Settings labels={data.labels} />
            </div>
          </div>
        </MobileDrawer>
      )}
    </>
  )
}

export default Todo
