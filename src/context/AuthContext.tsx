import React, { PropsWithChildren, useEffect } from "react"
import {
  User,
  onAuthStateChanged,
  getAuth,
  signOut as firebaseSignOut
} from "firebase/auth"
import firebase from "../utils/firebase"

interface Auth {
  loading: boolean
  user: Pick<User, "displayName" | "email" | "uid" | "photoURL"> | null
  signedIn: boolean
  signOut: () => void
}

const AuthContext = React.createContext<Auth>({
  loading: false,
  user: null,
  signedIn: false,
  signOut: () => undefined
})

interface Props {
  firebase: typeof firebase
}

function AuthProvider({ firebase, children }: PropsWithChildren<Props>): any {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [signedIn, setLoginState] = React.useState(false)

  const getUser = (result: User): Auth["user"] => {
    return {
      displayName: result.displayName,
      email: result.email,
      photoURL: result.photoURL,
      uid: result.uid
    }
  }

  const signOut = () => {
    return firebaseSignOut(firebase.auth)
  }

  useEffect(() => {
    setLoading(true)
    return onAuthStateChanged(getAuth(firebase.app), result => {
      setLoading(false)
      if (result) {
        setUser(getUser(result))
        setLoginState(true)
      } else {
        setUser(null)
        setLoginState(false)
      }
    })
  }, [onAuthStateChanged, getAuth, firebase.app])

  return (
    <AuthContext.Provider value={{ user, signedIn, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): Auth {
  return React.useContext(AuthContext)
}

export default AuthProvider
