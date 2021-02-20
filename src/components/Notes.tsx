import React from "react"
import { markdownToDraft, draftToMarkdown } from "markdown-draft-js"
import { convertFromRaw, convertToRaw, EditorState } from "draft-js"
import { Editor } from "react-draft-wysiwyg"

// Styles
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css"

const options = {
  inline: true,
  fontSize: false,
  list: true
}

const toolbar = {
  options: Object.entries(options)
    .map(([key, enabled]) => (enabled ? key : undefined))
    .filter(Boolean),
  inline: {
    options: ["bold", "italic", "underline", "strikethrough"]
  },
  list: {
    options: ["ordered", "unordered"]
  }
}

interface Props {
  note: string
  heightRef: React.Ref<HTMLDivElement>
  onChange: (note: string) => void
}

const getState = (note: string): EditorState => {
  return EditorState.createWithContent(convertFromRaw(markdownToDraft(note)))
}

const Notes: React.FC<Props> = ({ note = "", onChange }) => {
  const initialEditorState = getState(note)
  const [editorState, setEditorState] = React.useState<EditorState>(
    initialEditorState
  )

  React.useEffect(() => {
    setEditorState(getState(note))
  }, [note])

  const handleBlur = React.useCallback(() => {
    const markdown = getMarkdown(editorState)

    onChange(markdown)
  }, [editorState, onChange])

  const handleChange = React.useCallback(
    state => {
      setEditorState(state)
    },
    [editorState]
  )

  const getMarkdown = (state: EditorState) => {
    const content = state.getCurrentContent()
    return draftToMarkdown(convertToRaw(content))
  }

  return (
    <Editor
      toolbar={toolbar}
      editorState={editorState}
      editorClassName="notes-input"
      toolbarClassName="notes-input-toolbar"
      wrapperClassName="notes-input-wrapper"
      onBlur={handleBlur}
      onEditorStateChange={handleChange}
      placeholder="Notes"
    />
  )
}

export default Notes
