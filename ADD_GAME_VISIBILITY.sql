-- Add is_visible column to games table for visibility toggle feature
-- Run this migration in Supabase SQL Editor

-- Add the column (defaults to TRUE so all existing games remain visible)
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Update any null values to true
UPDATE games SET is_visible = TRUE WHERE is_visible IS NULL;
