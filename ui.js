// ============================================================
// SMOKED VAULT v3.0 – UI & GLOBAL EVENT WIRING
// ============================================================

'use strict';

// ---- LEADERBOARD TABS (event delegation) ----
document.addEventListener('click', e => {
  const tab = e.target.closest('.lb-tab');
  if (tab) {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadLeaderboard(tab.dataset.type);
  }
});

// ---- ESC KEY ----
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const active = document.querySelector('.screen.active');
  if (!active || active.id === 'splash-screen' || active.id === 'main-menu') return;
  const gameScreens = ['target-practice','puzzle-boards','maze-runner','trivia-vault','fish-table'];
  stopAllTimers();
  window.onkeydown = null;
  // Clean up fish keyboard handlers
  if (window._ftKeydown) document.removeEventListener('keydown', window._ftKeydown);
  if (window._ftKeyup)   document.removeEventListener('keyup',   window._ftKeyup);
  showScreen(gameScreens.includes(active.id) ? 'vault-map' : 'main-menu');
});

// ---- DAILY CHALLENGE COMPLETION HOOK ----
window._dailyCheck = function(gameId, score) {
  const day = new Date().getDay();
  const ch  = DAILY_CHALLENGES[day % DAILY_CHALLENGES.length];
  if (SV.state.dailyDone) return;
  if (gameId !== ch.game)  return;
  const lowerBetter = (gameId === 'maze-runner' || gameId === 'puzzle-boards');
  const met = lowerBetter ? score <= ch.threshold : score >= ch.threshold;
  if (met) {
    SV.state.dailyDone = true;
    SV.state.dailyDate = new Date().toDateString();
    SV.addScore(50);
    SV.save();
    setTimeout(() => { toast('🔥 Daily Challenge Complete! +50 pts!', 4500); SFX.badge(); }, 500);
  }
};

// ---- FISH CODEX RENDERER ----
function renderFishCodex() {
  const grid = el('codex-grid'); if (!grid) return;
  const prog = el('codex-progress');

  // Pull caught data from last fish game session (stored in FT.caught)
  // Also persist to SV.state.fishCodex
  if (!SV.state.fishCodex) SV.state.fishCodex = {};
  // Merge FT.caught into persistent codex
  if (typeof FT !== 'undefined' && FT.caught) {
    Object.entries(FT.caught).forEach(([name, cnt]) => {
      SV.state.fishCodex[name] = (SV.state.fishCodex[name] || 0) + cnt;
    });
    SV.save();
  }

  const tierLabels  = ['COMMON','RARE','EPIC','BOSS/MYSTERY'];
  const tierBadge   = ['t0','t1','t2','t3'];
  const species     = FT.SPECIES;
  const seenCount   = species.filter(s => SV.state.fishCodex[s.name] > 0).length;

  if (prog) prog.textContent = `${seenCount} / ${species.length} species discovered`;

  grid.innerHTML = species.map(s => {
    const caught = SV.state.fishCodex[s.name] || 0;
    const seen   = caught > 0;
    return `
      <div class="codex-card ${seen ? 'seen' : 'unseen'}">
        <span class="codex-tier-badge ${tierBadge[s.tier]}">${tierLabels[s.tier]}</span>
        <div class="codex-emoji">${s.emoji}</div>
        <div class="codex-name">${s.name}</div>
        <div class="codex-tier">${tierLabels[s.tier]}</div>
        <div class="codex-pts">+${s.pts} pts</div>
        ${seen
          ? `<div class="codex-count">×${caught} caught</div>`
          : `<div class="codex-unseen-label">Not yet caught</div>`}
      </div>`;
  }).join('');
}

// ---- EXTEND showScreen to wire codex ----
const _origShowScreen = showScreen;
window.showScreen = function(id) {
  _origShowScreen(id);
  if (id === 'fish-codex') renderFishCodex();
  if (id === 'fish-table') { setTimeout(() => typeof FT !== 'undefined' && FT._renderLobby(), 50); }
};

// ---- PREVENT DOUBLE-TAP ZOOM ----
document.addEventListener('touchend', e => {
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'CANVAS') e.preventDefault();
}, { passive: false });

// ---- RESPONSIVE CANVAS RESIZE ----
window.addEventListener('resize', () => {
  const active = document.querySelector('.screen.active');
  if (!active) return;
  if (active.id === 'maze-runner' && typeof MZ !== 'undefined' && MZ.running) {
    const maxW = Math.min(window.innerWidth - 32, 560);
    MZ.cellSize = Math.max(4, Math.floor(maxW / MZ.size));
    MZ.canvas.width  = MZ.cellSize * MZ.size;
    MZ.canvas.height = MZ.cellSize * MZ.size;
    MZ._draw();
  }
});

// ---- FIRST-LOAD WELCOME ----
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!SV.state.totalScore) {
      toast('🔓 Welcome to SMOKED VAULT v3! Hit ENTER VAULT to begin.', 5000);
    } else {
      toast(`👋 Welcome back, Israel! Score: ${SV.state.totalScore.toLocaleString()} pts`, 4000);
    }
  }, 1600);
});
