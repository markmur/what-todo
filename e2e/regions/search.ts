import type { Page } from "@playwright/test"
import { Region } from "."

export class SearchRegion extends Region {
  constructor(page: Page) {
    super(page, page.getByRole("search"))
  }

  get input() {
    return this.region.getByPlaceholder("Search tasks...")
  }

  async clear() {
    await this.input.fill("")
    await this.input.press("Escape")
  }
}
