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

const Footer: React.FC = () => {
  const data = React.useContext(DataContext)
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
          <a href="https://github.com/markmur/what-todo">What Todo</a>
        </em>

        <Flex>
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
              data-tip="Request a feature"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/markmur/what-todo/issues/new?title=[Feature Request]"
            >
              <RequestIcon {...iconProps} />
            </a>
          </Box>

          <Box ml={2}>
            <a
              data-tip="Report a bug"
              target="_blank"
              rel="noreferrer"
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
