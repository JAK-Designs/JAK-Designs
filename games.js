(() => {
  'use strict';
  const root = document;
  const $ = (s, scope = root) => scope.querySelector(s);
  const $$ = (s, scope = root) => [...scope.querySelectorAll(s)];
  const arcade = $('#mini-arcade');
  if (!arcade) return;

  const titles = {
    ttt: ['XO CHALLENGE', 'Tic-Tac-Toe against the computer'],
    memory: ['MEMORY MATCH', 'Find all matching pairs'],
    reaction: ['REACTION TEST', 'Test your response speed'],
    guess: ['NUMBER HUNT', 'Guess the secret number'],
    snake: ['SNAKE RUN', 'Eat, grow and avoid the walls']
  };
  let activeGame = 'ttt';
  let totalPoints = 0;
  const best = { memory: null, reaction: null, snake: 0 };
  let reactionTimer = null;
  let reactionStartedAt = 0;
  let reactionState = 'idle';
  let snakeTimer = null;

  function addPoints(value) {
    totalPoints = Math.max(0, totalPoints + value);
    $('#arcade-total-score').textContent = String(totalPoints);
  }
  function setGame(name) {
    if (!titles[name]) return;
    clearTimeout(reactionTimer); reactionTimer = null;
    if (activeGame === 'snake' && snakePlaying && name !== 'snake') {
      stopSnake(); snakePaused = true;
      $('#snake-overlay').classList.remove('hide');
      $('#snake-overlay').querySelector('strong').textContent = 'Game paused';
      $('#snake-overlay').querySelector('span').textContent = 'Return and press play to continue';
      $('#snake-start').textContent = 'Resume Snake ↗';
    } else if (!(activeGame === 'snake' && name === 'snake' && snakePlaying)) { stopSnake(); }
    activeGame = name;
    $$('.arcade-game-tab').forEach(button => {
      const active = button.dataset.game === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$('.game-panel').forEach(panel => {
      const active = panel.dataset.panel === name;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    $('#arcade-current-label').textContent = `NOW PLAYING / ${titles[name][0]}`;
    if (name === 'snake') drawSnake();
    if (name === 'reaction') resetReactionDisplay();
  }
  $$('.arcade-game-tab').forEach((button, index, list) => {
    button.addEventListener('click', () => setGame(button.dataset.game));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % list.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + list.length) % list.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = list.length - 1;
      list[next].focus(); setGame(list[next].dataset.game);
    });
  });

  // XO Challenge: player is X, a minimax computer plays O.
  const cells = $$('#ttt-board button');
  let tttBoard = Array(9).fill('');
  let tttOver = false;
  let computerTimer = null;
  let tttRecord = { wins: 0, losses: 0, draws: 0 };
  const winningLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function boardWinner(board) {
    for (const line of winningLines) {
      const [a,b,c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.every(Boolean) ? 'draw' : null;
  }
  function renderTTT() {
    cells.forEach((cell, index) => {
      cell.textContent = tttBoard[index];
      cell.classList.toggle('o', tttBoard[index] === 'O');
      cell.disabled = Boolean(tttBoard[index]) || tttOver || activeGame !== 'ttt';
    });
  }
  function updateTTTRecord() {
    $('#ttt-wins').textContent = tttRecord.wins;
    $('#ttt-losses').textContent = tttRecord.losses;
    $('#ttt-draws').textContent = tttRecord.draws;
  }
  function finishTTT(result) {
    tttOver = true;
    if (result === 'X') { tttRecord.wins++; addPoints(10); $('#ttt-status').textContent = 'You win! +10 points 🎉'; }
    else if (result === 'O') { tttRecord.losses++; $('#ttt-status').textContent = 'Computer wins. Try again!'; }
    else { tttRecord.draws++; addPoints(2); $('#ttt-status').textContent = 'It is a draw! +2 points'; }
    updateTTTRecord(); renderTTT();
  }
  function minimax(board, isMax) {
    const result = boardWinner(board);
    if (result === 'O') return 10;
    if (result === 'X') return -10;
    if (result === 'draw') return 0;
    let bestScore = isMax ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = isMax ? 'O' : 'X';
      const score = minimax(board, !isMax);
      board[i] = '';
      bestScore = isMax ? Math.max(bestScore, score) : Math.min(bestScore, score);
    }
    return bestScore;
  }
  function computerMove() {
    if (tttOver || activeGame !== 'ttt') return;
    let bestScore = -Infinity; let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (tttBoard[i]) continue;
      tttBoard[i] = 'O';
      const score = minimax(tttBoard, false);
      tttBoard[i] = '';
      if (score > bestScore) { bestScore = score; bestMove = i; }
    }
    if (bestMove >= 0) tttBoard[bestMove] = 'O';
    renderTTT();
    const result = boardWinner(tttBoard);
    if (result) finishTTT(result);
    else $('#ttt-status').textContent = 'Your turn — X';
  }
  function resetTTT() {
    clearTimeout(computerTimer); tttBoard = Array(9).fill(''); tttOver = false;
    $('#ttt-status').textContent = 'Your turn — X'; renderTTT();
  }
  cells.forEach(cell => cell.addEventListener('click', () => {
    const index = Number(cell.dataset.cell);
    if (activeGame !== 'ttt' || tttOver || tttBoard[index]) return;
    tttBoard[index] = 'X'; renderTTT();
    const result = boardWinner(tttBoard);
    if (result) { finishTTT(result); return; }
    $('#ttt-status').textContent = 'Computer is thinking…';
    computerTimer = setTimeout(computerMove, 300);
  }));
  $('[data-reset="ttt"]').addEventListener('click', resetTTT);
  resetTTT(); updateTTTRecord();

  // Memory match.
  const memoryIcons = ['✳','◆','●','▲','✦','♥'];
  let memoryDeck = []; let memoryFlipped = []; let memoryMatched = 0; let memoryMoves = 0; let memoryLock = false; let memoryHideTimer = null;
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function renderMemory() {
    const board = $('#memory-board'); board.innerHTML = '';
    memoryDeck.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'memory-card';
      button.dataset.index = String(index); button.setAttribute('aria-label', `Memory card ${index + 1}`);
      button.textContent = '✳';
      if (item.flipped || item.matched) { button.textContent = item.icon; button.classList.add(item.matched ? 'matched' : 'flipped'); }
      button.disabled = item.flipped || item.matched || memoryLock;
      button.addEventListener('click', () => flipMemory(index));
      board.appendChild(button);
    });
    $('#memory-moves').textContent = String(memoryMoves);
    $('#memory-matched').textContent = `${memoryMatched} / 6`;
    $('#memory-best').textContent = best.memory === null ? '—' : String(best.memory);
  }
  function resetMemory() {
    clearTimeout(memoryHideTimer); memoryDeck = shuffle([...memoryIcons, ...memoryIcons]).map(icon => ({ icon, flipped: false, matched: false }));
    memoryFlipped = []; memoryMatched = 0; memoryMoves = 0; memoryLock = false;
    $('#memory-status').textContent = 'Find the matching pairs. Good luck!'; renderMemory();
  }
  function flipMemory(index) {
    const card = memoryDeck[index];
    if (memoryLock || !card || card.flipped || card.matched) return;
    card.flipped = true; memoryFlipped.push(index); renderMemory();
    if (memoryFlipped.length !== 2) return;
    memoryMoves++;
    const [a,b] = memoryFlipped;
    if (memoryDeck[a].icon === memoryDeck[b].icon) {
      memoryDeck[a].matched = true; memoryDeck[b].matched = true; memoryMatched++; memoryFlipped = [];
      addPoints(2); $('#memory-status').textContent = 'A match! +2 points';
      if (memoryMatched === 6) {
        const bonus = Math.max(0, 20 - memoryMoves); addPoints(bonus);
        if (best.memory === null || memoryMoves < best.memory) best.memory = memoryMoves;
        $('#memory-status').textContent = `All pairs found in ${memoryMoves} moves! +${bonus} bonus points 🎉`;
      }
      renderMemory();
    } else {
      memoryLock = true; $('#memory-moves').textContent = String(memoryMoves);
      $('#memory-status').textContent = 'Not a pair. Try again.';
      memoryHideTimer = setTimeout(() => {
        memoryDeck[a].flipped = false; memoryDeck[b].flipped = false; memoryFlipped = []; memoryLock = false; renderMemory();
      }, 750);
    }
  }
  $('[data-reset="memory"]').addEventListener('click', resetMemory);
  resetMemory();

  // Reaction test.
  function resetReactionDisplay() {
    reactionState = 'idle';
    const pad = $('#reaction-pad'); pad.className = 'reaction-pad idle';
    $('#reaction-main').textContent = 'Ready?'; $('#reaction-sub').textContent = 'Press start and wait for green';
    $('#reaction-result').textContent = 'Your reaction time will appear here.';
    $('#reaction-start').disabled = false; $('#reaction-start').textContent = 'Start test ↗';
  }
  function startReaction() {
    clearTimeout(reactionTimer); reactionState = 'waiting';
    const pad = $('#reaction-pad'); pad.className = 'reaction-pad waiting';
    $('#reaction-main').textContent = 'Wait for green…'; $('#reaction-sub').textContent = 'Do not tap yet';
    $('#reaction-result').textContent = 'Hold your nerve!';
    $('#reaction-start').disabled = true;
    reactionTimer = setTimeout(() => {
      if (activeGame !== 'reaction' || reactionState !== 'waiting') return;
      reactionState = 'ready'; reactionStartedAt = performance.now();
      pad.className = 'reaction-pad ready'; $('#reaction-main').textContent = 'TAP NOW!'; $('#reaction-sub').textContent = 'Tap this panel as quickly as possible';
    }, 1300 + Math.random() * 2700);
  }
  $('#reaction-start').addEventListener('click', startReaction);
  $('#reaction-pad').addEventListener('click', () => {
    if (reactionState === 'waiting') {
      clearTimeout(reactionTimer); reactionState = 'early';
      $('#reaction-pad').className = 'reaction-pad too-soon'; $('#reaction-main').textContent = 'Too soon!'; $('#reaction-sub').textContent = 'Wait until the panel turns green';
      $('#reaction-result').textContent = 'False start. Take a breath and try again.'; $('#reaction-start').disabled = false; return;
    }
    if (reactionState !== 'ready') return;
    const elapsed = Math.round(performance.now() - reactionStartedAt); reactionState = 'done';
    $('#reaction-pad').className = 'reaction-pad done'; $('#reaction-main').textContent = `${elapsed} ms`; $('#reaction-sub').textContent = elapsed < 250 ? 'Lightning fast!' : elapsed < 400 ? 'Nice reaction!' : 'Good try — can you beat it?';
    $('#reaction-result').textContent = `Your reaction time: ${elapsed} milliseconds.`;
    const reward = elapsed < 250 ? 10 : elapsed < 350 ? 7 : elapsed < 500 ? 4 : 2; addPoints(reward);
    if (best.reaction === null || elapsed < best.reaction) best.reaction = elapsed;
    $('#reaction-best').textContent = `${best.reaction} ms`; $('#reaction-start').disabled = false; $('#reaction-start').textContent = 'Try again ↻';
  });
  $('#reaction-start').addEventListener('click', () => { if (reactionState === 'done' || reactionState === 'early') resetReactionDisplay(); });
  $('#reaction-best').textContent = '—'; resetReactionDisplay();

  // Number Hunt.
  let secretNumber = 0; let guessCount = 0; let guessFinished = false;
  function resetGuess() {
    secretNumber = Math.floor(Math.random() * 100) + 1; guessCount = 0; guessFinished = false;
    $('#guess-last-number').textContent = '?'; $('#guess-attempts').textContent = '0 / 10'; $('#guess-points').textContent = '—';
    $('#guess-hint').textContent = 'Enter a number and take your first guess.'; $('#guess-input').value = ''; $('#guess-input').disabled = false; $('#guess-submit').disabled = false;
  }
  function submitGuess() {
    if (guessFinished) return;
    const raw = $('#guess-input').value.trim(); const guess = Number(raw);
    if (!raw || !Number.isInteger(guess) || guess < 1 || guess > 100) { $('#guess-hint').textContent = 'Enter a whole number from 1 to 100.'; return; }
    guessCount++; $('#guess-attempts').textContent = `${guessCount} / 10`; $('#guess-last-number').textContent = String(guess);
    if (guess === secretNumber) {
      guessFinished = true; const reward = Math.max(2, 22 - guessCount * 2); addPoints(reward); $('#guess-points').textContent = `+${reward}`;
      $('#guess-hint').textContent = `Correct! You found it in ${guessCount} ${guessCount === 1 ? 'try' : 'tries'}! 🎉`; $('#guess-input').disabled = true; $('#guess-submit').disabled = true;
    } else if (guessCount >= 10) {
      guessFinished = true; $('#guess-hint').textContent = `Out of tries! The number was ${secretNumber}. Try a new round.`; $('#guess-input').disabled = true; $('#guess-submit').disabled = true;
    } else {
      $('#guess-hint').textContent = guess < secretNumber ? 'Go higher ↑ — try again.' : 'Go lower ↓ — try again.';
    }
    $('#guess-input').select();
  }
  $('#guess-submit').addEventListener('click', submitGuess);
  $('#guess-input').addEventListener('keydown', event => { if (event.key === 'Enter') submitGuess(); });
  $('[data-reset="guess"]').addEventListener('click', resetGuess);
  resetGuess();

  // Snake Run. Grid is 16 × 16; keyboard and touch controls supported.
  const canvas = $('#snake-canvas'); const ctx = canvas.getContext('2d');
  const gridSize = 16; const cellSize = canvas.width / gridSize;
  let snake = []; let food = { x: 10, y: 8 }; let direction = { x: 1, y: 0 }; let nextDirection = { x: 1, y: 0 }; let snakePoints = 0; let snakePlaying = false; let snakeOver = false; let snakePaused = false;
  function spawnFood() {
    let candidate; let attempts = 0;
    do { candidate = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) }; attempts++; }
    while (snake.some(part => part.x === candidate.x && part.y === candidate.y) && attempts < 500);
    food = candidate;
  }
  function drawSnake() {
    if (!ctx) return;
    ctx.fillStyle = '#173f35'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff0c'; ctx.lineWidth = 1;
    for (let i = 1; i < gridSize; i++) { ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(canvas.width, i * cellSize); ctx.stroke(); }
    if (food) { ctx.fillStyle = '#b7d65e'; ctx.beginPath(); ctx.arc((food.x + .5) * cellSize, (food.y + .5) * cellSize, cellSize * .31, 0, Math.PI * 2); ctx.fill(); }
    snake.forEach((part, index) => { ctx.fillStyle = index === 0 ? '#d8ed77' : '#8ab36c'; rounded(part.x * cellSize + 2, part.y * cellSize + 2, cellSize - 4, cellSize - 4, 5); });
  }
  function rounded(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill(); }
  function updateSnakeScore() { $('#snake-score').textContent = String(snakePoints); }
  function stopSnake() { if (snakeTimer) clearInterval(snakeTimer); snakeTimer = null; snakePlaying = false; }
  function resetSnake(start = false) {
    stopSnake(); snakePaused = false; snake = [{x:6,y:8},{x:5,y:8},{x:4,y:8}]; direction = {x:1,y:0}; nextDirection = {x:1,y:0}; snakePoints = 0; snakeOver = false;
    spawnFood(); updateSnakeScore(); drawSnake();
    const overlay = $('#snake-overlay'); overlay.classList.toggle('hide', start); overlay.querySelector('strong').textContent = 'Ready to run?'; overlay.querySelector('span').textContent = 'Press play to start';
    $('#snake-start').textContent = 'Play Snake ↗';
    if (start) beginSnake();
  }
  function beginSnake() {
    if (snakePlaying) return;
    if (snakeOver) resetSnake(false);
    snakePlaying = true; $('#snake-overlay').classList.add('hide'); $('#snake-start').textContent = 'Restart ↻';
    snakeTimer = setInterval(tickSnake, 135);
  }
  function changeDirection(dir) {
    const directions = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const requested = directions[dir]; if (!requested) return;
    if (requested.x === -direction.x && requested.y === -direction.y) return;
    nextDirection = requested;
  }
  function tickSnake() {
    direction = nextDirection;
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    const eating = head.x === food.x && head.y === food.y;
    const body = eating ? snake : snake.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize || body.some(part => part.x === head.x && part.y === head.y)) {
      stopSnake(); snakeOver = true; best.snake = Math.max(best.snake, snakePoints); $('#snake-overlay').classList.remove('hide'); $('#snake-overlay').querySelector('strong').textContent = 'Game over!'; $('#snake-overlay').querySelector('span').textContent = `You scored ${snakePoints}. Tap restart to go again.`; $('#snake-start').textContent = 'Play again ↻'; return;
    }
    snake.unshift(head);
    if (eating) { snakePoints++; addPoints(1); updateSnakeScore(); spawnFood(); }
    else snake.pop();
    drawSnake();
  }
  $('#snake-start').addEventListener('click', () => {
    if (snakePaused && !snakeOver) {
      snakePaused = false; snakePlaying = true; $('#snake-overlay').classList.add('hide');
      $('#snake-start').textContent = 'Restart ↻'; snakeTimer = setInterval(tickSnake, 135);
    } else resetSnake(true);
  });
  $$('[data-dir]').forEach(button => button.addEventListener('click', () => changeDirection(button.dataset.dir)));
  document.addEventListener('keydown', event => {
    if (activeGame !== 'snake' || !$('#game-panel-snake') || $('#game-panel-snake').hidden) return;
    const map = {ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
    const dir = map[event.key]; if (!dir) return;
    if (document.activeElement && ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    event.preventDefault(); changeDirection(dir);
  });
  resetSnake(false);

  // Keep each game's reset control bound once; preserve arcade points and score history.
  setGame('ttt');
})();
