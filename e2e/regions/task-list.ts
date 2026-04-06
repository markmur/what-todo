import type { Page } from "@playwright/test"
import { Region } from "."
import { TaskRegion } from "./task"

export class TaskListRegion extends Region {
  constructor(page: Page) {
    super(page, page.getByRole("region", { name: "Task list" }))
  }

  get emptyState() {
    return this.region.getByText("Nothing to do — enjoy your day!")
  }

  get noResults() {
    return this.region.getByText("No tasks found.")
  }

  get completedToggle() {
    return this.region.getByRole("button", { name: /Completed/ })
  }

  findTask(name: string) {
    const card = this.region.getByRole("article", { name })
    return new TaskRegion(this.page, card)
  }
}
