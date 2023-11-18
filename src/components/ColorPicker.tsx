import React, { useRef } from "react"
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
  const childRef = useRef<HTMLDivElement>(null)
  const internalRef = useRef<HTMLDivElement>(null)
  const style = {} as any
  const width = 120

  if (childRef && childRef.current) {
    const dimensions = childRef.current?.getBoundingClientRect()

    style.left = dimensions.left + dimensions.width / 2 - width / 2
    style.top = dimensions.top - 128
  }

  useOnClickOutside(internalRef, onHide, { ignore: "color-picker-item" })

  return (
    <div>
      {React.cloneElement(children, {
        ref: childRef
      })}

      {visible && (
        <Portal>
          <div className="color-picker" style={style} ref={internalRef}>
            <div className={"flex flex-wrap"} style={{ width }}>
              {colors.map(color => (
                <div
                  className="w-[16px] h-[16px] rounded-lg p-0 m-1 flex-grow-0 flex-shrink-0 flex-basis-[16px] cursor-pointer color-picker-item"
                  key={color.name}
                  data-tip={color.name}
                  data-background-color={color.backgroundColor}
                  style={{ backgroundColor: color.backgroundColor }}
                  onClick={() => onChange(color)}
                />
              ))}
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

export default ColorPicker
