import { Page } from "@playwright/test"

const today = new Date().toDateString()

export function makeTask(overrides: Record<string, any> = {}) {
  return {
    id: crypto.randomUUID(),
    title: "Test task",
    description: "",
    completed: false,
    created_at: new Date().toISOString(),
    labels: [],
    pinned: false,
    ...overrides
  }
}

export function makeData(overrides: Record<string, any> = {}) {
  return {
    migrated: true,
    filters: [],
    tasks: {},
    labels: [
      { id: "label-1", title: "Work", color: "#5352ed" },
      { id: "label-2", title: "Personal", color: "#ff7f50" }
    ],
    sections: {
      completed: { collapsed: true },
      focus: {},
      sidebar: { collapsed: false }
    },
    ...overrides
  }
}

export function dataWithTasks(tasks: Record<string, any>[]) {
  return makeData({
    tasks: {
      [today]: tasks.map(t => makeTask(t))
    }
  })
}

export async function seed(
  page: Page,
  data: Record<string, any>,
  settings?: Record<string, any>,
  darkMode?: boolean
) {
  await page.addInitScript(
    ({ data, settings, darkMode }) => {
      if (!localStorage.getItem("what-todo")) {
        localStorage.setItem("what-todo", JSON.stringify(data))
      }
      if (settings && !localStorage.getItem("what-todo-settings")) {
        localStorage.setItem("what-todo-settings", JSON.stringify(settings))
      }
      if (darkMode !== undefined && !localStorage.getItem("what-todo-dark-mode")) {
        localStorage.setItem("what-todo-dark-mode", String(darkMode))
      }
    },
    { data, settings, darkMode }
  )
}
