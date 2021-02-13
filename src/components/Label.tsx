import React from "react"
import cx from "classnames"
import { Flex, Box } from "rebass"
import { FiX as CrossIcon } from "react-icons/fi"

import { Label } from "../index.d"

interface Props {
  label: Label
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
    <Box
      display="inline-flex"
      className={cx("label", { active, small })}
      style={
        active ? { backgroundColor: label.color, borderColor: label.color } : {}
      }
      onClick={onClick}
    >
      <Flex alignItems="center">
        <button className="no-style">{label.title}</button>
        {onRemove && (
          <Box
            className="label-x"
            height="14px"
            onClick={event => {
              event.stopPropagation()
              onRemove()
            }}
          >
            <CrossIcon />
          </Box>
        )}
      </Flex>
    </Box>
  )
}

export default Label
