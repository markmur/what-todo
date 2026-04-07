# What Todo

A personal todo app built as a PWA — fast, offline-first, with optional cloud sync.

### Features

- **Privacy first** — all data stored locally by default, never sent over the network
- **Cloud sync** — optional Supabase backend with Google Sign-In for cross-device sync
- **MCP integration** — use with Claude Code via `what-todo-mcp` to manage tasks from the terminal
- **Labels** — create, color-code, and filter tasks by label
- **Pin tasks** — keep important tasks at the top
- **Drag to reorder** — manually sort tasks in the focus section
- **Search** — filter tasks by title or description
- **Dark mode** — toggle between light and dark themes
- **Resizable sidebar** — drag to resize the right panel
- **Keyboard shortcuts** — P (pin), X (delete), M (move to today), Escape (deselect)
- **Undo delete** — 5-second undo window after deleting a task
- **Compact mode** — reduce spacing for denser task lists
- **Mobile support** — responsive layout with slide-out drawer for labels and settings
- **Accessible** — keyboard navigable, screen reader friendly, reduced motion support
- **PWA** — installable with offline support

### Claude Code Integration

Connect What Todo as an MCP server so Claude Code can read and manage your tasks directly from the terminal.

Add the following to `~/.claude.json` under `mcpServers`:

```json
{
  "what-todo": {
    "command": "npx",
    "args": ["-y", "what-todo-mcp"],
    "env": {
      "WHATTODO_API_TOKEN": "<your-api-token>"
    }
  }
}
```

Get your API token from the app's settings. Run `/mcp` in Claude Code to verify the server is connected.

### Development

```sh
pnpm install
pnpm dev
```

### Scripts

```sh
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run Playwright e2e tests
pnpm lint         # Lint with ESLint + Prettier + jsx-a11y
pnpm typecheck    # TypeScript type checking
pnpm ci           # lint + test + e2e
```

![What Todo](https://github.com/markmur/what-todo/blob/master/media/screenshot.png)

### Tech

- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Vite 8
- Vitest + Playwright
- Supabase (optional cloud sync)
