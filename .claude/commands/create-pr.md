---
name: pr
description: Create a pull request and write a concise description
user_invocable: true
---

# Create a pull request

## Instructions

1. Check the current branch and ensure all changes are committed
2. Push the branch to origin using `git push -u origin <branch>`
3. Create the PR using `gh pr create` with a title and body
4. Share the GitHub PR link when done

## Writing the title and description

**Title:** Short, imperative, under 70 characters. Describe what changes, not why.

**Body:**
- One short paragraph explaining the problem being solved and why this approach. Be direct. No fluff.
- One or two sentences on how to test. Where to look, what to try. No step-by-step walkthroughs.
- Do NOT use headings like "What and why" or "How to test" — just write naturally.
- Do NOT summarize every file changed. A high-level overview is enough.
- Do NOT write a full test plan. Trust the reviewer.
- Do NOT include "Generated with Claude Code" or any AI attribution.

## Updating an existing PR description

If given a GitHub PR URL (`https://github.com/<owner>/<repo>/pull/<number>`):

1. Fetch the PR details and diff: `gh pr view <number>` and `gh pr diff <number>`
2. Rewrite the description using `gh pr edit <number> --body "..."` following the body guidelines above
3. Share the updated PR link
