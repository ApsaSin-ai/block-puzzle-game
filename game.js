// -----------------------
// 1️⃣ Preview canvas touch support
// -----------------------
previews.forEach((ctxRef, idx)=>{
  const canvasRef = ctxRef.canvas;
  // Desktop
  canvasRef.addEventListener("mousedown",(e)=>startDragPreview(e, idx));
  // Touch
  canvasRef.addEventListener("touchstart",(e)=>{
    e.preventDefault(); // cegah scroll
    startDragPreview(e, idx);
  }, {passive:false});
});

// -----------------------
// 2️⃣ Grid canvas touch support
// -----------------------
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
// 3️⃣ Pastikan getMousePos membaca touch
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
// 4️⃣ Update posisi saat drag
// -----------------------
function handleDrag(e){
  if(!dragging || !currentPiece) return;
  const pos = getMousePos(e, canvas);
  // sesuaikan offset tengah blok
  currentPiece.pixelX = pos.x - Math.floor(currentPiece.shape[0].length/2)*cellSize;
  currentPiece.pixelY = pos.y - Math.floor(currentPiece.shape.length/2)*cellSize;
  draw();
}
