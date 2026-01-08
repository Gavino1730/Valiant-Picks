# Quick Start Guide

## First Time Setup

1. **Install Python** (if not already installed)
   - Download from https://www.python.org/downloads/
   - Python 3.8 or higher required

2. **Open Terminal/Command Prompt**
   - Press `Win + R`, type `cmd`, press Enter

3. **Navigate to the project folder**
   ```bash
   cd C:\Users\gavin\Documents\Betting\stats-ai-analyzer
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

6. **Setup environment variables**
   - Copy `.env.example` to `.env`:
     ```bash
     copy .env.example .env
     ```
   - Open `.env` in Notepad and add your OpenAI API key:
     ```
     OPENAI_API_KEY=sk-your-actual-openai-key-here
     FLASK_SECRET_KEY=any-random-string-here
     ```

7    ```
     OPENAI_API_KEY=sk-your-actual-openai-key-here
     FLASK_SECRET_KEY=any-random-string-here
     ```

7. **Run the application**
   ```bash
   python app.py
   ```

8. **Open your browser**
   - Go to: http://localhost:5001

## How to Use

1. **Upload Stats PDF**
   - Click "Choose PDF File" or drag & drop
   - Optionally fill in game information

2. **Click "Analyze Stats with AI"**
   - Wait while AI processes (30-60 seconds)
   - App converts PDF pages to images
   - GPT-4 Vision analyzes text + images (shot charts, diagrams, photos)

3. **Review Results**
   - Game predictions with win probability and shot analysis
   - Coaching advice based on shooting patterns
   - Player analysis with shooting zones
   - Betting recommendations with odds
   - Game insights and preparation notes

4. **Download Export**
   - Click "Download JSON" button
   - Save the file
   - Upload to Valiant Picks admin panel

## Getting Your OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create new secret key
5. Copy and paste into `.env` file

## Troubleshooting

**"Module not found" error:**
```bash
pip install -r requirements.txt
```

**"OPENAI_API_KEY not found" warning:**
- Check that `.env` file exists in project folder
- "Unable to get page count" or image conversion errors:**
- Install Poppler (see [WINDOWS_SETUP.md](WINDOWS_SETUP.md))
- App will still work with text-only analysis if Poppler not installed

**Make sure API key is correctly formatted in `.env`

**Port 5001 already in use:**
- Edit `app.py` and change port number:
  ```pythono with Vision API
- Typical analysis costs:
  - Text only: ~$0.10 per PDF
  - With images (5 pages): ~$0.30-$0.50 per PDF
  - Depends on PDF size and number of pages analyzed2)
  ```

## Cost Information

- Uses OpenAI GPT-4 API
- Typical analysis costs $0.10 - $0.30 per PDF
- Check your usage at https://platform.openai.com/usage

## Support

For issues or questions, check the README.md file for detailed documentation.
