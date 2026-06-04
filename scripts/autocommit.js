#!/usr/bin/env node
// Auto-commit script that watches localStorage autosave timestamp
// and commits the project files to git when changes are detected

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const WATCH_INTERVAL = 5000; // Check every 5 seconds
const PROJECT_ROOT = path.resolve(process.cwd());

console.log('=== PreviHTML AutoCommit Watcher ===');
console.log(`Watching: ${PROJECT_ROOT}`);
console.log(`Interval: ${WATCH_INTERVAL}ms\n`);

let lastCommitTime = Date.now();

function gitCommit(message) {
  try {
    // Check if there are changes
    const status = execSync('git status --porcelain', { 
      cwd: PROJECT_ROOT,
      encoding: 'utf-8' 
    }).trim();
    
    if (!status) {
      console.log('[No changes to commit]');
      return;
    }

    // Add all changes
    execSync('git add .', { cwd: PROJECT_ROOT });
    
    // Commit with message
    const fullMessage = `${message}\n\nGenerated with [Continue](https://continue.dev)\n\nCo-Authored-By: Continue <noreply@continue.dev>`;
    execSync(`git commit -m "${fullMessage}"`, { 
      cwd: PROJECT_ROOT,
      encoding: 'utf-8' 
    });
    
    console.log(`✓ Committed: ${message}`);
    lastCommitTime = Date.now();
  } catch (err) {
    console.error(`✗ Commit failed: ${err.message}`);
  }
}

function checkForChanges() {
  try {
    // In a real scenario, you'd monitor the localStorage timestamp
    // For now, we'll just check git status periodically
    const now = Date.now();
    
    if (now - lastCommitTime >= WATCH_INTERVAL) {
      gitCommit(`Autosave commit at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error(`Error checking changes: ${err.message}`);
  }
}

// Start watching
console.log('Watching for changes... (Press Ctrl+C to stop)\n');
setInterval(checkForChanges, WATCH_INTERVAL);
