import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

/**
 * Admin Supabase client that bypasses RLS.
 * Use ONLY on the server-side for operations that need to bypass row-level security,
 * such as development/testing with fake user IDs.
 */
export const createAdminClient = () => {
  if (!supabaseSecretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is required for admin operations. " +
        "Add it to your .env.local file.",
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
