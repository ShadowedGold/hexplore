// TWEAK ---------------------------------------------------------------

var originYZoomOffset;
var hexRadiusZoom;
var chunkPerimOpacity;

// zoomed in if true
if (true) {
  originYZoomOffset = 1.5;
  hexRadiusZoom = 45;
} else {
  originYZoomOffset = 2;
  hexRadiusZoom = 25;
}

// chunk perimeter opacity up if true
if (false) {
  chunkPerimOpacity = 0.7;
} else {
  chunkPerimOpacity = 0.1;
}

// SET UP --------------------------------------------------------------

// canvas setup
var canvas = document.createElement('canvas');

canvas.id = "map";
canvas.style.borderWidth = "2px";
canvas.width = 450;
canvas.height = 800;
document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');

// origin setup
const originX = canvas.width / 2;
const originY = canvas.height / originYZoomOffset;
var curPos = [0,0];
var curChunk = [0,0];

// hex setup
const angle = 2 * Math.PI / 6;
const hexRadius = hexRadiusZoom;
const hexOffsetWidth = hexRadius * 1.5;
const hexHeight = hexRadius * Math.sqrt(3);

// chunk setup
const chunkRadius = hexHeight * 4;
var chunks = {};
var chunksInView = [];

// dog direction setup
var dogDir = 0;
var moveThrough = false;

// treasure setup
var treasure1 = new Array(10);
const treasure1Img = "🍄";

var treasure1Found = false;
var nearbyTreasure1 = false;

const treasure2Available = 5;
var treasure2 = new Array(treasure2Available);
const treasure2Img = "✨";

// key press to move (qweasd)
addEventListener("keydown", (e) => { move(e.key); });

// RUN -----------------------------------------------------------------

// place treasure
setupTreasure(treasure1);
setupTreasure(treasure2);
// check which chunks are in frame
getChunksInView();
// draw the chunks in frame
drawMap();

// FUNCTIONS -----------------------------------------------------------

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

// gets [x,y] in pixels relative to [0,0]
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

// gets [x,y] in chunk co-ords relative to [0,0]
function getChunkOffset(chunkName) {
  let strArr = chunkName.split(",");
  let xOffset = Number(strArr[0]);
  let yOffset = Number(strArr[1]);

  return [xOffset, yOffset];
}

function move(direction) {
  treasure1Found = false;

  switch (direction) {
    case 0:
    case "w":
      resolveNewPos([curPos[0], curPos[1] += 1]);
      break;
    case 1:
    case "e":
      resolveNewPos([curPos[0] += 1, curPos[1] += 0.5]);
      break;
    case 2:
    case "d":
      resolveNewPos([curPos[0] += 1, curPos[1] += -0.5]);
      break;
    case 3:
    case "s":
      resolveNewPos([curPos[0], curPos[1] += -1]);
      break;
    case 4:
    case "a":
      resolveNewPos([curPos[0] += -1, curPos[1] += -0.5]);
      break;
    case 5:
    case "q":
      resolveNewPos([curPos[0] += -1, curPos[1] += 0.5]);
      break;
    case "f":
      dig();
      break;
    default:
      console.log("error, invalid input: "+direction);
  }
  
  getChunksInView();
  detectTreasure();
  drawMap();
  
  //console.log(curChunk, curPos);
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

// gets [x,y] in hex co-ords relative to chunk
// hexPos uses hex co-ords, chunkPos uses chunk co-ords
function getRelHexPos(hexPos, chunkPos) {
  let relX = hexPos[0] - (chunkPos[0] * 8);
  let relY = hexPos[1] - (chunkPos[1] * 12);

  return [relX, relY];
}

// gets [x,y] in hex co-ords relative to global origin
function getGlobalCellPos(cellNum, chunkName) {
  let chunkPos = getChunkOffset(chunkName);

  let globalX = (chunkPos[0] * 8) + cellRelPos[cellNum][0];
  let globalY = (chunkPos[1] * 12) + cellRelPos[cellNum][1];

  return [globalX, globalY];
}

function getTerrain(hexPos) {
  
}

function resolveNewPos(newPos) {
  let updatedChunk = getUpdatedChunkFromPos(newPos, curChunk);
  
  //if new pos is good...
  curPos = newPos;
  curChunk = updatedChunk;
}

function getUpdatedChunkFromPos(hexPos, curChunk) {
  let relPos = getRelHexPos(hexPos, curChunk);
  let updatedCurChunk = [curChunk[0], curChunk[1]];

  if ((relPos[0] == 0 && relPos[1] == 5) ||
      (relPos[0] == 1 && relPos[1] == 4.5) ||
      (relPos[0] == 2 && relPos[1] == 4) ||
      (relPos[0] == 3 && relPos[1] == 3.5) ||
      (relPos[0] == 4 && relPos[1] == 3)) {
    updatedCurChunk[0] += 0.5;
    updatedCurChunk[1] += 0.5;
  }

  if ((relPos[0] == 5 && relPos[1] == 2.5) ||
      (relPos[0] == 5 && relPos[1] == 1.5) ||
      (relPos[0] == 5 && relPos[1] == 0.5) ||
      (relPos[0] == 5 && relPos[1] == -0.5) ||
      (relPos[0] == 5 && relPos[1] == -1.5)) {
    updatedCurChunk[0] += 1;
  }

  if ((relPos[0] == 5 && relPos[1] == -2.5) ||
      (relPos[0] == 4 && relPos[1] == -3) ||
      (relPos[0] == 3 && relPos[1] == -3.5) ||
      (relPos[0] == 2 && relPos[1] == -4) ||
      (relPos[0] == 1 && relPos[1] == -4.5)) {
    updatedCurChunk[0] += 0.5;
    updatedCurChunk[1] -= 0.5;
  }

  if ((relPos[0] == 0 && relPos[1] == -5) ||
      (relPos[0] == -1 && relPos[1] == -4.5) ||
      (relPos[0] == -2 && relPos[1] == -4) ||
      (relPos[0] == -3 && relPos[1] == -3.5) ||
      (relPos[0] == -4 && relPos[1] == -3)) {
    updatedCurChunk[0] -= 0.5;
    updatedCurChunk[1] -= 0.5;
  }

  if ((relPos[0] == -5 && relPos[1] == -2.5) ||
      (relPos[0] == -5 && relPos[1] == -1.5) ||
      (relPos[0] == -5 && relPos[1] == -0.5) ||
      (relPos[0] == -5 && relPos[1] == 0.5) ||
      (relPos[0] == -5 && relPos[1] == 1.5)) {
    updatedCurChunk[0] -= 1;
  }

  if ((relPos[0] == -5 && relPos[1] == 2.5) ||
      (relPos[0] == -4 && relPos[1] == 3) ||
      (relPos[0] == -3 && relPos[1] == 3.5) ||
      (relPos[0] == -2 && relPos[1] == 4) ||
      (relPos[0] == -1 && relPos[1] == 4.5)) {
    updatedCurChunk[0] -= 0.5;
    updatedCurChunk[1] += 0.5;
  }

  //console.log(relPos, updatedCurChunk);

  return updatedCurChunk;
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

function setupTreasure(treasure) {
  for (let i = 0; i < treasure.length; i++) {
    treasure[i] = getRandCoord();
  }
}

function getRandCoord() {
  let x = Math.floor(Math.random() * 100 - 50);
  let y = Math.floor(Math.random() * 200 - 100)/2;

  if (isEven(x)) {
    if (!isInt(y)) {
      y -= 0.5 * gT0(y);
    }
  } else {
    if (isInt(y)) {
      y -= 0.5 * gT0(y);
    }
  }

  return [x, y]
}

function detectTreasure() {
  let closestTreasure = 100;
  nearbyTreasure1 = false;
  dogDir = 0;

  treasure1.forEach((t) => {
    let xDist = -(curPos[0] - t[0]);
    let yDist = -(curPos[1] - t[1]);
    if (xDist <= 10 && yDist <= 10) {
      nearbyTreasure1 = true;
      
      let dist = Math.sqrt((xDist * xDist) + (yDist * yDist));
      if (dist < closestTreasure) {
        closestTreasure = dist;
        dogDir = Math.atan2(xDist, yDist) + (2 * Math.PI);
      }
    }
  });

  //console.log(closestTreasure);
}

function dig() {
  if (treasure1.findIndex(matchArrEl, curPos) > -1) {
    treasure1.splice(treasure1.findIndex(matchArrEl, curPos), 1);
    treasure1Found = true;
  }

  if (treasure2.findIndex(matchArrEl, curPos) > -1) {
    treasure2.splice(treasure2.findIndex(matchArrEl, curPos), 1);
  }
}