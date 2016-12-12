// Attempt at easer-to-use less-buggy more versatile
// image revealer.
//
// Requirements:
//      - Must be able to put a google map (or similar) inside the left or right side.
//        This means we can't be messing with the element's width&height,
//        since the element's children may be tracking the width and re-laying themselves out based on it.
//        Therefore we mess with the children's clip regions instead.
//      - Must be able to have, e.g. 3 images side by side.
//      - Must be able to have, e.g. 4 images like a window pane.
//        - Do they push each other around? Should they be able to move each other? Hmm.
// Oh!  Is this just a clip inset dragger?  Yeah I think so!
//
// If using class hints, could be:
//   <div class="revealer-container">
//     <img class="revealer-child-W">
//     <img class="revealer-child-E">
//   </div>
//   <div class="revealer-container">
//     <img class="revealer-child-NW">
//     <img class="revealer-child-NE">
//     <img class="revealer-child-SW">
//     <img class="revealer-child-SE">
//   </div>
//
// If using clip insets, could be:
//   <div class="revealer-container">
//     <img src="1.png" style="clip-path:rect(0,67%,33%,100)">
//     <img src="2.png" style="clip-path:rect(0,33%,33%,67%)">
//     <img src="3.png" style="clip-path:rect(0,0%,33%,33%)">
//     <img src="4.png" style="clip-path:rect(33%,67%,67%,100)">
//     <img src="5.png" style="clip-path:rect(33%,33%,67%,67%)">
//     <img src="6.png" style="clip-path:rect(33%,0%,67%,33%)">
//     <img src="7.png" style="clip-path:rect(67%,67%,100%,100)">
//     <img src="8.png" style="clip-path:rect(67%,33%,100%,67%)">
//     <img src="9.png" style="clip-path:rect(67%,0%,100%,33%)">
//   </div>
//
//
// References:
//   http://www.hongkiat.com/blog/js-image-comparison-sliders/ "5 free image comparison sliders"
//   http://bennettfeely.com/clippy/
//   https://www.smashingmagazine.com/2015/05/creating-responsive-shapes-with-clip-path/
//   https://css-tricks.com/almanac/properties/c/clip/
//   https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path
//
//   This is the first one I found, it looks slick but a bit old
//   and only works on imgs:
//     http://www.catchmyfame.com/2009/06/25/jquery-beforeafter-plugin/
//     http://www.catchmyfame.com/jquery/demo/8/
//   (hmm, actually the ones on the demo page work better than
//   the one in the article)
//
//   Jotform has a nice one, but with several bugs and limitations:
//     https://stories.jotform.com/making-a-responsive-image-comparison-slider-in-css-and-javascript-f3a691a9dd71
//     http://codepen.io/bamf/pen/jEpxOX
//



"use strict";
let setUpRevealer = function(container) {
  let verboseLevel = 0;
  if (verboseLevel >= 1) console.log("    in setupRevealer(container=",container,")");
  let handles = container.getElementsByClassName("revealer-handle");
  if (handles.length == 1) {
    if (verboseLevel >= 1) console.log("      handles=",handles);
    let handle = handles[0];

    // XXX TODO: handle and sanity check all cases:
    //        W E
    //        N S
    //        NW NE S
    //        SE SW N
    //        NW SW E
    //        NE SE W
    //        NW NE SW SE
    let childN = container.getElementsByClassName("revealer-child-N")[0];
    let childS = container.getElementsByClassName("revealer-child-S")[0];
    let childW = container.getElementsByClassName("revealer-child-W")[0];
    let childE = container.getElementsByClassName("revealer-child-E")[0];
    let childNW = container.getElementsByClassName("revealer-child-NW")[0];
    let childSW = container.getElementsByClassName("revealer-child-SW")[0];
    let childNE = container.getElementsByClassName("revealer-child-NE")[0];
    let childSE = container.getElementsByClassName("revealer-child-SE")[0];

    handle.addEventListener("mousedown", event => {
      let verboseLevel = 0;
      if (verboseLevel >= 1) console.log("        in mousedown");
      if (verboseLevel >= 1) console.log("          event=",event);
      // there are a bunch of X,Y's, apparently clientX,clientY are the only portable reliable ones.
      let x_on_mousedown = event.clientX;
      let y_on_mousedown = event.clientY;
      let x = x_on_mousedown;
      let y = y_on_mousedown;
      let handle_left_on_mousedown = getComputedStyle(handle, null).left; // in pixels unfortunately
      if (verboseLevel >= 1) console.log("          handle_left_on_mousedown = ",handle_left_on_mousedown);
      if (!handle_left_on_mousedown.endsWith('px')) {
        throw new Error("Expected style to end in 'px', got "+JSON.stringify(handle_left_on_mousedown));
      }
      let handle_left_pixels_on_mousedown = parseFloat(handle_left_on_mousedown); /* trailing 'px' ignored per doc */
      if (verboseLevel >= 1) console.log("          handle_left_pixels_on_mousedown = ",handle_left_pixels_on_mousedown);
      // TODO: look into possibly using getBoundingClientRect() or getClientRects()
      let container_width_on_mousedown = container.offsetWidth;
      if (verboseLevel >= 1) console.log("          container_width_on_mousedown = ",container_width_on_mousedown);
      let handle_left_percentage_on_mousedown = handle_left_pixels_on_mousedown / container_width_on_mousedown * 100;
      if (verboseLevel >= 1) console.log("          handle_left_percentage_on_mousedown = ",handle_left_percentage_on_mousedown);
      // Add mousemove and mouseup handlers to document,
      // not to handle element
      // (or even to to handle's ancestors, which is what jotform's does).
      // That makes sure we see the events even if outside the element
      // (even if outside the window).
      // In particular, we'll see the mouseup even if it's outside the element
      // (even outside the window), thereboy avoiding a common type of bug
      // in which we get into a state where we think the mouse is down when it isn't.
      // removeEventListener requires named functions, not anonymous...
      let mousemove = function(event) {
        let verboseLevel = 0;
        if (verboseLevel >= 2) console.log("            in mousemove");

        //console.log("              event=",event);
        let Dx = event.clientX - x_on_mousedown;
        let Dy = event.clientY - y_on_mousedown;
        let dx = event.clientX - x;
        let dy = event.clientY - y;
        x = event.clientX;
        y = event.clientY;
        if (verboseLevel >= 1) console.log("              button = ",event.button);
        if (verboseLevel >= 1) console.log("              buttons = ",event.buttons);
        if (verboseLevel >= 1) console.log("              dx,y = "+dx+","+dy+"  Dx,y = "+Dx+","+Dy+"  x,y="+x+","+y);

        // Make sure a button is still down.
        // If not, abort the manipulation.
        // This prevents various screwups in which the mouseup gets lost
        // (e.g. bringing up menu, initiating drag on images, ...)
        if (event.buttons === 0) {
          console.log("              HEY! mouse button not down any more!  aborting manipulation");
          document.removeEventListener("mousemove", mousemove);
          document.removeEventListener("mouseup", mouseup);
          return;
        }


        if (dx != 0) {
          // Compute new percentage.
          let new_left_pixels = handle_left_pixels_on_mousedown + Dx;
          if (verboseLevel >= 1) console.log("                  new_left_pixels = "+new_left_pixels);
          let new_left_percentage = new_left_pixels / container_width_on_mousedown * 100;
          if (verboseLevel >= 1) console.log("                  new_left_percentage = "+new_left_percentage);
          // Clamp new percentage to [0,100].
          let clamp = (x,a,b) => x<=a?a:x>=b?b:x;
          new_left_percentage = clamp(new_left_percentage, 0, 100);
          if (verboseLevel >= 1) console.log("                  new_left_percentage = "+new_left_percentage+" (clamped)");


          // Set the following to it, in percentage rather than pixels
          // (for graceful behavior on resize):
          //   - handle's left
          //   - child-W's clip inset right
          //   - child-E's clip inset left
          // etc.
          let freeNS = !(childE !== undefined && childW !== undefined); // it's only non-free in that one configuration
          let freeEW = !(childN !== undefined && childN !== undefined); // it's only non-free in that one configuration
          if (freeEW) handle.style.left = new_left_percentage+'%';
          if (freeNS) handle.style.top = new_top_percentage+'%';

          if (childN !== undefined) childN.style.clipPath = "inset(0 0 "+(100-new_top_percentage)+"% 0)";
          if (childE !== undefined) childE.style.clipPath = "inset(0 0 0 "+new_left_percentage+"%)";
          if (childS !== undefined) childS.style.clipPath = "inset("+new_top_percentage+"%) 0 0 0)";
          if (childW !== undefined) childW.style.clipPath = "inset(0 "+(100-new_left_percentage)+"% 0 0)";
          if (childNW !== undefined) childNW.style.clipPath = "inset(0 "+(100-new_left_percentage)+"% "+(100-new_top_percentage)+"% 0)";
          if (childSE !== undefined) childSE.style.clipPath = "inset("+new_top_percentage+"%) 0 0 "+new_left_percentage+"%)";
          if (childSW !== undefined) childSW.style.clipPath = "inset("+new_top_percentage+"%) "+(100-new_left_percentage)+"% 0 0)";
          if (childNE !== undefined) childNE.style.clipPath = "inset(0 0 "+(100-new_top_percentage)+"% "+new_left_percentage+"%)";
        }

        if (verboseLevel >= 2) console.log("            out mousemove");
      };
      let mouseup = function(event) {
        if (verboseLevel >= 1) console.log("        in mouseup(event=",event,")");
        document.removeEventListener("mousemove", mousemove);
        document.removeEventListener("mouseup", mouseup);
        if (verboseLevel >= 1) console.log("        out mouseup(event=",event,")");
      };
      document.addEventListener("mousemove", mousemove);
      document.addEventListener("mouseup", mouseup);
      if (verboseLevel >= 1) console.log("        out mousedown");
    });
  } // if handles.length == 1
  if (verboseLevel >= 1) console.log("    out setupRevealer(container=",container,")");
};  // setUpRevealer


let setUpClipInsetDragger = function(container) {
  let verboseLevel = 1;
  if (verboseLevel >= 1) console.log("    in setUpClipInsetDragger(container=",container,")");
  // the "dragger object", for purposes of later tear-down
  let mousedown = function(event) {
    let verboseLevel = 1;
    if (verboseLevel >= 1) console.log("        in mousedown");
    if (verboseLevel >= 1) console.log("          event=",event);

    let containerClientRect = container.getBoundingClientRect();
    if (verboseLevel >= 1) console.log("          containerClientRect=",containerClientRect);

    // E.g. 'inset(0px 33% 67%)' -> ['0px', '33%', '67%', '33%']
    let parseClipPathInset = clipPath => {
      let verboseLevel = 0;
      if (verboseLevel >= 1) console.log("                in parseClipPathInset("+JSON.stringify(clipPath)+")");
      if (!(clipPath.startsWith('inset(') && clipPath.endsWith(')'))) {
          throw new Error("unrecognized clip path "+JSON.stringify(clipPath));
      }
      let clipPathParamsString = clipPath.slice(6, -1);
      if (verboseLevel >= 1) console.log("                  clipPathParams=",clipPathParamsString);
      let tokens = clipPathParamsString.split(/ +/);
      if (verboseLevel >= 1) console.log("                  tokens=",tokens);
      // expand shorthand so 4 tokens
      if (!(tokens.length >= 1 && tokens.length <= 4)) {
          throw new Error("Unexpected number of tokens "+tokens.length+" in inset in clip-path "+JSON.stringify(clipPath));
      }
      if (tokens.length == 1) tokens.push(tokens[0]); // right = top if not given
      if (tokens.length == 2) tokens.push(tokens[0]); // bottom = top if not given
      if (tokens.length == 3) tokens.push(tokens[1]); // left = right if not given
      if (verboseLevel >= 1) console.log("                  tokens=",tokens," (after expanding shorthand)");
      console.assert(tokens.length == 4);
      if (verboseLevel >= 1) console.log("                out parseClipPathInset("+JSON.stringify(clipPath)+"), returning tokens="+JSON.stringify(tokens));
      return tokens;
    }; // parseClipPathInset

    // Figure out what inset borders we're dragging if anything.
    let childClientClipRects = [];
    for (let child of container.children) {
      if (verboseLevel >= 1) console.log("              child=",child);
      if (verboseLevel >= 1) console.log("                  child.style.clipPath=",child.style.clipPath);
      let clipPath = child.style.clipPath;
      if (clipPath === "") continue;
      let tokens = parseClipPathInset(clipPath);
      let childClientRect = child.getBoundingClientRect();
      if (verboseLevel >= 1) console.log("                  childClientRect=",childClientRect);

      // Figure out child clip rect, in client coords.
      let childClientClipRect;
      {
        let insetEntryToPixels = (token,widthOrHeight) => {
          if (token.endsWith('px'))
            return parseFloat(token);
          else if (token.endsWith('%')) {
            return parseFloat(token)*widthOrHeight/100;
          } else if (token === '0') {
            // I haven't observed this to happen when extracted via child.style.clipPath,
            // but it might if extracted in other ways
            return 0;
          } else {
            throw new Error('unexpected token '+JSON.stringify(token)+' in clip path inset');
          }
        };
        let childClipTop = insetEntryToPixels(tokens[0], childClientRect.height);
        let childClipRight = childClientRect.width - insetEntryToPixels(tokens[1], childClientRect.width);
        let childClipBottom = childClientRect.height - insetEntryToPixels(tokens[2], childClientRect.height);
        let childClipLeft = insetEntryToPixels(tokens[3], childClientRect.width);
        // Put them into client coords
        childClipTop += childClientRect.top;
        childClipRight += childClientRect.left;
        childClipBottom += childClientRect.top;
        childClipLeft += childClientRect.left;
        childClientClipRect = {
          top:childClipTop,
          right:childClipRight,
          bottom:childClipBottom,
          left:childClipLeft,
        };
      }
      if (verboseLevel >= 1) console.log("                  childClientClipRect=",childClientClipRect);
      childClientClipRects.push(childClientClipRect);
    } // for each child
    if (verboseLevel >= 1) console.log("              childClientClipRects=",childClientClipRects);
    if (verboseLevel >= 1) console.log("              childClientClipRects=",JSON.stringify(childClientClipRects));

    // Which one(s) should I drag?
    // Find closest horizontal edge and closest vertical edge.
    let draggingSpecs; // tuples [childIndex,whichSide,value]
    {
      let thresholdPixels = 8; // TODO: make this configurable I think?
      let closestDistX = Infinity;
      let closestDistY = Infinity;
      let closestSpecsX = [];
      let closestSpecsY = [];
      let mouseX = event.clientX;
      let mouseY = event.clientY;
      let nChildren = childClientClipRects.length;
      // have to use fuzzy equality since positions don't match exactly when calculated from different sides
      let LEQ = (a,b,tol) => a-b <= tol;
      let LT = (a,b,tol) => b-a > tol;
      for (let iChild = 0; iChild < nChildren; ++iChild) {
        console.log("iChild="+iChild);
        let childClientClipRect = childClientClipRects[iChild];
        for (let whichSide of ['top','right','bottom','left']) {
          if (childClientClipRect[whichSide] != containerClientRect[whichSide]) {
            // awkward...
            if (whichSide==='left'||whichSide==='right') {
              let distX = Math.abs(mouseX - childClientClipRect[whichSide]);
              if (distX <= thresholdPixels && LEQ(distX, closestDistX, 1e-9)) {
                if (LT(distX, closestDistX, 1e-9)) { closestDistX = distX; closestSpecsX.length = 0; }
                closestSpecsX.push([iChild, whichSide, childClientClipRect[whichSide]]);
              }
            } else {
              let distY = Math.abs(mouseY - childClientClipRect[whichSide]);
              if (distY <= thresholdPixels && LEQ(distY, closestDistY, 1e-9)) {
                if (LT(distY, closestDistY, 1e-9)) { closestDistY = distY; closestSpecsY.length = 0; }
                closestSpecsY.push([iChild, whichSide, childClientClipRect[whichSide]]);
              }
            }
          }
        }
      }
      draggingSpecs = closestSpecsX.concat(closestSpecsY);
    }
    if (verboseLevel >= 1) console.log("              draggingSpecs=",JSON.stringify(draggingSpecs));
    if (draggingSpecs.length > 0) {
      // Start dragging them!
      let x_on_mousedown = event.clientX;
      let y_on_mousedown = event.clientY;

      let clamp = (x,a,b) => x<=a?a:x>=b?b:x;

      let mousemove = function(event) {
        let verboseLevel = 1;
        if (verboseLevel >= 1) console.log("            in mousemove");
        if (verboseLevel >= 1) console.log("              event=",event);

        // Make sure a button is still down.
        // If not, abort the manipulation.
        // This prevents various screwups in which the mouseup gets lost
        // (e.g. bringing up menu, initiating drag on images, ...)
        if (event.buttons === 0) {
          console.log("              HEY! mouse button not down any more!  aborting manipulation");
          document.removeEventListener("mousemove", mousemove);
          document.removeEventListener("mouseup", mouseup);
          return;
        }

        let x = event.clientX;
        let y = event.clientY;

        // Clamp to strictly inside the container.
        // This prevents setting an inset to 0 which will stick it to the edge of the container later,
        // due to logic for deciding what to drag,
        // while still keeping lefts and rights stuck together.
        // XXX this still doesn't work reliably. no matter whether fudgePixels is 1 .01 or .001.  figure out why!
        // XXX the automagic is actually bogus.  need to specify via classes maybe?
        //        clip-inset-draggable-N
        //        clip-inset-draggable-S
        //        clip-inset-draggable-E
        //        clip-inset-draggable-W
        //        clip-inset-draggable-NE
        //        clip-inset-draggable-ES
        //        clip-inset-draggable-SW
        //        clip-inset-draggable-WN
        //        clip-inset-draggable-NES
        //        clip-inset-draggable-ESW
        //        clip-inset-draggable-SWN
        //        clip-inset-draggable-WNE
        //        clip-inset-draggable-NESW
        // oh! can do it with a data attibute... https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_data_attributes
        // but is that only html5?  can I use it? hmm I guess it's always possible
        //        data-which-borders-draggable="WNE"
        //        
        {
          let containerClientRect = container.getBoundingClientRect();
          let fudgePixels = 1;
          x = clamp(x, containerClientRect.left+fudgePixels, containerClientRect.right-fudgePixels);
          y = clamp(y, containerClientRect.top+fudgePixels, containerClientRect.bottom-fudgePixels);
        }

        let dx = x - x_on_mousedown;
        let dy = y - y_on_mousedown;

        for (let draggingSpec of draggingSpecs) {
          let iChild = draggingSpec[0];
          let whichSide = draggingSpec[1];
          let position_on_mousedown = draggingSpec[2];
          let desired_position = position_on_mousedown + (whichSide==='left'||whichSide==='right' ? dx : dy);
          if (verboseLevel >= 1) console.log("                  child "+iChild+": "+whichSide+" "+position_on_mousedown+" -> "+desired_position);
          let child = container.children[iChild];
          let childClipPath = child.style.clipPath;
          let tokens = parseClipPathInset(childClipPath);
          let childClientRect = child.getBoundingClientRect();
          let desired_percent = whichSide==='left'||whichSide==='right'
            ? (desired_position-childClientRect.left)/childClientRect.width * 100
            : (desired_position-childClientRect.top)/childClientRect.height * 100;

          if (whichSide==='bottom' || whichSide==='right') {
            desired_percent = 100 - desired_percent;
          }

          tokens[whichSide==='top'?0:whichSide==='right'?1:whichSide==='bottom'?2:whichSide==='left'?3:console.assert(false)] = desired_percent+'%';
          if (verboseLevel >= 1) console.log("                      desired_percent="+desired_percent);
          child.style.clipPath = 'inset(' + tokens.join(' ') + ')';
        }
        if (verboseLevel >= 1) console.log("            out mousemove");
      };
      let mouseup = function(event) {
        let verboseLevel = 1;
        if (verboseLevel >= 1) console.log("        in mouseup");
        if (verboseLevel >= 1) console.log("          event=",event);
        document.removeEventListener("mousemove", mousemove);
        document.removeEventListener("mouseup", mouseup);
        if (verboseLevel >= 1) console.log("        out mouseup");
      };
      document.addEventListener("mousemove", mousemove);
      document.addEventListener("mouseup", mouseup);
    }

    if (verboseLevel >= 1) console.log("        out mousedown");
  }; // mousedown
  container.addEventListener("mousedown", mousedown);
  let answer = {
    container:container,
    mousedown:mousedown,
  };
  if (verboseLevel >= 1) console.log("    out setUpClipInsetDragger(container=",container,")");
  return answer;
};  // setUpClipInsetDragger
let tearDownClipInsetDragger = function(draggerObject) {
  let verboseLevel = 1;
  if (verboseLevel >= 1) console.log("    in tearDownClipInsetDragger(dragger=",dragger,")");
  container.removeEventListener("mousedown", draggerObject.mousedown);
  // TODO: remove any children (probably drag handles) that we added
  if (verboseLevel >= 1) console.log("    out tearDownClipInsetDragger(dragger=",dragger,")");
  return {}; // the "dragger", for purposes of later tear-down
};  // tearDownClipInsetDragger
