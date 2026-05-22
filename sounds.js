// Sound Effects Module - Ultra-Aggressive Mobile Fix

let audioContext = null;
let isAudioUnlocked = false;
let unlockAttempts = 0;

function getAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[Audio] Context created, state:', audioContext.state);
    } catch (e) {
      console.error('[Audio] Failed to create context:', e);
    }
  }
  return audioContext;
}

// ULTRA-AGGRESSIVE unlock - play actual sound immediately on touch
function unlockAudio() {
  if (isAudioUnlocked) return;
  
  unlockAttempts++;
  console.log('[Audio] Unlock attempt #', unlockAttempts);
  
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Method 1: Play silent buffer (iOS requirement)
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    
    // Method 2: Also create oscillator (belt and suspenders)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0; // Silent
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.01);
    
    // Method 3: Resume if suspended (critical for iOS)
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log('[Audio] Context resumed successfully!');
        isAudioUnlocked = true;
      }).catch(e => {
        console.error('[Audio] Resume failed:', e);
      });
    } else if (ctx.state === 'running') {
      console.log('[Audio] Context already running!');
      isAudioUnlocked = true;
    }
    
    // Check again after short delay (iOS needs this)
    setTimeout(() => {
      if (ctx.state === 'running') {
        isAudioUnlocked = true;
        console.log('[Audio] ✅ UNLOCKED successfully!');
      } else {
        console.log('[Audio] ⚠️ Still locked, state:', ctx.state);
      }
    }, 100);
    
  } catch (e) {
    console.error('[Audio] Unlock error:', e);
  }
}

// Setup with EVERY possible event
function setupAudioUnlock() {
  console.log('[Audio] Setting up unlock listeners...');
  
  // ALL touch events (iOS)
  const touchEvents = ['touchstart', 'touchend', 'touchmove'];
  // ALL mouse events (desktop/Android)
  const mouseEvents = ['mousedown', 'mouseup', 'click'];
  // ALL pointer events (modern devices)
  const pointerEvents = ['pointerdown', 'pointerup'];
  // Keyboard
  const keyboardEvents = ['keydown'];
  
  const allEvents = [...touchEvents, ...mouseEvents, ...pointerEvents, ...keyboardEvents];
  
  allEvents.forEach(eventType => {
    document.addEventListener(eventType, function unlockHandler() {
      unlockAudio();
      // Keep trying until successful (don't remove listener yet)
      if (isAudioUnlocked && unlockAttempts > 2) {
        document.removeEventListener(eventType, unlockHandler);
      }
    }, { capture: true, passive: true });
  });
  
  // Also try when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !isAudioUnlocked) {
      unlockAudio();
    }
  });
  
  // Try immediately (might work on some browsers)
  unlockAudio();
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAudioUnlock);
} else {
  setupAudioUnlock();
}

function playSuccessSound(wordLength) {
  try {
    const ctx = getAudioContext();
    if (!ctx) {
      console.warn('[Audio] No context available');
      return;
    }
    
    // Always try to unlock first
    if (!isAudioUnlocked) {
      unlockAudio();
    }
    
    // Force resume if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Only play if running
    if (ctx.state !== 'running') {
      console.warn('[Audio] Context not running, state:', ctx.state);
      return;
    }
    
    const baseFreq = 400 + (wordLength * 30);
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = baseFreq;
    oscillator.type = 'sine';
    
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
    
    console.log('[Audio] ✅ Played success sound');
  } catch (e) {
    console.error('[Audio] ❌ Sound error:', e);
  }
}

function playCrowdCheer() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (!isAudioUnlocked) {
      unlockAudio();
    }
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    if (ctx.state !== 'running') {
      console.warn('[Audio] Context not running for cheer');
      return;
    }
    
    const now = ctx.currentTime;
    
    for (let i = 0; i < 5; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 300 + Math.random() * 400;
      oscillator.type = 'sawtooth';
      
      const startTime = now + i * 0.1;
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    }
    
    console.log('[Audio] ✅ Played cheer sound');
  } catch (e) {
    console.error('[Audio] ❌ Cheer error:', e);
  }
}

window.playSuccessSound = playSuccessSound;
window.playCrowdCheer = playCrowdCheer;

// Debug helper
window.debugAudio = () => {
  const ctx = getAudioContext();
  console.log('=== AUDIO DEBUG ===');
  console.log('Context state:', ctx?.state);
  console.log('Is unlocked:', isAudioUnlocked);
  console.log('Unlock attempts:', unlockAttempts);
  console.log('==================');
  return {
    state: ctx?.state,
    unlocked: isAudioUnlocked,
    attempts: unlockAttempts
  };
};

console.log('[Audio] Module loaded - tap anywhere to unlock audio');