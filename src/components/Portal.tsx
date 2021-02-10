import React from "react"
import ReactDOM from "react-dom"

import usePortal from "../hooks/portal"

const Portal: React.FC = ({ children }) => {
  const target = usePortal()
  return ReactDOM.createPortal(children, target)
}

export default Portal
