import React from "react"

interface Props {
  note: string
  heightRef: React.Ref<HTMLDivElement>
  onChange: (note: string) => void
}

const Notes: React.FC<Props> = ({ note = "", onChange }) => {
  const [state, setState] = React.useState("")
  const [rows] = React.useState(2)

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
      rows={rows}
      value={state}
      placeholder="Notes"
      className="notes-input"
      style={{ height: "100%" }}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  )
}

export default Notes
