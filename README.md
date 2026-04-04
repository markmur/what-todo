# What Todo

A simple, fast todo app with a three-panel layout — completed tasks on the left, today's focus in the center, and labels + settings on the right.

### Features

- **Privacy first** — all data stored in localStorage, never sent over the network
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

### Development

```sh
pnpm install
pnpm dev
```

### Scripts

```sh
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm lint         # Lint with ESLint + Prettier + jsx-a11y
pnpm typecheck    # TypeScript type checking
```

![What Todo](https://github.com/markmur/what-todo/blob/master/media/screenshot.png)

### Tech

- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Vite 8
- Vitest
