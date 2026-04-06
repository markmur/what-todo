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
    <button
      type="button"
      className={cx(
        "no-style touch-target inline-flex items-center py-1 px-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 dark:text-navy-300 dark:hover:text-navy-100 text-md cursor-pointer",
        small
          ? "bg-slate-300 hover:bg-slate-400 dark:bg-navy-500 dark:hover:bg-navy-400"
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
      {label.title}
      {onRemove && (
        <span
          className="label-x block ml-2 p-2 -m-2 rounded-full hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
          role="button"
          tabIndex={0}
          aria-label={`Remove ${label.title}`}
          onClick={event => {
            event.stopPropagation()
            onRemove()
          }}
          onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation()
              onRemove()
            }
          }}
        >
          <CrossIcon />
        </span>
      )}
    </button>
  )
}

export default Label
