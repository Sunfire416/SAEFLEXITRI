require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // pour bypass RLS côté serveur
const supabase = createClient(url, key);

(async () => {
    const { data, error } = await supabase
        .from("users")
        .select("user_id,email,role")
        .eq("email", "agent@test.com")
        .single();

    if (error) {
        console.error("❌ Supabase error:", error);
        process.exit(1);
    }
    console.log("✅ Supabase OK:", data);
})();
