import CrossIcon from "@meronex/icons/fi/FiX"
import { Label as LabelType } from "../index.d"
import React from "react"
import cx from "classnames"

interface Props {
  label: LabelType
  small?: boolean
  active: boolean
  onClick?: () => void
  onRemove?: () => void
}

const Label: React.FC<Props> = ({
  small = false,
  label,
  active,
  onClick,
  onRemove
}) => {
  return (
    <div
      className={cx("inline-flex label", { active, small })}
      style={
        active ? { backgroundColor: label.color, borderColor: label.color } : {}
      }
      onClick={onClick}
    >
      <div className="flex items-center">
        <button className="no-style">{label.title}</button>
        {onRemove && (
          <div
            className="label-x block m-3"
            onClick={event => {
              event.stopPropagation()
              onRemove()
            }}
          >
            <CrossIcon />
          </div>
        )}
      </div>
    </div>
  )
}

export default Label
