import React from "react"

function usePortal(): HTMLDivElement {
  const rootElemRef = React.useRef(document.createElement("div"))

  React.useEffect(function setupElement() {
    const parentElem = document.querySelector("#portal")

    parentElem.appendChild(rootElemRef.current)

    return () => rootElemRef.current.remove()
  }, [])

  return rootElemRef.current
}

export default usePortal
