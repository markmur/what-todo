-- ============================================================
-- what-todo.app — Supabase schema
-- Run this in the Supabase SQL editor to set up the database.
-- ============================================================


-- ------------------------------------------------------------
-- Users
-- Auto-populated via trigger on auth.users insert.
-- api_token is issued to the user for MCP server access.
-- supabase_url is set if the user connects their own project.
-- ------------------------------------------------------------

CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  api_token   UUID NOT NULL DEFAULT gen_random_uuid(),
  supabase_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own row" ON users
  FOR SELECT USING (auth.uid() = id);


-- ------------------------------------------------------------
-- Trigger: create a user row on sign-up
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ------------------------------------------------------------
-- Todos
-- Stores the full data blob per user (mirrors the localStorage
-- structure). Used when the user is authenticated and has not
-- connected their own Supabase project.
-- ------------------------------------------------------------

CREATE TABLE todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own todos" ON todos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE todos ADD CONSTRAINT todos_user_id_unique UNIQUE (user_id);


-- ------------------------------------------------------------
-- Waitlist
-- Stores emails from users who requested early access.
-- ------------------------------------------------------------

CREATE TABLE waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);


-- ------------------------------------------------------------
-- User's own Supabase project schema
-- Run this in the SQL editor of the USER'S Supabase project,
-- not the what-todo.app project.
-- ------------------------------------------------------------

-- CREATE TABLE what_todo_data (
--   id          TEXT PRIMARY KEY DEFAULT 'default',
--   user_id     UUID NOT NULL DEFAULT auth.uid(),
--   data        JSONB NOT NULL DEFAULT '{}'::jsonb,
--   updated_at  TIMESTAMPTZ DEFAULT now()
-- );
--
-- ALTER TABLE what_todo_data ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Owner access" ON what_todo_data
--   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
