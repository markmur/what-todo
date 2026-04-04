import React from "react"

function usePortal(): HTMLDivElement {
  const rootElemRef = React.useRef(document.createElement("div"))

  React.useEffect(function setupElement() {
    const parentElem = document.querySelector("#portal")
    const el = rootElemRef.current

    parentElem.appendChild(el)

    return () => el.remove()
  }, [])

  return rootElemRef.current
}

export default usePortal
