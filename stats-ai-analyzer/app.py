from flask import Flask, render_template, request, jsonify, send_file, session
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
from pdf_parser import extract_text_from_pdf, parse_stats_data, validate_pdf, convert_pdf_to_images
from ai_analyzer import AIAnalyzer
from database import StatsDatabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize database
db = StatsDatabase()

# Configuration
UPLOAD_FOLDER = 'uploads'
EXPORT_FOLDER = 'exports'
ALLOWED_EXTENSIONS = {'pdf'}

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EXPORT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Main page."""
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle PDF upload and analysis."""
    try:
        # Check if file was uploaded
        if 'pdf_file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['pdf_file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Save the file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Validate PDF
        if not validate_pdf(filepath):
            os.remove(filepath)
            return jsonify({'error': 'Invalid PDF file'}), 400
        
        # Extract text from PDF
        stats_text = extract_text_from_pdf(filepath)
        
        if not stats_text or len(stats_text) < 50:
            os.remove(filepath)
            return jsonify({'error': 'Could not extract sufficient text from PDF'}), 400
        
        # Parse stats data
        parsed_stats = parse_stats_data(stats_text)
        
        # Convert PDF pages to images for vision analysis
        print("Converting PDF to images for visual analysis...")
        pdf_images = convert_pdf_to_images(filepath, max_pages=5)
        
        if pdf_images:
            print(f"✓ Extracted {len(pdf_images)} page(s) as images for shot chart analysis")
        else:
            print("⚠ No images extracted - will analyze text only")
        
        # Get game info from form or parsed data
        game_info = {
            'home_team': request.form.get('home_team', ''),
            'away_team': request.form.get('away_team', ''),
            'game_date': request.form.get('game_date', ''),
            'game_time': request.form.get('game_time', ''),
            'location': request.form.get('location', ''),
            'type': request.form.get('game_type', 'regular')
        }
        
        # If teams not provided, try to extract from parsed data
        if not game_info['home_team'] and parsed_stats['detected_teams']:
            teams = parsed_stats['detected_teams'][0]
            if ' at ' in teams.lower():
                parts = teams.lower().split(' at ')
                game_info['away_team'] = parts[0].strip().title()
                game_info['home_team'] = parts[1].strip().title()
            elif ' vs ' in teams.lower():
                parts = teams.lower().split(' vs ')
                game_info['home_team'] = parts[0].strip().title()
                game_info['away_team'] = parts[1].strip().title()
        
        # Initialize AI analyzer
        analyzer = AIAnalyzer()
        
        # Perform AI analysis with both text, images, and game context
        analysis = analyzer.analyze_stats(stats_text, images=pdf_images, game_context=game_info)
        
        # Generate export data
        export_data = analyzer.generate_betting_export(analysis, game_info)
        
        # Save to database
        game_id = db.add_game({
            'game_date': game_info.get('game_date'),
            'home_team': game_info.get('home_team'),
            'away_team': game_info.get('away_team'),
            'home_score': export_data.get('predictions', {}).get('predicted_score', '').split('-')[0] if '-' in str(export_data.get('predictions', {}).get('predicted_score', '')) else None,
            'away_score': export_data.get('predictions', {}).get('predicted_score', '').split('-')[1] if '-' in str(export_data.get('predictions', {}).get('predicted_score', '')) else None,
            'winner': export_data.get('predictions', {}).get('winner'),
            'game_type': game_info.get('type'),
            'location': game_info.get('location'),
            'raw_stats': stats_text
        })
        
        # Store analysis results
        db.add_analysis(game_id, analysis)
        
        # Update team trends
        if game_info.get('home_team'):
            db.update_team_trends(game_info['home_team'])
        if game_info.get('away_team'):
            db.update_team_trends(game_info['away_team'])
        
        # Get historical context for response
        historical_context = db.get_historical_context()
        
        # Save export data for download
        export_filename = f"analysis_{timestamp}.json"
        export_path = os.path.join(EXPORT_FOLDER, export_filename)
        with open(export_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        # Store in session for download
        session['last_export'] = export_filename
        
        # Clean up uploaded file (optional - comment out if you want to keep)
        # os.remove(filepath)
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'export_data': export_data,
            'export_filename': export_filename,
            'parsed_stats': parsed_stats,
            'game_id': game_id,
            'memory_stats': {
                'total_games': historical_context['total_games'],
                'message': f'Analyzed with context from {historical_context["total_games"]} previous games'
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/download/<filename>')
def download_file(filename):
    """Download exported analysis JSON."""
    try:
        filepath = os.path.join(EXPORT_FOLDER, secure_filename(filename))
        if os.path.exists(filepath):
            return send_file(
                filepath,
                as_attachment=True,
                download_name=filename,
                mimetype='application/json'
            )
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'openai_configured': bool(os.getenv('OPENAI_API_KEY')),
        'database_initialized': os.path.exists('stats_memory.db'),
        'total_games_analyzed': db.get_historical_context()['total_games']
    })


@app.route('/api/history')
def get_history():
    """Get recent game history."""
    try:
        limit = request.args.get('limit', 20, type=int)
        games = db.get_recent_games(limit)
        return jsonify({'games': games})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/team/<team_name>')
def get_team_stats(team_name):
    """Get stats for a specific team."""
    try:
        history = db.get_team_history(team_name, limit=20)
        return jsonify({'team': team_name, 'history': history})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/insights', methods=['GET', 'POST'])
def manage_insights():
    """Add or get user insights."""
    try:
        if request.method == 'POST':
            data = request.json
            db.add_user_insight(
                game_id=data.get('game_id'),
                insight_type=data.get('type', 'general'),
                content=data.get('content')
            )
            return jsonify({'success': True, 'message': 'Insight added'})
        else:
            # Get recent insights
            context = db.get_historical_context()
            return jsonify({'insights': context['user_insights']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  WARNING: OPENAI_API_KEY not found in environment!")
        print("Please create a .env file with your OpenAI API key.")
        print("See .env.example for reference.")
    else:
        print("✅ OpenAI API key loaded")
    
    print("\n🚀 Starting Sports Stats AI Analyzer...")
    print("📍 Open your browser to: http://localhost:5001")
    print("\n")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
