const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!supabaseUrl || !supabaseKey) throw new Error("Missing keys");
const supabase = createClient(supabaseUrl, supabaseKey);

async function reload() {
  const { data, error } = await supabase.rpc('reload_schema_cache', {});
  console.log("RPC:", data, error);
}

reload();
