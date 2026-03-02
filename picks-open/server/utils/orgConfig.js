/**
 * orgConfig.js — server-side helper for org settings
 *
 * Caches org settings in memory for 5 minutes so every route that needs
 * `currency_name`, `org_name`, etc. doesn't hit the DB on every request.
 */

const supabase = require('../supabase');

let cache = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns the org_settings row (all fields).
 * Uses in-memory cache; re-fetches after TTL expires.
 */
async function getOrgConfig() {
  const now = Date.now();
  if (cache && now < cacheExpiry) return cache;

  const { data, error } = await supabase
    .from('org_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('orgConfig: failed to fetch org_settings:', error.message);
    // Return a safe fallback so notification strings don't break
    return {
      org_name:         'Open Picks',
      currency_name:    'Picks Bucks',
      primary_color:    '#004f9e',
      background_color: '#0f1419',
      accent_color:     '#ffd700',
      surface_color:    '#1a2332',
      text_color:       '#ffffff',
      heading_font:     'Inter',
      body_font:        'Inter',
      features:         null,
      setup_complete:   true,
    };
  }

  cache       = data;
  cacheExpiry = now + CACHE_TTL_MS;
  return data;
}

/**
 * Convenience helper — returns just the currency name string.
 * Use wherever you'd previously hardcode "Valiant Bucks".
 */
async function getCurrencyName() {
  const cfg = await getOrgConfig();
  return cfg.currency_name || 'Picks Bucks';
}

/**
 * Bust the cache (call after an admin updates org_settings).
 */
function bustOrgConfigCache() {
  cache       = null;
  cacheExpiry = 0;
}

module.exports = { getOrgConfig, getCurrencyName, bustOrgConfigCache };
