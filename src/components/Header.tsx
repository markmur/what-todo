import React from "react"
import cx from "classnames"
import MenuIcon from "@meronex/icons/fi/FiMenu"

function Header({
  className,
  onMenuClick,
  taskCount
}: {
  className?: string
  onMenuClick?: () => void
  taskCount?: number
}) {
  return (
    <header
      className={cx(
        className,
        "py-8 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between"
      )}
      style={{ paddingLeft: 16, paddingRight: 16 }}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold dark:text-navy-100">What Todo 🤷‍♂️</h1>
        {typeof taskCount === "number" && (
          <span className="text-xs font-semibold bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-navy-300 rounded-full px-2 py-0.5">
            {taskCount}
          </span>
        )}
      </div>
      {onMenuClick && (
        <button
          className="no-style md:hidden dark:text-navy-100"
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
