import type { Page } from "@playwright/test"
import { Region } from "."

export class DrawerRegion extends Region {
  constructor(page: Page) {
    super(page, page.getByRole("dialog"))
  }

  get closeButton() {
    return this.region.getByLabel("Close menu")
  }

  get labelsHeading() {
    return this.region.getByRole("heading", { name: "Labels" })
  }

  get settingsHeading() {
    return this.region.getByRole("heading", { name: "Settings" })
  }

  async close() {
    await this.closeButton.click()
  }
}
