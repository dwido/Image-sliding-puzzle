/*!
 * This is the Puzzle Class to implement Image sliding puzzle
 * http://www.happinessbeats.com/Puzzle/puzzle.html
 *
 * David Buchbut
 *
 * Date: Sunday March 11 2012
 * The term cell here is refered to the position in the matrix {row: row index, col:column index}
 * the term element is the actual dom object
 */
function Puzzle(dimension, puzzleContainer, imageUrl) {
  if(isNaN(dimension))
    throw new TypeError();
  this.dimension = dimension;
  this.puzzleContainer = puzzleContainer;
  this.width = parseInt(this.puzzleContainer.offsetWidth);
  this.height = parseInt(this.puzzleContainer.offsetHeight);
  this.imageUrl = imageUrl || puzzleContainer.backgroundImage;
  this.borderWidth = 1;
  this.elementWidth = (this.width / this.dimension) - 2 * this.borderWidth;  
  this.elementHeight = this.height / this.dimension;  
  this.init();
}

Puzzle.prototype.init = function () {
  this.matrix = new Matrix(this.dimension);
  this.updateCellStylesheet();
  this.split();
}
//set size to all the pieces by modifiying the css rule
Puzzle.prototype.updateCellStylesheet = function() {
  var ss = document.styleSheets[0];
  var rules = ss.cssRules? ss.cssRules: ss.rules;
  if (rules[0].selectorText === '#puzzle_container div') {
    if (ss.deleteRule) ss.deleteRule(0);
    else if (ss.removeRule) ss.removeRule(0);
  }
  var rule = "#puzzle_container div {width:" + this.elementWidth + "px;height:" + this.elementHeight + "px; background-image: url(\"" + this.imageUrl + "\");}";
  if (document.styleSheets[0].insertRule) document.styleSheets[0].insertRule(rule,0);
  else document.styleSheets[0].addRule(rule,0);
}

Puzzle.prototype.split = function () {
  var elementsHtml = ""
  for (var row = 0; row < this.dimension; row++) {
    for (var col = 0; col < this.dimension; col++) {
      if (row === (this.dimension - 1) && col === (this.dimension - 1)) continue;// last row
      var newElement = this.getElementHtml(row, col);
      this.matrix.set({row:row, col:col}, newElement);
      this.puzzleContainer.appendChild(newElement);
    }
  }
}

Puzzle.prototype.getElementHtml = function(row, col) {
  var el = document.createElement('div');
  el.style.top = row * (this.elementHeight + this.borderWidth * 2) + 'px';
  el.style.left = col * (this.elementWidth + this.borderWidth * 2) + 'px';
  el.style.backgroundSize = this.width + "px";
  el.style.backgroundPosition = '-' + (col * this.elementWidth) + 'px -' + (row * this.elementHeight) + 'px';
  $(el).attr({'puzzle_row': row, 'puzzle_col': col}); // to be used to test if the puzzle is completed
  
  //dragging function to receive dragging status change
  function dragMe(event) {
    var originalPosition = {top: parseInt(el.style.top), left: parseInt(el.style.left)};
    var options = {
      start: function(event) {
        //check if the element can move
        var cell = this.elementToCell(event.target);
        var offset = this.getOffsetFromEmptyCell(cell);
        if(offset.row !== 0 && offset.col !== 0) return false; // no rows or columns overlap
        options["axis"] =  offset.row !== 0 ? 'y' : 'x'; // if there is a row offset move on the y axis only if column on the x only

        var position = this.domPosition(cell);
        // apply containment to restrict movement [x1, y1, x2, y2]
        if (offset.row + offset.col > 0)  options["containment"] = [position.left, position.top, position.left + this.elementWidth, position.top + this.elementHeight];
        else options["containment"] = [position.left - this.elementWidth, position.top - this.elementHeight, position.left, position.top];
        
        this.puzzleDragGroup = this.cellsInRangeToEmptyCell(cell); // get all the elements to be dragged
      }.bind(this),
      drag: function(event) {
        for(var i = 1; i < this.puzzleDragGroup.range.length; i++) { // skip self element at position 0
          cell = this.puzzleDragGroup.range[i];
          var el = this.matrix.get(cell);
          var position = this.domPosition(cell);
          if(options['axis'] === 'y') el.style.top = position.top + (parseInt(event.target.style.top) - originalPosition.top) + 'px';
          else el.style.left = position.left + (parseInt(event.target.style.left) - originalPosition.left) +'px';
        }
      }.bind(this),
      stop: function(event) {
        var noMove = parseInt(event.target.style.left) === originalPosition.left && parseInt(event.target.style.top) === originalPosition.top;
        var pastMidway = Math.abs(parseInt(event.target.style.left) - originalPosition.left) > this.elementWidth / 2 || Math.abs(parseInt(event.target.style.top) - originalPosition.top) > this.elementHeight / 2;
        if(noMove || pastMidway) {// if there was no movement treat it as a click event
          this.move(this.puzzleDragGroup);
          this.puzzleDragGroup = null;
        }
        else
          this.puzzleDragGroup.range.forEach(function(cell) { // send elements back to their original position
            this.animateMove(cell, cell);
          }.bind(this))
      }.bind(this)
    }
    drag(event.target, event, options);
   }

  if (document.addEventListener) {
    el.addEventListener('touchstart', dragMe.bind(this));
    el.addEventListener('mousedown', dragMe.bind(this));
  }
  else {
    el.attachEvent('touchstart', dragMe.bind(this)); 
    el.attachEvent('mousedown', dragMe.bind(this));
  } // for IE
  return el;
}

Puzzle.prototype.onclick = function(e) {
  alert('click' + ' dragging:' + this.dragging)
  if(!this.dragging) this.moveToEmptySpace(this.elementToCell(e.target));
  this.dragging = false;
}

Puzzle.prototype.moveToEmptySpace = function(cell) {
  this.move(this.cellsInRangeToEmptyCell(cell)); // only one row to move
}

Puzzle.prototype.getOffsetFromEmptyCell = function(cell) {
  var emptyCell = this.matrix.emptyCell();
  var offset = {row:0, col:0};
  if (emptyCell.row !== cell.row ) offset.row = emptyCell.row < cell.row? -1 : 1; // down: -1 up: 1
  if ( emptyCell.col !== cell.col ) offset.col = emptyCell.col < cell.col? -1 : 1;
  return offset;
}

Puzzle.prototype.animateMove = function(cell, targetCell) {
  var elementToMove = this.matrix.get(cell);
  var position = this.domPosition(targetCell);
  slide(elementToMove, 150, position.top, position.left, function() {alert('done')});
}

Puzzle.prototype.move = function(action) {
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
  if(offset.row !== 0 && offset.col !== 0) return; // if both row and column are offset from empty cell no move is required

  var emptyCell = this.matrix.emptyCell();
  var cellsToMove = [];
  while( cell.row != emptyCell.row || cell.col != emptyCell.col) {
    cellsToMove.push(jQuery.extend(true, {}, cell));
    cell.row += offset.row;
    cell.col += offset.col;
  }
  return {range: cellsToMove, offset: offset};
}

Puzzle.prototype.domPosition = function(cell) {
  return {top: cell.row * (this.elementHeight + this.borderWidth * 2), left: cell.col * (this.elementWidth + this.borderWidth * 2)}
}

Puzzle.prototype.elementToCell = function(el) {
  var cell = $.parseJSON($(el).attr('puzzle_cell'));
  return cell;
}

function Matrix (dimension) {
  //private
  var elements = [];
  var emptyCell = {col: dimension - 1, row: dimension - 1}; // defaults to the last cell in the matrix
  this.set = function(cell, element) {
    if(!elements[cell.row]) elements[cell.row] = [];        //if an array for that row doesn't exist create a new array
    elements[cell.row][cell.col] = element;
    var cellStr = '{"row":' + cell.row + ',"col":' + cell.col + '}';
    $(element).attr("puzzle_cell", cellStr);                // add row column number
  }  
  this.get = function(cell) { return elements[cell.row][cell.col] };
  this.emptyCell = function() { return emptyCell; }

  this.swap = function(cellA) {
    var elA = this.get(cellA);
    this.set(cellA, null);
    this.set(emptyCell, elA);
    emptyCell = cellA;
  }
  
  this.isEmptyCell = function(cell) {
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

// this was added to support Safari
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

function slide(element, duration, newTop, newLeft, oncomplete) {
  var start = new Date();
  var originalPosition = { top: parseInt(element.style.top), left: parseInt(element.style.left)};
  
  animate();

  function animate() {
    var elapsed = (new Date()) - start;
    var complete = elapsed / duration;
    if(complete >= 1) {
      element.style.left = newLeft + 'px';
      element.style.top = newTop + 'px';
      if(oncomplete) oncomplete;
    return;
    }
    
    element.style.left = ( newLeft - originalPosition.left ) * complete + originalPosition.left + 'px';
    element.style.top = ( newTop - originalPosition.top ) * complete + originalPosition.top + 'px';
    setTimeout(animate, 16);
  }
}