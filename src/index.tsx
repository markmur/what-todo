import "./tailwind.css"

import * as React from "react"

// Context
import ContextWrapper from "./App"
// Components
import Todo from "./components/Todo"
import Tooltip from "./components/Tooltip"
import { createRoot } from "react-dom/client"
import { useStorage } from "./context/StorageContext"
import { initMCPRelay } from "./hooks/useMCPRelay"

initMCPRelay()

const App = () => {
  const { fetchData } = useStorage()

  React.useEffect(() => {
    fetchData()

    window.addEventListener("focus", fetchData)

    return () => {
      window.removeEventListener("focus", fetchData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Todo />
      <Tooltip />
    </>
  )
}

const container = document.getElementById("app")!
const root = createRoot(container)

root.render(
  <ContextWrapper>
    <App />
  </ContextWrapper>
)
