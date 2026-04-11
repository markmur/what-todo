import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Portal from "./Portal"

interface Props {
  open: boolean
  onClose: () => void
  apiToken: string | null
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="no-style text-[11px] font-medium text-slate-500 dark:text-navy-300 hover:text-slate-600 dark:hover:text-navy-100 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group mt-2">
      <pre className="bg-slate-900 dark:bg-navy-950 text-slate-100 text-[12px] rounded-lg p-4 overflow-x-auto leading-relaxed">
        {code}
      </pre>
      <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <CopyButton value={code} />
      </div>
    </div>
  )
}

function McpSetupSheet({ open, onClose, apiToken }: Props) {
  const config = JSON.stringify(
    {
      "what-todo": {
        command: "npx",
        args: ["-y", "what-todo-mcp"],
        env: {
          WHATTODO_API_TOKEN: apiToken ?? "<your-api-token>"
        }
      }
    },
    null,
    2
  )

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="mcp-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-60"
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.div
              key="mcp-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-60 bg-white dark:bg-navy-800 rounded-t-2xl shadow-xl"
            >
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-navy-600" />
              </div>
              <div className="px-6 pb-10 pt-2 overflow-y-auto max-h-[85vh]">
                <h2 className="text-base font-bold text-slate-700 dark:text-navy-100 mb-1">
                  Use What Todo with Claude
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-6">
                  Add What Todo as an MCP server so Claude Code can read and
                  manage your tasks directly from the terminal.
                </p>

                <div className="mb-6">
                  <h3 className="text-[13px] font-semibold text-slate-700 dark:text-navy-100 mb-1">
                    1. Add to your Claude config
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-navy-400 mb-1">
                    In{" "}
                    <code className="bg-slate-100 dark:bg-navy-700 px-1 py-0.5 rounded text-[11px]">
                      ~/.claude.json
                    </code>{" "}
                    under{" "}
                    <code className="bg-slate-100 dark:bg-navy-700 px-1 py-0.5 rounded text-[11px]">
                      mcpServers
                    </code>
                    :
                  </p>
                  <CodeBlock code={config} />
                </div>

                <div className="mb-6">
                  <h3 className="text-[13px] font-semibold text-slate-700 dark:text-navy-100 mb-1">
                    2. Restart Claude Code
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-navy-400">
                    Run{" "}
                    <code className="bg-slate-100 dark:bg-navy-700 px-1 py-0.5 rounded text-[11px]">
                      /mcp
                    </code>{" "}
                    in Claude Code to verify the server is connected.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-[13px] font-semibold text-slate-700 dark:text-navy-100 mb-2">
                    3. Try it out
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {[
                      "What's on my todo list today?",
                      "Add a task to review the pull request",
                      "Mark the standup task as complete"
                    ].map(example => (
                      <div
                        key={example}
                        className="flex items-start gap-2 bg-slate-50 dark:bg-navy-700/50 rounded-lg px-3 py-2"
                      >
                        <span className="text-slate-300 dark:text-navy-600 text-[13px] mt-px select-none">
                          "
                        </span>
                        <span className="text-[13px] text-slate-600 dark:text-navy-300 italic">
                          {example}
                        </span>
                        <span className="text-slate-300 dark:text-navy-600 text-[13px] mt-px select-none">
                          "
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {!apiToken && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
                    <p className="text-[12px] text-amber-700 dark:text-amber-400">
                      Sign in to get your personal API token. Your token
                      identifies you to the MCP server and can be revoked at any
                      time.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default McpSetupSheet
