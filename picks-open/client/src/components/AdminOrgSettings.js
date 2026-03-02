import React, { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../context/OrgContext';
import '../styles/AdminOrgSettings.css';

// ─── Curated Google Fonts list ─────────────────────────────────────────────────
const FONTS = [
  { label: 'Inter (Default)',   value: 'Inter' },
  { label: 'Roboto',            value: 'Roboto' },
  { label: 'Open Sans',         value: 'Open Sans' },
  { label: 'Montserrat',        value: 'Montserrat' },
  { label: 'Poppins',           value: 'Poppins' },
  { label: 'Raleway',           value: 'Raleway' },
  { label: 'Lato',              value: 'Lato' },
  { label: 'Nunito',            value: 'Nunito' },
  { label: 'Oswald',            value: 'Oswald' },
  { label: 'Bebas Neue',        value: 'Bebas Neue' },
  { label: 'Playfair Display',  value: 'Playfair Display' },
  { label: 'DM Sans',           value: 'DM Sans' },
];

// ─── Feature metadata ──────────────────────────────────────────────────────────
const FEATURES = [
  { key: 'leaderboard',   label: 'Leaderboard',      icon: '🏆', desc: 'Public ranking board of top users' },
  { key: 'prop_bets',     label: 'Prop Bets',        icon: '🎯', desc: 'Yes/No style custom bets created by admins' },
  { key: 'brackets',      label: 'Brackets',         icon: '📊', desc: 'Tournament bracket predictions' },
  { key: 'spin_wheel',    label: 'Spin Wheel',       icon: '🎡', desc: 'Daily prize spin wheel' },
  { key: 'daily_reward',  label: 'Daily Reward',     icon: '📅', desc: 'Daily login check-in bonus' },
  { key: 'achievements',  label: 'Achievements',     icon: '🥇', desc: 'Badge and achievement system' },
  { key: 'referrals',     label: 'Referrals',        icon: '👥', desc: 'Refer-a-friend program' },
  { key: 'teams',         label: 'Teams & Players',  icon: '👕', desc: 'Team rosters and schedules' },
  { key: 'browse_bets',   label: 'Browse Bets',      icon: '📋', desc: 'Public page listing all open bets' },
  { key: 'notifications', label: 'Notifications',    icon: '🔔', desc: 'In-app notification bell' },
];

const DEFAULT_FEATURES = Object.fromEntries(FEATURES.map(f => [f.key, true]));

const TABS = [
  { id: 'branding',    label: 'Branding',    icon: '🏷️' },
  { id: 'colors',      label: 'Colors',      icon: '🎨' },
  { id: 'typography',  label: 'Typography',  icon: '✏️' },
  { id: 'features',    label: 'Features',    icon: '⚙️' },
];

// ─── Color field (picker + hex input) ─────────────────────────────────────────
function ColorField({ label, name, value, hint, onChange }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
  return (
    <div className="oas-color-field">
      <label className="oas-label">{label}</label>
      <div className="oas-color-row">
        <input
          type="color"
          value={safe}
          onChange={e => onChange(name, e.target.value)}
          className="oas-color-swatch"
          title={label}
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(name, e.target.value)}
          className="oas-color-hex"
          maxLength={7}
          placeholder="#000000"
          spellCheck={false}
        />
      </div>
      {hint && <span className="oas-hint">{hint}</span>}
    </div>
  );
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`oas-toggle ${on ? 'on' : 'off'}`}
      onClick={onChange}
    >
      <span className="oas-toggle-thumb" />
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AdminOrgSettings() {
  const { config, updateConfig } = useOrg();
  const [tab, setTab]       = useState('branding');
  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState('');

  // Initialise form from context config
  useEffect(() => {
    if (!config) return;
    setForm({
      org_name:         config.org_name         || 'Open Picks',
      tagline:          config.tagline          || '',
      logo_url:         config.logo_url         || '/assets/logo.png',
      currency_name:    config.currency_name    || 'Picks Bucks',
      primary_color:    config.primary_color    || '#004f9e',
      background_color: config.background_color || '#0f1419',
      accent_color:     config.accent_color     || '#ffd700',
      surface_color:    config.surface_color    || '#1a2332',
      text_color:       config.text_color       || '#ffffff',
      heading_font:     config.heading_font     || 'Inter',
      body_font:        config.body_font        || 'Inter',
      features:         { ...DEFAULT_FEATURES, ...(config.features || {}) },
    });
  }, [config]);

  const set = useCallback((name, val) => {
    setForm(prev => ({ ...prev, [name]: val }));
    setSaved(false);
  }, []);

  const setColor  = useCallback((name, val) => set(name, val), [set]);

  const toggleFeature = useCallback((key) => {
    setForm(prev => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      await updateConfig(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to save — please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return <div className="oas-loading">Loading settings…</div>;
  }

  return (
    <div className="oas-page">
      {/* Page header */}
      <div className="oas-page-header">
        <div>
          <h2 className="oas-page-title">Organization Settings</h2>
          <p className="oas-page-sub">Control how your platform looks and which features are visible.</p>
        </div>
        <div className="oas-header-actions">
          {err    && <span className="oas-status oas-status--err">⚠ {err}</span>}
          {saved  && <span className="oas-status oas-status--ok">✓ Saved</span>}
          <button className="oas-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="oas-layout">
        {/* Sidebar tabs */}
        <nav className="oas-sidebar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`oas-tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              <span className="oas-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="oas-panel">

          {/* ── BRANDING ── */}
          {tab === 'branding' && (
            <section className="oas-section">
              <h3 className="oas-section-title">Branding</h3>
              <p className="oas-section-desc">These values are shown across the login page, navbar, notifications, and page title.</p>

              <div className="oas-grid-2">
                <div className="oas-field">
                  <label className="oas-label">Organization Name</label>
                  <input
                    type="text"
                    className="oas-input"
                    value={form.org_name}
                    onChange={e => set('org_name', e.target.value)}
                    placeholder="e.g. Eagle Picks"
                  />
                  <span className="oas-hint">Shown in the navbar and as the browser tab title.</span>
                </div>

                <div className="oas-field">
                  <label className="oas-label">Currency Name</label>
                  <input
                    type="text"
                    className="oas-input"
                    value={form.currency_name}
                    onChange={e => set('currency_name', e.target.value)}
                    placeholder="e.g. Eagle Bucks"
                  />
                  <span className="oas-hint">Used in balances, bet notifications, and prize displays.</span>
                </div>

                <div className="oas-field oas-field--full">
                  <label className="oas-label">Tagline</label>
                  <input
                    type="text"
                    className="oas-input"
                    value={form.tagline}
                    onChange={e => set('tagline', e.target.value)}
                    placeholder="e.g. Place Your Picks Today"
                  />
                  <span className="oas-hint">Short description shown under your logo on the login page.</span>
                </div>

                <div className="oas-field oas-field--full">
                  <label className="oas-label">Logo URL</label>
                  <input
                    type="text"
                    className="oas-input"
                    value={form.logo_url}
                    onChange={e => set('logo_url', e.target.value)}
                    placeholder="/assets/logo.png"
                  />
                  <span className="oas-hint">Path or URL to your logo. Transparent PNG recommended (200×200px).</span>
                </div>
              </div>

              {/* Branding preview card */}
              <div className="oas-preview-box">
                <span className="oas-preview-label">Preview</span>
                <div
                  className="oas-preview-login"
                  style={{ background: form.background_color, fontFamily: form.body_font }}
                >
                  {form.logo_url && (
                    <img
                      src={form.logo_url}
                      alt="logo"
                      className="oas-preview-logo"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div
                    className="oas-preview-org-name"
                    style={{ color: form.primary_color, fontFamily: form.heading_font }}
                  >
                    {form.org_name || 'Your Org Name'}
                  </div>
                  <div className="oas-preview-tagline" style={{ color: form.text_color }}>
                    {form.tagline || 'Your tagline here'}
                  </div>
                  <div
                    className="oas-preview-balance"
                    style={{ background: form.primary_color }}
                  >
                    1,000 {form.currency_name}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── COLORS ── */}
          {tab === 'colors' && (
            <section className="oas-section">
              <h3 className="oas-section-title">Colors</h3>
              <p className="oas-section-desc">Applied as CSS variables across the entire platform — changes take effect immediately after saving.</p>

              <div className="oas-colors-grid">
                <ColorField
                  label="Primary Color"
                  name="primary_color"
                  value={form.primary_color}
                  hint="Buttons, links, highlights, navbar accent"
                  onChange={setColor}
                />
                <ColorField
                  label="Background Color"
                  name="background_color"
                  value={form.background_color}
                  hint="Main page background"
                  onChange={setColor}
                />
                <ColorField
                  label="Accent Color"
                  name="accent_color"
                  value={form.accent_color}
                  hint="Badges, stars, secondary highlights"
                  onChange={setColor}
                />
                <ColorField
                  label="Surface / Card Color"
                  name="surface_color"
                  value={form.surface_color}
                  hint="Cards, panels, dropdown backgrounds"
                  onChange={setColor}
                />
                <ColorField
                  label="Text Color"
                  name="text_color"
                  value={form.text_color}
                  hint="Primary body text"
                  onChange={setColor}
                />
              </div>

              {/* Live color preview strip */}
              <div className="oas-preview-box oas-preview-box--no-pad">
                <span className="oas-preview-label">Live Preview</span>
                <div className="oas-color-preview" style={{ background: form.background_color }}>
                  <div
                    className="oas-cp-nav"
                    style={{
                      background: form.surface_color,
                      borderBottom: `2px solid ${form.primary_color}`,
                    }}
                  >
                    <span
                      style={{
                        color: form.primary_color,
                        fontFamily: form.heading_font,
                        fontWeight: 700,
                      }}
                    >
                      {form.org_name}
                    </span>
                    <span style={{ color: form.text_color, opacity: 0.6, fontSize: '0.8rem' }}>
                      Games · Leaderboard · Teams
                    </span>
                  </div>
                  <div className="oas-cp-body">
                    <div
                      className="oas-cp-card"
                      style={{
                        background: form.surface_color,
                        borderLeft: `3px solid ${form.primary_color}`,
                      }}
                    >
                      <div style={{ color: form.text_color, fontWeight: 600 }}>Home Team vs Away Team</div>
                      <div style={{ color: form.text_color, opacity: 0.65, fontSize: '0.85rem', marginTop: 2 }}>
                        Friday · 7:00 PM
                      </div>
                      <div className="oas-cp-card-footer">
                        <button
                          style={{
                            background: form.primary_color,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 14px',
                            cursor: 'default',
                            fontSize: '0.85rem',
                          }}
                        >
                          Place Bet
                        </button>
                        <span
                          className="oas-cp-accent-dot"
                          style={{ background: form.accent_color }}
                          title="Accent color"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── TYPOGRAPHY ── */}
          {tab === 'typography' && (
            <section className="oas-section">
              <h3 className="oas-section-title">Typography</h3>
              <p className="oas-section-desc">Select fonts from our curated list. Non-default fonts are loaded from Google Fonts automatically when you save.</p>

              <div className="oas-grid-2">
                <div className="oas-field">
                  <label className="oas-label">Heading Font</label>
                  <select
                    className="oas-select"
                    value={form.heading_font}
                    onChange={e => set('heading_font', e.target.value)}
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <span className="oas-hint">Page titles, navbar brand name, card headers.</span>
                  <div
                    className="oas-font-preview oas-font-preview--heading"
                    style={{ fontFamily: form.heading_font, color: form.primary_color }}
                  >
                    The Quick Brown Fox
                  </div>
                </div>

                <div className="oas-field">
                  <label className="oas-label">Body Font</label>
                  <select
                    className="oas-select"
                    value={form.body_font}
                    onChange={e => set('body_font', e.target.value)}
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <span className="oas-hint">Body text, labels, descriptions, form inputs.</span>
                  <div
                    className="oas-font-preview oas-font-preview--body"
                    style={{ fontFamily: form.body_font, color: form.text_color }}
                  >
                    Place your picks and climb the leaderboard. Win big with {form.currency_name}!
                  </div>
                </div>
              </div>

              {/* Typography preview card */}
              <div className="oas-preview-box">
                <span className="oas-preview-label">Preview</span>
                <div
                  className="oas-typo-preview"
                  style={{ background: form.surface_color }}
                >
                  <div
                    className="oas-typo-heading"
                    style={{ fontFamily: form.heading_font, color: form.primary_color }}
                  >
                    {form.org_name}
                  </div>
                  <div
                    className="oas-typo-sub"
                    style={{ fontFamily: form.heading_font, color: form.text_color }}
                  >
                    Leaderboard
                  </div>
                  <p
                    className="oas-typo-body"
                    style={{ fontFamily: form.body_font, color: form.text_color }}
                  >
                    You currently have <strong>1,250 {form.currency_name}</strong>. Place a bet on tonight's game to earn more!
                  </p>
                  <div
                    className="oas-typo-label"
                    style={{ fontFamily: form.body_font, color: form.text_color, opacity: 0.6 }}
                  >
                    Badge earned · 2 hours ago
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── FEATURES ── */}
          {tab === 'features' && (
            <section className="oas-section">
              <h3 className="oas-section-title">Features</h3>
              <p className="oas-section-desc">Disabled features are hidden from the navigation and their pages become inaccessible to users.</p>

              <div className="oas-features-list">
                {FEATURES.map(({ key, label, icon, desc }) => {
                  const active = form.features[key] !== false;
                  return (
                    <div
                      key={key}
                      className={`oas-feature-row ${active ? 'active' : 'inactive'}`}
                    >
                      <span className="oas-feature-icon">{icon}</span>
                      <div className="oas-feature-info">
                        <span className="oas-feature-name">{label}</span>
                        <span className="oas-feature-desc">{desc}</span>
                      </div>
                      <div className="oas-feature-right">
                        <span className={`oas-feature-badge ${active ? 'on' : 'off'}`}>
                          {active ? 'On' : 'Off'}
                        </span>
                        <Toggle
                          on={active}
                          onChange={() => toggleFeature(key)}
                          label={`${active ? 'Disable' : 'Enable'} ${label}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="oas-features-note">
                <strong>Note:</strong> Feature flags control UI visibility only. Existing data (bets, scores, etc.) is preserved when a feature is disabled.
              </div>
            </section>
          )}

          {/* Footer save bar */}
          <div className="oas-footer">
            {err   && <span className="oas-status oas-status--err">⚠ {err}</span>}
            {saved && <span className="oas-status oas-status--ok">✓ Changes saved successfully</span>}
            <button className="oas-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
