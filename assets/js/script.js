console.log("is js working?");

//this is the canvas we've defined in our html
var gameCanvas1 = $("#gameCanvas1")[0];

//we now give that canvas a 'context' and save it in a variable. 
var context1 = gameCanvas1.getContext("2d");
var width1 = gameCanvas1.width;
var height1 = gameCanvas1.height;

//initialize the grid
var grid = girdInit(10,100,100,'#0b175b',"#2b43c6");
//draw the gird
drawGrid(context1, grid, true);

//this captures the clicks on the canvas and turns on cells. 
$("body").click(gameCanvas1,function(e){
	//where is the click on the canvas/grid?
	var mousePos = getMousePos(gameCanvas1, e);
	var foundCell = findCellAt(grid, mousePos.x, mousePos.y);
	
	if(foundCell.isSeed){//if the foundCell is already a seed, turn it off.
		foundCell.isSeed = false;
		foundCell.fillColor = "red";
		foundCell.siteColor = 0;
	}
	else{//otherwise, make it a seed. 
		foundCell.isSeed = true;
		foundCell.fillColor = "#FF9A85";
		foundCell.siteColor = '#'+Math.floor(Math.random()*16777215).toString(16);  //this will be the color of this seed's site.
	}
	drawGrid(context1, grid, true);
});

//this function resets all the previous seeds and site colors to a blank slate.
function reset(grid){
	for(var i = 0; i < grid.length; i++){
		for(var k = 0; k < grid[0].length; k++){
				grid[i][k].isSeed = false;
				grid[i][k].nearestSeed =0;
				grid[i][k].fillColor = '#0b175b';
		}
	}
	
	drawGrid(context1, grid, true);
}

//this function randomly chooses seeds for the sites
function chooseSeeds(grid, seedNum){
	 //Math.floor(Math.random() * (max - min)) + min;
	 var seeds = [];
	 for(var i = 0; i<seedNum; i++){
		var coords = [];
		coords[0] = Math.floor(Math.random() * (grid.length - 0)) + 0;
		coords[1] = Math.floor(Math.random() * (grid[0].length - 0)) + 0;
		console.log("("+coords[0]+","+coords[1]+")");
		seeds.push(coords);
	 }
	 console.log("these are all the seeds: ");
	 console.log(seeds);
	 for(var k = 0; k < seeds.length; k++){
		 grid[seeds[k][0]][seeds[k][1]].isSeed = true;
		 //thanks to https://www.paulirish.com/2009/random-hex-color-code-snippets/ for the one line color hex code generator.
		 var newColor = '#'+Math.floor(Math.random()*16777215).toString(16);  //this will be the color of this seed's site.
		 grid[seeds[k][0]][seeds[k][1]].fillColor = "#FF9A85";
		 grid[seeds[k][0]][seeds[k][1]].siteColor = newColor;
	 }
	 drawGrid(context1, grid, true);
}

//this function finds the distance from each cell to all the seeds, then compares the distances, and sets the cell's fillcolor to the nearest seed's siteColor
function generateVoronoi(grid){
	//first, find the seeds:
	var seeds = [];
	for(var i = 0; i < grid.length; i++){
		for(var k = 0; k < grid[0].length; k++){
			if(grid[i][k].isSeed){
				seeds.push(grid[i][k]);
			}
		}
	}

	//then for each cell...
	for(var j =0; j < grid.length; j++){
		for(var h=0; h < grid[0].length; h++){
			var seedDist = [];
			//find the distance to each of the seeds 
			for(var g = 0; g < seeds.length; g++){
				var dist = manhattanDistance(grid[j][h], seeds[g]);
				seedDist.push([dist,seeds[g]]);//push the seed, and the distance from the current cell to it into seedDist
			}
			//now sort seedDist by the distance to this cell (seedDist[x][0])
			seedDist.sort(function(a, b){
				if(a[0] > b[0]){return 1}
				if(a[0] == b[0]){return 0}
				if(a[0] < b[0]){return -1}
			});
			//the seeds (seedDist[x][1]) should now be sorted by distance. use the siteColor of that seed as the fillColor of this cell.
			grid[j][h].fillColor = seedDist[0][1].siteColor;
			grid[j][h].nearestSeed = seedDist[0][1];
		}//end y for		
	}//end x for
	
	for(var t = 0; t < seeds.length; t++){
		seeds[t].fillColor = "#000000";
	}
	drawGrid(context1, grid, true);
	
}

//this function finds the manhattan distance (orthagonal travel only, no diagonal) from one cell to another.
//we can think of this as the H() portion (heuristic) of our A* algorithm. 
function manhattanDistance(fromCell, toCell){
	var xDist = Math.abs(fromCell.indexX - toCell.indexX);
	var yDist = Math.abs(fromCell.indexY - toCell.indexY);
	
	return xDist+yDist;
}

//this function follows a cell's previous link all the way back to the start cell and just return the number of steps: our g(n).
function walkBack(fromCell, startCell){
	var steps = 0;
	console.log("in walkback");
	console.log(fromCell.previous);
	while(fromCell.previous != 0){
		steps++;
		fromCell = fromCell.previous;
	}
	console.log(steps);
	return steps;
}

//initializes a grid for drawing. 
function girdInit(size, cellsX, cellsY, fillColor, edgeColor)
{//size is the width and height of the square cells
 //cellsx is the number of horizontal cells in the grid
 //cellsy is the number of vertical cells in the grid
 //fillcolor is the color to fill each cell with (can represent cell states too)
 //edgecolor is the color of the cell's walls. 
 console.log("initializing grid...");
  var gameGrid=[];//initializes the grid array

  for(var i=0; i<cellsX; i++)
  {
    //console.log("building col: "+i);
    gameGrid[i]=[]; //initializes each column in the grid array
    for(var f=0; f<cellsY; f++)
    {
      //console.log("building cell: "+"["+i+","+f+"]");
      gameGrid[i][f] = new Cell(size*i, size*f, size, size, i, f, fillColor, edgeColor);
      //console.log(gameGrid[i][f]);
    }//end x for loop
  }//end y for loop

  return gameGrid;
}//end gridInit


//this function just draws the grid, wall by wall
//it takes the canvas you want to draw on, a grid to draw (generated by grid init) and a boolean indicating if you want walls drawn or not. 
function drawGrid(canvas, grid, drawWalls)
{//grid is a grid array generated by the gridInit function.
	return new Promise((resolve, reject) => {
		  canvas.clearRect(0, 0, width1, height1);//clear the grid
		  //console.log("drawing grid...");
		  canvas.strokeStyle = '#ffffff';

		  for(var i=0; i<grid.length; i++)
		  {
			for(var f=0; f<grid[i].length; f++)
			{
			  //draw a background for this cell.
			  //console.log("drawing the regular background");
			  canvas.fillStyle = grid[i][f].fillColor;
			  canvas.fillRect(grid[i][f].x, grid[i][f].y, grid[i][f].w, grid[i][f].h);

			  var wallSTruth = grid[i][f].wallS;
			  var wallNTruth = grid[i][f].wallN;
			  var wallETruth = grid[i][f].wallE;
			  var wallWTruth = grid[i][f].wallW;

			 if(drawWalls){
			  //draw northwall
			  //console.log("drawing north wall of cell: ["+i+","+f+"]");
			  if(wallNTruth)
			  { canvas.strokeStyle = grid[i][f].edgeColor;
				canvas.beginPath();
				canvas.moveTo(grid[i][f].x, grid[i][f].y);
				canvas.lineTo((grid[i][f].x+grid[i][f].w),grid[i][f].y);
				canvas.stroke();
				canvas.closePath();
			  }//end draw north wall

			  //draw eastwall
			  //console.log("drawing east wall of cell: ["+i+","+f+"]");
			  if(wallETruth)
			  {
				//console.log("wallE: "+grid[i][f].wallE);
				canvas.strokeStyle = grid[i][f].edgeColor;
				canvas.beginPath();
				canvas.moveTo((grid[i][f].x+grid[i][f].w), grid[i][f].y);
				canvas.lineTo((grid[i][f].x+grid[i][f].w),(grid[i][f].y+grid[i][f].h));
				canvas.stroke();
				canvas.closePath();
			  }//end draw east wall

			  //draw southwall
			  //console.log("drawing south wall of cell: ["+i+","+f+"]");
			  if(wallSTruth)
			  { canvas.strokeStyle = grid[i][f].edgeColor;
				canvas.beginPath();
				canvas.moveTo((grid[i][f].x+grid[i][f].w),(grid[i][f].y+grid[i][f].h));
				canvas.lineTo(grid[i][f].x,(grid[i][f].y+grid[i][f].h));
				canvas.stroke();
				canvas.closePath();
			  }//end draw south wall

			  //draw westwall
			  //console.log("drawing west wall of cell: ["+i+","+f+"]");
			  if(wallWTruth)
			  {
				//console.log("wallW: "+grid[i][f].wallW);
				canvas.strokeStyle = grid[i][f].edgeColor;
				canvas.beginPath();
				canvas.moveTo(grid[i][f].x,(grid[i][f].y+grid[i][f].h));
				canvas.lineTo(grid[i][f].x,grid[i][f].y);
				canvas.stroke();
				canvas.closePath();
			  }//end draw west wall
			 }//end drawWalls check.
			}//end x for loop
		  }//end y for loop
		  
		 resolve(true);
	});//end promise
	
}//end drawGrid

//this is the cell constructor. it represents and helps set up the info for each cell on our grid.
function Cell(x, y, h, w, indexX, indexY, fillColor, edgeColor)
{
  this.indexY = indexY; //this is the Y index of this cell on the grid
  this.indexX = indexX; //this is the X index of this cell on the Grid
  this.x = x; //this is the x pixel location of the top left corner of this cell on the canvas object
  this.y = y; //this is the y pixel location of the top left corner of this cell on the canvas object
  this.h = h; //how tall the cell is
  this.w = w; // how wide the cell is
  this.fillColor = fillColor;
  this.edgeColor = edgeColor;
  
  //for use in maze gen.
  this.wallN = true; //is this cell's north wall up?
  this.wallE = true; //is this cell's east wall up?
  this.wallS = true; //is this cell's south wall up?
  this.wallW = true; //is this cell's west wall up?
  this.beenTo = false; //have we been to this cell before?
  
  //for use in A*
  this.previous = 0;
  this.next = 0;
  this.distToStart = 0; //our g(n)
  this.distToEnd = 0;// our h(n)
  this.f = 0; // g(n) + h(n)
  
  //for use in conway's game of life
  this.liveNeighbors = 0; //how many of this cell's Neighbors are alive?
  this.isSeed = false;
  this.siteColor = fillColor;
  this.nearestSeed = 0;
  
}//end constructor

//this function finds the grid cell at an x y position on the canvas 
function findCellAt(grid, x, y){
//I think this can be optimized by dividing the mouse's x and y positions by the cell's size. this would give you the inicies of the cell you're on.
	for(var i =0;i<grid.length;i++){
		for(var k=0;k<grid[i].length;k++){
			//here we find this cells max boundries 
			var cellXmin = grid[i][k].x;
			var cellXmax = grid[i][k].x + grid[i][k].w;
			var cellYmin = grid[i][k].y;
			var cellYmax = grid[i][k].y + grid[i][k].h;
			
			//if the passed in x and y are within the height and width of this cell's x and y, its a match.
			if((x >= cellXmin && x <= cellXmax) && (y >= cellYmin && y <= cellYmax)){
				return grid[i][k];
			}
		}
	}
};

//this function finds the position of the mouse on the canvas
//in order to find the position of the mouse on the canvas, we have to subtract the position of the canvas from the global position of the mouse on the screen
function getMousePos(canvas, e){
	var rect = canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top
	}
};
