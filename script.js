const gridSize = 4;
let board = [];
let score = 0;

const scoreLabel = document.getElementById("score");
const gridDiv = document.getElementById("grid");
const msgDiv = document.getElementById("message");
const msgText = document.getElementById("message-text");
const playAgainBtn = document.getElementById("play-again");

const bgMusic = document.getElementById("bg-music");
const mergeSound = document.getElementById("merge-sound");

// try to play music (some browsers need user interaction first)
document.body.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.volume = 0.5;
    bgMusic.play().catch(() => {});
  }
}, { once: true });

function initBoard() {
  board = [];
  for (let i = 0; i < gridSize; i++) {
    board.push(new Array(gridSize).fill(0));
  }
  score = 0;
  addNewTile();
  addNewTile();
  render();
}

function addNewTile() {
  const empty = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c] === 0) empty.push({r, c});
    }
  }
  if (empty.length === 0) return;
  const {r, c} = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  gridDiv.innerHTML = "";
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const val = board[r][c];
      const cell = document.createElement("div");
      cell.className = `cell v${val}`;
      cell.textContent = val === 0 ? "" : val;
      gridDiv.appendChild(cell);
    }
  }
  scoreLabel.textContent = `Score: ${score}`;
}

function compress(row) {
  const newRow = row.filter(v => v !== 0);
  while (newRow.length < gridSize) newRow.push(0);
  return newRow;
}

function merge(row) {
  for (let i = 0; i < gridSize - 1; i++) {
    if (row[i] !== 0 && row[i] === row[i+1]) {
      row[i] *= 2;
      row[i+1] = 0;
      score += row[i];
      if (mergeSound) mergeSound.play().catch(() => {});
    }
  }
  return row;
}

function moveLeftLogic() {
  let newBoard = [];
  for (let r = 0; r < gridSize; r++) {
    let row = board[r].slice();
    row = compress(row);
    row = merge(row);
    row = compress(row);
    newBoard.push(row);
  }
  board = newBoard;
}

function moveRightLogic() {
  let newBoard = [];
  for (let r = 0; r < gridSize; r++) {
    let row = board[r].slice().reverse();
    row = compress(row);
    row = merge(row);
    row = compress(row);
    newBoard.push(row.reverse());
  }
  board = newBoard;
}

function transpose(b) {
  return b[0].map((_, c) => b.map(row => row[c]));
}

function moveUpLogic() {
  board = transpose(board);
  moveLeftLogic();
  board = transpose(board);
}

function moveDownLogic() {
  board = transpose(board);
  moveRightLogic();
  board = transpose(board);
}

function handleMove(direction) {
  const oldBoard = board.map(row => row.slice());

  if (direction === "left") moveLeftLogic();
  if (direction === "right") moveRightLogic();
  if (direction === "up") moveUpLogic();
  if (direction === "down") moveDownLogic();

  if (!boardsEqual(oldBoard, board)) {
    addNewTile();
  }
  render();
  checkStatus();
}

function boardsEqual(a, b) {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function checkStatus() {
  if (board.some(row => row.includes(2048))) {
    showMessage("🎉 YOU WIN! 🎉", "win");
  } else if (gameOver()) {
    showMessage("💀 GAME OVER 💀", "lose");
  }
}

function gameOver() {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c] === 0) return false;
      if (c < gridSize - 1 && board[r][c] === board[r][c+1]) return false;
      if (r < gridSize - 1 && board[r][c] === board[r+1][c]) return false;
    }
  }
  return true;
}

function showMessage(text) {
  msgText.textContent = text;
  msgDiv.classList.remove("hidden");
}

playAgainBtn.addEventListener("click", () => {
  msgDiv.classList.add("hidden");
  initBoard();
});

// keyboard controls
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft")  handleMove("left");
  if (e.key === "ArrowRight") handleMove("right");
  if (e.key === "ArrowUp")    handleMove("up");
  if (e.key === "ArrowDown")  handleMove("down");
});

// start game
initBoard();
