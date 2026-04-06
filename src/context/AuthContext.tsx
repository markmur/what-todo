import React, { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import Toast from "../components/Toast"

export type OAuthProvider = "google"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  supabaseConfigured: boolean
  signIn: (provider: OAuthProvider) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  supabaseConfigured: false,
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve()
})

function parseOAuthError(): string | null {
  const params = new URLSearchParams(window.location.search)
  const description = params.get("error_description")
  if (!description) return null

  // Clean the error params from the URL without triggering a navigation
  const clean = new URL(window.location.href)
  clean.searchParams.delete("error")
  clean.searchParams.delete("error_code")
  clean.searchParams.delete("error_description")
  window.history.replaceState(null, "", clean.toString())

  return decodeURIComponent(description.replace(/\+/g, " "))
}

export function AuthProvider({ children }: React.PropsWithChildren<unknown>) {
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(() =>
    parseOAuthError()
  )

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async (provider: OAuthProvider) => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    })
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        supabaseConfigured: !!supabase,
        signIn,
        signOut
      }}
    >
      {children}
      {authError && (
        <Toast message={authError} onDismiss={() => setAuthError(null)} />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
