import sqlite3
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import os

DATABASE_PATH = 'stats_memory.db'

class StatsDatabase:
    def __init__(self, db_path: str = DATABASE_PATH):
        """Initialize database connection and create tables if needed."""
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection."""
        return sqlite3.connect(self.db_path)
    
    def init_database(self):
        """Create database tables if they don't exist."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Games table - stores each uploaded game
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                upload_date TEXT NOT NULL,
                game_date TEXT,
                home_team TEXT,
                away_team TEXT,
                home_score INTEGER,
                away_score INTEGER,
                winner TEXT,
                game_type TEXT,
                location TEXT,
                raw_stats TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Analysis results table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                prediction TEXT,
                coaching_insights TEXT,
                player_analysis TEXT,
                betting_recommendations TEXT,
                game_insights TEXT,
                preparation TEXT,
                full_analysis TEXT,
                FOREIGN KEY (game_id) REFERENCES games (id)
            )
        ''')
        
        # User insights/notes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER,
                insight_type TEXT,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games (id)
            )
        ''')
        
        # Player stats table - tracks individual player performance
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS player_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                player_name TEXT NOT NULL,
                team TEXT,
                points INTEGER,
                rebounds INTEGER,
                assists INTEGER,
                steals INTEGER,
                blocks INTEGER,
                field_goal_pct REAL,
                three_point_pct REAL,
                free_throw_pct REAL,
                minutes_played INTEGER,
                other_stats TEXT,
                FOREIGN KEY (game_id) REFERENCES games (id)
            )
        ''')
        
        # Team trends table - aggregated team statistics
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS team_trends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_name TEXT NOT NULL,
                games_played INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                avg_points_scored REAL,
                avg_points_allowed REAL,
                avg_field_goal_pct REAL,
                avg_three_point_pct REAL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_game(self, game_data: Dict[str, Any]) -> int:
        """Add a new game to the database."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO games (
                upload_date, game_date, home_team, away_team,
                home_score, away_score, winner, game_type,
                location, raw_stats
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            game_data.get('game_date'),
            game_data.get('home_team'),
            game_data.get('away_team'),
            game_data.get('home_score'),
            game_data.get('away_score'),
            game_data.get('winner'),
            game_data.get('game_type'),
            game_data.get('location'),
            json.dumps(game_data.get('raw_stats', {}))
        ))
        
        game_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return game_id
    
    def add_analysis(self, game_id: int, analysis: Dict[str, Any]):
        """Store analysis results for a game."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO analysis_results (
                game_id, prediction, coaching_insights, player_analysis,
                betting_recommendations, game_insights, preparation, full_analysis
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            game_id,
            analysis.get('prediction', ''),
            analysis.get('coaching_insights', ''),
            analysis.get('player_analysis', ''),
            analysis.get('betting_recommendations', ''),
            analysis.get('game_insights', ''),
            analysis.get('preparation', ''),
            analysis.get('full_analysis', '')
        ))
        
        conn.commit()
        conn.close()
    
    def add_user_insight(self, game_id: Optional[int], insight_type: str, content: str):
        """Add user's manual insight or note."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_insights (game_id, insight_type, content)
            VALUES (?, ?, ?)
        ''', (game_id, insight_type, content))
        
        conn.commit()
        conn.close()
    
    def add_player_stats(self, game_id: int, player_data: Dict[str, Any]):
        """Add individual player stats for a game."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO player_stats (
                game_id, player_name, team, points, rebounds, assists,
                steals, blocks, field_goal_pct, three_point_pct,
                free_throw_pct, minutes_played, other_stats
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            game_id,
            player_data.get('player_name'),
            player_data.get('team'),
            player_data.get('points'),
            player_data.get('rebounds'),
            player_data.get('assists'),
            player_data.get('steals'),
            player_data.get('blocks'),
            player_data.get('field_goal_pct'),
            player_data.get('three_point_pct'),
            player_data.get('free_throw_pct'),
            player_data.get('minutes_played'),
            json.dumps(player_data.get('other_stats', {}))
        ))
        
        conn.commit()
        conn.close()
    
    def get_recent_games(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent games from database."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM games
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))
        
        games = []
        for row in cursor.fetchall():
            games.append({
                'id': row[0],
                'upload_date': row[1],
                'game_date': row[2],
                'home_team': row[3],
                'away_team': row[4],
                'home_score': row[5],
                'away_score': row[6],
                'winner': row[7],
                'game_type': row[8],
                'location': row[9],
                'created_at': row[11]
            })
        
        conn.close()
        return games
    
    def get_team_history(self, team_name: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get historical games for a specific team."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM games
            WHERE home_team LIKE ? OR away_team LIKE ?
            ORDER BY game_date DESC
            LIMIT ?
        ''', (f'%{team_name}%', f'%{team_name}%', limit))
        
        games = []
        for row in cursor.fetchall():
            games.append({
                'id': row[0],
                'game_date': row[2],
                'home_team': row[3],
                'away_team': row[4],
                'home_score': row[5],
                'away_score': row[6],
                'winner': row[7]
            })
        
        conn.close()
        return games
    
    def get_player_history(self, player_name: str) -> List[Dict[str, Any]]:
        """Get historical stats for a specific player."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT ps.*, g.game_date, g.home_team, g.away_team
            FROM player_stats ps
            JOIN games g ON ps.game_id = g.id
            WHERE ps.player_name LIKE ?
            ORDER BY g.game_date DESC
        ''', (f'%{player_name}%',))
        
        stats = []
        for row in cursor.fetchall():
            stats.append({
                'game_date': row[14],
                'opponent': f"{row[15]} vs {row[16]}",
                'points': row[4],
                'rebounds': row[5],
                'assists': row[6],
                'field_goal_pct': row[9],
                'three_point_pct': row[10]
            })
        
        conn.close()
        return stats
    
    def get_historical_context(self) -> Dict[str, Any]:
        """Get comprehensive historical context for AI analysis."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get total games analyzed
        cursor.execute('SELECT COUNT(*) FROM games')
        total_games = cursor.fetchone()[0]
        
        # Get recent games summary
        cursor.execute('''
            SELECT home_team, away_team, home_score, away_score, winner, game_date
            FROM games
            ORDER BY game_date DESC
            LIMIT 10
        ''')
        recent_games = cursor.fetchall()
        
        # Get user insights
        cursor.execute('''
            SELECT insight_type, content, created_at
            FROM user_insights
            ORDER BY created_at DESC
            LIMIT 20
        ''')
        user_insights = cursor.fetchall()
        
        conn.close()
        
        return {
            'total_games': total_games,
            'recent_games': recent_games,
            'user_insights': user_insights
        }
    
    def update_team_trends(self, team_name: str):
        """Update aggregated team statistics."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Calculate team statistics
        cursor.execute('''
            SELECT 
                COUNT(*) as games_played,
                SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) as wins,
                AVG(CASE WHEN home_team = ? THEN home_score ELSE away_score END) as avg_scored,
                AVG(CASE WHEN home_team = ? THEN away_score ELSE home_score END) as avg_allowed
            FROM games
            WHERE home_team = ? OR away_team = ?
        ''', (team_name, team_name, team_name, team_name, team_name))
        
        result = cursor.fetchone()
        
        if result[0] > 0:  # If games exist
            cursor.execute('''
                INSERT OR REPLACE INTO team_trends 
                (team_name, games_played, wins, losses, avg_points_scored, avg_points_allowed, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                team_name,
                result[0],
                result[1],
                result[0] - result[1],
                result[2],
                result[3],
                datetime.now().isoformat()
            ))
        
        conn.commit()
        conn.close()
