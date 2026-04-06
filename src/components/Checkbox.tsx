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
      className={cx("checkbox", { checked })}
      role="presentation"
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <label
        htmlFor={id}
        className="inline-flex items-center justify-center p-3 -m-3"
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
      </label>
      <input
        id={id}
        className="hidden-input"
        checked={checked}
        type="checkbox"
        onChange={() => onChange(!checked)}
      />
    </span>
  )
}

export default Checkbox
