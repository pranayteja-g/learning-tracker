import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://zhkidmfhromlbqwzjije.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoa2lkbWZocm9tbGJxd3pqaWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxODQ1NTUsImV4cCI6MjA5OTc2MDU1NX0.zXDueGAj3q3FBvMGa97BcRQV1fjn36VyDr25j6CxyhI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
});
