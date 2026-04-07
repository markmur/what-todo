import { createClient } from "npm:@supabase/supabase-js@2"
import { createHandler } from "./handler.ts"

// TODO: add Upstash rate limiting once traffic warrants it
// import { Ratelimit } from "npm:@upstash/ratelimit@2"
// import { Redis } from "npm:@upstash/redis@1"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
)

Deno.serve(createHandler(supabase))
