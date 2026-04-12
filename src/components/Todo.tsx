// Types
import type {
  Data,
  Task,
  Label as LabelType,
  IntermediateLabel
} from "../index.d"
import React, { PropsWithChildren, useCallback, useState } from "react"
// utils
import { formatDateHeading, today } from "../utils"

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
import Header from "./Header"
import MobileDrawer from "./MobileDrawer"
import McpSetupSheet from "./McpSetupSheet"
import { useAuth } from "../context/AuthContext"
import Settings from "./Settings"
import { useSettings } from "../context/SettingsContext"
import useResize from "../hooks/useResize"
import Collapse from "./Collapse"
import ChevronDown from "@meronex/icons/fi/FiChevronDown"
import ChevronUp from "@meronex/icons/fi/FiChevronUp"
import SearchIcon from "@meronex/icons/fi/FiSearch"
import EditIcon from "@meronex/icons/fi/FiEdit2"
import MobileLabelFilter from "./MobileLabelFilter"
import CheckIcon from "@meronex/icons/fi/FiCheckCircle"
import Toast from "./Toast"
import LoadingSkeleton from "./LoadingSkeleton"
import useKeyboardAware from "../hooks/useKeyboardAware"

function Title({ children }: PropsWithChildren) {
  return (
    <h1 className="text-4xl mt-4 mb-3 text-slate-300 dark:text-navy-400 font-bold">
      {children}
    </h1>
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

const slideTransition =
  "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), right 0.3s cubic-bezier(0.4, 0, 0.2, 1)"

const Todo: React.FC = ({}) => {
  const { settings } = useSettings()
  useKeyboardAware()
  const {
    data,
    loading,
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
    updateSection,
    updateSections
  } = useStorage()

  const todayDateStr = today().toDateString()

  const todaysTasks = getTasksFor(todayDateStr)(data)
  const olderTasks = getOlderTasks(data)

  // Move any uncompleted older tasks to today
  olderTasks.map(task => {
    if (!task.completed) {
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
  const doRemoveTask = useAction<Task>(removeTask)
  const handleMoveToToday = useAction<Task>(moveToToday)

  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const deleteTimerRef = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)

  const handleRemoveTask = useCallback(
    (task: Task) => {
      if (!settings.undoOnDelete) {
        doRemoveTask(task)
        return
      }
      if (pendingDelete) {
        clearTimeout(deleteTimerRef.current)
        doRemoveTask(pendingDelete)
      }
      setPendingDelete(task)
      deleteTimerRef.current = setTimeout(() => {
        doRemoveTask(task)
        setPendingDelete(null)
      }, 5000)
    },
    [doRemoveTask, settings.undoOnDelete, pendingDelete]
  )

  const handleUndoDelete = useCallback(() => {
    clearTimeout(deleteTimerRef.current)
    setPendingDelete(null)
  }, [])

  const commitDelete = useCallback(() => {
    if (pendingDelete) {
      clearTimeout(deleteTimerRef.current)
      doRemoveTask(pendingDelete)
      setPendingDelete(null)
    }
  }, [pendingDelete, doRemoveTask])

  // Label callbacks
  const handleAddLabel = useCallback(
    (label: IntermediateLabel) => addLabel(label as LabelType),
    [addLabel]
  )
  const handleRemoveLabel = useAction<LabelType>(removeLabel)
  const handleUpdateLabel = useAction<LabelType>(updateLabel)

  const completed = sections?.["completed"] ?? { collapsed: false }
  const sidebar = sections?.["sidebar"] ?? { collapsed: false }

  const MIN_SIDEBAR_WIDTH = 0.2
  const defaultSidebarWidth = completed.collapsed ? 2 / 5 : 1 / 3
  const completedWidth = 1 / 2
  const [sidebarWidth, setSidebarWidth] = useState(
    Math.max(MIN_SIDEBAR_WIDTH, sidebar.width ?? defaultSidebarWidth)
  )

  React.useEffect(() => {
    if (sidebar.width != null) {
      setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, sidebar.width))
    }
  }, [sidebar.width])

  const [searchQuery, setSearchQuery] = useState("")
  const [editMode, setEditMode] = useState(false)
  const isMobile = React.useMemo(
    () => window.matchMedia("(pointer: coarse)").matches,
    []
  )

  const { handleMouseDown: handleResizeMouseDown } = useResize({
    minWidth: 0.2,
    maxWidth: 0.45,
    onResize: setSidebarWidth,
    onResizeEnd: width => {
      updateSection("sidebar", { ...sidebar, width })
    }
  })

  const activeSidebarWidth = sidebar.collapsed ? 0 : sidebarWidth

  const fullHeight = "100%"

  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 64em)").matches
  )

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 64em)")
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mcpOpen, setMcpOpen] = useState(false)
  const [labelsCollapsed, setLabelsCollapsed] = useState(false)
  const { user } = useAuth()

  const [mounted, setMounted] = useState(false)
  React.useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [])

  const focusLeft =
    isDesktop && !completed.collapsed ? `${completedWidth * 100}%` : "0"
  const focusRight =
    isDesktop && !sidebar.collapsed ? `${activeSidebarWidth * 100}%` : "0"

  const visibleTasks = React.useMemo(() => {
    let tasks = todaysTasks.filter(t => t.id !== pendingDelete?.id)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      tasks = tasks.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      )
    }
    return tasks
  }, [todaysTasks, pendingDelete, searchQuery])

  const isFiltering = searchQuery.length > 0 || data.filters.length > 0

  return (
    <>
      <Header
        onMenuClick={
          !isDesktop ? () => setDrawerOpen(prev => !prev) : undefined
        }
        completedCount={todaysTasks.filter(t => t.completed).length}
        totalCount={todaysTasks.length}
        date={formatDateHeading(todayDateStr)}
      />
      <main>
        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            overflow: "hidden"
          }}
        >
          {/* Completed section — fixed at left edge */}
          {isDesktop && (
            <div
              data-testid="completed-panel"
              className="flex-col bg-slate-100 dark:bg-navy-950 flex"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: `${completedWidth * 100}%`,
                height: fullHeight,
                padding: 16,
                paddingTop: 8,
                overflow: "hidden",
                pointerEvents: completed.collapsed ? "none" : "auto"
              }}
            >
              <div
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
                  {olderTasks.length === 0 ? (
                    <div className="text-slate-500 dark:text-navy-300 text-sm text-center flex flex-col items-center justify-center h-full gap-3">
                      <CheckIcon
                        fontSize={32}
                        className="text-slate-300 dark:text-navy-400"
                      />
                      Completed tasks will show up here a day after completion.
                    </div>
                  ) : (
                    <div>
                      <List
                        tasks={olderTasks.filter(
                          t => t.id !== pendingDelete?.id && t.completed
                        )}
                        labels={labelsById}
                        filters={data.filters}
                        collapseCompleted={true}
                        forceCompact={true}
                        canPinTasks={false}
                        canCollapse={false}
                        onFilter={updateFilters}
                        onUpdateTask={handleUpdateTask}
                        onRemoveTask={handleRemoveTask}
                        onMarkAsComplete={(task: Task) => {
                          if (task.completed) {
                            // Unchecking a completed task — move to today first, then toggle
                            handleMoveToToday({
                              ...task,
                              completed: false
                            })
                          } else {
                            markAsComplete(task)
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sidebar — fixed at right edge */}
          {isDesktop && (
            <div
              data-testid="settings-panel"
              className="bg-slate-50/60 dark:bg-navy-800 flex flex-col"
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: `${sidebarWidth * 100}%`,
                height: fullHeight,
                overflow: "hidden",
                padding: 32,
                paddingTop: 8,
                pointerEvents: sidebar.collapsed ? "none" : "auto"
              }}
            >
              <div
                className="flex flex-col grow justify-start"
                style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
              >
                <button
                  type="button"
                  className="no-style flex items-center cursor-pointer pb-1 w-full"
                  onClick={() => setLabelsCollapsed(!labelsCollapsed)}
                  aria-expanded={!labelsCollapsed}
                >
                  <Title>Labels</Title>
                  <span className="ml-1" aria-hidden="true">
                    {labelsCollapsed ? (
                      <ChevronDown
                        className="text-slate-300 dark:text-navy-400"
                        style={{ verticalAlign: "middle" }}
                      />
                    ) : (
                      <ChevronUp
                        className="text-slate-300 dark:text-navy-400"
                        style={{ verticalAlign: "middle" }}
                      />
                    )}
                  </span>
                </button>

                <div className="flex-1 overflow-y-auto pb-2 min-h-0 pr-2">
                  <Collapse open={!labelsCollapsed}>
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
                  </Collapse>

                  <div className="mt-4">
                    <Settings labels={data.labels} />
                  </div>
                </div>

                <div className="h-[55px]">
                  <Footer />
                </div>
              </div>
            </div>
          )}

          {/* Focus section — slides over sidebars */}
          <div
            className="flex flex-col bg-white dark:bg-navy-900"
            style={{
              position: isDesktop ? "absolute" : "relative",
              top: 0,
              left: isDesktop ? focusLeft : 0,
              right: isDesktop ? focusRight : 0,
              height: fullHeight,
              zIndex: 1,
              paddingTop: isDesktop ? 8 : 0,
              paddingBottom: 16,
              transition: isDesktop && mounted ? slideTransition : undefined
            }}
          >
            {/* Left toggle */}
            {isDesktop && (
              <div
                className={`transition-opacity duration-200 ${
                  completed.collapsed
                    ? "opacity-100"
                    : "opacity-0 hover:opacity-100"
                }`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: fullHeight,
                  display: "flex",
                  alignItems: "center",
                  zIndex: 2
                }}
              >
                <ToggleButton
                  collapsed={completed.collapsed}
                  side="left"
                  onClick={() => {
                    const expanding = completed.collapsed
                    if (expanding) {
                      updateSections({
                        completed: { collapsed: false },
                        sidebar: { ...sidebar, collapsed: true }
                      })
                    } else {
                      updateSection("completed", { collapsed: true })
                    }
                  }}
                />
              </div>
            )}

            {/* Right toggle / resize handle */}
            {isDesktop && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sidebar"
                className={`transition-opacity duration-200 ${
                  sidebar.collapsed
                    ? "opacity-100"
                    : "opacity-0 hover:opacity-100"
                }`}
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  height: fullHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: sidebar.collapsed ? undefined : "col-resize",
                  width: sidebar.collapsed ? undefined : 8,
                  zIndex: 2
                }}
                onMouseDown={
                  sidebar.collapsed ? undefined : handleResizeMouseDown
                }
                onDoubleClick={() => {
                  if (!sidebar.collapsed) {
                    setSidebarWidth(defaultSidebarWidth)
                    updateSection("sidebar", {
                      ...sidebar,
                      width: undefined
                    })
                  }
                }}
              >
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
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
                        updateSections({
                          sidebar: { ...sidebar, collapsed: false },
                          completed: { collapsed: true }
                        })
                      } else {
                        updateSection("sidebar", {
                          ...sidebar,
                          collapsed: true
                        })
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <section
              className="flex-1 overflow-y-auto min-h-0 px-3"
              aria-label="Task list"
            >
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  {data.filters.length > 0 && isDesktop && (
                    <div className="mt-2 mb-2">
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

                  {todaysTasks.length > 0 && (
                    <search className="mb-3 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <SearchIcon
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-navy-400 z-10"
                            fontSize={14}
                          />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Escape") setSearchQuery("")
                            }}
                            placeholder="Search tasks..."
                            className="w-full text-sm bg-slate-100/70 dark:bg-navy-800/70 backdrop-blur-md rounded-lg pl-8 pr-3 py-2.5 outline-none placeholder-slate-400 dark:placeholder-navy-400 dark:text-navy-100 border border-slate-200/50 dark:border-navy-700/50"
                          />
                        </div>
                        {isMobile && visibleTasks.length > 1 && (
                          <button
                            type="button"
                            aria-label={
                              editMode ? "Done editing" : "Edit task order"
                            }
                            className="no-style shrink-0 p-2 rounded-lg touch-target transition-colors"
                            style={editMode ? { color: "#3b82f6" } : undefined}
                            onClick={() => setEditMode(prev => !prev)}
                          >
                            <EditIcon fontSize={18} />
                          </button>
                        )}
                      </div>
                    </search>
                  )}

                  <List
                    tasks={visibleTasks}
                    labels={labelsById}
                    filters={data.filters}
                    isFiltering={isFiltering}
                    editMode={isMobile ? editMode : undefined}
                    onFilter={updateFilters}
                    onUpdateTask={handleUpdateTask}
                    onRemoveTask={handleRemoveTask}
                    onMarkAsComplete={markAsComplete}
                    onReorder={reordered => {
                      reordered.forEach(t => handleUpdateTask(t))
                    }}
                  />
                </>
              )}
            </section>

            <div className="pt-3 pb-4 px-3 bg-white dark:bg-navy-900">
              {!isDesktop && data.labels.length > 0 && (
                <div className="mb-2">
                  <MobileLabelFilter
                    labels={data.labels}
                    filters={data.filters}
                    onFilter={updateFilters}
                  />
                </div>
              )}
              <TaskInput
                placeholder="What needs to be done?"
                labels={data.labels}
                filters={data.filters}
                onAdd={task => handleAddTask(task, today())}
              />
            </div>
          </div>
        </div>
      </main>

      {!isDesktop && (
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={
            <button
              type="button"
              className="no-style flex items-center cursor-pointer"
              onClick={() => setLabelsCollapsed(!labelsCollapsed)}
              aria-expanded={!labelsCollapsed}
            >
              <h1 className="text-4xl text-slate-400 dark:text-navy-400 font-bold">
                Labels
              </h1>
              <span className="ml-1" aria-hidden="true">
                {labelsCollapsed ? (
                  <ChevronDown
                    className="text-slate-400 dark:text-navy-400"
                    style={{ verticalAlign: "middle" }}
                  />
                ) : (
                  <ChevronUp
                    className="text-slate-400 dark:text-navy-400"
                    style={{ verticalAlign: "middle" }}
                  />
                )}
              </span>
            </button>
          }
          footer={
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  setMcpOpen(true)
                }}
                className="no-style w-full text-left text-[13px] font-medium text-slate-500 dark:text-navy-300 hover:text-slate-600 dark:hover:text-navy-100 transition-colors py-1"
              >
                /mcp — Use with Claude
              </button>
              <Footer />
            </div>
          }
        >
          <div className="flex-1 overflow-y-auto pb-2">
            <Collapse open={!labelsCollapsed}>
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
            </Collapse>

            <div className="mt-4">
              <Settings labels={data.labels} />
            </div>
          </div>
        </MobileDrawer>
      )}

      <McpSetupSheet
        open={mcpOpen}
        onClose={() => setMcpOpen(false)}
        apiToken={user?.id ?? null}
      />

      {pendingDelete && (
        <Toast
          message={`"${pendingDelete.title}" deleted`}
          action={{ label: "Undo", onClick: handleUndoDelete }}
          onDismiss={commitDelete}
        />
      )}
    </>
  )
}

export default Todo
