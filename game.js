// script.js - versi stabil: preview+1, touch/mouse, responsive cell, drop animation
(function(){
  // ----- CONFIG -----
  const COLS = 10;
  const ROWS = 10;
  const MINI_CANVAS_SIZE = 80;
  const PIECES_COUNT = 3; // jumlah mini pieces tersedia

  // ----- ELEMENTS -----
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const pieceContainer = document.getElementById("piece-container");
  const scoreEl = document.getElementById("score");

  // ----- STATE -----
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let cellSize = 40; // akan dihitung ulang pada resize
  let board = [];
  let score = 0;

  // dragging state
  let currentPiece = null;      // Piece instance ketika dragging
  let dragging = false;
  let activePointerId = null;
  let previewPlace = null;      // posisi tempat yang valid {x,y} (dipakai saat place)
  let previewShown = null;      // posisi yang ditampilkan (previewPlace dengan +1 baris visual)

  // ----- PIECES & COLORS -----
  const shapes = [
    [[1]],                 // 1x1
    [[1,1]],               // 1x2
    [[1],[1]],             // 2x1
    [[1,1],[1,1]],         // 2x2
    [[1,1,1]],             // 1x3
    [[1],[1],[1]]          // 3x1
  ];
  const colors = ["#FFB6C1","#FFD700","#ADFF2F","#87CEFA","#FF7F50","#BA55D3"];

  // ----- Utility & Canvas resize -----
  function initBoard(){
    board = Array.from({length: ROWS}, ()=>Array(COLS).fill(null));
    score = 0;
    updateScore();
  }

  function updateScore(){
    if(scoreEl) scoreEl.textContent = score;
  }

  function resizeCanvas(){
    // compute CSS size as min(window width, 480) or existing container width
    const container = document.getElementById('canvas-wrap') || canvas.parentElement;
    let cssSize = Math.min(window.innerWidth - 32, 520);
    if(container){
      const cw = container.clientWidth;
      if(cw && cw > 0) cssSize = Math.min(cssSize, cw - 20);
    }
    // make square size multiple of COLS
    cellSize = Math.floor(cssSize / COLS);
    if(cellSize < 20) cellSize = 20;

    const cssWidth = cellSize * COLS;
    const cssHeight = cellSize * ROWS;

    DPR = Math.max(1, window.devicePixelRatio || 1);
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
    canvas.width = Math.round(cssWidth * DPR);
    canvas.height = Math.round(cssHeight * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);

    drawGrid();
  }
  window.addEventListener('resize', resizeCanvas);

  // ----- Piece class -----
  class Piece {
    constructor(shape, color){
      // deep clone shape
      this.shape = shape.map(r => r.slice());
      this.color = color;
      this.pixelX = 0;
      this.pixelY = 0;
    }
    clone(){ return new Piece(this.shape, this.color); }

    // test if piece fully fits at grid coords (gridX, gridY)
    canPlace(gridX, gridY){
      for(let r=0;r<this.shape.length;r++){
        for(let c=0;c<this.shape[r].length;c++){
          if(this.shape[r][c]){
            const gx = gridX + c;
            const gy = gridY + r;
            if(gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return false;
            if(board[gy][gx] !== null) return false;
          }
        }
      }
      return true;
    }

    place(gridX, gridY){
      for(let r=0;r<this.shape.length;r++){
        for(let c=0;c<this.shape[r].length;c++){
          if(this.shape[r][c]){
            board[gridY + r][gridX + c] = this.color;
          }
        }
      }
    }
  }

  // ----- Draw functions -----
  function clearCanvas(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function drawGrid(){
    clearCanvas();
    // grid cells
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const x = c * cellSize;
        const y = r * cellSize;
        // cell background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, y, cellSize, cellSize);
        // filled block
        if(board[r][c] !== null){
          ctx.fillStyle = board[r][c];
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }
        // border
        ctx.strokeStyle = "#e6eefc";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
      }
    }

    // draw previewShown (visual) if exists
    if(previewShown && currentPiece){
      drawPieceAtGrid(currentPiece, previewShown.x, previewShown.y, 0.35);
    }

    // draw dragging piece (pixel coords)
    if(dragging && currentPiece){
      drawPieceAtPixel(currentPiece, currentPiece.pixelX, currentPiece.pixelY, 1);
    }
  }

  function drawPieceAtGrid(piece, gx, gy, alpha=1){
    const px = gx * cellSize;
    const py = gy * cellSize;
    drawPieceAtPixel(piece, px, py, alpha);
  }

  function drawPieceAtPixel(piece, px, py, alpha=1){
    ctx.save();
    ctx.globalAlpha = alpha;
    for(let r=0;r<piece.shape.length;r++){
      for(let c=0;c<piece.shape[r].length;c++){
        if(piece.shape[r][c]){
          const x = px + c * cellSize;
          const y = py + r * cellSize;
          ctx.fillStyle = piece.color;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    ctx.restore();
  }

  // ----- Mini pieces UI -----
  function clearMiniPieces(){
    if(!pieceContainer) return;
    pieceContainer.innerHTML = '';
  }

  function createMiniCanvasFor(piece){
    const mini = document.createElement('canvas');
    mini.width = MINI_CANVAS_SIZE;
    mini.height = MINI_CANVAS_SIZE;
    mini.style.width = MINI_CANVAS_SIZE + 'px';
    mini.style.height = MINI_CANVAS_SIZE + 'px';
    mini.className = 'mini-piece-canvas';
    const mctx = mini.getContext('2d');
    mctx.clearRect(0,0,mini.width, mini.height);

    // calculate small cell for mini drawing
    const smallCell = Math.floor(MINI_CANVAS_SIZE / Math.max(piece.shape[0].length, piece.shape.length));
    const offsetX = Math.floor((MINI_CANVAS_SIZE - piece.shape[0].length * smallCell)/2);
    const offsetY = Math.floor((MINI_CANVAS_SIZE - piece.shape.length * smallCell)/2);

    for(let r=0;r<piece.shape.length;r++){
      for(let c=0;c<piece.shape[r].length;c++){
        if(piece.shape[r][c]){
          mctx.fillStyle = piece.color;
          mctx.fillRect(offsetX + c*smallCell + 1, offsetY + r*smallCell + 1, smallCell - 2, smallCell - 2);
          mctx.strokeStyle = '#ffffff66';
          mctx.strokeRect(offsetX + c*smallCell + 1, offsetY + r*smallCell + 1, smallCell - 2, smallCell - 2);
        }
      }
    }

    // pointerdown on mini -> start drag a clone of this piece
    mini.addEventListener('pointerdown', (ev)=>{
      ev.preventDefault();
      currentPiece = piece.clone();
      dragging = true;
      activePointerId = ev.pointerId || 'mouse';
      // initialize pixel pos relative to canvas
      const rect = canvas.getBoundingClientRect();
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      currentPiece.pixelX = cx - (currentPiece.shape[0].length * cellSize)/2;
      currentPiece.pixelY = cy - (currentPiece.shape.length * cellSize)/2;
      // ensure we redraw to show dragging piece
      drawGrid();
    }, {passive:false});

    return mini;
  }

  function generateMiniPieces(){
    if(!pieceContainer) return;
    clearMiniPieces();
    for(let i=0;i<PIECES_COUNT;i++){
      const shape = shapes[Math.floor(Math.random()*shapes.length)];
      const color = colors[Math.floor(Math.random()*colors.length)];
      const p = new Piece(shape, color);
      const mini = createMiniCanvasFor(p);
      pieceContainer.appendChild(mini);
    }
  }

  // ----- Pointer move / up ----- (global handlers)
  function handlePointerMove(ev){
    if(!dragging || !currentPiece) return;
    if(activePointerId && ev.pointerId !== activePointerId) return;
    ev.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;

    // update pixel pos for visual dragging
    currentPiece.pixelX = cx - (currentPiece.shape[0].length * cellSize) / 2;
    currentPiece.pixelY = cy - (currentPiece.shape.length * cellSize) / 2;

    // compute pointer grid (in grid coords)
    const pointerGridX = Math.floor(cx / cellSize);
    const pointerGridY = Math.floor(cy / cellSize);

    // find all valid placement positions (grid coords) for this piece
    const validPositions = [];
    for(let gy=0; gy<=ROWS - currentPiece.shape.length; gy++){
      for(let gx=0; gx<=COLS - currentPiece.shape[0].length; gx++){
        if(currentPiece.canPlace(gx, gy)){
          validPositions.push({x:gx, y:gy});
        }
      }
    }

    if(validPositions.length === 0){
      previewPlace = null;
      previewShown = null;
      drawGrid();
      return;
    }

    // choose nearest valid position (Euclidean on centers)
    let best = validPositions[0];
    let bestDist = Infinity;
    for(const pos of validPositions){
      const centerX = pos.x + currentPiece.shape[0].length/2;
      const centerY = pos.y + currentPiece.shape.length/2;
      const dist = Math.hypot(centerX - pointerGridX, centerY - pointerGridY);
      if(dist < bestDist){ bestDist = dist; best = pos; }
    }

    // previewPlace = actual place (the valid best pos)
    previewPlace = { x: best.x, y: best.y };

    // previewShown = visual preview (shifted +1 row), but keep within bounds
    let shownY = Math.min(best.y + 1, ROWS - currentPiece.shape.length);
    // If shifting causes overlap (not valid), don't shift visual below a colliding area:
    if(!currentPiece.canPlace(best.x, shownY)){
      // try to adjust shownY down until valid or revert to best.y
      let found = false;
      for(let tryY = best.y; tryY <= Math.min(best.y + 2, ROWS - currentPiece.shape.length); tryY++){
        if(currentPiece.canPlace(best.x, tryY)){ shownY = tryY; found = true; break; }
      }
      if(!found) shownY = best.y;
    }
    previewShown = { x: best.x, y: shownY };

    drawGrid();
  }

  function handlePointerUp(ev){
    if(!dragging || !currentPiece) return;
    if(activePointerId && ev.pointerId !== activePointerId) return;
    ev.preventDefault();

    // attempt to place at previewPlace (the real valid pos)
    if(previewPlace && currentPiece.canPlace(previewPlace.x, previewPlace.y)){
      // animate drop from top to target pixel
      const targetPx = previewPlace.x * cellSize;
      const targetPy = previewPlace.y * cellSize;
      let animY = - (currentPiece.shape.length * cellSize); // start from above
      const step = (targetPy - animY) / 10;

      function anim(){
        drawGrid();
        drawPieceAtPixel(currentPiece, targetPx, animY, 1);
        animY += step;
        if((step>0 && animY < targetPy) || (step<0 && animY > targetPy)){
          requestAnimationFrame(anim);
        } else {
          // finalize
          currentPiece.place(previewPlace.x, previewPlace.y);
          score += 10;
          updateScore();
          // after placing, clear lines and regenerate pieces
          clearFullLines();
          generateMiniPieces();
          drawGrid();
        }
      }
      anim();
    } else {
      // couldn't place: just cancel (return piece)
      drawGrid();
    }

    // reset dragging state
    dragging = false;
    activePointerId = null;
    currentPiece = null;
    previewPlace = null;
    previewShown = null;
  }

  // handle pointercancel (safety)
  function handlePointerCancel(ev){
    if(activePointerId && ev.pointerId !== activePointerId) return;
    dragging = false;
    activePointerId = null;
    currentPiece = null;
    previewPlace = null;
    previewShown = null;
    drawGrid();
  }

  // ----- clear line (rows) -----
  function clearFullLines(){
    // check rows
    for(let r = ROWS - 1; r >= 0; r--){
      if(board[r].every(cell => cell !== null)){
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        score += 50;
      }
    }
    // note: columns clearing optional - keep rows only (consistent)
    updateScore();
  }

  // ----- initialization -----
  function init(){
    initBoard();
    resizeCanvas();
    // generate initial mini pieces
    generateMiniPieces();
    drawGrid();

    // pointer events globally
    window.addEventListener('pointermove', handlePointerMove, {passive:false});
    window.addEventListener('pointerup', handlePointerUp, {passive:false});
    window.addEventListener('pointercancel', handlePointerCancel, {passive:false});
    // also mouse leave cancellation
    canvas.addEventListener('mouseleave', (e)=>{ /* do not cancel during drag, allow drop outside */ });

    // initial debug log
    // console.log("Game initialized. cellSize:", cellSize, "canvas css:", canvas.style.width, canvas.style.height);
  }

  // ----- run init -----
  init();

  // Expose some helpers on window for manual control (optional)
  window._blockPuzzle = {
    board,
    regenerate: generateMiniPieces,
    resize: resizeCanvas,
    debug_draw: drawGrid
  };

})();
