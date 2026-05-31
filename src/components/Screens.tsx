import { useState } from 'react';
import type { SaveData, Screen, ThemeName, GameRunState, Language, SkinDef } from '../game/types';
import { SKINS, THEMES, TOTAL_LEVELS, DAILY_REWARDS, ACHIEVEMENTS, getWeeklyChallenges, getDailyChallenges, ECONOMY, t, APP_URL } from '../game/data';
import { saveSave, addCoins } from '../game/managers';

const lang = (save: SaveData): Language => save.settings.language;

function PageShell({
  theme,
  title,
  icon,
  onBack,
  right,
  children,
}: {
  theme: { bgGradient: [string, string] };
  title: string;
  icon?: string;
  onBack: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="h-[100dvh] w-full overflow-hidden flex flex-col"
      style={{
        background: `linear-gradient(160deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 100%)`,
      }}
    >
      <div
        className="flex-none backdrop-blur-md bg-black/40 border-b border-white/8 flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button
          onClick={onBack}
          className="text-white text-sm font-semibold flex items-center gap-1 active:scale-95 transition-transform px-3 py-2"
        >
          <span className="text-lg">‹</span> Back
        </button>
        <h2 className="text-white text-base font-bold flex items-center gap-2">
          {icon ? <span>{icon}</span> : null}
          {title}
        </h2>
        <div className="min-w-[56px] flex justify-end">{right}</div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-md mx-auto px-4 py-4 pb-[120px]">{children}</div>
      </div>
    </div>
  );
}

function NavTile({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-16 bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-all hover:bg-white/12 px-4"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-white text-base font-bold">{label}</span>
    </button>
  );
}

function ChallengeCard({
  title,
  icon,
  challenges,
}: {
  title: string;
  icon: string;
  challenges: { icon: string; label: string; progress: number; target: number; completed: boolean; color: 'green' | 'blue' }[];
}) {
  return (
    <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <h3 className="text-white font-bold text-sm">{title}</h3>
      </div>
      <div className="space-y-3">
        {challenges.map((ch, i) => {
          const pct = Math.min(100, (ch.progress / ch.target) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-sm">{ch.icon}</span>
                  <span className="text-white/80 text-xs font-medium truncate">{ch.label}</span>
                </div>
                <span className={`text-xs font-bold ml-2 ${ch.completed ? 'text-yellow-400' : 'text-white/50'}`}>
                  {ch.completed ? '✓' : `${Math.min(ch.progress, ch.target)}/${ch.target}`}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ch.completed
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                      : ch.color === 'green'
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider px-1 mb-2">{title}</h3>
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ icon, label, desc, right }: { icon: string; label: string; desc: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-base flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">{label}</p>
        <p className="text-white/40 text-xs mt-0.5 leading-tight">{desc}</p>
      </div>
      {right}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-7 rounded-full transition-all duration-200 flex-shrink-0 ${on ? 'bg-green-500' : 'bg-white/15'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/50 text-xs mb-0.5">{label}</p>
      <p className="text-white font-bold text-base">{value}</p>
    </div>
  );
}

export function HomeScreen({ save, onNavigate, onQuickPlay, onEndlessPlay }: {
  save: SaveData; onNavigate: (s: Screen) => void; onQuickPlay: () => void; onEndlessPlay: () => void;
  onUpdate?: (s: SaveData) => void;
}) {
  const theme = THEMES[save.selectedTheme];
  const l = lang(save);
  const skin: SkinDef = SKINS.find((s: SkinDef) => s.id === save.selectedSkin) || SKINS[0];

  return (
    <div className="min-h-screen w-full overflow-y-auto overflow-x-hidden relative" style={{ background: `linear-gradient(160deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 100%)`, paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl opacity-30 animate-pulse pointer-events-none" style={{ backgroundColor: skin.color }} />
      <div className="absolute bottom-40 right-10 w-40 h-40 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none" style={{ backgroundColor: '#a855f7', animationDelay: '1s' }} />

      <div className="relative flex justify-end pt-2 px-4">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/30 shadow-lg">
          <span className="text-yellow-400 text-lg">🪙</span>
          <span className="text-white font-black text-base">{save.totalCoins.toLocaleString()}</span>
        </div>
      </div>

      <div className="relative flex flex-col items-center px-6 pt-4 pb-3">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg leading-none">CITY GLIDE</h1>
          <p className="text-[11px] text-white/55 font-bold tracking-[0.25em] mt-1.5">3 · LANE · RUSH</p>
        </div>
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-3xl blur-2xl opacity-50" style={{ backgroundColor: skin.color }} />
          <div className="relative w-24 h-24 rounded-3xl shadow-xl flex items-center justify-center text-5xl animate-float border border-white/20" style={{ background: `linear-gradient(135deg, ${skin.color}, ${skin.accent})` }}>
            <span className="drop-shadow-lg">🏃</span>
          </div>
        </div>
      </div>

      <div className="relative px-6 flex flex-col items-center gap-3 mb-5">
        <button onClick={onQuickPlay} className="w-60 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-black text-xl shadow-lg shadow-purple-500/40 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 border border-white/20">
          <span className="text-2xl">▶</span>
          <span>PLAY</span>
        </button>
        <button onClick={onEndlessPlay} className="bg-white/10 backdrop-blur-sm border border-white/15 text-white/85 text-xs font-semibold py-2 px-5 rounded-full active:scale-95 transition-transform flex items-center gap-1.5">
          <span>♾️</span><span>Endless · Best: {save.endlessHighScore}</span>
        </button>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        <NavTile icon="📋" label="Levels" onClick={() => onNavigate('levelSelect')} />
        <NavTile icon="🛒" label="Shop" onClick={() => onNavigate('shop')} />
        <NavTile icon="🎁" label="Daily" onClick={() => onNavigate('dailyRewards')} />
        <NavTile icon="⚙️" label="Settings" onClick={() => onNavigate('settings')} />
      </div>

      <div className="px-5 mb-4">
        <ChallengeCard
          title={t('dailyChallenges', l)}
          icon="🎯"
          challenges={getDailyChallenges().map((ch, i) => ({ icon: ch.icon, label: l === 'hi' ? ch.descriptionHi : ch.description, progress: save.dailyChallenges.challenges[i]?.progress || 0, target: ch.target, completed: save.dailyChallenges.challenges[i]?.completed || false, color: 'green' as const }))}
        />
      </div>

      <div className="px-5 pb-8">
        <ChallengeCard
          title={t('weeklyChallenges', l)}
          icon="📅"
          challenges={getWeeklyChallenges().map(ch => ({ icon: ch.icon, label: l === 'hi' ? ch.descriptionHi : ch.description, progress: save.weeklyChallenges[ch.field], target: ch.target, completed: save.weeklyChallenges[ch.field] >= ch.target, color: 'blue' as const }))}
        />
      </div>
    </div>
  );
}

export function LevelSelectScreen({ save, onSelect, onBack }: {
  save: SaveData; onSelect: (levelId: number) => void; onBack: () => void;
}) {
  const theme = THEMES[save.selectedTheme];
  const totalStars = Object.values(save.completedLevels as Record<number, { stars: number; bestScore: number; bestCoins: number }>).reduce((sum: number, lv) => sum + lv.stars, 0);
  return (
    <PageShell theme={theme} title="Levels" icon="📋" onBack={onBack} right={<div className="w-14" />}>
      <div className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-[10px]">Progress</p>
          <p className="text-white text-sm font-bold">{Object.keys(save.completedLevels).length} / {TOTAL_LEVELS}</p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-[10px]">Total Stars</p>
          <p className="text-yellow-400 text-sm font-bold">⭐ {totalStars}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 pb-28">
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((id: number) => {
          const unlocked = save.unlockedLevels.includes(id);
          const completed = save.completedLevels[id];
          return (
            <button key={id} onClick={() => unlocked && onSelect(id)} disabled={!unlocked}
              className={`aspect-square rounded-md flex flex-col items-center justify-center transition-all active:scale-95 ${unlocked ? completed ? 'bg-gradient-to-br from-green-500/30 to-emerald-600/20 border border-green-400/50 text-white shadow-sm shadow-green-500/20' : 'bg-white/8 border border-white/15 text-white hover:bg-white/12' : 'bg-white/[0.03] border border-white/5 text-white/20'}`}>
              <span className="text-[13px] font-black">{unlocked ? id : '🔒'}</span>
              {completed ? <div className="text-[7px] mt-0.5 leading-none">{'⭐'.repeat(completed.stars)}</div> : null}
            </button>
          );
        })}
      </div>

      <button onClick={() => onSelect(-1)} className="w-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/40 rounded-2xl p-4 flex items-center gap-4 active:scale-95 transition-all">
        <div className="w-12 h-12 bg-purple-500/30 rounded-2xl flex items-center justify-center text-2xl">♾️</div>
        <div className="flex-1 text-left">
          <p className="text-white font-bold text-base">Endless Mode</p>
          <p className="text-white/60 text-xs">Best: {save.endlessHighScore}</p>
        </div>
        <span className="text-white/60 text-xl">›</span>
      </button>
    </PageShell>
  );
}

export function GameOverScreen({ state, save, onRetry, onHome, onContinue, canContinue }: {
  state: GameRunState; save: SaveData; onRetry: () => void; onHome: () => void; onContinue: () => void; canContinue: boolean;
}) {
  const theme = THEMES[save.selectedTheme];
  const isNewHigh = state.mode === 'endless' && state.score > (save.endlessHighScore || 0);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const shareText = `🎮 City Glide: 3-Lane Rush\n${state.completed ? '✅ Level Complete!' : '💥 Game Over'}\n🏆 Score: ${state.score}\n🪙 Coins: ${state.coins}\n📏 Distance: ${Math.floor(state.distance)}m${state.perfectRun ? '\n⭐ PERFECT RUN!' : ''}\n\nCan you beat my score? Download free:\n${APP_URL}`;
  const shareScore = async () => { if (navigator.share) { try { await navigator.share({ title: 'City Glide Score', text: shareText }); return; } catch {} } setShowShare(true); };
  const shareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank'); setShowShare(false); };
  const shareTwitter = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank'); setShowShare(false); };
  const shareFacebook = () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}&quote=${encodeURIComponent(shareText)}`, '_blank'); setShowShare(false); };
  const shareTelegram = () => { window.open(`https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(shareText)}`, '_blank'); setShowShare(false); };
  const copyText = () => { if (navigator.clipboard) navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); setShowShare(false); };

  return (
    <div className="min-h-screen w-full overflow-y-auto overflow-x-hidden flex flex-col" style={{ background: `linear-gradient(160deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 100%)`, paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
      <div className="max-w-md w-full mx-auto px-5 py-6 flex-1 flex flex-col justify-center gap-4">
        <div className="text-center">
          <div className="text-5xl mb-2">{state.completed ? '🎉' : '💥'}</div>
          <h2 className="text-2xl font-black text-white">{state.completed ? 'Level Complete!' : 'Game Over'}</h2>
          {state.completed && save.completedLevels[state.levelId] ? <div className="mt-3 text-3xl">{'⭐'.repeat(save.completedLevels[state.levelId].stars)}{'☆'.repeat(3 - save.completedLevels[state.levelId].stars)}</div> : null}
        </div>
        {isNewHigh ? <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-center py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/30 animate-pulse">🏆 NEW HIGH SCORE!</div> : null}
        {state.perfectRun && state.coins > 0 ? <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-center py-2.5 rounded-xl text-sm shadow-lg shadow-purple-500/30">⭐ PERFECT RUN · ×1.5 BONUS!</div> : null}
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center"><p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Score</p><p className="text-white text-2xl font-black mt-1">{state.score}</p></div>
            <div className="text-center"><p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Coins</p><p className="text-yellow-400 text-2xl font-black mt-1">🪙{state.coins}</p></div>
            <div className="text-center pt-3 border-t border-white/10"><p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Distance</p><p className="text-white text-xl font-bold mt-1">{Math.floor(state.distance)}m</p></div>
            <div className="text-center pt-3 border-t border-white/10"><p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Combo</p><p className="text-white text-xl font-bold mt-1">{state.maxCombo}x</p></div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {canContinue && !state.completed ? <button onClick={onContinue} className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg shadow-2xl shadow-green-500/40 active:scale-95 transition-all border-2 border-white/20 flex items-center justify-center gap-2"><span className="text-2xl">📺</span> WATCH AD · CONTINUE</button> : null}
          <button onClick={onRetry} className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-black text-xl shadow-2xl shadow-blue-500/40 active:scale-95 transition-all border-2 border-white/20 flex items-center justify-center gap-2"><span className="text-2xl">▶</span> PLAY AGAIN</button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={shareScore} className="py-4 rounded-2xl bg-gradient-to-r from-pink-500/30 to-rose-500/30 border border-pink-400/40 text-white font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-1.5"><span className="text-xl">📤</span> Share</button>
            <button onClick={onHome} className="py-4 rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-1.5"><span className="text-xl">🏠</span> Home</button>
          </div>
        </div>
      </div>
      {copied ? <div className="fixed inset-x-0 bottom-24 flex justify-center z-[60] pointer-events-none"><div className="bg-black/80 backdrop-blur-md text-white px-5 py-3 rounded-full font-bold text-sm shadow-2xl border border-white/20">✓ Copied to clipboard!</div></div> : null}
      {showShare ? <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center" onClick={() => setShowShare(false)}><div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/15 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}><div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" /><h3 className="text-white text-lg font-bold text-center mb-1">Share Your Score!</h3><p className="text-white/60 text-xs text-center mb-5">Challenge your friends to beat {state.score}!</p><div className="grid grid-cols-4 gap-3 mb-4"><button onClick={shareWhatsApp} className="flex flex-col items-center gap-1.5 p-3 bg-green-500/15 border border-green-500/30 rounded-2xl active:scale-95 transition-transform"><span className="text-3xl">💬</span><span className="text-white text-[11px] font-bold">WhatsApp</span></button><button onClick={shareTwitter} className="flex flex-col items-center gap-1.5 p-3 bg-sky-500/15 border border-sky-500/30 rounded-2xl active:scale-95 transition-transform"><span className="text-3xl">🐦</span><span className="text-white text-[11px] font-bold">Twitter</span></button><button onClick={shareFacebook} className="flex flex-col items-center gap-1.5 p-3 bg-blue-600/15 border border-blue-600/30 rounded-2xl active:scale-95 transition-transform"><span className="text-3xl">📘</span><span className="text-white text-[11px] font-bold">Facebook</span></button><button onClick={shareTelegram} className="flex flex-col items-center gap-1.5 p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl active:scale-95 transition-transform"><span className="text-3xl">✈️</span><span className="text-white text-[11px] font-bold">Telegram</span></button></div><button onClick={copyText} className="w-full py-3 bg-white/10 border border-white/15 text-white font-bold rounded-2xl text-sm active:scale-95 transition-transform mb-2">📋 Copy to Clipboard</button><button onClick={() => setShowShare(false)} className="w-full py-2.5 text-white/50 text-sm font-semibold">Cancel</button></div></div> : null}
    </div>
  );
}

export function ShopScreen({ save, onUpdate, onBack }: {
  save: SaveData; onUpdate: (s: SaveData) => void; onBack: () => void;
}) {
  const theme = THEMES[save.selectedTheme];
  const l = lang(save);
  const [tab, setTab] = useState<'skins' | 'themes'>('skins');

  const buySkin = (skinId: string, price: number) => {
    if (save.totalCoins < price) return;
    const newSave = { ...save };
    newSave.totalCoins -= price;
    newSave.ownedSkins = [...newSave.ownedSkins, skinId];
    saveSave(newSave);
    onUpdate(newSave);
  };

  const selectSkin = (skinId: string) => {
    const newSave = { ...save, selectedSkin: skinId };
    saveSave(newSave);
    onUpdate(newSave);
  };

  return (
    <PageShell
      theme={theme}
      title="Shop"
      icon="🛒"
      onBack={onBack}
      right={
        <div className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/30 px-3 py-1.5 rounded-full">
          <span className="text-yellow-400 text-sm">🪙</span>
          <span className="text-white font-bold text-sm">{save.totalCoins}</span>
        </div>
      }
    >
      <div className="mb-3">
        <h3 className="text-yellow-400 text-[11px] font-black uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1.5"><span>💎</span> Premium Offers</h3>
        <div className="grid grid-cols-3 gap-1.5">
          <button onClick={() => { const ns = addCoins({ ...save }, 500); if (!ns.ownedSkins.includes('gold')) ns.ownedSkins = [...ns.ownedSkins, 'gold']; saveSave(ns); onUpdate(ns); alert('🎉 Demo Mode: Real payment will use Google Play Billing in production. You got 500 coins + Gold skin!'); }} className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-2 text-center active:scale-95 transition-transform shadow-lg shadow-orange-500/30 border border-yellow-300/50"><div className="text-xl mb-0.5">🔥</div><p className="text-white text-[9px] font-black leading-tight">STARTER</p><p className="text-white text-[8px] opacity-80 mt-0.5">500🪙 + Skin</p><div className="bg-white text-orange-600 font-black text-[11px] mt-1 py-1 rounded-md">$0.99</div></button>
          <button onClick={() => { if (save.removeAdsPurchased) return; const ns = { ...save, removeAdsPurchased: true }; saveSave(ns); onUpdate(ns); alert('🎉 Demo Mode: Real payment will use Google Play Billing in production. Ads removed!'); }} className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-2 text-center active:scale-95 transition-transform shadow-lg shadow-green-500/30 border border-green-300/50"><div className="text-xl mb-0.5">🚫</div><p className="text-white text-[9px] font-black leading-tight">NO ADS</p><p className="text-white text-[8px] opacity-80 mt-0.5">Forever</p><div className="bg-white text-green-600 font-black text-[11px] mt-1 py-1 rounded-md">{save.removeAdsPurchased ? '✓ OWNED' : '$1.99'}</div></button>
          <button onClick={() => { if (save.skinPackPurchased) return; const ns = { ...save, skinPackPurchased: true, ownedSkins: [...new Set([...save.ownedSkins, ...SKINS.filter((s: SkinDef) => s.premium).map((s: SkinDef) => s.id)])] }; saveSave(ns); onUpdate(ns); alert('🎉 Demo Mode: Real payment will use Google Play Billing in production. 10 premium skins unlocked!'); }} className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-2 text-center active:scale-95 transition-transform shadow-lg shadow-purple-500/30 border border-purple-300/50"><div className="text-xl mb-0.5">🎨</div><p className="text-white text-[9px] font-black leading-tight">10 SKINS</p><p className="text-white text-[8px] opacity-80 mt-0.5">Premium</p><div className="bg-white text-purple-600 font-black text-[11px] mt-1 py-1 rounded-md">{save.skinPackPurchased ? '✓ OWNED' : '$2.99'}</div></button>
        </div>
        <p className="text-white/35 text-[9px] text-center mt-1.5">💳 Google Play Billing</p>
      </div>

      <div className="flex gap-2 mb-4 bg-white/5 rounded-2xl p-1 border border-white/10">
        <button onClick={() => setTab('skins')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'skins' ? 'bg-white/20 text-white shadow-lg' : 'text-white/50'}`}>👤 Skins</button>
        <button onClick={() => setTab('themes')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'themes' ? 'bg-white/20 text-white shadow-lg' : 'text-white/50'}`}>🎨 Themes</button>
      </div>

      {tab === 'skins' ? (
        <div className="grid grid-cols-3 gap-2 pb-28">
          {SKINS.map((skin: SkinDef) => {
            const owned = save.ownedSkins.includes(skin.id);
            const selected = save.selectedSkin === skin.id;
            const canBuy = !owned && !skin.premium && save.totalCoins >= skin.price;
            const handleClick = () => {
              if (owned) selectSkin(skin.id);
              else if (canBuy) buySkin(skin.id, skin.price);
              else if (skin.premium) alert('💎 Premium skin! Buy the 10 SKINS Premium Pack above.');
              else alert(`💰 Need ${skin.price - save.totalCoins} more coins.`);
            };
            return (
              <button key={skin.id} onClick={handleClick} className={`bg-white/[0.04] backdrop-blur-sm border rounded-lg p-1.5 active:scale-95 transition-all flex flex-col ${selected ? 'border-yellow-400 ring-1 ring-yellow-400/40' : 'border-white/10'}`}>
                <div className="h-20 rounded-md shadow-sm relative mb-1" style={{ backgroundColor: skin.color }}>
                  {selected ? <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-black text-[9px] font-black shadow-lg">✓</div> : null}
                  {skin.premium && !owned ? <div className="absolute top-0.5 left-0.5 bg-purple-500 text-white text-[7px] font-black px-1 py-0.5 rounded">💎</div> : null}
                </div>
                <p className="text-white text-[10px] font-bold text-center leading-tight min-h-[24px] flex items-center justify-center">{l === 'hi' ? skin.nameHi : skin.name}</p>
                {owned ? (
                  <div className={`${selected ? 'bg-yellow-400 text-black' : 'bg-blue-500 text-white'} mt-1 py-1 rounded-md text-[10px] font-black`}>{selected ? '✓ ON' : 'EQUIP'}</div>
                ) : skin.premium ? (
                  <div className="mt-1 py-1 rounded-md text-[10px] font-black bg-purple-500/40 text-purple-100">IAP</div>
                ) : (
                  <div className={`${canBuy ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'} mt-1 py-1 rounded-md text-[10px] font-black flex items-center justify-center gap-0.5`}>🪙 {skin.price}</div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-28">
          {(Object.keys(THEMES) as ThemeName[]).map((tn: ThemeName) => {
            const th = THEMES[tn];
            const selected = save.selectedTheme === tn;
            return (
              <button key={tn} onClick={() => { const ns = { ...save, selectedTheme: tn }; saveSave(ns); onUpdate(ns); }} className={`bg-white/[0.04] backdrop-blur-sm border rounded-xl p-3 active:scale-95 transition-all ${selected ? 'border-yellow-400 ring-2 ring-yellow-400/40' : 'border-white/10 hover:bg-white/10'}`}>
                <div className="h-20 rounded-lg mb-2 overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${th.bgGradient[0]}, ${th.bgGradient[1]})` }}>
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-16 rounded" style={{ backgroundColor: th.roadColor, border: `2px solid ${th.roadEdge}`, boxShadow: `0 0 16px ${th.ambientColor}40` }} />
                  </div>
                  {selected ? <div className="absolute top-1 right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-black text-xs font-black">✓</div> : null}
                </div>
                <p className="text-white font-bold text-xs">{th.label}</p>
                <p className={`text-[10px] mt-1 font-bold ${selected ? 'text-yellow-400' : 'text-white/50'}`}>{selected ? '✓ ACTIVE' : 'SELECT'}</p>
              </button>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export function SettingsScreen({ save, onUpdate, onBack, onReset }: {
  save: SaveData; onUpdate: (s: SaveData) => void; onBack: () => void; onReset: () => void;
}) {
  const theme = THEMES[save.selectedTheme];
  const l = lang(save);
  const [showReset, setShowReset] = useState(false);
  const [legalModal, setLegalModal] = useState<null | 'privacy' | 'terms'>(null);

  const toggle = (key: 'sound' | 'music' | 'vibration' | 'colorBlind') => {
    const newSave = { ...save, settings: { ...save.settings, [key]: !save.settings[key] } };
    saveSave(newSave);
    onUpdate(newSave);
  };

  const toggleLang = () => {
    const newLang: Language = save.settings.language === 'en' ? 'hi' : 'en';
    const newSave = { ...save, settings: { ...save.settings, language: newLang } };
    saveSave(newSave);
    onUpdate(newSave);
  };

  return (
    <>
      <PageShell theme={theme} title="Settings" icon="⚙️" onBack={onBack} right={<div className="w-14" />}>
        <div className="space-y-4">
          <SettingsSection title="Audio & Feedback">
            {([
              ['sound', '🔊', t('sound', l), 'Game sounds and effects'],
              ['music', '🎵', t('music', l), 'Background music'],
              ['vibration', '📳', t('vibration', l), 'Haptic feedback'],
            ] as ['sound' | 'music' | 'vibration', string, string, string][]).map(([key, icon, label, desc]) => (
              <SettingRow key={key} icon={icon} label={label} desc={desc} right={<Toggle on={save.settings[key]} onClick={() => toggle(key)} />} />
            ))}
          </SettingsSection>

          <SettingsSection title="Display">
            <SettingRow icon="👁️" label={t('colorBlind', l)} desc="Enhanced contrast palette" right={<Toggle on={save.settings.colorBlind} onClick={() => toggle('colorBlind')} />} />
            <SettingRow icon="🌐" label={t('language', l)} desc="English / हिंदी" right={<button onClick={toggleLang} className="px-3 py-1.5 bg-blue-500/90 text-white font-bold rounded-lg text-xs active:scale-95 transition-transform">{save.settings.language === 'en' ? 'EN' : 'हि'}</button>} />
          </SettingsSection>

          <SettingsSection title="📊 Your Stats">
            <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <StatItem label={t('gamesPlayed', l)} value={save.totalGamesPlayed.toString()} />
              <StatItem label={t('totalDistance', l)} value={`${Math.floor(save.totalDistanceRun)}m`} />
              <StatItem label={t('totalCoinsEarned', l)} value={save.totalCoinsEarned.toLocaleString()} />
              <StatItem label={t('endlessBest', l)} value={save.endlessHighScore.toString()} />
            </div>
          </SettingsSection>

          <SettingsSection title={`🏆 Achievements (${save.achievements.length}/${ACHIEVEMENTS.length})`}>
            <div className="max-h-44 overflow-y-auto px-2 py-2 space-y-1">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = save.achievements.includes(a.id);
                return (
                  <div key={a.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${unlocked ? 'bg-green-500/10 border border-green-500/20' : 'opacity-50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${unlocked ? 'bg-yellow-500/20' : 'bg-white/5'}`}>{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold leading-tight">{l === 'hi' ? a.nameHi : a.name}</p>
                      <p className="text-white/45 text-[11px] mt-0.5 leading-tight truncate">{l === 'hi' ? a.descriptionHi : a.description}</p>
                    </div>
                    {unlocked ? <span className="text-green-400 text-sm font-bold">✓</span> : null}
                  </div>
                );
              })}
            </div>
          </SettingsSection>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><span>📄</span> Legal & Privacy</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setLegalModal('privacy')} className="py-3 bg-white/10 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">Privacy In App</button>
              <button onClick={() => window.open('/privacy.html', '_blank')} className="py-3 bg-blue-500/80 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">Privacy Browser</button>
              <button onClick={() => setLegalModal('terms')} className="py-3 bg-white/10 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">Terms In App</button>
              <button onClick={() => window.open('/terms_of_service.html', '_blank')} className="py-3 bg-blue-500/80 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">Terms Browser</button>
            </div>
          </div>

          <div className="pt-2 pb-8">
            {!showReset ? (
              <button onClick={() => setShowReset(true)} className="w-full py-3 text-red-400/80 text-sm font-semibold border border-red-500/20 rounded-xl active:scale-95 transition-transform hover:bg-red-500/5">🗑️ Reset All Data</button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <p className="text-white text-sm mb-3 text-center">{t('areYouSure', l)}</p>
                <div className="flex gap-2">
                  <button onClick={() => { onReset(); setShowReset(false); }} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform">{t('yes', l)}</button>
                  <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 bg-white/10 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform">{t('cancel', l)}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageShell>

      {legalModal ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setLegalModal(null)}>
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="text-white text-lg font-bold mb-3">{legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h3>
            <div className="max-h-[50dvh] overflow-y-auto text-white/75 text-sm leading-relaxed space-y-3 pr-1">
              {legalModal === 'privacy' ? (
                <>
                  <p>City Glide does not collect or store personal information.</p>
                  <p>All game progress is saved locally on your device only.</p>
                  <p>Third-party ad SDKs may process device identifiers for ad delivery and measurement.</p>
                  <p>No login or account is required. Target age: 13+.</p>
                </>
              ) : (
                <>
                  <p>By playing City Glide, you agree to fair use of the app.</p>
                  <p>In-app purchases are optional and non-refundable except as required by law.</p>
                  <p>Ads support free gameplay. Cosmetic purchases only. No pay-to-win mechanics.</p>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setLegalModal(null)} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold text-sm">Close</button>
              <button onClick={() => window.open(legalModal === 'privacy' ? '/privacy.html' : '/terms_of_service.html', '_blank')} className="flex-1 py-3 bg-blue-500/80 text-white rounded-xl font-bold text-sm">Open Browser</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function DailyRewardsScreen({ save, onUpdate, onBack }: {
  save: SaveData; onUpdate: (s: SaveData) => void; onBack: () => void;
}) {
  const theme = THEMES[save.selectedTheme];
  const l = lang(save);
  const today = new Date().toISOString().split('T')[0];
  const canClaim = save.dailyRewardLastClaim !== today;
  const streak = save.dailyRewardStreak % 7;
  const currentDay = canClaim ? streak : (streak + 1) % 7;

  const claim = () => {
    if (!canClaim) return;
    const reward = DAILY_REWARDS[currentDay];
    const newSave = addCoins({ ...save }, reward.coins);
    newSave.dailyRewardLastClaim = today;
    newSave.dailyRewardStreak = (save.dailyRewardStreak % 7) + 1;
    saveSave(newSave);
    onUpdate(newSave);
  };

  return (
    <PageShell theme={theme} title="Daily" icon="🎁" onBack={onBack} right={<div className="w-14" />}>
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
        <div className="text-3xl">🔥</div>
        <div className="flex-1">
          <p className="text-white/60 text-xs">{t('streak', l)}</p>
          <p className="text-white text-2xl font-black">{save.dailyRewardStreak} <span className="text-sm font-normal text-white/60">days</span></p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider px-1 mb-3">7-Day Rewards</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {DAILY_REWARDS.map((r, i: number) => {
            const claimed = i < currentDay || (i === currentDay && !canClaim);
            const isCurrent = i === currentDay && canClaim;
            return (
              <div key={i} className={`aspect-[2/3] rounded-xl flex flex-col items-center justify-center p-1 ${isCurrent ? 'bg-yellow-500/20 border-2 border-yellow-400 animate-pulse' : claimed ? 'bg-green-500/15 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}>
                <p className="text-white/60 text-[9px] font-bold">D{r.day}</p>
                <div className="text-base my-0.5">🪙</div>
                <p className="text-white text-[11px] font-bold leading-none">{r.coins}</p>
                {claimed ? <p className="text-green-400 text-[10px] mt-0.5">✓</p> : null}
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={claim} disabled={!canClaim} className={`w-full mt-4 py-4 rounded-2xl font-bold text-base shadow-2xl active:scale-95 transition-all ${canClaim ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-yellow-500/30' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}>
        {canClaim ? `🎁 Claim Day ${currentDay + 1} Reward` : `✅ ${t('alreadyClaimed', l)}`}
      </button>

      <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center text-xl">📺</div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{t('doubleReward', l)}</p>
            <p className="text-white/50 text-xs mt-0.5">Get bonus coins instantly</p>
          </div>
        </div>
        <button onClick={() => { const newSave = addCoins({ ...save }, ECONOMY.rewardedAdCoins); saveSave(newSave); onUpdate(newSave); }} className="w-full py-2.5 bg-purple-500 text-white font-bold text-sm rounded-xl active:scale-95 transition-transform">
          Watch & Earn 🪙 {ECONOMY.rewardedAdCoins}
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider px-1 mb-3">🎯 {t('dailyChallenges', l)}</h3>
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl divide-y divide-white/5">
          {getDailyChallenges().map((ch, i) => {
            const progress = save.dailyChallenges.challenges[i]?.progress || 0;
            const completed = save.dailyChallenges.challenges[i]?.completed || false;
            const claimed = save.dailyChallenges.challenges[i]?.claimed || false;
            const pct = Math.min(100, (progress / ch.target) * 100);
            return (
              <div key={ch.id} className="px-4 py-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{ch.icon}</span>
                  <span className="text-white text-sm font-medium flex-1">{l === 'hi' ? ch.descriptionHi : ch.description}</span>
                  <span className={`text-xs font-bold ${completed ? 'text-yellow-400' : 'text-white/50'}`}>{claimed ? '✓' : completed ? `+${ch.reward}` : `${Math.min(progress, ch.target)}/${ch.target}`}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
                {completed && !claimed ? (
                  <button className="mt-2.5 w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl text-xs active:scale-95 transition-transform" onClick={() => { const newSave = addCoins({ ...save }, ch.reward); newSave.dailyChallenges.challenges[i] = { ...newSave.dailyChallenges.challenges[i], claimed: true }; saveSave(newSave); onUpdate(newSave); }}>
                    🎁 Claim 🪙 {ch.reward}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
