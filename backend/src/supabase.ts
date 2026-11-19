import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import process from "process";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  throw new Error("Lipsesc datele Supabase!");
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});