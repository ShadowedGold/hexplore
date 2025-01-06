// canvas setup
var canvas = document.createElement('canvas');

canvas.id = "map";
canvas.style.borderWidth = "2px";
canvas.width = 450;
canvas.height = 800;
document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');

// hex setup
const angle = 2 * Math.PI / 6;
const radius = 25;
const hexOffsetWidth = radius * 1.5;
const hexHeight = radius * Math.sqrt(3);

// chunk storage
var chunks = {};

// origin set up
const originX = canvas.width / 2;
const originY = canvas.height / 2;
const curPos = [0,0];

function drawHex(x, y, colour) {
  pathHex(x, y);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'dimgrey';
  ctx.stroke();
  ctx.fillStyle = "#"+colour;
  ctx.fill();
}

function pathHex(x, y) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let xx = x + radius * Math.cos(angle * i);
    let yy = y + radius * Math.sin(angle * i);
    ctx.lineTo(xx, yy);
  }
  ctx.closePath();
}

function initChunk(x, y) {
  let chunkName = x+","+y;
  chunks[chunkName] = new HexChunk();

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

function drawChunk(chunkName, x, y) {
  chunks[chunkName].cellsArr.forEach((cell, i) => {
    var relX = x + (cellRelPos[i][0] * -hexOffsetWidth);
    var relY = y + (cellRelPos[i][1] * -hexHeight);
    drawHex(relX, relY, chunks[chunkName].cellsArr[i]);
  });
}

function drawMap() {
  drawChunk("0,0", originX, originY);
}

initChunk(0,0);
drawMap();