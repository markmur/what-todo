import React, { PropsWithChildren, useEffect } from "react"
import { getDatabase, ref, get, set } from "firebase/database"
import { useAuth } from "./AuthContext"
import { set as setKey, merge } from "lodash-es"
import { Data } from "../index.d"
import { useStorage } from "./StorageContext"

interface Context {
  fetchPersistedData: () => Promise<Data>
  persistData: (data: Data) => Promise<void>
}

const noop = () => undefined

const FirebaseContext = React.createContext<Context>({
  fetchPersistedData: noop,
  persistData: noop
})

function transformObjectsToArray(
  data: Record<string, any>,
  path = undefined,
  results: any = {}
) {
  for (const [key, value] of Object.entries(data)) {
    const nextPath = path ? [path, key].join(".") : key
    if (typeof value === "object" && !Array.isArray(value)) {
      transformObjectsToArray(value, nextPath, results)
    } else {
      setKey(results, nextPath, value)
    }
  }

  return results
}

function FirebaseProvider({ children }: PropsWithChildren<unknown>): any {
  const { storage, data } = useStorage()
  const { user, signedIn } = useAuth()

  const mergeFirebaseData = (local: Data, persisted: Data) => {
    return merge({}, local, persisted)
  }

  useEffect(() => {
    async function fetchTasks() {
      const synced = await fetchPersistedData()
      storage.mergePersistedFirebaseData(mergeFirebaseData(data, synced))
    }

    if (signedIn && user) {
      fetchTasks()
    }
  }, [signedIn, user])

  async function fetchPersistedData() {
    if (user) {
      const db = getDatabase()
      const results = await get(ref(db, "tasks/" + user.uid))
      const data = results.toJSON()
      return transformObjectsToArray(data)
    } else {
      console.warn("Trying to fetch data before user is authenticated")
    }
  }

  async function persistData(data: Data) {
    if (user) {
      const db = getDatabase()
      const result = await set(ref(db, "tasks/" + user.uid), data)
      console.log(
        "%cSuccessfully persisted data to Firebase",
        "color:green;font-weight:bold'"
      )
      return result
    } else {
      console.warn("Trying to persist data before user is authenticated")
    }
  }

  async function handleSync(newData: Data) {
    try {
      return persistData(newData)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    storage.subscribe(handleSync)

    return () => storage.unsubscribe(handleSync)
  }, [user])

  const api = React.useMemo(() => {
    return { fetchPersistedData, persistData }
  }, [])

  return (
    <FirebaseContext.Provider value={api}>{children}</FirebaseContext.Provider>
  )
}

export function useFirebase(): Context {
  const context = React.useContext(FirebaseContext)

  if (context === null) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }

  return context
}

export default FirebaseProvider
