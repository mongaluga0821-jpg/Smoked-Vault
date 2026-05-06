// ============================================================
// SMOKED VAULT v2.0 – TARGET PRACTICE
// ============================================================

'use strict';

const TP = {
  canvas: null, ctx: null,
  targets: [], explosions: [],
  score: 0, streak: 0, maxStreak: 0,
  timeLeft: 30, difficulty: 1,
  running: false,

  cfg: {
    1: { count: 3, r: 28, speed: 1.8, time: 35, pts: 10 },
    2: { count: 5, r: 22, speed: 3.0, time: 30, pts: 15 },
    3: { count: 7, r: 15, speed: 4.8, time: 25, pts: 20 },
  },

  init(diff) {
    this.difficulty = diff;
    const cfg = this.cfg[diff];
    this.score = 0; this.streak = 0; this.maxStreak = 0;
    this.timeLeft = cfg.time;
    this.targets = []; this.explosions = [];
    this.running = true;

    this.canvas = el('tp-canvas');
    this.ctx    = this.canvas.getContext('2d');

    const W = Math.min(window.innerWidth - 32, 720);
    const H = Math.min(window.innerHeight - 220, 500);
    this.canvas.width = W; this.canvas.height = H;

    for (let i = 0; i < cfg.count; i++) this._spawn();

    el('tp-diff-select').style.display = 'none';
    el('tp-result').style.display     = 'none';
    el('tp-canvas').style.display     = 'block';
    el('tp-timer').style.color        = '';

    this.canvas.onclick      = e => this._click(e);
    this.canvas.ontouchstart = e => {
      e.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      const t = e.touches[0];
      this._checkHit(t.clientX - r.left, t.clientY - r.top);
    };

    setGameTimer('tp-draw',  () => this._draw(),      16);
    setGameTimer('tp-clock', () => this._countdown(), 1000);
    this._updateHUD();
  },

  _spawn() {
    const cfg = this.cfg[this.difficulty];
    const W = this.canvas.width, H = this.canvas.height, r = cfg.r;
    const a = Math.random() * Math.PI * 2;
    const spd = cfg.speed * (0.75 + Math.random() * 0.5);
    const cols = ['#FF6B00','#00F5FF','#BF00FF','#00FF88','#FFD700','#FF3366','#FF00AA'];
    this.targets.push({
      x: r + Math.random() * (W - r*2), y: r + Math.random() * (H - r*2),
      r, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
      color: cols[Math.floor(Math.random()*cols.length)],
      pulse: Math.random()*Math.PI*2,
    });
  },

  _click(e) {
    const r = this.canvas.getBoundingClientRect();
    this._checkHit(e.clientX - r.left, e.clientY - r.top);
  },

  _checkHit(mx, my) {
    if (!this.running) return;
    let hit = false;
    this.targets = this.targets.filter(t => {
      const d = Math.hypot(mx - t.x, my - t.y);
      if (d < t.r + 4) {
        hit = true;
        this.streak++;
        if (this.streak > this.maxStreak) this.maxStreak = this.streak;
        const bonus = this.streak >= 3 ? Math.floor(this.streak * 0.6) : 0;
        const pts   = this.cfg[this.difficulty].pts + bonus;
        this.score += pts;
        // Explosion effect
        this.explosions.push({ x: t.x, y: t.y, r: t.r, color: t.color, age: 0, maxAge: 18 });
        if (bonus > 0) toast(`🔥 STREAK ×${this.streak}! +${pts}`);
        if (this.streak >= 5)  SV.state.achievements.speed_demon_earned = true;
        if (this.streak >= 10) { SV.state.achievements.combo_king_earned  = true; SV.save(); }
        SFX.hit();
        this._spawn();
        return false;
      }
      return true;
    });
    if (!hit) { this.streak = 0; SFX.miss(); }
    el('tp-score').textContent  = this.score;
    el('tp-streak').textContent = this.streak;
  },

  _draw() {
    if (!this.running) return;
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(0,245,255,0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Explosions
    this.explosions = this.explosions.filter(ex => {
      ex.age++;
      const frac = ex.age / ex.maxAge;
      const er   = ex.r * (1 + frac * 2);
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, er, 0, Math.PI*2);
      ctx.strokeStyle = ex.color + Math.round((1-frac)*255).toString(16).padStart(2,'0');
      ctx.lineWidth = 3 * (1-frac);
      ctx.stroke();
      return ex.age < ex.maxAge;
    });

    // Targets
    this.targets.forEach(t => {
      t.x += t.vx; t.y += t.vy;
      if (t.x - t.r < 0 || t.x + t.r > W) t.vx *= -1;
      if (t.y - t.r < 0 || t.y + t.r > H) t.vy *= -1;
      t.pulse += 0.08;

      // Outer pulse ring
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r + Math.sin(t.pulse)*5, 0, Math.PI*2);
      ctx.strokeStyle = t.color + '44'; ctx.lineWidth = 2; ctx.stroke();

      // Main body
      const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r);
      g.addColorStop(0,   '#ffffff');
      g.addColorStop(0.25, t.color);
      g.addColorStop(1,   t.color + '33');
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2);
      ctx.fillStyle = g; ctx.fill();

      // Crosshair lines
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(t.x - t.r+4, t.y); ctx.lineTo(t.x + t.r-4, t.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(t.x, t.y - t.r+4); ctx.lineTo(t.x, t.y + t.r-4); ctx.stroke();
    });

    // Streak HUD overlay
    if (this.streak >= 3) {
      ctx.font = 'bold 16px Orbitron'; ctx.fillStyle = '#FFD700';
      ctx.fillText(`🔥 ×${this.streak}`, 10, 22);
    }
  },

  _countdown() {
    if (!this.running) return;
    this.timeLeft--;
    el('tp-timer').textContent = this.timeLeft;
    if (this.timeLeft <= 5) el('tp-timer').style.color = '#FF3366';
    if (this.timeLeft <= 0) this._end();
  },

  _updateHUD() {
    el('tp-score').textContent  = this.score;
    el('tp-best').textContent   = SV.state.bestScores.target || 0;
    el('tp-streak').textContent = this.streak;
  },

  _end() {
    this.running = false;
    clearGameTimer('tp-draw');
    clearGameTimer('tp-clock');
    el('tp-canvas').style.display = 'none';
    el('tp-timer').style.color    = '';

    const isNew = SV.saveBest('target', this.score);
    SV.addScore(this.score);
    SV.checkAchievements();
    SFX.win();

    // Daily check
    if (this.score >= 150) window._dailyCheck('target-practice', this.score);

    const r = el('tp-result');
    r.style.display = 'block';
    r.innerHTML = `
      <h3>🎯 ROUND COMPLETE!</h3>
      <div class="result-stat"><span class="label">Score</span><span class="value">${this.score} pts${isNew ? ' <span class="result-new">🆕 NEW BEST</span>' : ''}</span></div>
      <div class="result-stat"><span class="label">Difficulty</span><span class="value">Level ${this.difficulty}</span></div>
      <div class="result-stat"><span class="label">Best Streak</span><span class="value">×${this.maxStreak}</span></div>
      <div class="result-stat"><span class="label">All-Time Best</span><span class="value">${SV.state.bestScores.target} pts</span></div>
      <div class="result-buttons">
        <button class="btn-primary"   onclick="startTargetPractice(${this.difficulty})">PLAY AGAIN</button>
        <button class="btn-secondary" onclick="showScreen('target-practice')">CHANGE LEVEL</button>
        <button class="btn-secondary" onclick="exitGame('vault-map')">VAULT MAP</button>
      </div>`;
  },
};

function startTargetPractice(diff) { TP.init(diff); }
