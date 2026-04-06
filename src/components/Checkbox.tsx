// Icons
import Checked from "@meronex/icons/fi/FiCheckSquare"
import React from "react"
import Unchecked from "@meronex/icons/fi/FiSquare"
import cx from "classnames"

interface Props {
  id: string
  checked: boolean
  onChange: (newState: boolean) => void
}

const Checkbox: React.FC<Props> = ({ id, checked, onChange }) => {
  return (
    <span
      className={cx(
        "checkbox inline-flex items-center justify-center p-3 -m-3",
        { checked }
      )}
      role="checkbox"
      aria-checked={checked}
      aria-label="Toggle complete"
      tabIndex={0}
      onPointerUp={e => {
        e.stopPropagation()
        onChange(!checked)
      }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          onChange(!checked)
        }
      }}
    >
      {checked ? (
        <Checked
          fontSize={22}
          className="text-slate-500 hover:text-slate-800 dark:text-navy-500 dark:hover:text-navy-300"
        />
      ) : (
        <Unchecked
          fontSize={22}
          className="text-slate-600 hover:text-black dark:text-navy-400 dark:hover:text-navy-200"
        />
      )}
      <input
        id={id}
        className="hidden-input"
        checked={checked}
        type="checkbox"
        tabIndex={-1}
        readOnly
      />
    </span>
  )
}

export default Checkbox
