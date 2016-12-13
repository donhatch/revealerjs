This is an attempt at easer-to-use less-buggy more versatile image revealer, aka before/after slider.
The styling is currently not very versatile though, and everything starts at 50%.

Requirements:
  - must work on arbitrary elements (not just imgs)
  - must be able to put a google map (or similar) inside the left or right side.
        This means we can't be messing with the element's width&height,
        since the element's children may be tracking the element's dimensions and re-laying themselves out based on it.
        Therefore we mess with the children's clip regions instead.
  - must be able to do not just E/W (i.e. side-by-side), but also N/S or NW/NE/SW/SE like a window pane.
  - no jquery, just css and javascript (no, it's not possible to do it in pure css, see Prior Art section below).

Limitations:
  - doesn't use jquery so less likely to work cross-browser
  - probably only works in fairly recent versions of chrome.
    known recent features used:
      - clip-path inset
      - pseudo-elements
      - viewport units, e.g. height="100vw"  (for the example, anyway)

Bugs:
  - in the 3-pane views, the half-hairs don't shrink and expand properly

Usage:
  - see revealerExample.html


Prior art:

   This is the first one I found, it looks slick but a bit old
   and only works on imgs:
     http://www.catchmyfame.com/2009/06/25/jquery-beforeafter-plugin/
     http://www.catchmyfame.com/jquery/demo/8/
   (hmm, actually the ones on the demo page work better than
   the one in the article, e.g. when mouse released outside the container element)

   Here are 5 (actually 8) more:
     http://www.hongkiat.com/blog/js-image-comparison-sliders/ "5 free image comparison sliders"
     http://bennettfeely.com/clippy/
     https://www.smashingmagazine.com/2015/05/creating-responsive-shapes-with-clip-path/
     https://css-tricks.com/almanac/properties/c/clip/
     https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path
   The one in there called "Before after" is from jotform;
   it's nice, but currently has lots of bugs and limitations:
     https://stories.jotform.com/making-a-responsive-image-comparison-slider-in-css-and-javascript-f3a691a9dd71
     http://codepen.io/bamf/pen/jEpxOX

   There's supposedly an example using pure css:
     http://lea.verou.me/2014/07/image-comparison-slider-with-pure-css/
   but, as the jotform article points out, it's highly limited,
   e.g. it's apparently impossible to make it start at 50%
   without introducing other crappy behavior:
     http://stackoverflow.com/questions/38174948/how-do-i-make-this-pure-css-image-comparison-slider-start-at-the-middle#answer-38175340

   This also claims to do it in pure css:
     http://www.cssscript.com/pure-css-image-comparison-slider/
   but it's the demo is non-functional, for me anyway (chrome 55.0.2883.44)
   so I didn't investigate further.
