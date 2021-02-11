import React from "react"

interface Props {
  note: string
  onChange: (note: string) => void
}

const Notes: React.FC<Props> = ({ note = "", onChange }) => {
  const [state, setState] = React.useState("")

  React.useEffect(() => {
    setState(note)
  }, [note])

  const handleBlur = React.useCallback(() => {
    onChange(state)
  }, [state, onChange])

  const handleChange = React.useCallback(
    event => {
      setState(event.target.value)
    },
    [state]
  )

  return (
    <textarea
      rows={15}
      value={state}
      placeholder="Notes"
      className="notes-input"
      onBlur={handleBlur}
      onChange={handleChange}
    />
  )
}

export default Notes
