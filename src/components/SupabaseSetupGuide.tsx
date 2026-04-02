const SQL_SNIPPET = `CREATE TABLE what_todo_data (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE what_todo_data ENABLE ROW LEVEL SECURITY;

-- Allow full access via the anon key.
-- This is safe because each user has their own Supabase project.
-- The project URL + anon key act as the credentials — only someone
-- who knows both can read or write the data.
CREATE POLICY "Owner access" ON what_todo_data
  FOR ALL USING (true) WITH CHECK (true);`

const containerStyle: React.CSSProperties = {
  marginTop: 8,
  padding: 12,
  background: "#f9f9f9",
  borderRadius: 6,
  fontSize: 12,
  lineHeight: 1.5,
  color: "#555"
}

const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 16 }

const preStyle: React.CSSProperties = {
  background: "#1e1e1e",
  color: "#d4d4d4",
  padding: 10,
  borderRadius: 4,
  fontSize: 11,
  overflow: "auto",
  margin: "8px 0",
  whiteSpace: "pre-wrap"
}

function SupabaseSetupGuide() {
  return (
    <div style={containerStyle}>
      <ol style={listStyle}>
        <li>
          Go to{" "}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#3ecf8e" }}
          >
            supabase.com
          </a>{" "}
          and create a free project.
        </li>
        <li>
          Open the <strong>SQL Editor</strong> and run:
        </li>
      </ol>
      <pre style={preStyle}>{SQL_SNIPPET}</pre>
      <ol start={3} style={listStyle}>
        <li>
          Copy the <strong>Project URL</strong> and <strong>anon key</strong>{" "}
          from <em>Settings → API</em>.
        </li>
        <li>Paste them above and click Connect.</li>
      </ol>
      <p style={{ fontSize: 11, color: "#888", margin: "8px 0 0" }}>
        All your devices share the same data. Enter the same project URL and
        anon key on each device to sync.
      </p>
    </div>
  )
}

export default SupabaseSetupGuide
