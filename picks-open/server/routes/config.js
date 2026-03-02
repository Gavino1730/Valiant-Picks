const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { bustOrgConfigCache } = require('../utils/orgConfig');

// ─── GET /api/config ──────────────────────────────────────────────────────────
// Public — returns org settings needed to render the app (name, colors, logo, etc.)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('org_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    res.json({ success: true, config: data });
  } catch (err) {
    console.error('GET /api/config error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load org settings' });
  }
});

// ─── PUT /api/config ──────────────────────────────────────────────────────────
// Admin only — update org settings
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      org_name,
      tagline,
      logo_url,
      primary_color,
      background_color,
      accent_color,
      surface_color,
      text_color,
      heading_font,
      body_font,
      currency_name,
      features,
      setup_complete,
    } = req.body;

    // Build update object — only include fields that were actually sent
    const updates = {};
    if (org_name          !== undefined) updates.org_name          = org_name;
    if (tagline           !== undefined) updates.tagline           = tagline;
    if (logo_url          !== undefined) updates.logo_url          = logo_url;
    if (primary_color     !== undefined) updates.primary_color     = primary_color;
    if (background_color  !== undefined) updates.background_color  = background_color;
    if (accent_color      !== undefined) updates.accent_color      = accent_color;
    if (surface_color     !== undefined) updates.surface_color     = surface_color;
    if (text_color        !== undefined) updates.text_color        = text_color;
    if (heading_font      !== undefined) updates.heading_font      = heading_font;
    if (body_font         !== undefined) updates.body_font         = body_font;
    if (currency_name     !== undefined) updates.currency_name     = currency_name;
    if (features          !== undefined) updates.features          = features;
    if (setup_complete    !== undefined) updates.setup_complete    = setup_complete;
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 1) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    // Always update row id=1 (single-row settings table)
    const { data, error } = await supabase
      .from('org_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    bustOrgConfigCache(); // invalidate server-side cache
    res.json({ success: true, config: data });
  } catch (err) {
    console.error('PUT /api/config error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update org settings' });
  }
});

// ─── GET /api/config/sports ───────────────────────────────────────────────────
// Public — returns all active sports
router.get('/sports', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ success: true, sports: data });
  } catch (err) {
    console.error('GET /api/config/sports error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load sports' });
  }
});

// ─── POST /api/config/sports ──────────────────────────────────────────────────
// Admin only — add a new sport
router.post('/sports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, icon, bet_types } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Sport name is required' });
    }

    const { data, error } = await supabase
      .from('sports')
      .insert([{
        name,
        icon:      icon      || null,
        bet_types: bet_types || ['winner', 'spread', 'over_under'],
        is_active: true,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, sport: data });
  } catch (err) {
    console.error('POST /api/config/sports error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create sport' });
  }
});

// ─── PUT /api/config/sports/:id ───────────────────────────────────────────────
// Admin only — update a sport
router.put('/sports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, bet_types, is_active } = req.body;

    const updates = {};
    if (name      !== undefined) updates.name      = name;
    if (icon      !== undefined) updates.icon      = icon;
    if (bet_types !== undefined) updates.bet_types = bet_types;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('sports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, sport: data });
  } catch (err) {
    console.error('PUT /api/config/sports/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update sport' });
  }
});

// ─── DELETE /api/config/sports/:id ────────────────────────────────────────────
// Admin only — deactivate a sport (soft delete)
router.delete('/sports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('sports')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, sport: data });
  } catch (err) {
    console.error('DELETE /api/config/sports/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to deactivate sport' });
  }
});

module.exports = router;
