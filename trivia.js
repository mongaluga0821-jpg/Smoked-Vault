// ============================================================
// SMOKED VAULT v2.0 – TRIVIA VAULT
// ============================================================

'use strict';

const TV = {
  bank: {
    math: [
      { q:'What is 12 × 13?',                                opts:['144','156','169','152'],           ans:1 },
      { q:'What is 25% of 200?',                             opts:['40','50','25','75'],               ans:1 },
      { q:'What is √144?',                                   opts:['11','12','13','14'],               ans:1 },
      { q:'What is 2⁸?',                                     opts:['128','256','512','64'],            ans:1 },
      { q:'Sum of angles in a triangle?',                    opts:['90°','120°','180°','360°'],        ans:2 },
      { q:'What is 7! (7 factorial)?',                       opts:['720','5040','40320','210'],        ans:1 },
      { q:'What is 15% of 80?',                              opts:['12','14','10','16'],               ans:0 },
      { q:'Which of these is prime?',                        opts:['51','57','59','55'],               ans:2 },
      { q:'What is log₁₀(1000)?',                            opts:['2','3','4','10'],                  ans:1 },
      { q:'Sides of a pentagon?',                            opts:['4','5','6','7'],                   ans:1 },
      { q:'What is 17 × 17?',                                opts:['289','299','279','269'],           ans:0 },
      { q:'What is the value of π (2 decimal places)?',      opts:['3.12','3.14','3.16','3.18'],      ans:1 },
      { q:'How many prime numbers between 1 and 20?',        opts:['6','7','8','9'],                   ans:2 },
      { q:'What is the area of a circle with r=5?',          opts:['25π','50π','10π','100π'],          ans:0 },
      { q:'Solve: 3x + 6 = 21. What is x?',                  opts:['3','5','7','9'],                   ans:1 },
    ],
    science: [
      { q:'Chemical symbol for Gold?',                       opts:['Go','Gd','Au','Ag'],               ans:2 },
      { q:'Planet closest to the Sun?',                      opts:['Venus','Mars','Mercury','Earth'],  ans:2 },
      { q:'Gas plants absorb for photosynthesis?',           opts:['O₂','N₂','CO₂','H₂'],             ans:2 },
      { q:'Bones in the adult human body?',                  opts:['196','206','216','186'],           ans:1 },
      { q:'Speed of light (approx)?',                        opts:['3×10⁵ km/s','3×10⁸ m/s','3×10⁶ m/s','3×10⁴ m/s'], ans:1 },
      { q:'Powerhouse of the cell?',                         opts:['Nucleus','Ribosome','Mitochondria','Vacuole'], ans:2 },
      { q:'Force keeping planets in orbit?',                 opts:['Friction','Magnetism','Gravity','Nuclear'], ans:2 },
      { q:'What is H₂O?',                                    opts:['Hydrogen','Oxygen','Water','Helium'], ans:2 },
      { q:'Atomic number of Carbon?',                        opts:['6','8','12','14'],                ans:0 },
      { q:'Sound is what type of wave?',                     opts:['Transverse','Electromagnetic','Longitudinal','Torsional'], ans:2 },
      { q:'What planet has the most moons?',                 opts:['Jupiter','Saturn','Uranus','Neptune'], ans:1 },
      { q:'Boiling point of water (°C at sea level)?',       opts:['90','95','100','105'],             ans:2 },
      { q:'What is the chemical formula for table salt?',    opts:['NaCl','KCl','CaCl','MgCl'],       ans:0 },
      { q:'Which gas is most abundant in Earth\'s atmosphere?', opts:['Oxygen','Nitrogen','CO₂','Argon'], ans:1 },
      { q:'What organ produces insulin?',                    opts:['Liver','Pancreas','Kidney','Heart'], ans:1 },
    ],
    logic: [
      { q:'All Bloops are Razzles. All Razzles are Lazzles. Are all Bloops Lazzles?', opts:['Yes','No','Maybe','Can\'t tell'], ans:0 },
      { q:'Next in series: 2, 4, 8, 16, ___?',              opts:['24','28','32','36'],               ans:2 },
      { q:'Bat + ball = $1.10. Bat is $1 more. Ball costs?', opts:['$0.10','$0.05','$0.15','$0.20'], ans:1 },
      { q:'Next: J, F, M, A, M, J, ___?',                    opts:['A','J','S','O'],                  ans:1 },
      { q:'You have 3 apples and take away 2. How many do YOU have?', opts:['1','2','3','0'],          ans:1 },
      { q:'Odd one out: 2, 4, 7, 8, 10',                    opts:['2','4','7','10'],                  ans:2 },
      { q:'Next: 1, 1, 2, 3, 5, 8, ___?',                   opts:['11','12','13','14'],               ans:2 },
      { q:'Father is 3× son\'s age. In 12 yrs, 2×. Son\'s age now?', opts:['10','12','11','8'],       ans:1 },
      { q:'How many months have 28 days?',                   opts:['1','2','12','4'],                  ans:2 },
      { q:'If it takes 5 machines 5 min to make 5 items, how long for 100 machines to make 100 items?', opts:['100 min','5 min','20 min','1 min'], ans:1 },
      { q:'What 3-digit number reads the same upside down?', opts:['699','888','696','186'],           ans:1 },
      { q:'Next: 3, 6, 11, 18, 27, ___?',                   opts:['36','38','40','38'],               ans:2 },
      { q:'A rooster lays an egg on top of a barn. Which way does it roll?', opts:['Left','Right','Down the slope','Roosters don\'t lay eggs'], ans:3 },
      { q:'How many triangles in a Star of David?',          opts:['6','8','10','12'],                 ans:1 },
      { q:'Next: 0, 1, 4, 9, 16, ___?',                     opts:['20','25','30','36'],               ans:1 },
    ],
  },

  current: [], idx: 0, score: 0, cat: 'math',
  timeLeft: 15, answered: false,

  init(cat) {
    this.cat     = cat;
    // Pick 10 random unique questions
    const pool   = [...this.bank[cat]].sort(() => Math.random()-0.5);
    this.current = pool.slice(0, 10);
    this.idx     = 0; this.score = 0; this.answered = false;

    el('tv-diff-select').style.display = 'none';
    el('tv-result').style.display      = 'none';
    el('tv-game').style.display        = 'block';
    this._next();
  },

  _next() {
    if (this.idx >= this.current.length) { this._end(); return; }
    this.answered = false;
    this.timeLeft = 15;
    el('tv-timer').textContent      = 15;
    el('tv-timer').style.color      = '';
    el('tv-q').textContent          = this.idx + 1;
    el('tv-score').textContent      = this.score;
    el('tv-feedback').textContent   = '';
    el('tv-feedback').style.color   = '';

    // Progress bar
    const fill = el('tv-progress-fill');
    if (fill) fill.style.width = ((this.idx / this.current.length) * 100) + '%';

    const q = this.current[this.idx];
    el('tv-question-text').textContent = q.q;

    el('tv-options').innerHTML = q.opts.map((opt, i) =>
      `<button class="trivia-opt" onclick="TV._ans(${i})">${opt}</button>`
    ).join('');

    clearGameTimer('tv-clock');
    setGameTimer('tv-clock', () => {
      this.timeLeft--;
      el('tv-timer').textContent = this.timeLeft;
      if (this.timeLeft <= 5) el('tv-timer').style.color = '#FF3366';
      if (this.timeLeft <= 0 && !this.answered) this._ans(-1);
    }, 1000);
  },

  _ans(chosen) {
    if (this.answered) return;
    this.answered = true;
    clearGameTimer('tv-clock');

    const q    = this.current[this.idx];
    const opts = document.querySelectorAll('.trivia-opt');
    opts.forEach(b => { b.disabled = true; });

    if (chosen === q.ans) {
      this.score++;
      opts[chosen].classList.add('correct');
      el('tv-feedback').textContent = `✅ Correct!${this.timeLeft >= 10 ? ' ⚡ Speed bonus!' : ''}`;
      el('tv-feedback').style.color = 'var(--neon-green)';
      SFX.correct();
    } else {
      if (chosen >= 0) opts[chosen].classList.add('wrong');
      opts[q.ans].classList.add('correct');
      el('tv-feedback').textContent = chosen === -1 ? '⏰ Time\'s up!' : '❌ Wrong!';
      el('tv-feedback').style.color = 'var(--neon-red)';
      SFX.wrong();
    }
    this.idx++;
    setTimeout(() => this._next(), 1600);
  },

  _end() {
    clearGameTimer('tv-clock');
    el('tv-game').style.display = 'none';

    const pts  = this.score * 90;
    if (this.score === 10) { SV.state.achievements.trivia_ace_earned = true; SV.save(); }
    SV.saveBest('trivia', this.score);
    SV.addScore(pts);
    SV.checkAchievements();
    SFX.win();
    window._dailyCheck('trivia-vault', this.score);

    const pct   = Math.round((this.score / this.current.length) * 100);
    const grade = pct>=90 ? 'A+' : pct>=80 ? 'A' : pct>=70 ? 'B' : pct>=60 ? 'C' : 'D';

    const r = el('tv-result');
    r.style.display = 'block';
    r.innerHTML = `
      <h3>🧠 QUIZ COMPLETE!</h3>
      <div class="result-stat"><span class="label">Score</span><span class="value">${this.score}/10</span></div>
      <div class="result-stat"><span class="label">Accuracy</span><span class="value">${pct}%</span></div>
      <div class="result-stat"><span class="label">Grade</span><span class="value">${grade}</span></div>
      <div class="result-stat"><span class="label">Category</span><span class="value">${this.cat.toUpperCase()}</span></div>
      <div class="result-stat"><span class="label">Points Earned</span><span class="value">${pts} pts</span></div>
      <div class="result-buttons">
        <button class="btn-primary"   onclick="startTrivia('${this.cat}')">PLAY AGAIN</button>
        <button class="btn-secondary" onclick="showScreen('trivia-vault')">CHANGE CAT</button>
        <button class="btn-secondary" onclick="exitGame('vault-map')">VAULT MAP</button>
      </div>`;
  },
};

function startTrivia(cat) { TV.init(cat); }
