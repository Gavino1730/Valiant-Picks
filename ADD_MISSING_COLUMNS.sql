-- Add missing columns to teams table
-- Run this in Supabase SQL Editor to fix schema

ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_motto TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS assistant_coach TEXT;

-- Update existing teams with data
UPDATE teams 
SET assistant_coach = 'John Efstathiou', team_motto = 'BTA'
WHERE name = 'Valley Catholic Boys Basketball';

UPDATE teams 
SET assistant_coach = '', team_motto = ''
WHERE name = 'Valley Catholic Girls Basketball';
