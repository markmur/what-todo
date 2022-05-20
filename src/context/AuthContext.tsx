import React, { PropsWithChildren } from "react"
import { User, onAuthStateChanged, getAuth } from "firebase/auth"
import { useEffect } from "react"
import firebase from "../utils/firebase"

interface Context {
  user: Pick<User, "displayName" | "email" | "uid" | "photoURL"> | null
  signedIn: boolean
}

const AuthContext = React.createContext<Context>({
  user: null,
  signedIn: false
})

interface Props {
  firebase: typeof firebase
}

function AuthProvider({ firebase, children }: PropsWithChildren<Props>): any {
  const [user, setUser] = React.useState(null)
  const [signedIn, setLoginState] = React.useState(false)

  const getUser = (result: User): Context["user"] => {
    return {
      displayName: result.displayName,
      email: result.email,
      photoURL: result.photoURL,
      uid: result.uid
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(firebase.app), result => {
      if (result) {
        setUser(getUser(result))
        setLoginState(true)
      } else {
        setUser(null)
        setLoginState(false)
      }
    })

    return unsubscribe
  }, [onAuthStateChanged, getAuth, firebase.app])

  const value = React.useMemo(() => {
    return { user, signedIn }
  }, [user, signedIn])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): any {
  return React.useContext(AuthContext)
}

export default AuthProvider
