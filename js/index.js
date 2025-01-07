// canvas setup
var canvas = document.createElement('canvas');

canvas.id = "map";
canvas.style.borderWidth = "2px";
canvas.width = 450;
canvas.height = 800;
document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');

// origin set up
const originX = canvas.width / 2;
const originY = canvas.height / 2; // 3 * 2
var curPos = [0,0];
var curChunk = [0,0];

// hex setup
const angle = 2 * Math.PI / 6;
const hexRadius = 25; // 45
const hexOffsetWidth = hexRadius * 1.5;
const hexHeight = hexRadius * Math.sqrt(3);

// chunk size
const chunkRadius = hexHeight * 4;

// chunk storage
var chunks = {};
var chunksInView = [];

// key press to move
addEventListener("keydown", (e) => { move(e.key); });

function drawHex(x, y, colour) {
  pathHex(x, y, hexRadius, 0);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'dimgrey';
  ctx.stroke();
  ctx.fillStyle = "#"+colour;
  ctx.fill();
}

function pathHex(x, y, radius, offset) {
  ctx.beginPath();

  getHexPoints(x, y, radius, offset).forEach((point) => {
    ctx.lineTo(point[0], point[1]);
  });

  ctx.closePath();
}

function getHexPoints(x, y, radius, offset) {
  let pointsArr = [];

  for (let i = 0; i < 6; i++) {
    let xx = x + radius * Math.cos(angle * i + (angle * offset));
    let yy = y + radius * Math.sin(angle * i + (angle * offset));
    pointsArr.push([xx, yy]);
  }

  return pointsArr;
}

function initChunk(x, y) {
  let chunkName = x+","+y;
  chunks[chunkName] = new HexChunk(x, y);

  for (let i = 0; i < chunks[chunkName].cellsArr.length; i++) {
    chunks[chunkName].cellsArr[i] = tileTypes[1];
  }

  for (let i = 0; i < chunks[chunkName].pathPoints.length; i++) {
    chunks[chunkName].pathPoints[i] = (Math.random() >= 0.5) ? true : false;
  }

  if (chunks[chunkName].pathPoints[0] == true)
    chunks[chunkName].cellsArr[41] = tileTypes[0];

  if (chunks[chunkName].pathPoints[1] == true)
    chunks[chunkName].cellsArr[49] = tileTypes[0];

  if (chunks[chunkName].pathPoints[2] == true)
    chunks[chunkName].cellsArr[57] = tileTypes[0];
}

function getChunkOrigin(chunkName) {
  let chunkOffset = new Array(2);

  if (chunkName in chunks) {
    chunkOffset = [chunks[chunkName].xOffset,
                   chunks[chunkName].yOffset];
  } else {
    chunkOffset = getChunkOffset(chunkName);
  }

  let chunkOriginX = originX + (chunkOffset[0] * hexOffsetWidth * 8);
  let chunkOriginY = originY + (chunkOffset[1] * -hexHeight * 12);

  return [chunkOriginX, chunkOriginY];
}

function getChunkOffset(chunkName) {
  let strArr = chunkName.split(",");
  let xOffset = Number(strArr[0]);
  let yOffset = Number(strArr[1]);

  return [xOffset, yOffset];
}

function drawChunk(chunkName) {
  let chunkOrigin = getChunkOrigin(chunkName);

  chunks[chunkName].cellsArr.forEach((cell, i) => {
    let relX = chunkOrigin[0] + ((curPos[0] - cellRelPos[i][0]) * -hexOffsetWidth);
    let relY = chunkOrigin[1] + ((-curPos[1] + cellRelPos[i][1]) * -hexHeight);
    drawHex(relX, relY, chunks[chunkName].cellsArr[i]);
  });

  return chunkOrigin;
}

function drawDog(x, y) {
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontsize = hexRadius * 1.5;
  ctx.font = fontsize+"px sans-serif";
  let text = "🐕";

  //let relY = y + (-4 * -hexHeight);

  ctx.fillText(text, x, y);
}

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
}

function move(direction) {
  switch (direction) {
    case 0:
    case "w":
      curPos[1] += 1;
      break;
    case 1:
    case "e":
      curPos[0] += 1;
      curPos[1] += 0.5;
      break;
    case 2:
    case "d":
      curPos[0] += 1;
      curPos[1] += -0.5;
      break;
    case 3:
    case "s":
      curPos[1] += -1;
      break;
    case 4:
    case "a":
      curPos[0] += -1;
      curPos[1] += -0.5;
      break;
    case 5:
    case "q":
      curPos[0] += -1;
      curPos[1] += 0.5
      break;
    default:
      console.log("error, invalid input: "+direction);
  }
  
  updateCurPosChunk();
  getChunksInView();
  drawMap();
}

function checkChunkInView(chunkName) {
  let chunkOrigin = getChunkOrigin(chunkName);

  let pointsArr = getHexPoints(chunkOrigin[0] - (curPos[0] * hexOffsetWidth),
                               chunkOrigin[1] - (-curPos[1] * hexHeight),
                               chunkRadius, 0.5);

  let pointIsInView = pointsArr.some((point) => {
    if ((point[0] > 0 && point[0] < canvas.width) &&
        (point[1] > 0 && point[1] < canvas.height))
        return true;
  });
  return pointIsInView;
}

function drawChunkPerim(chunkOriginX, chunkOriginY) {
  pathHex(chunkOriginX - (curPos[0] * hexOffsetWidth),
          chunkOriginY - (-curPos[1] * hexHeight),
          chunkRadius, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'dimgrey';
  ctx.stroke();
}

function getRelPos() {
  let relX = curPos[0] - (curChunk[0] * 8);
  let relY = curPos[1] - (curChunk[1] * 12);

  return [relX, relY];
}

function updateCurPosChunk() {
  let relPos = getRelPos();
  /*
  let x = relPos[0] * hexOffsetWidth;
  let y = relPos[1] * hexHeight;
  let c = Math.sqrt((x * x) + (y * y));
  */

  if ((relPos[0] == 0 && relPos[1] == 5) ||
      (relPos[0] == 1 && relPos[1] == 4.5) ||
      (relPos[0] == 2 && relPos[1] == 4) ||
      (relPos[0] == 3 && relPos[1] == 3.5) ||
      (relPos[0] == 4 && relPos[1] == 3)) {
    curChunk[0] +=0.5;
    curChunk[1] +=0.5;
  }

  if ((relPos[0] == 5 && relPos[1] == 2.5) ||
      (relPos[0] == 5 && relPos[1] == 1.5) ||
      (relPos[0] == 5 && relPos[1] == 0.5) ||
      (relPos[0] == 5 && relPos[1] == -0.5) ||
      (relPos[0] == 5 && relPos[1] == -1.5)) {
    curChunk[0] +=1;
  }

  if ((relPos[0] == 5 && relPos[1] == -2.5) ||
      (relPos[0] == 4 && relPos[1] == -3) ||
      (relPos[0] == 3 && relPos[1] == -3.5) ||
      (relPos[0] == 2 && relPos[1] == -4) ||
      (relPos[0] == 1 && relPos[1] == -4.5)) {
    curChunk[0] +=0.5;
    curChunk[1] -=0.5;
  }

  if ((relPos[0] == 0 && relPos[1] == -5) ||
      (relPos[0] == -1 && relPos[1] == -4.5) ||
      (relPos[0] == -2 && relPos[1] == -4) ||
      (relPos[0] == -3 && relPos[1] == -3.5) ||
      (relPos[0] == -4 && relPos[1] == -3)) {
    curChunk[0] -=0.5;
    curChunk[1] -=0.5;
  }

  if ((relPos[0] == -5 && relPos[1] == -2.5) ||
      (relPos[0] == -5 && relPos[1] == -1.5) ||
      (relPos[0] == -5 && relPos[1] == -0.5) ||
      (relPos[0] == -5 && relPos[1] == 0.5) ||
      (relPos[0] == -5 && relPos[1] == 1.5)) {
    curChunk[0] -=1;
  }

  if ((relPos[0] == -5 && relPos[1] == 2.5) ||
      (relPos[0] == -4 && relPos[1] == 3) ||
      (relPos[0] == -3 && relPos[1] == 3.5) ||
      (relPos[0] == -2 && relPos[1] == 4) ||
      (relPos[0] == -1 && relPos[1] == 4.5)) {
    curChunk[0] -=0.5;
    curChunk[1] +=0.5;
  }

  //console.log(relPos, curChunk);
}

function getChunksInView() {
  chunksInView = [];

  // start at curChunk
  let curPosName = curChunk[0]+","+curChunk[1];

  // init curChunk if not init'd yet
  if (!(curPosName in chunks))
    initChunk(curChunk[0], curChunk[1])

  // add to array of chunks in view
  chunksInView.push(curChunk[0]+","+curChunk[1]);

  for (let i = 0; i < chunksInView.length; i++) {
    // check every neighbouring chunk of chunks in view
    chunkRelNeighbours.forEach((neighbour) => {
      let offset = getChunkOffset(chunksInView[i]);

      let neighbourXOffset = offset[0] + neighbour[0];
      let neighbourYOffset = offset[1] + neighbour[1];
      let neighbourName = neighbourXOffset+","+neighbourYOffset;

      if (checkChunkInView(neighbourName)) {
        if (!chunksInView.includes(neighbourName)) {
          // init them if they aren't init'd yet
          if (!(neighbourName in chunks))
            initChunk(neighbourXOffset, neighbourYOffset)
          
          chunksInView.push(neighbourName);
        }
      }
    });
  }

  console.log(chunksInView);
}

// check which chunks are in frame
getChunksInView();
// draw the chunks in frame
drawMap();