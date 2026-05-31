// ===== City Glide: 3-Lane Rush — Managers =====
import { SaveData } from './types';

const SAVE_KEY = 'cityglide_save_v1';

function defaultSave(): SaveData {
  return {
    totalCoins: 0,
    highScores: {},
    endlessHighScore: 0,
    unlockedLevels: [1],
    completedLevels: {},
    ownedSkins: ['cyan', 'orange'],
    selectedSkin: 'cyan',
    ownedThemes: ['city', 'desert', 'snow', 'neon'],
    selectedTheme: 'city',
    settings: { sound: true, music: true, vibration: true, colorBlind: false, language: 'en' as const },
    dailyRewardLastClaim: '',
    dailyRewardStreak: 0,
    dailyChallenges: {
      date: '',
      challenges: [],
    },
    weeklyChallenges: {
      weekId: getWeekId(),
      coinsCollected: 0,
      levelsCompleted: 0,
      distanceRun: 0,
    },
    achievements: [],
    totalGamesPlayed: 0,
    totalDistanceRun: 0,
    totalCoinsEarned: 0,
    removeAdsPurchased: false,
    skinPackPurchased: false,
    tutorialSeen: false,
  };
}

function getWeekId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as SaveData;
      // Migration: fill missing fields
      const def = defaultSave();
      return { ...def, ...data, settings: { ...def.settings, ...(data.settings || {}) } };
    }
  } catch { /* ignore */ }
  return defaultSave();
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function resetSave(): SaveData {
  const data = defaultSave();
  saveSave(data);
  return data;
}

export function addCoins(save: SaveData, amount: number): SaveData {
  save.totalCoins += amount;
  save.totalCoinsEarned += amount;
  const weekId = getWeekId();
  if (save.weeklyChallenges.weekId !== weekId) {
    save.weeklyChallenges = { weekId, coinsCollected: 0, levelsCompleted: 0, distanceRun: 0 };
  }
  save.weeklyChallenges.coinsCollected += amount;
  return save;
}

export function completeLevel(save: SaveData, levelId: number, score: number, coins: number, hits: number): SaveData {
  const stars = hits === 0 ? 3 : hits <= 1 ? 2 : 1;
  const prev = save.completedLevels[levelId];
  save.completedLevels[levelId] = {
    stars: Math.max(stars, prev?.stars || 0),
    bestScore: Math.max(score, prev?.bestScore || 0),
    bestCoins: Math.max(coins, prev?.bestCoins || 0),
  };
  if (!save.unlockedLevels.includes(levelId + 1) && levelId < 60) {
    save.unlockedLevels.push(levelId + 1);
  }
  const weekId = getWeekId();
  if (save.weeklyChallenges.weekId !== weekId) {
    save.weeklyChallenges = { weekId, coinsCollected: 0, levelsCompleted: 0, distanceRun: 0 };
  }
  save.weeklyChallenges.levelsCompleted += 1;
  return save;
}

// ---- AUDIO MANAGER (Procedural Web Audio) ----
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', vol: number = 0.15) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export const Audio = {
  enabled: true,

  coin() {
    if (!this.enabled) return;
    playTone(880, 0.08, 'square', 0.1);
    setTimeout(() => playTone(1320, 0.1, 'square', 0.08), 50);
  },

  jump() {
    if (!this.enabled) return;
    playTone(400, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(600, 0.1, 'sine', 0.08), 50);
  },

  hit() {
    if (!this.enabled) return;
    playTone(150, 0.2, 'sawtooth', 0.15);
    playTone(100, 0.3, 'square', 0.1);
  },

  powerUp() {
    if (!this.enabled) return;
    playTone(523, 0.08, 'square', 0.1);
    setTimeout(() => playTone(659, 0.08, 'square', 0.1), 80);
    setTimeout(() => playTone(784, 0.12, 'square', 0.1), 160);
  },

  gameOver() {
    if (!this.enabled) return;
    playTone(400, 0.15, 'sawtooth', 0.12);
    setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.12), 150);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.12), 300);
  },

  levelComplete() {
    if (!this.enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.15, 'square', 0.1), i * 120);
    });
  },

  laneSwitch() {
    if (!this.enabled) return;
    playTone(500, 0.04, 'sine', 0.06);
  },

  buttonClick() {
    if (!this.enabled) return;
    playTone(600, 0.03, 'sine', 0.05);
  },
};

// ---- HAPTIC ----
export function vibrate(pattern: number | number[]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* ignore */ }
}
