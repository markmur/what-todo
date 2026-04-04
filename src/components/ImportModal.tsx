import React, { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Portal from "./Portal"
import { parseDataStr } from "../utils"

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (data: any) => void
}

const ImportModal: React.FC<ImportModalProps> = ({
  open,
  onClose,
  onImport
}) => {
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const panelRef = useRef<HTMLDivElement>(null)

  const handleImport = () => {
    const parsed = parseDataStr(value) as any
    if (!parsed || Object.keys(parsed).length === 0) {
      setError("Invalid JSON data. Please check and try again.")
      return
    }
    onImport(parsed)
    setValue("")
    setError("")
    onClose()
  }

  const handleClose = () => {
    setValue("")
    setError("")
    onClose()
  }

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="import-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={handleClose}
              aria-hidden="true"
            />
            <motion.div
              ref={panelRef}
              key="import-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="import-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white dark:bg-navy-800 rounded-xl shadow-xl p-6"
            >
              <h3
                id="import-modal-title"
                className="text-lg font-bold text-slate-700 dark:text-navy-100 mb-4"
              >
                Import Data
              </h3>
              <label htmlFor="import-data" className="sr-only">
                JSON data
              </label>
              <textarea
                id="import-data"
                rows={8}
                value={value}
                onChange={e => {
                  setValue(e.target.value)
                  setError("")
                }}
                placeholder="Paste your JSON data here..."
                className="w-full text-sm border border-slate-200 dark:border-navy-700 rounded-lg px-3 py-2 outline-none resize-none dark:text-navy-100"
                style={{ background: "transparent" }}
                aria-describedby={error ? "import-error" : undefined}
              />
              {error && (
                <p id="import-error" className="text-red-500 text-xs mt-1">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="no-style text-sm text-slate-500 dark:text-navy-400 px-3 py-1.5"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  className="no-style text-sm font-semibold bg-blue-500 text-white rounded-lg px-4 py-1.5"
                  onClick={handleImport}
                >
                  Import
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default ImportModal
