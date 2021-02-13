import React from "react"
import { Flex, Box } from "rebass"
import {
  FiFrown as ReportIcon,
  FiSmile as RequestIcon,
  FiLock as PrivacyIcon,
  FiSave as SaveIcon
} from "react-icons/fi"

import { DataContext } from "../index"

const iconProps = {
  fontSize: 22,
  cursor: "pointer"
}

const linkProps = {
  target: "_blank",
  rel: "noreferrer"
}

const Footer: React.FC = () => {
  const { data, usage, quota } = React.useContext(DataContext)
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
          <Box mt={-1}>
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
