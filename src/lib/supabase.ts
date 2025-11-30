import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const isDev = import.meta.env.DEV;
  const message =
    "Missing Supabase environment variables. Please create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. See SUPABASE_SETUP.md for instructions.";

  if (isDev) {
    console.warn("⚠️", message);
    // En desarrollo, permitir que la app inicie pero mostrar warning
  } else {
    throw new Error(message);
  }
}

// Usar valores placeholder solo si estamos en desarrollo y faltan las variables
const url =
  supabaseUrl || (import.meta.env.DEV ? "https://placeholder.supabase.co" : "");
const key = supabaseAnonKey || (import.meta.env.DEV ? "placeholder-key" : "");

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
