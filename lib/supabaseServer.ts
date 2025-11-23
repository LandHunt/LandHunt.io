// /lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;  // <-- service role

export const supabaseAdmin = createClient(url, service, {
  auth: { persistSession: false },
});

export const CLIENT_DOCS_BUCKET =
  process.env.SUPABASE_CLIENT_DOCS_BUCKET || "client-documents";
