import React from "react"

function usePortal(): HTMLDivElement {
  const rootElemRef = React.useRef(document.createElement("div"))

  React.useEffect(function setupElement() {
    const parentElem = document.querySelector("#portal")
    if (!parentElem) return

    const currentElem = rootElemRef.current
    parentElem.appendChild(currentElem)

    return () => currentElem.remove()
  }, [])

  return rootElemRef.current
}

export default usePortal
