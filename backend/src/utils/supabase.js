const { createClient } = require("@supabase/supabase-js");

let supabaseClient = null;

const getClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials are not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return supabaseClient;
};

// Use a Proxy so we don't have to change other files importing 'supabase'
const supabase = new Proxy({}, {
  get: (target, prop) => {
    return getClient()[prop];
  }
});

module.exports = { supabase };
