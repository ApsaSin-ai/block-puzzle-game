const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cellSize = 30;
const rows = 10;
const cols = 10;
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

let grid = Array.from({ length: rows }, () => Array(cols).fill(0));
let currentPiece = null;
let dragging = false;

// beberapa tipe piece
const pieces = [
  { shape: [[1, 1, 1]] },
  { shape: [[1], [1], [1]] },
  { shape: [[1, 1], [1, 1]] }
];

// draw grid
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

// draw piece di grid
function drawPiece(piece, x, y, color = "#ff7f50") {
  piece.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if (val) {
        ctx.fillStyle = color;
        ctx.fillRect((x + dx) * cellSize, (y + dy) * cellSize, cellSize, cellSize);
      }
    });
  });
}

// spawn piece baru
function spawnPiece() {
  const idx = Math.floor(Math.random() * pieces.length);
  return { ...pieces[idx], pixelX: 0, pixelY: 0 };
}

// check apakah piece bisa ditempatkan
function canPlace(piece, x, y) {
  return piece.shape.every((row, dy) =>
    row.every((val, dx) => {
      if (!val) return true;
      const gx = x + dx;
      const gy = y + dy;
      return gx >= 0 && gx < cols && gy >= 0 && gy < rows && !grid[gy][gx];
    })
  );
}

// tempatkan piece di grid
function placePiece(piece, x, y) {
  if (!canPlace(piece, x, y)) return false;
  piece.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if (val) grid[y + dy][x + dx] = 1;
    });
  });
  return true;
}

// koordinat mouse / touch
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return { x: clientX - rect.left, y: clientY - rect.top };
}

// mulai drag
function startDrag(e) {
  e.preventDefault();
  dragging = true;
  if (!currentPiece) currentPiece = spawnPiece();

  const pos = getMousePos(e);
  if (e.touches) {
    currentPiece.pixelX = pos.x;
    currentPiece.pixelY = pos.y;
  } else {
    currentPiece.pixelX = pos.x - (currentPiece.shape[0].length * cellSize) / 2;
    currentPiece.pixelY = pos.y - (currentPiece.shape.length * cellSize) / 2;
  }
  draw();
}

// saat drag
function handleDrag(e) {
  if (!dragging || !currentPiece) return;
  e.preventDefault();
  const pos = getMousePos(e);
  if (e.touches) {
    currentPiece.pixelX = pos.x;
    currentPiece.pixelY = pos.y;
  } else {
    currentPiece.pixelX = pos.x - (currentPiece.shape[0].length * cellSize) / 2;
    currentPiece.pixelY = pos.y - (currentPiece.shape.length * cellSize) / 2;
  }
  draw();
}

// akhir drag
function endDrag(e) {
  if (!dragging || !currentPiece) return;
  e.preventDefault();
  dragging = false;

  const gridX = Math.floor(currentPiece.pixelX / cellSize);
  const gridY = Math.floor(currentPiece.pixelY / cellSize);

  if (placePiece(currentPiece, gridX, gridY)) {
    currentPiece = spawnPiece();
  }
  draw();
}

// redraw semua
function draw() {
  drawGrid();
  if (currentPiece) {
    const shadowX = Math.floor(currentPiece.pixelX / cellSize);
    const shadowY = Math.floor(currentPiece.pixelY / cellSize);
    drawPiece(currentPiece, shadowX, shadowY, "rgba(0,0,0,0.2)");
    drawPiece(currentPiece, Math.floor(currentPiece.pixelX / cellSize), Math.floor(currentPiece.pixelY / cellSize), "#ff7f50");
  }
}

// event listeners
canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", handleDrag);
canvas.addEventListener("mouseup", endDrag);

canvas.addEventListener("touchstart", startDrag);
canvas.addEventListener("touchmove", handleDrag);
canvas.addEventListener("touchend", endDrag);

// spawn pertama setelah halaman load
window.addEventListener("load", () => {
  currentPiece = spawnPiece();
  draw();
});
