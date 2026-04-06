import { Label as LabelType, Task as TaskType } from "../index.d"
import React, { useCallback, useRef } from "react"

// Icons
import CheckCircle from "@meronex/icons/fi/FiCheckCircle"
import ChevronDown from "@meronex/icons/fi/FiChevronDown"
import ChevronUp from "@meronex/icons/fi/FiChevronUp"
import Task from "./Task"
import cx from "classnames"
import useOnClickOutside from "../hooks/onclickoutside"
import { useSettings } from "../context/SettingsContext"
import {
  AnimatePresence,
  Reorder,
  motion,
  useDragControls
} from "framer-motion"
import GripIcon from "@meronex/icons/fi/FiMenu"
import Animate from "./Animate"

function ReorderableItem({
  task,
  children
}: {
  task: TaskType
  children: React.ReactNode
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      key={task.id}
      value={task}
      as="li"
      className="task flex items-start select-none"
      style={{ position: "relative" }}
      dragListener={false}
      dragControls={controls}
    >
      <div
        className="touch-target shrink-0 cursor-grab active:cursor-grabbing touch-none py-4 pr-1 text-slate-300 dark:text-navy-600"
        onPointerDown={e => {
          e.preventDefault()
          controls.start(e)
        }}
      >
        <GripIcon fontSize={14} />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </Reorder.Item>
  )
}

interface Props {
  tasks?: TaskType[]
  filters?: string[]
  labels: Record<string, LabelType>
  collapseCompleted?: boolean
  hideCompleted?: boolean
  isFiltering?: boolean
  forceCompact?: boolean
  canPinTasks?: boolean
  canCollapse?: boolean
  onFilter: (labelIds: string[]) => void
  onUpdateTask: (task: TaskType) => void
  onRemoveTask: (task: TaskType) => void
  onMarkAsComplete: (task: TaskType) => void
  onMoveToToday?: (task: TaskType) => void
  onReorder?: (tasks: TaskType[]) => void
}

const getFilteredTasks = (tasks: TaskType[], filters: string[]): TaskType[] => {
  if (!filters.length) {
    return tasks
  }

  // If more than one selected, filter by tasks with an OR condition
  if (filters.length > 1) {
    return tasks.filter(task => {
      return task.labels?.some(label => filters.includes(label))
    })
  }

  // By default include any task that includes a selected filter
  return tasks.filter(task => {
    for (const id of filters) {
      if (task.labels?.includes(id)) return true
    }

    return false
  })
}

const List: React.FC<Props> = ({
  filters = [],
  tasks = [],
  labels,
  collapseCompleted = true,
  hideCompleted = false,
  isFiltering = false,
  forceCompact = false,
  canPinTasks = true,
  onFilter,
  onUpdateTask,
  onRemoveTask,
  onMarkAsComplete,
  onMoveToToday,
  onReorder
}) => {
  const { settings } = useSettings()
  const selectedRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef<HTMLButtonElement>(null)
  const [selected, setSelected] = React.useState<TaskType["id"] | undefined>()
  const [collapsed, setCollapsed] = React.useState(collapseCompleted)
  const filteredTasks = getFilteredTasks(tasks, filters)

  function setSelectedTask(taskId: TaskType["id"] | undefined) {
    setSelected(taskId)
  }

  const [uncompleted, completed] = filteredTasks.reduce(
    (state, task) => {
      state[task.completed ? 1 : 0].push(task)
      return state
    },
    [[] as TaskType[], [] as TaskType[]]
  )

  uncompleted.sort((a, b) => {
    if (settings.sortBy === "created") {
      return a.created_at.localeCompare(b.created_at)
    }

    if (settings.sortBy === "label") {
      const aLabel = a.labels?.[0] ?? ""
      const bLabel = b.labels?.[0] ?? ""
      return (
        aLabel.localeCompare(bLabel) || a.created_at.localeCompare(b.created_at)
      )
    }

    const ap = typeof a.pinned === "boolean" ? +a.pinned : 0
    const bp = typeof b.pinned === "boolean" ? +b.pinned : 0
    if (ap !== bp) return bp - ap
    const ao = a.order ?? Infinity
    const bo = b.order ?? Infinity
    if (ao !== bo) return ao - bo
    if (ap && bp) return b.created_at.localeCompare(a.created_at)
    return a.created_at.localeCompare(b.created_at)
  })

  // Sort completed tasks by when they were completed
  completed.sort(
    (a, b) => Number(b.completed_at?.localeCompare(a.completed_at ?? "")) ?? 0
  )
  const hasCompletedTasks = !hideCompleted && completed.length > 0

  const clickOutsideHandler = () => {
    setTimeout(() => {
      setSelectedTask(undefined)
    })
  }

  useOnClickOutside(selectedRef, clickOutsideHandler)

  const handleFocus = useCallback(
    (taskId: string) => {
      if (selected !== taskId) {
        setSelectedTask(taskId)
      }
    },
    [selected]
  )

  const handleUpdate = useCallback(
    (task: TaskType) => onUpdateTask(task),
    [onUpdateTask]
  )

  const handleDeselect = () => {
    setSelectedTask(undefined)
    ;(document.activeElement as HTMLElement)?.blur()
  }

  const handleMarkAsComplete = (task: TaskType) => {
    onMarkAsComplete(task)
    handleDeselect()
  }

  const callbackHandlers = {
    onFilter: onFilter,
    onSelect: handleFocus,
    onUpdate: handleUpdate,
    onDeselect: handleDeselect,
    onRemoveTask: onRemoveTask,
    onMarkAsComplete: handleMarkAsComplete,
    onMoveToToday: onMoveToToday
  }

  const [localOrder, setLocalOrder] = React.useState(uncompleted)

  const uncompletedIds = uncompleted.map(t => t.id).join(",")
  React.useEffect(() => {
    setLocalOrder(uncompleted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uncompletedIds])

  const handleReorder = (reordered: TaskType[]) => {
    setLocalOrder(reordered)
    if (!onReorder) return
    const withOrder = reordered.map((t, i) => ({ ...t, order: i }))
    onReorder(withOrder)
  }

  return (
    <div
      ref={selectedRef}
      className="h-full"
      onPointerUp={e => {
        const target = e.target as HTMLElement
        if (!target.closest("[role='button'], [role='checkbox'], button, textarea, input, #actions")) {
          setSelectedTask(undefined)
        }
      }}
    >
      {uncompleted.length === 0 && !hasCompletedTasks && onReorder && (
        <div className="text-slate-400 dark:text-navy-400 text-sm text-center flex flex-col items-center justify-center h-full gap-3">
          <CheckCircle
            fontSize={48}
            className="text-slate-300 dark:text-navy-600"
          />
          <span>
            {isFiltering
              ? "No tasks found."
              : "Nothing to do — enjoy your day!"}
          </span>
        </div>
      )}

      {onReorder ? (
        <Reorder.Group
          axis="y"
          values={localOrder}
          onReorder={handleReorder}
          className={cx("task-list", {
            compact: forceCompact || settings.compactMode
          })}
          as="ul"
        >
          {localOrder.map(task => (
            <ReorderableItem key={task.id} task={task}>
              <Task
                {...callbackHandlers}
                active={task.id === selected}
                task={task}
                labels={labels}
                filters={filters}
                canPin={canPinTasks}
                compact={forceCompact || settings.compactMode}
              />
            </ReorderableItem>
          ))}
        </Reorder.Group>
      ) : (
        <ul
          className={cx("task-list", {
            compact: forceCompact || settings.compactMode
          })}
        >
          <AnimatePresence initial={false}>
            {uncompleted.map(task => (
              <motion.li
                key={task.id}
                className="task"
                layout
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Task
                  {...callbackHandlers}
                  active={task.id === selected}
                  task={task}
                  labels={labels}
                  filters={filters}
                  canPin={canPinTasks}
                  compact={forceCompact || settings.compactMode}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {hasCompletedTasks && (
        <button
          ref={completedRef}
          type="button"
          className={cx(
            "no-style flex mb-2 items-center cursor-pointer w-full",
            {
              "mt-10": uncompleted.length > 0,
              "mt-4": uncompleted.length === 0
            }
          )}
          onClick={() => {
            const expanding = collapsed
            setCollapsed(!collapsed)
            if (expanding) {
              setTimeout(() => {
                completedRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                })
              }, 250)
            }
          }}
          aria-expanded={!collapsed}
        >
          <h4 className="text-slate-600 hover:text-black dark:text-navy-400 dark:hover:text-navy-200 font-bold">
            {completed.length} Completed
          </h4>
          <span className="align-center" aria-hidden="true">
            {collapsed ? (
              <ChevronDown style={{ verticalAlign: "middle" }} />
            ) : (
              <ChevronUp style={{ verticalAlign: "middle" }} />
            )}
          </span>
        </button>
      )}

      <Animate active={!collapsed && hasCompletedTasks}>
        <ul
          className={cx("task-list", {
            compact: forceCompact || settings.compactMode
          })}
        >
          <AnimatePresence initial={false}>
            {completed.map(task => (
              <motion.li
                key={task.id}
                className="task"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <Task
                  {...callbackHandlers}
                  active={task.id === selected}
                  task={task}
                  canPin={canPinTasks}
                  labels={labels}
                  filters={filters}
                  compact={forceCompact || settings.compactMode}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Animate>
    </div>
  )
}

export default List
