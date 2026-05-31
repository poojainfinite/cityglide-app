// ===== City Glide: 3-Lane Rush — Game Engine =====
import type { LevelDef, Obstacle, Coin, PowerUpEntity, Particle, ActivePowerUps, PlayerState, GameRunState, PowerUpType, Theme } from './types';
import { THEMES } from './data';
import { Audio, vibrate } from './managers';

let nextId = 1;
const uid = () => nextId++;

export interface EngineCallbacks {
  onGameOver: (state: GameRunState) => void;
  onLevelComplete: (state: GameRunState) => void;
  onCoinCollect: (total: number) => void;
  onScoreUpdate: (score: number, coins: number, distance: number) => void;
  onPowerUp: (type: PowerUpType, remaining: number) => void;
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  running = false;
  paused = false;
  animFrameId = 0;
  lastTime = 0;

  // Performance safety caps (helps avoid hangs on long sessions / low-end phones)
  readonly MAX_OBSTACLES = 24;
  readonly MAX_COINS = 80;
  readonly MAX_POWERUPS = 8;
  readonly MAX_PARTICLES = 180;
  readonly MAX_SPEED_LINES = 50;

  // Road geometry
  roadWidth = 0;
  roadLeft = 0;
  laneWidth = 0;
  laneXs: number[] = [];

  // Game state
  level!: LevelDef;
  theme!: Theme;
  player!: PlayerState;
  run!: GameRunState;
  obstacles: Obstacle[] = [];
  coins: Coin[] = [];
  powerUps: PowerUpEntity[] = [];
  particles: Particle[] = [];
  activePowerUps: ActivePowerUps = { magnet: 0, shield: 0, doubleCoins: 0, speedBurst: 0 };

  // Spawn timers
  obstacleTimer = 0;
  coinTimer = 0;
  powerUpTimer = 0;

  // Visual state
  scrollOffset = 0;
  shakeAmount = 0;
  shakeDuration = 0;
  speedLines: { x: number; y: number; len: number; speed: number }[] = [];
  decorOffset = 0;
  flashAlpha = 0;
  flashColor = '#fff';

  // Input
  touchStartX = 0;
  touchStartY = 0;
  touchStartTime = 0;

  // Callbacks
  cb: EngineCallbacks;

  // Settings
  colorBlind = false;
  vibrationEnabled = true;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cb = callbacks;
    this.resize();
    this.setupInput();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Wider road for better mobile immersion (Subway Surfers style)
    this.roadWidth = Math.min(this.width * 0.85, 420);
    this.roadLeft = (this.width - this.roadWidth) / 2;
    this.laneWidth = this.roadWidth / 3;
    this.laneXs = [
      this.roadLeft + this.laneWidth * 0.5,
      this.roadLeft + this.laneWidth * 1.5,
      this.roadLeft + this.laneWidth * 2.5,
    ];
  }

  setupInput() {
    // Keyboard
    window.addEventListener('keydown', this.onKeyDown);
    // Touch
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: true });
    // Mouse (for desktop testing)
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
  }

  cleanup() {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
  }

  // ---- INPUT HANDLERS ----
  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.running || this.paused) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') this.moveLane(-1);
    else if (e.key === 'ArrowRight' || e.key === 'd') this.moveLane(1);
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') this.jump();
    else if (e.key === 'Escape' || e.key === 'p') this.togglePause();
  };

  private onTouchStart = (e: TouchEvent) => {
    if (!this.running || this.paused) return;
    const t = e.touches[0];
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
    this.touchStartTime = Date.now();
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (!this.running || this.paused) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    const dt = Date.now() - this.touchStartTime;
    if (dt > 500) return; // too slow
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 20;
    if (absDx > absDy && absDx > threshold) {
      this.moveLane(dx > 0 ? 1 : -1);
    } else if (absDy > threshold && dy < 0) {
      this.jump();
    }
  };

  private mouseDownX = 0;
  private mouseDownY = 0;
  private onMouseDown = (e: MouseEvent) => {
    if (!this.running || this.paused) return;
    this.mouseDownX = e.clientX;
    this.mouseDownY = e.clientY;
  };
  private onMouseUp = (e: MouseEvent) => {
    if (!this.running || this.paused) return;
    const dx = e.clientX - this.mouseDownX;
    const dy = e.clientY - this.mouseDownY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 15;
    if (absDx > absDy && absDx > threshold) {
      this.moveLane(dx > 0 ? 1 : -1);
    } else if (absDy > threshold && dy < 0) {
      this.jump();
    } else if (absDx < 5 && absDy < 5) {
      // Tap - check if left or right side of screen
      const rect = this.canvas.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      if (relX < rect.width / 3) this.moveLane(-1);
      else if (relX > rect.width * 2 / 3) this.moveLane(1);
      else this.jump();
    }
  };

  // ---- ACTIONS ----
  moveLane(dir: number) {
    const newLane = Math.max(0, Math.min(2, this.player.targetLane + dir));
    if (newLane !== this.player.targetLane) {
      this.player.targetLane = newLane;
      Audio.laneSwitch();
      for (let i = 0; i < 6; i++) {
        this.particles.push({ x: this.player.x, y: this.player.y + 15, vx: (Math.random() - 0.5) * 80, vy: Math.random() * 20 + 10, life: 0.3, maxLife: 0.3, color: '#ffffff', size: 2 + Math.random() * 2 });
      }
    }
  }

  jump() {
    if (!this.player.jumping) {
      this.player.jumping = true;
      this.player.jumpProgress = 0;
      Audio.jump();
    }
  }

  togglePause() {
    this.paused = !this.paused;
  }

  // ---- START ----
  start(level: LevelDef, endless = false) {
    this.level = level;
    this.theme = THEMES[level.theme];
    this.running = true;
    this.paused = false;
    nextId = 1;

    this.player = {
      lane: 1, targetLane: 1,
      x: this.laneXs[1], y: this.height * 0.78,
      jumping: false, jumpProgress: 0, jumpHeight: 0,
      invincible: 0,
    };

    this.run = {
      mode: endless ? 'endless' : 'level',
      levelId: level.id,
      score: 0, coins: 0, distance: 0, hits: 0,
      speed: level.baseSpeed,
      elapsed: 0, combo: 0, maxCombo: 0,
      completed: false, failed: false, continued: false, perfectRun: true,
    };

    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
    this.particles = [];
    this.activePowerUps = { magnet: 0, shield: 0, doubleCoins: 0, speedBurst: 0 };
    this.obstacleTimer = 0;
    this.coinTimer = 0;
    this.powerUpTimer = 0;
    this.scrollOffset = 0;
    this.shakeAmount = 0;
    this.speedLines = [];
    this.flashAlpha = 0;

    this.lastTime = performance.now();
    this.loop();
  }

  // ---- GAME LOOP ----
  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05); // cap at 50ms
    this.lastTime = now;

    try {
      if (!this.paused) {
        this.update(dt);
      }
      this.render();
    } catch (e) {
      console.error('Game render error:', e);
    }
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  // ---- UPDATE ----
  private update(dt: number) {
    this.run.elapsed += dt;

    // Speed ramp
    this.run.speed = this.level.baseSpeed + this.level.speedIncrease * this.run.elapsed;
    if (this.activePowerUps.speedBurst > 0) this.run.speed *= 1.5;
    const speed = this.run.speed;

    // Scroll
    this.scrollOffset += speed * dt;
    this.decorOffset += speed * dt * 0.3;
    this.run.distance += speed * dt * 0.05; // scale to "meters"
    this.run.score = Math.floor(this.run.distance) + this.run.coins * 10;

    // Player movement
    const targetX = this.laneXs[this.player.targetLane];
    this.player.x += (targetX - this.player.x) * Math.min(1, dt * 15);
    this.player.lane = this.player.targetLane;

    // Jump
    if (this.player.jumping) {
      this.player.jumpProgress += dt * 3.5;
      if (this.player.jumpProgress >= 1) {
        this.player.jumping = false;
        this.player.jumpProgress = 0;
        this.player.jumpHeight = 0;
        for (let i = 0; i < 8; i++) {
          this.particles.push({ x: this.player.x + (Math.random() - 0.5) * 20, y: this.player.y + 20, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 30, life: 0.3, maxLife: 0.3, color: '#aaa', size: 2 + Math.random() * 2 });
        }
      } else {
        this.player.jumpHeight = Math.sin(this.player.jumpProgress * Math.PI) * 60;
      }
    }

    // Invincibility timer
    if (this.player.invincible > 0) this.player.invincible -= dt;

    // Power-up timers
    for (const key of Object.keys(this.activePowerUps) as (keyof ActivePowerUps)[]) {
      if (this.activePowerUps[key] > 0) {
        this.activePowerUps[key] -= dt;
        if (this.activePowerUps[key] <= 0) this.activePowerUps[key] = 0;
      }
    }

    // Spawn obstacles
    this.obstacleTimer += dt * 1000;
    if (this.obstacleTimer >= this.level.obstacleInterval) {
      this.obstacleTimer = 0;
      this.spawnObstacle();
    }

    // Spawn coins
    this.coinTimer += dt * 1000;
    if (this.coinTimer >= this.level.coinInterval) {
      this.coinTimer = 0;
      this.spawnCoinRow();
    }

    // Spawn power-ups
    this.powerUpTimer += dt * 1000;
    if (this.powerUpTimer >= this.level.powerUpInterval) {
      this.powerUpTimer = 0;
      this.spawnPowerUp();
    }

    // Update obstacles
    for (const obs of this.obstacles) {
      obs.y += speed * dt;
      if (obs.moving) {
        obs.lane = Math.max(0, Math.min(2, obs.lane));
        // Moving obstacles don't change lanes in this version
      }
    }

    // Update coins
    for (const coin of this.coins) {
      if (coin.collected) continue;
      coin.y += speed * dt;
      // Magnet effect
      if (this.activePowerUps.magnet > 0) {
        const px = this.player.x;
        const py = this.player.y - this.player.jumpHeight;
        const cx = this.laneXs[coin.lane];
        const cy = coin.y;
        const dist = Math.hypot(px - cx, py - cy);
        if (dist < 180) {
          coin.magnetTarget = true;
          const angle = Math.atan2(py - cy, px - cx);
          coin.mx += Math.cos(angle) * 600 * dt;
          coin.my += Math.sin(angle) * 600 * dt;
        }
      }
    }

    // Update power-ups
    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      pu.y += speed * dt;
    }

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }

    // Speed lines
    if (speed > 350) {
      if (Math.random() < dt * 10 && this.speedLines.length < this.MAX_SPEED_LINES) {
        this.speedLines.push({
          x: this.roadLeft + Math.random() * this.roadWidth,
          y: -20,
          len: 20 + Math.random() * 40,
          speed: speed * 1.5,
        });
      }
    }
    for (const sl of this.speedLines) {
      sl.y += sl.speed * dt;
    }

    // Screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) this.shakeAmount = 0;
    }

    // Flash
    if (this.flashAlpha > 0) this.flashAlpha -= dt * 4;

    // Collisions
    this.checkCollisions();

    // Cleanup + hard caps for performance stability
    this.obstacles = this.obstacles.filter(o => o.y < this.height + 100).slice(-this.MAX_OBSTACLES);
    this.coins = this.coins.filter(c => c.y < this.height + 50 && !c.collected).slice(-this.MAX_COINS);
    this.powerUps = this.powerUps.filter(p => p.y < this.height + 50 && !p.collected).slice(-this.MAX_POWERUPS);
    this.particles = this.particles.filter(p => p.life > 0).slice(-this.MAX_PARTICLES);
    this.speedLines = this.speedLines.filter(sl => sl.y < this.height + 50).slice(-this.MAX_SPEED_LINES);

    // Check level completion
    if (this.run.mode === 'level') {
      if (this.run.distance >= this.level.distanceGoal && this.run.coins >= this.level.coinGoal) {
        this.run.completed = true;
        this.running = false;
        Audio.levelComplete();
        this.cb.onLevelComplete({ ...this.run });
      }
    }

    // Callbacks
    this.cb.onScoreUpdate(this.run.score, this.run.coins, Math.floor(this.run.distance));
  }

  // ---- SPAWNING ----
  private spawnObstacle() {
    const types = this.level.obstacleTypes;
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * 3);

    // Avoid spawning on top of recent obstacles in same lane
    const recent = this.obstacles.filter(o => o.lane === lane && o.y < 100);
    if (recent.length > 0) return;

    const obs: Obstacle = {
      id: uid(),
      lane,
      y: -80,
      type,
      width: type === 'gap' ? this.laneWidth * 0.8 : this.laneWidth * 0.6,
      height: type === 'car' ? 70 : type === 'gap' ? 40 : 30,
      moving: this.level.hasMovingObstacles && Math.random() < 0.15,
      moveDir: Math.random() < 0.5 ? -1 : 1,
      moveSpeed: 50,
    };
    this.obstacles.push(obs);

    // Sometimes spawn a second obstacle in a different lane for harder levels
    if (this.level.id > 5 && Math.random() < 0.3) {
      let lane2 = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
      const obs2: Obstacle = { ...obs, id: uid(), lane: lane2, y: -80 };
      this.obstacles.push(obs2);
    }
  }

  private spawnCoinRow() {
    const lane = Math.floor(Math.random() * 3);
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      this.coins.push({
        id: uid(),
        lane,
        y: -60 - i * 45,
        collected: false,
        magnetTarget: false,
        mx: 0, my: 0,
      });
    }
  }

  private spawnPowerUp() {
    // V2.0: Magnet & Shield are primary (70%), others are rare (30%)
    const roll = Math.random();
    const type: PowerUpType = roll < 0.35 ? 'magnet' : roll < 0.70 ? 'shield' : roll < 0.85 ? 'doubleCoins' : 'speedBurst';
    const lane = Math.floor(Math.random() * 3);
    this.powerUps.push({
      id: uid(),
      lane,
      y: -60,
      type,
      collected: false,
    });
  }

  // ---- COLLISIONS ----
  private checkCollisions() {
    const px = this.player.x;
    const py = this.player.y;
    // player hitbox size used in collision checks below
    const jumpH = this.player.jumpHeight;

    // Coins
    for (const coin of this.coins) {
      if (coin.collected) continue;
      const cx = coin.magnetTarget ? this.laneXs[coin.lane] + coin.mx : this.laneXs[coin.lane];
      const cy = coin.magnetTarget ? coin.y + coin.my : coin.y;
      const dist = Math.hypot(px - cx, (py - jumpH) - cy);
      if (dist < 30) {
        coin.collected = true;
        const mult = this.activePowerUps.doubleCoins > 0 ? 2 : 1;
        this.run.coins += mult;
        this.run.combo++;
        this.run.maxCombo = Math.max(this.run.maxCombo, this.run.combo);
        Audio.coin();
        this.spawnCoinParticles(cx, cy);
        this.cb.onCoinCollect(this.run.coins);
      }
    }

    // Power-ups
    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      const pux = this.laneXs[pu.lane];
      const dist = Math.hypot(px - pux, (py - jumpH) - pu.y);
      if (dist < 35) {
        pu.collected = true;
        this.activatePowerUp(pu.type);
        Audio.powerUp();
        this.spawnPowerUpParticles(pux, pu.y, pu.type);
        this.flash('#ffffff', 0.3);
      }
    }

    // Obstacles
    if (this.player.invincible > 0) return;
    for (const obs of this.obstacles) {
      const ox = this.laneXs[obs.lane];
      const dist = Math.hypot(px - ox, py - obs.y);
      const hitDist = obs.type === 'gap' ? 25 : 30;

      // Jumping over gaps and cones
      if (jumpH > 20 && (obs.type === 'gap' || obs.type === 'cone')) continue;

      if (dist < hitDist) {
        if (this.activePowerUps.shield > 0) {
          this.activePowerUps.shield = 0;
          this.obstacles = this.obstacles.filter(o => o.id !== obs.id);
          this.spawnHitParticles(px, py, '#3b82f6');
          this.flash('#3b82f6', 0.3);
          Audio.coin();
          return;
        }

        this.run.hits++;
        this.run.perfectRun = false;
        this.run.combo = 0;
        this.player.invincible = 1.5;
        Audio.hit();
        if (this.vibrationEnabled) vibrate(100);
        this.shake(8, 0.3);
        this.flash('#ef4444', 0.4);
        this.spawnHitParticles(px, py, '#ef4444');

        if (this.run.mode === 'level' && this.run.hits > this.level.maxHits) {
          this.run.failed = true;
          this.running = false;
          Audio.gameOver();
          this.cb.onGameOver({ ...this.run });
        } else if (this.run.mode === 'endless') {
          this.run.failed = true;
          this.running = false;
          Audio.gameOver();
          this.cb.onGameOver({ ...this.run });
        }
        return;
      }
    }
  }

  private activatePowerUp(type: PowerUpType) {
    const durations: Record<PowerUpType, number> = {
      magnet: 8, shield: 12, doubleCoins: 10, speedBurst: 5,
    };
    this.activePowerUps[type] = durations[type];
    this.cb.onPowerUp(type, durations[type]);
  }

  // ---- PARTICLES ----
  private spawnCoinParticles(x: number, y: number) {
    const colors = ['#fbbf24', '#f59e0b', '#fde68a'];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x, y, vx: Math.cos(angle) * 120, vy: Math.sin(angle) * 120 - 50,
        life: 0.5, maxLife: 0.5, color: colors[i % 3], size: 3 + Math.random() * 3,
      });
    }
  }

  private spawnPowerUpParticles(x: number, y: number, type: PowerUpType) {
    const colors: Record<PowerUpType, string[]> = {
      magnet: ['#ef4444', '#f87171', '#fca5a5'],
      shield: ['#3b82f6', '#60a5fa', '#93c5fd'],
      doubleCoins: ['#fbbf24', '#f59e0b', '#fde68a'],
      speedBurst: ['#22c55e', '#4ade80', '#86efac'],
    };
    const c = colors[type];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      this.particles.push({
        x, y, vx: Math.cos(angle) * 150, vy: Math.sin(angle) * 150 - 30,
        life: 0.6, maxLife: 0.6, color: c[i % 3], size: 4 + Math.random() * 3,
      });
    }
  }

  private spawnHitParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.4, maxLife: 0.4, color, size: 2 + Math.random() * 4,
      });
    }
  }

  private shake(amount: number, duration: number) {
    this.shakeAmount = amount;
    this.shakeDuration = duration;
  }

  private flash(color: string, alpha: number) {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  // ---- RENDER ----
  private render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // Screen shake
    if (this.shakeAmount > 0) {
      const sx = (Math.random() - 0.5) * this.shakeAmount * 2;
      const sy = (Math.random() - 0.5) * this.shakeAmount * 2;
      ctx.translate(sx, sy);
    }

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, this.theme.bgGradient[0]);
    grad.addColorStop(1, this.theme.bgGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Side decorations
    this.renderSideDecor(ctx);

    // Road
    this.renderRoad(ctx);

    // Speed lines
    this.renderSpeedLines(ctx);

    // Coins
    this.renderCoins(ctx);

    // Power-ups
    this.renderPowerUps(ctx);

    // Obstacles
    this.renderObstacles(ctx);

    // Player
    this.renderPlayer(ctx);

    // Particles
    this.renderParticles(ctx);

    // HUD
    this.renderHUD(ctx);

    // Flash overlay
    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // Pause overlay
    if (this.paused) {
      // Just dim - React UI shows pause menu
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  private renderSideDecor(ctx: CanvasRenderingContext2D) {
    const h = this.height;
    const rl = this.roadLeft, rw = this.roadWidth;
    const sidewalkW = 35;

    // Sidewalks (3D look with shading)
    const swColor = this.theme.name === 'neon' ? '#1a0a2e' : '#5a5a5a';
    const swColorDark = this.theme.name === 'neon' ? '#0a0518' : '#3a3a3a';
    ctx.fillStyle = swColor;
    ctx.fillRect(rl - sidewalkW, 0, sidewalkW, h);
    ctx.fillRect(rl + rw, 0, sidewalkW, h);
    // Sidewalk pattern (concrete blocks)
    ctx.fillStyle = swColorDark;
    const blockOff = -(this.decorOffset * 0.4 % 40);
    for (let y = blockOff; y < h; y += 40) {
      ctx.fillRect(rl - sidewalkW, y, sidewalkW, 1);
      ctx.fillRect(rl + rw, y, sidewalkW, 1);
    }
    // Curb (yellow/red edge - like real road)
    ctx.fillStyle = this.theme.roadEdge;
    ctx.fillRect(rl - 3, 0, 3, h);
    ctx.fillRect(rl + rw, 0, 3, h);

    // Far layer - Detailed 3D Buildings (realistic colors)
    const farOff = (this.decorOffset * 0.18) % 180;
    const buildingPalette = this.theme.name === 'neon'
      ? ['#1a1040', '#2d1857', '#1f1535', '#15102a']
      : this.theme.name === 'desert'
      ? ['#a8754f', '#c2956a', '#8b5a3c', '#9b6845']
      : this.theme.name === 'snow'
      ? ['#5a6e80', '#6b8095', '#4d5e6f', '#7a8c9e']
      : ['#2d3142', '#3d4356', '#1f2433', '#252a3a'];

    for (let y = -250; y < h + 250; y += 90) {
      const dy = ((y + farOff) % (h + 450) + h + 450) % (h + 450) - 250;
      const seed = Math.abs(Math.floor(y / 90) * 7);
      const bw1 = 50 + (seed % 30);
      const bh1 = 100 + ((seed * 13) % 80);
      const bw2 = 45 + ((seed + 17) % 35);
      const bh2 = 90 + ((seed * 19) % 90);

      if (this.theme.name === 'desert') {
        // Realistic mountains with gradient
        ctx.fillStyle = this.theme.sideDecor;
        ctx.beginPath(); ctx.moveTo(rl - sidewalkW - bw1, dy);
        ctx.lineTo(rl - sidewalkW - bw1 / 2, dy - bh1);
        ctx.lineTo(rl - sidewalkW, dy); ctx.closePath(); ctx.fill();
        // Snow cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(rl - sidewalkW - bw1 * 0.7, dy - bh1 * 0.6);
        ctx.lineTo(rl - sidewalkW - bw1 / 2, dy - bh1);
        ctx.lineTo(rl - sidewalkW - bw1 * 0.3, dy - bh1 * 0.6); ctx.closePath(); ctx.fill();
        // Right mountain
        ctx.fillStyle = this.theme.sideDecorAlt;
        ctx.beginPath(); ctx.moveTo(rl + rw + sidewalkW, dy + 30);
        ctx.lineTo(rl + rw + sidewalkW + bw2 / 2, dy + 30 - bh2 * 0.8);
        ctx.lineTo(rl + rw + sidewalkW + bw2, dy + 30); ctx.closePath(); ctx.fill();
      } else {
        // === LEFT BUILDING (3D look) ===
        const lcolor = buildingPalette[seed % 4];
        const lcolorLight = this.adjColor(lcolor, 25);
        const lcolorDark = this.adjColor(lcolor, -20);
        const lx = rl - sidewalkW - bw1 - 5;

        // Main building body
        ctx.fillStyle = lcolor;
        ctx.fillRect(lx, dy - bh1, bw1, bh1);
        // Right edge (light - facing road)
        ctx.fillStyle = lcolorLight;
        ctx.fillRect(lx + bw1 - 3, dy - bh1, 3, bh1);
        // Top edge (lighter)
        ctx.fillStyle = lcolorDark;
        ctx.fillRect(lx, dy - bh1, bw1, 4);
        // Roof structure
        ctx.fillStyle = lcolorDark;
        ctx.fillRect(lx - 3, dy - bh1 - 5, bw1 + 6, 6);
        // AC unit on roof (some buildings)
        if (seed % 3 === 0) {
          ctx.fillStyle = this.adjColor(lcolor, 10);
          ctx.fillRect(lx + bw1 * 0.3, dy - bh1 - 14, bw1 * 0.4, 9);
          ctx.fillRect(lx + bw1 * 0.4, dy - bh1 - 18, bw1 * 0.2, 5);
        }
        // Antenna with red light (some buildings)
        if (seed % 5 === 0) {
          ctx.fillStyle = '#222';
          ctx.fillRect(lx + bw1 * 0.7, dy - bh1 - 15, 1, 10);
          ctx.fillStyle = '#ff3333';
          ctx.shadowBlur = 6; ctx.shadowColor = '#ff0000';
          ctx.beginPath(); ctx.arc(lx + bw1 * 0.7 + 0.5, dy - bh1 - 15, 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
        // Windows (safe + fast - no shadows in inner loop)
        const winColors = this.theme.name === 'neon'
          ? ['#ff00ff', '#00ffff', '#ff6b6b', '#ffd700']
          : ['#ffd966', '#ffeb99', '#fff2b3', '#ffd966'];
        for (let wy = dy - bh1 + 10; wy < dy - 8; wy += 11) {
          for (let wx = lx + 4; wx < lx + bw1 - 6; wx += 9) {
            const wxi = Math.abs(Math.floor(wx));
            const wyi = Math.abs(Math.floor(wy));
            const isLit = ((wxi * 7 + wyi * 11 + seed * 3) % 5) > 1;
            if (isLit) {
              ctx.fillStyle = winColors[(wxi + wyi) % 4];
              ctx.globalAlpha = 0.85;
            } else {
              ctx.fillStyle = 'rgba(0,0,0,0.4)';
              ctx.globalAlpha = 0.5;
            }
            ctx.fillRect(wx, wy, 5, 6);
          }
        }
        ctx.globalAlpha = 1;

        // === RIGHT BUILDING ===
        const rcolor = buildingPalette[(seed + 2) % 4];
        const rcolorLight = this.adjColor(rcolor, 25);
        const rcolorDark = this.adjColor(rcolor, -20);
        const rx = rl + rw + sidewalkW + 5;

        ctx.fillStyle = rcolor;
        ctx.fillRect(rx, dy - bh2 + 30, bw2, bh2);
        // Left edge (light - facing road)
        ctx.fillStyle = rcolorLight;
        ctx.fillRect(rx, dy - bh2 + 30, 3, bh2);
        // Top
        ctx.fillStyle = rcolorDark;
        ctx.fillRect(rx, dy - bh2 + 30, bw2, 4);
        // Roof
        ctx.fillStyle = rcolorDark;
        ctx.fillRect(rx - 3, dy - bh2 + 25, bw2 + 6, 6);
        // Windows (fast)
        for (let wy = dy - bh2 + 40; wy < dy + 22; wy += 11) {
          for (let wx = rx + 4; wx < rx + bw2 - 6; wx += 9) {
            const wxi = Math.abs(Math.floor(wx));
            const wyi = Math.abs(Math.floor(wy));
            const isLit = ((wxi * 5 + wyi * 13 + seed * 7) % 5) > 1;
            if (isLit) {
              ctx.fillStyle = winColors[(wxi + wyi + 1) % 4];
              ctx.globalAlpha = 0.85;
            } else {
              ctx.fillStyle = 'rgba(0,0,0,0.4)';
              ctx.globalAlpha = 0.5;
            }
            ctx.fillRect(wx, wy, 5, 6);
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    // Near layer (faster parallax) - Lamps/Trees/Cacti/Signs
    const nearOff = (this.decorOffset * 0.4) % 160;
    for (let y = -100; y < h + 100; y += 160) {
      const dy = ((y + nearOff) % (h + 200) + h + 200) % (h + 200) - 100;
      const lx = rl - 35, rx = rl + rw + 23;

      switch (this.theme.name) {
        case 'city':
          // Street lamps
          ctx.fillStyle = '#666'; ctx.fillRect(lx + 4, dy - 35, 4, 35);
          ctx.fillStyle = '#ffd700'; ctx.globalAlpha = 0.6 + Math.sin(this.run.elapsed * 3 + y) * 0.2;
          ctx.beginPath(); ctx.arc(lx + 6, dy - 38, 6, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.arc(lx + 6, dy - 38, 25, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#666'; ctx.fillRect(rx + 4, dy + 40 - 35, 4, 35);
          ctx.fillStyle = '#ffd700'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(rx + 6, dy + 40 - 38, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          break;
        case 'desert':
          // Cacti
          ctx.fillStyle = '#2d8a4e';
          ctx.fillRect(lx + 3, dy - 30, 6, 30);
          ctx.fillRect(lx - 4, dy - 22, 8, 4); ctx.fillRect(lx - 4, dy - 22, 4, 12);
          ctx.fillRect(lx + 8, dy - 18, 8, 4); ctx.fillRect(lx + 12, dy - 18, 4, 10);
          ctx.fillRect(rx + 3, dy + 30, 6, 25);
          ctx.fillRect(rx - 2, dy + 38, 6, 4); ctx.fillRect(rx - 2, dy + 38, 4, 10);
          break;
        case 'snow':
          // Pine trees
          ctx.fillStyle = '#8B4513'; ctx.fillRect(lx + 3, dy - 15, 6, 15);
          ctx.fillStyle = '#228B22';
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(lx - 5 + i * 2, dy - 15 - i * 10); ctx.lineTo(lx + 6, dy - 30 - i * 10); ctx.lineTo(lx + 17 - i * 2, dy - 15 - i * 10); ctx.closePath(); ctx.fill(); }
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(lx, dy - 35); ctx.lineTo(lx + 6, dy - 45); ctx.lineTo(lx + 12, dy - 35); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#8B4513'; ctx.fillRect(rx + 3, dy + 30, 6, 15);
          ctx.fillStyle = '#228B22';
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(rx - 3 + i * 2, dy + 30 - i * 10); ctx.lineTo(rx + 6, dy + 15 - i * 10); ctx.lineTo(rx + 15 - i * 2, dy + 30 - i * 10); ctx.closePath(); ctx.fill(); }
          break;
        case 'neon':
          // Neon signs
          const nc = ['#ff00ff', '#00ffff', '#ff6b6b', '#ffd700'][Math.floor(y * 0.01) % 4];
          ctx.fillStyle = '#333'; ctx.fillRect(lx + 4, dy - 30, 4, 30);
          ctx.fillStyle = nc; ctx.globalAlpha = 0.7 + Math.sin(this.run.elapsed * 4 + y * 0.1) * 0.3;
          ctx.shadowBlur = 12; ctx.shadowColor = nc;
          ctx.fillRect(lx - 2, dy - 42, 16, 14); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
          ctx.fillStyle = '#333'; ctx.fillRect(rx + 4, dy + 20, 4, 30);
          ctx.fillStyle = nc; ctx.globalAlpha = 0.7; ctx.shadowBlur = 12; ctx.shadowColor = nc;
          ctx.fillRect(rx - 2, dy + 8, 16, 14); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
          break;
      }
    }

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 200 + this.run.elapsed * 8) % (this.width + 100)) - 50;
      const cy = 30 + i * 25;
      ctx.beginPath(); ctx.ellipse(cx, cy, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx - 15, cy + 3, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Snow weather
    if (this.theme.name === 'snow') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const sx = (Math.sin(i * 7.3 + this.run.elapsed * 0.5) * 0.5 + 0.5) * this.width;
        const sy = ((i * 47 + this.decorOffset * 0.3) % (h + 20)) - 10;
        ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(sx, sy, 1.5 + Math.sin(i) * 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Stars for neon/city
    if (this.theme.name === 'neon' || this.theme.name === 'city') {
      for (let i = 0; i < 30; i++) {
        const sx = (Math.sin(i * 13.7) * 0.5 + 0.5) * this.width;
        const sy = (Math.cos(i * 7.3) * 0.5 + 0.5) * h * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(this.run.elapsed * 2 + i) * 0.3})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1 + Math.sin(i * 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Neon glow
    if (this.theme.name === 'neon') {
      const glow = ctx.createLinearGradient(rl - 30, 0, rl, 0);
      glow.addColorStop(0, 'transparent'); glow.addColorStop(1, 'rgba(255,0,255,0.08)');
      ctx.fillStyle = glow; ctx.fillRect(rl - 30, 0, 30, h);
      const glow2 = ctx.createLinearGradient(rl + rw, 0, rl + rw + 30, 0);
      glow2.addColorStop(0, 'rgba(0,255,255,0.08)'); glow2.addColorStop(1, 'transparent');
      ctx.fillStyle = glow2; ctx.fillRect(rl + rw, 0, 30, h);
    }
  }

  private renderRoad(ctx: CanvasRenderingContext2D) {
    const rl = this.roadLeft;
    const rw = this.roadWidth;
    const h = this.height;

    // Road surface
    ctx.fillStyle = this.theme.roadColor;
    ctx.fillRect(rl, 0, rw, h);

    // Road texture (subtle noise)
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < h; y += 4) {
      for (let x = rl; x < rl + rw; x += 4) {
        if (Math.random() > 0.7) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 2, 2); }
      }
    }
    ctx.globalAlpha = 1;

    // Road edge lines
    ctx.strokeStyle = this.theme.roadEdge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rl, 0);
    ctx.lineTo(rl, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rl + rw, 0);
    ctx.lineTo(rl + rw, h);
    ctx.stroke();

    // Lane markings (dashed)
    ctx.strokeStyle = this.theme.laneMarking;
    ctx.lineWidth = 2;
    ctx.setLineDash([30, 30]);
    const dashOffset = -(this.scrollOffset % 60);
    ctx.lineDashOffset = dashOffset;

    for (let i = 1; i < 3; i++) {
      const x = rl + i * this.laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Neon road glow
    if (this.theme.name === 'neon') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.theme.laneMarking;
      ctx.strokeStyle = this.theme.laneMarking;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([30, 30]);
      ctx.lineDashOffset = dashOffset;
      for (let i = 1; i < 3; i++) {
        const x = rl + i * this.laneWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  private renderSpeedLines(ctx: CanvasRenderingContext2D) {
    if (this.speedLines.length === 0) return;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (const sl of this.speedLines) {
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.y);
      ctx.lineTo(sl.x, sl.y + sl.len);
      ctx.stroke();
    }
  }

  private renderCoins(ctx: CanvasRenderingContext2D) {
    for (const coin of this.coins) {
      if (coin.collected) continue;
      const x = coin.magnetTarget ? this.laneXs[coin.lane] + coin.mx : this.laneXs[coin.lane];
      const y = coin.magnetTarget ? coin.y + coin.my : coin.y;
      // Big premium coins for visibility
      const r = 26 * (1 + Math.sin(this.run.elapsed * 6 + coin.id) * 0.08);
      const scaleX = Math.abs(Math.cos(this.run.elapsed * 4 + coin.id * 0.5));
      ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.25, scaleX), 1);
      // Strong golden glow
      ctx.shadowBlur = 20; ctx.shadowColor = '#fbbf24';
      // Outer ring (rich gold)
      const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, r);
      grad.addColorStop(0, '#fef3c7');
      grad.addColorStop(0.5, '#fbbf24');
      grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      // Inner face
      const innerGrad = ctx.createRadialGradient(-1, -1, 0, 0, 0, r * 0.7);
      innerGrad.addColorStop(0, '#fef9c3');
      innerGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = innerGrad;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.fill();
      // Edge ring
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke();
      // Star symbol (more game-like)
      ctx.fillStyle = '#92400e';
      ctx.font = `bold ${Math.floor(r * 1.1)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);
      // Sparkle
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.8 + Math.sin(this.run.elapsed * 8 + coin.id) * 0.2;
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(r * 0.3, r * 0.2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.restore();
    }
  }

  private renderPowerUps(ctx: CanvasRenderingContext2D) {
    const colors: Record<PowerUpType, string> = { magnet: '#ef4444', shield: '#3b82f6', doubleCoins: '#fbbf24', speedBurst: '#22c55e' };
    const icons: Record<PowerUpType, string> = { magnet: 'U', shield: 'S', doubleCoins: '2x', speedBurst: '>' };
    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      const x = this.laneXs[pu.lane], y = pu.y;
      const r = 18 * (1 + Math.sin(this.run.elapsed * 4 + pu.id) * 0.15);
      // Rotating ring
      ctx.strokeStyle = colors[pu.type]; ctx.lineWidth = 2; ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(x, y, r + 5, this.run.elapsed * 3, this.run.elapsed * 3 + Math.PI * 1.5); ctx.stroke(); ctx.globalAlpha = 1;
      // Glow + gradient body
      ctx.shadowBlur = 18; ctx.shadowColor = colors[pu.type];
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, colors[pu.type]); grad.addColorStop(1, colors[pu.type] + '88');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.floor(r * 0.8)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icons[pu.type], x, y + 1);
      ctx.shadowBlur = 0;
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      const x = this.laneXs[obs.lane], y = obs.y;
      switch (obs.type) {
        case 'barrier': {
          const bw = this.laneWidth * 0.82, bh = 30;
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - bw / 2 + 3, y - bh / 2 + 3, bw, bh);
          ctx.fillStyle = '#dc2626'; ctx.fillRect(x - bw / 2, y - bh / 2, bw, bh);
          ctx.fillStyle = '#fff'; for (let sx = x - bw / 2; sx < x + bw / 2; sx += 18) ctx.fillRect(sx, y - bh / 2, 9, bh);
          ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - bw / 2, y - bh / 2, bw, 4);
          ctx.fillStyle = '#888'; ctx.fillRect(x - bw / 2 + 2, y + bh / 2, 4, 8); ctx.fillRect(x + bw / 2 - 6, y + bh / 2, 4, 8);
          break;
        }
        case 'cone':
          ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 16, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x - 16, y + 14); ctx.lineTo(x + 16, y + 14); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(x-2, y-22); ctx.lineTo(x-10, y+10); ctx.lineTo(x-2, y+10); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillRect(x - 11, y - 5, 22, 6); ctx.fillRect(x - 7, y - 16, 14, 4);
          ctx.fillStyle = '#ea580c'; ctx.fillRect(x - 18, y + 12, 36, 6);
          break;
        case 'car': {
          const cw = this.laneWidth * 0.72, ch = 68;
          const cc = ['#3b82f6', '#8b5cf6', '#ef4444', '#22c55e', '#f59e0b', '#ec4899'][obs.id % 6];
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 3, y + ch / 2 + 3, cw / 2, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = cc; this.rRect(ctx, x - cw / 2, y - ch / 2, cw, ch, 10); ctx.fill();
          ctx.fillStyle = this.adjColor(cc, -30); this.rRect(ctx, x - cw / 2 + 6, y - ch / 2 + 8, cw - 12, ch * 0.4, 6); ctx.fill();
          ctx.fillStyle = 'rgba(135,206,250,0.6)'; this.rRect(ctx, x - cw / 2 + 8, y - ch / 2 + 10, cw - 16, 14, 4); ctx.fill();
          ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(x - cw / 2 + 8, y - ch / 2 + 4, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + cw / 2 - 8, y - ch / 2 + 4, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ef4444'; ctx.fillRect(x - cw / 2 + 4, y + ch / 2 - 6, 8, 4); ctx.fillRect(x + cw / 2 - 12, y + ch / 2 - 6, 8, 4);
          ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x - cw / 2 - 2, y - ch / 4, 5, 12); ctx.fillRect(x + cw / 2 - 3, y - ch / 4, 5, 12); ctx.fillRect(x - cw / 2 - 2, y + ch / 4 - 6, 5, 12); ctx.fillRect(x + cw / 2 - 3, y + ch / 4 - 6, 5, 12);
          break;
        }
        case 'gap': {
          const gw = this.laneWidth * 0.75, gh = 40;
          ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x - gw / 2, y - gh / 2, gw, gh);
          ctx.fillStyle = '#fbbf24'; for (let sx = x - gw / 2; sx < x + gw / 2; sx += 12) { ctx.fillRect(sx, y - gh / 2, 6, 3); ctx.fillRect(sx, y + gh / 2 - 3, 6, 3); }
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - gw / 2, y - gh / 2 + 3, gw, 8);
          break;
        }
      }
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const x = p.x, baseY = p.y, jumpH = p.jumpHeight, y = baseY - jumpH;
    if (p.invincible > 0 && Math.sin(p.invincible * 20) > 0) ctx.globalAlpha = 0.4;

    // Shadow
    if (jumpH > 5) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, baseY + 22, 16 - jumpH * 0.08, 5 - jumpH * 0.02, 0, 0, Math.PI * 2); ctx.fill(); }

    // Shield
    if (this.activePowerUps.shield > 0) { ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.4 + Math.sin(this.run.elapsed * 6) * 0.3; ctx.beginPath(); ctx.arc(x, y - 5, 32, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 4; i++) { const a = this.run.elapsed * 3 + (Math.PI * 2 * i) / 4; ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 30, y - 5 + Math.sin(a) * 30, 2, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = p.invincible > 0 && Math.sin(p.invincible * 20) > 0 ? 0.4 : 1; }
    if (this.activePowerUps.magnet > 0) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.globalAlpha = 0.15; ctx.beginPath(); ctx.arc(x, y, 180, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = p.invincible > 0 && Math.sin(p.invincible * 20) > 0 ? 0.4 : 1; }

    // === REALISTIC HUMAN RUNNER (BIGGER, more detailed Subway Surfers style) ===
    const cycle = this.run.elapsed * (this.run.speed / 45);
    const legSwing = Math.sin(cycle * 8) * 18;
    const armSwing = Math.sin(cycle * 8) * 22;
    const bodyBob = Math.abs(Math.sin(cycle * 8)) * 4;
    const headBob = Math.abs(Math.sin(cycle * 8)) * 2.5;
    const lean = Math.sin(cycle * 4) * 1.5;
    const hoodie = (this as any)._skinColor || '#00d4ff';
    const hoodieSh = this.adjColor(hoodie, -30);
    const hoodieLt = this.adjColor(hoodie, 25);
    const accent = (this as any)._skinAccent || '#0099cc';
    const skin = '#f4c49c';
    const skinSh = '#d4a07a';
    const hair = '#3d2817';
    const pants = '#2d3748';
    const pantsSh = '#1a202c';
    const shoe = '#e53e3e';

    ctx.save();
    // Bigger scale for premium feel
    ctx.translate(x, y - bodyBob);
    ctx.scale(1.35, 1.35);

    // LEFT LEG (jeans + sneaker) - thicker, more detailed
    ctx.save(); ctx.translate(-6, 18); ctx.rotate((-legSwing * Math.PI) / 180);
    // Upper leg
    ctx.fillStyle = pants; this.rRect(ctx, -5, 0, 11, 16, 3); ctx.fill();
    // Knee shadow
    ctx.fillStyle = pantsSh; ctx.fillRect(-5, 11, 11, 5);
    // Lower leg
    ctx.fillStyle = pants; this.rRect(ctx, -4, 16, 10, 14, 2); ctx.fill();
    // Shoe (white sneaker with red sole)
    ctx.fillStyle = '#fff'; this.rRect(ctx, -7, 28, 15, 9, 4); ctx.fill();
    ctx.fillStyle = shoe; ctx.fillRect(-7, 33, 15, 4);
    // Shoe laces detail
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-3, 30); ctx.lineTo(3, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, 32); ctx.lineTo(3, 32); ctx.stroke();
    ctx.restore();

    // RIGHT LEG
    ctx.save(); ctx.translate(6, 18); ctx.rotate((legSwing * Math.PI) / 180);
    ctx.fillStyle = pants; this.rRect(ctx, -5, 0, 11, 16, 3); ctx.fill();
    ctx.fillStyle = pantsSh; ctx.fillRect(-5, 11, 11, 5);
    ctx.fillStyle = pants; this.rRect(ctx, -4, 16, 10, 14, 2); ctx.fill();
    ctx.fillStyle = '#fff'; this.rRect(ctx, -7, 28, 15, 9, 4); ctx.fill();
    ctx.fillStyle = shoe; ctx.fillRect(-7, 33, 15, 4);
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-3, 30); ctx.lineTo(3, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, 32); ctx.lineTo(3, 32); ctx.stroke();
    ctx.restore();

    // TORSO (Hoodie - bigger, more detailed)
    // Main body
    ctx.fillStyle = hoodie; this.rRect(ctx, -16, -14, 32, 34, 8); ctx.fill();
    // Hoodie shading (right side darker - 3D effect)
    ctx.fillStyle = hoodieSh;
    this.rRect(ctx, 8, -14, 8, 34, 4); ctx.fill();
    // Hoodie highlight (left side lighter)
    ctx.fillStyle = hoodieLt;
    ctx.fillRect(-15, -13, 3, 32);
    // Bottom hem (darker)
    ctx.fillStyle = hoodieSh; ctx.fillRect(-16, 14, 32, 6);
    // Center zipper line
    ctx.strokeStyle = hoodieSh; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 18); ctx.stroke();
    // Hood (behind head, prominent)
    ctx.fillStyle = hoodieSh;
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.quadraticCurveTo(-15, -24, 0, -26);
    ctx.quadraticCurveTo(15, -24, 12, -14);
    ctx.closePath(); ctx.fill();
    // Hood inner (lighter)
    ctx.fillStyle = hoodieLt;
    ctx.beginPath();
    ctx.moveTo(-9, -14);
    ctx.quadraticCurveTo(-11, -21, 0, -23);
    ctx.quadraticCurveTo(11, -21, 9, -14);
    ctx.closePath(); ctx.fill();
    // Kangaroo pocket
    ctx.strokeStyle = hoodieSh; ctx.lineWidth = 1; this.rRect(ctx, -10, 4, 20, 11, 3); ctx.stroke();
    // Drawstrings
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-3, -10); ctx.lineTo(-2, -3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, -10); ctx.lineTo(2, -3); ctx.stroke();
    // Accent stripe on chest
    ctx.fillStyle = accent; ctx.fillRect(-16, -4, 32, 3);

    // LEFT ARM (bigger, with hand detail)
    ctx.save(); ctx.translate(-17, -7); ctx.rotate((armSwing * Math.PI) / 180 + lean * 0.02);
    // Upper arm
    ctx.fillStyle = hoodie; this.rRect(ctx, -5, 0, 9, 15, 3); ctx.fill();
    // Sleeve shadow
    ctx.fillStyle = hoodieSh; this.rRect(ctx, 1, 0, 3, 15, 1); ctx.fill();
    // Cuff
    ctx.fillStyle = hoodieSh; this.rRect(ctx, -4, 13, 8, 4, 2); ctx.fill();
    // Hand
    ctx.fillStyle = skin; this.rRect(ctx, -4, 16, 8, 6, 3); ctx.fill();
    // Knuckle detail
    ctx.fillStyle = skinSh; ctx.fillRect(-3, 18, 6, 1);
    ctx.restore();

    // RIGHT ARM
    ctx.save(); ctx.translate(17, -7); ctx.rotate((-armSwing * Math.PI) / 180 - lean * 0.02);
    ctx.fillStyle = hoodie; this.rRect(ctx, -4, 0, 9, 15, 3); ctx.fill();
    ctx.fillStyle = hoodieSh; this.rRect(ctx, 1, 0, 3, 15, 1); ctx.fill();
    ctx.fillStyle = hoodieSh; this.rRect(ctx, -4, 13, 8, 4, 2); ctx.fill();
    ctx.fillStyle = skin; this.rRect(ctx, -4, 16, 8, 6, 3); ctx.fill();
    ctx.fillStyle = skinSh; ctx.fillRect(-3, 18, 6, 1);
    ctx.restore();

    // HEAD (bigger, more realistic face)
    const headY = -30 - headBob;
    // Neck
    ctx.fillStyle = skinSh; ctx.fillRect(-3, -16, 6, 5);
    // Head shape (oval, slightly wider)
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, headY, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
    // Face shadow on right side (3D effect)
    ctx.fillStyle = skinSh;
    ctx.beginPath(); ctx.ellipse(6, headY, 6, 12, 0, 0, Math.PI * 2); ctx.fill();
    // Ears
    ctx.fillStyle = skinSh;
    ctx.beginPath(); ctx.ellipse(-12, headY + 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, headY + 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Hair (styled, dark brown)
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.ellipse(0, headY - 5, 13, 11, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(-13, headY - 7, 26, 7);
    // Hair fringe (front)
    ctx.beginPath();
    ctx.moveTo(-8, headY - 4);
    ctx.quadraticCurveTo(-2, headY - 8, 4, headY - 4);
    ctx.quadraticCurveTo(0, headY - 1, -8, headY - 4);
    ctx.fill();
    // Side hair
    ctx.fillRect(-13, headY - 5, 3, 9);
    ctx.fillRect(10, headY - 5, 3, 9);
    // Eyes (white sclera + iris + pupil + highlight)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-4, headY - 1, 3.2, 3.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, headY - 1, 3.2, 3.8, 0, 0, Math.PI * 2); ctx.fill();
    // Iris (brown)
    ctx.fillStyle = '#5c3d20';
    ctx.beginPath(); ctx.arc(-3.5, headY - 1, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.5, headY - 1, 2.3, 0, Math.PI * 2); ctx.fill();
    // Pupil
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-3.5, headY - 1, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.5, headY - 1, 1.2, 0, Math.PI * 2); ctx.fill();
    // Eye highlight (white sparkle)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-4.2, headY - 1.8, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4.8, headY - 1.8, 0.9, 0, Math.PI * 2); ctx.fill();
    // Eyebrows (determined look)
    ctx.strokeStyle = hair; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-7, headY - 5.5); ctx.lineTo(-2, headY - 4.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, headY - 4.5); ctx.lineTo(7, headY - 5.5); ctx.stroke();
    // Nose
    ctx.fillStyle = skinSh;
    ctx.beginPath(); ctx.moveTo(0, headY + 1); ctx.lineTo(-1.5, headY + 4); ctx.lineTo(1.5, headY + 4); ctx.closePath(); ctx.fill();
    // Mouth (slight smile)
    ctx.strokeStyle = '#a0392b'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, headY + 7, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    // Cheek blush (subtle)
    ctx.fillStyle = 'rgba(255,150,150,0.3)';
    ctx.beginPath(); ctx.arc(-7, headY + 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, headY + 3, 2, 0, Math.PI * 2); ctx.fill();

    // Speed burst flame
    if (this.activePowerUps.speedBurst > 0) {
      ctx.globalAlpha = 0.5; const fh = 20 + Math.random() * 15;
      const g = ctx.createLinearGradient(0, 20, 0, 20 + fh);
      g.addColorStop(0, '#22c55e'); g.addColorStop(0.5, '#fbbf24'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10, 20); ctx.quadraticCurveTo(0, 20 + fh, 10, 20); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (this.activePowerUps.doubleCoins > 0) { ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('2x\ud83e\ude99', 0, headY - 18); }

    // Skin trail
    const trail = (this as any)._skinTrail;
    if (trail && Math.random() < 0.3) {
      this.particles.push({ x: x + (Math.random() - 0.5) * 10, y: baseY + 18, vx: (Math.random() - 0.5) * 20, vy: 20 + Math.random() * 30, life: 0.4, maxLife: 0.4, color: trail, size: 3 + Math.random() * 3 });
    }

    ctx.restore(); ctx.globalAlpha = 1;
  }

  private rRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  private adjColor(hex: string, amt: number): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
    const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
    return `rgb(${r},${g},${b})`;
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderHUD(ctx: CanvasRenderingContext2D) {
    const w = this.width;

    // Top bar background
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, w, 50);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'left';

    // Score
    ctx.fillText(`Score: ${this.run.score}`, 12, 22);

    // Coins
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🪙 ${this.run.coins}`, 12, 42);

    // Distance
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(this.run.distance)}m`, w - 12, 22);

    // Level goal progress (level mode)
    if (this.run.mode === 'level') {
      ctx.fillStyle = '#aaa';
      ctx.font = '12px system-ui';
      ctx.fillText(`Goal: ${this.level.distanceGoal}m / ${this.level.coinGoal}🪙`, w - 12, 42);
    }

    // Combo
    if (this.run.combo > 3) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.run.combo}x COMBO!`, w / 2, 42);
    }

    // Active power-up indicators
    const puY = 60;
    let puX = 12;
    const puNames: Record<PowerUpType, string> = {
      magnet: '🧲', shield: '🛡️', doubleCoins: '💰', speedBurst: '⚡',
    };
    for (const key of Object.keys(this.activePowerUps) as (keyof ActivePowerUps)[]) {
      if (this.activePowerUps[key] > 0) {
        const remaining = Math.ceil(this.activePowerUps[key]);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(puX, puY, 50, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`${puNames[key]} ${remaining}s`, puX + 4, puY + 16);
        puX += 58;
      }
    }

    // Hits indicator (level mode)
    if (this.run.mode === 'level') {
      const maxH = this.level.maxHits;
      const curH = this.run.hits;
      ctx.textAlign = 'center';
      ctx.font = '14px system-ui';
      for (let i = 0; i <= maxH; i++) {
        ctx.fillStyle = i < (maxH - curH + 1) ? '#ef4444' : '#333';
        ctx.fillText('❤️', w / 2 - (maxH * 10) + i * 20, 22);
      }
    }

    // Progress bar (level mode)
    if (this.run.mode === 'level') {
      const progress = Math.min(1, this.run.distance / this.level.distanceGoal);
      const barW = w - 24;
      const barH = 4;
      const barY = 48;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(12, barY, barW, barH);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(12, barY, barW * progress, barH);
    }
  }

  // Public methods for React integration
  setSkin(color: string, accent: string, trail?: string) {
    (this as any)._skinColor = color;
    (this as any)._skinAccent = accent;
    (this as any)._skinTrail = trail || '';
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  resume() {
    this.paused = false;
    this.lastTime = performance.now();
  }
}
