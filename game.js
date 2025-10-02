const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const rows = 10;
const cols = 10;
const cellSize = 40;

canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

let grid = Array.from({ length: rows }, () => Array(cols).fill(null));

const colors = ["#FFB6B9", "#FAE3D9", "#BBDED6", "#8AC6D1"];

let pieces = [
  [[1, 1, 1]], // 1x3 horizontal
  [[1], [1], [1]], // 3x1 vertical
  [[1, 1], [1, 1]], // 2x2 square
  [[1, 1, 1], [0, 1, 0]], // T shape
  [[1]] // single block
];

let currentPiece = null;
let dragging = false;
let previewGrid = null;

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // board
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.strokeStyle = "#ddd";
      ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  // preview shadow
  if (previewGrid) {
    ctx.globalAlpha = 0.4;
    drawPiece(previewGrid.shape, previewGrid.x, previewGrid.y, previewGrid.color);
    ctx.globalAlpha = 1.0;
  }

  // piece yang di-drag
  if (currentPiece && dragging) {
    drawPiece(currentPiece.shape, currentPiece.pixelX, currentPiece.pixelY, currentPiece.color, true);
  }
}

function drawPiece(shape, x, y, color, isPixel = false) {
  ctx.fillStyle = color;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        let drawX = isPixel ? x + c * cellSize : (x + c) * cellSize;
        let drawY = isPixel ? y + r * cellSize : (y + r) * cellSize;
        ctx.fillRect(drawX, drawY, cellSize, cellSize);
      }
    }
  }
}

function spawnPiece() {
  const shape = pieces[Math.floor(Math.random() * pieces.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  currentPiece = {
    shape,
    color,
    pixelX: canvas.width / 2 - (shape[0].length * cellSize) / 2,
    pixelY: canvas.height - (shape.length * cellSize) - 10
  };
}

function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  let x, y;
  if (e.touches) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  return { x, y };
}

function handleMove(e) {
  if (!dragging || !currentPiece) return;
  e.preventDefault();

  const pos = getEventPos(e);

  currentPiece.pixelX = pos.x - (currentPiece.shape[0].length * cellSize) / 2;
  currentPiece.pixelY = pos.y - (currentPiece.shape.length * cellSize) / 2;

  const gridX = Math.floor(pos.x / cellSize);
  const gridY = Math.floor(pos.y / cellSize);

  // shadow diturunkan +1
  previewGrid = {
    shape: currentPiece.shape,
    color: currentPiece.color,
    x: gridX,
    y: gridY + 1
  };

  drawGrid();
}

function handleDrop(e) {
  if (!currentPiece || !previewGrid) return;
  e.preventDefault();

  const shape = currentPiece.shape;
  const x = previewGrid.x;
  const y = previewGrid.y;

  if (canPlace(shape, x, y)) {
    placePiece(shape, x, y, currentPiece.color);
    clearLines();
    spawnPiece();
  }

  currentPiece = null;
  dragging = false;
  previewGrid = null;

  drawGrid();
}

function canPlace(shape, x, y) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newY = y + r;
        const newX = x + c;
        if (newY < 0 || newY >= rows || newX < 0 || newX >= cols) return false;
        if (grid[newY][newX]) return false;
      }
    }
  }
  return true;
}

function placePiece(shape, x, y, color) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        grid[y + r][x + c] = color;
      }
    }
  }
}

function clearLines() {
  // hapus baris penuh
  for (let r = 0; r < rows; r++) {
    if (grid[r].every(cell => cell !== null)) {
      grid.splice(r, 1);
      grid.unshift(Array(cols).fill(null));
    }
  }

  // hapus kolom penuh
  for (let c = 0; c < cols; c++) {
    let fullCol = true;
    for (let r = 0; r < rows; r++) {
      if (!grid[r][c]) {
        fullCol = false;
        break;
      }
    }
    if (fullCol) {
      for (let r = 0; r < rows; r++) {
        grid[r][c] = null;
      }
    }
  }
}

// =========================
// Event Listeners
// =========================

// mouse
canvas.addEventListener("mousedown", (e) => {
  if (currentPiece) {
    dragging = true;
  }
});
canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("mouseup", handleDrop);

// touch (HP)
canvas.addEventListener("touchstart", (e) => {
  if (currentPiece) {
    dragging = true;
  }
});
canvas.addEventListener("touchmove", handleMove);
canvas.addEventListener("touchend", handleDrop);

spawnPiece();
drawGrid();
