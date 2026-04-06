import type { Page } from "@playwright/test"
import { HeaderRegion } from "./header"
import { SearchRegion } from "./search"
import { TaskInputRegion } from "./task-input"
import { TaskListRegion } from "./task-list"
import { DrawerRegion } from "./drawer"
import { ToastRegion } from "./toast"

export class AppRegion {
  readonly page: Page
  readonly header: HeaderRegion
  readonly search: SearchRegion
  readonly taskInput: TaskInputRegion
  readonly taskList: TaskListRegion
  readonly drawer: DrawerRegion
  readonly toast: ToastRegion

  constructor(page: Page) {
    this.page = page
    this.header = new HeaderRegion(page)
    this.search = new SearchRegion(page)
    this.taskInput = new TaskInputRegion(page)
    this.taskList = new TaskListRegion(page)
    this.drawer = new DrawerRegion(page)
    this.toast = new ToastRegion(page)
  }
}
