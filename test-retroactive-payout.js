#!/usr/bin/env node
/**
 * Test script for the retroactive payout endpoint
 * 
 * Usage: 
 *   node test-retroactive-payout.js <admin-token> [execute]
 * 
 * Examples:
 *   node test-retroactive-payout.js your-jwt-token         # Dry run
 *   node test-retroactive-payout.js your-jwt-token execute # Execute payouts
 */

const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ENDPOINT = '/api/games/retroactive-payout-oes';

// Get arguments
const adminToken = process.argv[2];
const executeMode = process.argv[3] === 'execute';

if (!adminToken) {
  console.error('Error: Admin JWT token required');
  console.error('Usage: node test-retroactive-payout.js <admin-token> [execute]');
  process.exit(1);
}

const dryRun = !executeMode;

console.log('='.repeat(70));
console.log('RETROACTIVE PAYOUT TEST');
console.log('='.repeat(70));
console.log(`API URL: ${API_URL}`);
console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'EXECUTE (will make changes!)'}`);
console.log('='.repeat(70));
console.log('');

// Make the API request
const url = new URL(ENDPOINT, API_URL);
const isHttps = url.protocol === 'https:';
const httpModule = isHttps ? https : http;

const postData = JSON.stringify({ dryRun });

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${adminToken}`
  }
};

const req = httpModule.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);

    try {
      const response = JSON.parse(data);
      
      if (res.statusCode !== 200) {
        console.error('❌ ERROR:', response.error || 'Unknown error');
        process.exit(1);
      }

      if (response.dryRun) {
        console.log('✅ DRY RUN RESULTS\n');
        console.log('Summary:');
        console.log(`  • Bets to process: ${response.summary.betsToProcess}`);
        console.log(`  • Affected users: ${response.summary.affectedUsers}`);
        console.log(`  • Total payout: $${response.summary.totalPayout.toFixed(2)}\n`);

        if (response.userPayouts && response.userPayouts.length > 0) {
          console.log('Breakdown by User:');
          console.log('-'.repeat(70));
          response.userPayouts.forEach(user => {
            console.log(`\n${user.username} (${user.userId}):`);
            console.log(`  • ${user.betCount} bet(s)`);
            console.log(`  • Total owed: $${user.totalOwed.toFixed(2)}`);
            
            if (user.bets && user.bets.length > 0) {
              console.log(`  • Bets:`);
              user.bets.forEach(bet => {
                console.log(`    - Bet #${bet.betId}: $${bet.amount} @ ${bet.odds}x = $${bet.payout.toFixed(2)}`);
                console.log(`      ${bet.teamType} on ${bet.gameDate}`);
              });
            }
          });
        } else {
          console.log('No unpaid winning bets found for OES games.');
        }

        console.log('\n' + '-'.repeat(70));
        console.log('\nTo execute these payouts, run:');
        console.log(`  node test-retroactive-payout.js <your-token> execute`);
      } else {
        console.log('✅ PAYOUTS EXECUTED\n');
        console.log(`Message: ${response.message}`);
        console.log(`Bets processed: ${response.betsProcessed}`);
        console.log(`Total paid: $${response.totalPaid.toFixed(2)}`);
        console.log(`Affected users: ${response.affectedUsers}\n`);

        if (response.results && response.results.length > 0) {
          const successCount = response.results.filter(r => r.status === 'success').length;
          const failCount = response.results.filter(r => r.status === 'failed').length;

          console.log(`Results: ${successCount} successful, ${failCount} failed`);

          const failed = response.results.filter(r => r.status === 'failed');
          if (failed.length > 0) {
            console.log('\n❌ Failed payouts:');
            failed.forEach(result => {
              console.log(`  • Bet ${result.betId}: ${result.error}`);
            });
          }
        }

        console.log('\n✅ Payouts complete! Users have been notified.');
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
  console.error('Note: Check your network connection and API URL');
  process.exit(1);
});

req.write(postData);
req.end();
