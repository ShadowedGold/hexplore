function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let chunkOrigins = [];
  
  chunksInView.forEach((chunkName) => {
    chunkOrigins.push(drawChunk(chunkName));
  });

  chunkOrigins.forEach((chunkOrigin, i) => {
    drawChunkPerim(chunkOrigins[i][0], chunkOrigins[i][1]);
  });

  drawDog(originX, originY);

  if (nearbyTreasure1) drawNose();

  if (treasure1Found) drawTreasure1();

  drawUI();
}

function drawHex(x, y, colour, cellNum, chunkName) {
  pathHex(x, y, hexRadius, 0);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#202020';
  ctx.stroke();
  ctx.fillStyle = "#"+colour;
  ctx.fill();

  if (treasure2.findIndex(matchArrEl, getGlobalCellPos(cellNum, chunkName)) > -1) {
    drawTreasure2(x,y);
  }
}

function drawChunk(chunkName) {
  let chunkOrigin = getChunkOrigin(chunkName);

  chunks[chunkName].cellsArr.forEach((cell, i) => {
    let relX = chunkOrigin[0] + ((curPos[0] - cellRelPos[i][0]) * -hexOffsetWidth);
    let relY = chunkOrigin[1] + ((-curPos[1] + cellRelPos[i][1]) * -hexHeight);
    drawHex(relX, relY, chunks[chunkName].cellsArr[i], i, chunkName);
  });

  return chunkOrigin;
}

function drawChunkPerim(chunkOriginX, chunkOriginY) {
  pathHex(chunkOriginX - (curPos[0] * hexOffsetWidth),
          chunkOriginY - (-curPos[1] * hexHeight),
          chunkRadius, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,'+chunkPerimOpacity+')';
  ctx.setLineDash([2, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDog(x, y) {
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontsize = hexRadius * 2;
  ctx.font = fontsize+"px sans-serif";
  let text = "🐕"; //

  ctx.translate(originX, originY);
  ctx.rotate(dogDir+(Math.PI*2/6));

  if (moveThrough) {
    ctx.fillText(text, 0, 5);
  } else ctx.fillText(text, 0, 0);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  //ctx.fillText(text, x, y);
}

function drawNose() {
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontsize = hexRadius / 1.5;
  ctx.font = fontsize+"px sans-serif";
  let text = "👃";

  ctx.translate(originX, originY);
  ctx.fillText(text, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawTreasure1() {
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontsize = hexRadius;
  ctx.font = fontsize+"px sans-serif";
  let text = treasure1Img;

  ctx.translate(originX, originY);
  ctx.fillText(text, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawTreasure2(x,y) {
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontsize = hexRadius;
  ctx.font = fontsize+"px sans-serif";
  let text = treasure2Img;

  ctx.translate(x, y);
  ctx.fillText(text, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawUI() {
  let pos = [10,10];

  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let fontsize = 20;
  let lineHeight = fontsize * 1.5;
  ctx.font = fontsize+"px sans-serif";
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'black';
  let text = "";

  if (treasure1.length > 0) {
    text = treasure1Img+" Left: "+treasure1.length;
  } else text = "You Win!";
  
  ctx.strokeText(text, pos[0], pos[1]);
  ctx.fillText(text, pos[0], pos[1]);

  if (treasure2.length < treasure2Available) {
    text = treasure2Img+" "+(treasure2Available - treasure2.length);

    ctx.strokeText(text, pos[0], pos[1] + lineHeight);
    ctx.fillText(text, pos[0], pos[1] + lineHeight);
  }

  ctx.textAlign = 'center';
  text = curPos;

  ctx.strokeText(text, canvas.width/2, pos[1]);
  ctx.fillText(text, canvas.width/2, pos[1]);

  ctx.textAlign = 'right';
  text = "🕳️: F";

  ctx.strokeText(text, canvas.width - pos[0], pos[1]);
  ctx.fillText(text, canvas.width - pos[0], pos[1]);
}