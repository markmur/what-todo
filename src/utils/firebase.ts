import { FirebaseApp, initializeApp } from "firebase/app"
import {
  Auth,
  AuthProvider,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential
} from "firebase/auth"
import { getDatabase, ref, get } from "firebase/database"

export function getTasks(userId: string): any {
  const db = getDatabase()
  return get(ref(db, "tasks/" + userId))
}

const firebaseConfig = {
  apiKey: "AIzaSyB0P0A5Or0x4iyVVMgVtkMEFcV7qoo--U8",
  authDomain: "what-todo-59b4f.firebaseapp.com",
  projectId: "what-todo-59b4f",
  storageBucket: "what-todo-59b4f.appspot.com",
  messagingSenderId: "521454161606",
  databaseURL:
    "https://what-todo-59b4f-default-rtdb.europe-west1.firebasedatabase.app/",
  appId: "1:521454161606:web:4f7cc4b5f00902efdd11c7"
}

const app = initializeApp(firebaseConfig)

enum ProviderKey {
  google = "google"
}

function init(): {
  app: FirebaseApp
  auth: Auth
  providers: Record<ProviderKey, AuthProvider>
  actions: {
    loginWithGoogle: () => Promise<UserCredential>
  }
} {
  const auth = getAuth(app)
  const providers = {
    google: new GoogleAuthProvider()
  }

  const loginWithGoogle = async () => {
    const auth = getAuth()

    try {
      const result = await signInWithPopup(auth, providers.google)
      // This gives you a Google Access Token. You can use it to access the Google API.
      // const credential = GoogleAuthProvider.credentialFromResult(result)
      // const token = credential.accessToken
      // The signed-in user info.
      return result
    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code
      const errorMessage = error.message
      // The email of the user's account used.
      const email = error.customData.email
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error)
      console.error({ errorCode, errorMessage, email, credential })
      return error
    }
  }

  return {
    app,
    auth,
    providers,
    actions: {
      loginWithGoogle
    }
  }
}

const firebase = (() => {
  return init()
})()

export default firebase
