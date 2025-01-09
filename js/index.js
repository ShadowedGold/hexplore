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

// chunk setup
const chunkRadius = hexHeight * 4;
var chunks = {};
var chunksInView = [];

// key press to move (qweasd)
addEventListener("keydown", (e) => { move(e.key); });

// RUN -----------------------------------------------------------------
// check which chunks are in frame
getChunksInView();
// draw the chunks in frame
drawMap();

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

  // init pathes
  initPath(chunkName);
  
  // init other tiles
  initBackground(chunkName);
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
  
  //console.log(curChunk);
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

  // points 0 & 1 : bottom right hex corner, top left canvas corner
  // points 1 & 2 : bottom left hex corner, top right canvas corner
  // points 3 & 4 : top left hex corner, bottom right canvas corner
  // points 4 & 5 : top right hex corner, bottom left canvas corner
  let cornerIsInView = false;
  if (!pointIsInView && (
      checkCorner(pointsArr[0], pointsArr[1], 0, 0, true, "upper", chunkName) ||
      checkCorner(pointsArr[1], pointsArr[2], canvas.width, 0, false, "upper", chunkName) ||
      checkCorner(pointsArr[3], pointsArr[4], canvas.width, canvas.height, true, "lower", chunkName) ||
      checkCorner(pointsArr[4], pointsArr[5], 0, canvas.height, false, "lower", chunkName)))
    cornerIsInView = true;

  //console.log(chunkName, pointIsInView, cornerIsInView);

  return (pointIsInView || cornerIsInView);
}

function checkCorner(p0, p1, cX, cY, offset, match, chunkName) {
  // p0 & p1 : points 1 & 2
  // cX & cY : canvas corner
  // offset : flips the direction of the diagonal
  // https://stackoverflow.com/questions/40776014/javascript-point-collision-with-regular-hexagon

  let rx = (p0[0] < p1[0]) ? p0[0] : p1[0];
  let ry = (p0[1] < p1[1]) ? p0[1] : p1[1];
  let w = hexRadius * 6; // 150
  let h = hexRadius * Math.sqrt(3) * 2; // 86.6025

  let x = cX;
  let y = cY;
  let result = "";

  if ((((rx + w) == x && x > 0) || (rx + w) > x) && (rx < x) &&
      (((ry + h) == y && y > 0) || (ry + h) > y) && (ry < y)) {
    x = ((x - rx) % w) / w; // less than one, a percent of w
    y = ((y - ry) % h) / h; // less than one, a percent of h
    if (offset) x = 1 - x; // apply offset if true
    if (x > y || x == 0) {
      // point in upper right triangle if offset false
      // point in upper left triangle if offset true
      result = "upper";
    } else if (x < y) {
      // point in lower left triangle if offset false
      // point in lower right triangle if offset true
      result = "lower";
    } else {
      // point on diagonal
    }
  }
  
  /*
  if (chunkName == "-1,1") {
    let pointsStr = "["+p0[0].toFixed(2)+","+p0[1].toFixed(2)+"]"+
                    "["+p1[0].toFixed(2)+","+p1[1].toFixed(2)+"]";
    let xyStr = "["+x.toFixed(2)+","+y.toFixed(2)+"]";
    console.log(pointsStr, [cX, cY], xyStr, offset, match, (match == result));
  }
  */

  return (match == result) ? true : false;
}

function drawChunkPerim(chunkOriginX, chunkOriginY) {
  pathHex(chunkOriginX - (curPos[0] * hexOffsetWidth),
          chunkOriginY - (-curPos[1] * hexHeight),
          chunkRadius, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'white';
  ctx.setLineDash([2, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function getRelPos() {
  let relX = curPos[0] - (curChunk[0] * 8);
  let relY = curPos[1] - (curChunk[1] * 12);

  return [relX, relY];
}

function updateCurPosChunk() {
  let relPos = getRelPos();
  
  //let x = relPos[0] * hexOffsetWidth;
  //let y = relPos[1] * hexHeight;
  //let c = Math.sqrt((x * x) + (y * y));

  if ((relPos[0] == 0 && relPos[1] == 5) ||
      (relPos[0] == 1 && relPos[1] == 4.5) ||
      (relPos[0] == 2 && relPos[1] == 4) ||
      (relPos[0] == 3 && relPos[1] == 3.5) ||
      (relPos[0] == 4 && relPos[1] == 3)) {
    curChunk[0] += 0.5;
    curChunk[1] += 0.5;
  }

  if ((relPos[0] == 5 && relPos[1] == 2.5) ||
      (relPos[0] == 5 && relPos[1] == 1.5) ||
      (relPos[0] == 5 && relPos[1] == 0.5) ||
      (relPos[0] == 5 && relPos[1] == -0.5) ||
      (relPos[0] == 5 && relPos[1] == -1.5)) {
    curChunk[0] += 1;
  }

  if ((relPos[0] == 5 && relPos[1] == -2.5) ||
      (relPos[0] == 4 && relPos[1] == -3) ||
      (relPos[0] == 3 && relPos[1] == -3.5) ||
      (relPos[0] == 2 && relPos[1] == -4) ||
      (relPos[0] == 1 && relPos[1] == -4.5)) {
    curChunk[0] += 0.5;
    curChunk[1] -= 0.5;
  }

  if ((relPos[0] == 0 && relPos[1] == -5) ||
      (relPos[0] == -1 && relPos[1] == -4.5) ||
      (relPos[0] == -2 && relPos[1] == -4) ||
      (relPos[0] == -3 && relPos[1] == -3.5) ||
      (relPos[0] == -4 && relPos[1] == -3)) {
    curChunk[0] -= 0.5;
    curChunk[1] -= 0.5;
  }

  if ((relPos[0] == -5 && relPos[1] == -2.5) ||
      (relPos[0] == -5 && relPos[1] == -1.5) ||
      (relPos[0] == -5 && relPos[1] == -0.5) ||
      (relPos[0] == -5 && relPos[1] == 0.5) ||
      (relPos[0] == -5 && relPos[1] == 1.5)) {
    curChunk[0] -= 1;
  }

  if ((relPos[0] == -5 && relPos[1] == 2.5) ||
      (relPos[0] == -4 && relPos[1] == 3) ||
      (relPos[0] == -3 && relPos[1] == 3.5) ||
      (relPos[0] == -2 && relPos[1] == 4) ||
      (relPos[0] == -1 && relPos[1] == 4.5)) {
    curChunk[0] -= 0.5;
    curChunk[1] += 0.5;
  }

  //console.log(relPos, curChunk);
}

function getChunksInView() {
  chunksInView = [];
  let chunksNotInView = [];

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

      // if it isn't already in one of the lists we put the stuff we've checked...
      if (!chunksInView.includes(neighbourName) &&
          !chunksNotInView.includes(neighbourName)) {
        // if it is on screen...
        if (checkChunkInView(neighbourName)) {
          // init them if they aren't init'd yet
          if (!(neighbourName in chunks))
            initChunk(neighbourXOffset, neighbourYOffset)
          
          chunksInView.push(neighbourName);
        } else {
          // if it isn't on screen, add it to a list so we know
          // it failed the check and we don't need to check it again
          chunksNotInView.push(neighbourName);
        }
      }
    });
  }

  //console.log(chunksInView.length);
}