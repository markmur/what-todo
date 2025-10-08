import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import Task from "./Task"
import type { Task as TaskType, Label as LabelType } from "../index.d"

// Mock the icon components
jest.mock("@meronex/icons/fi/FiX", () => ({
  __esModule: true,
  default: () => <div data-testid="cross-icon" />
}))

jest.mock("@meronex/icons/ai/AiOutlinePushpin", () => ({
  __esModule: true,
  default: () => <div data-testid="pin-icon" />
}))

jest.mock("@meronex/icons/ai/AiFillPushpin", () => ({
  __esModule: true,
  default: () => <div data-testid="pin-filled-icon" />
}))

jest.mock("@meronex/icons/fi/FiArrowRight", () => ({
  __esModule: true,
  default: () => <div data-testid="arrow-icon" />
}))

jest.mock("@meronex/icons/fi", () => ({
  FiLink: () => <div data-testid="link-icon" />
}))

jest.mock("react-tooltip", () => ({
  __esModule: true,
  default: {
    hide: jest.fn(),
    rebuild: jest.fn()
  }
}))

describe("Task", () => {
  const mockTask: TaskType = {
    id: "task-1",
    title: "Test Task",
    description: "Test description",
    created_at: "2024-01-15T10:00:00.000Z",
    completed: false,
    labels: ["label-1"]
  }

  const mockLabels: Record<string, LabelType> = {
    "label-1": {
      id: "label-1",
      title: "Work",
      color: "#ff0000"
    }
  }

  const defaultProps = {
    task: mockTask,
    active: false,
    labels: mockLabels,
    filters: [],
    onFilter: jest.fn(),
    onSelect: jest.fn(),
    onDeselect: jest.fn(),
    onUpdate: jest.fn(),
    onMarkAsComplete: jest.fn(),
    onRemoveTask: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("rendering", () => {
    it("should render task title", () => {
      render(<Task {...defaultProps} />)

      expect(screen.getByText("Test Task")).toBeInTheDocument()
    })

    it("should render task description", () => {
      render(<Task {...defaultProps} />)

      expect(screen.getByDisplayValue("Test description")).toBeInTheDocument()
    })

    it("should render checkbox", () => {
      render(<Task {...defaultProps} />)

      const checkbox = screen.getByRole("checkbox")
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })

    it("should render delete button", () => {
      render(<Task {...defaultProps} />)

      expect(screen.getByTestId("cross-icon")).toBeInTheDocument()
    })

    it("should render pin button when canPin is true", () => {
      render(<Task {...defaultProps} canPin={true} />)

      expect(screen.getByTestId("pin-icon")).toBeInTheDocument()
    })

    it("should not render pin button when canPin is false", () => {
      render(<Task {...defaultProps} canPin={false} />)

      expect(screen.queryByTestId("pin-icon")).not.toBeInTheDocument()
    })
  })

  describe("task completion", () => {
    it("should mark task as complete when checkbox is clicked", async () => {
      render(<Task {...defaultProps} />)

      const checkbox = screen.getByRole("checkbox")
      fireEvent.click(checkbox)

      await waitFor(
        () => {
          expect(defaultProps.onMarkAsComplete).toHaveBeenCalledWith({
            ...mockTask,
            completed: true
          })
        },
        { timeout: 2000 }
      )
    })

    it("should unmark completed task immediately", () => {
      const completedTask = { ...mockTask, completed: true }
      const props = { ...defaultProps, task: completedTask }

      render(<Task {...props} />)

      const checkbox = screen.getByRole("checkbox")
      fireEvent.click(checkbox)

      expect(props.onMarkAsComplete).toHaveBeenCalledWith({
        ...completedTask,
        completed: false
      })
    })
  })

  describe("task deletion", () => {
    it("should call onRemoveTask when delete button is clicked", () => {
      render(<Task {...defaultProps} />)

      const deleteButton = screen.getByTestId("cross-icon").parentElement!
      fireEvent.click(deleteButton)

      expect(defaultProps.onRemoveTask).toHaveBeenCalledWith(mockTask)
    })
  })

  describe("task pinning", () => {
    it("should toggle pin state when pin button is clicked", () => {
      render(<Task {...defaultProps} canPin={true} />)

      const pinButton = screen.getByTestId("pin-icon").parentElement!
      fireEvent.click(pinButton)

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        ...mockTask,
        pinned: true
      })
    })

    it("should show filled pin icon when task is pinned", () => {
      const pinnedTask = { ...mockTask, pinned: true }
      render(<Task {...defaultProps} task={pinnedTask} />)

      expect(screen.getByTestId("pin-filled-icon")).toBeInTheDocument()
    })
  })

  describe("task editing", () => {
    it("should update task when title is changed and blurred", () => {
      render(<Task {...defaultProps} active={true} />)

      const titleInput = screen.getByDisplayValue("Test Task")
      fireEvent.change(titleInput, { target: { value: "Updated Task" } })
      fireEvent.blur(titleInput)

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        ...mockTask,
        title: "Updated Task"
      })
    })

    it("should not update task if nothing changed", () => {
      render(<Task {...defaultProps} active={true} />)

      const titleInput = screen.getByDisplayValue("Test Task")
      fireEvent.blur(titleInput)

      expect(defaultProps.onUpdate).not.toHaveBeenCalled()
    })
  })

  describe("move to today", () => {
    it("should call onMoveToToday when arrow button is clicked", () => {
      const onMoveToToday = jest.fn()
      render(<Task {...defaultProps} onMoveToToday={onMoveToToday} />)

      const moveButton = screen.getByTestId("arrow-icon").parentElement!
      fireEvent.click(moveButton)

      expect(onMoveToToday).toHaveBeenCalledWith(mockTask)
    })

    it("should not render move button when onMoveToToday is not provided", () => {
      render(<Task {...defaultProps} />)

      expect(screen.queryByTestId("arrow-icon")).not.toBeInTheDocument()
    })
  })

  describe("URL detection", () => {
    it("should show link icon when description contains URL", () => {
      const taskWithURL = {
        ...mockTask,
        description: "Check out https://example.com for more info"
      }

      render(<Task {...defaultProps} task={taskWithURL} />)

      expect(screen.getByTestId("link-icon")).toBeInTheDocument()
    })

    it("should not show link icon when description has no URL", () => {
      render(<Task {...defaultProps} />)

      expect(screen.queryByTestId("link-icon")).not.toBeInTheDocument()
    })

    it("should open URL in new tab when link icon is clicked", () => {
      const taskWithURL = {
        ...mockTask,
        description: "Check out https://example.com for more info"
      }

      const windowOpenSpy = jest.spyOn(window, "open").mockImplementation()

      render(<Task {...defaultProps} task={taskWithURL} />)

      const linkButton = screen.getByTestId("link-icon").parentElement!
      fireEvent.click(linkButton)

      expect(windowOpenSpy).toHaveBeenCalledWith(
        "https://example.com",
        "_blank"
      )

      windowOpenSpy.mockRestore()
    })
  })

  describe("label filtering", () => {
    it("should show label badges for task labels", () => {
      render(<Task {...defaultProps} />)

      const labelElement = document.querySelector(
        '[data-tip="Work"]'
      ) as HTMLElement

      expect(labelElement).toBeInTheDocument()
      expect(labelElement).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" })
    })

    it("should call onFilter when label badge is clicked", () => {
      render(<Task {...defaultProps} />)

      const labelElement = document.querySelector(
        '[data-tip="Work"]'
      ) as HTMLElement

      fireEvent.click(labelElement)

      expect(defaultProps.onFilter).toHaveBeenCalled()
    })
  })

  describe("keyboard shortcuts", () => {
    it("should deselect task when Enter+Meta is pressed", () => {
      render(<Task {...defaultProps} active={true} />)

      const titleInput = screen.getByDisplayValue("Test Task")
      fireEvent.keyDown(titleInput, { key: "Enter", metaKey: true })

      expect(defaultProps.onDeselect).toHaveBeenCalled()
    })
  })
})
