import "./tailwind.css"

import * as React from "react"

// Context
import ContextWrapper from "./App"
import Header from "./components/Header"
// Components
import Todo from "./components/Todo"
import Tooltip from "react-tooltip"
import { createRoot } from "react-dom/client"
import { useStorage } from "./context/StorageContext"

const App = () => {
  const { fetchData } = useStorage()

  React.useEffect(() => {
    fetchData()

    window.addEventListener("focus", fetchData)

    return () => {
      window.removeEventListener("focus", fetchData)
    }
  }, [fetchData])

  return (
    <main>
      <Header />
      <Todo />
      <Tooltip
        multiline={false}
        place="top"
        effect="solid"
        type="dark"
        backgroundColor="black"
      />
    </main>
  )
}

const container = document.getElementById("app")
if (!container) throw new Error("App container not found")
const root = createRoot(container)

root.render(
  <ContextWrapper>
    <App />
  </ContextWrapper>
)
