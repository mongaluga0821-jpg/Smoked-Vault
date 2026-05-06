// ============================================================
// SMOKED VAULT v2.0 – MAZE RUNNER
// Perfect recursive-backtracker on ODD-sized grids
// ============================================================

'use strict';

const MZ = {
  canvas: null, ctx: null,
  grid: [], size: 11, cellSize: 0,
  player: { x: 1, y: 1 },
  startTime: null, running: false,
  WALL: 0, PATH: 1,

  init(size) {
    // Force odd so maze generator works perfectly
    this.size    = size % 2 === 0 ? size + 1 : size;
    this.running = false;

    this.canvas = el('mz-canvas');
    this.ctx    = this.canvas.getContext('2d');

    const maxW    = Math.min(window.innerWidth - 32, 560);
    this.cellSize = Math.max(4, Math.floor(maxW / this.size));
    this.canvas.width  = this.cellSize * this.size;
    this.canvas.height = this.cellSize * this.size;

    el('mz-diff-select').style.display = 'none';
    el('mz-result').style.display      = 'none';
    el('mz-canvas').style.display      = 'block';
    el('mz-controls').style.display    = 'flex';
    el('mz-level').textContent = SV.state.level;
    el('mz-best').textContent  = SV.state.bestScores.maze || '--';

    this._generate();
    this.player = { x: 1, y: 1 };
    this._startTimer();
    this.running = true;
    this._draw();

    window.onkeydown = e => {
      const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
                    w:'up', s:'down', a:'left', d:'right' };
      if (map[e.key]) { e.preventDefault(); this._move(map[e.key]); }
    };
  },

  // Recursive backtracker on a grid where walls are cells (standard 2k+1 approach)
  _generate() {
    const S = this.size;
    // All walls initially
    this.grid = Array.from({ length: S }, () => Array(S).fill(this.WALL));

    // Carve passages from odd-coordinate cells
    const carve = (cx, cy) => {
      this.grid[cy][cx] = this.PATH;
      const dirs = this._shuffle4();
      for (const [dx, dy] of dirs) {
        const nx = cx + dx*2, ny = cy + dy*2;
        if (nx > 0 && ny > 0 && nx < S-1 && ny < S-1 && this.grid[ny][nx] === this.WALL) {
          this.grid[cy + dy][cx + dx] = this.PATH;
          carve(nx, ny);
        }
      }
    };
    carve(1, 1);

    // Guarantee exit cell path
    const ex = S-2, ey = S-2;
    this.grid[ey][ex] = this.PATH;
    if (ex > 1) this.grid[ey][ex-1] = this.PATH;
    if (ey > 1) this.grid[ey-1][ex] = this.PATH;
  },

  _shuffle4() {
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    for (let i = dirs.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    return dirs;
  },

  _move(dir) {
    if (!this.running) return;
    const S = this.size;
    let nx = this.player.x, ny = this.player.y;
    if (dir === 'up')    ny--;
    if (dir === 'down')  ny++;
    if (dir === 'left')  nx--;
    if (dir === 'right') nx++;
    if (nx < 0 || ny < 0 || nx >= S || ny >= S) return;
    if (this.grid[ny][nx] === this.WALL) { SFX.miss(); return; }
    this.player.x = nx; this.player.y = ny;
    SFX.move();
    this._draw();
    if (nx === S-2 && ny === S-2) this._end();
  },

  _draw() {
    const C = this.cellSize, S = this.size, ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const isPath   = this.grid[y][x] === this.PATH;
        const isPlayer = this.player.x === x && this.player.y === y;
        const isExit   = x === S-2 && y === S-2;

        if (isPath) {
          ctx.fillStyle = isExit ? 'rgba(0,255,136,0.18)' : '#0E0E22';
        } else {
          ctx.fillStyle = '#030308';
        }
        ctx.fillRect(x*C, y*C, C, C);

        if (!isPath) {
          ctx.fillStyle = 'rgba(0,245,255,0.05)';
          ctx.fillRect(x*C+1, y*C+1, C-2, C-2);
        }

        if (isExit && !isPlayer) {
          ctx.textAlign = 'center';
          ctx.font = `${Math.max(10, Math.floor(C*0.7))}px serif`;
          ctx.fillText('🚪', x*C + C/2, y*C + C*0.78);
        }

        if (isPlayer) {
          const g = ctx.createRadialGradient(x*C+C/2, y*C+C/2, 0, x*C+C/2, y*C+C/2, C*0.45);
          g.addColorStop(0, '#FFD700');
          g.addColorStop(1, '#FF6B00');
          ctx.beginPath();
          ctx.arc(x*C+C/2, y*C+C/2, C*0.38, 0, Math.PI*2);
          ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        }
      }
    }
  },

  _startTimer() {
    clearGameTimer('mz-clock');
    this.startTime = Date.now();
    setGameTimer('mz-clock', () => {
      el('mz-timer').textContent = Math.floor((Date.now() - this.startTime) / 1000);
    }, 500);
  },

  _end() {
    this.running = false;
    clearGameTimer('mz-clock');
    window.onkeydown = null;

    const secs  = Math.floor((Date.now() - this.startTime) / 1000);
    const score = Math.max(10, 600 - secs*6);
    const isNew = SV.saveBest('maze', secs, true);

    SV.addScore(score);
    SV.checkAchievements();
    SFX.win();
    window._dailyCheck('maze-runner', secs);

    el('mz-canvas').style.display   = 'none';
    el('mz-controls').style.display = 'none';

    const r = el('mz-result');
    r.style.display = 'block';
    r.innerHTML = `
      <h3>🌀 MAZE CLEARED!</h3>
      <div class="result-stat"><span class="label">Time</span><span class="value">${secs}s${isNew ? ' <span class="result-new">🆕 BEST!</span>' : ''}</span></div>
      <div class="result-stat"><span class="label">Maze Size</span><span class="value">${this.size}×${this.size}</span></div>
      <div class="result-stat"><span class="label">Points Earned</span><span class="value">${score} pts</span></div>
      <div class="result-stat"><span class="label">Best Time</span><span class="value">${SV.state.bestScores.maze || secs}s</span></div>
      <div class="result-buttons">
        <button class="btn-primary"   onclick="startMaze(${this.size})">NEXT MAZE</button>
        <button class="btn-secondary" onclick="showScreen('maze-runner')">CHANGE SIZE</button>
        <button class="btn-secondary" onclick="exitGame('vault-map')">VAULT MAP</button>
      </div>`;
  },
};

function startMaze(size) { MZ.init(size); }
function moveMaze(dir)   { MZ._move(dir); }
