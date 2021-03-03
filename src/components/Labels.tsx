import React from "react"
import cx from "classnames"
import Tooltip from "react-tooltip"
import { Flex, Box } from "rebass"

// Icons
import CrossIcon from "@meronex/icons/fi/FiX"
import PlusIcon from "@meronex/icons/fi/FiPlus"
import FilterIcon from "@meronex/icons/fi/FiFilter"

import { Label, IntermediateLabel } from "../index.d"
import { Color } from "../color-palette"
import ColorPicker from "./ColorPicker"

interface Props {
  labels: Label[]
  colors: Color[]
  limit: number
  filters?: string[]
  onAddLabel: (label: IntermediateLabel) => void
  onFilter: (labelIds: string[]) => void
  onUpdateLabel: (label: Label) => void
  onRemoveLabel: (label: Label) => void
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
    Record<string, Label>
  >({})

  const [newLabel, setNewLabel] = React.useState<IntermediateLabel>()

  React.useEffect(() => {
    // Rebuild tooltip on every render
    Tooltip.rebuild()
  })

  React.useEffect(() => {
    const labelsById = labels.reduce((state, label) => {
      state[label.id] = label
      return state
    }, {})

    setControlledLabels(labelsById)
  }, [labels])

  const handleCreate = React.useCallback(() => {
    setNewLabel({
      title: "",
      color: colors[0].backgroundColor
    })
  }, [newLabel])

  const handleSave = React.useCallback(() => {
    if (newLabel.title.trim().length > 0) {
      onAddLabel(newLabel)
    }
    setNewLabel(undefined)
  }, [newLabel, onAddLabel])

  const handleChangeTitle = React.useCallback(
    (id, event) => {
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
    event => {
      if (event.key === "Enter") {
        handleSave()
      }
    },
    [handleSave]
  )

  const handleColorChange = React.useCallback(
    (color: Color, label) => {
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
    id => {
      onUpdateLabel(controlledLabels[id])
    },
    [controlledLabels, onUpdateLabel]
  )

  return (
    <React.Fragment>
      <ul className="labels">
        {Object.entries(controlledLabels).map(([, label]) => (
          <li className="label-input" key={label.id}>
            <Flex alignItems="center" py={2}>
              <Box mr={2}>
                <ColorPicker
                  visible={label.id === selectedLabel}
                  onHide={() => setSelectedLabel(undefined)}
                  onChange={color => handleColorChange(color, label)}
                >
                  <div
                    className="circle"
                    style={{
                      backgroundColor: label.color
                    }}
                    onClick={() => setSelectedLabel(label.id)}
                  />
                </ColorPicker>
              </Box>
              <Box flex={1}>
                <input
                  value={label.title}
                  onChange={event => handleChangeTitle(label.id, event)}
                  onBlur={() => handleBlur(label.id)}
                />
              </Box>

              <span
                data-tip={`Filter by: ${label.title}`}
                className={cx("remove-icon", {
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
              </span>

              <span
                className="remove-icon"
                onClick={() => onRemoveLabel(label)}
              >
                <CrossIcon />
              </span>
            </Flex>
          </li>
        ))}

        {newLabel && (
          <li key="new">
            <Flex alignItems="center" py={2}>
              <Box mr={2}>
                <div
                  className="circle"
                  style={{
                    backgroundColor: newLabel.color
                  }}
                />
              </Box>
              <input
                autoFocus
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
            </Flex>
          </li>
        )}
      </ul>

      {!newLabel && labels.length < limit && (
        <Box alignSelf="center" pt={3} pb={1}>
          <span className="button-link" onClick={handleCreate}>
            <PlusIcon />
            {"  "}Create new label
          </span>
        </Box>
      )}
    </React.Fragment>
  )
}

export default Labels
