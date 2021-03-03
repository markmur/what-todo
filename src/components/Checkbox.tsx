import React from "react"
import cx from "classnames"

// Icons
import Checked from "@meronex/icons/fi/FiCheckSquare"
import Unchecked from "@meronex/icons/fi/FiSquare"

interface Props {
  id: string
  checked: boolean
  onChange: (newState: boolean) => void
}

const Checkbox: React.FC<Props> = ({ id, checked, onChange }) => {
  return (
    <span className={cx("checkbox", { checked })}>
      <label htmlFor={id}>{checked ? <Checked /> : <Unchecked />}</label>
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
