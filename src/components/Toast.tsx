import React, { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Portal from "./Portal"

interface ToastProps {
  message: string
  action?: { label: string; onClick: () => void }
  duration?: number
  onDismiss: () => void
}

const Toast: React.FC<ToastProps> = ({
  message,
  action,
  duration = 5000,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-800 dark:bg-navy-700 text-white text-sm rounded-lg px-4 py-3 shadow-lg"
        >
          <span>{message}</span>
          {action && (
            <button
              className="no-style font-semibold text-blue-300 hover:text-blue-200"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </Portal>
  )
}

export default Toast
