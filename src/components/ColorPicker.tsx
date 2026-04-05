import React, { useRef, useLayoutEffect, useState } from "react"
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
  const width = 120
  const [style, setStyle] = useState<React.CSSProperties>({})

  useLayoutEffect(() => {
    if (visible && childRef.current) {
      const dimensions = childRef.current.getBoundingClientRect()
      setStyle({
        left: dimensions.left + dimensions.width / 2 - width / 2,
        top: dimensions.top - 128
      })
    }
  }, [visible, width])

  useOnClickOutside(internalRef, onHide, { ignore: "color-picker-item" })

  return (
    <div>
      <div ref={childRef}>{children}</div>

      {visible && (
        <Portal>
          <div className="color-picker" style={style} ref={internalRef}>
            <div className={"flex flex-wrap"} style={{ width }}>
              {colors.map(color => (
                <button
                  type="button"
                  className="no-style w-[16px] h-[16px] rounded-lg p-0 m-1 grow-0 shrink-0 flex-basis-[16px] cursor-pointer color-picker-item"
                  key={color.name}
                  data-tooltip-id="tooltip"
                  data-tooltip-content={color.name}
                  aria-label={color.name}
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
