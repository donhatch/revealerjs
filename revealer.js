"use strict";
// First attempt.  Kinda works but limited.
let setUpRevealer = function(container) {
  let verboseLevel = 0;
  if (verboseLevel >= 1) console.log("    in setUpRevealer(container=",container,")");

  // TODO: handle and sanity check all common configurations:
  //        W E
  //        N S
  //        NW NE S
  //        SE SW N
  //        NW SW E
  //        NE SE W
  //        NW NE SW SE
  let childW = container.getElementsByClassName("revealer-child-W")[0];
  let childE = container.getElementsByClassName("revealer-child-E")[0];
  let childN = container.getElementsByClassName("revealer-child-N")[0];
  let childS = container.getElementsByClassName("revealer-child-S")[0];
  let childNW = container.getElementsByClassName("revealer-child-NW")[0];
  let childNE = container.getElementsByClassName("revealer-child-NE")[0];
  let childSW = container.getElementsByClassName("revealer-child-SW")[0];
  let childSE = container.getElementsByClassName("revealer-child-SE")[0];
  if (verboseLevel >= 1) console.log("      childW = ",childW);
  if (verboseLevel >= 1) console.log("      childE = ",childE);
  if (verboseLevel >= 1) console.log("      childN = ",childN);
  if (verboseLevel >= 1) console.log("      childS = ",childS);
  if (verboseLevel >= 1) console.log("      childNW = ",childNW);
  if (verboseLevel >= 1) console.log("      childNE = ",childNE);
  if (verboseLevel >= 1) console.log("      childSW = ",childSW);
  if (verboseLevel >= 1) console.log("      childSE = ",childSE);


  let toArray = htmlCollection => [].slice.call(htmlCollection);

  let handlesEW = toArray(container.getElementsByClassName("revealer-handle-EW"));
  let handlesNS = toArray(container.getElementsByClassName("revealer-handle-NS"));
  let handlesEWhair = toArray(container.getElementsByClassName("revealer-handle-EWhair"));
  let handlesNShair = toArray(container.getElementsByClassName("revealer-handle-NShair"));
  let handlesBidirectional = toArray(container.getElementsByClassName("revealer-handle-bidirectional"));
  let handles = handlesEW.concat(handlesNS).concat(handlesEWhair).concat(handlesNShair).concat(handlesBidirectional);

  let handlesThatMoveEW = handlesEW.concat(handlesEWhair).concat(handlesBidirectional);
  let handlesThatMoveNS = handlesNS.concat(handlesNShair).concat(handlesBidirectional);

  if (verboseLevel >= 1) console.log("      handles=",handles);
  for (let handle of handles) {
    if (verboseLevel >= 1) console.log("          handle=",handle);

    let freeToMoveNS = handlesThatMoveNS.indexOf(handle) != -1;
    let freeToMoveEW = handlesThatMoveEW.indexOf(handle) != -1;

    let mousedown = function(event) {
      let verboseLevel = 0;
      if (verboseLevel >= 1) console.log("        in mousedown");
      if (verboseLevel >= 1) console.log("          event=",event);
      // there are a bunch of X,Y's, apparently clientX,clientY are the only portable reliable ones.
      let x_on_mousedown = event.clientX;
      let y_on_mousedown = event.clientY;
      let x = x_on_mousedown;
      let y = y_on_mousedown;
      let handle_left_on_mousedown = getComputedStyle(handle, null).left; // in pixels unfortunately
      let handle_top_on_mousedown = getComputedStyle(handle, null).top; // in pixels unfortunately

      // Woops! That's wrong when handle is a restricted direction, in which case its other-direction
      // is locked to 50%.  But in that case there's a bidirectional handle whose position is suitable
      // for everything.  In fact, whenever there's a bidirectional handle, its position is suitable for everything.
      if (handlesBidirectional.length > 0) {
        handle_left_on_mousedown = getComputedStyle(handlesBidirectional[0], null).left;
        handle_top_on_mousedown = getComputedStyle(handlesBidirectional[0], null).top;
      }

      if (verboseLevel >= 1) console.log("          handle_left_on_mousedown = ",handle_left_on_mousedown);
      if (!handle_left_on_mousedown.endsWith('px')) {
        throw new Error("Expected style to end in 'px', got "+JSON.stringify(handle_left_on_mousedown));
      }
      if (!handle_top_on_mousedown.endsWith('px')) {
        throw new Error("Expected style to end in 'px', got "+JSON.stringify(handle_top_on_mousedown));
      }
      let handle_left_pixels_on_mousedown = parseFloat(handle_left_on_mousedown); /* trailing 'px' ignored per doc */
      let handle_top_pixels_on_mousedown = parseFloat(handle_top_on_mousedown); /* trailing 'px' ignored per doc */
      if (verboseLevel >= 1) console.log("          handle_left_pixels_on_mousedown = ",handle_left_pixels_on_mousedown);
      if (verboseLevel >= 1) console.log("          handle_top_pixels_on_mousedown = ",handle_top_pixels_on_mousedown);
      // TODO: look into possibly using getBoundingClientRect() or getClientRects()? although offsetWidth seems fine.  OH WAIT-- offsetWidth includes the border, we don't want that, do we??
      let container_width_on_mousedown = container.offsetWidth;
      let container_height_on_mousedown = container.offsetHeight;
      if (verboseLevel >= 1) console.log("          container_width_on_mousedown = ",container_width_on_mousedown);
      if (verboseLevel >= 1) console.log("          container_height_on_mousedown = ",container_height_on_mousedown);
      let handle_left_percentage_on_mousedown = handle_left_pixels_on_mousedown / container_width_on_mousedown * 100;
      let handle_top_percentage_on_mousedown = handle_top_pixels_on_mousedown / container_height_on_mousedown * 100;
      if (verboseLevel >= 1) console.log("          handle_left_percentage_on_mousedown = ",handle_left_percentage_on_mousedown);
      if (verboseLevel >= 1) console.log("          handle_top_percentage_on_mousedown = ",handle_top_percentage_on_mousedown);
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

        if ((freeToMoveEW && dx!=0) || (freeToMoveNS && dy!=0)) {

          // Compute new percentages.
          let new_left_percentage;
          let new_top_percentage;
          if (freeToMoveEW) {
            let new_left_pixels = handle_left_pixels_on_mousedown + Dx;
            if (verboseLevel >= 1) console.log("                  new_left_pixels = "+new_left_pixels);
            new_left_percentage = new_left_pixels / container_width_on_mousedown * 100;
            if (verboseLevel >= 1) console.log("                  new_left_percentage = "+new_left_percentage);
          } else {
            new_left_percentage = handle_left_percentage_on_mousedown;
          }
          if (freeToMoveNS) {
            let new_top_pixels = handle_top_pixels_on_mousedown + Dy;
            if (verboseLevel >= 1) console.log("                  new_top_pixels = "+new_top_pixels);
            new_top_percentage = new_top_pixels / container_height_on_mousedown * 100;
            if (verboseLevel >= 1) console.log("                  new_top_percentage = "+new_top_percentage);
          } else {
            new_top_percentage = handle_top_percentage_on_mousedown;
          }

          // Clamp new percentages to [0,100].
          let clamp = (x,a,b) => x<=a?a:x>=b?b:x;
          new_left_percentage = clamp(new_left_percentage, 0, 100);
          new_top_percentage = clamp(new_top_percentage, 0, 100);
          if (verboseLevel >= 1) console.log("                  new_left_percentage = "+new_left_percentage+" (clamped)");
          if (verboseLevel >= 1) console.log("                  new_top_percentage = "+new_top_percentage+" (clamped)");

          //
          // Set the following to it, in percentage rather than pixels
          // (for graceful behavior on resize):
          //   - handle's left
          //   - child-W's clip inset right
          //   - child-E's clip inset left
          // etc.
          //
          if (freeToMoveEW) {
            for (let otherHandle of handlesThatMoveEW) {
              otherHandle.style.left = new_left_percentage+'%';
            }
            if (childW !== undefined) childW.style.clipPath = "inset(0 "+(100-new_left_percentage)+"% 0 0)";
            if (childE !== undefined) childE.style.clipPath = "inset(0 0 0 "+new_left_percentage+"%)";
          }
          if (freeToMoveNS) {
            for (let otherHandle of handlesThatMoveNS) {
              otherHandle.style.top = new_top_percentage+'%';
            }
            if (childN !== undefined) childN.style.clipPath = "inset(0 0 "+(100-new_top_percentage)+"% 0)";
            if (childS !== undefined) childS.style.clipPath = "inset("+new_top_percentage+"% 0 0 0)";
          }

          // The quarter-image children need to be moved even if not-free in one of the directions.
          if (childNW !== undefined) childNW.style.clipPath = "inset(0 "+(100-new_left_percentage)+"% "+(100-new_top_percentage)+"% 0)";
          if (childSE !== undefined) childSE.style.clipPath = "inset("+new_top_percentage+"% 0 0 "+new_left_percentage+"%)";
          if (childSW !== undefined) childSW.style.clipPath = "inset("+new_top_percentage+"% "+(100-new_left_percentage)+"% 0 0)";
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
    };
    handle.addEventListener("mousedown", mousedown);

  } // if handles.length == 1
  if (verboseLevel >= 1) console.log("    out setUpRevealer(container=",container,")");
};  // setUpRevealer
