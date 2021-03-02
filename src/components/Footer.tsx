import React from "react"
import { Flex, Box } from "rebass"

// Icons
import ReportIcon from "@meronex/icons/fi/FiFrown"
import RequestIcon from "@meronex/icons/fi/FiSmile"
import PrivacyIcon from "@meronex/icons/fi/FiLock"
import SaveIcon from "@meronex/icons/fi/FiSave"

import { DataContext } from "../index"
import { parseDataStr } from "@src/utils"

const iconProps = {
  fontSize: 22,
  cursor: "pointer"
}

const linkProps = {
  target: "_blank",
  rel: "noreferrer"
}

const Footer: React.FC = () => {
  const { data, usage, quota, uploadData } = React.useContext(DataContext)
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
  const downloadLinkRef = React.useRef()

  const downloadJSON = React.useCallback(() => {
    if (downloadLinkRef && downloadLinkRef.current) {
      // @ts-ignore
      downloadLinkRef.current.click()
    }
  }, [data])

  return (
    <footer>
      <Flex justifyContent="space-between">
        <em data-tip="🤷‍♂️">
          <a {...linkProps} href="https://github.com/markmur/what-todo">
            What Todo
          </a>
        </em>

        <Flex alignItems="center">
          <Box
            mt={-1}
            onDoubleClick={() => {
              const value = window.prompt("Insert todo data object")
              const parsed = parseDataStr(value) as any

              if (Object.keys(parsed).length > 0) {
                uploadData(parsed)
              }
            }}
          >
            <div data-tip={`Storage usage (MAX: ${quota})`} {...iconProps}>
              ({usage})
            </div>
          </Box>

          <Box ml={2}>
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
          </Box>

          <Box ml={2}>
            <span data-tip="Privacy: your data is stored in browser storage and nowhere else. This extension does not send your data over the network.">
              <PrivacyIcon {...iconProps} />
            </span>
          </Box>

          <Box ml={2}>
            <a
              {...linkProps}
              data-tip="Request a feature"
              href="https://github.com/markmur/what-todo/issues/new?title=[Feature Request]"
            >
              <RequestIcon {...iconProps} />
            </a>
          </Box>

          <Box ml={2}>
            <a
              {...linkProps}
              data-tip="Report a bug"
              href="https://github.com/markmur/what-todo/issues/new?title=[Bug Report]"
            >
              <ReportIcon {...iconProps} />
            </a>
          </Box>
        </Flex>
      </Flex>
    </footer>
  )
}

export default Footer
