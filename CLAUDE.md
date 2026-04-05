# What Todo

A personal todo app built as a PWA with offline support.

## Tech Stack

- **Framework:** React 19 + TypeScript 6
- **Build:** Vite 8 with `@vitejs/plugin-react` and `@tailwindcss/vite`
- **Styling:** Tailwind CSS 4.2 with custom CSS in `src/tailwind.css`
- **Animations:** Framer Motion (drag-to-reorder, transitions)
- **Icons:** `@meronex/icons` (Feather icons via `fi/FiX`, `fi/FiSquare`, etc.)
- **Storage:** localStorage (no backend)
- **PWA:** `vite-plugin-pwa` for offline/install support

## Testing

- **Unit:** Vitest + React Testing Library + happy-dom
- **E2E:** Playwright (Chromium only, runs on `localhost:5199`)
- **A11y:** `@axe-core/playwright` in `e2e/a11y.spec.ts`
- **Linting:** ESLint with `jsx-a11y`, `react-hooks`, `prettier`, `playwright`

### Commands

```sh
pnpm test          # unit tests
pnpm test:e2e      # playwright e2e
pnpm lint          # eslint
pnpm typecheck     # tsc --noEmit
pnpm ci            # lint + test + e2e
pnpm dev           # dev server
```

## Architecture

### Components (`src/components/`)

| Component | Purpose |
|---|---|
| `Todo.tsx` | Root app — manages sections (today, tomorrow, etc.) |
| `List.tsx` | Task collection with sorting, filtering, drag-to-reorder |
| `Task.tsx` | Individual task card — checkbox, title, description, labels, action buttons |
| `Checkbox.tsx` | Accessible checkbox with hidden input + label |
| `Label.tsx` | Filterable label pill/button |
| `TaskInput.tsx` | New task input |
| `MobileDrawer.tsx` | Slide-in drawer for labels/settings on mobile |
| `Animate.tsx` | Framer Motion wrapper for enter/exit animations |
| `Toast.tsx` | Toast notifications |

### Context (`src/context/`)

- `StorageContext` — localStorage read/write for tasks, labels, sections
- `SettingsContext` — user prefs (compact mode, label style, sort order, default label)
- `DarkModeContext` — system + manual dark mode toggle

### Hooks (`src/hooks/`)

- `useFocusTrap` — traps focus in modals (MobileDrawer)
- `useMedia` — responsive breakpoint detection (MOBILE/TABLET/DESKTOP)
- `useResize` — resizable sidebar panel
- `onClickOutside` — click-outside detection for deselecting tasks

### Styling

- Tailwind utilities in JSX + custom CSS in `src/tailwind.css`
- Dark mode via `html.dark` class (custom variant: `@custom-variant dark`)
- Custom navy color palette (`--color-navy-50` through `--color-navy-950`)
- `.touch-target` class — uses `::after` pseudo-element for 44px touch areas without layout bloat
- `.remove-icon` — action button visibility (hidden by default, visible on hover/mobile)
- `.hidden-input` — visually hidden but screen-reader accessible checkbox inputs
- Safe area insets for iOS notch support

### Mobile

- Primary breakpoint: `768px` (md)
- Delete button always visible on mobile, other actions show on hover
- Three-panel layout on desktop, stacked + drawer on mobile
- `maximum-scale=1.0` on viewport meta (intentional)

### Data Model

Tasks are stored per-date in localStorage under `what-todo`:
```
{ tasks: { "Mon Apr 07 2025": [Task, ...] }, labels: [...], sections: {...} }
```

Each `Task` has: `id`, `title`, `description`, `completed`, `created_at`, `labels[]`, `pinned`, `order`, `completed_at`.
