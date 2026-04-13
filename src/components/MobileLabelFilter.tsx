import React, { useRef, useState } from "react"
import { Label as LabelType } from "../index.d"
import ChevronDown from "@meronex/icons/fi/FiChevronDown"
import FilterIcon from "@meronex/icons/fi/FiFilter"
import CheckIcon from "@meronex/icons/fi/FiCheck"
import useOnClickOutside from "../hooks/onclickoutside"

interface Props {
  labels: LabelType[]
  filters: string[]
  onFilter: (filters: string[]) => void
}

const MobileLabelFilter: React.FC<Props> = ({ labels, filters, onFilter }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => setOpen(false))

  if (labels.length === 0) return null

  const activeCount = filters.length

  const toggleLabel = (id: string) => {
    if (filters.includes(id)) {
      onFilter(filters.filter(f => f !== id))
    } else {
      onFilter([...filters, id])
    }
  }

  const clearAll = () => {
    onFilter([])
    setOpen(false)
  }

  const activeLabels = labels.filter(l => filters.includes(l.id))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="no-style flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200/60 dark:border-navy-700/60 text-sm text-slate-500 dark:text-navy-400 transition-colors hover:border-slate-300 dark:hover:border-navy-600"
      >
        <FilterIcon fontSize={14} />
        {activeLabels.length > 0 ? (
          <>
            <span className="text-slate-400 dark:text-navy-500">
              Filtering by:
            </span>
            {activeLabels.map(label => (
              <span
                key={label.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: label.color + "22",
                  color: label.color
                }}
              >
                {label.title}
              </span>
            ))}
          </>
        ) : (
          <span>Filter</span>
        )}
        <ChevronDown
          fontSize={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-navy-800 rounded-xl border border-slate-200/80 dark:border-navy-700/80 shadow-lg dark:shadow-navy-950/40 overflow-hidden z-50">
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400 dark:text-navy-400 uppercase tracking-wide">
              Filter by label
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="no-style text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="px-1.5 pb-2">
            {labels.map(label => {
              const isActive = filters.includes(label.id)
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className="no-style flex items-center gap-3 w-full px-2.5 py-2.5 rounded-lg text-base text-slate-700 dark:text-navy-200 hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 text-left truncate">
                    {label.title}
                  </span>
                  {isActive && (
                    <CheckIcon fontSize={16} style={{ color: label.color }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileLabelFilter
