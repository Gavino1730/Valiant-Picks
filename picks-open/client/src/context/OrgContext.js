import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// ─── Feature defaults (all enabled unless DB says otherwise) ──────────────────
const DEFAULT_FEATURES = {
  leaderboard:   true,
  prop_bets:     true,
  brackets:      true,
  spin_wheel:    true,
  daily_reward:  true,
  achievements:  true,
  referrals:     true,
  teams:         true,
  browse_bets:   true,
  notifications: true,
};

// ─── Org defaults (shown instantly before the API responds) ───────────────────
const ORG_DEFAULTS = {
  org_name:         'Open Picks',
  tagline:          'Sports Picks Platform — Place Your Picks Today',
  logo_url:         '/assets/logo.png',
  primary_color:    '#004f9e',
  background_color: '#0f1419',
  accent_color:     '#ffd700',
  surface_color:    '#1a2332',
  text_color:       '#ffffff',
  heading_font:     'Inter',
  body_font:        'Inter',
  currency_name:    'Picks Bucks',
  features:         DEFAULT_FEATURES,
  setup_complete:   false,
};

// ─── Google Fonts loader (deduplicates, no flash) ─────────────────────────────
const loadedFonts = new Set(['Inter']); // Inter loaded via CSS already
function loadGoogleFont(fontName) {
  if (!fontName || loadedFonts.has(fontName)) return;
  loadedFonts.add(fontName);
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;600;700;900&display=swap`;
  document.head.appendChild(link);
}

// ─── Context ──────────────────────────────────────────────────────────────────
const OrgContext = createContext({
  config:        ORG_DEFAULTS,
  sports:        [],
  features:      DEFAULT_FEATURES,
  loading:       true,
  error:         null,
  refreshConfig: () => {},
  updateConfig:  async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function OrgProvider({ children }) {
  const [config,  setConfig]  = useState(ORG_DEFAULTS);
  const [sports,  setSports]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Apply all CSS variables to :root and load Google Fonts
  const applyCssVars = useCallback((cfg) => {
    if (!cfg) return;
    const root = document.documentElement;
    root.style.setProperty('--primary-color',    cfg.primary_color    || '#004f9e');
    root.style.setProperty('--background-color', cfg.background_color || '#0f1419');
    root.style.setProperty('--accent-color',     cfg.accent_color     || '#ffd700');
    root.style.setProperty('--surface-color',    cfg.surface_color    || '#1a2332');
    root.style.setProperty('--text-color',       cfg.text_color       || '#ffffff');
    root.style.setProperty('--heading-font', `'${cfg.heading_font || 'Inter'}', sans-serif`);
    root.style.setProperty('--body-font',    `'${cfg.body_font    || 'Inter'}', sans-serif`);
    loadGoogleFont(cfg.heading_font);
    loadGoogleFont(cfg.body_font);
  }, []);

  // Fetch org settings + sports from the API
  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, sportsRes] = await Promise.all([
        axios.get('/api/config'),
        axios.get('/api/config/sports'),
      ]);

      const cfg = configRes.data.config;
      // Merge DB features with defaults so missing keys always default to true
      cfg.features = { ...DEFAULT_FEATURES, ...(cfg.features || {}) };

      setConfig(cfg);
      setSports(sportsRes.data.sports || []);
      applyCssVars(cfg);

      if (cfg.org_name) {
        document.title = `${cfg.org_name} — ${cfg.tagline || 'Sports Picks Platform'}`;
      }

      setError(null);
    } catch (err) {
      console.error('OrgContext: failed to load config', err.message);
      setError('Could not load organization settings');
      applyCssVars(ORG_DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, [applyCssVars]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Admin: push updated fields to the API and apply immediately
  const updateConfig = useCallback(async (fields) => {
    const token = localStorage.getItem('token');
    const res = await axios.put('/api/config', fields, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = {
      ...res.data.config,
      features: { ...DEFAULT_FEATURES, ...(res.data.config.features || {}) },
    };
    setConfig(updated);
    applyCssVars(updated);
    return updated;
  }, [applyCssVars]);

  // Derived: features always has every key (defaults to true if missing)
  const features = { ...DEFAULT_FEATURES, ...(config.features || {}) };

  return (
    <OrgContext.Provider value={{ config, sports, features, loading, error, refreshConfig: fetchConfig, updateConfig }}>
      {children}
    </OrgContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useOrg() {
  return useContext(OrgContext);
}

export default OrgContext;
