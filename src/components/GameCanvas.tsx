// ===== City Glide: 3-Lane Rush V2.0 — Game Canvas Component =====
import { useRef, useEffect, useCallback, useState } from 'react';
import { GameEngine, EngineCallbacks } from '../game/engine';
import type { LevelDef, GameRunState, Language, PowerUpType, SkinDef } from '../game/types';
import { SKINS, t } from '../game/data';
import { Audio } from '../game/managers';

// In-game floating hints (Subway Surfers style) - only first 8 seconds
function FirstTimeHints() {
  const [phase, setPhase] = useState<'swipe' | 'jump' | 'collect' | 'done'>('swipe');
  useEffect(() => {
    const seen = localStorage.getItem('cityglide_hints_seen');
    if (seen) { setPhase('done'); return; }
    const t1 = setTimeout(() => setPhase('jump'), 3000);
    const t2 = setTimeout(() => setPhase('collect'), 6000);
    const t3 = setTimeout(() => {
      setPhase('done');
      localStorage.setItem('cityglide_hints_seen', '1');
    }, 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  if (phase === 'done') return null;
  return (
    <div className="absolute top-1/2 left-0 right-0 flex justify-center pointer-events-none z-20" style={{ transform: 'translateY(-50%)' }}>
      <div className="bg-black/60 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full shadow-2xl animate-pulse"
        style={{ animation: 'hintFade 3s ease-in-out infinite' }}>
        <p className="text-white font-bold text-sm whitespace-nowrap">
          {phase === 'swipe' && '👆 Swipe ← → to switch lanes'}
          {phase === 'jump' && '☝️ Swipe UP to jump'}
          {phase === 'collect' && '🪙 Collect coins!'}
        </p>
      </div>
      <style>{`
        @keyframes hintFade {
          0%, 100% { opacity: 0.7; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

interface GameCanvasProps {
  level: LevelDef;
  endless?: boolean;
  skinId: string;
  colorBlind: boolean;
  vibration: boolean;
  soundEnabled: boolean;
  language: Language;
  onGameOver: (state: GameRunState) => void;
  onLevelComplete: (state: GameRunState) => void;
}

export default function GameCanvas({
  level, endless, skinId, colorBlind, vibration, soundEnabled, language,
  onGameOver, onLevelComplete,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState(3); // 3, 2, 1, 0 = GO
  const [showGo, setShowGo] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [puToast, setPuToast] = useState<{ icon: string; label: string; color: string; key: number } | null>(null);

  const skin: SkinDef = SKINS.find((s: SkinDef) => s.id === skinId) || SKINS[0];

  // Countdown effect
  useEffect(() => {
    if (countdown <= 0) {
      setShowGo(true);
      const goTimer = setTimeout(() => setShowGo(false), 600);
      // Start engine after countdown
      if (engineRef.current) {
        engineRef.current.resume();
      }
      return () => clearTimeout(goTimer);
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 700);
    return () => clearTimeout(timer);
  }, [countdown]);

  const callbacks: EngineCallbacks = {
    onGameOver: (state: GameRunState) => onGameOver(state),
    onLevelComplete: (state: GameRunState) => onLevelComplete(state),
    onCoinCollect: () => {},
    onScoreUpdate: (s: number, c: number, d: number) => { setScore(s); setCoins(c); setDistance(d); },
    onPowerUp: (type: PowerUpType) => {
      const data: Record<string, { icon: string; label: string; color: string }> = {
        magnet: { icon: '🧲', label: 'MAGNET! Coins attracted', color: 'from-red-500 to-pink-500' },
        shield: { icon: '🛡️', label: 'SHIELD! 1 hit blocked', color: 'from-blue-500 to-cyan-500' },
        doubleCoins: { icon: '💰', label: '2x COINS! Bonus active', color: 'from-yellow-500 to-orange-500' },
        speedBurst: { icon: '⚡', label: 'SPEED BOOST! Run faster', color: 'from-green-500 to-emerald-500' },
      };
      const info = data[type];
      if (info) setPuToast({ ...info, key: Date.now() });
    },
  };

  // Auto-dismiss power-up toast
  useEffect(() => {
    if (!puToast) return;
    const t = setTimeout(() => setPuToast(null), 2000);
    return () => clearTimeout(t);
  }, [puToast]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current, callbacks);
    engine.colorBlind = colorBlind;
    engine.vibrationEnabled = vibration;
    engine.setSkin(skin.color, skin.accent, skin.trail);
    engineRef.current = engine;

    requestAnimationFrame(() => {
      engine.resize();
      engine.start(level, endless);
      engine.setPaused(true); // Pause until countdown finishes
    });

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      engine.cleanup();
      window.removeEventListener('resize', onResize);
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Audio.enabled = soundEnabled;
  }, [soundEnabled]);

  const togglePause = useCallback(() => {
    if (!engineRef.current || countdown > 0) return;
    const newPaused = !engineRef.current.paused;
    engineRef.current.setPaused(newPaused);
    setPaused(newPaused);
    if (!newPaused) engineRef.current.resume();
  }, [countdown]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        style={{ imageRendering: 'auto' }}
      />

      {/* Countdown - Clear, Light, Visible (NOT blurred) */}
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          {/* Subtle dim - NOT heavy blur */}
          <div className="absolute inset-0 bg-black/25" />
          {/* Big visible countdown number */}
          <div className="relative" key={countdown}>
            <div className="text-white font-black leading-none"
              style={{
                fontSize: '14rem',
                textShadow: '0 0 30px rgba(255,255,255,0.8), 0 6px 20px rgba(0,0,0,0.6)',
                animation: 'pop 0.7s ease-out',
              }}>
              {countdown}
            </div>
          </div>
          <style>{`
            @keyframes pop {
              0% { transform: scale(0.3); opacity: 0; }
              50% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* GO! Flash */}
      {showGo && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-green-400 font-black"
            style={{
              fontSize: '8rem',
              textShadow: '0 0 40px rgba(74,222,128,1), 0 6px 20px rgba(0,0,0,0.6)',
              animation: 'goFlash 0.6s ease-out',
            }}>
            GO!
          </div>
          <style>{`
            @keyframes goFlash {
              0% { transform: scale(0.3); opacity: 0; }
              30% { transform: scale(1.3); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* In-Game Hints - Subway Surfers style (only shown briefly) */}
      <FirstTimeHints />

      {/* Power-Up Pickup Toast */}
      {puToast && (
        <div key={puToast.key} className="absolute top-24 left-0 right-0 flex justify-center pointer-events-none z-25">
          <div className={`bg-gradient-to-r ${puToast.color} text-white font-black px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/60`}
            style={{ animation: 'puPop 0.4s ease-out, puFade 2.5s ease-in-out forwards' }}>
            <span className="text-4xl">{puToast.icon}</span>
            <span className="text-lg">{puToast.label}</span>
          </div>
          <style>{`
            @keyframes puPop {
              0% { transform: translateY(-30px) scale(0.5); opacity: 0; }
              60% { transform: translateY(0) scale(1.1); opacity: 1; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes puFade {
              0%, 70% { opacity: 1; }
              100% { opacity: 0; transform: translateY(-10px); }
            }
          `}</style>
        </div>
      )}

      {/* Pause Button - BIG touch target, instant response */}
      <button
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); togglePause(); }}
        className="fixed right-3 w-14 h-14 bg-black/70 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-2xl z-40 active:scale-90 transition-transform border-2 border-white/30 shadow-2xl"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}
      >
        {paused ? '▶' : '⏸'}
      </button>

      {/* Level info pill */}
      <div className="fixed left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full z-30 border border-white/20"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 90px)' }}>
        <span className="text-white text-xs font-bold">
          {endless ? '♾️ Endless' : `Level ${level.id}`}
        </span>
      </div>

      {/* Pause Menu Overlay - Clean Card Design */}
      {paused && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 px-6">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-xs shadow-2xl">
            {/* Title */}
            <div className="text-center mb-5">
              <div className="text-5xl mb-2">⏸️</div>
              <h2 className="text-white text-2xl font-black">{t('paused', language)}</h2>
            </div>

            {/* Stats */}
            <div className="bg-white/5 rounded-2xl p-3 mb-5 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase">Score</p>
                <p className="text-white text-base font-black mt-0.5">{score}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase">Coins</p>
                <p className="text-yellow-400 text-base font-black mt-0.5">{coins}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase">Dist</p>
                <p className="text-white text-base font-black mt-0.5">{distance}m</p>
              </div>
            </div>

            {/* Buttons - Standard Game Size */}
            <button
              onClick={togglePause}
              className="w-full h-14 mb-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl text-lg active:scale-95 transition-transform shadow-2xl shadow-green-500/40 flex items-center justify-center gap-2 border-2 border-white/20"
            >
              <span className="text-2xl">▶</span> RESUME
            </button>
            <button
              onClick={() => {
                if (engineRef.current) {
                  engineRef.current.running = false;
                  engineRef.current.cleanup();
                }
                onGameOver({
                  mode: endless ? 'endless' : 'level',
                  levelId: level.id,
                  score, coins, distance, hits: 99,
                  speed: 0, elapsed: 0, combo: 0, maxCombo: 0,
                  completed: false, failed: true, continued: false, perfectRun: false,
                });
              }}
              className="w-full h-12 bg-red-500/20 border-2 border-red-400/40 text-white font-bold rounded-2xl text-base active:scale-95 transition-transform"
            >
              ✕ QUIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
