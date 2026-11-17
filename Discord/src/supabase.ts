import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const rawUrl = process.env.SUPABASE_URL || "https://hwcyvqnswnhfixrlgmas.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_cgFhwS6S3gnhWjQ13zELVg_Zq9cbDI_";

export const supabase = createClient(supabaseUrl, supabaseKey);
