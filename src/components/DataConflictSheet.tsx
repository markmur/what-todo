import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Portal from "./Portal"
import { Data } from "../index.d"

interface Props {
  open: boolean
  local: Data | null
  remote: Data | null
  onUseRemote: () => void
  onMerge: () => void
}

function count(data: Data | null): number {
  if (!data) return 0
  return Object.values(data.tasks ?? {})
    .flat()
    .filter(t => !t.completed).length
}

type Choice = "remote" | "merge" | null

function DataConflictSheet({
  open,
  local,
  remote,
  onUseRemote,
  onMerge
}: Props) {
  const [choice, setChoice] = useState<Choice>(null)
  const localCount = count(local)
  const remoteCount = count(remote)

  const handleConfirm = () => {
    if (choice === "remote") onUseRemote()
    if (choice === "merge") onMerge()
    setChoice(null)
  }

  const confirmLabel =
    choice === "merge"
      ? `Merge ${localCount + remoteCount} tasks`
      : `Use ${remoteCount} cloud task${remoteCount !== 1 ? "s" : ""}`

  const confirmWarning =
    choice === "remote"
      ? `This will discard your ${localCount} local task${localCount !== 1 ? "s" : ""} permanently.`
      : null

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="conflict-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-60"
              aria-hidden="true"
            />
            <motion.div
              key="conflict-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-60 bg-white dark:bg-navy-800 rounded-t-2xl shadow-xl"
            >
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-navy-600" />
              </div>
              <div className="px-6 pt-2 pb-10">
                <h2 className="text-base font-bold text-slate-700 dark:text-navy-100 mb-1">
                  You have todos on this device
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-5">
                  Your account already has saved data. What would you like to do
                  with the todos on this device?
                </p>

                <div className="flex flex-col gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setChoice("merge")}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      choice === "merge"
                        ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-700"
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-navy-100 mb-0.5">
                      Merge both
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-navy-400">
                      Combine{" "}
                      <span className="font-medium text-slate-600 dark:text-navy-300">
                        {localCount} local task{localCount !== 1 ? "s" : ""}
                      </span>{" "}
                      with your{" "}
                      <span className="font-medium text-slate-600 dark:text-navy-300">
                        {remoteCount} cloud task{remoteCount !== 1 ? "s" : ""}
                      </span>
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChoice("remote")}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      choice === "remote"
                        ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-700"
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-navy-100 mb-0.5">
                      Use cloud data
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-navy-400">
                      Keep your{" "}
                      <span className="font-medium text-slate-600 dark:text-navy-300">
                        {remoteCount} cloud task{remoteCount !== 1 ? "s" : ""}
                      </span>{" "}
                      and discard the local ones
                    </p>
                  </button>
                </div>

                {confirmWarning && (
                  <p className="text-[12px] text-amber-600 dark:text-amber-400 mb-3">
                    ⚠️ {confirmWarning}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!choice}
                  onClick={handleConfirm}
                  className="w-full px-4 py-2.5 text-[13px] font-semibold rounded-xl text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: "#3ecf8e" }}
                >
                  {choice ? confirmLabel : "Select an option"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default DataConflictSheet
