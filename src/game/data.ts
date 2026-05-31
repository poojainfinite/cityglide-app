// ===== City Glide: 3-Lane Rush V2.0 — Game Data =====
import type { Theme, ThemeName, SkinDef, LevelDef, DailyReward, Achievement, WeeklyChallenge, DailyChallenge, RemoteConfig, LocalizedStrings } from './types';

// ---- LOCALIZATION ----
export const STRINGS: Record<'en' | 'hi', LocalizedStrings> = {
  en: {
    appName: 'City Glide', play: '▶ PLAY', levels: '📋 Levels', shop: '🛒 Shop',
    daily: '🎁 Daily', settings: '⚙️ Settings', endlessMode: '♾️ Endless Mode',
    best: 'Best', score: 'SCORE', coins: 'COINS', distance: 'DISTANCE',
    gameOver: '💥 GAME OVER', levelComplete: '🎉 LEVEL COMPLETE!',
    newHighScore: '🏆 NEW HIGH SCORE!', playAgain: '🔄 Play Again', home: '🏠 Home',
    watchAdContinue: '📺 Watch Ad to Continue', perfectRun: '⭐ PERFECT RUN! x1.5 Bonus!',
    shareScore: '📤 Share Score', copied: '✅ Copied!', maxCombo: 'MAX COMBO',
    sound: '🔊 Sound Effects', music: '🎵 Music', vibration: '📳 Vibration',
    colorBlind: '👁️ Color Blind Mode', language: '🌐 Language',
    resetData: 'Reset All Data', areYouSure: 'Are you sure? This will delete all progress.',
    yes: 'Yes, Reset', cancel: 'Cancel',
    stats: '📊 Stats', gamesPlayed: 'Games Played', totalDistance: 'Total Distance',
    totalCoinsEarned: 'Total Coins Earned', endlessBest: 'Endless Best',
    achievements: '🏆 Achievements', privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service', legal: '📄 Legal',
    skins: '👤 Skins', themes: '🎨 Themes', premium: '💎 Premium',
    removeAds: 'Remove Ads', removeAdsDesc: 'No banners or interstitials',
    skinPack: 'Cosmetic Skin Pack', skinPackDesc: '10 premium skins + exclusive theme',
    owned: '✓ Owned', equip: 'Equip', equipped: '✓ Equipped',
    selectLevel: 'Select Level', back: '← Back', paused: 'PAUSED',
    resume: 'Resume', quit: 'Quit', streak: 'Streak',
    claimReward: 'Claim Reward!', alreadyClaimed: '✅ Already Claimed Today',
    doubleReward: '📺 Double Your Reward', watchEarn: 'Watch & Earn',
    weeklyChallenges: '📅 Weekly Challenges', dailyChallenges: '🎯 Daily Challenges',
    noHitBonus: 'No-Hit Bonus x1.5',
    countdown3: '3', countdown2: '2', countdown1: '1', countdownGo: 'GO!',
  },
  hi: {
    appName: 'सिटी ग्लाइट', play: '▶ खेलो', levels: '📋 लेवल', shop: '🛒 दुकान',
    daily: '🎁 रोज़ाना', settings: '⚙️ सेटिंग्स', endlessMode: '♾️ एंडलेस मोड',
    best: 'सर्वश्रेष्ठ', score: 'स्कोर', coins: 'सिक्के', distance: 'दूरी',
    gameOver: '💥 गेम ओवर!', levelComplete: '🎉 लेवल पूरा!',
    newHighScore: '🏆 नया रिकॉर्ड!', playAgain: '🔄 फिर से खेलो', home: '🏠 होम',
    watchAdContinue: '📺 जारी रखने के लिए विज्ञापन देखें', perfectRun: '⭐ परफेक्ट रन! x1.5 बोनस!',
    shareScore: '📤 स्कोर शेयर करें', copied: '✅ कॉपी हो गया!', maxCombo: 'अधिकतम कॉम्बो',
    sound: '🔊 ध्वनि प्रभाव', music: '🎵 संगीत', vibration: '📳 कंपन',
    colorBlind: '👁️ कलर ब्लाइंड मोड', language: '🌐 भाषा',
    resetData: 'सारा डेटा रीसेट करें', areYouSure: 'क्या आप निश्चित हैं? सारी प्रगति हट जाएगी।',
    yes: 'हाँ, रीसेट करें', cancel: 'रद्द करें',
    stats: '📊 आंकड़े', gamesPlayed: 'खेले गए गेम', totalDistance: 'कुल दूरी',
    totalCoinsEarned: 'कुल सिक्के कमाए', endlessBest: 'एंडलेस सर्वश्रेष्ठ',
    achievements: '🏆 उपलब्धियां', privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवा की शर्तें', legal: '📄 कानूनी',
    skins: '👤 स्किन', themes: '🎨 थीम', premium: '💎 प्रीमियम',
    removeAds: 'विज्ञापन हटाएं', removeAdsDesc: 'कोई बैनर या इंटरस्टिशियल नहीं',
    skinPack: 'कॉस्मेटिक स्किन पैक', skinPackDesc: '10 प्रीमियम स्किन + विशेष थीम',
    owned: '✓ स्वामित्व', equip: 'लगाएं', equipped: '✓ लगा हुआ',
    selectLevel: 'लेवल चुनें', back: '← वापस', paused: 'रोका हुआ',
    resume: 'जारी रखें', quit: 'बाहर निकलें', streak: 'स्ट्रीक',
    claimReward: 'इनाम लें!', alreadyClaimed: '✅ आज पहले ही ले लिया',
    doubleReward: '📺 दोगुना इनाम', watchEarn: 'देखें और कमाएं',
    weeklyChallenges: '📅 साप्ताहिक चुनौतियां', dailyChallenges: '🎯 दैनिक चुनौतियां',
    noHitBonus: 'बिना टक्कर बोनस x1.5',
    countdown3: '३', countdown2: '२', countdown1: '१', countdownGo: 'चलो!',
  },
};

export function t(key: keyof LocalizedStrings, lang: 'en' | 'hi' = 'en'): string {
  return STRINGS[lang][key] || STRINGS.en[key];
}

// ---- THEMES ----
export const THEMES: Record<ThemeName, Theme> = {
  city: {
    name: 'city', label: 'City',
    bgGradient: ['#0f0c29', '#302b63'],
    roadColor: '#3a3a4a', roadEdge: '#ffd700',
    laneMarking: '#ffffff', sideDecor: '#1a1a3e', sideDecorAlt: '#2a2a5e',
    ambientColor: '#6366f1',
    particleColors: ['#fbbf24', '#f59e0b', '#ffffff', '#60a5fa'],
  },
  desert: {
    name: 'desert', label: 'Desert',
    bgGradient: ['#ff7e5f', '#feb47b'],
    roadColor: '#8B7355', roadEdge: '#daa520',
    laneMarking: '#fff8dc', sideDecor: '#c2956e', sideDecorAlt: '#a0784c',
    ambientColor: '#f59e0b',
    particleColors: ['#fbbf24', '#f97316', '#fde68a', '#ffffff'],
  },
  snow: {
    name: 'snow', label: 'Snow',
    bgGradient: ['#a8c0d6', '#e0e5ec'],
    roadColor: '#94a3b8', roadEdge: '#e2e8f0',
    laneMarking: '#ffffff', sideDecor: '#cbd5e1', sideDecorAlt: '#e2e8f0',
    ambientColor: '#93c5fd',
    particleColors: ['#ffffff', '#e0f2fe', '#bae6fd', '#93c5fd'],
  },
  neon: {
    name: 'neon', label: 'Neon',
    bgGradient: ['#0a0a1a', '#1a0a2e'],
    roadColor: '#1e1040', roadEdge: '#ff00ff',
    laneMarking: '#00ffff', sideDecor: '#0f0520', sideDecorAlt: '#1a0a30',
    ambientColor: '#a855f7',
    particleColors: ['#ff00ff', '#00ffff', '#ff6b6b', '#ffd700', '#00ff88'],
  },
};

// ---- SKINS ----
export const SKINS: SkinDef[] = [
  { id: 'cyan', name: 'Cyan Runner', nameHi: 'सियान रनर', color: '#00d4ff', accent: '#0099cc', premium: false, price: 0 },
  { id: 'orange', name: 'Blaze', nameHi: 'ब्लेज़', color: '#ff6b35', accent: '#cc4400', premium: false, price: 0 },
  { id: 'purple', name: 'Violet Storm', nameHi: 'वायलेट स्टॉर्म', color: '#a855f7', accent: '#7c3aed', premium: false, price: 500 },
  { id: 'green', name: 'Lime Flash', nameHi: 'लाइम फ्लैश', color: '#22c55e', accent: '#16a34a', premium: false, price: 500 },
  { id: 'red', name: 'Crimson', nameHi: 'क्रिमसन', color: '#ef4444', accent: '#dc2626', premium: false, price: 750 },
  { id: 'gold', name: 'Golden Boy', nameHi: 'गोल्डन बॉय', color: '#fbbf24', accent: '#d97706', premium: false, price: 1000 },
  { id: 'pink', name: 'Bubblegum', nameHi: 'बबलगम', color: '#ec4899', accent: '#db2777', premium: false, price: 1000 },
  { id: 'white', name: 'Ghost', nameHi: 'घोस्ट', color: '#f1f5f9', accent: '#cbd5e1', premium: false, price: 1500 },
  { id: 'neon_green', name: 'Toxic', nameHi: 'टॉक्सिक', color: '#39ff14', accent: '#00cc00', premium: false, price: 2000 },
  { id: 'sunset', name: 'Sunset Fade', nameHi: 'सनसेट', color: '#f97316', accent: '#ec4899', premium: false, price: 2500 },
  { id: 'fire', name: 'Firewalker', nameHi: 'फायरवॉकर', color: '#ff4500', accent: '#ff0000', premium: true, price: 0, trail: '#ff6600' },
  { id: 'ice', name: 'Frostbite', nameHi: 'फ्रॉस्टबाइट', color: '#87ceeb', accent: '#4fc3f7', premium: true, price: 0, trail: '#b3e5fc' },
  { id: 'shadow', name: 'Shadow', nameHi: 'शैडो', color: '#2d2d2d', accent: '#1a1a1a', premium: true, price: 0, trail: '#444444' },
  { id: 'electric', name: 'Voltage', nameHi: 'वोल्टेज', color: '#ffff00', accent: '#ffd700', premium: true, price: 0, trail: '#ffff88' },
  { id: 'galaxy', name: 'Galaxy', nameHi: 'गैलेक्सी', color: '#7c3aed', accent: '#2563eb', premium: true, price: 0, trail: '#a78bfa' },
  { id: 'crystal', name: 'Crystal', nameHi: 'क्रिस्टल', color: '#a5f3fc', accent: '#67e8f9', premium: true, price: 0, trail: '#cffafe' },
  { id: 'lava', name: 'Molten', nameHi: 'मोल्टन', color: '#dc2626', accent: '#f97316', premium: true, price: 0, trail: '#fbbf24' },
  { id: 'diamond', name: 'Diamond', nameHi: 'डायमंड', color: '#e0f2fe', accent: '#bae6fd', premium: true, price: 0, trail: '#ffffff' },
  { id: 'matrix', name: 'Matrix', nameHi: 'मैट्रिक्स', color: '#00ff00', accent: '#008800', premium: true, price: 0, trail: '#00ff44' },
  { id: 'void', name: 'Void Walker', nameHi: 'वॉइड वॉकर', color: '#581c87', accent: '#3b0764', premium: true, price: 0, trail: '#a855f7' },
];

// ---- LEVELS ----
function makeLevel(
  id: number, name: string, nameHi: string, theme: ThemeName,
  distanceGoal: number, coinGoal: number, maxHits: number,
  baseSpeed: number, speedIncrease: number,
  obstacleInterval: number, coinInterval: number, powerUpInterval: number,
  obstacleTypes: LevelDef['obstacleTypes'], hasMoving: boolean
): LevelDef {
  return {
    id, name, nameHi, theme, distanceGoal, coinGoal, maxHits,
    baseSpeed, speedIncrease, obstacleInterval, coinInterval, powerUpInterval,
    obstacleTypes, hasMovingObstacles: hasMoving,
  };
}

export const HANDCRAFTED_LEVELS: LevelDef[] = [
  makeLevel(1, 'First Steps', 'पहले कदम', 'city', 500, 10, 3, 210, 0.7, 1900, 760, 7000, ['cone'], false),
  makeLevel(2, 'Getting Warmer', 'गर्म हो रहे हो', 'city', 700, 20, 3, 230, 0.8, 1700, 680, 6200, ['cone', 'barrier'], false),
  makeLevel(3, 'Lane Switch', 'लेन बदलो', 'city', 900, 30, 2, 250, 0.95, 1500, 620, 5600, ['cone', 'barrier'], false),
  makeLevel(4, 'Desert Dash', 'रेगिस्तान दौड़', 'desert', 1000, 35, 2, 270, 1.1, 1350, 560, 5200, ['cone', 'barrier', 'car'], false),
  makeLevel(5, 'Speed Demon', 'स्पीड डेमन', 'desert', 1200, 40, 2, 300, 1.25, 1250, 520, 4800, ['barrier', 'car'], false),
  makeLevel(6, 'Coin Rush', 'सिक्कों की बारिश', 'desert', 800, 80, 3, 230, 0.5, 1800, 400, 5000, ['cone'], false),
  makeLevel(7, 'No Mercy', 'कोई दया नहीं', 'snow', 1500, 30, 0, 260, 0.8, 1300, 700, 5000, ['cone', 'barrier', 'car'], false),
  makeLevel(8, 'Frost Run', 'बर्फीली दौड़', 'snow', 1200, 50, 1, 270, 0.9, 1200, 500, 4500, ['barrier', 'car'], true),
  makeLevel(9, 'Ice Maze', 'बर्फ का भूलभुलैया', 'snow', 1800, 45, 1, 280, 1.0, 1100, 500, 4000, ['cone', 'barrier', 'car'], true),
  makeLevel(10, 'Neon Nights', 'नियॉन रातें', 'neon', 1500, 60, 2, 300, 1.0, 1200, 450, 4000, ['barrier', 'car', 'gap'], true),
  makeLevel(11, 'Gap Jump', 'खाई कूदो', 'neon', 1800, 50, 1, 300, 1.2, 1100, 500, 3800, ['gap', 'barrier'], true),
  makeLevel(12, 'Full Throttle', 'फुल स्पीड', 'city', 2000, 70, 2, 320, 1.2, 1000, 400, 3500, ['cone', 'barrier', 'car', 'gap'], true),
  makeLevel(13, 'Survival', 'ज़िंदा रहो', 'desert', 2500, 50, 0, 300, 1.5, 900, 600, 3500, ['barrier', 'car', 'gap'], true),
  makeLevel(14, 'Blizzard', 'बर्फीला तूफान', 'snow', 2200, 80, 1, 340, 1.3, 950, 350, 3000, ['cone', 'barrier', 'car', 'gap'], true),
  makeLevel(15, 'Neon Fury', 'नियॉन फ्यूरी', 'neon', 3000, 100, 1, 350, 1.5, 850, 350, 3000, ['barrier', 'car', 'gap'], true),
];

export function generateLevel(id: number): LevelDef {
  const themes: ThemeName[] = ['city', 'desert', 'snow', 'neon'];
  const theme = themes[(id - 1) % 4];
  const difficulty = Math.min((id - 15) / 45, 1);
  const names = ['Hyper Run','Speed Zone','Night Rush','Dawn Patrol','Twilight Zone','Overdrive','Turbo Lane','Light Speed','Quantum Leap','Infinity Run','Storm Chaser','Phantom Run','Iron Will','Last Stand','Final Rush'];
  const namesHi = ['हाइपर रन','स्पीड ज़ोन','नाइट रश','डॉन पेट्रोल','ट्वाइलाइट','ओवरड्राइव','टर्बो लेन','लाइट स्पीड','क्वांटम लीप','इन्फिनिटी','स्टॉर्म चेज़र','फैंटम रन','आयरन विल','लास्ट स्टैंड','फाइनल रश'];
  const idx = (id - 16) % names.length;
  return makeLevel(id, names[idx] + (id > 30 ? ` ${Math.floor((id-16)/15)+1}` : ''), namesHi[idx], theme,
    Math.floor(1500 + difficulty * 3500), Math.floor(40 + difficulty * 120),
    Math.max(0, 2 - Math.floor(difficulty * 3)),
    280 + difficulty * 200, 0.8 + difficulty * 1.5,
    Math.floor(1200 - difficulty * 600), Math.floor(500 - difficulty * 200),
    Math.floor(4000 - difficulty * 2000),
    ['cone', 'barrier', 'car', 'gap'], difficulty > 0.2);
}

export function getLevel(id: number): LevelDef {
  if (id <= 15) return HANDCRAFTED_LEVELS[id - 1];
  return generateLevel(id);
}

export const TOTAL_LEVELS = 60;

// ---- DAILY REWARDS ----
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 50, label: '50 Coins', labelHi: '50 सिक्के' },
  { day: 2, coins: 75, label: '75 Coins', labelHi: '75 सिक्के' },
  { day: 3, coins: 100, label: '100 Coins', labelHi: '100 सिक्के' },
  { day: 4, coins: 150, label: '150 Coins', labelHi: '150 सिक्के' },
  { day: 5, coins: 200, label: '200 Coins', labelHi: '200 सिक्के' },
  { day: 6, coins: 300, label: '300 Coins', labelHi: '300 सिक्के' },
  { day: 7, coins: 500, label: '500 Coins + Bonus!', labelHi: '500 सिक्के + बोनस!' },
];

// ---- DAILY CHALLENGES (3 per day, seeded by date) ----
const ALL_DAILY_CHALLENGES: DailyChallenge[] = [
  { id: 'dc_coins_50', description: 'Collect 50 coins', descriptionHi: '50 सिक्के इकट्ठा करो', target: 50, reward: 30, icon: '🪙', type: 'coins' },
  { id: 'dc_coins_100', description: 'Collect 100 coins', descriptionHi: '100 सिक्के इकट्ठा करो', target: 100, reward: 60, icon: '🪙', type: 'coins' },
  { id: 'dc_dist_500', description: 'Run 500m total', descriptionHi: 'कुल 500m दौड़ो', target: 500, reward: 40, icon: '🏃', type: 'distance' },
  { id: 'dc_dist_1000', description: 'Run 1000m total', descriptionHi: 'कुल 1000m दौड़ो', target: 1000, reward: 80, icon: '🏃', type: 'distance' },
  { id: 'dc_games_3', description: 'Play 3 games', descriptionHi: '3 गेम खेलो', target: 3, reward: 50, icon: '🎮', type: 'games' },
  { id: 'dc_games_5', description: 'Play 5 games', descriptionHi: '5 गेम खेलो', target: 5, reward: 80, icon: '🎮', type: 'games' },
  { id: 'dc_nohit_1', description: 'Complete 1 no-hit run', descriptionHi: '1 बिना टक्कर रन पूरा करो', target: 1, reward: 100, icon: '⭐', type: 'nohit' },
  { id: 'dc_coins_200', description: 'Collect 200 coins', descriptionHi: '200 सिक्के इकट्ठा करो', target: 200, reward: 100, icon: '💰', type: 'coins' },
  { id: 'dc_dist_2000', description: 'Run 2000m total', descriptionHi: 'कुल 2000m दौड़ो', target: 2000, reward: 120, icon: '🌍', type: 'distance' },
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailyChallenges(date?: string): DailyChallenge[] {
  const d = date || new Date().toISOString().split('T')[0];
  const shuffled = [...ALL_DAILY_CHALLENGES].sort((a, b) => hashCode(a.id + d) - hashCode(b.id + d));
  return shuffled.slice(0, 3);
}

// ---- ACHIEVEMENTS ----
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_run', name: 'First Steps', nameHi: 'पहले कदम', description: 'Complete your first run', descriptionHi: 'पहला रन पूरा करो', icon: '🏃', check: s => s.totalGamesPlayed >= 1 },
  { id: 'coin_100', name: 'Coin Collector', nameHi: 'सिक्का संग्राहक', description: 'Collect 100 total coins', descriptionHi: 'कुल 100 सिक्के इकट्ठा करो', icon: '🪙', check: s => s.totalCoinsEarned >= 100 },
  { id: 'coin_1000', name: 'Treasure Hunter', nameHi: 'खजाना खोजी', description: 'Collect 1,000 total coins', descriptionHi: 'कुल 1,000 सिक्के इकट्ठा करो', icon: '💰', check: s => s.totalCoinsEarned >= 1000 },
  { id: 'coin_5000', name: 'Gold Rush', nameHi: 'गोल्ड रश', description: 'Collect 5,000 total coins', descriptionHi: 'कुल 5,000 सिक्के इकट्ठा करो', icon: '🏆', check: s => s.totalCoinsEarned >= 5000 },
  { id: 'dist_1000', name: 'Marathon', nameHi: 'मैराथन', description: 'Run 1,000m total', descriptionHi: 'कुल 1,000m दौड़ो', icon: '📏', check: s => s.totalDistanceRun >= 1000 },
  { id: 'dist_10000', name: 'Ultra Runner', nameHi: 'अल्ट्रा रनर', description: 'Run 10,000m total', descriptionHi: 'कुल 10,000m दौड़ो', icon: '🌍', check: s => s.totalDistanceRun >= 10000 },
  { id: 'games_10', name: 'Dedicated', nameHi: 'समर्पित', description: 'Play 10 games', descriptionHi: '10 गेम खेलो', icon: '🎮', check: s => s.totalGamesPlayed >= 10 },
  { id: 'games_50', name: 'Champion', nameHi: 'चैंपियन', description: 'Play 50 games', descriptionHi: '50 गेम खेलो', icon: '🔥', check: s => s.totalGamesPlayed >= 50 },
  { id: 'skin_3', name: 'Fashion', nameHi: 'फैशन', description: 'Own 3 skins', descriptionHi: '3 स्किन अपने पास रखो', icon: '👔', check: s => s.ownedSkins.length >= 3 },
  { id: 'endless_500', name: 'Endless Warrior', nameHi: 'एंडलेस योद्धा', description: 'Score 500+ in Endless', descriptionHi: 'एंडलेस में 500+ स्कोर करो', icon: '♾️', check: s => s.endlessHighScore >= 500 },
  { id: 'level_15', name: 'Halfway There', nameHi: 'आधा रास्ता', description: 'Complete level 15', descriptionHi: 'लेवल 15 पूरा करो', icon: '⭐', check: s => s.unlockedLevels.includes(16) },
  { id: 'level_60', name: 'Champion', nameHi: 'चैंपियन', description: 'Complete all 60 levels', descriptionHi: 'सभी 60 लेवल पूरे करो', icon: '👑', check: s => s.unlockedLevels.length >= 60 },
];

// ---- WEEKLY CHALLENGES ----
export function getWeeklyChallenges(): WeeklyChallenge[] {
  return [
    { id: 'wc_coins', description: 'Collect 500 coins this week', descriptionHi: 'इस हफ्ते 500 सिक्के इकट्ठा करो', target: 500, field: 'coinsCollected', reward: 200, icon: '🪙' },
    { id: 'wc_levels', description: 'Complete 5 levels this week', descriptionHi: 'इस हफ्ते 5 लेवल पूरे करो', target: 5, field: 'levelsCompleted', reward: 300, icon: '⭐' },
    { id: 'wc_dist', description: 'Run 3,000m this week', descriptionHi: 'इस हफ्ते 3,000m दौड़ो', target: 3000, field: 'distanceRun', reward: 250, icon: '🏃' },
  ];
}

// ---- REMOTE CONFIG (Local stub for A/B testing) ----
export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  adFrequencySec: 120,
  difficultyMult: 1.0,
  coinMult: 1.0,
  interstitialCapMs: 120000,
  rewardedDailyCap: 4,
  bannerEnabled: true,
  interstitialEnabled: true,
  rewardedEnabled: true,
  version: 1,
};

export function loadRemoteConfig(): RemoteConfig {
  try {
    const raw = localStorage.getItem('cityglide_remote_config');
    if (raw) return { ...DEFAULT_REMOTE_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_REMOTE_CONFIG;
}

export function saveRemoteConfig(config: RemoteConfig): void {
  try { localStorage.setItem('cityglide_remote_config', JSON.stringify(config)); } catch { /* ignore */ }
}

// ---- ECONOMY ----
export const ECONOMY = {
  coinsPerSession: { min: 80, max: 120 },
  skinPriceMin: 500,
  skinPriceMax: 2500,
  removeAdsPrice: '$1.99',
  starterPackPrice: '$0.99',
  skinPackPrice: '$2.99',
  rewardedAdCoins: 100,
  perfectRunMultiplier: 1.5,
  interstitialCapMs: 120000,
};

// ---- APP URL (REPLACE WITH YOUR PLAY STORE URL AFTER PUBLISH) ----
// Format: https://play.google.com/store/apps/details?id=com.yourname.cityglide
export const APP_URL = 'https://play.google.com/store/apps/details?id=com.runnergames.cityglide';

// ---- AD UNIT PLACEHOLDERS (REPLACE BEFORE RELEASE) ----
export const AD_UNITS = {
  appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
  bannerId: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  interstitialId: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  rewardedId: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  // TEST IDs (safe for development):
  testBannerId: 'ca-app-pub-3940256099942544/6300978111',
  testInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
  testRewardedId: 'ca-app-pub-3940256099942544/5224354917',
};
