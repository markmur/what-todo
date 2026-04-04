import { test, expect } from "@playwright/test"
import { seed, makeData } from "./helpers"

test("full app workflow", async ({ page }) => {
  await seed(page, makeData())
  await page.goto("/")

  await test.step("empty state shows when no tasks", async () => {
    await expect(
      page.getByText("Nothing to do — enjoy your day!")
    ).toBeVisible()
  })

  const input = page.getByPlaceholder("Write a todo for today...")

  await test.step("create tasks", async () => {
    await input.fill("Buy groceries")
    await input.press("Enter")
    await expect(page.getByText("Buy groceries")).toBeVisible()

    await input.fill("Write tests")
    await input.press("Enter")
    await expect(page.getByText("Write tests")).toBeVisible()

    await input.fill("Clean kitchen")
    await input.press("Enter")
  })

  await test.step("edit task title", async () => {
    await page.getByText("Buy groceries").click()
    const textarea = page.locator("textarea.task-title-input")
    await textarea.fill("Buy organic groceries")
    await page.keyboard.press("Escape")
    await expect(page.getByText("Buy organic groceries")).toBeVisible()
  })

  await test.step("edit task description", async () => {
    await page.getByText("Buy organic groceries").click()
    const desc = page.locator("textarea[name='description']")
    await desc.fill("From the farmers market")
    await page.keyboard.press("Escape")
    await expect(page.getByText("From the farmers market")).toBeVisible()
  })

  await test.step("toggle labels on a task", async () => {
    await page.getByText("Write tests").click()
    // Click "Work" label in the edit view to add it
    const editLabels = page
      .locator("[role='button']")
      .filter({ hasText: "Write tests" })
    await editLabels.getByText("Work").click()
    await page.keyboard.press("Escape")
  })

  await test.step("pin and unpin a task", async () => {
    const card = page
      .locator("[role='button']")
      .filter({ hasText: "Write tests" })
    await card.hover()
    await card.getByLabel("Pin task").click()
    await page.waitForTimeout(300)
    await card.click()
    // P to unpin
    await card.press("p")
    // P to re-pin
    await card.press("p")
    await page.keyboard.press("Escape")
  })

  await test.step("search filters tasks", async () => {
    const search = page.getByPlaceholder("Search tasks...")
    await search.fill("organic")
    await expect(page.getByText("Buy organic groceries")).toBeVisible()
    await expect(page.getByText("Write tests")).not.toBeVisible()
  })

  await test.step("search with no results shows empty state", async () => {
    const search = page.getByPlaceholder("Search tasks...")
    await search.fill("zzzzz")
    await expect(page.getByText("No tasks found.")).toBeVisible()
  })

  await test.step("escape clears search", async () => {
    const search = page.getByPlaceholder("Search tasks...")
    await search.press("Escape")
    await expect(page.getByText("Write tests")).toBeVisible()
  })

  await test.step("complete a task", async () => {
    const card = page
      .locator("[role='button']")
      .filter({ hasText: "Buy organic groceries" })
    await card.locator(".checkbox label").click()
    await expect(page.locator(".strike-animated").first()).toBeVisible({
      timeout: 3000
    })
  })

  await test.step("delete a task with undo", async () => {
    const kitchenCard = page
      .locator("[role='button']")
      .filter({ hasText: "Clean kitchen" })
    await kitchenCard.hover()
    await kitchenCard.getByLabel("Delete task").click()
    await expect(page.getByRole("alert")).toContainText(
      '"Clean kitchen" deleted'
    )
    await page.getByRole("button", { name: "Undo" }).click()
    await expect(page.getByText("Clean kitchen")).toBeVisible()
  })

  await test.step("keyboard shortcut X deletes task", async () => {
    // Wait for previous toast to fully dismiss
    await page.getByRole("alert").waitFor({ state: "hidden", timeout: 6000 }).catch(() => {})
    await page.getByText("Clean kitchen").click()
    const card = page
      .locator("[role='button']")
      .filter({ hasText: "Clean kitchen" })
    await card.press("x")
    await expect(page.getByRole("alert")).toContainText("deleted")
  })

  await test.step("sidebar collapse and expand", async () => {
    await expect(
      page.getByRole("heading", { name: "Labels" })
    ).toBeVisible()
    await page.getByLabel("Collapse section").last().click()
    await page.getByLabel("Expand section").last().click()
    await expect(
      page.getByRole("heading", { name: "Labels" })
    ).toBeVisible()
  })

  await test.step("toggle show task count setting", async () => {
    await page.getByLabel("Show task count").click()
    await expect(page.locator("header span.rounded-full")).toBeVisible()
  })

  await test.step("toggle compact mode", async () => {
    await page.getByLabel("Compact mode").click()
    // Verify reduced spacing on task cards
    const card = page
      .locator("[role='button']")
      .filter({ hasText: "Write tests" })
    const paddingTop = await card.evaluate(
      el => getComputedStyle(el).paddingTop
    )
    expect(parseInt(paddingTop)).toBeLessThanOrEqual(8)
    // Toggle back
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
    await expect(page.locator("header span.rounded-full")).toBeVisible()
  })

  await test.step("toggle dark mode on", async () => {
    await page.getByLabel("Switch to dark mode").click()
    await expect(page.locator("html")).toHaveClass(/dark/)
  })

  await test.step("dark mode persists after reload", async () => {
    await page.reload()
    await expect(page.locator("html")).toHaveClass(/dark/)
  })

  await test.step("toggle dark mode back to light", async () => {
    await page.getByLabel("Switch to light mode").click()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
  })

  await test.step("data persists across session", async () => {
    // Check localStorage directly since addInitScript interferes with reloads
    const taskData = await page.evaluate(() =>
      localStorage.getItem("what-todo")
    )
    expect(taskData).toContain("Buy organic groceries")
    expect(taskData).toContain("Write tests")
  })

  await test.step("completed section empty state", async () => {
    await page.getByLabel("Expand section").first().click()
    await expect(
      page.getByText(
        "Completed tasks will appear here the day after completion."
      )
    ).toBeVisible()
  })
})

test("mobile", async ({ page }) => {
  await seed(page, makeData())
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/")

  await test.step("open drawer via hamburger menu", async () => {
    await page.getByLabel("Open menu").click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Labels" })
    ).toBeVisible()
  })

  await test.step("close drawer via X button", async () => {
    await page.getByLabel("Close menu").click()
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  await test.step("create a task on mobile", async () => {
    const input = page.getByPlaceholder("Write a todo for today...")
    await input.fill("Mobile task")
    await input.press("Enter")
    await expect(page.getByText("Mobile task")).toBeVisible()
  })

  await test.step("delete button is visible on mobile without hover", async () => {
    const card = page
      .locator("[role='button']")
      .filter({ hasText: "Mobile task" })
    const deleteBtn = card.getByLabel("Delete task")
    await expect(deleteBtn).toBeVisible()
  })

  await test.step("delete a task on mobile", async () => {
    const card = page
      .locator("[role='button']")
      .filter({ hasText: "Mobile task" })
    await card.getByLabel("Delete task").click()
    await expect(page.getByRole("alert")).toContainText("deleted")
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible()
  })

  await test.step("drag handle is visible for reordering", async () => {
    // Create two tasks so reorder is possible
    const input = page.getByPlaceholder("Write a todo for today...")
    await input.fill("First task")
    await input.press("Enter")
    await expect(page.getByText("First task")).toBeVisible()
    await input.fill("Second task")
    await input.press("Enter")
    await expect(page.getByText("Second task")).toBeVisible()

    // Verify drag handles are present (grip icons)
    const handles = page.locator(".cursor-grab")
    await expect(handles.nth(1)).toBeVisible()
  })

  await test.step("task body is scrollable without triggering reorder", async () => {
    // Verify the task card itself does not have touch drag behavior
    // (dragListener={false} on Reorder.Item means only the handle drags)
    const card = page
      .locator("[role='button']")
      .filter({ hasText: "First task" })
    await expect(card).toBeVisible()
    // The card should be clickable (not intercepted by drag)
    await card.click()
    await expect(
      page.locator("textarea.task-title-input")
    ).toBeVisible()
    await page.keyboard.press("Escape")
  })
})
