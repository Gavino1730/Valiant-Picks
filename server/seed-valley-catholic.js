/**
 * VC Basketball Data Seeding Script
 * Run this script to populate the database with VC team data
 * 
 * Usage: node seed-valley-catholic.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// BOYS BASKETBALL DATA
// ============================================================================

const boysTeamData = {
  name: 'VC Boys Basketball',
  type: 'Boys Basketball',
  description: 'Depth for days and pace that never slows. The floor is spaced with shooters, the rim is under constant threat, and there\'s no such thing as taking a possession off. The goal is simple, win state. Anything less is a failure. The team motto is BTA and they play like it. The squad is run by Bryan Fraser, an OG hooper out of Sac Town with 11 years on the sideline and zero tolerance for bad basketball. Backed by Coach John Efstathiou, a towering presence whose laugh echoes through the gym and whose clipboard slams are felt emotionally and physically.',
  record_wins: 4,
  record_losses: 1,
  ranking: 3,
  coach_name: 'Bryan Fraser',
  coach_email: 'bfraser@valleycs.org'
};

const boysPlayers = [
  {
    number: 1,
    name: 'Cooper Bonnett',
    position: 'G',
    grade: 12,
    height: '5\'10"',
    bio: 'White Chocolate with a Beaverton passport. Thinks he\'s from the trenches, actually runs the streets of Beaverton. Lil Bloodhound Coop hunts defenders, sniffs out ankles, and lets you know about it after.'
  },
  {
    number: 2,
    name: 'Alex Post',
    position: 'G',
    grade: 11,
    height: '6\'1"',
    bio: 'Cannot be guarded by modern defensive schemes. The AP quicklay is folklore at this point. You play perfect defense, he scores anyway, shrugs, jogs back.'
  },
  {
    number: 3,
    name: 'Gavin Galan',
    position: 'F',
    grade: 12,
    height: '6\'2"',
    bio: 'Granola powered menace. Loves nature, hikes, trees, then immediately drops his shoulder and commits violence in the lane. Walking technical foul. Will fight you, will get T\'d up, will not score.'
  },
  {
    number: 4,
    name: 'Kye Fixter',
    position: 'F',
    grade: 11,
    height: '6\'0"',
    bio: 'Shifty Kye. Ankles evaporate on contact. Defender leans once and it\'s over. Lives off of fade away buckets, no matter the distance.'
  },
  {
    number: 5,
    name: 'Marcos Mueller',
    position: 'G',
    grade: 12,
    height: '6\'3"',
    bio: 'Straight from the streets of Ecuador, allegedly. Jumper is completely broken. Never smiles. Never talks. Pierced ears confuse defenders even more.'
  },
  {
    number: 10,
    name: 'Matthew Gunther',
    position: 'G',
    grade: 12,
    height: '5\'9"',
    bio: 'Golden retriever energy but deadly. Always ready to eat. Silent but dangerous. Plays like John Stockton if Stockton never said a word and just ruined your offense quietly.'
  },
  {
    number: 11,
    name: 'Tyler Eddy',
    position: 'G',
    grade: 10,
    height: '6\'0"',
    bio: 'Going to the league. At least spiritually. Plays like every possession is a mixtape clip. Wants smoke at all times.'
  },
  {
    number: 15,
    name: 'Elijah Schaal',
    position: 'G',
    grade: 12,
    height: '6\'0"',
    bio: 'Actual saint. Would help you up after fouling you hard. Then rebounds like Dennis Rodman and outsmarts everyone on the floor. Effort is through the roof.'
  },
  {
    number: 20,
    name: 'Hank Lomber',
    position: 'F',
    grade: 11,
    height: '6\'3"',
    bio: 'Absolute wildcard. Will randomly pull from three with no warning and drain it. Looks harmless until he\'s cooking you for no reason.'
  },
  {
    number: 22,
    name: 'Sam Robbins',
    position: 'F',
    grade: 10,
    height: '6\'7"',
    bio: '6\'7 post with confidence to match. Strong in the paint, strong aura. Knows exactly what\'s going on at all times.'
  },
  {
    number: 23,
    name: 'Garrett Frank',
    position: 'G',
    grade: 11,
    height: '5\'11"',
    bio: 'G6. Human highlight reel. If he gets a lane, the rim is in danger. Dunks so hard the gym shakes.'
  },
  {
    number: 24,
    name: 'Michael Mehta',
    position: 'G',
    grade: 12,
    height: '6\'1"',
    bio: 'The Pharaoh. Elite shooter. Brain operates at genius speed and also forgets every single play. Somehow still ends up wide open.'
  },
  {
    number: 44,
    name: 'Liam Plep',
    position: 'C',
    grade: 12,
    height: '6\'8"',
    bio: 'Big body. Screens so lethal they should be illegal. You hit one and question your life choices.'
  }
];

const boysGames = [
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Knappa',
    game_date: '2025-12-03',
    game_time: '19:30',
    location: 'Away',
    result: 'W',
    home_score: 83,
    away_score: 58,
    type: 'Non League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Gladstone',
    game_date: '2025-12-05',
    game_time: '19:30',
    location: 'Home',
    result: 'W',
    home_score: 88,
    away_score: 41,
    type: 'Non League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'Scappoose',
    away_team: 'VC',
    game_date: '2025-12-09',
    game_time: '19:00',
    location: 'Away',
    result: 'L',
    home_score: 90,
    away_score: 69,
    type: 'Non League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Pleasant Hill',
    game_date: '2025-12-12',
    game_time: '18:00',
    location: 'Home',
    result: 'W',
    home_score: 73,
    away_score: 45,
    type: 'Non League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Banks',
    game_date: '2025-12-15',
    game_time: '19:30',
    location: 'Home',
    result: 'W',
    home_score: 87,
    away_score: 65,
    type: 'Non League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Tillamook',
    game_date: '2025-12-22',
    game_time: '14:30',
    location: 'Home',
    result: null,
    type: 'Non League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Jefferson',
    game_date: '2025-12-28',
    game_time: '12:30',
    location: 'Home',
    result: null,
    type: 'Tournament'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Mid Pacific, HI',
    game_date: '2025-12-29',
    game_time: '11:45',
    location: 'Home',
    result: null,
    type: 'Tournament'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Regis',
    game_date: '2025-12-30',
    game_time: '18:45',
    location: 'Home',
    result: null,
    type: 'Tournament'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'Western Christian',
    away_team: 'VC',
    game_date: '2026-01-03',
    game_time: '15:00',
    location: 'Away',
    result: null,
    type: 'Non League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'Horizon Christian, Tualatin',
    away_team: 'VC',
    game_date: '2026-01-06',
    game_time: '19:30',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Westside Christian',
    game_date: '2026-01-08',
    game_time: '19:30',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'De La Salle North Catholic',
    game_date: '2026-01-10',
    game_time: '18:30',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'Oregon Episcopal',
    away_team: 'VC',
    game_date: '2026-01-13',
    game_time: '19:30',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Catlin Gabel',
    game_date: '2026-01-16',
    game_time: '19:30',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Riverside, WLWV',
    game_date: '2026-01-20',
    game_time: '19:30',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'Portland Adventist Academy',
    away_team: 'VC',
    game_date: '2026-01-22',
    game_time: '19:30',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Horizon Christian, Tualatin',
    game_date: '2026-01-24',
    game_time: '18:30',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'Westside Christian',
    away_team: 'VC',
    game_date: '2026-01-27',
    game_time: '19:30',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'De La Salle North Catholic',
    away_team: 'VC',
    game_date: '2026-01-30',
    game_time: '19:30',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Oregon Episcopal',
    game_date: '2026-02-03',
    game_time: '19:30',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'Catlin Gabel',
    away_team: 'VC',
    game_date: '2026-02-06',
    game_time: '19:30',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'Riverside, WLWV',
    away_team: 'VC',
    game_date: '2026-02-10',
    game_time: '18:00',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Portland Adventist Academy',
    game_date: '2026-02-12',
    game_time: '19:30',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Boys Basketball',
    home_team: 'VC',
    away_team: 'Neah Kah Nie',
    game_date: '2026-02-14',
    game_time: '12:00',
    location: 'Home',
    result: null,
    type: 'Non League'
  }
];

// ============================================================================
// GIRLS BASKETBALL DATA
// ============================================================================

const girlsTeamData = {
  name: 'VC Girls Basketball',
  type: 'Girls Basketball',
  description: 'Pure pressure from the opening tip. A relentless full court press, nonstop energy, shooters all over the floor, and substitutions so constant the other team never finds a rhythm. Games turn into chaos fast and stay that way. Led by English teacher Patrick Thomas, who somehow blends grammar, conditioning, and controlled insanity into a system that overwhelms opponents and stacks wins.',
  record_wins: 4,
  record_losses: 1,
  ranking: 8,
  coach_name: 'Patrick Thomas',
  coach_email: 'pthomas@valleycs.org'
};

const girlsPlayers = [
  {
    number: 2,
    name: 'Brooke Wilson',
    position: 'G',
    grade: 12,
    height: '5\'6"',
    bio: 'The Cookie. Three point shooter specialist. If she\'s open, scoreboard changes immediately. Defense panics when she crosses half court.'
  },
  {
    number: 4,
    name: 'Rachel Pippin',
    position: 'G',
    grade: 9,
    height: '5\'3"',
    bio: 'Little sister of cornball legend Zach Pippin. Freshman with insane ball knowledge. Absolute dog on defense. Shooter with confidence way beyond her age.'
  },
  {
    number: 5,
    name: 'Ava Henry',
    position: 'F',
    grade: 12,
    height: '5\'7"',
    bio: 'Somehow always tan and a bacon enthusiast. Reliable on the court, questionable behind the wheel. Energy never drops.'
  },
  {
    number: 12,
    name: 'Katelyn Sheridan',
    position: 'F',
    grade: 11,
    height: '5\'10"',
    bio: 'Athletic and annoying in the paint. Makes shots harder just by existing.'
  },
  {
    number: 14,
    name: 'Calista Everson',
    position: 'G',
    grade: 12,
    height: '5\'7"',
    bio: 'Red headed wrecking ball. Full speed, full contact, zero fear. Plays like every possession owes her money.'
  },
  {
    number: 15,
    name: 'Allison Jacobs',
    position: 'F',
    grade: 11,
    height: '5\'7"',
    bio: 'Runs the streets of Banks. Fearless, physical, and confident. Not backing down from anyone, ever.'
  },
  {
    number: 22,
    name: 'Maya Taha',
    position: 'P',
    grade: 10,
    height: '5\'8"',
    bio: 'Cool, calm, collected. When chaos hits, she\'s unfazed. Keeps the team steady.'
  },
  {
    number: 23,
    name: 'Mia Verzani',
    position: 'G',
    grade: 11,
    height: '5\'5"',
    bio: 'Controled chaos in every direction. Energy everywhere. Chaos incarnate. Defense has no idea what\'s coming next.'
  },
  {
    number: 24,
    name: 'Emmee Kinder',
    position: 'P',
    grade: 12,
    height: '5\'10"',
    bio: 'Dog in the post. Physical, relentless, and tough. Lives in the paint and loves it.'
  },
  {
    number: 31,
    name: 'Scarlett Thomson',
    position: 'G',
    grade: 10,
    height: '5\'7"',
    bio: 'Motor never shuts off. Hustle machine. Always moving, always annoying.'
  },
  {
    number: 33,
    name: 'Nicole Arbaugh',
    position: 'G',
    grade: 11,
    height: '5\'5"',
    bio: 'Kneebrace Nicole. Still grinding. Still competing. Still not afraid of contact.'
  },
  {
    number: 34,
    name: 'Ava Marshall Thansophon',
    position: 'G',
    grade: 10,
    height: '5\'9"',
    bio: 'Hurt but still locked in. Brings energy, vibes, and support from the sidelines.'
  }
];

const girlsGames = [
  {
    team_type: 'Girls Basketball',
    home_team: 'Knappa',
    away_team: 'VC',
    game_date: '2025-12-03',
    game_time: '18:00',
    location: 'Away',
    result: 'W',
    home_score: 31,
    away_score: 44,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Gladstone',
    game_date: '2025-12-05',
    game_time: '18:00',
    location: 'Home',
    result: 'W',
    home_score: 56,
    away_score: 7,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Scappoose',
    away_team: 'VC',
    game_date: '2025-12-09',
    game_time: '17:30',
    location: 'Away',
    result: 'W',
    home_score: 16,
    away_score: 44,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Pleasant Hill',
    game_date: '2025-12-12',
    game_time: '19:30',
    location: 'Home',
    result: 'W',
    home_score: 57,
    away_score: 28,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Banks',
    game_date: '2025-12-15',
    game_time: '18:00',
    location: 'Home',
    result: 'L',
    home_score: 25,
    away_score: 46,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Santiam Christian',
    away_team: 'VC',
    game_date: '2025-12-22',
    game_time: '17:00',
    location: 'Away',
    result: null,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Regis',
    game_date: '2025-12-28',
    game_time: '19:30',
    location: 'Home',
    result: null,
    type: 'Tournament'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Jefferson',
    game_date: '2025-12-29',
    game_time: '15:15',
    location: 'Home',
    result: null,
    type: 'Tournament'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Sutherlin',
    game_date: '2025-12-30',
    game_time: '15:15',
    location: 'Home',
    result: null,
    type: 'Tournament'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Seaside',
    away_team: 'VC',
    game_date: '2026-01-02',
    game_time: '17:30',
    location: 'Away',
    result: null,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Horizon Christian, Tualatin',
    away_team: 'VC',
    game_date: '2026-01-06',
    game_time: '18:00',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Westside Christian',
    game_date: '2026-01-08',
    game_time: '18:00',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'De La Salle North Catholic',
    game_date: '2026-01-10',
    game_time: '17:00',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Oregon Episcopal',
    away_team: 'VC',
    game_date: '2026-01-13',
    game_time: '18:00',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Catlin Gabel',
    game_date: '2026-01-16',
    game_time: '18:00',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Country Christian',
    away_team: 'VC',
    game_date: '2026-01-19',
    game_time: '18:00',
    location: 'Away',
    result: null,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Portland Adventist Academy',
    away_team: 'VC',
    game_date: '2026-01-22',
    game_time: '18:00',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Horizon Christian, Tualatin',
    game_date: '2026-01-24',
    game_time: '17:00',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Westside Christian',
    away_team: 'VC',
    game_date: '2026-01-27',
    game_time: '18:00',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'De La Salle North Catholic',
    away_team: 'VC',
    game_date: '2026-01-30',
    game_time: '18:00',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Oregon Episcopal',
    game_date: '2026-02-03',
    game_time: '18:00',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Catlin Gabel',
    away_team: 'VC',
    game_date: '2026-02-06',
    game_time: '18:00',
    location: 'Away',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'Prairie, WA',
    away_team: 'VC',
    game_date: '2026-02-09',
    game_time: '19:00',
    location: 'Home',
    result: null,
    type: 'Non League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Portland Adventist Academy',
    game_date: '2026-02-12',
    game_time: '18:00',
    location: 'Home',
    result: null,
    type: 'League'
  },
  {
    team_type: 'Girls Basketball',
    home_team: 'VC',
    away_team: 'Neah Kah Nie',
    game_date: '2026-02-14',
    game_time: '10:30',
    location: 'Home',
    result: null,
    type: 'Non League'
  }
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function seedData() {
  try {
    console.log('🏀 Starting VC Basketball Data Seeding...\n');

    // Seed Boys Team
    console.log('📍 Seeding Boys Basketball Team...');
    const { data: boysTeam, error: boysTeamError } = await supabase
      .from('teams')
      .insert([boysTeamData])
      .select();

    if (boysTeamError) throw new Error(`Boys team insert failed: ${boysTeamError.message}`);
    const boysTeamId = boysTeam[0].id;
    console.log(`✅ Boys team created with ID: ${boysTeamId}\n`);

    // Seed Girls Team
    console.log('📍 Seeding Girls Basketball Team...');
    const { data: girlsTeam, error: girlsTeamError } = await supabase
      .from('teams')
      .insert([girlsTeamData])
      .select();

    if (girlsTeamError) throw new Error(`Girls team insert failed: ${girlsTeamError.message}`);
    const girlsTeamId = girlsTeam[0].id;
    console.log(`✅ Girls team created with ID: ${girlsTeamId}\n`);

    // Seed Boys Players
    console.log('📍 Seeding Boys Basketball Players...');
    const boysPlayersWithTeamId = boysPlayers.map(p => ({ ...p, team_id: boysTeamId }));
    const { error: boysPlayersError } = await supabase
      .from('players')
      .insert(boysPlayersWithTeamId);

    if (boysPlayersError) throw new Error(`Boys players insert failed: ${boysPlayersError.message}`);
    console.log(`✅ ${boysPlayers.length} boys players added\n`);

    // Seed Girls Players
    console.log('📍 Seeding Girls Basketball Players...');
    const girlsPlayersWithTeamId = girlsPlayers.map(p => ({ ...p, team_id: girlsTeamId }));
    const { error: girlsPlayersError } = await supabase
      .from('players')
      .insert(girlsPlayersWithTeamId);

    if (girlsPlayersError) throw new Error(`Girls players insert failed: ${girlsPlayersError.message}`);
    console.log(`✅ ${girlsPlayers.length} girls players added\n`);

    // Seed Boys Games
    console.log('📍 Seeding Boys Basketball Schedule...');
    const boysGamesWithTeamId = boysGames.map(g => ({ ...g, team_id: boysTeamId, is_visible: false }));
    const { error: boysGamesError } = await supabase
      .from('games')
      .insert(boysGamesWithTeamId);

    if (boysGamesError) throw new Error(`Boys games insert failed: ${boysGamesError.message}`);
    console.log(`✅ ${boysGames.length} boys games added\n`);

    // Seed Girls Games
    console.log('📍 Seeding Girls Basketball Schedule...');
    const girlsGamesWithTeamId = girlsGames.map(g => ({ ...g, team_id: girlsTeamId, is_visible: false }));
    const { error: girlsGamesError } = await supabase
      .from('games')
      .insert(girlsGamesWithTeamId);

    if (girlsGamesError) throw new Error(`Girls games insert failed: ${girlsGamesError.message}`);
    console.log(`✅ ${girlsGames.length} girls games added\n`);

    console.log('🎉 ============================================');
    console.log('🎉 VC Data Seeding Complete!');
    console.log('🎉 ============================================');
    console.log(`
    Summary:
    • Boys Team: ${boysTeamId} with ${boysPlayers.length} players
    • Girls Team: ${girlsTeamId} with ${girlsPlayers.length} players
    • Boys Schedule: ${boysGames.length} games
    • Girls Schedule: ${girlsGames.length} games
    
    Total Records: ${2 + boysPlayers.length + girlsPlayers.length + boysGames.length + girlsGames.length}
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedData();

