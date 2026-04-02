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
    <span className={cx("checkbox", { checked })}>
      <label htmlFor={id}>
        {checked ? (
          <Checked className="text-slate-500 hover:text-slate-800" />
        ) : (
          <Unchecked className="text-slate-600 hover:text-black" />
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
