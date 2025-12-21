const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');

// Get all teams with full details
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    // For now, returning sample data structure
    // In a real app, this would fetch from database
    const teams = [
      {
        id: 'boys',
        name: 'Valley Catholic Boys Basketball',
        type: 'Boys Basketball',
        record_wins: 4,
        record_losses: 1,
        league_record: '0-0',
        ranking: 3,
        coach_name: 'Bryan Fraser',
        coach_bio: 'Head Coach Bryan Fraser is an OG hooper out of Sacramento with 11 years on the sideline and zero tolerance for bad basketball.',
        description: 'Depth for days and pace that never slows. The floor is spaced with shooters, the rim is under constant threat, and there\'s no such thing as taking a possession off. The goal is simple, win state. Anything less is a failure.',
        schedule: [
          { result: 'W', score: '83-58', type: 'Non League', date: '12/3/25', time: '7:30 pm', opponent: 'Knappa', location: 'Away' },
          { result: 'W', score: '88-41', type: 'Non League', date: '12/5/25', time: '7:30 pm', opponent: 'Gladstone', location: 'Home' },
          { result: 'L', score: '69-90', type: 'Non League', date: '12/9/25', time: '7:00 pm', opponent: 'Scappoose', location: 'Away' },
          { result: 'W', score: '73-45', type: 'Non League', date: '12/12/25', time: '6:00 pm', opponent: 'Pleasant Hill', location: 'Home' },
          { result: 'W', score: '87-65', type: 'Non League', date: '12/15/25', time: '7:30 pm', opponent: 'Banks', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '12/22/25', time: '2:30 pm', opponent: 'Tillamook', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/28/25', time: '12:30 pm', opponent: 'Jefferson', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/29/25', time: '11:45 am', opponent: 'Mid Pacific, HI', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/30/25', time: '6:45 pm', opponent: 'Regis', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '1/3/26', time: '3:00 pm', opponent: 'Western Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/6/26', time: '7:30 pm', opponent: 'Horizon Christian, Tualatin', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/8/26', time: '7:30 pm', opponent: 'Westside Christian', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/10/26', time: '6:30 pm', opponent: 'De La Salle North Catholic', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/13/26', time: '7:30 pm', opponent: 'Oregon Episcopal', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/16/26', time: '7:30 pm', opponent: 'Catlin Gabel', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/20/26', time: '7:30 pm', opponent: 'Riverside, WLWV', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/22/26', time: '7:30 pm', opponent: 'Portland Adventist Academy', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/24/26', time: '6:30 pm', opponent: 'Horizon Christian, Tualatin', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/27/26', time: '7:30 pm', opponent: 'Westside Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/30/26', time: '7:30 pm', opponent: 'De La Salle North Catholic', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/3/26', time: '7:30 pm', opponent: 'Oregon Episcopal', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/6/26', time: '7:30 pm', opponent: 'Catlin Gabel', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/10/26', time: '6:00 pm', opponent: 'Riverside, WLWV', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/12/26', time: '7:30 pm', opponent: 'Portland Adventist Academy', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '2/14/26', time: 'Noon', opponent: 'Neah Kah Nie', location: 'Home' }
        ],
        players: [
          { number: 1, name: 'Cooper Bonnett', position: 'G', grade: '12', height: '5\'10"', bio: 'White Chocolate with a Beaverton passport. Thinks he\'s from the trenches, actually runs the streets of Beaverton. Lil Bloodhound Coop hunts defenders, sniffs out ankles, and lets you know about it after.' },
          { number: 2, name: 'Alex Post', position: 'G', grade: '11', height: '6\'1"', bio: 'Cannot be guarded by modern defensive schemes. The AP quicklay is folklore at this point. You play perfect defense, he scores anyway, shrugs, jogs back.' },
          { number: 3, name: 'Gavin Galan', position: 'F', grade: '12', height: '6\'2"', bio: 'Granola powered menace. Loves nature, hikes, trees, then immediately drops his shoulder and commits violence in the lane. Walking technical foul. Will fight you, will get T\'d up, will not score.' },
          { number: 4, name: 'Kye Fixter', position: 'F', grade: '11', height: '6\'0"', bio: 'Shifty Kye. Ankles evaporate on contact. Defender leans once and it\'s over. Lives off of fade away buckets, no matter the distance.' },
          { number: 5, name: 'Marcos Mueller', position: 'G', grade: '12', height: '6\'3"', bio: 'Straight from the streets of Ecuador, allegedly. Jumper is completely broken. Never smiles. Never talks. Pierced ears confuse defenders even more.' },
          { number: 10, name: 'Matthew Gunther', position: 'G', grade: '12', height: '5\'9"', bio: 'Golden retriever energy but deadly. Always ready to eat. Silent but dangerous. Plays like John Stockton if Stockton never said a word and just ruined your offense quietly.' },
          { number: 11, name: 'Tyler Eddy', position: 'G', grade: '10', height: '6\'0"', bio: 'Going to the league. At least spiritually. Plays like every possession is a mixtape clip. Wants smoke at all times.' },
          { number: 15, name: 'Elijah Schaal', position: 'G', grade: '12', height: '6\'0"', bio: 'Actual saint. Would help you up after fouling you hard. Then rebounds like Dennis Rodman and outsmarts everyone on the floor. Effort is through the roof.' },
          { number: 20, name: 'Hank Lomber', position: 'F', grade: '11', height: '6\'3"', bio: 'Absolute wildcard. Will randomly pull from three with no warning and drain it. Looks harmless until he\'s cooking you for no reason.' },
          { number: 22, name: 'Sam Robbins', position: 'F', grade: '10', height: '6\'7"', bio: '6\'7 post with confidence to match. Strong in the paint, strong aura. Knows exactly what\'s going on at all times.' },
          { number: 23, name: 'Garrett Frank', position: 'G', grade: '11', height: '5\'11"', bio: 'G6. Human highlight reel. If he gets a lane, the rim is in danger. Dunks so hard the gym shakes.' },
          { number: 24, name: 'Michael Mehta', position: 'G', grade: '12', height: '6\'1"', bio: 'The Pharaoh. Elite shooter. Brain operates at genius speed and also forgets every single play. Somehow still ends up wide open.' },
          { number: 44, name: 'Liam Plep', position: 'C', grade: '12', height: '6\'8"', bio: 'Big body. Screens so lethal they should be illegal. You hit one and question your life choices.' }
        ]
      },
      {
        id: 'girls',
        name: 'Valley Catholic Girls Basketball',
        type: 'Girls Basketball',
        record_wins: 4,
        record_losses: 1,
        league_record: '0-0',
        ranking: 8,
        coach_name: 'Patrick Thomas',
        coach_bio: 'Head Coach Patrick Thomas is an English teacher who somehow blends grammar, conditioning, and controlled insanity into a system that overwhelms opponents and stacks wins.',
        description: 'Pure pressure from the opening tip. A relentless full court press, nonstop energy, shooters all over the floor, and substitutions so constant the other team never finds a rhythm. Games turn into chaos fast and stay that way.',
        schedule: [
          { result: 'W', score: '44-31', type: 'Non League', date: '12/3/25', time: '6:00 pm', opponent: 'Knappa', location: 'Away' },
          { result: 'W', score: '56-7', type: 'Non League', date: '12/5/25', time: '6:00 pm', opponent: 'Gladstone', location: 'Home' },
          { result: 'W', score: '44-16', type: 'Non League', date: '12/9/25', time: '5:30 pm', opponent: 'Scappoose', location: 'Away' },
          { result: 'W', score: '57-28', type: 'Non League', date: '12/12/25', time: '7:30 pm', opponent: 'Pleasant Hill', location: 'Home' },
          { result: 'L', score: '25-46', type: 'Non League', date: '12/15/25', time: '6:00 pm', opponent: 'Banks', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '12/22/25', time: '5:00 pm', opponent: 'Santiam Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/28/25', time: '7:30 pm', opponent: 'Regis', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/29/25', time: '3:15 pm', opponent: 'Jefferson', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Tournament', date: '12/30/25', time: '3:15 pm', opponent: 'Sutherlin', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '1/2/26', time: '5:30 pm', opponent: 'Seaside', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/6/26', time: '6:00 pm', opponent: 'Horizon Christian, Tualatin', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/8/26', time: '6:00 pm', opponent: 'Westside Christian', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/10/26', time: '5:00 pm', opponent: 'De La Salle North Catholic', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/13/26', time: '6:00 pm', opponent: 'Oregon Episcopal', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/16/26', time: '6:00 pm', opponent: 'Catlin Gabel', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '1/19/26', time: '6:00 pm', opponent: 'Country Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/22/26', time: '6:00 pm', opponent: 'Portland Adventist Academy', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/24/26', time: '5:00 pm', opponent: 'Horizon Christian, Tualatin', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/27/26', time: '6:00 pm', opponent: 'Westside Christian', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '1/30/26', time: '6:00 pm', opponent: 'De La Salle North Catholic', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/3/26', time: '6:00 pm', opponent: 'Oregon Episcopal', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/6/26', time: '6:00 pm', opponent: 'Catlin Gabel', location: 'Away' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '2/9/26', time: '7:00 pm', opponent: 'Prairie, WA', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'League', date: '2/12/26', time: '6:00 pm', opponent: 'Portland Adventist Academy', location: 'Home' },
          { result: 'Scheduled', score: '-', type: 'Non League', date: '2/14/26', time: '10:30 am', opponent: 'Neah Kah Nie', location: 'Home' }
        ],
        players: [
          { number: 2, name: 'Brooke Wilson', position: 'G', grade: '12', height: '5\'6"', bio: 'The Cookie. Three point shooter specialist. If she\'s open, scoreboard changes immediately. Defense panics when she crosses half court.' },
          { number: 4, name: 'Rachel Pippin', position: 'G', grade: '9', height: '5\'3"', bio: 'Little sister of cornball legend Zach Pippin. Freshman with insane ball knowledge. Absolute dog on defense. Shooter with confidence way beyond her age.' },
          { number: 5, name: 'Ava Henry', position: 'F', grade: '12', height: '5\'7"', bio: 'Somehow always tan and a bacon enthusiast. Reliable on the court, questionable behind the wheel. Energy never drops.' },
          { number: 12, name: 'Katelyn Sheridan', position: 'F', grade: '11', height: '5\'10"', bio: 'Athletic and annoying in the paint. Makes shots harder just by existing.' },
          { number: 14, name: 'Calista Everson', position: 'G', grade: '12', height: '5\'7"', bio: 'Red headed wrecking ball. Full speed, full contact, zero fear. Plays like every possession owes her money.' },
          { number: 15, name: 'Allison Jacobs', position: 'F', grade: '11', height: '5\'7"', bio: 'Runs the streets of Banks. Fearless, physical, and confident. Not backing down from anyone, ever.' },
          { number: 22, name: 'Maya Taha', position: 'P', grade: '10', height: '5\'8"', bio: 'Cool, calm, collected. When chaos hits, she\'s unfazed. Keeps the team steady.' },
          { number: 23, name: 'Mia Verzani', position: 'G', grade: '11', height: '5\'5"', bio: 'Controled chaos in every direction. Energy everywhere. Chaos incarnate. Defense has no idea what\'s coming next.' },
          { number: 24, name: 'Emmee Kinder', position: 'P', grade: '12', height: '5\'10"', bio: 'Dog in the post. Physical, relentless, and tough. Lives in the paint and loves it.' },
          { number: 31, name: 'Scarlett Thomson', position: 'G', grade: '10', height: '5\'7"', bio: 'Motor never shuts off. Hustle machine. Always moving, always annoying.' },
          { number: 33, name: 'Nicole Arbaugh', position: 'G', grade: '11', height: '5\'5"', bio: 'Kneebrace Nicole. Still grinding. Still competing. Still not afraid of contact.' },
          { number: 34, name: 'Ava Marshall Thansophon', position: 'G', grade: '10', height: '5\'9"', bio: 'Hurt but still locked in. Brings energy, vibes, and support from the sidelines.' }
        ]
      }
    ];

    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get single team by ID
router.get('/:teamId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId } = req.params;
    // Fetch from database based on teamId
    res.json({ message: 'Team data would be fetched from database' });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Update team info (name, record, ranking, etc)
router.put('/:teamId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;

    // Validate inputs
    const allowedUpdates = [
      'record_wins',
      'record_losses',
      'league_record',
      'ranking',
      'coach_name',
      'assistant_coach',
      'coach_bio',
      'description',
      'team_motto',
      'name'
    ];

    const updateKeys = Object.keys(updates).filter(key => allowedUpdates.includes(key));

    if (updateKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update in database
    res.json({ message: 'Team updated successfully', updates: updateKeys });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Add game to schedule
router.post('/:teamId/schedule', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { result, score, type, date, time, opponent, location } = req.body;

    // Validate required fields
    if (!result || !score || !type || !date || !time || !opponent || !location) {
      return res.status(400).json({ error: 'Missing required schedule fields' });
    }

    // Add to database
    res.json({ message: 'Game added to schedule', game: req.body });
  } catch (error) {
    console.error('Error adding game:', error);
    res.status(500).json({ error: 'Failed to add game' });
  }
});

// Update game in schedule
router.put('/:teamId/schedule/:gameId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId, gameId } = req.params;
    // Update in database
    res.json({ message: 'Game updated successfully' });
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// Delete game from schedule
router.delete('/:teamId/schedule/:gameId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId, gameId } = req.params;
    // Delete from database
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

// Add player to roster
router.post('/:teamId/players', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { number, name, position, grade, height, bio } = req.body;

    // Validate required fields
    if (!number || !name || !position || !grade || !height || !bio) {
      return res.status(400).json({ error: 'Missing required player fields' });
    }

    // Add to database
    res.json({ message: 'Player added to roster', player: req.body });
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// Update player
router.put('/:teamId/players/:playerId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId, playerId } = req.params;
    // Update in database
    res.json({ message: 'Player updated successfully' });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Delete player
router.delete('/:teamId/players/:playerId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { teamId, playerId } = req.params;
    // Delete from database
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

module.exports = router;
