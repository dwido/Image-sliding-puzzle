/* 
todo add description here
how many pieces to slice */
function Puzzle(dimension, puzzleContainer, imageUrl){
    this.dimension = dimension;
    this.puzzleContainer = puzzleContainer;
    this.width = parseInt(this.puzzleContainer.offsetWidth);
    this.height = parseInt(this.puzzleContainer.offsetHeight);
    this.imageUrl = imageUrl || puzzleContainer.backgroundImage;
	this.elementWidth = this.width / this.dimension;	
	this.elementHeight = this.height / this.dimension;	
	this.matrix = new Matrix(dimension);
	this.cellSizeCssRule;
	
	this.updateCellStylesheet();
    this.split();  
	this.addEvents();
}

Puzzle.prototype.updateCellStylesheet = function(){
	var ss = document.styleSheets[0];
	var rules = ss.cssRules? ss.cssRules: ss.rules;
	if (rules[0].selectorText === '#puzzle_container div') {
		if (ss.deleteRule) ss.deleteRule(0);
		else if (ss.removeRule) ss.removeRule(0);

	}
	var rule = "#puzzle_container div {width:" + this.elementWidth + "px;height:" + this.elementHeight + "px; background-image: url(\"" + this.imageUrl + "\");}";
	if(document.styleSheets[0].insertRule) document.styleSheets[0].insertRule(rule,0);
	else this.cellSizeCssRule = document.styleSheets[0].addRule(rule,0);
}

Puzzle.prototype.split = function (){
  var elementsHtml = ""
  for(var row = 0; row < this.dimension; row++) {
    for( var col = 0; col < this.dimension; col++) {
	  if (row === (this.dimension - 1) && col === (this.dimension - 1)) continue;// last row
	  var newElement = this.getElementHtml(row  * this.elementHeight, col * this.elementWidth);
	  this.matrix.set({row:row, col:col}, newElement);
	  this.puzzleContainer.appendChild(newElement);
    }
  }
}

Puzzle.prototype.getElementHtml = function(top, left) {
  var el = document.createElement('div');
  el.style.top = top + 'px';
  el.style.left = left + 'px';
  el.style.backgroundSize = this.width + "px";
  el.style.backgroundPosition = '-' + left + 'px -' + top + 'px';
  el.style.position = 'absolute';
  $(el).bind('mousedown', function(e){
  var originalPosition = {top: el.style.top, left: el.style.left};
  
  var options = {
		start: function(event){
			//check if the element is eligible of moving
			var cell = this.clickedElement(event);
			var offset = this.getOffsetFromEmptyCell(cell);
			if(offset.row !== 0 && offset.col !== 0) return false; // no rows or columns overlap
			options['axis'] =  offset.row !== 0 ? 'y' : 'x';
			var position = this.position(cell);
			if (offset.row + offset.col > 0)  options.containment = [position.left, position.top, position.left + this.elementWidth, position.top + this.elementHeight];
			else options.containment = [position.left - this.elementWidth, position.top - this.elementHeight, position.left, position.top];
			
			event.target["puzzleAction"] = this.cellsInRangeToEmptyCell(cell);
		}.bind(this),
		drag: function(event) {
			for(var i = 1; i < event.target["puzzleAction"].range.length; i++) { // skip self element at position 0
				cell = event.target["puzzleAction"].range[i];
				var el = this.matrix.get(cell);
				var position = this.position(cell);
				if(options['axis'] == 'y') el.style.top = position.top + (event.target.top - originalPosition.top) + 'px';
				else el.style.left = position.left + (event.target.style.left - originalPosition.left) +'px';
			}
		}.bind(this),
		stop: function(event, ui){
			if(Math.abs(ui.position.left - ui.originalPosition.left) > this.elementWidth / 2 || Math.abs(ui.position.top - ui.originalPosition.top) > this.elementHeight / 2)
				this.move(event.target["puzzleAction"]);
			else
				event.target["puzzleAction"].range.forEach(function(cell){
					this.animateMove(cell, cell);
				}.bind(this))
		}.bind(this)
	}
	drag(e.target, e, options);
  }.bind(this));
  return el;
}

Puzzle.prototype.addEvents = function() {
	if(this.puzzleContainer.addEventListener) {
		this.puzzleContainer.addEventListener('click', this.onclick.bind(this));
	}
	else {
		this.puzzleContainer.attachEvent('click', this.onclick.bind(this));
	}
}

Puzzle.prototype.onclick = function(e) {
	this.moveToEmptySpace(this.clickedElement(e));		
}

Puzzle.prototype.clickedElement = function(e) {
	var puzzlePosition = getElementPosition(this.puzzleContainer); // todo use jquery position
	var col = parseInt((e.pageX - puzzlePosition.x) / this.elementWidth);
	var row = parseInt((e.pageY - puzzlePosition.y) / this.elementHeight);
	return {row:row, col:col};
}

Puzzle.prototype.moveToEmptySpace = function(cell){
	this.move(this.cellsInRangeToEmptyCell(cell)); // only one row to move
}

Puzzle.prototype.getOffsetFromEmptyCell = function(cell){
	var emptyCell = this.matrix.emptyCell();
	var offset = {row:0, col:0};
	if (emptyCell.row !== cell.row ) offset.row = emptyCell.row < cell.row? -1 : 1; // down: -1 up: 1
	if ( emptyCell.col !== cell.col ) offset.col = emptyCell.col < cell.col? -1 : 1;
	return offset;
}

Puzzle.prototype.animateMove = function(cell, targetCell){
	var elToMove = this.matrix.get(cell);
	$(elToMove).animate({	top: targetCell.row * this.elementHeight,
							left: targetCell.col * this.elementWidth}, 250)
}

Puzzle.prototype.move = function(action){
	if(!action) return;
	for( var i = action.range.length -1 ; i >= 0; i--) {
		var cell = action.range[i];
		var toTargetCell = {row: cell.row + action.offset.row, col: cell.col + action.offset.col};
		this.animateMove(cell, toTargetCell);
		this.matrix.swap(cell);
	};
}

Puzzle.prototype.cellsInRangeToEmptyCell = function(cell, excludeSelf) {
	var offset = this.getOffsetFromEmptyCell(cell);
	if(offset.row !== 0 && offset.col !== 0) return;

	var emptyCell = this.matrix.emptyCell();
	var cellsToMove = [];
	while( cell.row != emptyCell.row || cell.col != emptyCell.col) {
		cellsToMove.push(jQuery.extend(true, {}, cell));
		cell.row += offset.row;
		cell.col += offset.col;
	}
	return {range: cellsToMove, offset: offset};
}

Puzzle.prototype.position = function(cell){
	return {top: cell.row * this.elementHeight, left: cell.col * this.elementWidth}
}

function Matrix (dimension) {
	//private
	var elements = [];
	var emptyCell = {col: dimension - 1, row: dimension - 1}; // defaults to the last cell in the matrix
	this.set = function(cell, element) {
		if(!elements[cell.row]) elements[cell.row] = [];
		elements[cell.row][cell.col] = element;
	}	
	this.get = function(cell){ return elements[cell.row][cell.col]};
	this.emptyCell = function(){ return emptyCell;}

	this.swap = function(cellA) {
		var elA = this.get(cellA);
		this.set(cellA, null);
		this.set(emptyCell, elA);
		emptyCell = cellA;
	}
	
	this.isEmptyCell = function(cell){
		return this.get(cell) == null;
	}
}

function getElementPosition(e) {
	var x = 0, y = 0;
	while(e != null) {
		x += e.offsetLeft;
		y += e.offsetTop;
		e = e.offsetParent;
	}
	return {x:x, y:y};
}

if(!Function.prototype.bind) {
	Function.prototype.bind = function( o /*, args */) {
		//Save the this and arguments values into variables so 
		//we can use them in the nested function below.
		var self = this, boundArgs = arguments;
		
		//The return value of the bind() method is a function
		return function() {
			// Build up an argument list, starting with any args passed 
			// to bind after the first one, and follow those with all args
			// passed to this function
			var args = [], i;
			for(i = 1; i < boundArgs.length; i++) args.push(boundArgs[i]);
			for(i = 0; i < arguments.length; i++) args.push(arguments[i]);
			
			// Now invoke self as a method of o , with those arguments
			return self.apply(o, args);
		};
	};
}