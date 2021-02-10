import React from "react"
import cx from "classnames"
import { FiCheckSquare as Checked, FiSquare as Unchecked } from "react-icons/fi"

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
