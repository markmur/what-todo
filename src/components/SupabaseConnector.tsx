import { useRef, useState } from "react"
import cx from "classnames"
import useOnClickOutside from "../hooks/onclickoutside"
import SupabaseSetupGuide from "./SupabaseSetupGuide"
import { SyncStatus } from "../adapters/DebouncedAdapter"

interface Props {
  isConnected: boolean
  syncStatus: SyncStatus
  lastSyncedAt: Date | null
  onConnect: (url: string, anonKey: string) => Promise<void>
  onDisconnect: () => void
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
      <span className="text-[11px] text-slate-400 dark:text-navy-500">
        Syncing…
      </span>
    )
  }

  if (syncStatus === "error") {
    return <span className="text-[11px] text-red-500">Sync failed</span>
  }

  if (lastSyncedAt) {
    return (
      <span className="text-[11px] text-slate-400 dark:text-navy-500">
        {formatLastSynced(lastSyncedAt)}
      </span>
    )
  }

  return null
}

function SupabaseConnector({
  isConnected,
  syncStatus,
  lastSyncedAt,
  onConnect,
  onDisconnect
}: Props) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [anonKey, setAnonKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => setOpen(false))

  const handleConnect = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setError("Both fields are required")
      return
    }

    setError(null)
    setLoading(true)

    try {
      await onConnect(url.trim(), anonKey.trim())
      setOpen(false)
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

  return (
    <div ref={ref} className="relative">
      {isConnected ? (
        <button
          type="button"
          className="flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer text-inherit font-inherit"
          onClick={() => setOpen(prev => !prev)}
        >
          <SyncIndicator syncStatus={syncStatus} lastSyncedAt={lastSyncedAt} />
          <div className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 inline-block shrink-0" />
            <span className="text-[13px] text-slate-500 dark:text-navy-400">
              Connected
            </span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          className="flex items-center gap-2 bg-transparent text-slate-500 dark:text-navy-400 border border-slate-200 dark:border-navy-600 rounded-lg px-3 py-1.5 text-[13px] font-medium cursor-pointer transition-all hover:border-emerald-400 hover:text-emerald-400"
          onClick={() => setOpen(prev => !prev)}
        >
          Connect Supabase
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg p-4 shadow-xl z-[100]">
          {isConnected ? (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="text-sm font-semibold text-slate-700 dark:text-navy-100">
                  Connected to Supabase
                </span>
              </div>
              <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-3">
                Your data is being synced to your Supabase instance.
              </p>
              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full px-3 py-2 text-[13px] font-semibold border border-slate-200 dark:border-navy-600 rounded-md bg-white dark:bg-navy-800 cursor-pointer text-red-500 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-navy-100 mb-3">
                Connect Supabase
              </p>
              <p className="text-[13px] text-slate-500 dark:text-navy-400 mb-3">
                Sync your data to your own Supabase instance. Your data stays
                yours.
              </p>

              <p className="text-[11px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-1.5 mb-3 leading-snug">
                🔒 Your project URL and anon key give full access to your data.
                Never share them with anyone.
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
                  onChange={e => setUrl(e.target.value)}
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
                  onChange={e => setAnonKey(e.target.value)}
                  autoComplete="off"
                  className="w-full p-2 border border-slate-200 dark:border-navy-600 rounded-md text-[13px] bg-white dark:bg-navy-900 text-slate-700 dark:text-navy-100 placeholder:text-slate-400 dark:placeholder:text-navy-500 outline-none focus:border-emerald-400"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 mb-2 leading-snug">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleConnect}
                disabled={loading}
                className={cx(
                  "w-full px-3 py-2 text-[13px] font-semibold border-none rounded-md text-white mb-3 transition-opacity",
                  loading
                    ? "opacity-60 cursor-wait"
                    : "cursor-pointer hover:opacity-90"
                )}
                style={{ background: "#3ecf8e" }}
              >
                {loading ? "Connecting..." : "Connect"}
              </button>

              <button
                type="button"
                className="no-style text-xs text-slate-400 dark:text-navy-500 underline p-0"
                onClick={() => setShowSetup(prev => !prev)}
              >
                {showSetup
                  ? "Hide setup instructions"
                  : "Need a Supabase instance?"}
              </button>

              {showSetup && <SupabaseSetupGuide />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SupabaseConnector
