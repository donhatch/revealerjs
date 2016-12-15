"use strict";
let tearDownRevealer = function(container) {
  // Remove handles if they exist already.
  // That removes all event handlers on them (I hope).
  let handlesDivs = container.getElementsByClassName("revealer-handles");
  for (let handlesDiv of handlesDivs) {
    if (handlesDiv.parentElement === container) {
      container.removeChild(handlesDiv);
    }
  }
};
let setUpRevealer = function(container) {
  let verboseLevel = 0;
  if (verboseLevel >= 1) console.log("    in setUpRevealer(container=",container,")");

  // any of these 8 may be undefined
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

  // Remove handles if they existed already
  tearDownRevealer(container);

  // Create the handles, depending on what kind of children exist
  let handlesDiv = document.createElement('div');
  handlesDiv.className = "revealer-handles";
  {
    // There are 7 supported configurations. Figure out which one we have.
    let configString = '';
    if (childN  !== undefined) configString += "N ";
    if (childS  !== undefined) configString += "S ";
    if (childW  !== undefined) configString += "W ";
    if (childE  !== undefined) configString += "E ";
    if (childNW !== undefined) configString += "NW ";
    if (childNE !== undefined) configString += "NE ";
    if (childSW !== undefined) configString += "SW ";
    if (childSE !== undefined) configString += "SE ";
    configString = configString.trim();
    if (verboseLevel >= 1) console.log("      configString="+JSON.stringify(configString));
    let configString2HandleClasses = {
      "W E": [ "revealer-handle-EWhair", "revealer-handle-EW"],
      "N S": [ "revealer-handle-NShair", "revealer-handle-NS"],
      "NW NE SW SE": [ "revealer-handle-EWhair", "revealer-handle-NShair", "revealer-handle-bidirectional"],
      "W NE SE": [ "revealer-handle-NShair-E-part-only", "revealer-handle-EWhair", "revealer-handle-bidirectional"],
      "E NW SW": [ "revealer-handle-NShair-W-part-only", "revealer-handle-EWhair", "revealer-handle-bidirectional"],
      "N SW SE": [ "revealer-handle-NShair", "revealer-handle-EWhair-S-part-only", "revealer-handle-bidirectional"],
      "S NW NE": [ "revealer-handle-NShair", "revealer-handle-EWhair-N-part-only", "revealer-handle-bidirectional"],
    };
    let handleClasses = configString2HandleClasses[configString];
    if (handleClasses === undefined) {
      throw new Error("setupRevealer called on container with child config "+JSON.stringify(configString)+" which is not one of the 7 supported configurations");
    }
    for (let handleClass of handleClasses) {
      let handle = document.createElement('div');
      handle.className = handleClass;
      handlesDiv.appendChild(handle);
    }
    container.appendChild(handlesDiv);
  }

  // any of these 9 may be undefined
  let handleEW = handlesDiv.getElementsByClassName("revealer-handle-EW")[0];
  let handleNS = handlesDiv.getElementsByClassName("revealer-handle-NS")[0];
  let handleBidirectional = handlesDiv.getElementsByClassName("revealer-handle-bidirectional")[0];
  let handleEWhair = handlesDiv.getElementsByClassName("revealer-handle-EWhair")[0];
  let handleNShair = handlesDiv.getElementsByClassName("revealer-handle-NShair")[0];
  let handleEWhairNpartOnly = handlesDiv.getElementsByClassName("revealer-handle-EWhair-N-part-only")[0];
  let handleEWhairSpartOnly = handlesDiv.getElementsByClassName("revealer-handle-EWhair-S-part-only")[0];
  let handleNShairEpartOnly = handlesDiv.getElementsByClassName("revealer-handle-NShair-E-part-only")[0];
  let handleNShairWpartOnly = handlesDiv.getElementsByClassName("revealer-handle-NShair-W-part-only")[0];

  let handlesThatMoveEW;
  let handlesThatMoveNS;
  let handles;
  {
    let removeUndefineds = array=>array.filter(item=>(item!==undefined));
    let handlesEW = removeUndefineds([handleEW,handleEWhair,handleEWhairNpartOnly,handleEWhairSpartOnly]);
    let handlesNS = removeUndefineds([handleNS,handleNShair,handleNShairWpartOnly,handleNShairEpartOnly]);
    handlesThatMoveEW = removeUndefineds(handlesEW.concat([handleBidirectional]));
    handlesThatMoveNS = removeUndefineds(handlesNS.concat([handleBidirectional]));
    handles = removeUndefineds(handlesEW.concat(handlesNS).concat([handleBidirectional]));
  }

  let update = function(new_left_percentage, new_top_percentage, needToUpdateX, needToUpdateY) {
    // Note that all updated values are in percentages rather than pixels,
    // for graceful behavior on resize.
    console.assert(needToUpdateX || needToUpdateY); // caller shouldn't call us otherwise
    if (needToUpdateX) {
      for (let otherHandle of handlesThatMoveEW) {
        otherHandle.style.left = new_left_percentage+'%';
      }
      if (handleNShairWpartOnly !== undefined) handleNShairWpartOnly.style.width = (new_left_percentage)+'%';
      if (handleNShairEpartOnly !== undefined) handleNShairEpartOnly.style.width = (100-new_left_percentage)+'%';
      if (childW !== undefined) childW.style.clipPath = "inset(0 "+(100-new_left_percentage)+"% 0 0)";
      if (childE !== undefined) childE.style.clipPath = "inset(0 0 0 "+new_left_percentage+"%)";
    }
    if (needToUpdateY) {
      for (let otherHandle of handlesThatMoveNS) {
        otherHandle.style.top = new_top_percentage+'%';
      }
      if (handleEWhairNpartOnly !== undefined) handleEWhairNpartOnly.style.height = (new_top_percentage)+'%';
      if (handleEWhairSpartOnly !== undefined) handleEWhairSpartOnly.style.height = (100-new_top_percentage)+'%';
      if (childN !== undefined) childN.style.clipPath = "inset(0 0 "+(100-new_top_percentage)+"% 0)";
      if (childS !== undefined) childS.style.clipPath = "inset("+new_top_percentage+"% 0 0 0)";
    }
    // The quarter-image children's clips need to be resized on any change in either coord axis.
    if (childNW !== undefined) childNW.style.clipPath = "inset(0 "+(100-new_left_percentage)+"% "+(100-new_top_percentage)+"% 0)";
    if (childSE !== undefined) childSE.style.clipPath = "inset("+new_top_percentage+"% 0 0 "+new_left_percentage+"%)";
    if (childSW !== undefined) childSW.style.clipPath = "inset("+new_top_percentage+"% "+(100-new_left_percentage)+"% 0 0)";
    if (childNE !== undefined) childNE.style.clipPath = "inset(0 0 "+(100-new_top_percentage)+"% "+new_left_percentage+"%)";
  }; // update

  if (true) {
    // Figure out starting left and top percentage.
    // These can be extracted from the childrens' clip paths
    // (either from the style sheet, or from previous interaction with a revealer).

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
    let getPercentage = function(token) {
      if (token.endsWith('%')) return parseFloat(token);
      if (token == '0px') return 0;
      throw new Error('unexpected token '+JSON.stringify(token)+' in clip path inset');
    };

    let left_percentage = 50;
    let top_percentage = 50;
    if (childSE !== undefined && childSE.style.clipPath !== "") {
      let tokens = parseClipPathInset(childSE.style.clipPath);
      top_percentage = getPercentage(tokens[0]);
      left_percentage = getPercentage(tokens[3]);
    } else if (childNW !== undefined && childNW.style.clipPath !== "") {
      let tokens = parseClipPathInset(childNW.style.clipPath);
      left_percentage = 100-getPercentage(tokens[1]);
      top_percentage = 100-getPercentage(tokens[2]);
    } else if (childS !== undefined && childS.style.clipPath !== "") {
      let tokens = parseClipPathInset(childS.style.clipPath);
      top_percentage = getPercentage(tokens[0]);
    } else if (childE !== undefined && childE.style.clipPath !== "") {
      let tokens = parseClipPathInset(childE.style.clipPath);
      left_percentage = getPercentage(tokens[3]);
    }
    if (verboseLevel >= 1) console.log("      starting left_percentage=",left_percentage);
    if (verboseLevel >= 1) console.log("      starting top_percentage=",top_percentage);
    update(left_percentage, top_percentage, true, true);
  }

  if (verboseLevel >= 1) console.log("      handles=",handles);
  for (let handle of handles) {
    if (verboseLevel >= 1) console.log("          handle=",handle);

    let handleIsFreeToMoveNS = handlesThatMoveNS.indexOf(handle) != -1;
    let handleIsFreeToMoveEW = handlesThatMoveEW.indexOf(handle) != -1;

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

      // Woops! That's wrong when handle is restricted to one direction, in which case its other-direction coordinate
      // is locked to 50%.  But in that case there's generally a bidirectional handle whose position is suitable
      // for everything.  In fact, *whenever* there's a bidirectional handle, its position is suitable for everything,
      // so use it.
      if (handleBidirectional !== undefined) {
        handle_left_on_mousedown = getComputedStyle(handleBidirectional, null).left;
        handle_top_on_mousedown = getComputedStyle(handleBidirectional, null).top;
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

        let needToUpdateX = handleIsFreeToMoveEW && dx!=0;
        let needToUpdateY = handleIsFreeToMoveNS && dy!=0;

        if (needToUpdateX || needToUpdateY) {

          // Compute new percentages.
          let new_left_percentage;
          let new_top_percentage;
          if (handleIsFreeToMoveEW) {
            let new_left_pixels = handle_left_pixels_on_mousedown + Dx;
            if (verboseLevel >= 1) console.log("                  new_left_pixels = "+new_left_pixels);
            new_left_percentage = new_left_pixels / container_width_on_mousedown * 100;
            if (verboseLevel >= 1) console.log("                  new_left_percentage = "+new_left_percentage);
          } else {
            new_left_percentage = handle_left_percentage_on_mousedown;
          }
          if (handleIsFreeToMoveNS) {
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

          update(new_left_percentage, new_top_percentage, needToUpdateX, needToUpdateY);
        } // if mouse actually moved a nonzero amount in a free direction

        // I don't really understand preventDefault() and stopPropagation(),
        // but, empirically, preventDefault is good because it prevents
        // crazy selecting-random-things behavior when dragging outside the container.
        // It also makes it so I don't have to say user-select:none for descendents of the container!  Hooray!
        // Also don't need user-drag:none, nor draggable="false" on images
        // (unless I want that for other reasons).
        event.preventDefault();

        if (verboseLevel >= 2) console.log("            out mousemove");
      }; // mousemove
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
  } // for each handle
  if (verboseLevel >= 1) console.log("    out setUpRevealer(container=",container,")");
};  // setUpRevealer
