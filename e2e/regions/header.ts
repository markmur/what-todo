import type { Page } from "@playwright/test"
import { Region } from "."

export class HeaderRegion extends Region {
  constructor(page: Page) {
    super(page, page.locator("header"))
  }

  get title() {
    return this.region.locator("h1")
  }

  get progressBadge() {
    return this.region.locator("h1 + span")
  }

  get menuButton() {
    return this.region.getByLabel("Open menu")
  }

  get date() {
    return this.region.locator("h1 ~ span").last()
  }
}
