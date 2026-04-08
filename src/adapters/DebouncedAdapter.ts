import { Data } from "../index.d"
import { StorageAdapter } from "./StorageAdapter"

/**
 * Wraps any StorageAdapter with write debouncing.
 *
 * Rapid calls to set() are coalesced so only the last value is
 * written after the debounce window. This prevents racing network
 * requests when the user performs many actions in quick succession
 * (e.g. checking off multiple tasks).
 *
 * Reads always go through to the inner adapter, but if a write is
 * pending, get() returns the pending value to keep the UI consistent.
 */
export type SyncStatus = "idle" | "syncing" | "error"

export interface SyncListener {
  (status: SyncStatus, syncedAt?: Date): void
}

export class DebouncedAdapter implements StorageAdapter {
  readonly isAsync = true

  private timer: ReturnType<typeof setTimeout> | null = null
  private pendingData: Data | null = null
  private writePromise: Promise<void> | null = null
  private syncListener: SyncListener | null = null

  constructor(
    private inner: StorageAdapter,
    private debounceMs = 300
  ) {}

  /** Register a callback that fires when sync status changes. */
  onSyncChange(listener: SyncListener) {
    this.syncListener = listener
  }

  async get(): Promise<Data | null> {
    // If there's a pending write, return that value so the caller
    // sees the latest data without waiting for the flush.
    if (this.pendingData) return this.pendingData
    return this.inner.get()
  }

  async set(data: Data): Promise<void> {
    this.pendingData = data

    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      this.flush()
    }, this.debounceMs)
  }

  async clear(): Promise<void> {
    this.cancelPending()
    return this.inner.clear()
  }

  testConnection?(): Promise<void> {
    return this.inner.testConnection?.() ?? Promise.resolve()
  }

  /** Force-flush any pending write immediately. */
  async flush(): Promise<void> {
    if (!this.pendingData) return

    const data = this.pendingData
    this.pendingData = null
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    this.syncListener?.("syncing")
    try {
      this.writePromise = this.inner.set(data)
      await this.writePromise
      this.writePromise = null
      this.syncListener?.("idle", new Date())
    } catch (err) {
      this.writePromise = null
      console.error("[DebouncedAdapter] write failed:", err)
      this.syncListener?.("error")
    }
  }

  private cancelPending() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.pendingData = null
  }
}
