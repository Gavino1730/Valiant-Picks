# Auto-commit script for Valiant Picks
# Windows PowerShell version
# Usage: .\auto-commit.ps1

param(
    [int]$CheckInterval = 2000,  # Check every 2 seconds
    [int]$DebounceTime = 3000    # Wait 3 seconds after last change
)

Write-Host "🔄 Valiant Picks Auto-Commit Service" -ForegroundColor Cyan
Write-Host "📍 Repository: $PSScriptRoot" -ForegroundColor Cyan
Write-Host "⏱️  Check interval: ${CheckInterval}ms" -ForegroundColor Cyan
Write-Host "⏱️  Debounce time: ${DebounceTime}ms`n" -ForegroundColor Cyan

Write-Host "👀 Watching for file changes..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

$lastCommitTime = Get-Date
$lastCheckTime = Get-Date
$hasChanges = $false

$ignorePaths = @(
    'node_modules',
    '.git',
    'build',
    'dist',
    '.env',
    '.env.local',
    '*.log',
    '.DS_Store'
)

function Test-ShouldIgnore {
    param([string]$Path)
    
    foreach ($ignore in $ignorePaths) {
        if ($Path -match [regex]::Escape($ignore)) {
            return $true
        }
    }
    return $false
}

function Test-HasChanges {
    try {
        $status = & git status --porcelain 2>$null
        return ($status -and $status.Count -gt 0)
    }
    catch {
        Write-Host "Error checking git status: $_" -ForegroundColor Red
        return $false
    }
}

function Invoke-Commit {
    try {
        $status = & git status --porcelain 2>$null
        
        if (-not $status) {
            return $false
        }

        # Filter files
        $changedFiles = @()
        foreach ($line in $status) {
            if ($line.Trim()) {
                $file = $line.Substring(3).Trim()
                if (-not (Test-ShouldIgnore $file)) {
                    $changedFiles += $file
                }
            }
        }

        if ($changedFiles.Count -eq 0) {
            Write-Host "ℹ️  Only ignored files changed" -ForegroundColor Gray
            return $false
        }

        Write-Host "📦 Staging $($changedFiles.Count) file(s)..." -ForegroundColor Cyan
        & git add -A

        # Generate commit message
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $fileList = ($changedFiles | Select-Object -First 3) -join ', '
        $moreSuffix = if ($changedFiles.Count -gt 3) { ", +$($changedFiles.Count - 3) more" } else { "" }
        $commitMessage = "chore: auto-commit [$timestamp]`n`nFiles: $fileList$moreSuffix"

        Write-Host "💾 Committing changes..." -ForegroundColor Yellow
        & git commit -m "chore: auto-commit [$timestamp]" 2>$null

        Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
        try {
            & git push origin HEAD 2>$null
            Write-Host "✅ Successfully committed and pushed to GitHub" -ForegroundColor Green
        }
        catch {
            if ($_ -match "rejected") {
                Write-Host "⚠️  Push rejected (branch protection or no changes on remote)" -ForegroundColor Yellow
            }
            else {
                Write-Host "❌ Push failed: $_" -ForegroundColor Red
            }
        }

        $script:lastCommitTime = Get-Date
        return $true
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -notmatch "nothing to commit") {
            Write-Host "❌ Error during commit: $errorMsg" -ForegroundColor Red
        }
        return $false
    }
}

# Main loop
try {
    while ($true) {
        try {
            $currentlyHasChanges = Test-HasChanges

            if ($currentlyHasChanges -and -not $hasChanges) {
                Write-Host "📝 Changes detected" -ForegroundColor Yellow
                $script:hasChanges = $true
                $script:lastCheckTime = Get-Date
            }
            elseif (-not $currentlyHasChanges -and $hasChanges) {
                $script:hasChanges = $false
            }

            # Check if debounce time has passed
            if ($hasChanges) {
                $timeSinceCheck = (Get-Date) - $lastCheckTime
                $timeSinceCommit = (Get-Date) - $lastCommitTime
                
                if ($timeSinceCheck.TotalMilliseconds -gt $DebounceTime -and `
                    $timeSinceCommit.TotalMilliseconds -gt $DebounceTime) {
                    Invoke-Commit
                    $script:hasChanges = $false
                }
            }
        }
        catch {
            Write-Host "Error in watch loop: $_" -ForegroundColor Red
        }

        Start-Sleep -Milliseconds $CheckInterval
    }
}
catch {
    Write-Host "`n👋 Stopping auto-commit service" -ForegroundColor Cyan
    exit 0
}
