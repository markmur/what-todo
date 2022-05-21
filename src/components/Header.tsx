import React from "react"
import firebase from "../utils/firebase"
import { useAuth } from "../context/AuthContext"
import { Box, Flex } from "rebass"
import { BilGoogle as Google } from "@meronex/icons/bi"

function Header(): any {
  const { user, signedIn, loading, signOut } = useAuth()
  return (
    <header>
      <strong>What Todo 🤷‍♂️</strong>
      {loading ? (
        <div />
      ) : signedIn && user && !loading ? (
        <Flex alignItems="center">
          <Box textAlign="right" mr={3} fontSize={13}>
            <p>{user.displayName}</p>
            <small>{user.email}</small>
          </Box>

          <button className="auth" onClick={signOut}>
            Logout
          </button>
        </Flex>
      ) : (
        <button
          className="auth"
          onClick={() => firebase.actions.loginWithGoogle()}
        >
          <Google /> Login with Google
          <sup>BETA</sup>
        </button>
      )}
    </header>
  )
}

export default Header
