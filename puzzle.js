// ============================================================
// SMOKED VAULT v2.0 – PUZZLE BOARDS
// ============================================================

'use strict';

const PB = {
  size: 3, tiles: [], empty: 0,
  moves: 0, solved: false, hintUsed: false,
  startTime: null,

  init(sizeStr) {
    const map = { '3x3': 3, '4x4': 4, '5x5': 5 };
    this.size     = map[sizeStr] || 3;
    this.moves    = 0;
    this.solved   = false;
    this.hintUsed = false;

    el('pb-diff-select').style.display = 'none';
    el('pb-result').style.display      = 'none';
    el('pb-game').style.display        = 'block';
    el('pb-moves').textContent = '0';
    el('pb-best').textContent  = SV.state.bestScores.puzzle || '--';

    this._generate();
    this._doShuffle(90 + this.size * 25);
    this._startTimer();
    this._render();
  },

  _generate() {
    const n = this.size * this.size;
    this.tiles = Array.from({ length: n }, (_, i) => i);
    this.empty = n - 1;
  },

  _doShuffle(moves) {
    for (let i = 0; i < moves; i++) {
      const adj = this._adjacent(this.empty);
      const pick = adj[Math.floor(Math.random() * adj.length)];
      this._swap(this.empty, pick);
    }
  },

  _adjacent(idx) {
    const S = this.size, row = Math.floor(idx/S), col = idx%S;
    const dirs = [];
    if (row > 0)   dirs.push(idx - S);
    if (row < S-1) dirs.push(idx + S);
    if (col > 0)   dirs.push(idx - 1);
    if (col < S-1) dirs.push(idx + 1);
    return dirs;
  },

  _swap(a, b) {
    [this.tiles[a], this.tiles[b]] = [this.tiles[b], this.tiles[a]];
    if (this.tiles[a] === this.size*this.size-1) this.empty = a;
    if (this.tiles[b] === this.size*this.size-1) this.empty = b;
  },

  _render() {
    const grid = el('puzzle-grid');
    const S    = this.size;
    const maxW = Math.min(window.innerWidth - 60, 520);
    const ts   = Math.min(Math.floor(maxW / S), 96);
    grid.style.gridTemplateColumns = `repeat(${S}, ${ts}px)`;
    grid.innerHTML = '';

    const isSolved = this._isSolved();
    this.tiles.forEach((val, idx) => {
      const isBlank = val === S*S - 1;
      const tile    = document.createElement('div');
      tile.className = 'puzzle-tile' + (isBlank ? ' empty' : '') + (isSolved && !isBlank ? ' solved' : '');
      tile.style.cssText = `width:${ts}px;height:${ts}px;`;
      if (!isBlank) {
        tile.textContent = val + 1;
        tile.onclick = () => this._tryMove(idx);
      }
      grid.appendChild(tile);
    });
  },

  _tryMove(idx) {
    if (this.solved) return;
    const adj = this._adjacent(this.empty);
    if (!adj.includes(idx)) { SFX.miss(); return; }
    this._swap(this.empty, idx);
    this.moves++;
    el('pb-moves').textContent = this.moves;
    SFX.move();
    this._render();
    if (this._isSolved()) this._end();
  },

  _isSolved() {
    return this.tiles.every((v, i) => v === i);
  },

  hint() {
    this.hintUsed = true;
    toast('💡 Move tiles adjacent to the blank space in ascending order!');
  },

  _startTimer() {
    clearGameTimer('pb-clock');
    this.startTime = Date.now();
    setGameTimer('pb-clock', () => {
      el('pb-timer').textContent = Math.floor((Date.now() - this.startTime) / 1000);
    }, 500);
  },

  _end() {
    this.solved = true;
    clearGameTimer('pb-clock');
    const secs     = Math.floor((Date.now() - this.startTime) / 1000);
    const penalty  = Math.max(0, this.moves - this.size*this.size) * 4;
    const score    = Math.max(10, 1200 - secs*2 - penalty - (this.hintUsed ? 50 : 0));
    if (this.moves < 60) { SV.state.achievements.puzzle_wizard_earned = true; SV.save(); }
    const isNew = SV.saveBest('puzzle', this.moves, true);
    SV.addScore(score);
    SV.checkAchievements();
    SFX.win();
    window._dailyCheck('puzzle-boards', this.moves);

    el('pb-game').style.display   = 'none';
    const r = el('pb-result');
    r.style.display = 'block';
    r.innerHTML = `
      <h3>🧩 PUZZLE SOLVED!</h3>
      <div class="result-stat"><span class="label">Time</span><span class="value">${secs}s</span></div>
      <div class="result-stat"><span class="label">Moves</span><span class="value">${this.moves}${isNew ? ' <span class="result-new">🆕 BEST!</span>' : ''}</span></div>
      <div class="result-stat"><span class="label">Grid Size</span><span class="value">${this.size}×${this.size}</span></div>
      <div class="result-stat"><span class="label">Hint Used</span><span class="value">${this.hintUsed ? '⚠ Yes' : '✅ No'}</span></div>
      <div class="result-stat"><span class="label">Points Earned</span><span class="value">${score} pts</span></div>
      <div class="result-buttons">
        <button class="btn-primary"   onclick="startPuzzle('${this.size}x${this.size}')">PLAY AGAIN</button>
        <button class="btn-secondary" onclick="showScreen('puzzle-boards')">CHANGE SIZE</button>
        <button class="btn-secondary" onclick="exitGame('vault-map')">VAULT MAP</button>
      </div>`;
  },
};

function startPuzzle(size) { PB.init(size); }
function shufflePuzzle()    { PB._doShuffle(40); PB._render(); toast('🔀 Reshuffled!'); }
function solvePuzzleHint()  { PB.hint(); }
