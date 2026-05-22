const { useState, useEffect, useMemo } = React;

function SpellingBeeGame() {
  const [wordList, setWordList] = useState([]);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [lastSubmitFailed, setLastSubmitFailed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [dailyPuzzle, setDailyPuzzle] = useState(null);
  const [newAchievement, setNewAchievement] = useState(null);
  
  // Achievement definitions - simpler structure
  const achievements = [
    { id: 'start', emoji: '🌱', name: 'Good Start', wordsRequired: 5 },
    { id: 'nice', emoji: '⭐', name: 'Nice!', wordsRequired: 10 },
    { id: 'great', emoji: '🎯', name: 'Great!', wordsRequired: 20 },
    { id: 'fire', emoji: '🔥', name: 'On Fire!', wordsRequired: 30 },
    { id: 'amazing', emoji: '✨', name: 'Amazing', wordsRequired: 50 },
    { id: 'strong', emoji: '💪', name: 'Strong', wordsRequired: 75 },
    { id: 'century', emoji: '💎', name: 'Century', wordsRequired: 100 },
    { id: 'queen', emoji: '👑', name: 'Queen Bee', wordsRequired: -1 } // -1 means 100%
  ];
  
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('spellingBeeStats');
    return saved ? JSON.parse(saved) : {
      totalWords: 0,
      totalPangrams: 0,
      totalPoints: 0,
      gamesPlayed: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayed: null
    };
  });

  const [dailyAchievements, setDailyAchievements] = useState(() => {
    const saved = localStorage.getItem('dailyAchievements');
    if (saved) {
      const data = JSON.parse(saved);
      const today = new Date().toDateString();
      if (data.date === today) {
        return data.unlocked || [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('spellingBeeStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('dailyAchievements', JSON.stringify({
      date: today,
      unlocked: dailyAchievements
    }));
  }, [dailyAchievements]);
  
  useEffect(() => {
    fetch('words.txt')
      .then(r => r.text())
      .then(t => {
        const w = t.split('\n').map(x => x.trim().toUpperCase()).filter(x => x.length >= 4);
        setWordList(w);
        window.wordListForValidation = w;
        const puzzle = window.getDailyPuzzle();
        setDailyPuzzle(puzzle);
        setIsLoadingWords(false);
      });
  }, []);
  
  const [centerLetter, setCenterLetter] = useState('A');
  const [outerLetters, setOuterLetters] = useState(['B', 'C', 'D', 'E', 'F', 'G']);
  const [currentWord, setCurrentWord] = useState('');
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);
  const allLetters = [centerLetter, ...outerLetters];

  // Update puzzle letters once daily puzzle is loaded
  useEffect(() => {
    if (dailyPuzzle) {
      setCenterLetter(dailyPuzzle.center);
      setOuterLetters(dailyPuzzle.outer);
    }
  }, [dailyPuzzle]);

  // Load today's progress from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedProgress = localStorage.getItem('dailyProgress');
    
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      
      // If it's the same day, restore progress
      if (progress.date === today) {
        setFoundWords(progress.foundWords || []);
        setScore(progress.score || 0);
      } else {
        // New day - clear old progress
        localStorage.removeItem('dailyProgress');
        setDailyAchievements([]);
      }
    }
  }, []);

  // Save today's progress to localStorage whenever it changes
  useEffect(() => {
    const today = new Date().toDateString();
    const progress = {
      date: today,
      foundWords: foundWords,
      score: score
    };
    localStorage.setItem('dailyProgress', JSON.stringify(progress));
  }, [foundWords, score]);

  // Check for new achievements when words change
  useEffect(() => {
    if (foundWords.length === 0 || validWords.length === 0) return;
    
    const wordsFound = foundWords.length;
    const isComplete = wordsFound === validWords.length;
    
    achievements.forEach(ach => {
      // Check if already unlocked today
      if (dailyAchievements.includes(ach.id)) return;
      
      // Check if requirement met
      let requirementMet = false;
      if (ach.wordsRequired === -1) {
        requirementMet = isComplete;
      } else {
        requirementMet = wordsFound >= ach.wordsRequired;
      }
      
      if (requirementMet) {
        // Unlock achievement!
        setDailyAchievements(prev => [...prev, ach.id]);
        setNewAchievement(ach);
        setTimeout(() => setNewAchievement(null), 3000);
        if (window.playCrowdCheer) window.playCrowdCheer();
      }
    });
  }, [foundWords, validWords, dailyAchievements]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (stats.lastPlayed !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toDateString();
      if (stats.lastPlayed === yStr) {
        setStats(p => ({
          ...p,
          currentStreak: p.currentStreak + 1,
          longestStreak: Math.max(p.longestStreak, p.currentStreak + 1),
          lastPlayed: today,
          gamesPlayed: p.gamesPlayed + 1
        }));
      } else {
        setStats(p => ({
          ...p,
          currentStreak: 1,
          lastPlayed: today,
          gamesPlayed: p.gamesPlayed + 1,
          longestStreak: stats.lastPlayed ? p.longestStreak : 1
        }));
      }
    }
  }, []);

  const validWords = useMemo(() => {
    if (!wordList.length) return [];
    const words = wordList.filter(w => 
      w.length >= 4 && 
      w.includes(centerLetter) && 
      w.split('').every(l => allLetters.includes(l))
    );
    window.validWords = words;
    return words;
  }, [wordList, centerLetter, allLetters]);

  const maxScore = useMemo(() => {
    return validWords.reduce((s, w) => {
      let p = w.length === 4 ? 1 : w.length;
      if (allLetters.every(l => w.includes(l))) p += 7;
      return s + p;
    }, 0);
  }, [validWords, allLetters]);

  const twoLetterHints = useMemo(() => {
    const g = {};
    validWords.forEach(w => {
      const t = w.substring(0, 2);
      const l = w.length;
      if (!g[t]) g[t] = {};
      g[t][l] = (g[t][l] || 0) + 1;
    });
    return g;
  }, [validWords]);

  // Calculate found vs total for each cell
  const twoLetterProgress = useMemo(() => {
    const progress = {};
    
    // Initialize with total counts
    Object.keys(twoLetterHints).forEach(prefix => {
      progress[prefix] = {};
      Object.keys(twoLetterHints[prefix]).forEach(len => {
        progress[prefix][len] = {
          found: 0,
          total: twoLetterHints[prefix][len]
        };
      });
    });
    
    // Count found words
    foundWords.forEach(word => {
      const prefix = word.substring(0, 2);
      const len = word.length;
      if (progress[prefix] && progress[prefix][len]) {
        progress[prefix][len].found++;
      }
    });
    
    return progress;
  }, [twoLetterHints, foundWords]);

  const celebrate = (msg, isMilestone = false) => {
    setCelebrationMsg(msg);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2500);
    if (isMilestone && window.playCrowdCheer) window.playCrowdCheer();
  };

  useEffect(() => {
    const h = (e) => {
      const k = e.key.toUpperCase();
      if (k === 'ENTER') handleSubmit();
      else if (k === 'BACKSPACE' || k === 'DELETE') handleDelete();
      else if (k === ' ') setOuterLetters([...outerLetters].sort(() => Math.random() - 0.5));
      else if (/^[A-Z]$/.test(k)) {
        setCurrentWord(p => p + k);
        setMessage('');
        setLastSubmitFailed(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const handleSubmit = () => {
    const w = currentWord.toUpperCase();
    if (w.length < 4) {
      setMessage('✗ Too short');
      setCurrentWord('');
      setLastSubmitFailed(true);
      return;
    }
    if (!w.includes(centerLetter)) {
      setMessage('✗ Must use center');
      setCurrentWord('');
      setLastSubmitFailed(true);
      return;
    }
    if (foundWords.includes(w)) {
      setMessage('✗ Already found');
      setCurrentWord('');
      setLastSubmitFailed(true);
      return;
    }
    if (w.split('').some(l => !allLetters.includes(l))) {
      setMessage('✗ Invalid letters');
      setCurrentWord('');
      setLastSubmitFailed(true);
      return;
    }
    if (validWords.includes(w)) {
      let p = w.length === 4 ? 1 : w.length;
      const isPan = allLetters.every(l => w.includes(l));
      if (isPan) p += 7;
      const newF = [...foundWords, w];
      const newS = score + p;
      setFoundWords(newF);
      setScore(newS);
      setMessage(isPan ? `🎉 Pangram! +${p}pts` : `✓ Good! +${p}pts`);
      if (window.playSuccessSound) window.playSuccessSound(w.length);
      setCurrentWord('');
      setLastSubmitFailed(false);
      setStats(s => ({
        ...s,
        totalWords: s.totalWords + 1,
        totalPangrams: isPan ? s.totalPangrams + 1 : s.totalPangrams,
        totalPoints: s.totalPoints + p
      }));
      if (isPan) celebrate('🎉✨ PANGRAM! ✨🎉');
    } else {
      setMessage('✗ Not in list');
      setCurrentWord('');
      setLastSubmitFailed(true);
    }
  };

  const handleDelete = () => {
    setCurrentWord(p => p.slice(0, -1));
    setMessage('');
    setLastSubmitFailed(false);
  };

  const handleWordClick = async (word) => {
    const def = await window.getDefinition(word);
    setSelectedWord({ word, definition: def });
  };

  const getCellColor = (found, total) => {
    if (total === 0) return 'bg-gray-100';
    if (found === 0) return 'bg-red-100';
    if (found === total) return 'bg-green-100';
    return 'bg-yellow-100';
  };

  const hex = (l, isC, onClick) => React.createElement('button', {
    onClick: () => onClick(l),
    className: `${isC ? 'bg-teal-400 hover:bg-teal-500' : 'bg-gray-200 hover:bg-gray-300'} text-2xl font-bold text-gray-800 flex items-center justify-center transition-all word-spin`,
    style: {
      width: '70px',
      height: '70px',
      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
    }
  }, l);

  if (isLoadingWords) {
    return React.createElement('div', {
      className: 'h-full bg-gradient-to-br from-teal-50 to-cyan-100 p-4 flex items-center justify-center'
    },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'text-4xl font-bold text-gray-800 mb-4' }, 'Loading...'),
        React.createElement('div', { className: 'text-gray-700' }, 'Loading dictionary...')
      )
    );
  }

  const r = window.getRank(score, maxScore);
  const allLen = Array.from(new Set(validWords.map(w => w.length))).sort((a, b) => a - b);

  // Calculate progress with 100-word cap
  const totalWordsForProgress = validWords.length;
  const progressCap = Math.min(100, totalWordsForProgress);
  const displayTotal = totalWordsForProgress > 100 ? `100+` : totalWordsForProgress;
  const progressPercent = Math.min(100, (foundWords.length / progressCap) * 100);
  
  // Special badges for 100+ word puzzles
  const isBeyond100 = totalWordsForProgress > 100 && foundWords.length >= 100;
  const isWordMaster = totalWordsForProgress > 100 && foundWords.length === totalWordsForProgress;

  return React.createElement('div', {
    className: 'h-full bg-gradient-to-br from-teal-50 to-cyan-100 p-4 flex flex-col items-center relative overflow-y-auto'
  },
    React.createElement('style', null, `
      @keyframes fadeOut { 0%, 70% { opacity: 1; } 100% { opacity: 0; } } 
      @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      @keyframes wordSpin { 0% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.3) rotate(180deg); } 100% { transform: scale(1) rotate(360deg); } }
      .word-spin:active { animation: wordSpin 0.4s ease-out; }
      
      /* Smoother scrolling for hints table */
      .hints-table-container {
        position: relative;
        overflow-x: auto;
        overflow-y: auto;
        overscroll-behavior: none;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
      
      /* Make table fill container properly */
      .hints-table {
        width: max-content;
        min-width: 100%;
      }
      
      /* Sticky Start column (horizontal scroll) */
      .hints-table th:first-child,
      .hints-table td:first-child {
        position: sticky;
        left: 0;
        z-index: 20;
        background: white;
        box-shadow: 2px 0 4px rgba(0,0,0,0.05);
      }
      
      /* Sticky header row (vertical scroll) */
      .hints-table thead th {
        position: sticky;
        top: 0;
        z-index: 10;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      
      /* Start cell is sticky both ways */
      .hints-table thead th:first-child {
        z-index: 30;
      }
    `),
    
    showCelebration && React.createElement('div', {
      className: 'fixed inset-0 pointer-events-none flex items-center justify-center z-50',
      style: { animation: 'fadeOut 2.5s forwards' }
    },
      React.createElement('div', {
        className: 'bg-teal-400 text-gray-800 px-8 py-6 rounded-lg shadow-2xl text-center',
        style: { animation: 'bounce 0.5s' }
      },
        React.createElement('div', { className: 'text-4xl font-bold' }, celebrationMsg)
      )
    ),

    newAchievement && React.createElement('div', {
      className: 'fixed inset-0 pointer-events-none flex items-center justify-center z-50',
      style: { animation: 'fadeOut 3s forwards' }
    },
      React.createElement('div', {
        className: 'bg-white border-4 border-teal-400 text-gray-800 px-8 py-6 rounded-lg shadow-2xl text-center',
        style: { animation: 'bounce 0.5s' }
      },
        React.createElement('div', { className: 'text-sm font-medium text-teal-600 mb-2' }, '🎉 ACHIEVEMENT UNLOCKED!'),
        React.createElement('div', { className: 'text-5xl mb-2' }, newAchievement.emoji),
        React.createElement('div', { className: 'text-2xl font-bold' }, newAchievement.name),
        React.createElement('div', { className: 'text-sm text-gray-600 mt-2' }, 
          newAchievement.wordsRequired === -1 ? 'All words found!' : `${foundWords.length} words found!`
        )
      )
    ),
    
    selectedWord && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      onClick: () => setSelectedWord(null)
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg p-6 max-w-md mx-4',
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('h3', { className: 'text-2xl font-bold text-gray-800 mb-2' }, selectedWord.word),
        React.createElement('p', { className: 'text-gray-700 mb-4' }, selectedWord.definition),
        React.createElement('button', {
          onClick: () => setSelectedWord(null),
          className: 'px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg'
        }, 'Close')
      )
    ),

    showAchievements && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
      onClick: () => setShowAchievements(false)
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg p-6 max-w-md w-full mx-4',
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('h3', { className: 'text-2xl font-bold text-gray-800 mb-4 text-center' }, '🏆 Today\'s Achievements'),
        React.createElement('div', { className: 'grid grid-cols-4 gap-4 mb-4' },
          ...achievements.map(ach => {
            const isUnlocked = dailyAchievements.includes(ach.id);
            const requirement = ach.wordsRequired === -1 ? 
              `${validWords.length} words` : 
              `${ach.wordsRequired} words`;
            
            return React.createElement('div', {
              key: ach.id,
              className: 'text-center'
            },
              React.createElement('div', { 
                className: `text-4xl mb-1 ${isUnlocked ? '' : 'opacity-30'}`
              }, isUnlocked ? ach.emoji : '❓'),
              React.createElement('div', { 
                className: `text-xs font-medium ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`
              }, isUnlocked ? ach.name : '???'),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, 
                isUnlocked ? '✓' : requirement
              )
            );
          })
        ),
        React.createElement('div', { className: 'text-center text-sm text-gray-600 border-t pt-4' },
          `${dailyAchievements.length} of ${achievements.length} unlocked`
        ),
        React.createElement('button', {
          onClick: () => setShowAchievements(false),
          className: 'mt-4 w-full px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium'
        }, 'Close')
      )
    ),
    
    React.createElement('div', { className: 'max-w-2xl w-full' },
      React.createElement('div', { className: 'text-center mb-2' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-800 mb-1' }, '🐝 Word Hive'),
        React.createElement('p', { className: 'text-sm text-gray-600' }, 
          `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${stats.currentStreak > 0 ? ` • 🔥 ${stats.currentStreak} day streak` : ''}`
        )
      ),
      
      React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-3 mb-3' },
        React.createElement('div', { className: 'flex justify-between items-center mb-2' },
          React.createElement('div', null,
            React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, `${score}/${maxScore} pts`)
          ),
          React.createElement('div', { className: 'text-right' },
            React.createElement('div', { className: 'text-sm text-gray-700 flex items-center justify-end gap-1' }, 
              'Words',
              isWordMaster && React.createElement('span', { className: 'text-xs', title: 'Word Master!' }, '🌟'),
              isBeyond100 && !isWordMaster && React.createElement('span', { className: 'text-xs', title: 'Beyond 100!' }, '⚡')
            ),
            React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, 
              totalWordsForProgress > 100 ? `${foundWords.length}/${displayTotal}` : `${foundWords.length}/${validWords.length}`
            )
          )
        ),
        React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2 mb-2' },
          React.createElement('div', {
            className: 'bg-teal-500 h-2 rounded-full transition-all duration-500',
            style: { width: `${progressPercent}%` }
          })
        ),
        React.createElement('div', { 
          className: 'flex items-center gap-1 cursor-pointer hover:text-teal-600 text-sm text-gray-700',
          onClick: () => setShowAchievements(true)
        },
          dailyAchievements.length > 0 ? React.createElement('span', null,
            dailyAchievements.slice(0, 5).map(id => {
              const ach = achievements.find(a => a.id === id);
              return ach ? ach.emoji : '';
            }).join(' ')
          ) : React.createElement('span', null, '🏆'),
          React.createElement('span', { className: 'font-medium' }, 
            ` ${dailyAchievements.length}/${achievements.length} achievements`
          )
        )
      ),
      
      React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-3 mb-3' },
        React.createElement('div', { className: 'text-center mb-2' },
          React.createElement('div', { className: 'text-2xl font-bold min-h-[2.5rem] flex items-center justify-center' },
            !currentWord ? React.createElement('span', { className: 'text-gray-300' }, 'Type or tap') :
            currentWord.split('').map((l, i) =>
              React.createElement('span', {
                key: i,
                className: allLetters.includes(l.toUpperCase()) ? 'text-gray-800' : 'text-red-500'
              }, l)
            )
          ),
          React.createElement('div', {
            className: `mt-1 text-sm font-medium min-h-[1.25rem] ${message.includes('✓') || message.includes('🎉') ? 'text-green-600' : 'text-red-600'}`
          }, message || '\u00A0')
        ),
        
        React.createElement('div', { className: 'flex justify-center mb-3' },
          React.createElement('div', { className: 'relative', style: { width: '240px', height: '240px' } },
            React.createElement('div', {
              className: 'absolute',
              style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            }, hex(centerLetter, true, l => {
              setCurrentWord(p => p + l);
              setMessage('');
              setLastSubmitFailed(false);
            })),
            
            ...outerLetters.map((l, i) => {
              const ang = (i * 60 - 90) * (Math.PI / 180);
              const rad = 80;
              const x = Math.cos(ang) * rad;
              const y = Math.sin(ang) * rad;
              return React.createElement('div', {
                key: i,
                className: 'absolute',
                style: {
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                }
              }, hex(l, false, l => {
                setCurrentWord(p => p + l);
                setMessage('');
                setLastSubmitFailed(false);
              }));
            })
          )
        ),
        
        React.createElement('div', { className: 'flex gap-2 justify-center flex-wrap' },
          React.createElement('button', {
            onClick: handleDelete,
            className: 'px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-800'
          }, 'Delete'),
          React.createElement('button', {
            onClick: () => setOuterLetters([...outerLetters].sort(() => Math.random() - 0.5)),
            className: 'px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium'
          }, '🔀'),
          React.createElement('button', {
            onClick: () => {
              setCurrentWord('');
              setMessage('');
              setLastSubmitFailed(false);
            },
            className: 'px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-800'
          }, '↺'),
          React.createElement('button', {
            onClick: handleSubmit,
            className: 'px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium'
          }, 'Enter')
        )
      ),

      React.createElement('div', { className: 'flex gap-2 mb-4' },
        React.createElement('button', {
          onClick: () => setShowHints(!showHints),
          className: 'flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium'
        }, showHints ? 'Hide' : '💡 Hints'),
        React.createElement('button', {
          onClick: () => setShowStats(!showStats),
          className: 'flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium'
        }, showStats ? 'Hide' : '📊 Stats'),
        React.createElement('button', {
          onClick: () => window.shareScore(score, maxScore, foundWords, validWords, stats.currentStreak),
          className: 'flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium'
        }, '🔗 Share')
      ),

      showStats && React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-4 mb-4' },
        React.createElement('h3', { className: 'font-bold text-gray-800 mb-3' }, '📊 Statistics'),
        React.createElement('div', { className: 'grid grid-cols-3 gap-3' },
          React.createElement('div', { className: 'text-center p-3 bg-teal-50 rounded' },
            React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, stats.gamesPlayed),
            React.createElement('div', { className: 'text-xs text-gray-700' }, 'Games')
          ),
          React.createElement('div', { className: 'text-center p-3 bg-teal-50 rounded' },
            React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, stats.currentStreak),
            React.createElement('div', { className: 'text-xs text-gray-700' }, 'Streak')
          ),
          React.createElement('div', { className: 'text-center p-3 bg-teal-50 rounded' },
            React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, stats.longestStreak),
            React.createElement('div', { className: 'text-xs text-gray-700' }, 'Best')
          ),
          React.createElement('div', { className: 'text-center p-3 bg-teal-50 rounded' },
            React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, stats.totalWords),
            React.createElement('div', { className: 'text-xs text-gray-700' }, 'Words')
          ),
          React.createElement('div', { className: 'text-center p-3 bg-teal-50 rounded' },
            React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, stats.totalPangrams),
            React.createElement('div', { className: 'text-xs text-gray-700' }, 'Pangrams')
          ),
          React.createElement('div', { className: 'text-center p-3 bg-teal-50 rounded' },
            React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, stats.totalPoints.toLocaleString()),
            React.createElement('div', { className: 'text-xs text-gray-700' }, 'Points')
          )
        )
      ),

      showHints && React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-4 mb-4' },
        React.createElement('h3', { className: 'font-bold text-gray-800 mb-3' }, 'Two-Letter Starts'),
        React.createElement('div', { className: 'mb-3 text-xs text-gray-600' },
          React.createElement('span', { className: 'inline-block px-2 py-1 bg-green-100 rounded mr-2' }, '🟢 Complete'),
          React.createElement('span', { className: 'inline-block px-2 py-1 bg-yellow-100 rounded mr-2' }, '🟡 Partial'),
          React.createElement('span', { className: 'inline-block px-2 py-1 bg-red-100 rounded mr-2' }, '🔴 None'),
          React.createElement('span', { className: 'inline-block px-2 py-1 bg-gray-100 rounded' }, '⚪ N/A')
        ),
        React.createElement('div', { className: 'hints-table-container max-h-96' },
          React.createElement('table', { className: 'hints-table text-sm border-collapse' },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', { className: 'text-left p-2 text-gray-800 min-w-[3rem] border-b border-r' }, 'Start'),
                ...allLen.map(len =>
                  React.createElement('th', { key: len, className: 'text-center p-2 text-gray-800 min-w-[3.5rem] border-b' }, len)
                ),
                React.createElement('th', { className: 'text-center p-2 text-gray-800 min-w-[3.5rem] border-b border-l' }, 'Σ')
              )
            ),
            React.createElement('tbody', null,
              ...Object.keys(twoLetterHints).sort().map(t => {
                const c = twoLetterHints[t];
                const prog = twoLetterProgress[t] || {};
                const totalFound = Object.keys(prog).reduce((sum, len) => sum + (prog[len]?.found || 0), 0);
                const totalWords = Object.values(c).reduce((s, n) => s + n, 0);
                
                return React.createElement('tr', { key: t, className: 'border-b' },
                  React.createElement('td', { className: 'p-2 font-bold text-gray-800 border-r' }, t),
                  ...allLen.map(len => {
                    const total = c[len] || 0;
                    const found = prog[len]?.found || 0;
                    const bgColor = getCellColor(found, total);
                    
                    return React.createElement('td', { 
                      key: len, 
                      className: `text-center p-2 text-gray-700 ${bgColor}`
                    }, total > 0 ? `${found}/${total}` : '-');
                  }),
                  React.createElement('td', { 
                    className: `text-center p-2 font-bold text-gray-800 ${getCellColor(totalFound, totalWords)} border-l`
                  }, `${totalFound}/${totalWords}`)
                );
              })
            )
          )
        )
      ),
      
      foundWords.length > 0 && React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-4 mb-6' },
        React.createElement('h3', { className: 'font-bold text-gray-800 mb-2' }, 'Your words (click for definition):'),
        React.createElement('div', { className: 'flex flex-wrap gap-2' },
          ...foundWords.map((w, i) => {
            const isPan = allLetters.every(l => w.includes(l));
            return React.createElement('span', {
              key: i,
              onClick: () => handleWordClick(w),
              className: `px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 ${isPan ? 'bg-teal-200 font-bold' : 'bg-teal-100'} text-gray-800`
            }, w);
          })
        )
      ),

      React.createElement('div', { className: 'bg-gray-50 rounded-lg p-6 mt-4 mb-8 border-t-2 border-gray-200' },
        React.createElement('h3', { className: 'text-lg font-bold text-gray-800 mb-4 text-center' }, '🎯 How to Play'),
        React.createElement('div', { className: 'space-y-2 text-sm text-gray-700' },
          React.createElement('p', null, '🔤 Create words from the hexagon letters'),
          React.createElement('p', null, '🎯 Every word must use the center letter (teal)'),
          React.createElement('p', null, '📏 Minimum 4 letters'),
          React.createElement('p', null, '🔢 4-letter words = 1 point, 5+ letters = length in points'),
          React.createElement('p', null, '⭐ Pangrams use all 7 letters and earn +7 bonus points'),
          React.createElement('p', null, '📅 New puzzle every day at midnight')
        ),
        React.createElement('div', { className: 'text-center mt-6 text-xs text-gray-500' }, '🐝 Word Hive')
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(SpellingBeeGame));