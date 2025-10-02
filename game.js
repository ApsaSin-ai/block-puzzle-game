const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cellSize = 30;
const rows = 10;
const cols = 10;
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

let grid = Array.from({ length: rows }, () => Array(cols).fill(0));
let currentPiece = null;
let previewGrid = null;

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.strokeStyle = "#ddd";
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      if (grid[y][x]) {
        ctx.fillStyle = "#4cafef";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}

function drawPiece(piece, gridPos, color = "rgba(0,0,0,0.3)") {
  piece.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if (val) {
        ctx.fillStyle = color;
        ctx.fillRect(
          (gridPos.x + dx) * cellSize,
          (gridPos.y + dy) * cellSize,
          cellSize,
          cellSize
        );
      }
    });
  });
}

function placePiece(piece, gridPos) {
  if (canPlace(piece, gridPos)) {
    piece.shape.forEach((row, dy) => {
      row.forEach((val, dx) => {
        if (val) {
          grid[gridPos.y + dy][gridPos.x + dx] = 1;
        }
      });
    });
    return true;
  }
  return false;
}

function canPlace(piece, gridPos) {
  return piece.shape.every((row, dy) =>
    row.every((val, dx) => {
      if (!val) return true;
      let x = gridPos.x + dx;
      let y = gridPos.y + dy;
      return x >= 0 && x < cols && y >= 0 && y < rows && !grid[y][x];
    })
  );
}

function spawnPiece() {
  const pieces = [
    { shape: [[1, 1, 1]] },
    { shape: [[1], [1], [1]] },
    { shape: [[1, 1], [1, 1]] }
  ];
  return pieces[Math.floor(Math.random() * pieces.length)];
}

function update() {
  drawGrid();
  if (currentPiece && previewGrid) {
    // shadow
    drawPiece(currentPiece, previewGrid, "rgba(0,0,0,0.2)");
    // current piece
    drawPiece(currentPiece, currentPiece.gridPos, "#ff7f50");
  }
}

function getGridPosFromMouse(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX || e.pageX;
  const clientY = e.clientY || e.pageY;
  const x = Math.floor((clientX - rect.left) / cellSize);
  const y = Math.floor((clientY - rect.top) / cellSize);
  return { x, y };
}

function startDrag(e) {
  currentPiece = spawnPiece();
  const pos = getGridPosFromMouse(e);
  currentPiece.gridPos = pos;
  previewGrid = { ...pos };
  update();
}

function handleDrag(e) {
  if (!currentPiece) return;
  const pos = getGridPosFromMouse(e);
  currentPiece.gridPos = pos;
  previewGrid = { ...pos };
  update();
}

function endDrag(e) {
  if (!currentPiece) return;
  if (placePiece(currentPiece, currentPiece.gridPos)) {
    currentPiece = null;
    previewGrid = null;
  }
  update();
}

canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", handleDrag);
canvas.addEventListener("mouseup", endDrag);

// HP (touch support)
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startDrag(e.touches[0]);
});
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  handleDrag(e.touches[0]);
});
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  endDrag(e.changedTouches[0]);
});

// init draw
update();
