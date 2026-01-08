-- Add 3 Parlay Prop Bets for VC Game
-- Run this in Supabase SQL Editor

-- 1. Safe Parlay (1.2x)
INSERT INTO prop_bets (
  title,
  description,
  team_type,
  yes_odds,
  no_odds,
  expires_at,
  status,
  is_visible
) VALUES (
  '🟢 Safe Parlay (1.2x)',
  'Very likely, boring on purpose.
• VC to win
• Hank Lomber 15+ points
• Cooper Bonnett 4+ assists',
  'Boys',
  1.20,
  1.00,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  'active',
  true
);

-- 2. Medium Parlay (1.5x)
INSERT INTO prop_bets (
  title,
  description,
  team_type,
  yes_odds,
  no_odds,
  expires_at,
  status,
  is_visible
) VALUES (
  '🟡 Medium Parlay (1.5x)',
  'Realistic big-game lines.
• VC by 1–10 points
• Hank Lomber 18+ points
• Garrett Frank 12+ points
• VC under 14 turnovers',
  'Boys',
  1.50,
  1.00,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  'active',
  true
);

-- 3. Spicy Parlay (2.0x)
INSERT INTO prop_bets (
  title,
  description,
  team_type,
  yes_odds,
  no_odds,
  expires_at,
  status,
  is_visible
) VALUES (
  '🔴 Spicy Parlay (2.0x)',
  'Needs game flow, but not crazy.
• VC by 11+ points
• Hank Lomber 22+ points
• Garrett Frank 15+ points
• Cooper Bonnett 7+ assists
• VC 10+ steals',
  'Boys',
  2.00,
  1.00,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  'active',
  true
);

-- View newly created prop bets
SELECT id, title, description, yes_odds, expires_at, status, is_visible
FROM prop_bets
WHERE title LIKE '%Parlay%'
ORDER BY yes_odds ASC;
