import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { seed, dataWithTasks } from "./helpers"

// Pre-existing violations to address incrementally.
// Remove rules from this list as they are fixed.
const KNOWN_VIOLATIONS = [
  "color-contrast",
  "label",
  "meta-viewport",
  "nested-interactive",
  "select-name"
]

test("accessibility audit on task list", async ({ page }) => {
  await seed(
    page,
    dataWithTasks([
      { title: "Buy groceries", labels: ["label-1"] },
      { title: "Write tests", labels: ["label-2"] },
      { title: "Completed task", completed: true }
    ])
  )
  await page.goto("/")
  await expect(page.getByText("Buy groceries")).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .disableRules(KNOWN_VIOLATIONS)
    .analyze()

  expect(results.violations).toEqual([])
})
