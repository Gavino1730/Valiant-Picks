import React, { useState } from 'react';
import '../styles/Teams.css';

function Teams() {
  const [activeTab, setActiveTab] = useState('boys');

  const boysTeam = {
    name: 'Valley Catholic Boys Basketball',
    type: 'Boys Basketball',
    record_wins: 4,
    record_losses: 1,
    ranking: 3,
    coach_name: 'Bryan Fraser',
    description: 'Depth for days and pace that never slows. The floor is spaced with shooters, the rim is under constant threat, and there\'s no such thing as taking a possession off. The goal is simple, win state. Anything less is a failure. The team motto is BTA and they play like it.',
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
  };

  const girlsTeam = {
    name: 'Valley Catholic Girls Basketball',
    type: 'Girls Basketball',
    record_wins: 4,
    record_losses: 1,
    ranking: 8,
    coach_name: 'Patrick Thomas',
    description: 'Pure pressure from the opening tip. A relentless full court press, nonstop energy, shooters all over the floor, and substitutions so constant the other team never finds a rhythm. Games turn into chaos fast and stay that way.',
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
  };

  const TeamSection = ({ team }) => (
    <div className="team-section">
      <div className="team-header">
        <h2>{team.name}</h2>
        <div className="team-stats">
          <div className="stat">
            <span className="label">Record</span>
            <span className="value">{team.record_wins}-{team.record_losses}</span>
          </div>
          <div className="stat">
            <span className="label">Ranking</span>
            <span className="value">#{team.ranking}</span>
          </div>
          <div className="stat">
            <span className="label">Coach</span>
            <span className="value">{team.coach_name}</span>
          </div>
        </div>
      </div>

      <div className="team-description">
        <h3>About the Team</h3>
        <p>{team.description}</p>
      </div>

      <div className="roster-section">
        <h3>Roster</h3>
        <div className="roster-table">
          {team.players.map(player => (
            <div key={player.number} className="player-row">
              <div className="player-header">
                <span className="player-number">#{player.number}</span>
                <span className="player-name">{player.name}</span>
                <span className="player-position">{player.position}</span>
                <span className="player-grade">Grade {player.grade}</span>
                <span className="player-height">{player.height}</span>
              </div>
              <div className="player-bio">
                {player.bio}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="teams-page">
      <h1>Valley Catholic Basketball</h1>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'boys' ? 'active' : ''}`}
          onClick={() => setActiveTab('boys')}
        >
          Boys Basketball
        </button>
        <button 
          className={`tab-button ${activeTab === 'girls' ? 'active' : ''}`}
          onClick={() => setActiveTab('girls')}
        >
          Girls Basketball
        </button>
      </div>

      {activeTab === 'boys' && <TeamSection team={boysTeam} />}
      {activeTab === 'girls' && <TeamSection team={girlsTeam} />}
    </div>
  );
}

export default Teams;
