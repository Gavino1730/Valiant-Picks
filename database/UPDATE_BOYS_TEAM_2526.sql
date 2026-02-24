-- ============================================================
-- VALLEY CATHOLIC BOYS BASKETBALL - 2025-26 SEASON UPDATE
-- ============================================================
-- Updates: record, league record, OSAA ranking, and full schedule
-- Does NOT touch: players, coaches, description, or other staff data
-- Run in Supabase SQL Editor
-- ============================================================

UPDATE teams
SET
  record_wins    = 23,
  record_losses  = 3,
  league_record  = '13-1',
  ranking        = '3',
  schedule       = '[
    {
      "result":   "W",
      "opponent": "Knappa",
      "date":     "12/3/25",
      "time":     "7:30pm",
      "score":    "83-58",
      "type":     "Non-League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Gladstone",
      "date":     "12/5/25",
      "time":     "7:30pm",
      "score":    "88-41",
      "type":     "Non-League",
      "location": "Home"
    },
    {
      "result":   "L",
      "opponent": "Scappoose",
      "date":     "12/9/25",
      "time":     "7pm",
      "score":    "69-90",
      "type":     "Non-League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Pleasant Hill",
      "date":     "12/12/25",
      "time":     "6pm",
      "score":    "73-45",
      "type":     "Non-League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "Banks",
      "date":     "12/15/25",
      "time":     "7:30pm",
      "score":    "87-65",
      "type":     "Non-League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "Tillamook",
      "date":     "12/22/25",
      "time":     "2:30pm",
      "score":    "85-35",
      "type":     "Non-League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "Jefferson",
      "date":     "12/28/25",
      "time":     "12:30pm",
      "score":    "97-13",
      "type":     "Tournament",
      "location": "Valley Catholic Holiday Tournament"
    },
    {
      "result":   "W",
      "opponent": "Mid Pacific (HI)",
      "date":     "12/29/25",
      "time":     "11:45am",
      "score":    "80-54",
      "type":     "Tournament",
      "location": "Valley Catholic Holiday Tournament"
    },
    {
      "result":   "W",
      "opponent": "Regis",
      "date":     "12/30/25",
      "time":     "6:45pm",
      "score":    "92-86",
      "type":     "Tournament",
      "location": "Valley Catholic Holiday Tournament"
    },
    {
      "result":   "W",
      "opponent": "Western Christian",
      "date":     "1/3/26",
      "time":     "3pm",
      "score":    "72-43",
      "type":     "Non-League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Horizon Christian",
      "date":     "1/6/26",
      "time":     "7:30pm",
      "score":    "72-41",
      "type":     "League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Westside Christian",
      "date":     "1/8/26",
      "time":     "7:30pm",
      "score":    "69-50",
      "type":     "League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "De La Salle North Catholic",
      "date":     "1/10/26",
      "time":     "6:30pm",
      "score":    "67-41",
      "type":     "League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "Oregon Episcopal",
      "date":     "1/13/26",
      "time":     "7:30pm",
      "score":    "61-52",
      "type":     "League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Catlin Gabel",
      "date":     "1/16/26",
      "time":     "7:30pm",
      "score":    "87-35",
      "type":     "League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "Riverside",
      "date":     "1/20/26",
      "time":     "7:30pm",
      "score":    "83-32",
      "type":     "League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "Portland Adventist Academy",
      "date":     "1/22/26",
      "time":     "7:30pm",
      "score":    "80-39",
      "type":     "League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Horizon Christian",
      "date":     "1/24/26",
      "time":     "6:30pm",
      "score":    "80-41",
      "type":     "League",
      "location": "Home"
    },
    {
      "result":   "L",
      "opponent": "Westside Christian",
      "date":     "1/27/26",
      "time":     "7:30pm",
      "score":    "76-77",
      "type":     "League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "De La Salle North Catholic",
      "date":     "1/30/26",
      "time":     "7:30pm",
      "score":    "73-55",
      "type":     "League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Oregon Episcopal",
      "date":     "2/3/26",
      "time":     "7:30pm",
      "score":    "73-54",
      "type":     "League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "Catlin Gabel",
      "date":     "2/6/26",
      "time":     "7:30pm",
      "score":    "85-38",
      "type":     "League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Riverside",
      "date":     "2/10/26",
      "time":     "6pm",
      "score":    "74-30",
      "type":     "League",
      "location": "Away"
    },
    {
      "result":   "W",
      "opponent": "Portland Adventist Academy",
      "date":     "2/12/26",
      "time":     "7:30pm",
      "score":    "76-50",
      "type":     "League",
      "location": "Home"
    },
    {
      "result":   "W",
      "opponent": "Neah-Kah-Nie",
      "date":     "2/14/26",
      "time":     "Noon",
      "score":    "99-74",
      "type":     "Non-League",
      "location": "Home"
    },
    {
      "result":   "L",
      "opponent": "Westside Christian",
      "date":     "2/21/26",
      "time":     "6pm",
      "score":    "83-94",
      "type":     "League Playoff",
      "location": "Away"
    },
    {
      "result":   "",
      "opponent": "TBD",
      "date":     "2/27/26",
      "time":     "TBD",
      "score":    "",
      "type":     "Playoff",
      "location": "TBD"
    }
  ]'::jsonb,
  updated_at = NOW()
WHERE type = 'Boys';
