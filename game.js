// -----------------------
// Setup canvas utama (grid)
// -----------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const cellSize = 30;
const rows = 10;
const cols = 10;
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;
let grid = Array.from({ length: rows }, () => Array(cols).fill(0));

// -----------------------
// Setup preview canvases
// -----------------------
const previewIds = ["preview1","preview2","preview3"];
const previewSize = 90; // lebih kecil
const previews = previewIds.map(id=>{
  const ctxRef = document.getElementById(id).getContext("2d");
  ctxRef.canvas.width = previewSize;
  ctxRef.canvas.height = previewSize;
  return ctxRef;
});

// -----------------------
// Pieces
// -----------------------
const pieces = [
  { shape: [[1,1,1]] },
  { shape: [[1],[1],[1]] },
  { shape: [[1,1],[1,1]] },
  { shape: [[1,1,0],[0,1,1]] },
  { shape: [[0,1,1],[1,1,0]] }
];

// -----------------------
// Game state
// -----------------------
let currentPiece = null;
let dragging = false;
let previewPieces = [];

// -----------------------
// Draw functions
// -----------------------
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

function drawPiece(ctxRef, piece, x, y, color="#ff7f50", size=cellSize){
  piece.shape.forEach((row,dy)=>{
    row.forEach((val,dx)=>{
      if(val){
        ctxRef.fillStyle = color;
        ctxRef.fillRect((x+dx)*size, (y+dy)*size, size, size);
      }
    });
  });
}

function drawPreviews(){
  previews.forEach((ctxRef, idx)=>{
    ctxRef.clearRect(0,0,previewSize,previewSize);
    const piece = previewPieces[idx];
    if(!piece) return;
    const size = Math.floor(previewSize / 5); // scale blok preview
    drawPiece(ctxRef, piece, 0,0,"#ff7f50", size);
  });
}

function draw(){
  drawGrid();
  if(currentPiece){
    const shadowX = Math.floor(currentPiece.pixelX/cellSize);
    const shadowY = Math.floor(currentPiece.pixelY/cellSize);
    drawPiece(ctx, currentPiece, shadowX, shadowY,"rgba(0,0,0,0.2)");
    drawPiece(ctx, shadowX, shadowY,"#ff7f50");
  }
}

// -----------------------
// Game logic
// -----------------------
function canPlace(piece,x,y){
  return piece.shape.every((row,dy)=>row.every((val,dx)=>{
    if(!val) return true;
    const gx = x+dx;
    const gy = y+dy;
    return gx>=0 && gx<cols && gy>=0 && gy<rows && !grid[gy][gx];
  }));
}

function placePiece(piece,x,y){
  if(!canPlace(piece,x,y)) return false;
  piece.shape.forEach((row,dy)=>row.forEach((val,dx)=>{
    if(val) grid[y+dy][x+dx] = 1;
  }));
  return true;
}

// -----------------------
// Spawn preview pieces
// -----------------------
function spawnPreviews(){
  previewPieces = [];
  for(let i=0;i<3;i++){
    const idx = Math.floor(Math.random()*pieces.length);
    previewPieces.push(JSON.parse(JSON.stringify(pieces[idx])));
  }
  drawPreviews();
}

// -----------------------
// Mouse / touch helpers
// -----------------------
function getMousePos(e, canvasRef){
  const rect = canvasRef.getBoundingClientRect();
  let clientX, clientY;
  if(e.touches && e.touches.length > 0){
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return { x: clientX - rect.left, y: clientY - rect.top };
}

// -----------------------
// Drag functions
// -----------------------
function startDragPreview(e, idx){
  e.preventDefault();
  dragging = true;
  currentPiece = JSON.parse(JSON.stringify(previewPieces[idx]));
  const pos = getMousePos(e, canvas);
  currentPiece.pixelX = pos.x - Math.floor(currentPiece.shape[0].length/2)*cellSize;
  currentPiece.pixelY = pos.y - Math.floor(currentPiece.shape.length/2)*cellSize;
}

function handleDrag(e){
  if(!dragging || !currentPiece) return;
  const pos = getMousePos(e, canvas);
  currentPiece.pixelX = pos.x - Math.floor(currentPiece.shape[0].length/2)*cellSize;
  currentPiece.pixelY = pos.y - Math.floor(currentPiece.shape.length/2)*cellSize;
  draw();
}

function endDrag(e){
  if(!dragging || !currentPiece) return;
  dragging = false;
  const gridX = Math.floor(currentPiece.pixelX / cellSize);
  const gridY = Math.floor(currentPiece.pixelY / cellSize);
  if(placePiece(currentPiece, gridX, gridY)){
    spawnPreviews();
  }
  currentPiece = null;
  draw();
}

// -----------------------
// Event listeners
// -----------------------
// Preview
previews.forEach((ctxRef, idx)=>{
  const canvasRef = ctxRef.canvas;
  canvasRef.addEventListener("mousedown",(e)=>startDragPreview(e, idx));
  canvasRef.addEventListener("touchstart",(e)=>{
    e.preventDefault();
    startDragPreview(e, idx);
  }, {passive:false});
});

// Grid
canvas.addEventListener("mousedown", handleDrag);
canvas.addEventListener("mousemove", handleDrag);
canvas.addEventListener("mouseup", endDrag);

canvas.addEventListener("touchstart",(e)=>{
  e.preventDefault();
  handleDrag(e);
}, {passive:false});
canvas.addEventListener("touchmove",(e)=>{
  e.preventDefault();
  handleDrag(e);
}, {passive:false});
canvas.addEventListener("touchend", endDrag);

// -----------------------
// Init
// -----------------------
spawnPreviews();
draw();
