# Sports Stats AI Analyzer

Local AI-powered application that analyzes sports statistics PDFs and generates predictions, coaching insights, and betting recommendations using OpenAI's GPT models.

## Features

- **PDF Upload**: Upload sports stats sheets in PDF format
- **AI Vision Analysis**: GPT-4 Vision analyzes shot charts, diagrams, photos, and visual data
- **Historical Memory**: Remembers all analyzed games and learns from patterns
- **Trend Analysis**: Identifies trends across multiple games and seasons
- **User Insights**: Add your own observations and coaching notes
- **Text Analysis**: Comprehensive text extraction and analysis
- **Coaching Insights**: Detailed coaching advice and strategic recommendations
- **Bet Generation**: Automatic bet creation with odds and confidence levels
- **Betting Line Predictions**: AI suggests spreads, totals, and moneylines based on historical data
- **Export to Valiant Picks**: JSON export format compatible with Valiant Picks platform
- **Game Insights**: Player matchups, team trends, and key factors
- **Shot Chart Analysis**: AI can see and analyze shooting locations, heat maps, and court diagrams
- **Team Performance Tracking**: Tracks wins, losses, scoring averages over time

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure OpenAI API Key

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   FLASK_SECRET_KEY=your-random-secret-key
   ```

### 3. Run the Application

```bash
python app.py
```

The app will start at `http://localhost:5001`

## Usage

1. **Upload Stats PDF**: Click "Choose File" and select your stats PDF
2. **Analyze**: Click "Analyze Stats" to process the file
   - AI extracts text from PDF
   - Converts pages to images for visual analysis
   - GPT-4 Vision analyzes shot charts, diagrams, and photos
   - **Checks historical database for team trends and patterns**
   - **References previous user insights and coaching notes**
3. **Review Results**:
   - Game predictions with win probabilities (including shot location insights)
   - Detailed coaching advice based on visual data **and historical trends**
   - Player matchup analysis with shooting patterns
   - Recommended bets with odds based on complete analysis
   - **Historical context showing past games and trends**
4. **Add Your Insights**: Use the "Historical Context" tab to add coaching notes, observations, or betting tips
5. **Export**: Download JSON file to upload to Valiant Picks

## Memory & Learning

The app maintains a local SQLite database that stores:

- **Game Results**: All uploaded games with scores and outcomes
- **Analysis History**: Full AI analysis for each game
- **Player Stats**: Individual player performance across games
- **Team Trends**: Win/loss records, scoring averages, shooting percentages
- **User Insights**: Your manual notes, coaching tips, and observations

### What the AI Remembers:

- Previous games between the same teams
- Historical win/loss patterns
- Scoring trends and averages
- Your coaching observations
- Betting insights you've added
- Player performance history

### Adding Insights:

Go to the "Historical Context" tab and add:
- **Coaching Notes**: Strategic observations
- **Player Observations**: Individual player tendencies
- **Strategy Tips**: What works/doesn't work
- **Betting Insights**: Patterns you've noticed
- **General Notes**: Any other observations

The AI will use these insights in future analysis!
 (including shooting efficiency from charts)
- **Coaching Advice**: Strategic recommendations based on shot selection and court positioning
- **Player Insights**: Individual player analysis, shooting zones, and matchups
- **Shot Chart Analysis**: Heat maps, shooting percentages by location, defensive positioning
- **Betting Recommendations**: Spread, moneyline, over/under, prop bets
- **Team Trends**: Historical performance and patterns from visual dataup suggestions
- **Player Insights**: Individual player analysis and matchups
- **Betting Recommendations**: Spread, moneyline, over/under, prop bets
- **Team Trends**: Historical performance and patterns

## Export Format

The app generates JSON files compatible with Valiant Picks:
```json
{
  "game": {
    "home_team": "Team Name",
    "away_team": "Opponent",
    "game_date": "2026-01-15",
    "predictions": {...},
    "recommended_bets": [...]
  }
}
```

## Requirements

- Python 3.8+ (with GPT-4 Vision access)
- PDF stats files with text and/or images
- Poppler (for PDF to image conversion on Windows - see setup below)
- PDF stats files

## Notes
Uses GPT-4o model with vision capabilities
- Converts PDF pages to images to analyze shot charts, diagrams, and photos
- No data is stored permanently - only during active session
- All AI processing uses your OpenAI API key
- PDF files are temporarily stored in `uploads/` folder
- Vision analysis may cost slightly more than text-only ($0.10-$0.50 per analysis depending on PDF size)ssion
- All AI processing uses your OpenAI API key
- PDF files are temporarily stored in `uploads/` folder
