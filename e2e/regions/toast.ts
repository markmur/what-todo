import type { Page } from "@playwright/test"
import { Region } from "."

export class ToastRegion extends Region {
  constructor(page: Page) {
    super(page, page.getByRole("alert"))
  }

  get message() {
    return this.region
  }

  get undoButton() {
    return this.region.getByRole("button", { name: "Undo" })
  }

  async waitForDismiss(timeout = 7000) {
    await this.region.waitFor({ state: "hidden", timeout })
  }
}
