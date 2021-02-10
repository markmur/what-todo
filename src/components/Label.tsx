import React from "react"
import cx from "classnames"

import { Label } from "../index.d"

interface Props {
  label: Label
  active: boolean
  onClick?: () => void
}

const Label: React.FC<Props> = ({ label, active, onClick }) => {
  return (
    <button
      className={cx("label", { active })}
      style={active ? { backgroundColor: label.color } : {}}
      onClick={onClick}
    >
      {label.title}
    </button>
  )
}

export default Label
