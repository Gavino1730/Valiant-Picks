import os
from openai import OpenAI
from dotenv import load_dotenv
from typing import Dict, Any, List
import json
from database import StatsDatabase

load_dotenv()

class AIAnalyzer:
    def __init__(self):
        """Initialize OpenAI client with API key from environment."""
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"  # Use GPT-4o for vision + text analysis
        self.db = StatsDatabase()
    
    def analyze_stats(self, stats_text: str, images: List[str] = None, game_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Send stats to OpenAI for comprehensive analysis with vision support and historical context.
        
        Args:
            stats_text: Extracted text from stats PDF
            images: List of base64-encoded images from PDF pages
            game_context: Information about the game being analyzed
            
        Returns:
            Dictionary containing all analysis results
        """
        try:
            # Get historical context from database
            historical_context = self.db.get_historical_context()
            
            # Get team-specific history if we know the teams
            team_histories = {}
            if game_context:
                if game_context.get('home_team'):
                    team_histories['home'] = self.db.get_team_history(game_context['home_team'])
                if game_context.get('away_team'):
                    team_histories['away'] = self.db.get_team_history(game_context['away_team'])
            
            # Create comprehensive prompt for analysis with historical context
            prompt = self._create_analysis_prompt(stats_text, historical_context, team_histories)
            
            # Build message content with text and images
            message_content = []
            
            # Add text prompt
            message_content.append({
                "type": "text",
                "text": prompt
            })
            
            # Add images if provided (for visual analysis)
            if images:
                for idx, img_base64 in enumerate(images):
                    message_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_base64}",
                            "detail": "high"  # High detail for shot charts and stats
                        }
                    })
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert sports analyst specializing in basketball statistics, game predictions, coaching strategy, and betting analysis. Analyze both text data and visual elements like shot charts, player photos, court diagrams, and statistical graphics. Provide detailed, data-driven insights based on ALL available information."
                    },
                    {
                        "role": "user",
                        "content": message_content
                    }
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            # Parse the response
            analysis_text = response.choices[0].message.content
            
            # Structure the analysis
            return self._structure_analysis(analysis_text, stats_text)
        
        except Exception as e:
            raise Exception(f"Error during AI analysis: {str(e)}")
    
    def _create_analysis_prompt(self, stats_text: str, historical_context: Dict[str, Any], team_histories: Dict[str, List]) -> str:
        """Create detailed prompt for OpenAI analysis with memory."""
        
        # Format historical context
        history_section = ""
        if historical_context['total_games'] > 0:
            history_section = f"""
HISTORICAL MEMORY (You have analyzed {historical_context['total_games']} games):

Recent Games:
"""
            for game in historical_context['recent_games'][:5]:
                history_section += f"- {game[5]}: {game[0]} ({game[2]}) vs {game[1]} ({game[3]}) - Winner: {game[4]}\n"
            
            if historical_context['user_insights']:
                history_section += "\nUser's Previous Insights:\n"
                for insight in historical_context['user_insights'][:10]:
                    history_section += f"- [{insight[0]}] {insight[1]}\n"
        
        # Format team histories
        team_history_section = ""
        if team_histories:
            if 'home' in team_histories and team_histories['home']:
                team_history_section += "\nHome Team Recent Results:\n"
                for game in team_histories['home'][:5]:
                    team_history_section += f"- {game['game_date']}: {game['home_team']} {game['home_score']}-{game['away_score']} {game['away_team']}\n"
            
            if 'away' in team_histories and team_histories['away']:
                team_history_section += "\nAway Team Recent Results:\n"
                for game in team_histories['away'][:5]:
                    team_history_section += f"- {game['game_date']}: {game['home_team']} {game['home_score']}-{game['away_score']} {game['away_team']}\n"
        
        return f"""Analyze the following basketball game statistics and provide a comprehensive breakdown. 

IMPORTANT: I'm providing both text data AND images from the stats sheet. Please analyze:
- Shot charts and shooting locations
- Player photos and roster information
- Any diagrams, graphics, or visual data
- Statistical tables and numbers
- Court diagrams and play visualizations

{history_section}
{team_history_section}

CURRENT GAME STATS (TEXT):
{stats_text}

Using ALL available data (current stats, historical trends, past games, and user insights), please provide:

1. GAME PREDICTION
   - Predicted winner and confidence level (%)
   - Predicted final score
   - Win probability for each team
   - Key factors influencing the outcome

2. COACHING INSIGHTS
   - Strategic recommendations for each team
   - Lineup adjustments to consider
   - Defensive and offensive strategies
   - Player matchups to exploit
   - Timeout and substitution recommendations

3. PLAYER ANALYSIS
   - Top performers and their impact
   - Player matchup advantages/disadvantages
   - Key player stats and trends
   - Players to watch in upcoming game

4. BETTING RECOMMENDATIONS
   - Moneyline pick with odds
   - Spread prediction and confidence
   - Over/Under recommendation
   - Prop bet suggestions (top scorer, rebounds, etc.)
   - Confidence level for each bet (Low/Medium/High)

5. GAME INSIGHTS & TRENDS
   - Historical trends from this data AND past games
   - Team strengths and weaknesses (compare to previous performances)
   - Momentum indicators
   - Injury concerns or lineup changes
   - Home court advantage factors
   - Head-to-head history and patterns

6. UPCOMING GAME PREPARATION
   - What to prepare for
   - Practice focus areas based on trends
   - Film study priorities
   - Mental preparation notes
   - Adjustments based on previous games

7. BETTING LINE PREDICTIONS
   - Suggested moneyline odds
   - Recommended spread
   - Over/Under total
   - Confidence level for each prediction (based on historical accuracy)

Please be specific, data-driven, reference historical patterns when relevant, and provide actionable insights. Format your response clearly with sections."""
    
    def _structure_analysis(self, analysis_text: str, original_stats: str) -> Dict[str, Any]:
        """Structure the AI analysis into organized sections."""
        
        # Try to parse sections from the response
        sections = {
            "prediction": "",
            "coaching_insights": "",
            "player_analysis": "",
            "betting_recommendations": "",
            "game_insights": "",
            "preparation": "",
            "full_analysis": analysis_text,
            "original_stats": original_stats
        }
        
        # Simple section extraction (look for numbered headers)
        current_section = None
        lines = analysis_text.split('\n')
        
        for line in lines:
            line_upper = line.upper()
            
            if 'GAME PREDICTION' in line_upper or '1.' in line:
                current_section = 'prediction'
            elif 'COACHING INSIGHT' in line_upper or '2.' in line:
                current_section = 'coaching_insights'
            elif 'PLAYER ANALYSIS' in line_upper or '3.' in line:
                current_section = 'player_analysis'
            elif 'BETTING RECOMMENDATION' in line_upper or '4.' in line:
                current_section = 'betting_recommendations'
            elif 'GAME INSIGHT' in line_upper or '5.' in line:
                current_section = 'game_insights'
            elif 'PREPARATION' in line_upper or '6.' in line:
                current_section = 'preparation'
            
            if current_section:
                sections[current_section] += line + '\n'
        
        return sections
    
    def generate_betting_export(self, analysis: Dict[str, Any], game_info: Dict[str, str]) -> Dict[str, Any]:
        """
        Generate structured betting data for export to Valiant Picks.
        
        Args:
            analysis: Analysis results from AI
            game_info: Basic game information (teams, date, etc.)
            
        Returns:
            Structured data ready for Valiant Picks import
        """
        
        # Extract betting recommendations from analysis
        betting_text = analysis.get('betting_recommendations', '')
        
        # Create structured export
        export_data = {
            "game": {
                "home_team": game_info.get('home_team', 'Unknown'),
                "away_team": game_info.get('away_team', 'Unknown'),
                "game_date": game_info.get('game_date', ''),
                "game_time": game_info.get('game_time', ''),
                "location": game_info.get('location', ''),
                "type": game_info.get('type', 'regular')
            },
            "predictions": {
                "winner": self._extract_winner(analysis['prediction']),
                "confidence": self._extract_confidence(analysis['prediction']),
                "predicted_score": self._extract_score(analysis['prediction'])
            },
            "recommended_bets": self._extract_bets(betting_text),
            "insights": {
                "coaching": analysis.get('coaching_insights', ''),
                "players": analysis.get('player_analysis', ''),
                "game_factors": analysis.get('game_insights', '')
            },
            "ai_analysis_summary": analysis.get('full_analysis', '')
        }
        
        return export_data
    
    def _extract_winner(self, prediction_text: str) -> str:
        """Extract predicted winner from prediction text."""
        # Simple extraction - look for "winner:" or team names
        lines = prediction_text.split('\n')
        for line in lines:
            if 'winner' in line.lower():
                return line.split(':')[-1].strip() if ':' in line else "See analysis"
        return "See analysis"
    
    def _extract_confidence(self, prediction_text: str) -> str:
        """Extract confidence level from prediction text."""
        text_lower = prediction_text.lower()
        if 'high' in text_lower or '%' in prediction_text:
            # Look for percentage
            for word in prediction_text.split():
                if '%' in word:
                    return word
        return "See analysis"
    
    def _extract_score(self, prediction_text: str) -> str:
        """Extract predicted score from prediction text."""
        lines = prediction_text.split('\n')
        for line in lines:
            if 'score' in line.lower() and '-' in line:
                return line.strip()
        return "See analysis"
    
    def _extract_bets(self, betting_text: str) -> List[Dict[str, Any]]:
        """Extract individual bet recommendations."""
        bets = []
        
        # Look for common bet types
        bet_types = ['moneyline', 'spread', 'over/under', 'prop']
        
        lines = betting_text.split('\n')
        current_bet = None
        
        for line in lines:
            line_lower = line.lower()
            
            # Check if line mentions a bet type
            bet_found = False
            for bet_type in bet_types:
                if bet_type in line_lower:
                    if current_bet:
                        bets.append(current_bet)
                    
                    current_bet = {
                        "type": bet_type,
                        "recommendation": line.strip(),
                        "confidence": "Medium"  # Default
                    }
                    
                    # Check for confidence level
                    if 'high' in line_lower:
                        current_bet['confidence'] = "High"
                    elif 'low' in line_lower:
                        current_bet['confidence'] = "Low"
                    
                    bet_found = True
                    break
            
            # Add details to current bet
            if not bet_found and current_bet and line.strip():
                current_bet['recommendation'] += '\n' + line.strip()
        
        # Add last bet
        if current_bet:
            bets.append(current_bet)
        
        # If no structured bets found, create a general recommendation
        if not bets:
            bets.append({
                "type": "general",
                "recommendation": betting_text,
                "confidence": "Medium"
            })
        
        return bets
