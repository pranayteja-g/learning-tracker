import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://zhkidmfhromlbqwzjije.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoa2lkbWZocm9tbGJxd3pqaWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxODQ1NTUsImV4cCI6MjA5OTc2MDU1NX0.zXDueGAj3q3FBvMGa97BcRQV1fjn36VyDr25j6CxyhI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
  global: {
    // Plain fetch() calls get killed by the browser the instant a page
    // starts unloading (refresh, close, navigate away) — even ones kicked
    // off from a pagehide/visibilitychange handler racing the unload. That
    // silently drops writes that fire right before a refresh: the optimistic
    // UI update (and any local cache) shows the change, but it never
    // actually reaches Supabase. `keepalive` tells the browser to let the
    // request finish in the background instead of aborting it.
    // (Keepalive requests are capped around 64KB combined — fine for the
    // small JSON payloads this app writes.)
    fetch: (url, options = {}) => fetch(url, { ...options, keepalive: true }),
  },
});
