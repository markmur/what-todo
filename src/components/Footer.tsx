import React from "react"
// Icons
import ReportIcon from "@meronex/icons/fi/FiFrown"
import RequestIcon from "@meronex/icons/fi/FiSmile"
import SaveIcon from "@meronex/icons/fi/FiSave"
import MoonIcon from "@meronex/icons/fi/FiMoon"
import SunIcon from "@meronex/icons/fi/FiSun"
import { useStorage } from "../context/StorageContext"
import { useDarkMode } from "../context/DarkModeContext"
import ImportModal from "./ImportModal"

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
  }, [])

  const [importOpen, setImportOpen] = React.useState(false)

  return (
    <footer>
      <div className="flex justify-between">
        <em data-tooltip-id="tooltip" data-tooltip-content="🤷‍♂️">
          <a {...linkProps} onDoubleClick={() => setImportOpen(true)}>
            What Todo
          </a>
        </em>

        <div className="flex items-center">
          <div className="ml-2 flex items-center">
            <button
              className="no-style flex items-center"
              data-tooltip-id="tooltip"
              data-tooltip-content={darkMode ? "Light mode" : "Dark mode"}
              onClick={toggleDarkMode}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
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
              data-tooltip-id="tooltip"
              data-tooltip-content="Download your data"
              {...iconProps}
              onClick={downloadJSON}
            />
          </div>

          <div className="ml-2">
            <a
              {...linkProps}
              data-tooltip-id="tooltip"
              data-tooltip-content="Request a feature"
              href="https://github.com/markmur/what-todo/issues/new?title=[Feature Request]"
            >
              <RequestIcon {...iconProps} />
            </a>
          </div>

          <div className="ml-2">
            <a
              {...linkProps}
              data-tooltip-id="tooltip"
              data-tooltip-content="Report a bug"
              href="https://github.com/markmur/what-todo/issues/new?title=[Bug Report]"
            >
              <ReportIcon {...iconProps} />
            </a>
          </div>
        </div>
      </div>
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={uploadData}
      />
    </footer>
  )
}

export default Footer
