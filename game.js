// Grid canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const cellSize = 30;
const rows = 10;
const cols = 10;
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;
let grid = Array.from({ length: rows }, () => Array(cols).fill(0));

// Preview canvas
const previews = [
  document.getElementById("preview1").getContext("2d"),
  document.getElementById("preview2").getContext("2d"),
  document.getElementById("preview3").getContext("2d"),
  document.getElementById("preview4").getContext("2d")
];
const previewSize = 120;

// Drag
let currentPiece = null;
let dragging = false;

// Pieces
const pieces = [
  { shape: [[1,1,1]] },
  { shape: [[1],[1],[1]] },
  { shape: [[1,1],[1,1]] },
  { shape: [[1,1,0],[0,1,1]] },
  { shape: [[0,1,1],[1,1,0]] }
];

// Utility draw piece
function drawPiece(ctxRef, piece, x, y, color="#ff7f50", size=cellSize) {
  piece.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if(val){
        ctxRef.fillStyle = color;
        ctxRef.fillRect((x+dx)*size, (y+dy)*size, size, size);
      }
    });
  });
}

// Draw grid
function drawGrid() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      ctx.strokeStyle = "#ddd";
      ctx.strokeRect(x*cellSize, y*cellSize, cellSize, cellSize);
      if(grid[y][x]){
        ctx.fillStyle = "#4cafef";
        ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
      }
    }
  }
}

// Draw previews
function drawPreviews(){
  previews.forEach((ctxRef, idx)=>{
    ctxRef.clearRect(0,0,previewSize,previewSize);
    const piece = previewPieces[idx];
    const offsetX = 0;
    const offsetY = 0;
    const size = Math.floor(previewSize / 5); // scale down
    drawPiece(ctxRef, piece, offsetX, offsetY, "#ff7f50", size);
  });
}

// Spawn random preview pieces
let previewPieces = [];
function spawnPreviews(){
  previewPieces = [];
  for(let i=0;i<3;i++){
    const idx = Math.floor(Math.random()*pieces.length);
    previewPieces.push(JSON.parse(JSON.stringify(pieces[idx])));
  }
  drawPreviews();
}

// Check if piece can be placed
function canPlace(piece,x,y){
  return piece.shape.every((row,dy)=>row.every((val,dx)=>{
    if(!val) return true;
    const gx = x+dx;
    const gy = y+dy;
    return gx>=0 && gx<cols && gy>=0 && gy<rows && !grid[gy][gx];
  }));
}

// Place piece
function placePiece(piece,x,y){
  if(!canPlace(piece,x,y)) return false;
  piece.shape.forEach((row,dy)=>row.forEach((val,dx)=>{
    if(val) grid[y+dy][x+dx] = 1;
  }));
  return true;
}

// Mouse/touch position
function getMousePos(e, canvasRef){
  const rect = canvasRef.getBoundingClientRect();
  let clientX, clientY;
  if(e.touches){
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {x: clientX-rect.left, y: clientY-rect.top};
}

// Drag events
function startDragPreview(e, idx){
  e.preventDefault();
  dragging = true;
  currentPiece = JSON.parse(JSON.stringify(previewPieces[idx]));
  // optional remove preview piece if wanted
}

function handleDrag(e){
  if(!dragging || !currentPiece) return;
  const pos = getMousePos(e, canvas);
  currentPiece.pixelX = pos.x;
  currentPiece.pixelY = pos.y;
  draw();
}

function endDrag(e){
  if(!dragging || !currentPiece) return;
  dragging = false;
  const gridX = Math.floor(currentPiece.pixelX / cellSize);
  const gridY = Math.floor(currentPiece.pixelY / cellSize);
  if(placePiece(currentPiece,gridX,gridY)){
    spawnPreviews(); // refill previews setelah berhasil
  }
  currentPiece = null;
  draw();
}

// Draw everything
function draw(){
  drawGrid();
  if(currentPiece){
    const shadowX = Math.floor(currentPiece.pixelX/cellSize);
    const shadowY = Math.floor(currentPiece.pixelY/cellSize);
    drawPiece(ctx, currentPiece, shadowX, shadowY,"rgba(0,0,0,0.2)");
    drawPiece(ctx, Math.floor(currentPiece.pixelX/cellSize), Math.floor(currentPiece.pixelY/cellSize), "#ff7f50");
  }
  drawPreviews();
}

// Init
spawnPreviews();
draw();

// Event listeners for canvas drag
canvas.addEventListener("mousedown", handleDrag);
canvas.addEventListener("mousemove", handleDrag);
canvas.addEventListener("mouseup", endDrag);

canvas.addEventListener("touchmove", handleDrag);
canvas.addEventListener("touchend", endDrag);

// Event listeners for preview canvases
previews.forEach((ctxRef, idx)=>{
  const canvasRef = ctxRef.canvas;
  canvasRef.addEventListener("mousedown",(e)=>startDragPreview(e, idx));
  canvasRef.addEventListener("touchstart",(e)=>startDragPreview(e, idx));
});
