import { test, expect } from "@playwright/test"
import { seed, makeData, dataWithTasks } from "./helpers"
import { AppRegion } from "./regions/app"

test("full app workflow", async ({ page }) => {
  await seed(page, makeData())
  await page.goto("/")
  const app = new AppRegion(page)

  await test.step("empty state shows when no tasks", async () => {
    await expect(app.taskList.emptyState).toBeVisible()
  })

  await test.step("create tasks", async () => {
    await app.taskInput.addTask("Buy groceries")
    await expect(page.getByText("Buy groceries")).toBeVisible()

    await app.taskInput.addTask("Write tests")
    await expect(page.getByText("Write tests")).toBeVisible()

    await app.taskInput.addTask("Clean kitchen")
  })

  await test.step("edit task title", async () => {
    const task = app.taskList.findTask("Buy groceries")
    await task.select()
    await task.titleInput.fill("Buy organic groceries")
    await page.keyboard.press("Escape")
    await expect(page.getByText("Buy organic groceries")).toBeVisible()
  })

  await test.step("edit task description", async () => {
    const task = app.taskList.findTask("Buy organic groceries")
    await task.select()
    await task.description.fill("From the farmers market")
    await page.keyboard.press("Escape")
    await expect(page.getByText("From the farmers market")).toBeVisible()
  })

  await test.step("add description from empty keeps focus", async () => {
    const task = app.taskList.findTask("Write tests")
    await task.select()
    await task.description.focus()
    await task.description.pressSequentially("My new description")
    await expect(task.description).toBeFocused()
    await expect(task.description).toHaveValue("My new description")
    await page.keyboard.press("Escape")
  })

  await test.step("clicking empty space deselects task", async () => {
    const task = app.taskList.findTask("Write tests")
    await task.select()
    await expect(task.isActive).toBeVisible()
    await app.search.input.click()
    await expect(task.isActive).toBeHidden()
  })

  await test.step("toggle labels on a task", async () => {
    const task = app.taskList.findTask("Write tests")
    await task.select()
    await task.region.getByText("Work").click()
    await page.keyboard.press("Escape")
  })

  await test.step("pin and unpin a task", async () => {
    const task = app.taskList.findTask("Write tests")
    await task.pin()
    await task.select()
    await task.region.press("p")
    await task.region.press("p")
    await page.keyboard.press("Escape")
  })

  await test.step("search filters tasks", async () => {
    await app.search.input.fill("organic")
    await expect(page.getByText("Buy organic groceries")).toBeVisible()
    await expect(page.getByText("Write tests")).toBeHidden()
  })

  await test.step("search with no results shows empty state", async () => {
    await app.search.input.fill("zzzzz")
    await expect(app.taskList.noResults).toBeVisible()
  })

  await test.step("escape clears search", async () => {
    await app.search.input.press("Escape")
    await expect(page.getByText("Write tests")).toBeVisible()
  })

  await test.step("complete a task", async () => {
    const task = app.taskList.findTask("Buy organic groceries")
    await task.complete()
    await expect(task.titleText).toHaveAttribute("data-completed", "true")
  })

  await test.step("completed task is persisted in storage", async () => {
    await expect
      .poll(async () => {
        const data = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("what-todo") ?? "{}")
        )
        const allTasks = Object.values(data.tasks).flat() as any[]
        const completedTask = allTasks.find(
          (t: any) => t.title === "Buy organic groceries"
        )
        return completedTask?.completed
      })
      .toBe(true)
  })

  await test.step("input stays open when clicking label inside it", async () => {
    await app.taskInput.titleInput.focus()
    await expect(app.taskInput.isExpanded).toBeVisible()
    await app.taskInput.label("Work").click()
    await expect(app.taskInput.isExpanded).toBeVisible()
    await page.keyboard.press("Escape")
  })

  await test.step("input stays open on desktop after adding a task", async () => {
    await app.taskInput.titleInput.focus()
    await expect(app.taskInput.isExpanded).toBeVisible()
    await app.taskInput.addTask("Temp task")
    await expect(app.taskInput.isExpanded).toBeVisible()
    await app.header.title.click()
    await expect(app.taskInput.isExpanded).toBeHidden()
  })

  await test.step("input keeps focus on title when clicked", async () => {
    await app.taskInput.titleInput.focus()
    await expect(app.taskInput.titleInput).toBeFocused()
    await app.header.title.click()
  })

  await test.step("clicking outside input closes expanded section", async () => {
    await app.taskInput.titleInput.focus()
    await expect(app.taskInput.isExpanded).toBeVisible()
    await app.header.title.click()
    await expect(app.taskInput.isExpanded).toBeHidden()
  })

  await test.step("removed settings are not in the UI", async () => {
    await expect(page.getByText("Auto-collapse completed")).toBeHidden()
    await expect(page.getByText("Move completed to yesterday")).toBeHidden()
    await expect(page.getByText("Auto-expand new tasks")).toBeHidden()
    await expect(page.getByText("Keep input open")).toBeHidden()
  })

  await test.step("delete a task with undo", async () => {
    const task = app.taskList.findTask("Clean kitchen")
    await task.delete()
    await expect(app.toast.message).toContainText('"Clean kitchen" deleted')
    await app.toast.undoButton.click()
    await expect(page.getByText("Clean kitchen")).toBeVisible()
  })

  await test.step("keyboard shortcut X deletes task", async () => {
    await expect(app.toast.region).toBeHidden({ timeout: 6000 })
    const task = app.taskList.findTask("Clean kitchen")
    await task.select()
    await task.region.press("x")
    await expect(app.toast.message).toContainText("deleted")
  })

  await test.step("sidebar collapse and expand", async () => {
    await expect(page.getByRole("heading", { name: "Labels" })).toBeVisible()
    await page.getByLabel("Collapse section").last().click()
    await page.getByLabel("Expand section").last().click()
    await expect(page.getByRole("heading", { name: "Labels" })).toBeVisible()
  })

  await test.step("opening completed panel closes settings panel", async () => {
    await expect(page.getByRole("heading", { name: "Labels" })).toBeVisible()
    await page.getByLabel("Expand section").first().click()
    await expect(
      page.getByRole("heading", { name: "Completed" }).first()
    ).toBeVisible()
    const settingsPanel = page.getByTestId("settings-panel")
    await expect(settingsPanel).toHaveCSS("pointer-events", "none")
  })

  await test.step("opening settings panel closes completed panel", async () => {
    await page.getByLabel("Expand section").last().click()
    await expect(page.getByRole("heading", { name: "Labels" })).toBeVisible()
    const completedPanel = page.getByTestId("completed-panel")
    await expect(completedPanel).toHaveCSS("pointer-events", "none")
  })

  await test.step("both panels can be individually closed", async () => {
    await page.getByLabel("Collapse section").last().click()
    const focusPanel = page.locator("[style*='z-index: 1']")
    await expect(focusPanel).toHaveCSS("right", "0px")
    await expect(focusPanel).toHaveCSS("left", "0px")
  })

  await test.step("state updates are independent (no stale data)", async () => {
    const taskCount = await page.getByRole("article").count()
    const task = app.taskList.findTask("Write tests")
    await task.pin()
    await expect(page.getByRole("article")).toHaveCount(taskCount)
    await task.select()
    await task.region.press("p")
    await page.keyboard.press("Escape")
  })

  await test.step("task count is always visible", async () => {
    await expect(app.header.progressBadge).toBeVisible()
  })

  await test.step("toggle compact mode", async () => {
    await page.getByLabel("Expand section").last().click()
    await page.getByLabel("Compact mode").click()
    const task = app.taskList.findTask("Write tests")
    const paddingTop = await task.region.evaluate(
      el => getComputedStyle(el).paddingTop
    )
    expect(parseInt(paddingTop)).toBeLessThanOrEqual(8)
    await page.getByLabel("Compact mode").click()
  })

  await test.step("change label style to pill", async () => {
    await page
      .locator("select")
      .filter({ hasText: "Circle" })
      .selectOption("pill")
  })

  await test.step("settings persist after reload", async () => {
    await page.reload()
    await expect(app.header.progressBadge).toBeVisible()
  })

  await test.step("defaults to dark mode", async () => {
    await expect(page.locator("html")).toHaveClass(/dark/)
  })

  await test.step("toggle to light mode", async () => {
    await page.getByLabel("Switch to light mode").click()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
  })

  await test.step("light mode persists after reload", async () => {
    await page.reload()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
  })

  await test.step("toggle back to dark mode", async () => {
    await page.getByLabel("Switch to dark mode").click()
    await expect(page.locator("html")).toHaveClass(/dark/)
  })

  await test.step("data persists across session", async () => {
    const taskData = await page.evaluate(() =>
      localStorage.getItem("what-todo")
    )
    expect(taskData).toContain("Buy organic groceries")
    expect(taskData).toContain("Write tests")
  })

  await test.step("completed sidebar shows empty state when no older tasks", async () => {
    await page.getByLabel("Expand section").first().click()
    await expect(
      page.getByText(
        "Completed tasks will show up here a day after completion."
      )
    ).toBeVisible()
  })
})

test("mobile", async ({ page }) => {
  await seed(page, makeData())
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/")
  const app = new AppRegion(page)

  await test.step("open drawer via hamburger menu", async () => {
    await app.header.menuButton.click()
    await expect(app.drawer.region).toBeVisible()
    await expect(app.drawer.labelsHeading).toBeVisible()
  })

  await test.step("close drawer via X button", async () => {
    await app.drawer.close()
    await expect(app.drawer.region).toBeHidden()
  })

  await test.step("create a task on mobile", async () => {
    await app.taskInput.addTask("Mobile task")
    await expect(page.getByText("Mobile task")).toBeVisible()
  })

  await test.step("delete a task on mobile", async () => {
    const task = app.taskList.findTask("Mobile task")
    await task.region.hover()
    await task.deleteButton.click()
    await expect(app.toast.message).toContainText("deleted")
    await expect(app.toast.undoButton).toBeVisible()
  })

  await test.step("drag handle is visible for reordering", async () => {
    await app.taskInput.addTask("First task")
    await expect(page.getByText("First task")).toBeVisible()
    await app.taskInput.addTask("Second task")
    await expect(page.getByText("Second task")).toBeVisible()

    const handles = page.getByTestId("drag-handle")
    await expect(handles.nth(1)).toBeVisible()
  })

  await test.step("task body is scrollable without triggering reorder", async () => {
    const task = app.taskList.findTask("First task")
    await expect(task.region).toBeVisible()
    await task.select()
    await expect(task.isActive).toBeVisible()
    await page.keyboard.press("Escape")
  })

  await test.step("create more tasks for remaining mobile tests", async () => {
    await app.taskInput.addTask("Mobile groceries")
    await app.taskInput.addTask("Mobile laundry")
    await expect(page.getByText("Mobile groceries")).toBeVisible()
    await expect(page.getByText("Mobile laundry")).toBeVisible()
  })

  await test.step("edit a task on mobile", async () => {
    const task = app.taskList.findTask("Mobile groceries")
    await task.select()
    await task.titleInput.fill("Buy milk")
    await page.keyboard.press("Escape")
    await expect(page.getByText("Buy milk")).toBeVisible()
  })

  await test.step("complete a task on mobile", async () => {
    const task = app.taskList.findTask("Buy milk")
    await task.complete()
    await expect(task.titleText).toHaveAttribute("data-completed", "true")
  })

  await test.step("search on mobile", async () => {
    await app.search.input.fill("laundry")
    await expect(page.getByText("Mobile laundry")).toBeVisible()
    await expect(page.getByText("Buy milk")).toBeHidden()
    await app.search.input.press("Escape")
    await expect(page.getByText("Buy milk")).toBeVisible()
  })

  await test.step("undo delete on mobile", async () => {
    const task = app.taskList.findTask("Mobile laundry")
    await task.region.hover()
    await task.deleteButton.click()
    await expect(app.toast.message).toContainText("deleted")
    await app.toast.undoButton.click()
    await expect(page.getByText("Mobile laundry")).toBeVisible()
  })

  await test.step("drawer contains labels and settings", async () => {
    await app.header.menuButton.click()
    await expect(app.drawer.region).toBeVisible()
    await expect(app.drawer.labelsHeading).toBeVisible()
    await expect(app.drawer.settingsHeading).toBeVisible()
    await expect(page.getByLabel("Compact mode")).toBeVisible()
  })

  await test.step("task count is hidden on mobile", async () => {
    await app.drawer.close()
    await expect(app.header.progressBadge).toBeHidden()
  })

  await test.step("dark mode toggle accessible via drawer", async () => {
    await app.header.menuButton.click()
    await page.getByLabel("Switch to light mode").click()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
    await page.getByLabel("Switch to dark mode").click()
    await expect(page.locator("html")).toHaveClass(/dark/)
    await app.drawer.close()
  })

  await test.step("drawer closes on Escape key", async () => {
    await app.header.menuButton.click()
    await expect(app.drawer.region).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(app.drawer.region).toBeHidden()
  })
})

test("sequential deletes and completes", async ({ page }) => {
  const tasks = [
    { title: "Task A" },
    { title: "Task B" },
    { title: "Task C" },
    { title: "Task D" },
    { title: "Task E" }
  ]
  await seed(page, dataWithTasks(tasks))
  await page.goto("/")
  const app = new AppRegion(page)

  await test.step("all seeded tasks are visible", async () => {
    for (const t of tasks) {
      await expect(page.getByText(t.title)).toBeVisible()
    }
  })

  await test.step("deleting multiple tasks in sequence removes them all", async () => {
    await app.taskList.findTask("Task A").delete()
    await app.taskList.findTask("Task B").delete()
    await app.taskList.findTask("Task C").delete()

    await expect(app.taskList.findTask("Task A").region).toBeHidden()
    await expect(app.taskList.findTask("Task B").region).toBeHidden()
    await expect(app.taskList.findTask("Task C").region).toBeHidden()
    await expect(app.taskList.findTask("Task D").region).toBeVisible()
    await expect(app.taskList.findTask("Task E").region).toBeVisible()
  })

  await test.step("deleted tasks are committed to storage after undo window", async () => {
    await app.toast.waitForDismiss()
    await expect
      .poll(async () => {
        const data = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("what-todo") ?? "{}")
        )
        const allTasks = Object.values(data.tasks).flat() as any[]
        return allTasks.map((t: any) => t.title).sort()
      })
      .toEqual(["Task D", "Task E"])
  })

  await test.step("completing multiple tasks in sequence persists them all", async () => {
    await app.taskList.findTask("Task D").complete()
    await app.taskList.findTask("Task E").complete()

    await expect
      .poll(
        async () => {
          const data = await page.evaluate(() =>
            JSON.parse(localStorage.getItem("what-todo") ?? "{}")
          )
          const allTasks = Object.values(data.tasks).flat() as any[]
          return allTasks.every((t: any) => t.completed)
        },
        { timeout: 10000 }
      )
      .toBe(true)
  })
})
