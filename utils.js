// Utility Functions

function getDailyPuzzle() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Pre-defined good puzzles with common letters that work well together
  // These are hand-picked to have lots of words
  const goodPuzzles = [
    { center: 'E', outer: ['R', 'A', 'T', 'S', 'N', 'I'] },
    { center: 'A', outer: ['R', 'E', 'T', 'S', 'N', 'L'] },
    { center: 'I', outer: ['N', 'E', 'A', 'T', 'R', 'S'] },
    { center: 'O', outer: ['R', 'T', 'N', 'S', 'E', 'A'] },
    { center: 'T', outer: ['R', 'E', 'A', 'S', 'I', 'N'] },
    { center: 'S', outer: ['T', 'E', 'A', 'R', 'N', 'I'] },
    { center: 'R', outer: ['E', 'A', 'T', 'I', 'N', 'S'] },
    { center: 'N', outer: ['E', 'A', 'T', 'R', 'I', 'S'] },
    { center: 'L', outer: ['E', 'A', 'T', 'R', 'I', 'S'] },
    { center: 'D', outer: ['E', 'A', 'R', 'I', 'N', 'S'] },
    { center: 'C', outer: ['A', 'R', 'E', 'T', 'S', 'I'] },
    { center: 'P', outer: ['A', 'R', 'E', 'T', 'S', 'I'] },
    { center: 'M', outer: ['A', 'R', 'E', 'T', 'I', 'S'] },
    { center: 'B', outer: ['A', 'R', 'E', 'T', 'I', 'S'] },
    { center: 'H', outer: ['A', 'R', 'E', 'T', 'I', 'S'] },
    { center: 'G', outer: ['A', 'R', 'E', 'T', 'I', 'N'] },
    { center: 'F', outer: ['A', 'R', 'E', 'T', 'I', 'S'] },
    { center: 'E', outer: ['L', 'A', 'T', 'S', 'N', 'I'] },
    { center: 'A', outer: ['L', 'E', 'T', 'S', 'N', 'D'] },
    { center: 'I', outer: ['N', 'E', 'A', 'L', 'R', 'S'] },
    { center: 'O', outer: ['R', 'T', 'N', 'L', 'E', 'A'] },
    { center: 'T', outer: ['R', 'E', 'A', 'L', 'I', 'N'] },
    { center: 'S', outer: ['T', 'E', 'A', 'L', 'N', 'I'] },
    { center: 'R', outer: ['E', 'A', 'T', 'I', 'N', 'L'] },
    { center: 'N', outer: ['E', 'A', 'T', 'R', 'I', 'L'] },
    { center: 'L', outer: ['E', 'A', 'T', 'R', 'I', 'N'] },
    { center: 'D', outer: ['E', 'A', 'R', 'I', 'N', 'L'] },
    { center: 'C', outer: ['A', 'R', 'E', 'T', 'L', 'I'] },
    { center: 'P', outer: ['A', 'R', 'E', 'T', 'L', 'I'] },
    { center: 'M', outer: ['A', 'R', 'E', 'T', 'I', 'L'] }
  ];
  
  // Pick a puzzle based on the day
  const puzzleIndex = seed % goodPuzzles.length;
  return goodPuzzles[puzzleIndex];
}

function getRank(score, maxScore) {
  if (!maxScore) return { n: 'Loading...', e: '' };
  const pct = (score / maxScore) * 100;
  if (pct === 0) return { n: 'Beginner', e: '🐣' };
  if (pct < 5) return { n: 'Good Start', e: '🌱' };
  if (pct < 15) return { n: 'Moving Up', e: '🌿' };
  if (pct < 25) return { n: 'Good', e: '⭐' };
  if (pct < 40) return { n: 'Solid', e: '⭐⭐' };
  if (pct < 50) return { n: 'Nice', e: '💫' };
  if (pct < 70) return { n: 'Great', e: '🌟' };
  if (pct < 85) return { n: 'Amazing', e: '✨' };
  if (pct < 100) return { n: 'Genius', e: '🏆' };
  return { n: 'Queen Bee', e: '👑🐝' };
}

async function getDefinition(word) {
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    if (r.ok) {
      const data = await r.json();
      return data[0]?.meanings[0]?.definitions[0]?.definition || 'Definition not found';
    }
  } catch (e) {}
  return 'Definition not available';
}

function shareScore(score, maxScore, foundWords, validWords, currentStreak) {
  const pct = Math.round((score / maxScore) * 100);
  const rank = getRank(score, maxScore);
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  const txt = `🐝 Word Hive - Daily Word Puzzle
${date}

${rank.e} ${rank.n}
${foundWords.length} words found (${pct}% complete)${currentStreak > 1 ? `
🔥 ${currentStreak} day streak!` : ''}

Can you beat my score?
https://wordhivepuzzle.com`;
  
  if (navigator.share) {
    navigator.share({ title: 'My Word Hive Score', text: txt });
  } else {
    navigator.clipboard.writeText(txt);
    alert('Score copied!');
  }
}

window.getDailyPuzzle = getDailyPuzzle;
window.getRank = getRank;
window.getDefinition = getDefinition;
window.shareScore = shareScore;