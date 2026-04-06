import type { Page } from "@playwright/test"
import { Region } from "."

export class TaskInputRegion extends Region {
  constructor(page: Page) {
    super(page, page.getByRole("region", { name: "Add task" }))
  }

  get titleInput() {
    return this.region.getByPlaceholder("What needs to be done?")
  }

  get descriptionInput() {
    return this.region.locator("#task-description")
  }

  get submitButton() {
    return this.region.getByLabel("Add task")
  }

  get isExpanded() {
    return this.descriptionInput
  }

  label(name: string) {
    return this.region.getByText(name)
  }

  async fill(title: string) {
    await this.titleInput.focus()
    await this.titleInput.fill(title)
  }

  async submit() {
    await this.titleInput.press("Enter")
  }

  async addTask(title: string) {
    await this.fill(title)
    await this.submit()
  }
}
