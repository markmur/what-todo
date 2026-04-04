import React, { useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Portal from "./Portal"
import useOnClickOutside from "../hooks/onclickoutside"

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ open, onClose, children, footer }) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(panelRef, () => {
    if (open) onClose()
  })

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              ref={panelRef}
              key="drawer-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm z-50 bg-white dark:bg-navy-900 shadow-xl flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-4 pt-6 min-h-0">
                {children}
              </div>
              {footer && (
                <div className="p-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default MobileDrawer
