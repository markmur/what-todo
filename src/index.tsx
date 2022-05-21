import * as React from "react"
import * as ReactDOM from "react-dom"
import Tooltip from "react-tooltip"

// Components
import Todo from "./components/Todo"
import Header from "./components/Header"

// Context
import ContextWrapper from "./App"
import { useStorage } from "./context/StorageContext"

const App = () => {
  const { fetchData } = useStorage()

  React.useEffect(() => {
    fetchData()

    window.addEventListener("focus", fetchData)

    return () => {
      window.removeEventListener("focus", fetchData)
    }
  }, [])

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

ReactDOM.render(
  <ContextWrapper>
    <App />
  </ContextWrapper>,
  document.getElementById("todo")
)
