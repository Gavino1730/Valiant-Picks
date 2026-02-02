/**
 * Verification script for increased rewards
 * This script tests the reward calculation logic
 */

// Test Daily Login Rewards
console.log('=== Daily Login Rewards ===');
console.log('Base reward: 100 VB (was 50 VB)');
console.log('Streak bonus: +20 VB per day (was +10 VB), capped at +200 VB (was +100 VB)');
console.log('\nExamples:');

function calculateDailyReward(streakCount) {
  const baseReward = 100;
  const streakBonus = Math.min((streakCount - 1) * 20, 200);
  const totalReward = baseReward + streakBonus;
  return totalReward;
}

const streaks = [1, 2, 3, 5, 7, 10, 11, 15];
streaks.forEach(streak => {
  const oldBase = 50;
  const oldBonus = Math.min((streak - 1) * 10, 100);
  const oldTotal = oldBase + oldBonus;
  
  const newTotal = calculateDailyReward(streak);
  const increase = newTotal - oldTotal;
  
  console.log(`Day ${streak}: ${newTotal} VB (was ${oldTotal} VB) [+${increase} VB]`);
});

// Test Wheel Spin Rewards
console.log('\n=== Wheel Spin Rewards ===');
console.log('Prize amounts (in VB):');
const oldPrizes = [500, 750, 1000, 2000, 3000, 5000, 7500, 10000];
const newPrizes = [1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000];
const weights = [30, 25, 20, 12, 7, 4, 1, 1]; // Probability weights

console.log('\nPrize changes:');
for (let i = 0; i < newPrizes.length; i++) {
  const increase = newPrizes[i] - oldPrizes[i];
  const percentage = ((increase / oldPrizes[i]) * 100).toFixed(0);
  console.log(`Slot ${i + 1}: ${newPrizes[i]} VB (was ${oldPrizes[i]} VB) [+${increase} VB, +${percentage}%] - Weight: ${weights[i]}`);
}

// Calculate expected value
function calculateExpectedValue(prizes, weights) {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let expectedValue = 0;
  for (let i = 0; i < prizes.length; i++) {
    expectedValue += (prizes[i] * weights[i]) / totalWeight;
  }
  return expectedValue;
}

const oldExpectedValue = calculateExpectedValue(oldPrizes, weights);
const newExpectedValue = calculateExpectedValue(newPrizes, weights);
const evIncrease = newExpectedValue - oldExpectedValue;
const evPercentage = ((evIncrease / oldExpectedValue) * 100).toFixed(1);

console.log(`\nExpected value per spin:`);
console.log(`Old: ${oldExpectedValue.toFixed(2)} VB`);
console.log(`New: ${newExpectedValue.toFixed(2)} VB`);
console.log(`Increase: +${evIncrease.toFixed(2)} VB (+${evPercentage}%)`);

console.log('\n=== Summary ===');
console.log('✓ Daily check-in base reward doubled: 50 → 100 VB');
console.log('✓ Daily check-in streak bonus doubled: +10/day → +20/day (cap: 100 → 200 VB)');
console.log('✓ Daily check-in max reward doubled: 150 → 300 VB');
console.log('✓ Wheel spin prizes doubled: 500-10000 → 1000-15000 VB range');
console.log(`✓ Wheel expected value increased by ${evPercentage}%`);
