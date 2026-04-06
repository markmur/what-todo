import { useCallback, useRef } from "react"
import cx from "classnames"
import MenuIcon from "@meronex/icons/fi/FiMenu"

async function seedFromFile() {
  try {
    const res = await fetch("/seed-data.json")
    const seed = await res.json()
    const today = new Date().toDateString()
    const data = {
      migrated: true,
      filters: [],
      tasks: {
        [today]: seed.tasks.map((t: Record<string, unknown>, i: number) => ({
          id: crypto.randomUUID(),
          title: t.title,
          description: t.description || "",
          completed: false,
          created_at: new Date(Date.now() + i * 1000).toISOString(),
          labels: t.labels || [],
          pinned: t.pinned || false
        }))
      },
      labels: seed.labels,
      sections: {
        completed: { collapsed: true },
        focus: {},
        sidebar: { collapsed: false }
      }
    }
    localStorage.setItem("what-todo", JSON.stringify(data))
    window.location.reload()
  } catch {
    // silently fail
  }
}

function Header({
  className,
  onMenuClick,
  completedCount,
  totalCount,
  date
}: {
  className?: string
  onMenuClick?: () => void
  completedCount?: number
  totalCount?: number
  date?: string
}) {
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleLogoTap = useCallback(() => {
    tapCount.current++
    clearTimeout(tapTimer.current)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      seedFromFile()
    } else {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0
      }, 1500)
    }
  }, [])

  return (
    <header
      className={cx(
        className,
        "border-b border-slate-100 dark:border-navy-700 flex items-center justify-between"
      )}
      style={{ padding: "2em 16px", maxHeight: 66 }}
    >
      <div className="flex items-baseline gap-3">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <h1
          className="text-base font-bold dark:text-navy-100 cursor-default select-none leading-none"
          onClick={handleLogoTap}
        >
          What Todo 🤷‍♂️
        </h1>
        {typeof totalCount === "number" && (
          <span
            className="text-xs font-semibold bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-navy-300 rounded-full px-2 py-0.5 leading-none"
            style={{ verticalAlign: "baseline" }}
          >
            {completedCount}/{totalCount}
          </span>
        )}
        {date && (
          <span className="text-xs text-slate-400 dark:text-navy-400 leading-none">
            {date}
          </span>
        )}
      </div>
      {onMenuClick && (
        <button
          className="no-style dark:text-navy-100"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <MenuIcon fontSize={22} />
        </button>
      )}
    </header>
  )
}

export default Header
