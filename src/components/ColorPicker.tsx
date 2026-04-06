import React, { useRef, useLayoutEffect, useState } from "react"
import colors, { Color } from "../color-palette"
import { AnimatePresence, motion } from "framer-motion"

import Portal from "./Portal"
import useOnClickOutside from "../hooks/onclickoutside"

interface Props {
  visible: boolean
  label?: string
  children: React.ReactElement
  onChange: (color: Color) => void
  onHide: () => void
}

const ColorPicker: React.FC<Props> = ({
  visible = true,
  label,
  children,
  onChange,
  onHide
}) => {
  const childRef = useRef<HTMLDivElement>(null)
  const internalRef = useRef<HTMLDivElement>(null)
  const width = 120
  const [style, setStyle] = useState<React.CSSProperties>({})
  const [useSheet, setUseSheet] = useState(
    () => !window.matchMedia("(min-width: 64em)").matches
  )

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 64em)")
    const handler = (e: MediaQueryListEvent) => setUseSheet(!e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  useLayoutEffect(() => {
    if (visible && childRef.current && !useSheet) {
      const dimensions = childRef.current.getBoundingClientRect()
      setStyle({
        left: dimensions.left + dimensions.width / 2 - width / 2,
        top: dimensions.top - 128
      })
    }
  }, [visible, width, useSheet])

  useOnClickOutside(internalRef, onHide, { ignore: "color-picker-item" })

  const handleSelect = (color: Color) => {
    onChange(color)
    if (useSheet) onHide()
  }

  return (
    <div>
      <div ref={childRef}>{children}</div>

      {visible && !useSheet && (
        <Portal>
          <div className="color-picker" style={style} ref={internalRef}>
            <div className="flex flex-wrap" style={{ width }}>
              {colors.map(color => (
                <button
                  type="button"
                  className="no-style w-[16px] h-[16px] rounded-full p-0 m-1 grow-0 shrink-0 cursor-pointer color-picker-item"
                  key={color.name}
                  data-tooltip-content={color.name}
                  aria-label={color.name}
                  style={{ backgroundColor: color.backgroundColor }}
                  onClick={() => handleSelect(color)}
                />
              ))}
            </div>
          </div>
        </Portal>
      )}

      <Portal>
        <AnimatePresence>
          {visible && useSheet && (
            <>
              <motion.div
                key="color-picker-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-60"
                onClick={onHide}
                aria-hidden="true"
              />
              <motion.div
                key="color-picker-sheet"
                ref={internalRef}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-60 bg-white dark:bg-navy-800 rounded-t-2xl shadow-xl"
                style={{
                  paddingBottom: 16
                }}
              >
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-navy-600" />
                </div>
                {label && (
                  <p className="text-center text-sm text-slate-500 dark:text-navy-400 py-5">
                    Choose a color for{" "}
                    <span className="font-semibold text-slate-700 dark:text-navy-200">
                      {label}
                    </span>
                  </p>
                )}
                <div
                  className="grid gap-y-3 px-4 pb-4 mx-auto justify-items-center"
                  style={{
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    maxWidth: 400
                  }}
                >
                  {colors.map(color => (
                    <button
                      type="button"
                      className="no-style flex flex-col items-center gap-1 cursor-pointer color-picker-item"
                      key={color.name}
                      aria-label={color.name}
                      onClick={() => handleSelect(color)}
                    >
                      <span
                        className="w-[32px] h-[32px] rounded-full block"
                        style={{ backgroundColor: color.backgroundColor }}
                      />
                      <span className="text-[9px] leading-tight text-slate-400 dark:text-navy-500 w-full text-center line-clamp-2">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  )
}

export default ColorPicker
