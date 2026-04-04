import React from "react"
import cx from "classnames"
import MenuIcon from "@meronex/icons/fi/FiMenu"

function Header({ className, onMenuClick, taskCount }: { className?: string; onMenuClick?: () => void; taskCount?: number }) {
  return (
    <header className={cx(className, "py-8 px-4 border-b-slate-100 flex items-center justify-between")}>
      <div className="flex items-center gap-2">
        <strong className="dark:text-navy-100">What Todo 🤷‍♂️</strong>
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
