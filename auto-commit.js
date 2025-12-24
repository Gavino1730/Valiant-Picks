#!/usr/bin/env node

/**
 * Auto-commit script for Valiant Picks
 * Watches for file changes and automatically commits to GitHub
 * 
 * Install dependencies first:
 *   npm install chokidar
 * 
 * Usage: npm run auto-commit
 *    or: node auto-commit.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEBOUNCE_TIME = 3000; // Wait 3 seconds after last change before committing
const CHECK_INTERVAL = 2000; // Check for changes every 2 seconds
const REPO_ROOT = __dirname;

let lastCommitTime = Date.now();
let lastCheckTime = Date.now();

const ignorePaths = [
  'node_modules',
  '.git',
  'build',
  'dist',
  '.env',
  '.env.local',
  '*.log',
  '.DS_Store',
  '.node_modules'
];

function shouldIgnore(filePath) {
  // Normalize path separators
  filePath = filePath.replace(/\\/g, '/');
  
  return ignorePaths.some(ignorePath => {
    if (ignorePath.includes('*')) {
      const pattern = ignorePath.replace('*', '.*');
      return new RegExp(pattern).test(filePath);
    }
    return filePath.includes(ignorePath);
  });
}

function checkForChanges() {
  try {
    const status = execSync('git status --porcelain', { 
      encoding: 'utf-8',
      cwd: REPO_ROOT
    }).trim();
    
    return status.length > 0;
  } catch (error) {
    console.error('Error checking git status:', error.message);
    return false;
  }
}

function performCommit() {
  try {
    // Check if there are actual changes
    const status = execSync('git status --porcelain', { 
      encoding: 'utf-8',
      cwd: REPO_ROOT 
    }).trim();
    
    if (!status) {
      return false;
    }

    // Filter out ignored files
    const changedFiles = status.split('\n')
      .filter(line => line.trim())
      .filter(line => !ignorePaths.some(ignore => line.includes(ignore)))
      .map(line => line.substring(3).trim());

    if (changedFiles.length === 0) {
      console.log('ℹ️  Only ignored files changed');
      return false;
    }

    // Stage all changes
    console.log(`📦 Staging ${changedFiles.length} file(s)...`);
    execSync('git add -A', { cwd: REPO_ROOT });

    // Generate commit message
    const timestamp = new Date().toLocaleString();
    const fileList = changedFiles.slice(0, 3).join(', ');
    const moreSuffix = changedFiles.length > 3 ? `, +${changedFiles.length - 3} more` : '';
    const commitMessage = `chore: auto-commit [${timestamp}]\n\nFiles: ${fileList}${moreSuffix}`;

    // Commit changes
    console.log('💾 Committing changes...');
    execSync(`git commit -m "${commitMessage.split('\n')[0]}"`, { cwd: REPO_ROOT });

    // Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    try {
      execSync('git push origin HEAD', { cwd: REPO_ROOT });
      console.log('✅ Successfully committed and pushed to GitHub');
    } catch (pushError) {
      const errorMsg = pushError.message || '';
      if (errorMsg.includes('rejected')) {
        console.warn('⚠️  Push rejected (branch protection or no changes on remote)');
      } else {
        console.error('❌ Push failed:', errorMsg);
      }
    }

    lastCommitTime = Date.now();
    return true;
  } catch (error) {
    const errorMsg = error.message || error.toString();
    
    // Ignore errors about nothing to commit
    if (errorMsg.includes('nothing to commit')) {
      return false;
    }

    console.error('❌ Error during commit:', errorMsg);
    return false;
  }
}

function main() {
  console.log('🔄 Valiant Picks Auto-Commit Service');
  console.log(`📍 Repository: ${REPO_ROOT}`);
  console.log(`⏱️  Check interval: ${CHECK_INTERVAL}ms`);
  console.log(`⏱️  Debounce time: ${DEBOUNCE_TIME}ms\n`);

  console.log('👀 Watching for file changes...');
  console.log('Press Ctrl+C to stop\n');

  let hasChanges = false;

  // Check for changes periodically
  const interval = setInterval(() => {
    try {
      const currentlyHasChanges = checkForChanges();

      if (currentlyHasChanges && !hasChanges) {
        console.log('📝 Changes detected');
        hasChanges = true;
        lastCheckTime = Date.now();
      } else if (!currentlyHasChanges && hasChanges) {
        hasChanges = false;
      }

      // If changes detected and debounce time has passed since last check
      if (hasChanges && (Date.now() - lastCheckTime > DEBOUNCE_TIME)) {
        if (Date.now() - lastCommitTime > DEBOUNCE_TIME) {
          performCommit();
          hasChanges = false;
        }
      }
    } catch (error) {
      console.error('Error in watch loop:', error.message);
    }
  }, CHECK_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping auto-commit service');
    clearInterval(interval);
    process.exit(0);
  });
}

main();
