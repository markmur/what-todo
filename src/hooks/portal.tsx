import React from "react"

function usePortal(): HTMLDivElement {
  const [el] = React.useState(() => document.createElement("div"))

  React.useEffect(() => {
    const parentElem = document.querySelector("#portal")
    parentElem?.appendChild(el)
    return () => el.remove()
  }, [el])

  return el
}

export default usePortal
