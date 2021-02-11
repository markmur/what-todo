import React from "react"

interface Props {
  note: string
  heightRef: React.Ref<HTMLDivElement>
  onChange: (note: string) => void
}

const Notes: React.FC<Props> = ({ note = "", heightRef, onChange }) => {
  const [state, setState] = React.useState("")
  const [rows, setRows] = React.useState(2)

  React.useEffect(() => {
    setState(note)
  }, [note])

  React.useEffect(() => {
    const handler = () => {
      // @ts-ignore
      if (heightRef && heightRef.current) {
        // @ts-ignore
        setRows(Math.ceil(heightRef.current.clientHeight / 10))
      }
    }

    handler()

    window.addEventListener("resize", handler)

    return () => {
      window.removeEventListener("resize", handler)
    }
  }, [])

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
      onBlur={handleBlur}
      onChange={handleChange}
    />
  )
}

export default Notes
