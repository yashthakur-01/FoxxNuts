import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service_role key.
// This bypasses RLS — use ONLY in Next.js API routes (server-side), never in client components.
// Uses a Proxy to lazy-initialize on first property access, avoiding crashes during
// Next.js build when env vars aren't available.
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (!_supabaseAdmin) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        _supabaseAdmin = createClient(url!, key!);
    }
    return _supabaseAdmin;
}

// Proxy defers createClient() until runtime (first .from(), .auth(), etc. call)
// so importing this module at build time is safe.
const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        return Reflect.get(getSupabaseAdmin(), prop, receiver);
    },
});

export default supabaseAdmin;
