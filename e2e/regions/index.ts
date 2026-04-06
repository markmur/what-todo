import type { Locator, Page } from "@playwright/test"

export class Region {
  readonly region: Locator
  protected readonly page: Page

  constructor(page: Page, region: Locator) {
    this.page = page
    this.region = region
  }
}
