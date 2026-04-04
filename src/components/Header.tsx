import React from "react"
import cx from "classnames"
import MenuIcon from "@meronex/icons/fi/FiMenu"

function Header({ className, onMenuClick }: { className?: string; onMenuClick?: () => void }) {
  return (
    <header className={cx(className, "py-8 px-4 border-b-slate-100 flex items-center justify-between")}>
      <strong className="dark:text-navy-100">What Todo 🤷‍♂️</strong>
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
