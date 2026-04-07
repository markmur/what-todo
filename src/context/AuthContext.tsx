import React, { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import Toast from "../components/Toast"
import WaitlistSheet from "../components/WaitlistSheet"

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

interface OAuthError {
  code: string | null
  description: string | null
}

function parseOAuthError(): OAuthError | null {
  const params = new URLSearchParams(window.location.search)
  const code = params.get("error_code")
  const description = params.get("error_description")
  if (!code && !description) return null

  const clean = new URL(window.location.href)
  clean.searchParams.delete("error")
  clean.searchParams.delete("error_code")
  clean.searchParams.delete("error_description")
  window.history.replaceState(null, "", clean.toString())

  return {
    code,
    description: description
      ? decodeURIComponent(description.replace(/\+/g, " "))
      : null
  }
}

export function AuthProvider({ children }: React.PropsWithChildren<unknown>) {
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<OAuthError | null>(() =>
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

  const isWaitlistError = authError?.code === "signup_disabled"

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

      {authError && !isWaitlistError && (
        <Toast
          message={authError.description ?? "Sign in failed"}
          onDismiss={() => setAuthError(null)}
        />
      )}

      <WaitlistSheet
        open={isWaitlistError}
        onClose={() => setAuthError(null)}
      />
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
