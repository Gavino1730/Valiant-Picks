// Global variables
let currentExportFilename = null;
let currentGameId = null;

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const pdfFileInput = document.getElementById('pdfFile');
const fileNameDisplay = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const uploadStatus = document.getElementById('uploadStatus');
const resultsSection = document.getElementById('resultsSection');
const exportBtn = document.getElementById('exportBtn');
const insightForm = document.getElementById('insightForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadGameHistory();
});

function setupEventListeners() {
    // File input change
    pdfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = e.target.files[0].name;
        } else {
            fileNameDisplay.textContent = 'Choose PDF File';
        }
    });

    // Form submission
    uploadForm.addEventListener('submit', handleFormSubmit);

    // Export button
    exportBtn.addEventListener('click', handleExport);

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Insight form submission
    if (insightForm) {
        insightForm.addEventListener('submit', handleInsightSubmit);
    }
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(uploadForm);
    
    // Show loading state
    setLoadingState(true);
    hideStatus();
    hideResults();

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        // Success - display results
        displayResults(data);
        showStatus('Analysis complete! 🎉', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    const btnText = analyzeBtn.querySelector('.btn-text');
    const spinner = analyzeBtn.querySelector('.spinner');
    
    analyzeBtn.disabled = loading;
    
    if (loading) {
        btnText.textContent = 'Analyzing with AI...';
        spinner.classList.remove('hidden');
    } else {
        btnText.textContent = 'Analyze Stats with AI';
        spinner.classList.add('hidden');
    }
}

function showStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `status-message ${type}`;
    uploadStatus.classList.remove('hidden');
}

function hideStatus() {, game_id, memory_stats } = data;

    // Store export filename and game ID
    currentExportFilename = export_filename;
    currentGameId = game_id;

    // Populate content areas
    document.getElementById('predictionContent').textContent = 
        analysis.prediction || 'No prediction data available';
    
    document.getElementById('coachingContent').textContent = 
        analysis.coaching_insights || 'No coaching insights available';
    
    document.getElementById('playersContent').textContent = 
        analysis.player_analysis || 'No player analysis available';
    
    document.getElementById('bettingContent').textContent = 
        analysis.betting_recommendations || 'No betting recommendations available';
    
    document.getElementById('insightsContent').textContent = 
        analysis.game_insights || 'No game insights available';
    
    document.getElementById('preparationContent').textContent = 
        analysis.preparation || 'No preparation notes available';

    // Display memory stats
    document.getElementById('memoryStats').textContent = 
        memory_stats ? memory_stats.message : 'No historical context available';

    // Display export preview
    document.getElementById('exportPreview').textContent = 
        JSON.stringify(export_data, null, 2);

    // Reload game history
    loadGameHistory(tent').textContent = 
        analysis.preparation || 'No preparation notes available';

    // Display export preview
    document.getElementById('exportPreview').textContent = 
        JSON.stringify(export_data, null, 2);

    // Show results section
    showResults();
}

function showResults() {
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResults() {
    resultsSection.classList.add('hidden');
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === tabName);
    });
}

function handleExport() {
    if (!currentExportFilename) {
async function loadGameHistory() {
    try {
        const response = await fetch('/api/history?limit=10');
        const data = await response.json();
        
        const historyContainer = document.getElementById('gameHistory');
        if (!historyContainer) return;
        
        if (data.games && data.games.length > 0) {
            historyContainer.innerHTML = '<ul class="history-list">' + 
                data.games.map(game => `
                    <li class="history-item">
                        <strong>${game.game_date || 'No date'}</strong><br>
                        ${game.home_team} vs ${game.away_team}<br>
                        ${game.home_score && game.away_score ? `Score: ${game.home_score}-${game.away_score}` : 'Prediction'}
                        ${game.winner ? `<br>Winner: ${game.winner}` : ''}
                    </li>
                `).join('') + '</ul>';
        } else {
            historyContainer.innerHTML = '<p>No games analyzed yet</p>';
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

async function handleInsightSubmit(e) {
    e.preventDefault();
    
    const formData = {
        game_id: currentGameId,
        type: document.getElementById('insightType').value,
        content: document.getElementById('insightContent').value
    };
    
    if (!formData.content.trim()) {
        alert('Please enter some content for your insight');
        return;
    }
    
    try {
        const response = await fetch('/api/insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Insight saved! It will be used in future analysis.');
            document.getElementById('insightContent').value = '';
        } else {
            alert('Error saving insight');
        }
    } catch (error) {
        console.error('Error saving insight:', error);
        alert('Error saving insight');
    }
}

        alert('No analysis data to export');
        return;
    }

    // Trigger download
    window.location.href = `/download/${currentExportFilename}`;
}

// Drag and drop support
const fileLabel = document.querySelector('.file-label');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileLabel.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    fileLabel.addEventListener(eventName, () => {
        fileLabel.style.borderColor = 'var(--primary-color)';
        fileLabel.style.background = '#e8f4ff';
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    fileLabel.addEventListener(eventName, () => {
        fileLabel.style.borderColor = '';
        fileLabel.style.background = '';
    }, false);
});

fileLabel.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        pdfFileInput.files = files;
        fileNameDisplay.textContent = files[0].name;
    }
}, false);
