// Advanced 2048 implementation (keyboard + swipe + best score)

const GRID_SIZE = 4;
const TARGET_TILE = 2048;

let board = [];
let score = 0;
let bestScore = 0;
let gameWon = false;
let gameOverFlag = false;
let inputLocked = false; // block input during overlay

// DOM elements
let gridElement;
let scoreElement;
let bestScoreElement;
let newGameButton;
let overlay;
let overlayText;
let overlayContinue;
let overlayRestart;
let bgMusic;

document.addEventListener("DOMContentLoaded", () => {
  // Grab DOM elements
  gridElement = document.getElementById("grid");
  scoreElement = document.getElementById("score");
  bestScoreElement = document.getElementById("best-score");
  newGameButton = document.getElementById("new-game");
  overlay = document.getElementById("overlay");
  overlayText = document.getElementById("overlay-text");
  overlayContinue = document.getElementById("overlay-continue");
  overlayRestart = document.getElementById("overlay-restart");
  bgMusic = document.getElementById("bg-music");

  // Load best score from localStorage
  const storedBest = localStorage.getItem("bestScore2048");
  if (storedBest) {
    bestScore = parseInt(storedBest, 10) || 0;
  }
  updateScoreUI();

  // New Game button
  newGameButton.addEventListener("click", resetGame);

  // Overlay buttons
  overlayContinue.addEventListener("click", () => {
    hideOverlay();
    inputLocked = false;
    gameWon = true; // allow continuing beyond 2048
  });

  overlayRestart.addEventListener("click", () => {
    hideOverlay();
    resetGame();
  });

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (inputLocked) return;

    const key = e.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
      e.preventDefault(); // avoid page scrolling
    }

    if (key === "ArrowLeft")  handleMove("left");
    if (key === "ArrowRight") handleMove("right");
    if (key === "ArrowUp")    handleMove("up");
    if (key === "ArrowDown")  handleMove("down");
  });

  // Touch controls (for mobile)
  setupTouchControls();

  // Attempt to start music on first interaction, but safe if file missing
  setupMusicAutoplay();

  // Start game
  initGame();
});

/* ---------- Game setup ---------- */

function initGame() {
  board = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  score = 0;
  gameWon = false;
  gameOverFlag = false;
  inputLocked = false;

  spawnTile();
  spawnTile();
  renderBoard();
  updateScoreUI();
}

function resetGame() {
  initGame();
}

/* ---------- Core logic ---------- */

function spawnTile() {
  const emptyCells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        emptyCells.push({ r, c });
      }
    }
  }
  if (emptyCells.length === 0) return;

  const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function renderBoard() {
  gridElement.innerHTML = "";

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = board[r][c];
      const tile = document.createElement("div");
      tile.className = `tile tile-${value}`;
      const span = document.createElement("div");
      span.className = "tile-value";
      span.textContent = value === 0 ? "" : value;
      tile.appendChild(span);
      gridElement.appendChild(tile);
    }
  }
}

/* Move functions */

function handleMove(direction) {
  if (gameOverFlag) return;
  const previousBoard = cloneBoard(board);

  if (direction === "left") moveLeft();
  if (direction === "right") moveRight();
  if (direction === "up") moveUp();
  if (direction === "down") moveDown();

  if (!boardsEqual(previousBoard, board)) {
    spawnTile();
    renderBoard();
    updateScoreUI();
    checkGameState();
  }
}

function moveLeft() {
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = board[r];
    const { newRow, gainedScore } = compressAndMerge(row);
    board[r] = newRow;
    score += gainedScore;
  }
}

function moveRight() {
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = board[r].slice().reverse();
    const { newRow, gainedScore } = compressAndMerge(row);
    board[r] = newRow.reverse();
    score += gainedScore;
  }
}

function moveUp() {
  board = transpose(board);
  moveLeft();
  board = transpose(board);
}

function moveDown() {
  board = transpose(board);
  moveRight();
  board = transpose(board);
}

/* compress + merge a row (like Python version) */

function compressAndMerge(row) {
  const nonZero = row.filter(v => v !== 0);
  const result = [];
  let gainedScore = 0;

  let skip = false;
  for (let i = 0; i < nonZero.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }

    if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
      const merged = nonZero[i] * 2;
      result.push(merged);
      gainedScore += merged;
      skip = true;
    } else {
      result.push(nonZero[i]);
    }
  }

  while (result.length < GRID_SIZE) {
    result.push(0);
  }

  return { newRow: result, gainedScore };
}

/* ---------- Game state checks ---------- */

function checkGameState() {
  // Check win (only trigger once, then allow continue)
  if (!gameWon && hasTile(TARGET_TILE)) {
    gameWon = true;
    inputLocked = true;
    showOverlay("You win! 🎉\nKeep going or restart?");
    return;
  }

  // Check game over
  if (isGameOver()) {
    gameOverFlag = true;
    inputLocked = true;
    showOverlay("Game over 😢\nTry again?");
  }
}

function hasTile(value) {
  return board.some(row => row.includes(value));
}

function isGameOver() {
  // any empty cell?
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) return false;
    }
  }

  // any possible merges horizontally?
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 1; c++) {
      if (board[r][c] === board[r][c + 1]) return false;
    }
  }

  // any possible merges vertically?
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 1; r++) {
      if (board[r][c] === board[r + 1][c]) return false;
    }
  }

  return true;
}

/* ---------- Utilities ---------- */

function cloneBoard(b) {
  return b.map(row => row.slice());
}

function boardsEqual(a, b) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function transpose(b) {
  return b[0].map((_, colIndex) => b.map(row => row[colIndex]));
}

/* Score handling */

function updateScoreUI() {
  scoreElement.textContent = score;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore2048", bestScore.toString());
  }
  bestScoreElement.textContent = bestScore;
}

/* Overlay */

function showOverlay(message) {
  overlayText.textContent = message;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

/* Music autoplay (optional, safe if file missing) */

function setupMusicAutoplay() {
  if (!bgMusic) return;
  const startMusic = () => {
    if (bgMusic.paused) {
      bgMusic.volume = 0.4;
      bgMusic.play().catch(() => {});
    }
    window.removeEventListener("click", startMusic);
    window.removeEventListener("touchstart", startMusic);
  };
  window.addEventListener("click", startMusic, { once: true });
  window.addEventListener("touchstart", startMusic, { once: true });
}

/* Touch controls (swipe) */

function setupTouchControls() {
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  const minDistance = 30; // px

  const target = document.getElementById("board-wrapper");

  // touchstart
  target.addEventListener("touchstart", (e) => {
    if (inputLocked) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: false });  // ❗ not passive so we can preventDefault if needed

  // touchmove → prevent page scrolling while swiping on the board
  target.addEventListener("touchmove", (e) => {
    if (inputLocked) return;
    e.preventDefault();    // ❗ stop browser scroll / pull-to-refresh
  }, { passive: false });

  // touchend
  target.addEventListener("touchend", (e) => {
    if (inputLocked) return;
    const t = e.changedTouches[0];
    endX = t.clientX;
    endY = t.clientY;

    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      // horizontal
      if (dx > 0) handleMove("right");
      else handleMove("left");
    } else {
      // vertical
      if (dy > 0) handleMove("down");
      else handleMove("up");
    }
  }, { passive: false });
}

