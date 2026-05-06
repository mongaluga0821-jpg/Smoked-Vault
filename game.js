// ============================================================
// SMOKED VAULT v2.0 – CORE GAME STATE & ENGINE
// © Israel Lopez – Educational Simulation Only
// ============================================================

'use strict';

// ---- AUDIO ENGINE (Web Audio API — no external files needed) ----
const SFX = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }
  function tone(freq, type, dur, vol = 0.18, delay = 0) {
    const c = getCtx(); if (!c) return;
    try {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, c.currentTime + delay + dur);
      gain.gain.setValueAtTime(vol, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + dur);
    } catch(e) {}
  }
  return {
    hit()    { tone(440, 'sine',   0.08, 0.22); tone(660, 'sine',   0.06, 0.15, 0.04); },
    miss()   { tone(180, 'sawtooth', 0.12, 0.1); },
    win()    { [523,659,784,1047].forEach((f,i) => tone(f, 'sine', 0.18, 0.18, i*0.1)); },
    badge()  { [880,1100,1320].forEach((f,i) => tone(f, 'sine', 0.22, 0.2, i*0.08)); },
    click()  { tone(600, 'sine', 0.04, 0.08); },
    correct(){ tone(880, 'sine', 0.15, 0.2); },
    wrong()  { tone(220, 'sawtooth', 0.18, 0.12); },
    move()   { tone(350, 'sine', 0.03, 0.05); },
    unlock() { [660,880,1100,1320].forEach((f,i) => tone(f,'triangle',0.2,0.18,i*0.07)); },
  };
})();

// ---- CORE STATE ----
const SV = {
  state: {
    totalScore: 0,
    level: 1,
    xp: 0,
    badges: 0,
    bestScores: {},
    achievements: {},
    cosmetics: {},
    dailyDone: false,
    dailyDate: '',
  },

  // ---- ROOM DEFINITIONS ----
  rooms: [
    { id: 'target-practice', name: 'TARGET RANGE',  icon: '🎯', desc: 'Shoot moving targets with speed & accuracy', theme: 'MECHANICAL',  minScore: 0,    gameId: 'target-practice' },
    { id: 'puzzle-boards',   name: 'PUZZLE VAULT',  icon: '🧩', desc: 'Solve sliding puzzles efficiently',          theme: 'NEON TECH',   minScore: 100,  gameId: 'puzzle-boards'   },
    { id: 'maze-runner',     name: 'MAZE RUNNER',   icon: '🌀', desc: 'Navigate procedurally generated mazes',      theme: 'MAGICAL',     minScore: 350,  gameId: 'maze-runner'     },
    { id: 'trivia-vault',    name: 'TRIVIA VAULT',  icon: '🧠', desc: 'Prove your knowledge across categories',     theme: 'FUTURISTIC',  minScore: 700,  gameId: 'trivia-vault'    },
    { id: 'fish-table',      name: 'FISH TABLE',    icon: '🐟', desc: 'Hunt fish with timing and precision',        theme: 'OCEAN ARENA', minScore: 1200, gameId: 'fish-table'      },
  ],

  // ---- ACHIEVEMENT DEFINITIONS ----
  achievements: [
    { id: 'first_shot',     name: 'First Shot',       icon: '🎯', desc: 'Complete your first game',               cond: s => s.totalScore >= 1 },
    { id: 'sharp_eye',      name: 'Sharp Eye',        icon: '👁',  desc: 'Score 200+ in Target Practice',         cond: s => (s.bestScores.target||0) >= 200 },
    { id: 'speed_demon',    name: 'Speed Demon',      icon: '⚡', desc: 'Hit a streak of 5 in Target Practice',  cond: s => s.achievements.speed_demon_earned },
    { id: 'puzzle_wizard',  name: 'Puzzle Wizard',    icon: '🧙', desc: 'Solve a puzzle in under 60 moves',       cond: s => s.achievements.puzzle_wizard_earned },
    { id: 'maze_master',    name: 'Maze Master',      icon: '🌀', desc: 'Complete a maze under 30s',              cond: s => (s.bestScores.maze||999) < 30 },
    { id: 'trivia_ace',     name: 'Trivia Ace',       icon: '🧠', desc: 'Score 10/10 in Trivia',                  cond: s => s.achievements.trivia_ace_earned },
    { id: 'fish_hunter',    name: 'Fish Hunter',      icon: '🐟', desc: 'Score 150+ in Fish Table',               cond: s => (s.bestScores.fish||0) >= 150 },
    { id: 'vault_explorer', name: 'Vault Explorer',   icon: '🔓', desc: 'Unlock all 5 vault rooms',               cond: s => (s.totalScore||0) >= 1200 },
    { id: 'centurion',      name: 'Centurion',        icon: '💯', desc: 'Reach 1000 total score',                 cond: s => (s.totalScore||0) >= 1000 },
    { id: 'grandmaster',    name: 'Grandmaster',      icon: '👑', desc: 'Reach 5000 total score',                 cond: s => (s.totalScore||0) >= 5000 },
    { id: 'daily_warrior',  name: 'Daily Warrior',    icon: '🔥', desc: 'Complete a daily challenge',             cond: s => s.dailyDone },
    { id: 'combo_king',     name: 'Combo King',       icon: '💥', desc: 'Reach 10× streak in Target',             cond: s => s.achievements.combo_king_earned },
  ],

  // ---- COSMETIC DEFINITIONS ----
  cosmetics: [
    { id: 'theme_neon',    name: 'Neon Grid',      icon: '💜', req: 'first_shot',    desc: 'Req: First Shot'    },
    { id: 'theme_fire',    name: 'Fire Vault',     icon: '🔥', req: 'sharp_eye',     desc: 'Req: Sharp Eye'     },
    { id: 'theme_ocean',   name: 'Ocean Depths',   icon: '🌊', req: 'fish_hunter',   desc: 'Req: Fish Hunter'   },
    { id: 'theme_ice',     name: 'Ice Chamber',    icon: '❄',  req: 'maze_master',   desc: 'Req: Maze Master'   },
    { id: 'theme_galaxy',  name: 'Galaxy Vault',   icon: '🌌', req: 'vault_explorer',desc: 'Req: Vault Explorer' },
    { id: 'avatar_ninja',  name: 'Ninja Avatar',   icon: '🥷', req: 'speed_demon',   desc: 'Req: Speed Demon'   },
    { id: 'avatar_wizard', name: 'Wizard Avatar',  icon: '🧙', req: 'puzzle_wizard', desc: 'Req: Puzzle Wizard'  },
    { id: 'avatar_ace',    name: 'Ace Avatar',     icon: '🎓', req: 'trivia_ace',    desc: 'Req: Trivia Ace'    },
    { id: 'crown',         name: 'Crown Badge',    icon: '👑', req: 'grandmaster',   desc: 'Req: Grandmaster'   },
  ],

  // ---- LEADERBOARD SEED DATA ----
  leaderboardData: {
    target: [
      { name: 'Israel Lopez', score: 412 }, { name: 'VaultAce',    score: 388 },
      { name: 'NeonKnight',   score: 350 }, { name: 'PixelHunter', score: 298 },
      { name: 'ArcaneFire',   score: 245 },
    ],
    puzzle: [
      { name: 'Israel Lopez', score: 28 }, { name: 'GridMaster', score: 34 },
      { name: 'SlidePro',     score: 42 }, { name: 'PuzzleWiz',  score: 58 },
      { name: 'TileKing',     score: 67 },
    ],
    maze: [
      { name: 'Israel Lopez', score: 18 }, { name: 'SpeedRunner', score: 21 },
      { name: 'MazeBot',      score: 25 }, { name: 'LabyLord',    score: 32 },
      { name: 'WallBreaker',  score: 38 },
    ],
    trivia: [
      { name: 'Israel Lopez', score: 10 }, { name: 'BrainBox',   score: 9 },
      { name: 'QuizKing',     score: 8  }, { name: 'FactFire',   score: 7 },
      { name: 'KnowItAll',    score: 6  },
    ],
    fish: [
      { name: 'Israel Lopez', score: 280 }, { name: 'DeepHunter',  score: 245 },
      { name: 'OceanKing',    score: 210 }, { name: 'NetMaster',   score: 178 },
      { name: 'TideFisher',   score: 142 },
    ],
  },

  // ---- PERSISTENCE ----
  save() {
    try { localStorage.setItem('sv2_state', JSON.stringify(this.state)); } catch(e) {}
  },
  load() {
    try {
      const raw = localStorage.getItem('sv2_state');
      if (raw) this.state = Object.assign({}, this.state, JSON.parse(raw));
    } catch(e) {}
    // Reset daily if new day
    const today = new Date().toDateString();
    if (this.state.dailyDate !== today) {
      this.state.dailyDone = false;
      this.state.dailyDate = today;
    }
    this.updateHUD();
  },

  enterVault() {
    SFX.click();
    showScreen('main-menu');
  },

  // ---- SCORE & XP ----
  addScore(pts) {
    this.state.totalScore += pts;
    this.state.xp        += pts;
    const xpNeeded = this.levelXP(this.state.level);
    if (this.state.xp >= xpNeeded) {
      this.state.xp -= xpNeeded;
      this.state.level++;
      toast(`🆙 LEVEL UP! You're now Level ${this.state.level}!`);
      SFX.unlock();
    }
    this.save();
    this.updateHUD();
    this.checkAchievements();
  },

  levelXP(lvl) { return 200 + lvl * 100; },

  updateHUD() {
    const ts = el('totalScore'); if (ts) ts.textContent = this.state.totalScore.toLocaleString();
    const pl = el('playerLevel'); if (pl) pl.textContent = this.state.level;
    const bc = el('badgeCount'); if (bc) bc.textContent = Object.keys(this.state.achievements).length;
    const xf = el('xpFill');
    if (xf) {
      const pct = Math.min(100, Math.round((this.state.xp / this.levelXP(this.state.level)) * 100));
      xf.style.width = pct + '%';
    }
  },

  // ---- ACHIEVEMENTS ----
  checkAchievements() {
    this.achievements.forEach(a => {
      if (!this.state.achievements[a.id] && a.cond(this.state)) {
        this.state.achievements[a.id] = true;
        this.state.badges = Object.keys(this.state.achievements).length;
        this.save();
        this.updateHUD();
        setTimeout(() => {
          toast(`🎖 Achievement Unlocked: ${a.name}!`, 4000);
          SFX.badge();
        }, 400);
      }
    });
  },

  saveBest(game, score, lowerIsBetter = false) {
    const cur = this.state.bestScores[game];
    const isNew = cur === undefined || (lowerIsBetter ? score < cur : score > cur);
    if (isNew) {
      this.state.bestScores[game] = score;
      this.save();
      // Update leaderboard seed
      const board = this.leaderboardData[game];
      if (board) {
        const idx = board.findIndex(e => e.name === 'Israel Lopez');
        if (idx !== -1) {
          const better = lowerIsBetter ? score < board[idx].score : score > board[idx].score;
          if (better || true) {
            board[idx].score = score;
            board.sort((a, b) => lowerIsBetter ? a.score - b.score : b.score - a.score);
          }
        }
      }
    }
    return isNew;
  },
};

// ---- HELPERS ----
function el(id) { return document.getElementById(id); }

function showScreen(id) {
  SFX.click();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = el(id);
  if (!screen) return;
  screen.classList.add('active');
  screen.scrollTop = 0;
  if (id === 'vault-map')       renderVaultMap();
  if (id === 'leaderboard')     loadLeaderboard('target');
  if (id === 'achievements')    renderAchievements();
  if (id === 'shop')            renderShop();
  if (id === 'daily-challenge') renderDailyChallenge();
}

function exitGame(back) {
  stopAllTimers();
  window.onkeydown = null;
  // Reset game screens back to diff-select
  ['tp','pb','mz','tv','ft'].forEach(prefix => {
    const ds = el(prefix + '-diff-select');
    if (ds) ds.style.display = '';
    const cv = el(prefix + '-canvas');
    if (cv) cv.style.display = 'none';
    const rs = el(prefix + '-result');
    if (rs) rs.style.display = 'none';
    const gm = el(prefix + '-game');
    if (gm) gm.style.display = 'none';
    const ct = el(prefix + '-controls');
    if (ct) ct.style.display = 'none';
  });
  showScreen(back);
}

let _toastTimer = null;
function toast(msg, dur = 3000) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), dur);
}

// ---- VAULT MAP ----
function renderVaultMap() {
  const c = el('vaultRooms');
  if (!c) return;
  c.innerHTML = '';
  SV.rooms.forEach(room => {
    const unlocked = SV.state.totalScore >= room.minScore;
    const best = SV.state.bestScores[room.id] || 0;
    const maxBest = Math.max(room.minScore * 2, 400);
    const progress = Math.min(100, Math.round((best / maxBest) * 100));
    const div = document.createElement('div');
    div.className = `room-card ${unlocked ? 'unlocked' : 'locked'}`;
    div.innerHTML = `
      <div class="room-icon">${room.icon}</div>
      <div class="room-name">${room.name}</div>
      <div class="room-desc">${room.desc}</div>
      <div class="room-theme">⬡ ${room.theme}</div>
      <div class="room-best">${unlocked
        ? (best > 0 ? 'Best: ' + best : 'Not played yet')
        : `🔒 Unlock at ${room.minScore} pts`
      }</div>
      <div class="room-progress">
        <div class="room-progress-fill" style="width:${progress}%"></div>
      </div>
    `;
    if (unlocked) div.onclick = () => { SFX.click(); showScreen(room.gameId); };
    c.appendChild(div);
  });
}

// ---- LEADERBOARD ----
function loadLeaderboard(type) {
  document.querySelectorAll('.lb-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.type === type)
  );
  const data = SV.leaderboardData[type] || [];
  const list = el('lb-list');
  if (!list) return;
  const medals = ['🥇','🥈','🥉'];
  const rankClass = ['gold','silver','bronze'];
  const suffix = { maze: 's', puzzle: ' moves' };
  list.innerHTML = data.map((e, i) => `
    <div class="lb-entry">
      <div class="lb-rank ${rankClass[i]||''}">${medals[i] || (i+1)}</div>
      <div class="lb-name">${e.name}</div>
      <div class="lb-score">${e.score}${suffix[type]||' pts'}</div>
    </div>
  `).join('');
}

// ---- ACHIEVEMENTS ----
function renderAchievements() {
  const g = el('achievements-grid'); if (!g) return;
  const earned = Object.keys(SV.state.achievements).length;
  const lbl = el('ach-count-label');
  if (lbl) lbl.textContent = `${earned} / ${SV.achievements.length} earned`;
  g.innerHTML = SV.achievements.map(a => {
    const e = !!SV.state.achievements[a.id];
    return `
      <div class="ach-card ${e ? 'earned' : 'locked'}">
        <div class="ach-icon">${a.icon}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        ${e ? '<div class="ach-earned-badge">✅ EARNED</div>' : ''}
      </div>`;
  }).join('');
}

// ---- SHOP ----
function renderShop() {
  const g = el('cosmetics-grid'); if (!g) return;
  g.innerHTML = SV.cosmetics.map(c => {
    const u = !!SV.state.achievements[c.req];
    return `
      <div class="cosmetic-card ${u ? 'unlocked' : ''}">
        <div class="cosmetic-preview">${c.icon}</div>
        <div class="cosmetic-name">${c.name}</div>
        <div class="cosmetic-req">${u ? '✅ Unlocked' : c.desc}</div>
      </div>`;
  }).join('');
}

// ---- DAILY CHALLENGE ----
const DAILY_CHALLENGES = [
  { game: 'target-practice', title: '🎯 Speed Shooter',   desc: 'Score 150+ in Target Practice (Skilled)',         reward: '60 bonus pts', threshold: 150 },
  { game: 'puzzle-boards',   title: '🧩 Efficiency Run',   desc: 'Solve a 3×3 puzzle in under 50 moves',            reward: '50 bonus pts', threshold: 50  },
  { game: 'maze-runner',     title: '🌀 Maze Sprinter',    desc: 'Complete the small maze in under 40 seconds',     reward: '70 bonus pts', threshold: 40  },
  { game: 'trivia-vault',    title: '🧠 Knowledge Blitz',  desc: 'Answer 8 or more correctly in any Trivia round',  reward: '55 bonus pts', threshold: 8   },
  { game: 'fish-table',      title: '🐟 Fish Frenzy',      desc: 'Score 100+ in Fish Table (any power level)',      reward: '65 bonus pts', threshold: 100 },
];

function renderDailyChallenge() {
  const day = new Date().getDay();
  const ch  = DAILY_CHALLENGES[day % DAILY_CHALLENGES.length];
  const done = SV.state.dailyDone;
  const resetHr = 24 - new Date().getHours();
  const c = el('daily-content'); if (!c) return;
  c.innerHTML = `
    <div class="daily-card">
      <h3>${ch.title}</h3>
      <p>${ch.desc}</p>
      <div class="daily-reward">🎁 Reward: ${ch.reward}</div>
      ${done
        ? '<div style="color:var(--neon-green);font-size:20px;font-weight:700;margin:12px 0">✅ COMPLETED TODAY!</div>'
        : `<button class="btn-primary" onclick="showScreen('${ch.game}')">START NOW</button>`
      }
      <div class="daily-timer">⏰ Resets in ~${resetHr} hour${resetHr !== 1 ? 's' : ''}</div>
    </div>`;
}

// ---- TIMER UTILITIES ----
const _timers = {};
function setGameTimer(id, fn, ms) {
  clearInterval(_timers[id]);
  _timers[id] = setInterval(fn, ms);
}
function clearGameTimer(id) {
  if (_timers[id]) { clearInterval(_timers[id]); delete _timers[id]; }
}
function stopAllTimers() {
  Object.keys(_timers).forEach(k => { clearInterval(_timers[k]); delete _timers[k]; });
}

// ---- PARTICLES ----
function spawnParticles() {
  const c = el('splashParticles'); if (!c) return;
  const cols = ['#FFD700','#FF6B00','#00F5FF','#BF00FF','#00FF88'];
  for (let i = 0; i < 35; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = 3 + Math.random() * 5;
    p.style.cssText = `
      left:${Math.random()*100}vw;
      width:${sz}px; height:${sz}px;
      background:${cols[i % cols.length]};
      animation-duration:${5 + Math.random() * 9}s;
      animation-delay:${Math.random() * 8}s;
    `;
    c.appendChild(p);
  }
}

// ---- INIT ----
window.addEventListener('DOMContentLoaded', () => {
  SV.load();
  spawnParticles();
});
