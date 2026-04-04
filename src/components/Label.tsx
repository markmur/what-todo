import CrossIcon from "@meronex/icons/fi/FiX"
import { Label as LabelType } from "../index.d"
import React from "react"
import cx from "classnames"
import { contrastText } from "../utils"

interface Props {
  active: boolean
  className?: string
  label: LabelType
  small?: boolean
  onClick?: (event: React.MouseEvent) => void
  onRemove?: () => void
}

const Label: React.FC<Props> = ({
  small = false,
  label,
  active,
  onClick,
  onRemove,
  className = ""
}) => {
  return (
    <div
      className={cx(
        "inline-flex py-1 px-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 dark:text-navy-300 dark:hover:text-navy-100 text-md cursor-pointer",
        small
          ? "bg-slate-300 hover:bg-slate-400 dark:bg-navy-600 dark:hover:bg-navy-500"
          : "bg-slate-200 hover:bg-slate-300 dark:bg-navy-700 dark:hover:bg-navy-600",
        className,
        {
          active,
          small,
          ["font-bold"]: active
        }
      )}
      style={
        active
          ? {
              backgroundColor: label.color,
              borderColor: label.color,
              color: contrastText(label.color)
            }
          : {}
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
