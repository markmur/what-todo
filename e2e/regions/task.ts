import type { Locator, Page } from "@playwright/test"
import { Region } from "."

export class TaskRegion extends Region {
  constructor(page: Page, region: Locator) {
    super(page, region)
  }

  get titleInput() {
    return this.region.locator("textarea.task-title-input")
  }

  get titleText() {
    return this.region.locator(".inline.font-semibold").first()
  }

  get description() {
    return this.region.locator("textarea[name='description']")
  }

  get checkbox() {
    return this.region.locator("[role='checkbox']")
  }

  get pinButton() {
    return this.region.getByLabel("Pin task")
  }

  get unpinButton() {
    return this.region.getByLabel("Unpin task")
  }

  get deleteButton() {
    return this.region.getByLabel("Delete task")
  }

  get actions() {
    return this.region.getByLabel("Task actions")
  }

  get labelDots() {
    return this.actions.locator("[data-tooltip-content]")
  }

  get isActive() {
    return this.titleInput
  }

  async select() {
    const box = await this.region.boundingBox()
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await this.page.mouse.down()
      await this.page.mouse.up()
    }
  }

  async complete() {
    await this.checkbox.click()
  }

  async pin() {
    await this.region.hover()
    await this.pinButton.click()
  }

  async unpin() {
    await this.region.hover()
    await this.unpinButton.click()
  }

  async delete() {
    await this.region.hover()
    await this.deleteButton.click()
  }
}
