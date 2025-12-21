-- Add is_visible column to games table for visibility toggle feature
-- Run this migration if you already have the games table

-- Add the column if it doesn't exist (defaults to TRUE so all existing games remain visible)
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Set all existing games to visible
UPDATE games SET is_visible = TRUE WHERE is_visible IS NULL;
