// BUG: in example html, the 1234 example has text cursor but the 123456789 example has pointer cursor! why?

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
let setUpClipInsetDragger = function(container) {
  let verboseLevel = 1;
  if (verboseLevel >= 1) console.log("    in setUpClipInsetDragger(container=",container,")");

  //=============================================
  // Utility functions.
  //
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
  // End of utility functions.
  //=============================================


  // Make a list of which things are draggable.
  let draggableThings = [];
  {
    for (let iChild = 0; iChild < container.children.length; ++iChild) {
      console.log("          iChild="+iChild);
      let child = container.children[iChild];
      let whichChildBorderLettersAreDraggable = child.dataset.draggable; // child's "data-draggable" attribute
      if (whichChildBorderLettersAreDraggable !== undefined) {
        console.log("              whichChildBorderLettersAreDraggable="+whichChildBorderLettersAreDraggable);
        for (let whichSideLetter of whichChildBorderLettersAreDraggable) {
          let whichSide = {'T':'top', 'R':'right', 'B':'bottom', 'L':'left'}[whichSideLetter];
          if (whichSide === undefined) {
            throw new Error("unrecognized side letter "+JSON.stringify(whichSideLetter)+" in data-draggable attr "+JSON.stringify(whichChildBordersAreDraggable));
          }
          draggableThings.push([iChild,whichSide]);
        }
      }
    }
  }
  console.log("      draggableThings = ",JSON.stringify(draggableThings));

  // Figure out child clip rect, in client coords.
  let getAllChildClientClipRects = function(container) {
    let childClientClipRects = [];
    for (let child of container.children) {
      let clipPath = child.style.clipPath;
      if (clipPath === "") continue;
      let tokens = parseClipPathInset(clipPath);
      let childClientRect = child.getBoundingClientRect();



      let childClipTop = insetEntryToPixels(tokens[0], childClientRect.height);
      let childClipRight = childClientRect.width - insetEntryToPixels(tokens[1], childClientRect.width);
      let childClipBottom = childClientRect.height - insetEntryToPixels(tokens[2], childClientRect.height);
      let childClipLeft = insetEntryToPixels(tokens[3], childClientRect.width);
      // Put them into client coords
      childClipTop += childClientRect.top;
      childClipRight += childClientRect.left;
      childClipBottom += childClientRect.top;
      childClipLeft += childClientRect.left;
      let childClientClipRect = {
        top:childClipTop,
        right:childClipRight,
        bottom:childClipBottom,
        left:childClipLeft,
      };
      childClientClipRects.push(childClientClipRect);
    }
    return childClientClipRects;
  }; // getAllChildClientClipRects

  let childClientClipRects = getAllChildClientClipRects(container);

  // Gather the draggable sides of the child insets
  // into equiv classes of equiv classes.
  // The tightest equivalence is when two border edges coincide (at most 2 in these equiv classes);
  // the second tightest is when they are collinear.
  // E.e. in the 12345679 example, the structure would be:
  //    [
  //      [[1R,2L],[4R,5L],[7R,8L]],
  //      [[2R,3L],[5R,6L],[8R,9L]],
  //      [[1B,4T],[2B,5T],[3B,6T]],
  //      [[4B,7T],[5B,8T],[6B,9T]],
  //    ]
  // (where 1R is shorthand for [0,'right']).
  // and in the 1234 example, the structure would be:
  //    [
  //      [[1R,2L],[3R,4L]],
  //      [[1B,3T],[2B,4T]],
  //    ]
  // QUADRATIC ALERT: this takes quadratic time.
  let equivalenceHierarchy = [];

  for (let draggableThing of draggableThings) {
    let iChild = draggableThing[0];
    let whichSide = draggableThing[1];
  }


  let equivClasses = []; // XXX get rid of this eventually

  let mousedown = function(event) {

    let verboseLevel = 1;
    if (verboseLevel >= 1) console.log("        in mousedown");
    if (verboseLevel >= 1) console.log("          event=",event);

    let containerClientRect = container.getBoundingClientRect();
    if (verboseLevel >= 1) console.log("          containerClientRect=",containerClientRect);

    // Figure out what inset borders we're dragging if anything.
    let childClientClipRects = [];
    let childWhichBordersAreDraggable = [];
    for (let child of container.children) {
      if (verboseLevel >= 1) console.log("              child=",child);
      if (verboseLevel >= 1) console.log("                  child.style.clipPath=",child.style.clipPath);
      let clipPath = child.style.clipPath;
      if (clipPath === "") continue;
      let tokens = parseClipPathInset(clipPath);
      let childClientRect = child.getBoundingClientRect();
      if (verboseLevel >= 1) console.log("                  childClientRect=",childClientRect);

      // Look at the data-draggable attribute...
      let whichChildBorderLettersAreDraggable = child.dataset.draggable; // data-draggable attribute
      if (verboseLevel >= 1) console.log("                  whichChildBordersAreDraggable="+whichChildBorderLettersAreDraggable);

      // Figure out child clip rect, in client coords.
      let childClientClipRect;
      {
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

      // Figure out which side borders of this child's clip inset are draggable.
      {
        let thisChildWhichBordersAreDraggable = [];
        for (let whichSideLetter of whichChildBorderLettersAreDraggable) {
          let whichSide = {'T':'top', 'R':'right', 'B':'bottom', 'L':'left'}[whichSideLetter];
          if (whichSide === undefined) {
            throw new Error("unrecognized side letter "+JSON.stringify(whichSideLetter)+" in data-draggable attr "+JSON.stringify(whichChildBordersAreDraggable));
          }
          thisChildWhichBordersAreDraggable.push(whichSide);
        }
        childWhichBordersAreDraggable.push(thisChildWhichBordersAreDraggable);
      }

    } // for each child
    if (verboseLevel >= 1) console.log("              childClientClipRects=",childClientClipRects);
    if (verboseLevel >= 1) console.log("              childClientClipRects=",JSON.stringify(childClientClipRects));

    // Which one(s) should I drag?
    // Find closest horizontal edge and closest vertical edge.
    // TODO: should actually only consider edges that come visibly close to the cursor.
    //    e.g. in this setup, should *not* allow selecting directly south of the center:
    //          +---+---+
    //          |   |   |
    //          +---+---+
    //          |       |
    //          +-------+
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
      // have to use fuzzy equality since positions don't match exactly when calculated from different sides.
      // Furthermore I've seen:
      //     189.999994
      //     189.99993999999998
      // that's really different! Wtf? 5e-5 or so.
      // I don't know why it's so bad.   TODO: look into it.
      // So for now, make tol relatively coarse: we'll use 1e-3.
      let LEQ = (a,b,tol) => a-b <= tol;
      let LT = (a,b,tol) => b-a > tol;
      let tol = 1e-3;
      for (let iChild = 0; iChild < nChildren; ++iChild) {
        console.log("iChild="+iChild);
        let childClientClipRect = childClientClipRects[iChild];
        for (let whichSide of childWhichBordersAreDraggable[iChild]) {
          if (whichSide==='left'||whichSide==='right') { // awkward
            let distX = Math.abs(mouseX - childClientClipRect[whichSide]);
            if (distX <= thresholdPixels && LEQ(distX, closestDistX, tol)) {
              if (LT(distX, closestDistX, tol)) { closestDistX = distX; closestSpecsX.length = 0; }
              closestSpecsX.push([iChild, whichSide, childClientClipRect[whichSide]]);
            }
          } else {
            let distY = Math.abs(mouseY - childClientClipRect[whichSide]);
            if (distY <= thresholdPixels && LEQ(distY, closestDistY, tol)) {
              if (LT(distY, closestDistY, tol)) { closestDistY = distY; closestSpecsY.length = 0; }
              closestSpecsY.push([iChild, whichSide, childClientClipRect[whichSide]]);
            }
          }
        }
      }
      draggingSpecs = closestSpecsX.concat(closestSpecsY);

      {
        // Sanity check: whenever two [iChild,whichSide] pairs occur together in closestSpecsX,
        // they *always* occur together forever after.  Likewise for Y.

        // In other words, we have a merge-find data structure.
        // whenever we gather another closestSpecsX (or closestSpecsY),
        // we merge together everything in it.

        // Then in the future, whenever we get a new group,
        // for each item in it, every item equiv to that item must also be in the group.

        // Brain dead merge.
        // If a and/or b does not already occur anywhere, add it.
        let mergeEquivClassesOfItems = function(equivClasses, a, b) {
          console.assert(a !== b);
          let ai = undefined;
          let bi = undefined;
          for (let i = 0; i < equivClasses.length; ++i) {
            for (let j = 0; j < equivClasses[i].length; ++j) {
              if (equivClasses[i][j] === a) ai = i;
              if (equivClasses[i][j] === b) bi = i;
            }
          }
          if (ai === undefined) { ai = equivClasses.length; equivClasses.push([a]); }
          if (bi === undefined) { bi = equivClasses.length; equivClasses.push([b]); }
          if (ai != bi) {
            equivClasses[ai] = equivClasses[ai].concat(equivClasses[bi]);
            equivClasses.splice(bi, 1); // remove [bi]
          }
        };
        // Make sure that for every item that occured previously,
        // if it's in the new equiv class, then everything that occurred with it
        // is also in the new equiv class.
        let sanityCheckNewEquivClass = function(equivClasses, newEquivClass) {
          let arraysAreDisjoint = function(A,B) {
            for (let a of A) if (B.indexOf(a) != -1) return false;
            for (let b of B) if (A.indexOf(b) != -1) return false;
            return true;
          };
          let arrayIsSubsetOf = function(A,B) {
            for (let a of A) if (B.indexOf(a) == -1) return false;
            return true;
          };
          for (let equivClass of equivClasses) {
            // must either be disjoint from the new one, or contained in the new one
            if (!arraysAreDisjoint(equivClass, newEquivClass) && !arrayIsSubsetOf(equivClass, newEquivClass)) {
              throw new Error("Hey! Had equiv class "+JSON.stringify(equivClass)+" but broken up by new equivalence "+JSON.stringify(newEquivClass));
            }
          }
        };
        let addNewEquivClass = function(equivClasses, newEquivClass) {
          // If newEquivClass.length < 2, can ignore it; it's irrelevant.
          for (let i = 1; i < newEquivClass.length; ++i) {
            mergeEquivClassesOfItems(equivClasses, newEquivClass[0], newEquivClass[i]);
          }
        };

        for (let closestSpecsXorY of [closestSpecsX, closestSpecsY]) {
          let newEquivClass = [];
          for (let spec of closestSpecsXorY) {
            newEquivClass.push(spec[0]+'#'+spec[1]);
          }
          sanityCheckNewEquivClass(equivClasses, newEquivClass);
          addNewEquivClass(equivClasses, newEquivClass);
        }
      } // equiv class sanity check stuff
    }

    if (verboseLevel >= 1) console.log("              draggingSpecs=",JSON.stringify(draggingSpecs));
    if (draggingSpecs.length > 0) {
      // Start dragging them!
      let x_on_mousedown = event.clientX;
      let y_on_mousedown = event.clientY;

      let clamp = (x,a,b) => x<=a?a:x>=b?b:x;

      let mousemove = function(event) {
        let verboseLevel = 0;
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

          desired_percent = clamp(desired_percent, 0, 100);

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

        console.log("equivClasses = "+JSON.stringify(equivClasses));
        if (verboseLevel >= 1) console.log("        out mouseup");
      };
      document.addEventListener("mousemove", mousemove);
      document.addEventListener("mouseup", mouseup);
    } // if draggingSpecs.length > 0

      // TODO: very confused about the ghost-drag behavior at the moment.
      //event.preventDefault(); // prevents the default ghost-drag behavior (whether or not we initiated a drag above). XXX not sure we want this.  if there's a map underneath, don't we want to
      // TODO: what about stopPropagation?

      if (verboseLevel >= 1) console.log("        out mousedown");
  }; // mousedown
  container.addEventListener("mousedown", mousedown);

  // the "dragger object", for purposes of later tear-down
  let draggerObject = {
    container:container,
    mousedown:mousedown,
  };
  if (verboseLevel >= 1) console.log("    out setUpClipInsetDragger(container=",container,")");
  return draggerObject;
};  // setUpClipInsetDragger
let tearDownClipInsetDragger = function(draggerObject) {
  let verboseLevel = 1;
  if (verboseLevel >= 1) console.log("    in tearDownClipInsetDragger(dragger=",dragger,")");
  container.removeEventListener("mousedown", draggerObject.mousedown);
  // TODO: remove any children (probably drag handles) that we added
  if (verboseLevel >= 1) console.log("    out tearDownClipInsetDragger(dragger=",dragger,")");
  return {}; // the "dragger", for purposes of later tear-down
};  // tearDownClipInsetDragger
