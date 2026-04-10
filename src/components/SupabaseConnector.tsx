import React, { useRef, useState } from "react"
import cx from "classnames"
import { AnimatePresence, motion } from "framer-motion"
import Portal from "./Portal"
import useOnClickOutside from "../hooks/onclickoutside"
import SupabaseSetupGuide from "./SupabaseSetupGuide"
import { GoogleSignInButton } from "./GoogleSignInButton"
import { SyncStatus } from "../adapters/DebouncedAdapter"

export type OAuthProvider = "google"

interface Props {
  isConnected: boolean
  isAuthenticated: boolean
  userEmail: string | null
  syncStatus: SyncStatus
  lastSyncedAt: Date | null
  onConnect: (url: string, anonKey: string) => Promise<void>
  onDisconnect: () => void
  onSignIn: (provider: OAuthProvider) => Promise<void>
  onSignOut: () => void
  schemaOutdated?: boolean
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

function formatLastSynced(date: Date): string {
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 5) return "Just now"
  if (diffSec < 60) return `${diffSec}s ago`

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  return date.toLocaleDateString()
}

function SyncIndicator({
  syncStatus,
  lastSyncedAt
}: {
  syncStatus: SyncStatus
  lastSyncedAt: Date | null
}) {
  if (syncStatus === "syncing") {
    return (
      <span className="text-[11px] text-slate-500 dark:text-navy-300">
        Syncing…
      </span>
    )
  }

  if (syncStatus === "error") {
    return <span className="text-[11px] text-red-500">Sync failed</span>
  }

  if (lastSyncedAt) {
    return (
      <span className="text-[11px] text-slate-500 dark:text-navy-300">
        {formatLastSynced(lastSyncedAt)}
      </span>
    )
  }

  return null
}

interface PanelProps {
  isConnected: boolean
  isAuthenticated: boolean
  userEmail: string | null
  url: string
  anonKey: string
  error: string | null
  loading: boolean
  showSetup: boolean
  onUrlChange: (v: string) => void
  onAnonKeyChange: (v: string) => void
  onConnect: () => void
  onDisconnect: () => void
  onSignIn: (provider: OAuthProvider) => Promise<void>
  onSignOut: () => void
  onToggleSetup: () => void
  schemaOutdated?: boolean
}

function ConnectorPanel({
  isConnected,
  isAuthenticated,
  userEmail,
  url,
  anonKey,
  error,
  loading,
  showSetup,
  onUrlChange,
  onAnonKeyChange,
  onConnect,
  onDisconnect,
  onSignIn,
  onSignOut,
  onToggleSetup,
  schemaOutdated
}: PanelProps) {
  // Step 3: connected + authenticated
  if (isConnected && isAuthenticated) {
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
          <span className="text-sm font-semibold text-slate-700 dark:text-navy-100">
            Connected to Supabase
          </span>
        </div>
        {userEmail && (
          <p className="text-[12px] text-slate-500 dark:text-navy-300 mb-3 pl-3.5">
            {userEmail}
          </p>
        )}
        {schemaOutdated && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
              Database migration required
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-500">
              Your Supabase schema is out of date. Run the latest migration
              script from the setup guide to continue syncing correctly.
            </p>
          </div>
        )}
        <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-4">
          Your data is synced and secured with your account.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full px-3 py-2 text-[13px] font-semibold border border-slate-200 dark:border-navy-600 rounded-md bg-transparent cursor-pointer text-slate-600 dark:text-navy-300 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            className="w-full px-3 py-2 text-[13px] font-semibold border border-slate-200 dark:border-navy-600 rounded-md bg-transparent cursor-pointer text-red-500 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  // Step 2: connected but not yet authenticated
  if (isConnected && !isAuthenticated) {
    return (
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-navy-100 mb-1">
          Sign in to your account
        </p>
        <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-4">
          Sign in so your data is protected by your account, not just the anon
          key.
        </p>

        <div className="flex flex-col gap-2 mb-4">
          <GoogleSignInButton
            onSignIn={() => onSignIn("google")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-semibold border border-slate-200 dark:border-navy-600 rounded-md bg-white dark:bg-navy-900 text-slate-700 dark:text-navy-100 cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onDisconnect}
          className="no-style text-xs text-slate-500 dark:text-navy-300 underline"
        >
          Disconnect
        </button>
      </div>
    )
  }

  // Step 1: not connected
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 dark:text-navy-100 mb-2">
        Connect Supabase
      </p>
      <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-2">
        By default, your data is stored in your browser and synced to What
        Todo's servers when you're signed in.
      </p>
      <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-3">
        Connecting your own Supabase project gives you full ownership of your
        data — it never touches What Todo's servers. This also unlocks using the{" "}
        <a
          href="https://supabase.com/docs/guides/getting-started/mcp"
          target="_blank"
          rel="noreferrer"
          className="underline text-slate-600 dark:text-navy-300 hover:text-slate-800 dark:hover:text-navy-100"
        >
          official Supabase MCP
        </a>{" "}
        as an alternative to What Todo's MCP server.
      </p>

      <div className="mb-2">
        <label
          htmlFor="supabase-url"
          className="block text-[11px] font-medium text-slate-500 dark:text-navy-400 mb-1"
        >
          PROJECT URL
        </label>
        <input
          id="supabase-url"
          type="url"
          placeholder="https://xxxx.supabase.co"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
          autoComplete="off"
          className="w-full p-2 border border-slate-200 dark:border-navy-600 rounded-md text-[13px] bg-white dark:bg-navy-900 text-slate-700 dark:text-navy-100 placeholder:text-slate-400 dark:placeholder:text-navy-500 outline-none focus:border-emerald-400"
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor="supabase-key"
          className="block text-[11px] font-medium text-slate-500 dark:text-navy-400 mb-1"
        >
          ANON KEY
        </label>
        <input
          id="supabase-key"
          type="password"
          placeholder="eyJhbGciOi..."
          value={anonKey}
          onChange={e => onAnonKeyChange(e.target.value)}
          autoComplete="off"
          className="w-full p-2 border border-slate-200 dark:border-navy-600 rounded-md text-[13px] bg-white dark:bg-navy-900 text-slate-700 dark:text-navy-100 placeholder:text-slate-400 dark:placeholder:text-navy-500 outline-none focus:border-emerald-400"
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2 leading-snug">{error}</p>
      )}

      <button
        type="button"
        onClick={onConnect}
        disabled={loading}
        className={cx(
          "w-full px-3 py-2 text-[13px] font-semibold border-none rounded-md text-white mb-3 transition-opacity",
          loading ? "opacity-60 cursor-wait" : "cursor-pointer hover:opacity-90"
        )}
        style={{ background: "#3ecf8e" }}
      >
        {loading ? "Connecting..." : "Connect"}
      </button>

      <button
        type="button"
        className="no-style text-xs text-slate-500 dark:text-navy-300 underline p-0"
        onClick={onToggleSetup}
      >
        {showSetup ? "Hide setup instructions" : "Need a Supabase project?"}
      </button>

      {showSetup && <SupabaseSetupGuide />}
    </div>
  )
}

function SupabaseConnector({
  isConnected,
  isAuthenticated,
  userEmail,
  syncStatus,
  lastSyncedAt,
  onConnect,
  onDisconnect,
  onSignIn,
  onSignOut,
  schemaOutdated,
  externalOpen,
  onExternalOpenChange
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = (val: boolean) => {
    setInternalOpen(val)
    onExternalOpenChange?.(val)
  }
  const [url, setUrl] = useState("")
  const [anonKey, setAnonKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [useSheet, setUseSheet] = useState(
    () => !window.matchMedia("(min-width: 64em)").matches
  )

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 64em)")
    const handler = (e: MediaQueryListEvent) => setUseSheet(!e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  const popoverRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(popoverRef, () => {
    if (!useSheet) setOpen(false)
  })

  const handleConnect = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setError("Both fields are required")
      return
    }

    setError(null)
    setLoading(true)

    try {
      await onConnect(url.trim(), anonKey.trim())
      setUrl("")
      setAnonKey("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    onDisconnect()
    setOpen(false)
  }

  const panelProps: PanelProps = {
    isConnected,
    isAuthenticated,
    userEmail,
    url,
    anonKey,
    error,
    loading,
    showSetup,
    onUrlChange: setUrl,
    onAnonKeyChange: setAnonKey,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onSignIn,
    onSignOut,
    onToggleSetup: () => setShowSetup(prev => !prev),
    schemaOutdated
  }

  const isControlled = externalOpen !== undefined

  const popoverAndSheet = (
    <>
      {/* Desktop popover */}
      {!useSheet && open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg p-4 shadow-xl z-30"
        >
          <ConnectorPanel {...panelProps} />
        </div>
      )}

      {/* Mobile sheet */}
      <Portal>
        <AnimatePresence>
          {useSheet && open && (
            <>
              <motion.div
                key="supabase-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-60"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                key="supabase-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-60 bg-white dark:bg-navy-800 rounded-t-2xl shadow-xl pb-safe"
              >
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-navy-600" />
                </div>
                <div className="px-8 pb-6 pt-2 overflow-y-auto max-h-[85vh]">
                  <ConnectorPanel {...panelProps} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )

  if (isControlled) {
    return popoverAndSheet
  }

  return (
    <div className="relative">
      {isConnected ? (
        <button
          type="button"
          className="flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer text-inherit font-inherit"
          onClick={() => setOpen(!open)}
        >
          <SyncIndicator syncStatus={syncStatus} lastSyncedAt={lastSyncedAt} />
          <div className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 inline-block shrink-0" />
            <span className="text-[13px] text-slate-500 dark:text-navy-400">
              {isAuthenticated ? "Syncing" : "Connect"}
            </span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          className="flex items-center gap-2 bg-transparent text-slate-500 dark:text-navy-400 border border-slate-200 dark:border-navy-600 rounded-lg px-3 py-1.5 text-[13px] font-medium cursor-pointer transition-all"
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#3ecf8e"
            e.currentTarget.style.color = "#3ecf8e"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = ""
            e.currentTarget.style.color = ""
          }}
          onClick={() => setOpen(!open)}
        >
          Connect Supabase
        </button>
      )}

      {popoverAndSheet}
    </div>
  )
}

export default SupabaseConnector
