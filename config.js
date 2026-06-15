const NEXTBEAT_CONFIG = {
  eventName: "NextBeat",
  eventDate: "2026-06-13",
  eventLocation: "Kiskunhalas, Hősök tere 1.",

  // Supabase próba rendszerhez ide jönnek majd az adatok:
  SUPABASE_URL: "https://majmscyfzlvtjuropqvb.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_zKT2Cnrt6-VQSFHMUhgaFQ_R3EguW3P"
};

function hasSupabaseConfig() {
  return Boolean(NEXTBEAT_CONFIG.SUPABASE_URL && NEXTBEAT_CONFIG.SUPABASE_ANON_KEY);
}

function getSupabaseClient() {
  if (!hasSupabaseConfig()) return null;
  return window.supabase.createClient(NEXTBEAT_CONFIG.SUPABASE_URL, NEXTBEAT_CONFIG.SUPABASE_ANON_KEY);
}
