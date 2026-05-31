// ===== City Glide: 3-Lane Rush V2.0 — Main App =====
import { useState, useCallback, useEffect } from 'react';
import type { SaveData, Screen, GameRunState } from './types';
import { getLevel, TOTAL_LEVELS, ACHIEVEMENTS, getDailyChallenges } from './data';
import { loadSave, saveSave, addCoins, completeLevel, resetSave, Audio } from './managers';
import GameCanvas from './components/GameCanvas';
import {
  HomeScreen, LevelSelectScreen, GameOverScreen,
  ShopScreen, SettingsScreen, DailyRewardsScreen,
} from './components/Screens';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [save, setSave] = useState<SaveData>(() => {
    const s = loadSave();
    const today = new Date().toISOString().split('T')[0];
    if (s.dailyChallenges.date !== today) {
      const challenges = getDailyChallenges(today);
      s.dailyChallenges = {
        date: today,
        challenges: challenges.map(c => ({ id: c.id, progress: 0, completed: false, claimed: false })),
      };
      saveSave(s);
    }
    return s;
  });
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [endlessMode, setEndlessMode] = useState(false);
  const [lastRunState, setLastRunState] = useState<GameRunState | null>(null);
  const [canContinue, setCanContinue] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    const newAchievements: string[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!save.achievements.includes(a.id) && a.check(save)) {
        newAchievements.push(a.id);
      }
    }
    if (newAchievements.length > 0) {
      const newSave = { ...save, achievements: [...save.achievements, ...newAchievements] };
      saveSave(newSave);
      setSave(newSave);
    }
  }, [save.totalGamesPlayed, save.totalCoinsEarned, save.totalDistanceRun, save.endlessHighScore]);

  const handleQuickPlay = useCallback(() => {
    let nextLevel = 1;
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      if (!save.completedLevels[i]) { nextLevel = i; break; }
    }
    setCurrentLevelId(nextLevel);
    setEndlessMode(false);
    setCanContinue(true);
    setGameKey(k => k + 1);
    setScreen('game');
  }, [save.completedLevels]);

  const handleEndlessPlay = useCallback(() => {
    setCurrentLevelId(15);
    setEndlessMode(true);
    setCanContinue(true);
    setGameKey(k => k + 1);
    setScreen('game');
  }, []);

  const handleLevelSelect = useCallback((levelId: number) => {
    if (levelId === -1) { setEndlessMode(true); setCurrentLevelId(1); }
    else { setEndlessMode(false); setCurrentLevelId(levelId); }
    setCanContinue(true);
    setGameKey(k => k + 1);
    setScreen('game');
  }, []);

  const updateDailyChallenges = (newSave: SaveData, state: GameRunState) => {
    const today = new Date().toISOString().split('T')[0];
    const challenges = getDailyChallenges(today);
    if (newSave.dailyChallenges.date !== today) {
      newSave.dailyChallenges = {
        date: today,
        challenges: challenges.map(c => ({ id: c.id, progress: 0, completed: false, claimed: false })),
      };
    }
    newSave.dailyChallenges.challenges = newSave.dailyChallenges.challenges.map(dc => {
      const chDef = challenges.find(c => c.id === dc.id);
      if (!chDef || dc.completed) return dc;
      let progress = dc.progress;
      if (chDef.type === 'coins') progress += state.coins;
      if (chDef.type === 'distance') progress += Math.floor(state.distance);
      if (chDef.type === 'games') progress += 1;
      if (chDef.type === 'nohit' && state.perfectRun) progress += 1;
      return { ...dc, progress, completed: progress >= chDef.target };
    });
  };

  const handleGameOver = useCallback((state: GameRunState) => {
    setLastRunState(state);
    const newSave = { ...save };
    newSave.totalGamesPlayed += 1;
    newSave.totalDistanceRun += state.distance;
    let coinReward = state.coins;
    if (state.perfectRun && state.coins > 0) coinReward = Math.floor(state.coins * 1.5);
    addCoins(newSave, coinReward);
    updateDailyChallenges(newSave, state);
    if (state.mode === 'endless') {
      newSave.endlessHighScore = Math.max(newSave.endlessHighScore, state.score);
    }
    saveSave(newSave);
    setSave(newSave);
    setScreen('gameOver');
  }, [save]);

  const handleLevelComplete = useCallback((state: GameRunState) => {
    setLastRunState(state);
    const newSave = { ...save };
    newSave.totalGamesPlayed += 1;
    newSave.totalDistanceRun += state.distance;
    let coinReward = state.coins;
    if (state.perfectRun && state.coins > 0) coinReward = Math.floor(state.coins * 1.5);
    addCoins(newSave, coinReward);
    completeLevel(newSave, state.levelId, state.score, state.coins, state.hits);
    updateDailyChallenges(newSave, state);
    saveSave(newSave);
    setSave(newSave);
    setCanContinue(false);
    setScreen('gameOver');
  }, [save]);

  const handleRetry = useCallback(() => {
    setCanContinue(true);
    setGameKey(k => k + 1);
    setScreen('game');
  }, []);

  const handleContinue = useCallback(() => {
    const newSave = addCoins({ ...save }, 100);
    saveSave(newSave);
    setSave(newSave);
    setCanContinue(false);
    setGameKey(k => k + 1);
    setScreen('game');
  }, [save]);

  const handleNavigate = useCallback((s: Screen) => {
    Audio.buttonClick();
    setScreen(s);
  }, []);

  const handleSaveUpdate = useCallback((newSave: SaveData) => { setSave(newSave); }, []);

  const handleReset = useCallback(() => {
    const newSave = resetSave();
    setSave(newSave);
    setScreen('home');
  }, []);

  const level = getLevel(currentLevelId);
  const lang = save.settings.language;

  switch (screen) {
    case 'home':
      return <HomeScreen save={save} onNavigate={handleNavigate} onQuickPlay={handleQuickPlay} onEndlessPlay={handleEndlessPlay} onUpdate={handleSaveUpdate} />;
    case 'levelSelect':
      return <LevelSelectScreen save={save} onSelect={handleLevelSelect} onBack={() => handleNavigate('home')} />;
    case 'game':
      return (
        <div className="w-full h-screen">
          <GameCanvas key={gameKey}
            level={endlessMode ? { ...getLevel(15), distanceGoal: 999999, coinGoal: 0, maxHits: 0 } : level}
            endless={endlessMode} skinId={save.selectedSkin}
            colorBlind={save.settings.colorBlind} vibration={save.settings.vibration}
            soundEnabled={save.settings.sound} language={lang}
            onGameOver={handleGameOver} onLevelComplete={handleLevelComplete} />
        </div>
      );
    case 'gameOver':
      return lastRunState ? (
        <GameOverScreen state={lastRunState} save={save}
          onRetry={handleRetry} onHome={() => handleNavigate('home')}
          onContinue={handleContinue} canContinue={canContinue && !lastRunState.completed} />
      ) : null;
    case 'shop':
      return <ShopScreen save={save} onUpdate={handleSaveUpdate} onBack={() => handleNavigate('home')} />;
    case 'settings':
      return <SettingsScreen save={save} onUpdate={handleSaveUpdate} onBack={() => handleNavigate('home')} onReset={handleReset} />;
    case 'dailyRewards':
      return <DailyRewardsScreen save={save} onUpdate={handleSaveUpdate} onBack={() => handleNavigate('home')} />;
    default:
      return <HomeScreen save={save} onNavigate={handleNavigate} onQuickPlay={handleQuickPlay} onEndlessPlay={handleEndlessPlay} onUpdate={handleSaveUpdate} />;
  }
}
