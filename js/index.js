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
var curPos = [0,0];

// key press to move
addEventListener("keydown", (e) => { move(e.key); });

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
    let relX = x + ((curPos[0] + cellRelPos[i][0]) * -hexOffsetWidth);
    let relY = y + ((curPos[1] + cellRelPos[i][1]) * -hexHeight);
    drawHex(relX, relY, chunks[chunkName].cellsArr[i]);
  });
}

function drawDog(x, y) {
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontsize = radius;
  ctx.font = fontsize+"px sans-serif";
  let text = "🐕";

  let relY = y + (-4 * -hexHeight);

  ctx.fillText(text, x, relY);
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawChunk("0,0", originX, originY);
  drawDog(originX, originY);
}

function move(direction) {
  switch (direction) {
    case 0:
    case "w":
      curPos[1] += -1;
      break;
    case 1:
    case "e":
      curPos[0] += 1;
      curPos[1] += -0.5;
      break;
    case 2:
    case "d":
      curPos[0] += 1;
      curPos[1] += 0.5;
      break;
    case 3:
    case "s":
      curPos[1] += 1;
      break;
    case 4:
    case "a":
      curPos[0] += -1;
      curPos[1] += 0.5;
      break;
    case 5:
    case "q":
      curPos[0] += -1;
      curPos[1] += -0.5
      break;
    default:
      console.log("error, invalid input: "+direction);
  }
  drawMap();
}

initChunk(0,0);
drawMap();