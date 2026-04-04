import React, { useState } from "react"
import ChevronDown from "@meronex/icons/fi/FiChevronDown"
import ChevronUp from "@meronex/icons/fi/FiChevronUp"
import { useSettings } from "../context/SettingsContext"
import type { Label, LabelStyle, SortBy } from "../index.d"

function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        checked ? "bg-blue-500" : "bg-slate-300 dark:bg-navy-600"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 mt-0.5 ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

function SettingRow({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600 dark:text-navy-300">{label}</span>
      {children}
    </div>
  )
}

interface SettingsProps {
  labels: Label[]
}

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "pinned", label: "Pinned first" },
  { value: "created", label: "Date created" },
  { value: "label", label: "Label" }
]

const labelStyleOptions: { value: LabelStyle; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "pill", label: "Pill" }
]

export default function Settings({ labels }: SettingsProps) {
  const { settings, updateSetting } = useSettings()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      <div
        className="flex items-center cursor-pointer mb-1"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h1 className="text-4xl mt-4 mb-3 text-slate-300 dark:text-navy-500 font-bold">
          Settings
        </h1>
        <div className="align-center ml-1">
          {collapsed ? (
            <ChevronDown
              className="text-slate-300 dark:text-navy-500"
              style={{ verticalAlign: "middle" }}
            />
          ) : (
            <ChevronUp
              className="text-slate-300 dark:text-navy-500"
              style={{ verticalAlign: "middle" }}
            />
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="divide-y divide-slate-200 dark:divide-navy-700">
          <SettingRow label="Auto-collapse completed">
            <Toggle
              checked={settings.autoCollapseCompleted}
              onChange={v => updateSetting("autoCollapseCompleted", v)}
            />
          </SettingRow>

          <SettingRow label="Move completed to yesterday">
            <Toggle
              checked={settings.moveCompletedToYesterday}
              onChange={v => updateSetting("moveCompletedToYesterday", v)}
            />
          </SettingRow>

          <SettingRow label="Show task count">
            <Toggle
              checked={settings.showTaskCount}
              onChange={v => updateSetting("showTaskCount", v)}
            />
          </SettingRow>

          <SettingRow label="Compact mode">
            <Toggle
              checked={settings.compactMode}
              onChange={v => updateSetting("compactMode", v)}
            />
          </SettingRow>

          <SettingRow label="Auto-expand new tasks">
            <Toggle
              checked={settings.autoExpandNewTasks}
              onChange={v => updateSetting("autoExpandNewTasks", v)}
            />
          </SettingRow>

          <SettingRow label="Sort tasks by">
            <select
              value={settings.sortBy}
              onChange={e => updateSetting("sortBy", e.target.value as SortBy)}
              className="text-sm bg-slate-100 dark:bg-navy-700 dark:text-navy-200 border border-slate-200 dark:border-navy-600 rounded-sm px-2 py-1"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </SettingRow>

          <SettingRow label="Label style">
            <select
              value={settings.labelStyle}
              onChange={e =>
                updateSetting("labelStyle", e.target.value as LabelStyle)
              }
              className="text-sm bg-slate-100 dark:bg-navy-700 dark:text-navy-200 border border-slate-200 dark:border-navy-600 rounded-sm px-2 py-1"
            >
              {labelStyleOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </SettingRow>

          <SettingRow label="Default label">
            <select
              value={settings.defaultLabelId ?? ""}
              onChange={e =>
                updateSetting("defaultLabelId", e.target.value || null)
              }
              className="text-sm bg-slate-100 dark:bg-navy-700 dark:text-navy-200 border border-slate-200 dark:border-navy-600 rounded-sm px-2 py-1"
            >
              <option value="">None</option>
              {labels.map(l => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </SettingRow>
        </div>
      )}
    </div>
  )
}
