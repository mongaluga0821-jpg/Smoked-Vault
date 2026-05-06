// ============================================================
// SMOKED VAULT – OCEAN KING v4.0
// © Israel Lopez — Educational Arcade Simulation
//
// WHAT'S NEW vs v3:
//  ▸ WEAPON SYSTEM  — 5 swappable guns (Pistol/Shotgun/Laser/Net-Cannon/Nuke)
//  ▸ BOSS RUSH MODE — dedicated wave mode with multi-stage boss patterns
//  ▸ DOUBLE SPEED FRENZY — arcade variant: time-limited hyper mode
//  ▸ OCEAN CURRENTS — moving water streams that push fish & bullets
//  ▸ WAVE SCHOOLING — common fish travel in formation waves
//  ▸ BOSS AI PHASES — bosses change speed/direction/dive at 50% HP
//  ▸ WEAK POINTS — flashing weakspot on bosses; hitting it = 3× damage
//  ▸ DAILY LOGIN REWARD — first run each day grants bonus ammo
//  ▸ SEASONAL EVENT FISH — golden dragon appears during "Season Event"
//  ▸ LOOT CHESTS — rare floating chests with ammo/multiplier rewards
//  ▸ COMBO POPUP FLOATERS — point text rises from kill location
//  ▸ WEAPON UPGRADE BAR — earn kills to level-up current weapon
//  ▸ REPLAY STATS SCREEN — detailed session breakdown
//  ▸ CURRENT VISUAL — animated arrows showing water flow
// ============================================================

'use strict';

// ── WEAPON DEFINITIONS ────────────────────────────────────────
const WEAPONS = {
  pistol:  { name:'Pistol',     emoji:'🔫', ammoCost:1,   hitR:6,   aoe:0,   special:null,       color:'#FFD700', desc:'Precise · 1 ammo'      },
  shotgun: { name:'Shotgun',    emoji:'💥', ammoCost:2,   hitR:16,  aoe:0,   special:'spread',   color:'#FF6B00', desc:'Wide spread · 2 ammo'  },
  laser:   { name:'Laser',      emoji:'⚡', ammoCost:1.5, hitR:4,   aoe:0,   special:'pierce',   color:'#00F5FF', desc:'Pierces · 1.5 ammo'    },
  netcann: { name:'Net Cannon', emoji:'🕸', ammoCost:3,   hitR:30,  aoe:0,   special:'net',      color:'#00FF88', desc:'Huge radius · 3 ammo'  },
  nuke:    { name:'Nuke',       emoji:'☢',  ammoCost:8,   hitR:80,  aoe:80,  special:'nuke',     color:'#FF3366', desc:'AoE nuke · 8 ammo'     },
};

// ── FISH SPECIES (full catalogue) ─────────────────────────────
const FISH_SPECIES = [
  // tier 0 – Common
  { emoji:'🐟', color:'#00BFFF', tier:0, pts:2,  r:24, name:'Blue Fish',    schooling:true  },
  { emoji:'🐠', color:'#FF6B35', tier:0, pts:3,  r:22, name:'Clown Fish',   schooling:true  },
  { emoji:'🐡', color:'#FF9500', tier:0, pts:4,  r:20, name:'Puffer Fish',  schooling:false },
  // tier 1 – Rare
  { emoji:'🦈', color:'#4A90D9', tier:1, pts:8,  r:30, name:'Shark',        evade:true      },
  { emoji:'🐬', color:'#00F5FF', tier:1, pts:7,  r:26, name:'Dolphin',      evade:true      },
  { emoji:'🦐', color:'#FF69B4', tier:1, pts:6,  r:18, name:'Shrimp',       evade:false     },
  { emoji:'🦀', color:'#CC3300', tier:1, pts:9,  r:20, name:'Crab',         evade:false     },
  // tier 2 – Epic
  { emoji:'🐙', color:'#BF00FF', tier:2, pts:15, r:28, name:'Octopus',      dive:true       },
  { emoji:'🦑', color:'#FF3366', tier:2, pts:14, r:24, name:'Squid',        dive:true       },
  { emoji:'🦞', color:'#FF4500', tier:2, pts:12, r:20, name:'Lobster',      evade:false     },
  { emoji:'🐊', color:'#228B22', tier:2, pts:18, r:28, name:'Sea Gator',    dive:true       },
  // tier 3 – Boss
  { emoji:'🐳', color:'#0080FF', tier:3, pts:50, r:46, name:'Blue Whale',   boss:true, hp:5, phases:2 },
  { emoji:'🦑', color:'#660099', tier:3, pts:60, r:40, name:'Kraken',       boss:true, hp:7, phases:3 },
  { emoji:'🐲', color:'#FFD700', tier:3, pts:80, r:42, name:'Sea Dragon',   boss:true, hp:6, phases:2, seasonal:true },
  // Mystery
  { emoji:'⭐', color:'#FFD700', tier:3, pts:25, r:22, name:'Mystery Star', mystery:true    },
  { emoji:'💎', color:'#00FFFF', tier:3, pts:35, r:20, name:'Diamond Fish', mystery:true    },
];

// ── POWER-UP TYPES ────────────────────────────────────────────
const POWERUP_TYPES = [
  { id:'net',     emoji:'🕸', label:'NET BLAST',   color:'#00FF88', dur:0   },
  { id:'freeze',  emoji:'❄',  label:'FREEZE!',      color:'#00F5FF', dur:180 },
  { id:'magnet',  emoji:'🧲', label:'MAGNET!',      color:'#FFD700', dur:150 },
  { id:'double',  emoji:'×2', label:'DOUBLE PTS!',  color:'#FF6B00', dur:200 },
  { id:'rapid',   emoji:'⚡', label:'RAPID FIRE!',  color:'#BF00FF', dur:160 },
  { id:'ammo',    emoji:'🎯', label:'+12 AMMO',     color:'#00FF88', dur:0   },
  { id:'chest',   emoji:'📦', label:'LOOT CHEST!',  color:'#FFD700', dur:0   },
  { id:'shield',  emoji:'🛡', label:'SHIELD!',      color:'#4A90D9', dur:120 },
];

// ── GAME MODES ────────────────────────────────────────────────
const GAME_MODES = {
  standard:  { label:'STANDARD',     ammo:35, fishCount:7,  speed:1.6, time:70,  bossChance:0.04, desc:'Classic fish hunting'              },
  powershot: { label:'POWER SHOT',   ammo:28, fishCount:10, speed:2.4, time:60,  bossChance:0.08, desc:'Faster fish, bigger rewards'        },
  blaster:   { label:'BLASTER',      ammo:22, fishCount:13, speed:3.4, time:50,  bossChance:0.14, desc:'Boss fish appear often'             },
  bossrush:  { label:'BOSS RUSH',    ammo:40, fishCount:0,  speed:2.8, time:90,  bossChance:1.0,  desc:'Wave after wave of bosses only'     },
  frenzy:    { label:'SPEED FRENZY', ammo:50, fishCount:16, speed:5.0, time:30,  bossChance:0.05, desc:'Everything is 3× faster — 30s only' },
};

// ─────────────────────────────────────────────────────────────
const FT = {
  canvas: null, ctx: null,
  fish: [], particles: [], powerUps: [], bullets: [], floaters: [],
  obstacles: [], currents: [],

  // state
  score: 0, combo: 0, maxCombo: 0, comboTimer: 0,
  ammo: 0, timeLeft: 0, running: false, shakeFrames: 0,
  mode: 'standard',
  weapon: 'pistol',  weaponKills: 0, weaponLevel: 1,
  bossWave: 0,       bossesKilled: 0,
  sessionFish: 0,    sessionBosses: 0,
  charging: false, chargeStart: 0,
  effects: { freeze:0, magnet:0, double:0, rapid:0, shield:0 },
  caught: {},
  frenzyActive: false,

  // ── INIT ────────────────────────────────────────────────────
  init(modeKey, weaponKey) {
    this.mode        = modeKey || 'standard';
    this.weapon      = weaponKey || 'pistol';
    const cfg        = GAME_MODES[this.mode];
    this.score       = 0; this.combo = 0; this.maxCombo = 0; this.comboTimer = 0;
    this.ammo        = cfg.ammo; this.timeLeft = cfg.time;
    this.weaponKills = 0; this.weaponLevel = 1;
    this.bossWave    = 0; this.bossesKilled = 0;
    this.sessionFish = 0; this.sessionBosses = 0;
    this.fish = []; this.particles = []; this.powerUps = [];
    this.bullets = []; this.floaters = [];
    this.running = true; this.shakeFrames = 0;
    this.charging = false; this.frenzyActive = (this.mode === 'frenzy');
    this.effects = { freeze:0, magnet:0, double:0, rapid:0, shield:0 };

    // Daily login bonus
    if (!SV.state.fishLoginToday || SV.state.fishLoginDate !== new Date().toDateString()) {
      SV.state.fishLoginToday = true;
      SV.state.fishLoginDate  = new Date().toDateString();
      this.ammo += 5;
      setTimeout(() => toast('🎁 Daily login bonus: +5 ammo!', 3000), 600);
    }

    this.canvas = el('ft-canvas');
    this.ctx    = this.canvas.getContext('2d');
    const W = Math.min(window.innerWidth - 32, 760);
    const H = Math.min(window.innerHeight - 200, 520);
    this.canvas.width = W; this.canvas.height = H;

    this._buildEnvironment();
    this._buildCurrents();

    // Spawn fish (boss rush = wave)
    if (this.mode === 'bossrush') {
      this._spawnBossWave();
    } else {
      for (let i = 0; i < cfg.fishCount; i++) this._spawnFish();
    }

    this._schedulePowerUp();

    el('ft-diff-select').style.display = 'none';
    el('ft-result').style.display      = 'none';
    el('ft-canvas').style.display      = 'block';
    el('ft-hud').style.display         = 'flex';
    this._refreshHUD();

    // Click/touch shoot
    this.canvas.onclick = e => {
      const r = this.canvas.getBoundingClientRect();
      this._shoot(e.clientX - r.left, e.clientY - r.top);
    };
    this.canvas.ontouchstart = e => {
      e.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      const t = e.touches[0];
      this._shoot(t.clientX - r.left, t.clientY - r.top);
    };

    // Torpedo
    window._ftKeydown = e => { if (e.code==='Space'){e.preventDefault(); this._startCharge();} };
    window._ftKeyup   = e => { if (e.code==='Space'){e.preventDefault(); this._releaseTorpedo();} };
    document.addEventListener('keydown', window._ftKeydown);
    document.addEventListener('keyup',   window._ftKeyup);

    // Weapon hotkeys 1-5
    window._ftWeapon = e => {
      const map = {'1':'pistol','2':'shotgun','3':'laser','4':'netcann','5':'nuke'};
      if (map[e.key]) { this.weapon = map[e.key]; this._refreshHUD(); toast(`🔫 Switched to ${WEAPONS[this.weapon].name}`); }
    };
    document.addEventListener('keydown', window._ftWeapon);

    setGameTimer('ft-draw',  () => this._frame(), 16);
    setGameTimer('ft-clock', () => this._tick(),  1000);
  },

  // ── ENVIRONMENT ────────────────────────────────────────────
  _buildEnvironment() {
    const W = this.canvas.width, H = this.canvas.height;
    this.obstacles = [];
    [{x:W*.12,y:H-60},{x:W*.28,y:H-45},{x:W*.55,y:H-70},{x:W*.72,y:H-50},{x:W*.9,y:H-60}]
      .forEach(p => this.obstacles.push({type:'coral',x:p.x,y:p.y,w:44,h:55}));
    this.obstacles.push({type:'ship',x:W*.5-55,y:H-110,w:110,h:90});
    [.15,.4,.65,.85].forEach(fx =>
      this.obstacles.push({type:'rock',x:W*fx,y:H-22,w:30,h:18}));
  },

  _buildCurrents() {
    const W = this.canvas.width, H = this.canvas.height;
    // 2 horizontal ocean currents at different depths
    this.currents = [
      { y: H*0.25, vy:0, vx: 0.6,  w:W, strength:0.4, dir:1  },
      { y: H*0.55, vy:0, vx:-0.5,  w:W, strength:0.3, dir:-1 },
    ];
  },

  // ── FISH SPAWNING ──────────────────────────────────────────
  _spawnFish(forceTier) {
    const cfg = GAME_MODES[this.mode];
    const W   = this.canvas.width, H = this.canvas.height;
    const roll = Math.random();
    let tier;
    if (forceTier !== undefined) { tier = forceTier; }
    else if (roll < 0.05 && Math.random() < cfg.bossChance) { tier = 3; }
    else if (roll < 0.14) { tier = 2; }
    else if (roll < 0.38) { tier = 1; }
    else                  { tier = 0; }
    if (!forceTier && Math.random() < 0.025) tier = 3; // mystery chance

    // Seasonal event: Sea Dragon appears May–June
    const month = new Date().getMonth();
    const seasonal = (month === 4 || month === 5);

    let pool = FISH_SPECIES.filter(s => s.tier === tier);
    if (!seasonal) pool = pool.filter(s => !s.seasonal);
    if (!pool.length) pool = FISH_SPECIES.filter(s => s.tier === 0);
    const spec = pool[Math.floor(Math.random() * pool.length)];

    const r   = spec.r + Math.floor(Math.random()*4);
    const spd = (GAME_MODES[this.mode].speed) * (0.55 + Math.random()*0.9) * (tier===3?0.7:1) * (this.frenzyActive?1.5:1);
    const from = Math.random() > 0.5;

    const fish = {
      x: from ? -r : W+r, y: r + Math.random()*(H*0.68),
      vx: from ? spd : -spd, vy: (Math.random()-.5)*spd*0.5,
      r, tier,
      emoji: spec.emoji, color: spec.color, pts: spec.pts, name: spec.name,
      boss:    !!spec.boss, mystery: !!spec.mystery, seasonal: !!spec.seasonal,
      evade:   !!spec.evade, dive: !!spec.dive, schooling: !!spec.schooling,
      hp:      spec.hp||1, maxHp: spec.hp||1,
      phases:  spec.phases||1, phase: 1,
      pulse: Math.random()*Math.PI*2, shimmer:0,
      frozen:false, shieldHit:false,
      schoolId: spec.schooling && Math.random()<0.4 ? Math.floor(Math.random()*4) : -1,
      weakX: 0, weakY: 0, weakPulse: 0,  // weak point offset
    };

    // Boss: assign weak point offset
    if (fish.boss) { fish.weakX = (Math.random()-.5)*r*0.8; fish.weakY = (Math.random()-.5)*r*0.8; }
    this.fish.push(fish);
  },

  _spawnBossWave() {
    this.bossWave++;
    const count = 1 + Math.floor(this.bossWave * 0.7);
    for (let i = 0; i < Math.min(count, 4); i++) this._spawnFish(3);
    toast(`⚠ BOSS WAVE ${this.bossWave}! ${Math.min(count,4)} bosses!`, 3500);
    SFX.badge();
    this._screenShake(6);
  },

  // ── POWER-UP SCHEDULING ────────────────────────────────────
  _schedulePowerUp() {
    const d = 7000 + Math.random()*10000;
    setTimeout(() => {
      if (!this.running) return;
      this._dropPowerUp();
      this._schedulePowerUp();
    }, d);
  },

  _dropPowerUp() {
    const W = this.canvas.width;
    const t = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
    this.powerUps.push({
      type:t.id, emoji:t.emoji, label:t.label, color:t.color, dur:t.dur,
      x: 60+Math.random()*(W-120), y:-30, vy:1.2+Math.random()*0.8, pulse:0, age:0,
    });
  },

  // ── TORPEDO ────────────────────────────────────────────────
  _startCharge()  { if (!this.running) return; this.charging=true; this.chargeStart=Date.now(); },
  _releaseTorpedo() {
    if (!this.running||!this.charging) return;
    this.charging = false;
    const hold = Math.min(2000, Date.now()-this.chargeStart);
    const radius = 30 + (hold/2000)*90;
    const W=this.canvas.width, H=this.canvas.height;
    const cx=W/2, cy=H/2;
    for(let i=0;i<28;i++){
      const a=(i/28)*Math.PI*2, s=4+Math.random()*5;
      this.particles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,color:'#FFD700',age:0,maxAge:36,r:5,gravity:0});
    }
    this.particles.push({type:'wave',x:cx,y:cy,r:4,maxR:radius,age:0,maxAge:22});
    this._screenShake(10); SFX.hit(); SFX.hit();
    const cost = WEAPONS[this.weapon].ammoCost * 4;
    this.ammo = Math.max(0, this.ammo - cost);
    toast(`🚀 TORPEDO! r=${Math.round(radius)}px (-${cost} ammo)`);
    this.fish = this.fish.filter(f => {
      if(Math.hypot(cx-f.x,cy-f.y) < radius+f.r) { this._onHit(f,true); return false; }
      return true;
    });
    this._refreshHUD();
  },

  // ── SHOOTING ──────────────────────────────────────────────
  _shoot(mx, my) {
    if (!this.running) return;
    const w   = WEAPONS[this.weapon];
    const cost = this.effects.rapid > 0 ? w.ammoCost*0.5 : w.ammoCost;
    if (this.ammo < cost*0.5) { toast('⚠ LOW AMMO — switch weapon!'); }
    if (this.ammo <= 0) { toast('⚠ OUT OF AMMO!'); return; }
    this.ammo = Math.max(0, this.ammo - cost);

    // Bullet tracer
    this.bullets.push({x:mx,y:my,age:0,maxAge:14,r:w.hitR,color:w.color});

    // Magnet pull
    if (this.effects.magnet > 0) {
      this.fish.forEach(f => {
        const d=Math.hypot(mx-f.x,my-f.y);
        if(d<130){f.vx+=(mx-f.x)/d*2.2; f.vy+=(my-f.y)/d*2.2;}
      });
    }

    // Shotgun: 5 spread sub-bullets
    if (w.special==='spread') {
      for(let i=-2;i<=2;i++) {
        const ox=i*18, oy=(Math.random()-.5)*18;
        this.bullets.push({x:mx+ox,y:my+oy,age:0,maxAge:10,r:w.hitR*0.7,color:w.color});
      }
    }

    // Laser: pierce — collect all fish on a horizontal line
    if (w.special==='pierce') {
      const lineY = my;
      this.fish = this.fish.filter(f => {
        if(Math.abs(f.y - lineY) < f.r+4) {
          this._onHit(f); return false;
        }
        return true;
      });
      this._refreshHUD();
      return;
    }

    let hit = false;
    const hitRadius = w.hitR + (this.effects.rapid>0 ? 5 : 0);

    // Nuke: AoE damage
    if (w.special==='nuke') {
      this.fish = this.fish.filter(f => {
        if(Math.hypot(mx-f.x,my-f.y) < w.aoe+f.r) { this._onHit(f,true); return false; }
        return true;
      });
      this.particles.push({type:'wave',x:mx,y:my,r:4,maxR:w.aoe,age:0,maxAge:18});
      this._screenShake(7); SFX.hit(); SFX.hit();
      hit = true;
    } else {
      // Net cannon / standard: check all fish
      this.fish = this.fish.filter(f => {
        const d = Math.hypot(mx-f.x, my-f.y);
        const isWeakHit = f.boss && Math.hypot((mx-(f.x+f.weakX)), (my-(f.y+f.weakY))) < 14;
        if(d < hitRadius + f.r) {
          if(isWeakHit) { f.hp--; f.hp--; } // weak point = double damage
          hit = true;
          const dead = this._onHit(f);
          return !dead;
        }
        return true;
      });
    }

    // Power-up collection
    this.powerUps = this.powerUps.filter(p => {
      if(Math.hypot(mx-p.x,my-p.y) < 32) { this._activatePowerUp(p); return false; }
      return true;
    });

    if (!hit) SFX.miss();
    if (this.ammo <= 0) setTimeout(() => this._end(), 600);
    this._refreshHUD();
  },

  // ── ON FISH HIT ───────────────────────────────────────────
  _onHit(f, splash=false) {
    f.hp--;
    if (f.hp > 0) {
      this._splashParticles(f.x, f.y, f.color, 5);
      // Phase transition at 50% HP
      if (f.boss && f.hp <= Math.ceil(f.maxHp/2) && f.phase < f.phases) {
        f.phase++;
        f.vx *= 1.4; f.vy *= 1.4; // speed up
        toast(`⚡ ${f.name} PHASE ${f.phase}!`);
        this._screenShake(5);
        SFX.badge();
        // Reassign weak point
        f.weakX=(Math.random()-.5)*f.r*0.8; f.weakY=(Math.random()-.5)*f.r*0.8;
      }
      SFX.hit(); return false;
    }

    // Dead
    this.combo++; this.comboTimer = 95;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.weaponKills++;
    this.sessionFish++;

    const mult   = Math.min(8, 1 + Math.floor(this.combo/3));
    const base   = f.pts * (this.effects.double>0 ? 2 : 1);
    const total  = base * mult;
    this.score  += total;
    this.caught[f.name] = (this.caught[f.name]||0)+1;

    if (f.boss) { this.bossesKilled++; this.sessionBosses++; }

    // Weapon level-up
    const killsNeeded = [0,5,12,22,35];
    if (this.weaponLevel < 5 && this.weaponKills >= killsNeeded[this.weaponLevel]) {
      this.weaponLevel++;
      toast(`🔫 ${WEAPONS[this.weapon].name} LEVEL ${this.weaponLevel}!`);
      SFX.unlock();
    }

    this._splashParticles(f.x, f.y, f.color, f.boss ? 28 : 12);
    this._floatText(`+${total}${mult>1?' ×'+mult:''}`, f.x, f.y, f.boss?'#FF3366':f.mystery?'#FFD700':'#00FF88');

    if (f.boss)       { this._screenShake(14); SFX.unlock(); SFX.win(); toast(`💀 ${f.name} DOWN! +${total}`, 3500); }
    else if (f.mystery){ this._screenShake(6);  SFX.badge();             toast(`⭐ MYSTERY! +${total}`, 2500); }
    else if (mult>1)   {                         SFX.hit();               toast(`${f.emoji} ×${mult} COMBO! +${total}`); }
    else               {                         SFX.hit(); }

    if (!f.boss) this._spawnFish();

    // Boss rush: check if all bosses dead → spawn next wave
    if (this.mode==='bossrush' && !this.fish.some(x=>x.boss) && this.running) {
      setTimeout(() => { if(this.running) this._spawnBossWave(); }, 1800);
    }

    SV.state.achievements.boss_slayer = f.boss || SV.state.achievements.boss_slayer;
    this._refreshHUD();
    return true;
  },

  // ── FLOAT TEXT ────────────────────────────────────────────
  _floatText(text, x, y, color='#FFD700') {
    this.floaters.push({ text, x, y, color, age:0, maxAge:40, vy:-1.8 });
  },

  // ── PARTICLES ─────────────────────────────────────────────
  _splashParticles(x, y, color, count) {
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2, s=2+Math.random()*4;
      this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,color,age:0,maxAge:20+Math.random()*14,r:2+Math.random()*3,gravity:0.1});
    }
  },

  _screenShake(f) { this.shakeFrames = Math.max(this.shakeFrames, f); },

  // ── POWER-UP ACTIVATION ───────────────────────────────────
  _activatePowerUp(p) {
    SFX.badge();
    toast(`${p.emoji} ${p.label}`, 2500);
    switch(p.type) {
      case 'net':
        this.fish = this.fish.filter(f => { if(f.tier===0){this._onHit(f,true);return false;} return true; });
        break;
      case 'freeze':  this.effects.freeze=p.dur; this.fish.forEach(f=>f.frozen=true); break;
      case 'magnet':  this.effects.magnet=p.dur; break;
      case 'double':  this.effects.double=p.dur; break;
      case 'rapid':   this.effects.rapid =p.dur; break;
      case 'shield':  this.effects.shield=p.dur; break;
      case 'ammo':    this.ammo=Math.min(this.ammo+12, GAME_MODES[this.mode].ammo+20); break;
      case 'chest':
        const roll = Math.random();
        if(roll < 0.4)       { this.effects.double=180; toast('📦 DOUBLE PTS from chest!'); }
        else if(roll < 0.7)  { this.ammo += 15;          toast('📦 +15 AMMO from chest!'); }
        else                 { this.score += 50;          toast('📦 +50 PTS bonus from chest!'); }
        break;
    }
    this._refreshHUD();
  },

  // ── MAIN FRAME ────────────────────────────────────────────
  _frame() {
    if (!this.running) return;
    const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height, t=Date.now()/1000;

    // Tick effects
    ['freeze','magnet','double','rapid','shield'].forEach(k=>{ if(this.effects[k]>0){this.effects[k]--; if(!this.effects[k]&&k==='freeze') this.fish.forEach(f=>f.frozen=false); }});
    if(this.comboTimer>0){this.comboTimer--; if(!this.comboTimer)this.combo=0;}

    // Frenzy: flash effect
    if(this.frenzyActive && this.timeLeft <= 10) this.frenzyActive=false;

    // Screen shake
    let sx=0,sy=0;
    if(this.shakeFrames>0){sx=(Math.random()-.5)*this.shakeFrames*1.4; sy=(Math.random()-.5)*this.shakeFrames*1.4; this.shakeFrames--;}
    ctx.save(); ctx.translate(sx,sy);

    // ── BG ─────────────────────────────────────────────────
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#000C18'); bg.addColorStop(.55,'#001A34'); bg.addColorStop(1,'#000E1C');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // Frenzy overlay
    if(this.frenzyActive){
      ctx.fillStyle=`rgba(255,100,0,${0.04+Math.sin(t*8)*0.02})`; ctx.fillRect(0,0,W,H);
    }

    // Caustic rays
    for(let i=0;i<6;i++){
      const rx=i*W/5+Math.sin(t*.3+i)*40, rw=28+Math.sin(t*.7+i*1.3)*18;
      const rg=ctx.createLinearGradient(rx,0,rx+rw,H*.7);
      rg.addColorStop(0,this.frenzyActive?'rgba(255,120,0,0.06)':'rgba(0,200,255,0.045)');
      rg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=rg;
      ctx.beginPath(); ctx.moveTo(rx,0); ctx.lineTo(rx+rw,0); ctx.lineTo(rx+rw*.6,H*.7); ctx.lineTo(rx-rw*.4,H*.7); ctx.closePath(); ctx.fill();
    }

    // Depth lines
    for(let y=50;y<H-60;y+=55){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y);
      ctx.strokeStyle='rgba(0,80,160,0.06)'; ctx.lineWidth=1; ctx.stroke();
    }

    // Bubbles
    for(let i=0;i<14;i++){
      const bx=(i*97+30)%W, by=H-((t*(15+i%4*5)+i*55)%(H+30))-10, br=2+(i%4);
      ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2);
      ctx.strokeStyle=`rgba(0,245,255,${.08+.05*(i%3)})`; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx-br*.3,by-br*.3,br*.3,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fill();
    }

    // ── OCEAN CURRENTS (visual arrows) ────────────────────
    this.currents.forEach(c=>{
      const arrowAlpha = 0.12+Math.sin(t*1.5)*0.04;
      ctx.strokeStyle=`rgba(0,180,255,${arrowAlpha})`; ctx.lineWidth=1.5;
      for(let ax=10;ax<W;ax+=80){
        const ay=c.y+Math.sin(ax*0.05+t*c.dir)*8;
        ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax+30*c.dir,ay);
        ctx.moveTo(ax+30*c.dir,ay); ctx.lineTo(ax+30*c.dir-8*c.dir,ay-5);
        ctx.moveTo(ax+30*c.dir,ay); ctx.lineTo(ax+30*c.dir-8*c.dir,ay+5);
        ctx.stroke();
      }
    });

    // Seabed
    const sb=ctx.createLinearGradient(0,H-50,0,H);
    sb.addColorStop(0,'#1A0A00'); sb.addColorStop(1,'#0A0500');
    ctx.fillStyle=sb; ctx.fillRect(0,H-50,W,50);
    for(let i=0;i<20;i++){
      ctx.beginPath(); ctx.arc(i*(W/18)+15,H-35+Math.sin(i)*6,3+i%4,0,Math.PI*2);
      ctx.fillStyle='#3A2010'; ctx.fill();
    }

    // Environment
    this._drawEnvironment(ctx,W,H,t);

    // ── SHOCKWAVE & PARTICLES ─────────────────────────────
    this.particles = this.particles.filter(p=>{
      if(p.type==='wave'){
        p.age++; const fr=p.age/p.maxAge;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r+(p.maxR-p.r)*fr,0,Math.PI*2);
        ctx.strokeStyle=`rgba(255,215,0,${0.6*(1-fr)})`; ctx.lineWidth=3*(1-fr)+1; ctx.stroke();
        return p.age<p.maxAge;
      }
      p.x+=p.vx; p.y+=p.vy; p.age++; if(p.gravity)p.vy+=p.gravity;
      const fr=p.age/p.maxAge;
      ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(.5,p.r*(1-fr*.6)),0,Math.PI*2);
      ctx.fillStyle=p.color+Math.round((1-fr)*200).toString(16).padStart(2,'0'); ctx.fill();
      return p.age<p.maxAge;
    });

    // ── POWER-UPS ─────────────────────────────────────────
    this.powerUps = this.powerUps.filter(p=>{
      p.y+=p.vy; p.age++; p.pulse+=0.1;
      if(p.y>this.canvas.height+50) return false;
      ctx.save();
      ctx.shadowColor=p.color; ctx.shadowBlur=14+Math.sin(p.pulse)*6;
      const bg2=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,30);
      bg2.addColorStop(0,p.color+'44'); bg2.addColorStop(1,'transparent');
      ctx.fillStyle=bg2; ctx.beginPath(); ctx.arc(p.x,p.y,30,0,Math.PI*2); ctx.fill();
      ctx.font='24px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(p.emoji,p.x,p.y);
      ctx.font='bold 9px Orbitron'; ctx.fillStyle=p.color;
      ctx.fillText(p.label,p.x,p.y+22);
      ctx.restore(); return true;
    });

    // ── BULLETS ───────────────────────────────────────────
    this.bullets = this.bullets.filter(b=>{
      b.age++;
      const fr=b.age/b.maxAge;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r*(1-fr),0,Math.PI*2);
      ctx.fillStyle=`rgba(255,215,0,${(1-fr)*.85})`; ctx.fill();
      return b.age<b.maxAge;
    });

    // ── FISH AI + DRAW ────────────────────────────────────
    this.fish.forEach(f=>{
      if(!f.frozen){
        // Current push
        this.currents.forEach(c=>{
          if(Math.abs(f.y-c.y)<40) { f.vx+=c.vx*c.strength*0.05; }
        });
        // Schooling
        if(f.schoolId>=0){
          const peer=this.fish.find(o=>o!==f&&o.schoolId===f.schoolId);
          if(peer){f.vx+=(peer.x-f.x)*.0006; f.vy+=(peer.y-f.y)*.0006;}
        }
        // Evade on nearby bullets
        if(f.evade || f.boss){
          const nb=this.bullets.some(b=>Math.hypot(b.x-f.x,b.y-f.y)<90);
          if(nb&&Math.random()<0.1){f.vy+=(Math.random()-.5)*2.5; f.vx+=f.vx>0?.4:-.4;}
        }
        // Dive behavior (epic fish occasionally dive deep)
        if(f.dive && Math.random()<0.003){f.vy+=(Math.random()>.5?1:-1)*1.2;}
        // Boss phase 2+: sine wave pattern
        if(f.boss && f.phase>=2){f.vy=Math.sin(Date.now()*.003+f.x*.01)*2;}
        // Boss phase 3: charge toward center
        if(f.boss && f.phase>=3){
          const cx=this.canvas.width/2;
          f.vx+=(cx-f.x)*.0008;
        }
        // Speed cap
        const spd=Math.hypot(f.vx,f.vy), max=GAME_MODES[this.mode].speed*2;
        if(spd>max){f.vx=f.vx/spd*max; f.vy=f.vy/spd*max;}
        f.x+=f.vx; f.y+=f.vy;
      }
      f.pulse+=0.07; f.shimmer+=0.15; f.weakPulse+=0.12;

      const H2=this.canvas.height;
      if(f.y-f.r<0){f.y=f.r; f.vy=Math.abs(f.vy);}
      if(f.y+f.r>H2-55){f.y=H2-55-f.r; f.vy=-Math.abs(f.vy);}
      if(f.vx>0&&f.x-f.r>W){f.x=-f.r; f.y=f.r+Math.random()*(H2*.65);}
      if(f.vx<0&&f.x+f.r<0){f.x=W+f.r; f.y=f.r+Math.random()*(H2*.65);}

      this._drawFish(ctx,f);
    });

    // ── FLOAT TEXTS ───────────────────────────────────────
    this.floaters = this.floaters.filter(fl=>{
      fl.y+=fl.vy; fl.age++;
      const fr=fl.age/fl.maxAge;
      ctx.font=`bold ${14+Math.floor((1-fr)*6)}px Orbitron`;
      ctx.textAlign='center';
      ctx.fillStyle=fl.color+Math.round((1-fr)*255).toString(16).padStart(2,'0');
      ctx.fillText(fl.text, fl.x, fl.y);
      return fl.age<fl.maxAge;
    });

    // ── OVERLAYS ──────────────────────────────────────────
    // Freeze tint
    if(this.effects.freeze>0){
      ctx.fillStyle='rgba(0,220,255,0.055)'; ctx.fillRect(0,0,W,H);
    }
    // Shield glow rim
    if(this.effects.shield>0){
      ctx.strokeStyle=`rgba(74,144,217,${0.4+Math.sin(t*4)*.2})`; ctx.lineWidth=6;
      ctx.strokeRect(3,3,W-6,H-6);
    }
    // Frenzy border
    if(this.frenzyActive){
      ctx.strokeStyle=`rgba(255,100,0,${0.35+Math.sin(t*6)*.15})`; ctx.lineWidth=8;
      ctx.strokeRect(4,4,W-8,H-8);
      ctx.font='bold 14px Orbitron'; ctx.fillStyle='#FF6B00'; ctx.textAlign='center';
      ctx.fillText('⚡ SPEED FRENZY MODE ⚡', W/2, 20);
    }

    // Torpedo charge ring
    if(this.charging){
      const hold=Math.min(2000,Date.now()-this.chargeStart), pct=hold/2000;
      ctx.beginPath(); ctx.arc(W/2,H/2,30+pct*90,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,${Math.round(215*(1-pct))},0,${.3+pct*.5})`; ctx.lineWidth=3; ctx.stroke();
      ctx.font='bold 11px Orbitron'; ctx.fillStyle='#FFD700'; ctx.textAlign='center';
      ctx.fillText(`🚀 ${Math.round(pct*100)}%`, W/2, H/2+8);
    }

    // Combo overlay
    if(this.combo>=2){
      const mult=Math.min(8,1+Math.floor(this.combo/3)), a=Math.min(1,this.comboTimer/35);
      ctx.font=`bold ${18+mult*2}px Orbitron`; ctx.fillStyle=`rgba(255,215,0,${a})`;
      ctx.textAlign='right'; ctx.fillText(`×${mult} COMBO!`,W-10,28);
    }

    // Weapon + level badge
    const wep=WEAPONS[this.weapon];
    ctx.font='bold 12px Orbitron'; ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.textAlign='left'; ctx.fillText(`${wep.emoji} ${wep.name} Lv${this.weaponLevel}`, 8, H-8);

    // Effect bars
    let ex=8;
    [{key:'freeze',e:'❄',c:'#00F5FF'},{key:'magnet',e:'🧲',c:'#FFD700'},{key:'double',e:'×2',c:'#FF6B00'},{key:'rapid',e:'⚡',c:'#BF00FF'},{key:'shield',e:'🛡',c:'#4A90D9'}]
      .forEach(ef=>{
        if(this.effects[ef.key]>0){
          const p=this.effects[ef.key]/200;
          ctx.fillStyle=ef.c+'33'; ctx.fillRect(ex,H-25,60,7);
          ctx.fillStyle=ef.c;     ctx.fillRect(ex,H-25,60*p,7);
          ctx.font='9px Orbitron'; ctx.fillStyle='#fff'; ctx.textAlign='left';
          ctx.fillText(ef.e,ex+2,H-17); ex+=68;
        }
      });

    ctx.restore(); // end shake
  },

  // ── DRAW FISH ─────────────────────────────────────────────
  _drawFish(ctx,f){
    ctx.save(); ctx.translate(f.x,f.y);
    if(f.vx>0) ctx.scale(-1,1);

    // Boss aura
    if(f.boss){
      const auraCol = f.phase>=2 ? '#FF3366' : f.color;
      const aura=ctx.createRadialGradient(0,0,f.r*.5,0,0,f.r*2.4);
      aura.addColorStop(0,auraCol+'44'); aura.addColorStop(1,'transparent');
      ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(0,0,f.r*2.4,0,Math.PI*2); ctx.fill();
    }
    // Seasonal shimmer
    if(f.seasonal){
      for(let i=0;i<8;i++){
        const a=f.shimmer+i*(Math.PI/4);
        const sr=f.r+7+Math.sin(f.shimmer*2+i)*5;
        ctx.beginPath(); ctx.arc(Math.cos(a)*sr*.3,Math.sin(a)*sr*.3,3,0,Math.PI*2);
        ctx.fillStyle='#FFD700'; ctx.fill();
      }
    }
    // Mystery shimmer
    if(f.mystery){
      for(let i=0;i<6;i++){
        const a=f.shimmer+i*(Math.PI/3), sr=f.r+5+Math.sin(f.shimmer*2+i)*4;
        ctx.beginPath(); ctx.arc(Math.cos(a)*sr*.3,Math.sin(a)*sr*.3,3,0,Math.PI*2);
        ctx.fillStyle='#FFD700'; ctx.fill();
      }
    }
    // Frozen
    if(f.frozen){
      ctx.beginPath(); ctx.arc(0,0,f.r+6,0,Math.PI*2);
      ctx.fillStyle='rgba(0,220,255,0.22)'; ctx.fill();
    }
    // Pulse ring
    ctx.beginPath(); ctx.arc(0,0,f.r+Math.sin(f.pulse)*4,0,Math.PI*2);
    ctx.strokeStyle=f.color+'55'; ctx.lineWidth=2; ctx.stroke();

    // Fish emoji
    ctx.font=`${f.r*(f.boss?1.9:1.75)}px serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(f.emoji,0,0);
    ctx.restore();

    // Weak point (bosses only)
    if(f.boss && f.hp>0){
      const wp=f.weakPulse;
      ctx.save(); ctx.translate(f.x+f.weakX*(f.vx>0?-1:1), f.y+f.weakY);
      ctx.beginPath(); ctx.arc(0,0,7+Math.sin(wp)*2,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,50,50,${0.7+Math.sin(wp*3)*.25})`; ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.font='8px Orbitron'; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('✕',0,0); ctx.restore();
    }

    // HP bar (bosses & multi-HP)
    if(f.maxHp>1){
      const bw=f.r*2.2, bh=5, bx=f.x-bw/2, by=f.y-f.r-12;
      ctx.fillStyle='#330000'; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=f.hp/f.maxHp>.5?'#00FF88':'#FF3366';
      ctx.fillRect(bx,by,bw*(f.hp/f.maxHp),bh);
      // Phase pips
      for(let i=1;i<f.phases;i++){
        const px=bx+bw*(i/f.phases);
        ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(px,by); ctx.lineTo(px,by+bh); ctx.stroke();
      }
    }

    // Point badge (non-common or mystery/boss)
    if(f.tier>=1||f.mystery||f.boss){
      ctx.font=`bold ${f.boss?12:10}px Orbitron`; ctx.textAlign='center';
      ctx.fillStyle=f.mystery?'#FFD700':f.boss?'#FF3366':f.seasonal?'#FFD700':'#00FF88';
      ctx.fillText(`+${f.pts}`, f.x, f.y-f.r-(f.maxHp>1?20:5));
    }
  },

  // ── DRAW ENVIRONMENT ──────────────────────────────────────
  _drawEnvironment(ctx,W,H,t){
    this.obstacles.forEach(o=>{
      ctx.save();
      if(o.type==='coral'){
        const cols=['#FF4500','#FF69B4','#FF8C00','#00CED1'];
        for(let i=0;i<4;i++){
          const cx=o.x+(i-1.5)*10, ch=20+i*8+Math.sin(t*.5+i)*3;
          ctx.fillStyle=cols[i%cols.length];
          ctx.beginPath(); ctx.moveTo(cx,H-44);
          ctx.quadraticCurveTo(cx-8,H-44-ch*.5,cx,H-44-ch);
          ctx.quadraticCurveTo(cx+8,H-44-ch*.5,cx,H-44); ctx.fill();
          ctx.beginPath(); ctx.arc(cx,H-44-ch,5,0,Math.PI*2); ctx.fill();
        }
      } else if(o.type==='ship'){
        ctx.globalAlpha=0.55; ctx.fillStyle='#1A1000';
        ctx.fillRect(o.x,o.y+30,o.w,o.h-30);
        ctx.beginPath();
        ctx.moveTo(o.x,o.y+30); ctx.lineTo(o.x+o.w,o.y+30);
        ctx.lineTo(o.x+o.w+10,H-44); ctx.lineTo(o.x-10,H-44);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle='#111'; ctx.fillRect(o.x+o.w*.35,o.y,5,50);
        ctx.fillStyle='#222'; ctx.fillRect(o.x+o.w*.3,o.y+4,18,10);
        [.25,.5,.75].forEach(fx=>{
          ctx.beginPath(); ctx.arc(o.x+o.w*fx,o.y+55,6,0,Math.PI*2);
          ctx.fillStyle='#331A00'; ctx.fill();
          ctx.strokeStyle='#554400'; ctx.lineWidth=2; ctx.stroke();
        });
        ctx.globalAlpha=1;
      } else if(o.type==='rock'){
        ctx.fillStyle='#1A1008';
        ctx.beginPath(); ctx.ellipse(o.x,H-30,o.w/2,o.h/2,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#2A1A10'; ctx.lineWidth=1; ctx.stroke();
      }
      ctx.restore();
    });
    // Seaweed
    for(let i=0;i<8;i++){
      const sx=(i+1)*W/9, sh=35+i%3*15;
      ctx.strokeStyle='#006600'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(sx,H-44);
      ctx.quadraticCurveTo(sx+Math.sin(t+i)*16,H-44-sh*.5,sx+Math.sin(t*1.2+i)*8,H-44-sh);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(sx+Math.sin(t*1.2+i)*8,H-44-sh,5,0,Math.PI*2);
      ctx.fillStyle='#008800'; ctx.fill();
    }
  },

  // ── HUD REFRESH ───────────────────────────────────────────
  _refreshHUD(){
    const es=el('ft-score'); if(es) es.textContent=this.score;
    const ea=el('ft-ammo');  if(ea) ea.textContent=Math.ceil(this.ammo);
    const mult=Math.min(8,1+Math.floor(this.combo/3));
    const cm=el('ft-combo'); if(cm){cm.textContent=this.combo>=2?`×${mult}`:'×1'; cm.style.color=this.combo>=3?'#FFD700':'#aaa';}
    const pw=el('ft-power-icons'); if(pw){
      let h='';
      if(this.effects.freeze>0) h+='<span>❄</span>';
      if(this.effects.magnet>0) h+='<span>🧲</span>';
      if(this.effects.double>0) h+='<span>×2</span>';
      if(this.effects.rapid>0)  h+='<span>⚡</span>';
      if(this.effects.shield>0) h+='<span>🛡</span>';
      pw.innerHTML=h;
    }
    const wl=el('ft-weapon-label'); if(wl){
      const w=WEAPONS[this.weapon];
      wl.textContent=`${w.emoji} ${w.name} Lv${this.weaponLevel}`;
    }
  },

  // ── TICK (1/sec) ──────────────────────────────────────────
  _tick(){
    if(!this.running) return;
    this.timeLeft--;
    const te=el('ft-timer'); if(te){te.textContent=this.timeLeft; te.style.color=this.timeLeft<=10?'#FF3366':'';}
    // Boss rush: mid-game extra wave
    if(this.mode==='bossrush' && this.timeLeft===45) this._spawnBossWave();
    // Frenzy warning
    if(this.mode==='frenzy' && this.timeLeft===10) toast('⚡ 10 SECONDS LEFT! GO!',2000);
    // Boss warning at T=20
    if(this.timeLeft===20 && this.mode==='blaster') { this._spawnFish(3); toast('⚠ BOSS INCOMING!',3000); SFX.badge(); }
    if(this.timeLeft<=0) this._end();
  },

  // ── END GAME ──────────────────────────────────────────────
  _end(){
    this.running=false;
    clearGameTimer('ft-draw'); clearGameTimer('ft-clock');
    document.removeEventListener('keydown', window._ftKeydown);
    document.removeEventListener('keyup',   window._ftKeyup);
    document.removeEventListener('keydown', window._ftWeapon);

    el('ft-canvas').style.display='none';
    const hud=el('ft-hud'); if(hud) hud.style.display='none';
    const te=el('ft-timer'); if(te) te.style.color='';

    const isNew=SV.saveBest('fish',this.score);
    SV.addScore(this.score);
    SV.checkAchievements();
    SFX.win();
    window._dailyCheck('fish-table',this.score);

    // Update codex
    if(!SV.state.fishCodex) SV.state.fishCodex={};
    Object.entries(this.caught).forEach(([n,c])=>{SV.state.fishCodex[n]=(SV.state.fishCodex[n]||0)+c;});
    SV.save();

    const caught=Object.keys(this.caught);
    const modeName=GAME_MODES[this.mode].label;
    const wep=WEAPONS[this.weapon];

    const r=el('ft-result');
    r.style.display='block';
    r.innerHTML=`
      <h3>🐟 SESSION COMPLETE!</h3>
      <div class="result-stat"><span class="label">Mode</span><span class="value">${modeName}</span></div>
      <div class="result-stat"><span class="label">Score</span>
        <span class="value">${this.score} pts${isNew?' <span class="result-new">🆕 BEST!</span>':''}</span></div>
      <div class="result-stat"><span class="label">Weapon Used</span>
        <span class="value">${wep.emoji} ${wep.name} Lv${this.weaponLevel}</span></div>
      <div class="result-stat"><span class="label">Best Combo</span>
        <span class="value">×${Math.min(8,1+Math.floor(this.maxCombo/3))} (${this.maxCombo} hits)</span></div>
      <div class="result-stat"><span class="label">Fish Caught</span>
        <span class="value">${this.sessionFish}</span></div>
      <div class="result-stat"><span class="label">Bosses Slain</span>
        <span class="value">${this.sessionBosses}${this.sessionBosses>0?' 💀':''}</span></div>
      <div class="result-stat"><span class="label">Species Found</span>
        <span class="value">${caught.length} types</span></div>
      <div class="result-stat"><span class="label">Ammo Remaining</span>
        <span class="value">${Math.ceil(this.ammo)}</span></div>
      <div class="result-stat"><span class="label">All-Time Best</span>
        <span class="value">${SV.state.bestScores.fish||this.score} pts</span></div>
      <div class="result-buttons">
        <button class="btn-primary"   onclick="startFishTable('${this.mode}','${this.weapon}')">PLAY AGAIN</button>
        <button class="btn-secondary" onclick="showScreen('fish-table')">CHANGE MODE</button>
        <button class="btn-secondary" onclick="showScreen('fish-codex')">📖 CODEX</button>
        <button class="btn-secondary" onclick="exitGame('vault-map')">VAULT MAP</button>
      </div>`;
  },
};

function startFishTable(modeOrPower, weapon) {
  // Backwards-compat: if called with number (old buttons) map to mode key
  const numMap={1:'standard',2:'powershot',3:'blaster'};
  const modeKey = typeof modeOrPower==='number' ? numMap[modeOrPower]||'standard' : (modeOrPower||'standard');
  FT.init(modeKey, weapon||'pistol');
}

// ── LOBBY: mode & weapon selection ──────────────────────────
// Called from buttons in the diff-select screen
FT._pendingMode   = 'standard';
FT._pendingWeapon = 'pistol';

FT._selMode = function(modeKey) {
  this._pendingMode = modeKey;
  this._renderLobby();
};

FT._selWeapon = function(wKey) {
  this._pendingWeapon = wKey;
  this._renderLobby();
};

FT._renderLobby = function() {
  // Weapon grid
  const grid = document.getElementById('ft-ws-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(WEAPONS).map(([key, w]) => `
    <div class="ft-ws-card ${this._pendingWeapon===key?'selected':''}"
         onclick="FT._selWeapon('${key}')">
      <div class="ft-ws-emoji">${w.emoji}</div>
      <div class="ft-ws-name">${w.name}</div>
      <div class="ft-ws-desc">${w.desc}</div>
    </div>`).join('');

  // Remove any existing pending badge + start button
  ['_ft_mode_badge','_ft_start_wrap'].forEach(id => {
    const old = document.getElementById(id); if (old) old.remove();
  });

  // Mode pending badge
  const badge = document.createElement('div');
  badge.id = '_ft_mode_badge'; badge.className = 'ft-mode-pending';
  const mName = GAME_MODES[this._pendingMode]?.label || this._pendingMode.toUpperCase();
  badge.textContent = `MODE: ${mName}`;
  grid.parentElement.insertAdjacentElement('afterend', badge);

  // Start button
  const wrap = document.createElement('div');
  wrap.id = '_ft_start_wrap'; wrap.className = 'ft-start-btn-wrap';
  wrap.innerHTML = `<button class="btn-primary" onclick="startFishTable('${this._pendingMode}','${this._pendingWeapon}')">
    🌊 START FISHING
  </button>`;
  badge.insertAdjacentElement('afterend', wrap);
};

// Auto-render lobby when fish screen is shown
document.addEventListener('DOMContentLoaded', () => {
  // Delayed so DOM is ready
  setTimeout(() => FT._renderLobby(), 300);
});
