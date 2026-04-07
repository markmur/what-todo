import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Portal from "./Portal"
import { supabase } from "../lib/supabase"

interface Props {
  open: boolean
  onClose: () => void
}

type Status = "idle" | "loading" | "success" | "error"

function WaitlistSheet({ open, onClose }: Props) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address.")
      return
    }

    setStatus("loading")
    setErrorMsg(null)

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim().toLowerCase() })

    if (error) {
      if (error.code === "23505") {
        // Already on the list — treat as success
        setStatus("success")
      } else {
        setStatus("error")
        setErrorMsg("Something went wrong. Please try again.")
      }
    } else {
      setStatus("success")
    }
  }

  const handleClose = () => {
    setEmail("")
    setStatus("idle")
    setErrorMsg(null)
    onClose()
  }

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="waitlist-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-60"
              onClick={handleClose}
              aria-hidden="true"
            />
            <motion.div
              key="waitlist-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-60 bg-white dark:bg-navy-800 rounded-t-2xl shadow-xl"
            >
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-navy-600" />
              </div>

              <div className="px-6 pb-10 pt-3">
                {status === "success" ? (
                  <div className="text-center py-4">
                    <p className="text-2xl mb-3">🎉</p>
                    <h2 className="text-base font-bold text-slate-700 dark:text-navy-100 mb-2">
                      You're on the list
                    </h2>
                    <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-6">
                      We'll email you when your account is ready.
                    </p>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="no-style text-[13px] font-medium text-slate-500 dark:text-navy-400 underline"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-bold text-slate-700 dark:text-navy-100 mb-2">
                      Early access only
                    </h2>
                    <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-5">
                      Sign-in is currently invite-only while we roll out
                      gradually. Leave your email and we'll let you know when
                      your spot is ready.
                    </p>

                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-3"
                    >
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full p-3 border border-slate-200 dark:border-navy-600 rounded-xl text-[13px] bg-white dark:bg-navy-900 text-slate-700 dark:text-navy-100 placeholder:text-slate-400 dark:placeholder:text-navy-500 outline-none focus:border-blue-400"
                      />

                      {errorMsg && (
                        <p className="text-xs text-red-500">{errorMsg}</p>
                      )}

                      <button
                        type="submit"
                        disabled={status === "loading" || !email.trim()}
                        className="w-full py-3 rounded-xl text-[13px] font-semibold text-white bg-slate-800 dark:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        {status === "loading" ? "Joining…" : "Request access"}
                      </button>

                      <button
                        type="button"
                        onClick={handleClose}
                        className="no-style text-[12px] text-slate-500 dark:text-navy-300 text-center"
                      >
                        Maybe later
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default WaitlistSheet
