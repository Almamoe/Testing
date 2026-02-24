const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ui = {
  score: document.getElementById('score'),
  length: document.getElementById('length'),
  bossHp: document.getElementById('bossHp'),
  hungerBar: document.getElementById('hungerBar'),
  hungerText: document.getElementById('hungerText'),
  overlay: document.getElementById('overlay'),
  panel: document.getElementById('panel'),
};

const grid = 30;
const cols = Math.floor(canvas.width / grid);
const rows = Math.floor(canvas.height / grid);

const phase = {
  HUNT: 'hunt',
  BOSS: 'boss',
  OVER: 'over',
  WIN: 'win',
};

const state = {
  snake: [{ x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }],
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  food: null,
  spiritFruit: null,
  score: 0,
  hunger: 100,
  hungerDrain: 0.52,
  moveInterval: 110,
  moveAccumulator: 0,
  tickTime: 0,
  lastTime: 0,
  phase: phase.HUNT,
  message: '',
  boss: null,
  spiritCharge: 0,
  particles: [],
};

function randCell() {
  return {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows),
  };
}

function sameCell(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function onSnake(cell, includeHead = true) {
  return state.snake.some((part, idx) => (includeHead || idx > 0) && sameCell(part, cell));
}

function spawnFood() {
  let tries = 0;
  while (tries < 500) {
    const c = randCell();
    if (!onSnake(c) && !sameCell(c, state.spiritFruit) && !onBoss(c)) {
      state.food = c;
      return;
    }
    tries += 1;
  }
}

function spawnSpiritFruit() {
  if (state.phase !== phase.BOSS) return;
  let tries = 0;
  while (tries < 500) {
    const c = randCell();
    if (!onSnake(c) && !sameCell(c, state.food) && !onBoss(c)) {
      state.spiritFruit = c;
      return;
    }
    tries += 1;
  }
}

function onBoss(cell) {
  return !!(state.boss && state.boss.body.some((p) => sameCell(p, cell)));
}

function makeParticles(x, y, color, amount = 14) {
  for (let i = 0; i < amount; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2.4,
      vy: (Math.random() - 0.5) * 2.4,
      life: 18 + Math.random() * 20,
      color,
    });
  }
}

function drawForestBackdrop(time) {
  const t = time * 0.001;

  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#4f7d3a');
  g.addColorStop(0.35, '#33552f');
  g.addColorStop(1, '#102014');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 20; i += 1) {
    const x = ((i * 83 + t * 15) % (canvas.width + 120)) - 60;
    const y = 65 + ((i * 41) % 180);
    ctx.fillStyle = 'rgba(219, 236, 200, 0.05)';
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.13;
  for (let x = 0; x <= cols; x += 1) {
    ctx.strokeStyle = '#d6e2c833';
    ctx.beginPath();
    ctx.moveTo(x * grid, 0);
    ctx.lineTo(x * grid, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= rows; y += 1) {
    ctx.strokeStyle = '#d6e2c822';
    ctx.beginPath();
    ctx.moveTo(0, y * grid);
    ctx.lineTo(canvas.width, y * grid);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (state.phase === phase.BOSS) {
    ctx.fillStyle = 'rgba(130, 18, 39, 0.17)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawFood() {
  if (!state.food) return;
  const cx = state.food.x * grid + grid / 2;
  const cy = state.food.y * grid + grid / 2;

  ctx.fillStyle = '#f26d6d';
  ctx.beginPath();
  ctx.arc(cx, cy, grid * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#7ccf62';
  ctx.fillRect(cx - 2, cy - grid * 0.39, 4, 7);
}

function drawSpiritFruit(time) {
  if (!state.spiritFruit) return;
  const cx = state.spiritFruit.x * grid + grid / 2;
  const cy = state.spiritFruit.y * grid + grid / 2;

  const pulse = 0.8 + 0.2 * Math.sin(time * 0.012);
  ctx.fillStyle = 'rgba(147, 220, 255, 0.23)';
  ctx.beginPath();
  ctx.arc(cx, cy, grid * 0.65 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#89d5ff';
  ctx.beginPath();
  ctx.arc(cx, cy, grid * 0.24, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  state.snake.forEach((part, i) => {
    const x = part.x * grid;
    const y = part.y * grid;
    const isHead = i === 0;

    ctx.fillStyle = isHead ? '#d5f090' : `hsl(${115 - i * 1.3}, 48%, ${Math.max(30, 52 - i * 0.65)}%)`;
    roundRect(ctx, x + 2, y + 2, grid - 4, grid - 4, 8);
    ctx.fill();

    if (isHead) {
      ctx.fillStyle = '#1b2a13';
      ctx.beginPath();
      ctx.arc(x + grid * 0.7, y + grid * 0.37, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawBoss() {
  if (!state.boss) return;

  state.boss.body.forEach((part, i) => {
    const x = part.x * grid;
    const y = part.y * grid;
    const isHead = i === 0;

    ctx.fillStyle = isHead ? '#f28faf' : `hsl(${340 - i * 1.5}, 60%, ${Math.max(28, 54 - i * 0.75)}%)`;
    roundRect(ctx, x + 1.5, y + 1.5, grid - 3, grid - 3, 8);
    ctx.fill();

    if (isHead) {
      ctx.fillStyle = '#2c1020';
      ctx.beginPath();
      ctx.arc(x + grid * 0.67, y + grid * 0.35, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function updateParticles() {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    p.vy += 0.015;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  state.particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / 36);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function updateHUD() {
  ui.score.textContent = String(state.score);
  ui.length.textContent = String(state.snake.length);

  ui.hungerBar.style.width = `${Math.max(0, state.hunger)}%`;
  if (state.hunger > 60) {
    ui.hungerBar.style.background = 'linear-gradient(90deg, #9fdd62, #6ecb5f)';
    ui.hungerText.textContent = 'Safe';
  } else if (state.hunger > 30) {
    ui.hungerBar.style.background = 'linear-gradient(90deg, #e6d365, #d4a74f)';
    ui.hungerText.textContent = 'Hungry';
  } else {
    ui.hungerBar.style.background = 'linear-gradient(90deg, #f08d73, #dd5252)';
    ui.hungerText.textContent = 'Starving';
  }

  ui.bossHp.textContent = state.boss ? `${state.boss.hp}` : '--';
}

function clampWrap(point) {
  if (point.x < 0) point.x = cols - 1;
  if (point.x >= cols) point.x = 0;
  if (point.y < 0) point.y = rows - 1;
  if (point.y >= rows) point.y = 0;
}

function moveSnake() {
  state.dir = { ...state.nextDir };
  const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };
  clampWrap(head);

  if (onSnake(head, false) || (state.boss && onBoss(head) && !sameCell(head, state.boss.body[0]))) {
    lose('You were crushed in the undergrowth.');
    return;
  }

  if (state.boss && sameCell(head, state.boss.body[0])) {
    if (state.spiritCharge > 0) {
      state.boss.hp -= 1;
      state.spiritCharge -= 1;
      makeParticles(head.x * grid + 15, head.y * grid + 15, '#ffc4dc', 24);
      if (state.boss.hp <= 0) {
        win();
        return;
      }
    } else {
      lose('The Serpent King devoured you. Collect spirit fruit before attacking.');
      return;
    }
  }

  state.snake.unshift(head);

  if (sameCell(head, state.food)) {
    state.score += 12;
    state.hunger = Math.min(100, state.hunger + 24);
    makeParticles(head.x * grid + 15, head.y * grid + 15, '#ff9f85');
    spawnFood();
  } else if (sameCell(head, state.spiritFruit)) {
    state.score += 24;
    state.spiritCharge = Math.min(3, state.spiritCharge + 1);
    state.hunger = Math.min(100, state.hunger + 8);
    makeParticles(head.x * grid + 15, head.y * grid + 15, '#91d6ff', 18);
    state.spiritFruit = null;
  } else {
    state.snake.pop();
  }

  if (state.phase === phase.HUNT && state.snake.length >= 22) {
    beginBossPhase();
  }
}

function moveBoss() {
  if (!state.boss) return;
  const b = state.boss;

  const head = b.body[0];
  const options = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  const valid = options.filter((opt) => !(opt.x === -b.dir.x && opt.y === -b.dir.y));
  valid.sort((a, bOpt) => {
    const da = Math.abs(head.x + a.x - state.snake[0].x) + Math.abs(head.y + a.y - state.snake[0].y);
    const db = Math.abs(head.x + bOpt.x - state.snake[0].x) + Math.abs(head.y + bOpt.y - state.snake[0].y);
    return da - db;
  });

  if (Math.random() < 0.25) {
    b.dir = valid[Math.floor(Math.random() * valid.length)];
  } else {
    b.dir = valid[0];
  }

  const newHead = { x: head.x + b.dir.x, y: head.y + b.dir.y };
  clampWrap(newHead);

  b.body.unshift(newHead);
  b.body.pop();

  if (sameCell(newHead, state.snake[0])) {
    lose('The Serpent King struck your head.');
  }
}

function beginBossPhase() {
  state.phase = phase.BOSS;
  state.moveInterval = 95;
  state.hungerDrain = 0.62;
  state.spiritCharge = 1;

  const body = [];
  for (let i = 0; i < 16; i += 1) {
    body.push({ x: cols - 4 - i, y: 4 });
  }

  state.boss = {
    body,
    hp: 8,
    dir: { x: -1, y: 0 },
  };

  spawnSpiritFruit();
  showOverlay(
    'Serpent King Awakens',
    'You are mighty enough. Gather spirit fruit and strike the boss head to deal damage. Survive and win the forest throne.',
    'Enter Boss Fight',
    () => hideOverlay()
  );
}

function lose(msg) {
  state.phase = phase.OVER;
  state.message = msg;
  showOverlay('Game Over', `${msg} Final score: ${state.score}`, 'Try Again', resetGame);
}

function win() {
  state.phase = phase.WIN;
  showOverlay('Victory!', `You defeated the Serpent King with a score of ${state.score}.`, 'Play Again', resetGame);
}

function showOverlay(title, text, buttonText, handler) {
  ui.panel.innerHTML = `<h2>${title}</h2><p>${text}</p><button id="overlayBtn">${buttonText}</button>`;
  ui.overlay.style.display = 'grid';
  const btn = document.getElementById('overlayBtn');
  btn.addEventListener('click', handler, { once: true });
}

function hideOverlay() {
  ui.overlay.style.display = 'none';
}

function resetGame() {
  state.snake = [{ x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }];
  state.dir = { x: 1, y: 0 };
  state.nextDir = { x: 1, y: 0 };
  state.score = 0;
  state.hunger = 100;
  state.hungerDrain = 0.52;
  state.moveInterval = 110;
  state.moveAccumulator = 0;
  state.phase = phase.HUNT;
  state.boss = null;
  state.spiritFruit = null;
  state.spiritCharge = 0;
  state.particles = [];
  spawnFood();
  hideOverlay();
  updateHUD();
}

function gameStep(delta, time) {
  if (state.phase === phase.OVER || state.phase === phase.WIN) return;

  state.hunger -= state.hungerDrain * (delta / 1000) * 10;
  if (state.hunger <= 0) {
    lose('You starved in the forest.');
    return;
  }

  state.moveAccumulator += delta;
  while (state.moveAccumulator >= state.moveInterval) {
    moveSnake();
    if (state.phase === phase.OVER || state.phase === phase.WIN) return;

    if (state.phase === phase.BOSS) {
      moveBoss();
      if (!state.spiritFruit || Math.random() < 0.003) spawnSpiritFruit();
    }

    state.moveAccumulator -= state.moveInterval;
  }

  updateParticles();
  updateHUD();
  draw(time);
}

function draw(time) {
  drawForestBackdrop(time);
  drawFood();
  drawSpiritFruit(time);
  drawBoss();
  drawSnake();
  drawParticles();

  if (state.phase === phase.BOSS) {
    ctx.fillStyle = 'rgba(255, 220, 120, 0.87)';
    ctx.font = '700 18px Nunito';
    ctx.fillText(`Spirit Charge: ${state.spiritCharge}`, 18, 28);
  }
}

function loop(timestamp) {
  const delta = state.lastTime ? (timestamp - state.lastTime) : 16;
  state.lastTime = timestamp;

  gameStep(delta, timestamp);
  requestAnimationFrame(loop);
}

function handleDirection(x, y) {
  if (x === -state.dir.x && y === -state.dir.y) return;
  state.nextDir = { x, y };
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') handleDirection(0, -1);
  if (key === 'arrowdown' || key === 's') handleDirection(0, 1);
  if (key === 'arrowleft' || key === 'a') handleDirection(-1, 0);
  if (key === 'arrowright' || key === 'd') handleDirection(1, 0);
});

spawnFood();
showOverlay(
  'Welcome to the Forest',
  'Find fruit to survive your hunger. Grow large enough and the Serpent King will challenge you.',
  'Start Hunt',
  () => {
    hideOverlay();
    state.lastTime = 0;
  }
);
updateHUD();
requestAnimationFrame(loop);
