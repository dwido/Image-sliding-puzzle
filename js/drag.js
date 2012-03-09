/**
 * Drag.js: drag absolutely positioned HTML elements.
 *
 * This module defines a single drag() function that is designed to be called
 * from an onmousedown event handler. Subsequent mousemove events will
 * move the specified element. A mouseup event will terminate the drag.
 * This implementation works with both the standard and IE event models.
 * It requires the getScrollOffsets() function from elsewhere in this book.
 *
 * Arguments:
 *
 *   elementToDrag: the element that received the mousedown event or
 *     some containing element. It must be absolutely positioned. Its
 *     style.left and style.top values will be changed based on the user's
 *     drag.
 *
 *   event: the Event object for the mousedown event.
 **/
function drag(elementToDrag, event, options) {
	if(event.touches && event.touches.length > 1) return; // only drag for one finger on screen
	options = options || {};
	var bTouchMode = event.targetTouches != null; // runs from touch device
	
    // The initial mouse position, converted to document coordinates
    var scroll = getScrollOffsets();  // A utility function from elsewhere
    var startX = (event.clientX || event.targetTouches[0].clientX) + scroll.x;
    var startY = (event.clientY || event.targetTouches[0].clientY)+ scroll.y;

    // The original position (in document coordinates) of the element
    // that is going to be dragged.  Since elementToDrag is absolutely
    // positioned, we assume that its offsetParent is the document body.
    var origX = elementToDrag.offsetLeft;
    var origY = elementToDrag.offsetTop;

    // Compute the distance between the mouse down event and the upper-left
    // corner of the element. We'll maintain this distance as the mouse moves.
    var deltaX = startX - origX;
    var deltaY = startY - origY;

    // Register the event handlers that will respond to the mousemove events
    // and the mouseup event that follow this mousedown event.
    if (document.addEventListener) {  // Standard event model
        // Register capturing event handlers on the document
        document.addEventListener(bTouchMode? "touchmove": "mousemove", moveHandler, true);
        document.addEventListener(bTouchMode? "touchup": "mouseup", upHandler, true);
    }
    else if (document.attachEvent) {  // IE Event Model for IE5-8
        // In the IE event model, we capture events by calling
        // setCapture() on the element to capture them.
        elementToDrag.setCapture();
        elementToDrag.attachEvent(bTouchMode? "touchmove": "onmousemove", moveHandler);
        elementToDrag.attachEvent(bTouchMode? "touchup": "onmouseup", upHandler);
        // Treat loss of mouse capture as a mouseup event.
        elementToDrag.attachEvent("onlosecapture", upHandler);
    }

    // We've handled this event. Don't let anybody else see it.
    if (event.stopPropagation) event.stopPropagation();  // Standard model
    else event.cancelBubble = true;                      // IE

    // Now prevent any default action.
    if (event.preventDefault) event.preventDefault();   // Standard model
    else event.returnValue = false;                     // IE

	if(options.start) options.start(event)
    /**
     * This is the handler that captures mousemove events when an element
     * is being dragged. It is responsible for moving the element.
     **/
    function moveHandler(e) {

        if (!e) e = window.event;  // IE event Model

		if (e.touches && e.touches.length > 1) upHandler(e); //if at any point there are two fingers on screen stop the move
		
        // Move the element to the current mouse position, adjusted by the
        // position of the scrollbars and the offset of the initial click.
        var scroll = getScrollOffsets();
		var newLeft;
        if (options.axis == null || options.axis === 'x')  newLeft = ((e.clientX || event.targetTouches[0].clientX) + scroll.x - deltaX);
		else newLeft = parseFloat(elementToDrag.style.left);
		
		var newTop;
		if (options.axis == null || options.axis === 'y') newTop = ((e.clientY || event.targetTouches[0].clientY) + scroll.y - deltaY);
		else newTop = parseFloat(elementToDrag.style.top);

		//check if new location is in containment
		if(newLeft < options.containment[0] || newLeft > options.containment[2] || newTop < options.containment[1] || newTop > options.containment[2])
			return;
		
		elementToDrag.style.left = newLeft + "px";
		elementToDrag.style.top = newRight + "px";
		//log('{e.clientY: ' + (e.clientY || event.targetTouches[0].pageY)  + ' scroll.y: ' + scroll.y + ' deltaY:' + deltaY + '}')
        // And don't let anyone else see this event.
        if (e.stopPropagation) e.stopPropagation();  // Standard
        else e.cancelBubble = true;                  // IE
		
		if(options.drag) options.drag(e, e.target);
    }
	
    /**
     * This is the handler that captures the final mouseup event that
     * occurs at the end of a drag.
     **/
    function upHandler(e) {
        if (!e) e = window.event;  // IE Event Model

        // Unregister the capturing event handlers.
        if (document.removeEventListener) {  // DOM event model
            document.removeEventListener(bTouchMode? "touchup": "mouseup", upHandler, true);
            document.removeEventListener(bTouchMode? "touchmove": "mousemove", moveHandler, true);
        }
        else if (document.detachEvent) {  // IE 5+ Event Model
            elementToDrag.detachEvent("onlosecapture", upHandler);
            elementToDrag.detachEvent(bTouchMode? "touchup": "onmouseup", upHandler);
            elementToDrag.detachEvent(bTouchMode? "touchmove": "onmousemove", moveHandler);
            elementToDrag.releaseCapture();
        }

        // And don't let the event propagate any further.
        if (e.stopPropagation) e.stopPropagation();  // Standard model
        else e.cancelBubble = true;                  // IE
    }
}

function getScrollOffsets(w) {
	w = w || window;
	
	//this works for all browsers except IE versions 8 and before
	if (w.pageXOffset != null) return {x:w.pageXOffset, y:w.pageYOffset};
	
	//for IE (or any browser in standards mode
	var d = w.document;
	if(document.compatMode == "CSS1Compat")
		return {x: d.documentElement.scrollLeft, y: d.documentElement.scrollTop};
		
	//For browsers in Quirks mode
	return {x: d.body.scrollLeft, y: d.body.scrollTop};
}

function log(message){
	$('#console').html($('#console').html() + "," + message);
}