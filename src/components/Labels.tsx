import type { IntermediateLabel, Label as LabelType } from "../index.d"
import React from "react"

import Animate from "./Animate"
import { Color } from "../color-palette"
import ColorPicker from "./ColorPicker"
// Icons
import CrossIcon from "@meronex/icons/fi/FiX"
import FilterIcon from "@meronex/icons/fi/FiFilter"
import PlusIcon from "@meronex/icons/fi/FiPlus"
import cx from "classnames"

interface Props {
  labels: LabelType[]
  colors: Color[]
  limit: number
  filters?: string[]
  onAddLabel: (label: IntermediateLabel) => void
  onFilter: (labelIds: string[]) => void
  onUpdateLabel: (label: LabelType) => void
  onRemoveLabel: (label: LabelType) => void
}

const Labels: React.FC<Props> = ({
  labels,
  colors,
  limit,
  filters = [],
  onFilter,
  onAddLabel,
  onUpdateLabel,
  onRemoveLabel
}) => {
  const [selectedLabel, setSelectedLabel] = React.useState<string>()
  const [controlledLabels, setControlledLabels] = React.useState<
    Record<string, LabelType>
  >({})

  const [newLabel, setNewLabel] = React.useState<IntermediateLabel>()

  React.useEffect(() => {
    const labelsById = labels.reduce(
      (state, label) => {
        state[label.id] = label
        return state
      },
      {} as Record<string, LabelType>
    )

    setControlledLabels(labelsById)
  }, [labels])

  const handleCreate = React.useCallback(() => {
    const usedColors = new Set(labels.map(l => l.color))
    const nextColor =
      colors.find(c => !usedColors.has(c.backgroundColor)) ?? colors[0]
    setNewLabel({
      title: "",
      color: nextColor.backgroundColor
    })
  }, [colors, labels])

  const handleSave = React.useCallback(() => {
    if (newLabel && newLabel.title.trim().length > 0) {
      onAddLabel(newLabel)
    }
    setNewLabel(undefined)
  }, [newLabel, onAddLabel])

  const handleChangeTitle = React.useCallback(
    (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
      const newLabel = {
        ...controlledLabels[id],
        title: event.target.value
      }
      const newLabels = {
        ...controlledLabels,
        [id]: newLabel
      }

      setControlledLabels(newLabels)
    },
    [controlledLabels]
  )

  const handleKeyPress = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleSave()
      }
    },
    [handleSave]
  )

  const handleColorChange = React.useCallback(
    (color: Color, label: LabelType) => {
      // do something
      const newLabel = {
        ...label,
        color: color.backgroundColor
      }

      const newLabels = {
        ...controlledLabels,
        [label.id]: newLabel
      }

      setControlledLabels(newLabels)
      onUpdateLabel(newLabel)
    },
    [controlledLabels, onUpdateLabel]
  )

  const handleBlur = React.useCallback(
    (id: string) => {
      onUpdateLabel(controlledLabels[id])
    },
    [controlledLabels, onUpdateLabel]
  )

  return (
    <>
      <ul className="labels divide-y dark:divide-navy-700">
        {Object.entries(controlledLabels).map(([, label]) => (
          <li className="label-input" key={label.id}>
            <div className="flex items-center py-2">
              <div className="mr-2">
                <ColorPicker
                  visible={label.id === selectedLabel}
                  label={label.title}
                  onHide={() => setSelectedLabel(undefined)}
                  onChange={color => handleColorChange(color, label)}
                >
                  <button
                    type="button"
                    className="no-style w-[16px] h-[16px] rounded-lg p-0 m-1 grow-0 shrink-0 flex-basis-[16px] cursor-pointer"
                    style={{
                      backgroundColor: label.color
                    }}
                    aria-label={`Change color for ${label.title}`}
                    onClick={() => setSelectedLabel(label.id)}
                  />
                </ColorPicker>
              </div>

              <div className="flex-1">
                <input
                  value={label.title}
                  onChange={event => handleChangeTitle(label.id, event)}
                  onBlur={() => handleBlur(label.id)}
                />
              </div>

              <button
                type="button"
                data-tooltip-id="tooltip"
                data-tooltip-content={`Filter by: ${label.title}`}
                aria-label={`Filter by ${label.title}`}
                className={cx("no-style remove-icon", {
                  active: filters.includes(label.id)
                })}
                onClick={event => {
                  if (filters.includes(label.id)) {
                    onFilter(filters.filter(x => x !== label.id))
                  } else {
                    if (event.metaKey) {
                      onFilter([...filters, label.id])
                    } else {
                      onFilter([label.id])
                    }
                  }
                }}
              >
                <FilterIcon />
              </button>

              <button
                type="button"
                className="no-style remove-icon"
                aria-label={`Remove ${label.title}`}
                onClick={() => onRemoveLabel(label)}
              >
                <CrossIcon />
              </button>
            </div>
          </li>
        ))}

        <Animate active={newLabel}>
          {newLabel && (
            <li key="new">
              <div className="flex items-center py-2">
                <div className="mr-2">
                  <div
                    className="w-[16px] h-[16px] rounded-lg p-0 m-1 grow-0 shrink-0 flex-basis-[16px] cursor-pointer"
                    style={{
                      backgroundColor: newLabel.color
                    }}
                  />
                </div>
                <input
                  autoFocus // eslint-disable-line jsx-a11y/no-autofocus
                  placeholder="Label..."
                  value={newLabel.title}
                  onKeyPress={handleKeyPress}
                  onChange={event =>
                    setNewLabel({
                      ...newLabel,
                      title: event.target.value
                    })
                  }
                  onBlur={handleSave}
                />
              </div>
            </li>
          )}
        </Animate>
      </ul>

      {!newLabel && labels.length < limit && (
        <div className="pt-2 pb-1">
          <button
            type="button"
            className="no-style inline-flex text-slate-500 hover:text-slate-700 dark:text-navy-500 dark:hover:text-navy-300 whitespace-nowrap items-center text-sm cursor-pointer"
            onClick={handleCreate}
          >
            <PlusIcon className="mr-2" />
            Create new label
          </button>
        </div>
      )}
    </>
  )
}

export default Labels
