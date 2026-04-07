import { useCallback, useRef, useState } from "react"
import cx from "classnames"
import MenuIcon from "@meronex/icons/fi/FiMenu"
import SupabaseConnector from "./SupabaseConnector"
import McpSetupSheet from "./McpSetupSheet"
import { GoogleSignInButton } from "./GoogleSignInButton"
import { useStorage } from "../context/StorageContext"
import { useAuth } from "../context/AuthContext"
import useOnClickOutside from "../hooks/onclickoutside"
import { useSchemaCheck } from "../hooks/useSchemaCheck"

async function seedFromFile() {
  try {
    const res = await fetch("/seed-data.json")
    const seed = await res.json()
    const today = new Date().toDateString()
    const data = {
      migrated: true,
      filters: [],
      tasks: {
        [today]: seed.tasks.map((t: Record<string, unknown>, i: number) => ({
          id: crypto.randomUUID(),
          title: t.title,
          description: t.description || "",
          completed: false,
          created_at: new Date(Date.now() + i * 1000).toISOString(),
          labels: t.labels || [],
          pinned: t.pinned || false
        }))
      },
      labels: seed.labels,
      sections: {
        completed: { collapsed: true },
        focus: {},
        sidebar: { collapsed: false }
      }
    }
    localStorage.setItem("what-todo", JSON.stringify(data))
    window.location.reload()
  } catch {
    // silently fail
  }
}

function UserMenu({
  user,
  isSupabaseConnected,
  schemaOutdated,
  onSignOut,
  onOpenStorage
}: {
  user: { email?: string; user_metadata?: { avatar_url?: string } }
  isSupabaseConnected: boolean
  schemaOutdated: boolean
  onSignOut: () => void
  onOpenStorage: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => setOpen(false))

  const avatar = user.user_metadata?.avatar_url
  const email = user.email

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center bg-transparent border-none p-0 cursor-pointer"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Account menu"
      >
        {avatar ? (
          <img
            src={avatar}
            alt={email ?? "User"}
            className="w-7 h-7 rounded-full"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-navy-600 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-navy-300">
            {(email ?? "?")[0].toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg shadow-xl z-[100] overflow-hidden">
          {email && (
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-navy-700">
              <p className="text-xs text-slate-400 dark:text-navy-500 truncate">
                Signed in as
              </p>
              <p className="text-[13px] font-medium text-slate-700 dark:text-navy-100 truncate">
                {email}
              </p>
            </div>
          )}

          <div className="border-b border-slate-100 dark:border-navy-700">
            <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-500">
              Advanced
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onOpenStorage()
              }}
              className="w-full text-left px-3 py-2 mb-1 text-[13px] text-slate-600 dark:text-navy-300 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors cursor-pointer bg-transparent border-none flex items-center justify-between rounded-lg"
            >
              <span>Connect custom Supabase</span>
              <div className="flex items-center gap-1.5">
                {schemaOutdated && (
                  <span className="text-[10px] font-semibold text-amber-500">
                    Update needed
                  </span>
                )}
                {isSupabaseConnected && !schemaOutdated && (
                  <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 inline-block" />
                )}
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className="w-full text-left px-3 py-2.5 text-[13px] text-red-500 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors cursor-pointer bg-transparent border-none"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function McpPill() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-style hidden md:inline-flex text-[11px] font-medium text-slate-400 dark:text-navy-500 hover:text-slate-600 dark:hover:text-navy-300 transition-colors px-2.5 py-1 rounded-full border border-slate-200 dark:border-navy-600 mr-1"
      >
        /mcp
      </button>
      <McpSetupSheet
        open={open}
        onClose={() => setOpen(false)}
        apiToken={user?.id ?? null}
      />
    </>
  )
}

function Header({
  className,
  onMenuClick,
  completedCount,
  totalCount,
  date
}: {
  className?: string
  onMenuClick?: () => void
  completedCount?: number
  totalCount?: number
  date?: string
}) {
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleLogoTap = useCallback(() => {
    tapCount.current++
    clearTimeout(tapTimer.current)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      seedFromFile()
    } else {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0
      }, 1500)
    }
  }, [])

  const { user, isAuthenticated, supabaseConfigured, signIn, signOut } =
    useAuth()

  const {
    data,
    isSupabaseConnected,
    syncStatus,
    lastSyncedAt,
    connectSupabase,
    disconnectSupabase
  } = useStorage()

  const [storageOpen, setStorageOpen] = useState(false)
  const schemaOutdated = useSchemaCheck(data, isSupabaseConnected)

  return (
    <header
      className={cx(
        className,
        "border-b border-slate-100 dark:border-navy-700 flex items-center justify-between"
      )}
      style={{ padding: "2em 16px", maxHeight: 66 }}
    >
      <div className="flex items-baseline gap-3">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <h1
          className="text-base font-bold dark:text-navy-100 cursor-default select-none leading-none"
          onClick={handleLogoTap}
        >
          What Todo 🤷‍♂️
        </h1>
        {typeof totalCount === "number" && (
          <span
            className="hidden md:inline text-xs font-semibold bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-navy-300 rounded-full px-2 py-0.5 leading-none"
            style={{ verticalAlign: "baseline" }}
            aria-label={`${completedCount} of ${totalCount} tasks completed`}
            role="status"
          >
            {completedCount}/{totalCount}
          </span>
        )}
        {date && (
          <time className="hidden md:inline text-xs text-slate-400 dark:text-navy-400 leading-none">
            {date}
          </time>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <McpPill />
            <SupabaseConnector
              isConnected={isSupabaseConnected}
              isAuthenticated={isAuthenticated}
              userEmail={user?.email ?? null}
              syncStatus={syncStatus}
              lastSyncedAt={lastSyncedAt}
              onConnect={connectSupabase}
              onDisconnect={disconnectSupabase}
              onSignIn={signIn}
              onSignOut={signOut}
              schemaOutdated={schemaOutdated}
              externalOpen={storageOpen}
              onExternalOpenChange={setStorageOpen}
            />
            <UserMenu
              user={user}
              isSupabaseConnected={isSupabaseConnected}
              schemaOutdated={schemaOutdated}
              onSignOut={signOut}
              onOpenStorage={() => setStorageOpen(true)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <McpPill />
            {supabaseConfigured && <GoogleSignInButton />}
          </div>
        )}
        {onMenuClick && (
          <button
            className="no-style dark:text-navy-100"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <MenuIcon fontSize={22} />
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
