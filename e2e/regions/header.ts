import type { Page } from "@playwright/test"
import { Region } from "."

export class HeaderRegion extends Region {
  constructor(page: Page) {
    super(page, page.locator("header"))
  }

  get title() {
    return this.region.getByRole("heading", { level: 1 })
  }

  get progressBadge() {
    return this.region.getByRole("status")
  }

  get menuButton() {
    return this.region.getByLabel("Open menu")
  }

  get date() {
    return this.region.getByTestId("header-date")
  }
}
