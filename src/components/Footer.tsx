import React from "react"
// Icons
import ReportIcon from "@meronex/icons/fi/FiFrown"
import RequestIcon from "@meronex/icons/fi/FiSmile"
import SaveIcon from "@meronex/icons/fi/FiSave"
import MoonIcon from "@meronex/icons/fi/FiMoon"
import SunIcon from "@meronex/icons/fi/FiSun"
import { parseDataStr } from "../utils"
import { useStorage } from "../context/StorageContext"
import { useDarkMode } from "../context/DarkModeContext"

const iconProps = {
  fontSize: 22,
  cursor: "pointer"
}

const linkProps = {
  target: "_blank",
  rel: "noreferrer"
}

const Footer: React.FC = () => {
  const { data, uploadData } = useStorage()
  const { darkMode, toggleDarkMode } = useDarkMode()
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
  const downloadLinkRef = React.useRef()

  const downloadJSON = React.useCallback(() => {
    if (downloadLinkRef && downloadLinkRef.current) {
      // @ts-ignore
      downloadLinkRef.current.click()
    }
  }, [data])

  const handleSecretUpload = React.useCallback(() => {
    const value = window.prompt("Insert todo data object")
    const parsed = parseDataStr(value) as any

    if (Object.keys(parsed).length > 0) {
      uploadData(parsed)
    }
  }, [parseDataStr, uploadData])

  return (
    <footer>
      <div className="flex justify-between">
        <em data-tip="🤷‍♂️">
          <a {...linkProps} onDoubleClick={handleSecretUpload}>
            What Todo
          </a>
        </em>

        <div className="flex items-center">
          <div className="ml-2">
            <button
              className="no-style"
              data-tip={darkMode ? "Light mode" : "Dark mode"}
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <SunIcon {...iconProps} />
              ) : (
                <MoonIcon {...iconProps} />
              )}
            </button>
          </div>

          <div className="ml-2">
            <a
              ref={downloadLinkRef}
              hidden
              href={dataStr}
              download="what-todo-data.json"
            />
            <SaveIcon
              data-tip="Download your data"
              {...iconProps}
              onClick={downloadJSON}
            />
          </div>

          <div className="ml-2">
            <a
              {...linkProps}
              data-tip="Request a feature"
              href="https://github.com/markmur/what-todo/issues/new?title=[Feature Request]"
            >
              <RequestIcon {...iconProps} />
            </a>
          </div>

          <div className="ml-2">
            <a
              {...linkProps}
              data-tip="Report a bug"
              href="https://github.com/markmur/what-todo/issues/new?title=[Bug Report]"
            >
              <ReportIcon {...iconProps} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
