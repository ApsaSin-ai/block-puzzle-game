// ======= Setup canvas =======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsif canvas
function resizeCanvas() {
  const size = Math.min(window.innerWidth, 480);
  canvas.width = size;
  canvas.height = size;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let cellSize = 40;
let cols = 10;
let rows = 10;

// ======= Board & Score =======
let board = Array(rows).fill(null).map(() => Array(cols).fill(0));
let score = 0;

// ======= Pieces =======
const shapes = [
  [[1]], [[1,1]], [[1],[1]], [[1,1],[1,1]], [[1,1,1]], [[1],[1],[1]]
];
const colors = ["#FFB6C1","#FFD700","#ADFF2F","#87CEFA","#FF7F50","#BA55D3"];

class Piece {
  constructor(shape,color){
    this.shape = shape.map(row=>[...row]);
    this.color = color;
    this.pixelX = 0;
    this.pixelY = 0;
  }
  clone(){return new Piece(this.shape,this.color);}
  canPlace(gridX,gridY){
    for(let y=0;y<this.shape.length;y++){
      for(let x=0;x<this.shape[y].length;x++){
        if(this.shape[y][x]===1){
          const bx=gridX+x, by=gridY+y;
          if(bx<0||bx>=cols||by<0||by>=rows) return false;
          if(board[by][bx]!==0) return false;
        }
      }
    }
    return true;
  }
  place(gridX,gridY){
    for(let y=0;y<this.shape.length;y++){
      for(let x=0;x<this.shape[y].length;x++){
        if(this.shape[y][x]===1) board[gridY+y][gridX+x]=this.color;
      }
    }
  }
}

// ======= Draw Functions =======
function drawGrid(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="#ddd";
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      ctx.strokeRect(x*cellSize, y*cellSize, cellSize, cellSize);
      if(board[y][x]!==0){
        ctx.fillStyle=board[y][x];
        ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
      }
    }
  }
}

function drawPiece(piece,px,py,alpha=1){
  ctx.globalAlpha = alpha;
  for(let y=0;y<piece.shape.length;y++){
    for(let x=0;x<piece.shape[y].length;x++){
      if(piece.shape[y][x]===1){
        ctx.fillStyle=piece.color;
        ctx.fillRect(px+x*cellSize, py+y*cellSize, cellSize, cellSize);
        ctx.strokeRect(px+x*cellSize, py+y*cellSize, cellSize, cellSize);
      }
    }
  }
  ctx.globalAlpha=1;
}

// ======= Clear Lines =======
function clearLines(){
  for(let y=rows-1;y>=0;y--){
    if(board[y].every(cell=>cell!==0)){
      board.splice(y,1);
      board.unshift(Array(cols).fill(0));
      score+=50;
      y++;
    }
  }
  document.getElementById("score").textContent=score;
}

// ======= Mini Pieces =======
const pieceContainer = document.getElementById("piece-container");
let availablePieces = [];
let currentPiece = null;
let dragging = false;
let previewGrid = null;

function generatePieces(){
  availablePieces=[];
  pieceContainer.innerHTML="";
  for(let i=0;i<3;i++){
    const shape=shapes[Math.floor(Math.random()*shapes.length)];
    const color=colors[Math.floor(Math.random()*colors.length)];
    const piece = new Piece(shape,color);
    availablePieces.push(piece);

    const miniCanvas=document.createElement('canvas');
    miniCanvas.width=80; miniCanvas.height=80;
    const miniCtx=miniCanvas.getContext('2d');
    const offsetX=(80-shape[0].length*cellSize)/2;
    const offsetY=(80-shape.length*cellSize)/2;
    piece.shape.forEach((row,y)=>{
      row.forEach((val,x)=>{
        if(val===1){
          miniCtx.fillStyle=piece.color;
          miniCtx.fillRect(offsetX+x*cellSize, offsetY+y*cellSize, cellSize, cellSize);
          miniCtx.strokeRect(offsetX+x*cellSize, offsetY+y*cellSize, cellSize, cellSize);
        }
      });
    });

    function pickPiece(){currentPiece=piece.clone(); dragging=true;}
    miniCanvas.addEventListener('mousedown',pickPiece);
    miniCanvas.addEventListener('touchstart',(ev)=>{ev.preventDefault();pickPiece();}, {passive:false});

    pieceContainer.appendChild(miniCanvas);
  }
}

// ======= Drag & Drop =======
function getMousePos(e){
  if(e.touches) return {x:e.touches[0].clientX, y:e.touches[0].clientY};
  else return {x:e.clientX, y:e.clientY};
}

function handleMove(e){
  if(!dragging || !currentPiece) return;
  const rect=canvas.getBoundingClientRect();
  const pos=getMousePos(e);
  currentPiece.pixelX=pos.x-rect.left-currentPiece.shape[0].length*cellSize/2;
  currentPiece.pixelY=pos.y-rect.top-currentPiece.shape.length*cellSize/2;

  const mouseGridX=Math.floor((pos.x-rect.left)/cellSize);
  const mouseGridY=Math.floor((pos.y-rect.top)/cellSize);

  // cari posisi grid valid terdekat
  previewGrid=null;
  for(let y=0;y<=rows-currentPiece.shape.length;y++){
    for(let x=0;x<=cols-currentPiece.shape[0].length;x++){
      if(currentPiece.canPlace(x,y)){
        const centerX=x+currentPiece.shape[0].length/2;
        const centerY=y+currentPiece.shape.length/2;
        const dist=Math.hypot(centerX-mouseGridX, centerY-mouseGridY);
        if(!previewGrid || dist<previewGrid.dist) previewGrid={x,y,dist};
      }
    }
  }

  drawGrid();
  if(previewGrid) drawPiece(currentPiece, previewGrid.x*cellSize, previewGrid.y*cellSize,0.4);
  drawPiece(currentPiece, currentPiece.pixelX, currentPiece.pixelY);
}

function handleUp(e){
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

