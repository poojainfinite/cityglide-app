// ===== City Glide: 3-Lane Rush V2.0 — Type Definitions =====

export type ThemeName = 'city' | 'desert' | 'snow' | 'neon';
export type GameMode = 'level' | 'endless';
export type PowerUpType = 'magnet' | 'shield' | 'doubleCoins' | 'speedBurst';
export type ObstacleType = 'barrier' | 'cone' | 'car' | 'gap';
export type Screen = 'home' | 'levelSelect' | 'game' | 'gameOver' | 'shop' | 'settings' | 'dailyRewards' | 'legal';
export type Language = 'en' | 'hi';

export interface Theme {
  name: ThemeName;
  label: string;
  bgGradient: [string, string];
  roadColor: string;
  roadEdge: string;
  laneMarking: string;
  sideDecor: string;
  sideDecorAlt: string;
  ambientColor: string;
  particleColors: string[];
}

export interface SkinDef {
  id: string;
  name: string;
  nameHi: string;
  color: string;
  accent: string;
  premium: boolean;
  price: number;
  trail?: string;
}

export interface LevelDef {
  id: number;
  name: string;
  nameHi: string;
  theme: ThemeName;
  distanceGoal: number;
  coinGoal: number;
  maxHits: number;
  baseSpeed: number;
  speedIncrease: number;
  obstacleInterval: number;
  coinInterval: number;
  powerUpInterval: number;
  obstacleTypes: ObstacleType[];
  hasMovingObstacles: boolean;
}

export interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: ObstacleType;
  width: number;
  height: number;
  moving: boolean;
  moveDir: number;
  moveSpeed: number;
}

export interface Coin {
  id: number;
  lane: number;
  y: number;
  collected: boolean;
  magnetTarget: boolean;
  mx: number;
  my: number;
}

export interface PowerUpEntity {
  id: number;
  lane: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ActivePowerUps {
  magnet: number;
  shield: number;
  doubleCoins: number;
  speedBurst: number;
}

export interface PlayerState {
  lane: number;
  targetLane: number;
  x: number;
  y: number;
  jumping: boolean;
  jumpProgress: number;
  jumpHeight: number;
  invincible: number;
}

export interface GameRunState {
  mode: GameMode;
  levelId: number;
  score: number;
  coins: number;
  distance: number;
  hits: number;
  speed: number;
  elapsed: number;
  combo: number;
  maxCombo: number;
  completed: boolean;
  failed: boolean;
  continued: boolean;
  perfectRun: boolean;
}

export interface SaveData {
  totalCoins: number;
  highScores: Record<number, number>;
  endlessHighScore: number;
  unlockedLevels: number[];
  completedLevels: Record<number, { stars: number; bestScore: number; bestCoins: number }>;
  ownedSkins: string[];
  selectedSkin: string;
  ownedThemes: ThemeName[];
  selectedTheme: ThemeName;
  settings: {
    sound: boolean;
    music: boolean;
    vibration: boolean;
    colorBlind: boolean;
    language: Language;
  };
  dailyRewardLastClaim: string;
  dailyRewardStreak: number;
  dailyChallenges: {
    date: string;
    challenges: DailyChallengeProgress[];
  };
  weeklyChallenges: {
    weekId: string;
    coinsCollected: number;
    levelsCompleted: number;
    distanceRun: number;
  };
  achievements: string[];
  totalGamesPlayed: number;
  totalDistanceRun: number;
  totalCoinsEarned: number;
  removeAdsPurchased: boolean;
  skinPackPurchased: boolean;
  tutorialSeen: boolean;
}

export interface DailyReward {
  day: number;
  coins: number;
  label: string;
  labelHi: string;
}

export interface Achievement {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
  check: (save: SaveData) => boolean;
}

export interface WeeklyChallenge {
  id: string;
  description: string;
  descriptionHi: string;
  target: number;
  field: 'coinsCollected' | 'levelsCompleted' | 'distanceRun';
  reward: number;
  icon: string;
}

export interface DailyChallenge {
  id: string;
  description: string;
  descriptionHi: string;
  target: number;
  reward: number;
  icon: string;
  type: 'coins' | 'distance' | 'games' | 'nohit';
}

export interface DailyChallengeProgress {
  id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface RemoteConfig {
  adFrequencySec: number;
  difficultyMult: number;
  coinMult: number;
  interstitialCapMs: number;
  rewardedDailyCap: number;
  bannerEnabled: boolean;
  interstitialEnabled: boolean;
  rewardedEnabled: boolean;
  version: number;
}

// Localization strings
export interface LocalizedStrings {
  appName: string;
  play: string;
  levels: string;
  shop: string;
  daily: string;
  settings: string;
  endlessMode: string;
  best: string;
  score: string;
  coins: string;
  distance: string;
  gameOver: string;
  levelComplete: string;
  newHighScore: string;
  playAgain: string;
  home: string;
  watchAdContinue: string;
  perfectRun: string;
  shareScore: string;
  copied: string;
  maxCombo: string;
  sound: string;
  music: string;
  vibration: string;
  colorBlind: string;
  language: string;
  resetData: string;
  areYouSure: string;
  yes: string;
  cancel: string;
  stats: string;
  gamesPlayed: string;
  totalDistance: string;
  totalCoinsEarned: string;
  endlessBest: string;
  achievements: string;
  privacyPolicy: string;
  termsOfService: string;
  legal: string;
  skins: string;
  themes: string;
  premium: string;
  removeAds: string;
  removeAdsDesc: string;
  skinPack: string;
  skinPackDesc: string;
  owned: string;
  equip: string;
  equipped: string;
  selectLevel: string;
  back: string;
  paused: string;
  resume: string;
  quit: string;
  streak: string;
  claimReward: string;
  alreadyClaimed: string;
  doubleReward: string;
  watchEarn: string;
  weeklyChallenges: string;
  dailyChallenges: string;
  noHitBonus: string;
  countdown3: string;
  countdown2: string;
  countdown1: string;
  countdownGo: string;
}
