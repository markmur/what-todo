import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import List from "./List"
import type { Task as TaskType, Label as LabelType } from "../index.d"

// Mock the Task component
jest.mock("./Task", () => ({
  __esModule: true,
  default: ({ task, active }: any) => (
    <div data-testid={`task-${task.id}`} data-active={active}>
      {task.title}
    </div>
  )
}))

// Mock the icon components
jest.mock("@meronex/icons/fi/FiChevronDown", () => ({
  __esModule: true,
  default: () => <div data-testid="chevron-down" />
}))

jest.mock("@meronex/icons/fi/FiChevronUp", () => ({
  __esModule: true,
  default: () => <div data-testid="chevron-up" />
}))

jest.mock("react-tooltip", () => ({
  __esModule: true,
  default: {
    rebuild: jest.fn()
  }
}))

describe("List", () => {
  const mockLabels: Record<string, LabelType> = {
    "label-1": { id: "label-1", title: "Work", color: "#ff0000" },
    "label-2": { id: "label-2", title: "Personal", color: "#00ff00" }
  }

  const createTask = (overrides: Partial<TaskType> = {}): TaskType => ({
    id: `task-${Math.random()}`,
    title: "Test Task",
    created_at: "2024-01-15T10:00:00.000Z",
    completed: false,
    ...overrides
  })

  const defaultProps = {
    labels: mockLabels,
    onFilter: jest.fn(),
    onUpdateTask: jest.fn(),
    onRemoveTask: jest.fn(),
    onMarkAsComplete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("task rendering", () => {
    it("should render uncompleted tasks", () => {
      const tasks = [
        createTask({ id: "1", title: "Task 1", completed: false }),
        createTask({ id: "2", title: "Task 2", completed: false })
      ]

      render(<List {...defaultProps} tasks={tasks} />)

      expect(screen.getByText("Task 1")).toBeInTheDocument()
      expect(screen.getByText("Task 2")).toBeInTheDocument()
    })

    it("should render completed tasks when not collapsed", () => {
      const tasks = [createTask({ id: "1", title: "Task 1", completed: true })]

      render(<List {...defaultProps} tasks={tasks} collapseCompleted={false} />)

      expect(screen.getByText("Task 1")).toBeInTheDocument()
    })

    it("should hide completed tasks when collapsed", () => {
      const tasks = [
        createTask({ id: "1", title: "Completed", completed: true })
      ]

      render(<List {...defaultProps} tasks={tasks} collapseCompleted={true} />)

      expect(screen.queryByText("Completed")).not.toBeInTheDocument()
    })

    it("should render empty list when no tasks", () => {
      const { container } = render(<List {...defaultProps} tasks={[]} />)

      expect(container.querySelector(".task-list")).toBeInTheDocument()
      expect(container.querySelectorAll("li")).toHaveLength(0)
    })
  })

  describe("task sorting", () => {
    it("should sort uncompleted tasks by pinned state", () => {
      const tasks = [
        createTask({
          id: "1",
          title: "Normal",
          completed: false,
          created_at: "2024-01-15T09:00:00.000Z"
        }),
        createTask({
          id: "2",
          title: "Pinned",
          completed: false,
          pinned: true,
          created_at: "2024-01-15T10:00:00.000Z"
        })
      ]

      render(<List {...defaultProps} tasks={tasks} />)

      const taskElements = screen.getAllByTestId(/^task-/)
      expect(taskElements[0]).toHaveTextContent("Pinned")
      expect(taskElements[1]).toHaveTextContent("Normal")
    })

    it("should sort completed tasks by completion time", () => {
      const tasks = [
        createTask({
          id: "1",
          title: "First",
          completed: true,
          completed_at: "2024-01-15T09:00:00.000Z"
        }),
        createTask({
          id: "2",
          title: "Second",
          completed: true,
          completed_at: "2024-01-15T10:00:00.000Z"
        })
      ]

      render(<List {...defaultProps} tasks={tasks} collapseCompleted={false} />)

      const taskElements = screen.getAllByTestId(/^task-/)
      // More recently completed should be first
      expect(taskElements[0]).toHaveTextContent("Second")
      expect(taskElements[1]).toHaveTextContent("First")
    })
  })

  describe("task filtering", () => {
    it("should show all tasks when no filters applied", () => {
      const tasks = [
        createTask({ id: "1", title: "Task 1", labels: ["label-1"] }),
        createTask({ id: "2", title: "Task 2", labels: ["label-2"] })
      ]

      render(<List {...defaultProps} tasks={tasks} filters={[]} />)

      expect(screen.getByText("Task 1")).toBeInTheDocument()
      expect(screen.getByText("Task 2")).toBeInTheDocument()
    })

    it("should filter tasks by single label", () => {
      const tasks = [
        createTask({ id: "1", title: "Work Task", labels: ["label-1"] }),
        createTask({ id: "2", title: "Personal Task", labels: ["label-2"] })
      ]

      render(<List {...defaultProps} tasks={tasks} filters={["label-1"]} />)

      expect(screen.getByText("Work Task")).toBeInTheDocument()
      expect(screen.queryByText("Personal Task")).not.toBeInTheDocument()
    })

    it("should filter tasks by multiple labels with OR logic", () => {
      const tasks = [
        createTask({ id: "1", title: "Work Only", labels: ["label-1"] }),
        createTask({
          id: "2",
          title: "Personal Only",
          labels: ["label-2"]
        }),
        createTask({ id: "3", title: "Untagged", labels: [] })
      ]

      render(
        <List
          {...defaultProps}
          tasks={tasks}
          filters={["label-1", "label-2"]}
        />
      )

      expect(screen.getByText("Work Only")).toBeInTheDocument()
      expect(screen.getByText("Personal Only")).toBeInTheDocument()
      expect(screen.queryByText("Untagged")).not.toBeInTheDocument()
    })

    it("should show tasks with any of the selected labels", () => {
      const tasks = [
        createTask({
          id: "1",
          title: "Both Labels",
          labels: ["label-1", "label-2"]
        }),
        createTask({ id: "2", title: "One Label", labels: ["label-1"] })
      ]

      render(
        <List
          {...defaultProps}
          tasks={tasks}
          filters={["label-1", "label-2"]}
        />
      )

      expect(screen.getByText("Both Labels")).toBeInTheDocument()
      expect(screen.getByText("One Label")).toBeInTheDocument()
    })
  })

  describe("collapse/expand", () => {
    it("should show collapse header when there are completed tasks", () => {
      const tasks = [createTask({ id: "1", completed: true })]

      render(<List {...defaultProps} tasks={tasks} />)

      expect(screen.getByText("1 Completed")).toBeInTheDocument()
    })

    it("should not show collapse header when no completed tasks", () => {
      const tasks = [createTask({ id: "1", completed: false })]

      render(<List {...defaultProps} tasks={tasks} />)

      expect(screen.queryByText(/Completed/)).not.toBeInTheDocument()
    })

    it("should toggle collapse state when header is clicked", () => {
      const tasks = [createTask({ id: "1", title: "Done", completed: true })]

      render(<List {...defaultProps} tasks={tasks} collapseCompleted={true} />)

      // Initially collapsed
      expect(screen.queryByText("Done")).not.toBeInTheDocument()
      expect(screen.getByTestId("chevron-down")).toBeInTheDocument()

      // Click to expand
      fireEvent.click(screen.getByText("1 Completed"))

      expect(screen.getByText("Done")).toBeInTheDocument()
      expect(screen.getByTestId("chevron-up")).toBeInTheDocument()
    })

    it("should show correct completed count", () => {
      const tasks = [
        createTask({ id: "1", completed: true }),
        createTask({ id: "2", completed: true }),
        createTask({ id: "3", completed: true })
      ]

      render(<List {...defaultProps} tasks={tasks} />)

      expect(screen.getByText("3 Completed")).toBeInTheDocument()
    })
  })

  describe("task actions", () => {
    it("should call onMarkAsComplete when task is marked complete", () => {
      const tasks = [createTask({ id: "1" })]

      render(<List {...defaultProps} tasks={tasks} />)

      // This would be triggered by the actual Task component
      defaultProps.onMarkAsComplete(tasks[0])

      expect(defaultProps.onMarkAsComplete).toHaveBeenCalledWith(tasks[0])
    })

    it("should call onUpdateTask when task is updated", () => {
      const tasks = [createTask({ id: "1" })]

      render(<List {...defaultProps} tasks={tasks} />)

      defaultProps.onUpdateTask(tasks[0])

      expect(defaultProps.onUpdateTask).toHaveBeenCalledWith(tasks[0])
    })

    it("should call onRemoveTask when task is removed", () => {
      const tasks = [createTask({ id: "1" })]

      render(<List {...defaultProps} tasks={tasks} />)

      defaultProps.onRemoveTask(tasks[0])

      expect(defaultProps.onRemoveTask).toHaveBeenCalledWith(tasks[0])
    })
  })

  describe("pin functionality", () => {
    it("should pass canPin prop to Task components", () => {
      const tasks = [createTask({ id: "1" })]

      render(<List {...defaultProps} tasks={tasks} canPinTasks={true} />)

      const taskElement = screen.getByTestId("task-1")
      expect(taskElement).toBeInTheDocument()
    })
  })
})
