import React from "react"
import cx from "classnames"

function Header({ className }: { className?: string }) {
  return (
    <header className={cx(className, "py-8 mx-4 border-b-slate-100")}>
      <strong>What Todo 🤷‍♂️</strong>
    </header>
  )
}

export default Header
