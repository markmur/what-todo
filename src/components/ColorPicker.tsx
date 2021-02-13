import React, { CSSProperties, StyleHTMLAttributes } from "react"
import { Flex, Box } from "rebass"

import colors, { Color } from "../color-palette"
import Portal from "./Portal"
import useOnClickOutside from "../hooks/onclickoutside"

interface Props {
  visible: boolean
  children: React.ReactElement
  onChange: (color: Color) => void
  onHide: () => void
}

const ColorPicker: React.FC<Props> = ({
  visible = true,
  children,
  onChange,
  onHide
}) => {
  const childRef = React.useRef()
  const internalRef = React.useRef()
  const style = {} as CSSProperties
  const width = 120

  if (childRef && childRef.current) {
    // @ts-ignore
    const dimensions = childRef.current?.getBoundingClientRect()

    style.left = dimensions.left + dimensions.width / 2 - width / 2
    style.top = dimensions.top - 128
  }

  useOnClickOutside(internalRef, onHide)

  return (
    <div>
      {React.cloneElement(children, {
        ref: childRef
      })}

      {visible && (
        <Portal>
          <div className="color-picker" style={style} ref={internalRef}>
            <Flex flexWrap="wrap" width={width}>
              {colors.map(color => (
                <Box
                  key={color.name}
                  m={1}
                  flex="0 0 16px"
                  className="circle"
                  data-tip={color.name}
                  data-background-color={color.backgroundColor}
                  style={{ backgroundColor: color.backgroundColor }}
                  onClick={() => onChange(color)}
                />
              ))}
            </Flex>
          </div>
        </Portal>
      )}
    </div>
  )
}

export default ColorPicker
