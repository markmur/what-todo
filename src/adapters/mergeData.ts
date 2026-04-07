import { Data, Task, Label } from "../index.d"

/**
 * Merge two Data objects. Tasks and labels are deduplicated by ID.
 * Remote sections/filters take precedence over local.
 */
export function mergeData(local: Data, remote: Data): Data {
  const taskMap = new Map<string, Task>()

  // Add remote tasks first, then local — local wins on conflict
  for (const tasks of Object.values(remote.tasks ?? {})) {
    for (const task of tasks) taskMap.set(task.id, task)
  }
  for (const tasks of Object.values(local.tasks ?? {})) {
    for (const task of tasks) taskMap.set(task.id, task)
  }

  // Re-bucket merged tasks by their date key
  const mergedTasks: Data["tasks"] = {}
  for (const task of taskMap.values()) {
    const key = new Date(task.created_at).toDateString()
    mergedTasks[key] = [...(mergedTasks[key] ?? []), task]
  }

  const labelMap = new Map<string, Label>()
  for (const label of remote.labels ?? []) labelMap.set(label.id, label)
  for (const label of local.labels ?? []) labelMap.set(label.id, label)

  return {
    ...remote,
    tasks: mergedTasks,
    labels: Array.from(labelMap.values())
  }
}
