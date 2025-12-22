-- ============================================
-- VALLEY CATHOLIC BASKETBALL - REAL TEAM DATA
-- Run this in Supabase SQL Editor to populate teams
-- ============================================

-- First, delete any existing teams to start fresh
DELETE FROM teams;

-- Create the two teams
INSERT INTO teams (name, type, description, record_wins, record_losses, created_at, updated_at)
VALUES 
  ('Valley Catholic Boys Basketball', 'Boys', 'Team description pending', 0, 0, NOW(), NOW()),
  ('Valley Catholic Girls Basketball', 'Girls', 'Team description pending', 0, 0, NOW(), NOW());

-- Update Boys Team with complete roster and schedule
UPDATE teams
SET 
  description = 'Depth for days and pace that never slows. The floor is spaced with shooters, the rim is under constant threat, and there''s no such thing as taking a possession off. The goal is simple: win state. Anything less is a failure. The team motto is BTA and they play like it.',
  record_wins = 4,
  record_losses = 1,
  league_record = '0-0',
  ranking = 'Rank #3',
  coach_name = 'Bryan Fraser',
  coach_bio = 'OG hooper out of Sac Town with 11 years on the sideline and zero tolerance for bad basketball. Backed by Coach John Efstathiou, a towering presence whose laugh echoes through the gym and whose clipboard slams are felt emotionally and physically.',
  
  -- Complete roster with 13 players
  players = '[
    {
      "number": "1",
      "name": "Cooper Bonnett",
      "position": "G",
      "grade": "12",
      "bio": "White Chocolate with a Beaverton passport. Thinks he''s from the trenches, actually runs the streets of Beaverton. Lil Bloodhound Coop hunts defenders, sniffs out ankles, and lets you know about it after."
    },
    {
      "number": "2",
      "name": "Alex Post",
      "position": "G",
      "grade": "11",
      "bio": "Cannot be guarded by modern defensive schemes. The AP quicklay is folklore at this point. You play perfect defense, he scores anyway, shrugs, jogs back."
    },
    {
      "number": "3",
      "name": "Gavin Galan",
      "position": "F",
      "grade": "12",
      "bio": "Granola powered menace. Loves nature, hikes, trees, then immediately drops his shoulder and commits violence in the lane. Walking technical foul. Will fight you, will get T''d up, will not score."
    },
    {
      "number": "4",
      "name": "Kye Fixter",
      "position": "F",
      "grade": "11",
      "bio": "Shifty Kye. Ankles evaporate on contact. Defender leans once and it''s over. Lives off of fade away buckets, no matter the distance."
    },
    {
      "number": "5",
      "name": "Marcos Mueller",
      "position": "G",
      "grade": "12",
      "bio": "Straight from the streets of Ecuador, allegedly. Jumper is completely broken. Never smiles. Never talks. Pierced ears confuse defenders even more."
    },
    {
      "number": "10",
      "name": "Matthew Gunther",
      "position": "G",
      "grade": "12",
      "bio": "Golden retriever energy but deadly. Always ready to eat. Silent but dangerous. Plays like John Stockton if Stockton never said a word and just ruined your offense quietly."
    },
    {
      "number": "11",
      "name": "Tyler Eddy",
      "position": "G",
      "grade": "10",
      "bio": "Going to the league. At least spiritually. Plays like every possession is a mixtape clip. Wants smoke at all times."
    },
    {
      "number": "15",
      "name": "Elijah Schaal",
      "position": "G",
      "grade": "12",
      "bio": "Actual saint. Would help you up after fouling you hard. Then rebounds like Dennis Rodman and outsmarts everyone on the floor. Effort is through the roof."
    },
    {
      "number": "20",
      "name": "Hank Lomber",
      "position": "F",
      "grade": "11",
      "bio": "Absolute wildcard. Will randomly pull from three with no warning and drain it. Looks harmless until he''s cooking you for no reason."
    },
    {
      "number": "22",
      "name": "Sam Robbins",
      "position": "F",
      "grade": "10",
      "bio": "6''7 post with confidence to match. Strong in the paint, strong aura. Knows exactly what''s going on at all times."
    },
    {
      "number": "23",
      "name": "Garrett Frank",
      "position": "G",
      "grade": "11",
      "bio": "G6. Human highlight reel. If he gets a lane, the rim is in danger. Dunks so hard the gym shakes."
    },
    {
      "number": "24",
      "name": "Michael Mehta",
      "position": "G",
      "grade": "12",
      "bio": "The Pharaoh. Elite shooter. Brain operates at genius speed and also forgets every single play. Somehow still ends up wide open."
    },
    {
      "number": "44",
      "name": "Liam Plep",
      "position": "C",
      "grade": "12",
      "bio": "Big body. Screens so lethal they should be illegal. You hit one and question your life choices."
    }
  ]'::jsonb,
  
  -- Complete schedule (past and upcoming games)
  schedule = '[
    {"date": "2025-12-03", "time": "7:30 PM", "opponent": "Knappa", "location": "Away", "type": "Non League", "result": "W", "score": "83-58"},
    {"date": "2025-12-05", "time": "7:30 PM", "opponent": "Gladstone", "location": "Home", "type": "Non League", "result": "W", "score": "88-41"},
    {"date": "2025-12-09", "time": "7:00 PM", "opponent": "Scappoose", "location": "Away", "type": "Non League", "result": "L", "score": "69-90"},
    {"date": "2025-12-12", "time": "6:00 PM", "opponent": "Pleasant Hill", "location": "Home", "type": "Non League", "result": "W", "score": "73-45"},
    {"date": "2025-12-15", "time": "7:30 PM", "opponent": "Banks", "location": "Home", "type": "Non League", "result": "W", "score": "87-65"},
    {"date": "2025-12-22", "time": "2:30 PM", "opponent": "Tillamook", "location": "Home", "type": "Non League", "result": "Scheduled"},
    {"date": "2025-12-28", "time": "12:30 PM", "opponent": "Jefferson", "location": "Home", "type": "Tournament", "result": "Scheduled"},
    {"date": "2025-12-29", "time": "11:45 AM", "opponent": "Mid Pacific, HI", "location": "Home", "type": "Tournament", "result": "Scheduled"},
    {"date": "2025-12-30", "time": "6:45 PM", "opponent": "Regis", "location": "Home", "type": "Tournament", "result": "Scheduled"},
    {"date": "2026-01-03", "time": "3:00 PM", "opponent": "Western Christian", "location": "Away", "type": "Non League", "result": "Scheduled"},
    {"date": "2026-01-06", "time": "7:30 PM", "opponent": "Horizon Christian, Tualatin", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-08", "time": "7:30 PM", "opponent": "Westside Christian", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-10", "time": "6:30 PM", "opponent": "De La Salle North Catholic", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-13", "time": "7:30 PM", "opponent": "Oregon Episcopal", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-16", "time": "7:30 PM", "opponent": "Catlin Gabel", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-20", "time": "7:30 PM", "opponent": "Riverside, WLWV", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-22", "time": "7:30 PM", "opponent": "Portland Adventist Academy", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-24", "time": "6:30 PM", "opponent": "Horizon Christian, Tualatin", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-27", "time": "7:30 PM", "opponent": "Westside Christian", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-30", "time": "7:30 PM", "opponent": "De La Salle North Catholic", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-03", "time": "7:30 PM", "opponent": "Oregon Episcopal", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-06", "time": "7:30 PM", "opponent": "Catlin Gabel", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-10", "time": "6:00 PM", "opponent": "Riverside, WLWV", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-12", "time": "7:30 PM", "opponent": "Portland Adventist Academy", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-14", "time": "Noon", "opponent": "Neah Kah Nie", "location": "Home", "type": "Non League", "result": "Scheduled"}
  ]'::jsonb,
  
  updated_at = NOW()
WHERE type = 'Boys';

-- Update Girls Team with complete roster and schedule
UPDATE teams
SET 
  description = 'Pure pressure from the opening tip. A relentless full court press, nonstop energy, shooters all over the floor, and substitutions so constant the other team never finds a rhythm. Games turn into chaos fast and stay that way.',
  record_wins = 4,
  record_losses = 1,
  league_record = '0-0',
  ranking = 'Rank #8',
  coach_name = 'Patrick Thomas',
  coach_bio = 'English teacher who somehow blends grammar, conditioning, and controlled insanity into a system that overwhelms opponents and stacks wins.',
  
  -- Complete roster with 12 players
  players = '[
    {
      "number": "2",
      "name": "Brooke Wilson",
      "position": "G",
      "grade": "12",
      "height": "5''6\"",
      "bio": "The Cookie. Three point shooter specialist. If she''s open, scoreboard changes immediately. Defense panics when she crosses half court."
    },
    {
      "number": "4",
      "name": "Rachel Pippin",
      "position": "G",
      "grade": "9",
      "height": "5''3\"",
      "bio": "Little sister of cornball legend Zach Pippin. Freshman with insane ball knowledge. Absolute dog on defense. Shooter with confidence way beyond her age."
    },
    {
      "number": "5",
      "name": "Ava Henry",
      "position": "F",
      "grade": "12",
      "height": "5''7\"",
      "bio": "Somehow always tan and a bacon enthusiast. Reliable on the court, questionable behind the wheel. Energy never drops."
    },
    {
      "number": "12",
      "name": "Katelyn Sheridan",
      "position": "F",
      "grade": "11",
      "height": "5''10\"",
      "bio": "Athletic and annoying in the paint. Makes shots harder just by existing."
    },
    {
      "number": "14",
      "name": "Calista Everson",
      "position": "G",
      "grade": "12",
      "height": "5''7\"",
      "bio": "Red headed wrecking ball. Full speed, full contact, zero fear. Plays like every possession owes her money."
    },
    {
      "number": "15",
      "name": "Allison Jacobs",
      "position": "F",
      "grade": "11",
      "height": "5''7\"",
      "bio": "Runs the streets of Banks. Fearless, physical, and confident. Not backing down from anyone, ever."
    },
    {
      "number": "22",
      "name": "Maya Taha",
      "position": "P",
      "grade": "10",
      "height": "5''8\"",
      "bio": "Cool, calm, collected. When chaos hits, she''s unfazed. Keeps the team steady."
    },
    {
      "number": "23",
      "name": "Mia Verzani",
      "position": "G",
      "grade": "11",
      "height": "5''5\"",
      "bio": "Controlled chaos in every direction. Energy everywhere. Chaos incarnate. Defense has no idea what''s coming next."
    },
    {
      "number": "24",
      "name": "Emmee Kinder",
      "position": "P",
      "grade": "12",
      "height": "5''10\"",
      "bio": "Dog in the post. Physical, relentless, and tough. Lives in the paint and loves it."
    },
    {
      "number": "31",
      "name": "Scarlett Thomson",
      "position": "G",
      "grade": "10",
      "height": "5''7\"",
      "bio": "Motor never shuts off. Hustle machine. Always moving, always annoying."
    },
    {
      "number": "33",
      "name": "Nicole Arbaugh",
      "position": "G",
      "grade": "11",
      "height": "5''5\"",
      "bio": "Kneebrace Nicole. Still grinding. Still competing. Still not afraid of contact."
    },
    {
      "number": "34",
      "name": "Ava Marshall Thansophon",
      "position": "G",
      "grade": "10",
      "height": "5''7\"",
      "bio": "Steady and smart. Reads the game at a high level. Always in the right spot."
    }
  ]'::jsonb,
  
  -- Complete schedule (past and upcoming games)
  schedule = '[
    {"date": "2025-12-03", "time": "6:00 PM", "opponent": "Knappa", "location": "Away", "type": "Non League", "result": "W", "score": "44-31"},
    {"date": "2025-12-05", "time": "6:00 PM", "opponent": "Gladstone", "location": "Home", "type": "Non League", "result": "W", "score": "56-7"},
    {"date": "2025-12-09", "time": "5:30 PM", "opponent": "Scappoose", "location": "Away", "type": "Non League", "result": "W", "score": "44-16"},
    {"date": "2025-12-12", "time": "7:30 PM", "opponent": "Pleasant Hill", "location": "Home", "type": "Non League", "result": "W", "score": "57-28"},
    {"date": "2025-12-15", "time": "6:00 PM", "opponent": "Banks", "location": "Home", "type": "Non League", "result": "L", "score": "25-46"},
    {"date": "2025-12-22", "time": "5:00 PM", "opponent": "Santiam Christian", "location": "Away", "type": "Non League", "result": "Scheduled"},
    {"date": "2025-12-28", "time": "7:30 PM", "opponent": "Regis", "location": "Home", "type": "Tournament", "result": "Scheduled"},
    {"date": "2025-12-29", "time": "3:15 PM", "opponent": "Jefferson", "location": "Home", "type": "Tournament", "result": "Scheduled"},
    {"date": "2025-12-30", "time": "3:15 PM", "opponent": "Sutherlin", "location": "Home", "type": "Tournament", "result": "Scheduled"},
    {"date": "2026-01-02", "time": "5:30 PM", "opponent": "Seaside", "location": "Away", "type": "Non League", "result": "Scheduled"},
    {"date": "2026-01-06", "time": "6:00 PM", "opponent": "Horizon Christian, Tualatin", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-08", "time": "6:00 PM", "opponent": "Westside Christian", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-10", "time": "5:00 PM", "opponent": "De La Salle North Catholic", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-13", "time": "6:00 PM", "opponent": "Oregon Episcopal", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-16", "time": "6:00 PM", "opponent": "Catlin Gabel", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-19", "time": "6:00 PM", "opponent": "Country Christian", "location": "Away", "type": "Non League", "result": "Scheduled"},
    {"date": "2026-01-22", "time": "6:00 PM", "opponent": "Portland Adventist Academy", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-24", "time": "5:00 PM", "opponent": "Horizon Christian, Tualatin", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-27", "time": "6:00 PM", "opponent": "Westside Christian", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-01-30", "time": "6:00 PM", "opponent": "De La Salle North Catholic", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-03", "time": "6:00 PM", "opponent": "Oregon Episcopal", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-06", "time": "6:00 PM", "opponent": "Catlin Gabel", "location": "Away", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-09", "time": "7:00 PM", "opponent": "Prairie, WA", "location": "Home", "type": "Non League", "result": "Scheduled"},
    {"date": "2026-02-12", "time": "6:00 PM", "opponent": "Portland Adventist Academy", "location": "Home", "type": "League", "result": "Scheduled"},
    {"date": "2026-02-14", "time": "10:30 AM", "opponent": "Neah Kah Nie", "location": "Home", "type": "Non League", "result": "Scheduled"},
    {
      "date": "2025-02-11",
      "time": "6:30 PM",
      "opponent": "Franklin Quakers",
      "location": "Away",
      "type": "Conference",
      "result": "Scheduled"
    }
  ]'::jsonb,
  
  updated_at = NOW()
WHERE type = 'Girls';

-- Verify the updates
SELECT 
  name,
  type,
  record_wins || '-' || record_losses AS record,
  league_record,
  ranking,
  coach_name,
  jsonb_array_length(players) AS player_count,
  jsonb_array_length(schedule) AS game_count
FROM teams
ORDER BY type;

-- Success message
SELECT '✅ Team data updated successfully! Both teams now have complete rosters and schedules.' AS status;