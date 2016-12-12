// Attempt at easer-to-use less-buggy more versatile
// image revealer.
//
// Requirements:
//      - Must be able to put a google map (or similar) inside the left or right side.
//        This means we can't be messing with the element's width,
//        since the element's children may be tracking the width and re-laying themselves out based on it.
//        Therefore we mess with the element's clip region instead.
// Idea #1:
//      - There's a container div.
//      - It has any number of children (typicaly img elements,
//        but not necessarily). Each child has a clip window into it.
//        Typical configuratons:
//          - clip window into left image, abutting clip window into right image
//          - clip window into left image,
//            on top of right image which covers whole div
//          - 4 images, whose clip windows are NW, NW, SE, SW of a movable point
//            somewhere in the container
// Idea #2:
//      Should be ability to have more than one handle, e.g.
//      should be able to wipe 3 images side by side.
//      Handles should restrict/push each other around.
//        - E.g. with 2 handles separating 3 side-by-side images, possible
//          behaviors for L handle are:
//            - restricted by R handle
//            - pushes R handle when close enough to it
//              - if so, whether R comes back to start when L retreats
//            - (esoteric) pulls R handle when far enough from it
//              - if so, whether R comes back to start when L reverses
//      Seems complicated :-(  Maybe simpler if I leave out possibility
//      of pulling.
//
// Structure could be something like this:
//   <div class="revealer_container">
//     <img class="revealer_child_NW">
//     <img class="revealer_child_NE">
//     <img class="revealer_child_SW">
//     <img class="revealer_child_SE">
//   </div>
//
// Or, for more raw control, each child could specify its clip region:
// could be inset, could be rect, could be polygon...
// Hmm, I think if clip region is svg, can maybe manipulate an xform on it?  That might be a nice
// general way to do this, at least if only 1 handle.
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



