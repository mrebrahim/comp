"use client";

import { createBrowserClient } from "@supabase/ssr";

// The publishable key is designed to ship in browser JS. It grants nothing on
// its own: every office table has RLS with policies bound to the
// `authenticated` role, so an unsigned visitor reads zero rows.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
