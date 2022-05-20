import React from "react"
import firebase from "../utils/firebase"
import { useAuth } from "../context/AuthContext"

function Header(): any {
  const { user, signedIn } = useAuth()
  return (
    <header>
      {signedIn ? (
        <p>Signed in as {user?.displayName}</p>
      ) : (
        <button onClick={() => firebase.actions.loginWithGoogle()}>
          Login
        </button>
      )}
    </header>
  )
}

export default Header
