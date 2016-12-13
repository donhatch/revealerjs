// Attempt at easer-to-use less-buggy more versatile
// image revealer.
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

"use strict";
// First attempt.  Kinda works but limited.
let setUpRevealer = function(container) {
  let verboseLevel = 0;
  if (verboseLevel >= 1) console.log("    in setUpRevealer(container=",container,")");
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
  if (verboseLevel >= 1) console.log("    out setUpRevealer(container=",container,")");
};  // setUpRevealer
