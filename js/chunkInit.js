function initPath(chunkName) {
  let chunkOffset = getChunkOffset(chunkName);

  const pathPointCheckArr = [
    [0,0,1], // neighbour = 0, pathPoints[0] = pathPoints[1]
    [1,0,2], // neighbour = 1, pathPoints[0] = pathPoints[2]
    [2,1,2], // neighbour = 2, pathPoints[1] = pathPoints[2]
    [3,1,0], // neighbour = 3, pathPoints[1] = pathPoints[0]
    [4,2,0], // neighbour = 4, pathPoints[2] = pathPoints[0]
    [5,2,1]  // neighbour = 5, pathPoints[2] = pathPoints[1]
  ]

  // check neighboring hexes for their pathPoints data
  pathPointCheckArr.forEach((pathPointCheck) => {
    let neighbourName = getChunkNeighbourName(chunkOffset, pathPointCheck[0]);
    // if the pathPoint we are checking is undefined...
    if (chunks[chunkName].pathPoints[pathPointCheck[1]] == undefined) {
      // if neighbouring chunk exists...
      if (neighbourName in chunks) {
        chunks[chunkName].pathPoints[pathPointCheck[1]] = chunks[neighbourName].pathPoints[pathPointCheck[2]];
      }
    }
  });

  // go over all the path points in the chunk
  for (let i = 0; i < chunks[chunkName].pathPoints.length; i++) {
    // if any of the path points aren't already init'd, init them
    if (chunks[chunkName].pathPoints[i] == undefined)
    chunks[chunkName].pathPoints[i] = (Math.random() >= 0.5) ? true : false;
  }

  // if any pathPoints are true/active
  if (chunks[chunkName].pathPoints.some((pathPoint) => { return pathPoint})) {
    // pick a random hex between 0 and 18
    // that all the paths should converge on
    let pathMeetingPoint = Math.floor(Math.random() * 18);
    chunks[chunkName].cellsArr[pathMeetingPoint] = tileTypes[0];
  
    const pathPointHexMapArr = [
      [0,41], // pathPoints[0] = hex 41
      [1,49], // pathPoints[1] = hex 49
      [2,57]  // pathPoints[2] = hex 57
    ]

    // assign a path texture to the pathPoint hexes with a path
    pathPointHexMapArr.forEach((pathPointHexMap) => {
      if (chunks[chunkName].pathPoints[pathPointHexMap[0]] == true)
        initPathLine(chunkName, pathMeetingPoint, pathPointHexMap[1]);
    });
  }
}

function initPathLine(chunkName, startHex, endHex) {
  chunks[chunkName].cellsArr[endHex] = tileTypes[0];
}

function getChunkNeighbourName(chunkOffset, n) {
  return chunkNeighbourName = (chunkOffset[0]+chunkRelNeighbours[n][0])+","+
                              (chunkOffset[1]+chunkRelNeighbours[n][1]);
}

function initBackground(chunkName) {
  // go over all hexes in the chunk
  for (let i = 0; i < chunks[chunkName].cellsArr.length; i++) {
    // if the hexes aren't already designated other tiles...
    if (chunks[chunkName].cellsArr[i] == undefined) {
      // set them to grass for now
      chunks[chunkName].cellsArr[i] = tileTypes[1];
    }
  }
}