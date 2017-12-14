/*global Y, document, alert, self, navigator, unescape, URL: true, webkitURL, Blob: true */

YUI.add('acmacs-base', function(Y) {
/**
 * Utility functions, prototypes, YUI and JavaScript extensions for building ACMACS web GUI
 *
 * @module acmacs-base
 * @main acmacs-base
 */


/**
 * Provides the base `ACMACS` object, `WidgetTreeNode`, and extensions to `Base` and `String`.
 *
 * @module acmacs-base
 * @submodule acmacs-base-main
 */

// ------------------------------------------------------------------------
// Y.ACMACS
// ------------------------------------------------------------------------

/**
 * This class provides the namespace and miscellaneous utilities
 * for the ACMACS web application.
 *
 * @class ACMACS
 * @extends Base
 * @static
 */
Y.namespace('ACMACS');

/**
 * Static variable implementing the idea of widget focus. It allows of one of
 * possibly multiple widgets on the page to exclusively own user input.
 *
 * @property {String} selectedMapWidget
 * @private
*/
Y.ACMACS.selectedMapWidget = null;

/**
 * Global configuration settings for ACMACS widgets
 *
 * @property {Profile} profile
 */
Y.ACMACS.profile = new Y.ACMACS.Profile();

/**
 * Stringify an object preserving the order of top-level keys
 *
 * @method stringify
 * @param {Object} o
 * @return String
 */
Y.ACMACS.stringify = function (o) {
  var
    parts = [];

  if (o === undefined) {
    return 'undefined';
  }
  if (o === null) {
    return 'null';
  }
  if (typeof o === 'object') {
    if (Y.Lang.isArray(o)) {
      Y.each(o, function (el) {
        if (typeof el === 'object') {
          parts.push(Y.ACMACS.stringify(el));
        }
        else {
          parts.push(el);
        }
      });
    }
    else { // Object
      Y.each(Y.Object.keys(o).sort(), function (key) {
        if (typeof o[key] === 'object') {
          parts.push(key + ':' + Y.ACMACS.stringify(o[key]));
        }
        else {
          parts.push(key + ':' + o[key]);
        }
      });
    }
    if (Y.Lang.isArray(o)) {
      return '[' + parts.join(',') + ']';
    }
    return '{' + parts.join(',') + '}';
  }

  return o.toString();
};


/**
 * Create a new `SVGPoint` object from two co-ordinates
 *
 * @method newSVGPoint
 * @param {Number} x
 * @param {Number} y
 * @return SVGPoint
 */
Y.ACMACS.newSVGPoint = function (x, y) {
  var p;
  if (!Y.ACMACS.dummySvg) {
    Y.ACMACS.dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  }
  p = Y.ACMACS.dummySvg.createSVGPoint();
  if (x !== undefined) {
    p.x = x;
    p.y = y;
  }
  return p;
};


/**
 * Create a new `SVGMatrix` object from an object containing named matrix co-efficients
 *
 * @method newSVGMatrix
 * @param {Object} arg with properties `a`, `b`, `c`, `d`, `e`, and `f`
 * @return SVGMatrix
 */
Y.ACMACS.newSVGMatrix = function (arg) {
  var m;
  if (!Y.ACMACS.dummySvg) {
    Y.ACMACS.dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  }
  m = Y.ACMACS.dummySvg.createSVGMatrix();
  if (arg !== undefined) {
    m.a = arg.a;
    m.b = arg.b;
    m.c = arg.c;
    m.d = arg.d;
    m.e = arg.e;
    m.f = arg.f;
  }
  return m;
};

/**
 * Transformation reflecting through x-axis
 *
 * @property {SVGMatrix} reflectX
 */
Y.ACMACS.reflectX = Y.ACMACS.newSVGMatrix({a: 1, b: 0, c: 0, d: -1, e: 0, f: 0});


/**
 * Transformation reflecting through y-axis
 *
 * @property {SVGMatrix} reflectY
 */
Y.ACMACS.reflectY = Y.ACMACS.newSVGMatrix({a: -1, b: 0, c: 0, d: 1, e: 0, f: 0});


/**
 * Calculate Euclidean distance between two points. A point is an object
 * containing two properties named `x` and `y`.
 *
 * @method distance
 * @param {SVGPoint|Object} p1
 * @param {SVGPoint|Object} p2
 * @return Number distance
 */
Y.ACMACS.distance = function (p1, p2) {
  return Math.sqrt(
    (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
  );
};

// -------------------------------------------
// ### Borrowed from Raphaël

// The following two methods and a static property are needed to manipulate
// path-type shapes on the SVG canvas:
//
// * `Y.ACMACS.pathCommandRegex`
// * `Y.ACMACS.parsePathString(pathString)`
// * `Y.ACMACS.pathToRelative(pathArray)`

/**
Static variable containing the regular expression matching a path command
possibly surrounded with commas. The commas are discarded:

     /,?([achlmqrstvxz]),?/gi;

For example, this code

     [
       ["M", 0.02, 0.15],
       ["L", 0.06, 0.15],
       ["L", 0.04, 0.19],
       ["z"]
     ].join(",").replace(Y.ACMACS.pathCommandRegex, "$1")

will yield the following parseable SVG path string:

     M0.02,0.15L0.06,0.15L0.04,0.19z

Assigning this expression to an object property (instead of a variable) make
the function using it a bit faster.

@property {String} pathCommandRegex
@private
*/
Y.ACMACS.pathCommandRegex = /,?([achlmqrstvxz]),?/gi;


/**
 * Parses an SVG path definition (the `d` attribute of a `path` node)
 * into a list of lists, in which each inner list contains a single
 * command with paramaters.
 *
 * This method was copied form Raphaël, with small adjustments made
 * to pass JSLint.
 *
 * @method parsePathString
 * @param {String} pathString
 * @return Array
 * @example
     [
       ["M", 0.02, 0.15],
       ["L", 0.06, 0.15],
       ["L", 0.04, 0.19],
       ["z"]
     ]
 */
Y.ACMACS.parsePathString = function (pathString) {
  //
  if (!pathString) {
    return null;
  }

  var paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0},
      pathCommand = /([achlmqstvz])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?\s*,?\s*)+)/gi,
      pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)\s*,?\s*/gi,
      data = [];

  String(pathString).replace(pathCommand, function (a, b, c) {
    var params = [],
        name = b.toLowerCase();

    c.replace(pathValues, function (a, b) {
      if (b) {
        params.push(+b);
      }
    });

    if (name === "m" && params.length > 2) {
      data.push([b].concat(params.splice(0, 2)));
      name = "l";
      b = b === "m" ? "l" : "L";
    }
    while (params.length >= paramCounts[name]) {
      data.push([b].concat(params.splice(0, paramCounts[name])));
      if (!paramCounts[name]) {
        break;
      }
    }
  });

  // Override the default stringifier.
  data.toString = function () {
    return this.join(",").replace(Y.ACMACS.pathCommandRegex, "$1");
  };

  return data;
};


/**
 * Replace all absolute path commands in a parsed path array and
 * convert it to a relative path.
 *
 * This method was copied form Raphaël, with small adjustments made to
 * pass JSLint.
 *
 * @method pathToRelative
 * @param {Array} pathArray
 * @return String
 */
Y.ACMACS.pathToRelative = function (pathArray) {
  // Unlike its Raphaël prototype, it cannot be cached (and the same
  // may also be true of Raphaël). Caching it makes the canvas
  // initialisation procedures non-reentrant because once modified
  // (_e.g._, by translating to anchor) the path cannot be reset to
  // its initial value.

  //
  var r,
      pa,
      res = [],
      x = 0,
      y = 0,
      mx = 0,
      my = 0,
      start = 0,
      len,
      i, j, k, ii, jj, kk;

  if (pathArray[0][0] === "M") {
    x = pathArray[0][1];
    y = pathArray[0][2];
    mx = x;
    my = y;
    start += 1;
    res.push(["M", x, y]);
  }
  for (i = start, ii = pathArray.length; i < ii; i += 1) {
    r = res[i] = [];
    pa = pathArray[i];
    if (pa[0] !== pa[0].toLowerCase()) {
      r[0] = pa[0].toLowerCase();
      switch (r[0]) {
      case "a":
        r[1] = pa[1];
        r[2] = pa[2];
        r[3] = pa[3];
        r[4] = pa[4];
        r[5] = pa[5];
        r[6] = +(pa[6] - x).toFixed(3);
        r[7] = +(pa[7] - y).toFixed(3);
        break;
      case "v":
        r[1] = +(pa[1] - y).toFixed(3);
        break;
      case "m":
        mx = pa[1];
        my = pa[2];
        for (j = 1, jj = pa.length; j < jj; j += 1) {
          r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
        }
        break;
      default:
        for (j = 1, jj = pa.length; j < jj; j += 1) {
          r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
        }
      }
    }
    else {
      r = res[i] = [];
      if (pa[0] === "m") {
        mx = pa[1] + x;
        my = pa[2] + y;
      }
      for (k = 0, kk = pa.length; k < kk; k += 1) {
        res[i][k] = pa[k];
      }
    }
    len = res[i].length;
    switch (res[i][0]) {

    case "z":
      x = mx;
      y = my;
      break;
    case "h":
      x += +res[i][len - 1];
      break;
    case "v":
      y += +res[i][len - 1];
      break;
    default:
      x += +res[i][len - 2];
      y += +res[i][len - 1];
    }
  }

  // Override the default stringifier.
  res.toString = function () {
    return this.join(",").replace(Y.ACMACS.pathCommandRegex, "$1");
  };

  return res;
};


// -------------------------------------------
// ### Methods for star shape generation
//
// (_borrowed from Inkscape's `sp-star.cpp` and cleaned up for simplicity_)

/**
 * From a given set of star shape attributes (`star`), this method
 * calculates the co-ordinates of the star spline vertex identified
 * by the arguments `vertexType` and `index`.
 *
 * @method starVertexCoords
 * @param {Object} star Star shape attributes
 * @param {Integer} vertexType `0`: outer; `1`: inner
 * @param {Integer} index `0 .. star.corners - 1`; the ordinal of the
 * vertex, increasing in the clockwise direction starting at 3 o'clock
 */
Y.ACMACS.starVertexCoords = function (star, vertexType, index) {
  // For any star arm selected by the `index` argument, `vertexType = 0` picks
  // a vertex on the outer circle and `vertexType = 1` picks the following
  // vertex on the inner circle.

  // <a href="diagrams/star-vertices.svg"><img src="diagrams/star-vertices.png" /></a>

  var r, arg;

  r = [
    star.size / 2,
    star.size * star.proportion / 2
  ][vertexType];

  arg = [star.arg1, star.arg2][vertexType] +
    index * 2.0 * Math.PI / star.corners;

  // Intuitively, the co-ordinates should be:
  //
  //     x: star.point[0] + r * Math.cos(arg),
  //     y: star.point[1] + r * Math.sin(arg)
  //
  // But for some reason I do not understand well enough, it is easier
  // to assemble the shape around zero and then move it to its anchor.

  return {
    x: r * Math.cos(arg),
    y: -r * Math.sin(arg) /* -r makes it go clockwise */
  };
};


// For a given set of star attributes (`star`), this method will calculate the
// co-ordinates of the spline curve handle for one of its edges identified by
// three arguments: `vertexType`, `index`, and `edge`.
//
//  * _**star**_: shape prperties
//  * _**vertexType**_:
//  * _**index**_: `0 .. star.corners - 1`; the ordinal of the vertex,
//  increasing in the clockwise direction starting at 3 o'clock
//  * _**edge**_: `leading` or `trailing`; indicates which edge this handle
//  controls: the one leading to this vertex or the one emanating from it, in
//  the clockwise direction

/**
 * From a given set of star shape attributes (`star`), this method
 * calculates the co-ordinates of the spline curve handle for the edge identified
 * by the arguments `vertexType`, `index` and `edge`.
 *
 * @method starCurveHandle
 * @param {Object} star Star shape attributes
 * @param {Integer} vertexType `0`: outer; `1`: inner
 * @param {Integer} index `0 .. star.corners - 1`; the ordinal of the
 * vertex, increasing in the clockwise direction starting at 3 o'clock
 * @param {String} edge `leading` or `trailing`; indicates which edge this
 * $handle  controls: the one leading to this vertex or the one emanating
 * from it, in clockwise direction
 */
Y.ACMACS.starCurveHandle = function (star, vertexType, index, edge) {

  // The following diagram illustrates how a handle is calculated inside this
  // function call:
  //
  //     Y.ACMACS.starCurveHandle(star, 0, 1, 'trailing')
  //
  // from the data about three vertices `o`, `next` and `prev`,
  // and the configuration property `star.rounded`:
  //
  // <a href="diagrams/star-spline-handles.svg"><img width="80%" height="55%" src="diagrams/star-spline-handles.png" /></a>
  //

  var pi,
      ni,
      other_type,
      other_index,
      prev,
      next,
      o,
      prevLength,
      nextLength,
      prevToNext,
      handle,
      rounded = star.rounded || 0;

  // The point whose curve handle we're calculating
  o = Y.ACMACS.starVertexCoords(star, vertexType, index);

  // Indices of previous and next points
  if (index > 0) {
    pi = index - 1;
  }
  else {
    pi = star.corners - 1;
  }

  if (index < star.corners - 1) {
    ni = index + 1;
  }
  else {
    ni = 0;
  }

  // The other point type
  if (vertexType === 0) {
    other_type = 1;
  }
  else {
    other_type = 0;
  }

  // The neighbors of `o`. Depending on the value of `flatsided`,
  // they are either the same type (polygon) or the other type (star)

  if (star.flatsided) {
    prev = Y.ACMACS.starVertexCoords(star, vertexType, pi);
  }
  else {
    if (vertexType === 1) {
      other_index = index;
    }
    else {
      other_index = pi;
    }
    prev = Y.ACMACS.starVertexCoords(star, other_type, other_index);
  }

  if (star.flatsided) {
    next = Y.ACMACS.starVertexCoords(star, vertexType, ni);
  }
  else {
    if (vertexType === 0) { // SP_STAR_POINT_KNOT1
      other_index = index;
    }
    else {
      other_index = ni;
    }
    next = Y.ACMACS.starVertexCoords(star, other_type, other_index);
  }

  // Lengths of the edges connecting to `prev` and `next`
  prevLength = Y.ACMACS.distance(prev, o);
  nextLength = Y.ACMACS.distance(next, o);

  // Length of the chord between `prev` and `next`
  prevToNext = Y.ACMACS.distance(prev, next);

  if (edge === 'trailing') {
    handle = {
      x: o.x + rounded * nextLength * (next.x - prev.x) / prevToNext,
      y: o.y + rounded * nextLength * (next.y - prev.y) / prevToNext
    };
  }
  else {
    handle = {
      x: o.x - rounded * prevLength * (next.x - prev.x) / prevToNext,
      y: o.y - rounded * prevLength * (next.y - prev.y) / prevToNext
    };
  }
  return handle;
};


/**
 * Construct a path from a set of evenly spaced radii.
 *
 * @method pathFromPolar
 * @param {Array} point A two-coordinate point [x, y]
 * @param {Array} contour A contour line defined by a set
 *   of radii
*/
Y.ACMACS.pathFromPolar = function (point, contour, smoothing) {
  // Local variables:
  var
    // The number of vertices
    n = contour.length,

    // * The list of path vertices
    vertex = [],

    // * Set a threshold for smooth edges whose appearance is indistinguishable
    // from a straight line segment.
    notRounded = (Math.abs(smoothing) < 1e-4),

    // * Vertex index
    i,

    // * Index angle
    alpha,

    // * A disposable 2D point
    p,

    // * The resulting path
    path = [];

  // From an array of vertices, calculate the co-ordinates of the spline curve
  // handle for the edge identified by the arguments `index` and `edge`
  // ('leading', 'trailing').
  function curveHandle(index, edge) {
    var
      pi,
      ni,
      prev,
      next,
      o,
      prevLength,
      nextLength,
      prevToNext,
      handle,
      rounded = smoothing / 2 || 0; // To avoid bizarre effects at smoothing > 0.5, divide by 2

    // The point whose curve handle we're calculating
    o = vertex[index];

    // Indices of previous and next points
    if (index > 0) {
      pi = index - 1;
    }
    else {
      pi = n - 1;
    }

    if (index < n - 1) {
      ni = index + 1;
    }
    else {
      ni = 0;
    }

    // The neighbors of `o`.
    prev = vertex[pi];
    next = vertex[ni];

    // Lengths of the edges connecting to `prev` and `next`
    prevLength = Y.ACMACS.distance(prev, o);
    nextLength = Y.ACMACS.distance(next, o);

    // Length of the chord between `prev` and `next`
    prevToNext = Y.ACMACS.distance(prev, next);

    if (edge === 'trailing') {
      handle = {
        x: o.x + rounded * nextLength * (next.x - prev.x) / prevToNext,
        y: o.y + rounded * nextLength * (next.y - prev.y) / prevToNext
      };
    }
    else {
      handle = {
        x: o.x - rounded * prevLength * (next.x - prev.x) / prevToNext,
        y: o.y - rounded * prevLength * (next.y - prev.y) / prevToNext
      };
    }
    return handle;
  }

  // calculate vertices
  for (i = 0; i < n; i += 1) {
    alpha = i * 2.0 * Math.PI / n;
    vertex[i] = {};
    vertex[i].x = contour[i] * Math.cos(alpha);
    vertex[i].y = contour[i] * Math.sin(alpha);
  }

  // Calculate the first segment, starting at 12 o'clock.
  path[0] = ["M", vertex[0].x, vertex[0].y];

  // All segments between the first and the final.
  for (i = 1; i < n; i += 1) {
    if (notRounded) {
      p = vertex[i];
      path.push(["L", p.x, p.y]);
    } else {
      p = curveHandle(i - 1, 'trailing');
      path.push(["C", p.x, p.y]);
      p = curveHandle(i, 'leading');
      path[path.length - 1].push([p.x, p.y]);
      p = vertex[i];
      path[path.length - 1].push([p.x, p.y]);
    }
  }

  // The final segment
  if (notRounded) {
    p = vertex[0];
    path.push(["L", p.x, p.y]);
  } else {
    p = curveHandle(n - 1, 'trailing');
    path.push(["C", p.x, p.y]);
    p = curveHandle(0, 'leading');
    path[path.length - 1].push([p.x, p.y]);
    p = vertex[0];
    path[path.length - 1].push([p.x, p.y]);
  }

  // Terminate the path spec
  path[path.length - 1].push(['z']);

  return path;
}; // pathFromPolar


/**
 * Construct a star-shaped path using a set of shape properties
 * passed in an object.
 *
 * @method starGeneratePath
 * @param {Object} star Shape properties
 * @example
     {
       rotation: 0,
       corners: 6,
       proportion: 0.6,
       rounded: 0.4,
       arg1: 0,
       arg2: 0.2
     }
*/
Y.ACMACS.starGeneratePath = function (star) {
  // Local variables:
  var
      // * Set a threshold for smooth edges whose appearance is indistinguishable
      // from a straight line segment.
      notRounded = (Math.abs(star.rounded) < 1e-4),

      // * Vertex index
      i,

      // * A disposable 2D point
      p,

      // * The resulting path
      path = [];

  // Calculate the first segment.
  p = Y.ACMACS.starVertexCoords(star, 0, 0);
  path[0] = ["M", p.x, p.y];

  if (!star.flatsided) {
    if (notRounded) {
      p = Y.ACMACS.starVertexCoords(star, 1, 0);
      path.push(["L", p.x, p.y]);
    } else {
      p = Y.ACMACS.starCurveHandle(star, 0, 0, 'trailing');
      path.push(["C", p.x, p.y]);
      p = Y.ACMACS.starCurveHandle(star, 1, 0, 'leading');
      path[path.length - 1].push([p.x, p.y]);
      p = Y.ACMACS.starVertexCoords(star, 1, 0);
      path[path.length - 1].push([p.x, p.y]);
    }
  }

  // All segments between the first and the final.
  for (i = 1; i < star.corners; i += 1) {
    if (notRounded) {
      p = Y.ACMACS.starVertexCoords(star, 0, i);
      path.push(["L", p.x, p.y]);
    } else {
      if (star.flatsided) {
        p = Y.ACMACS.starCurveHandle(star, 0, i - 1, 'trailing');
        path.push(["C", p.x, p.y]);
        p = Y.ACMACS.starCurveHandle(star, 0, i, 'leading');
        path[path.length - 1].push([p.x, p.y]);
        p = Y.ACMACS.starVertexCoords(star, 0, i);
        path[path.length - 1].push([p.x, p.y]);
      } else {
        p = Y.ACMACS.starCurveHandle(star, 1, i - 1, 'trailing');
        path.push(["C", p.x, p.y]);
        p = Y.ACMACS.starCurveHandle(star, 0, i, 'leading');
        path[path.length - 1].push([p.x, p.y]);
        p = Y.ACMACS.starVertexCoords(star, 0, i);
        path[path.length - 1].push([p.x, p.y]);
      }
    }
    if (!star.flatsided) {
      if (notRounded) {
        p = Y.ACMACS.starVertexCoords(star, 1, i);
        path.push(["L", p.x, p.y]);
      } else {
        p = Y.ACMACS.starCurveHandle(star, 0, i, 'trailing');
        path.push(["C", p.x, p.y]);
        p = Y.ACMACS.starCurveHandle(star, 1, i, 'leading');
        path[path.length - 1].push([p.x, p.y]);
        p = Y.ACMACS.starVertexCoords(star, 1, i);
        path[path.length - 1].push([p.x, p.y]);
      }
    }
  }

  // The final segment
  if (notRounded) {
    p = Y.ACMACS.starVertexCoords(star, 0, 0);
    path.push(["L", p.x, p.y]);
  } else {
    if (!star.flatsided) {
      p = Y.ACMACS.starCurveHandle(star, 1, star.corners - 1, 'trailing');
      path.push(["C", p.x, p.y]);
      p = Y.ACMACS.starCurveHandle(star, 0, 0, 'leading');
      path[path.length - 1].push([p.x, p.y]);
      p = Y.ACMACS.starVertexCoords(star, 0, 0);
      path[path.length - 1].push([p.x, p.y]);
    } else {
      p = Y.ACMACS.starCurveHandle(star, 0, star.corners - 1, 'trailing');
      path.push(["C", p.x, p.y]);
      p = Y.ACMACS.starCurveHandle(star, 0, 0, 'leading');
      path[path.length - 1].push([p.x, p.y]);
      p = Y.ACMACS.starVertexCoords(star, 0, 0);
      path[path.length - 1].push([p.x, p.y]);
    }
  }

  // Terminate the path spec
  path[path.length - 1].push(['z']);

  return path;
}; // starGeneratePath

/**
 * Convert an opacity value in the range [0 .. 1] to grey CSS
 * colour spec suitable for use in SVG masks.
 *
 * @method opacity2Color
 * @param {Number} o Opacity
 * @return String
 * @example
 * `0.4` becomes `'#666666'`
 */
Y.ACMACS.opacity2Color = function (o) {
  var opacity;
  if (typeof o === 'number') {
    if (o <= 0) {
      opacity = '00';
    }
    else if (o >= 1) {
      opacity = 'ff';
    }
    else {
      opacity = Math.floor(255.5 * o).toString(16);
    }
    return Y.substitute('#{o}{o}{o}', {o: opacity});
  }

  throw new Error('Expecting a number in the range [0 .. 1] as opacity value; got \'' + o + '\'');
};

/**
 * An arcane browser-neutral (almost) implementation of file save function.
 *
 * Lifted from FileSaver by Eli Grey.
 *
 * Example:
 * ``` JavaScript
 * title = test.widget.get('data').title[0].text[0];
 * Y.ACMACS.saveAs(new self.Blob([test.widget.getSVG()], {
 *   type: 'image/svg+xml;charset=' + document.characterSet
 * }), title + '.svg');
 *
 * @method saveAs
 * @param {Blob} blob A blob object containing the data to be saved
 */

/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2013-01-23
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */
Y.ACMACS.saveAs = (navigator.msSaveBlob && navigator.msSaveBlob.bind(navigator)) ||
  (function (view) {
  'use strict';
  var
    doc = view.document,
    // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
    get_URL = function () {
      return view.URL || view.webkitURL || view;
    },
    URL = view.URL || view.webkitURL || view,
    save_link = doc.createElementNS('http://www.w3.org/1999/xhtml', 'a'),
    can_use_save_link = save_link.hasOwnProperty('download'),
    click = function (node) {
      var event = doc.createEvent('MouseEvents');
      event.initMouseEvent(
        'click', true, false, view, 0, 0, 0, 0, 0, false, false, false, false, 0, null
      );
      node.dispatchEvent(event);
    },
    webkit_req_fs = view.webkitRequestFileSystem,
    req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem,
    throw_outside = function (ex) {
      (view.setImmediate || view.setTimeout)(function () {
        throw ex;
      }, 0);
    },
    force_saveable_type = 'application/octet-stream',
    fs_min_size = 0,
    deletion_queue = [],
    process_deletion_queue = function () {
      var
        i = deletion_queue.length,
        file;
      while (i) {
        i -= 1;
        file = deletion_queue[i];
        if (typeof file === 'string') { // file is an object URL
          URL.revokeObjectURL(file);
        } else { // file is a File
          file.remove();
        }
      }
      deletion_queue.length = 0; // clear queue
    },
    dispatch = function (filesaver, event_types, event) {
      event_types = [].concat(event_types);
      var
        i = event_types.length,
        listener;
      while (i) {
        i -= 1;
        listener = filesaver['on' + event_types[i]];
        if (typeof listener === 'function') {
          try {
            listener.call(filesaver, event || filesaver);
          } catch (ex) {
            throw_outside(ex);
          }
        }
      }
    },
    FileSaver = function (blob, name) {
      // First try a.download, then web filesystem, then object URLs
      var
        filesaver = this,
        type = blob.type,
        blob_changed = false,
        object_url,
        target_view,
        get_object_url = function () {
          var object_url = get_URL().createObjectURL(blob);
          deletion_queue.push(object_url);
          return object_url;
        },
        dispatch_all = function () {
          dispatch(filesaver, String.prototype.split.call('writestart progress write writeend', ' '));
        },
        // on any filesys errors revert to saving with object URLs
        fs_error = function () {
          // don't create more object URLs than needed
          if (blob_changed || !object_url) {
            object_url = get_object_url(blob);
          }
          if (target_view) {
            target_view.location.href = object_url;
          }
          filesaver.readyState = filesaver.DONE;
          dispatch_all();
        },
        abortable = function (func) {
          return function () {
            if (filesaver.readyState !== filesaver.DONE) {
              return func.apply(this, arguments);
            }
          };
        },
        create_if_not_found = {create: true, exclusive: false},
        slice;

      filesaver.readyState = filesaver.INIT;
      if (!name) {
        name = 'download';
      }
      if (can_use_save_link) {
        object_url = get_object_url(blob);
        save_link.href = object_url;
        save_link.download = name;
        click(save_link);
        filesaver.readyState = filesaver.DONE;
        dispatch_all();
        return;
      }

      // Object and web filesystem URLs have a problem saving in Google Chrome when
      // viewed in a tab, so I force save with application/octet-stream
      // http://code.google.com/p/chromium/issues/detail?id=91158
      if (view.chrome && type && type !== force_saveable_type) {
        slice = blob.slice || blob.webkitSlice;
        blob = slice.call(blob, 0, blob.size, force_saveable_type);
        blob_changed = true;
      }
      // Since I can't be sure that the guessed media type will trigger a download
      // in WebKit, I append .download to the filename.
      // https://bugs.webkit.org/show_bug.cgi?id=65440
      if (webkit_req_fs && name !== 'download') {
        name += '.download';
      }
      if (type === force_saveable_type || webkit_req_fs) {
        target_view = view;
      } else {
        target_view = view.open();
      }
      if (!req_fs) {
        fs_error();
        return;
      }
      fs_min_size += blob.size;
      req_fs(view.TEMPORARY, fs_min_size, abortable(function (fs) {
        fs.root.getDirectory('saved', create_if_not_found, abortable(function (dir) {
          var save = function () {
            dir.getFile(name, create_if_not_found, abortable(function (file) {
              file.createWriter(abortable(function (writer) {
                writer.onwriteend = function (event) {
                  target_view.location.href = file.toURL();
                  deletion_queue.push(file);
                  filesaver.readyState = filesaver.DONE;
                  dispatch(filesaver, 'writeend', event);
                };
                writer.onerror = function () {
                  var error = writer.error;
                  if (error.code !== error.ABORT_ERR) {
                    fs_error();
                  }
                };
                String.prototype.split.call('writestart progress write abort', ' ').forEach(function (event) {
                  writer['on' + event] = filesaver['on' + event];
                });
                writer.write(blob);
                filesaver.abort = function () {
                  writer.abort();
                  filesaver.readyState = filesaver.DONE;
                };
                filesaver.readyState = filesaver.WRITING;
              }), fs_error);
            }), fs_error);
          };
          dir.getFile(name, {create: false}, abortable(function (file) {
            // delete file if it already exists
            file.remove();
            save();
          }), abortable(function (ex) {
            if (ex.code === ex.NOT_FOUND_ERR) {
              save();
            } else {
              fs_error();
            }
          }));
        }), fs_error);
      }), fs_error);
    },
    FS_proto = FileSaver.prototype,
    saveAs = function (blob, name) {
      return new FileSaver(blob, name);
    };

  FS_proto.abort = function () {
    var filesaver = this;
    filesaver.readyState = filesaver.DONE;
    dispatch(filesaver, 'abort');
  };
  FS_proto.readyState = FS_proto.INIT = 0;
  FS_proto.WRITING = 1;
  FS_proto.DONE = 2;

  FS_proto.error =
  FS_proto.onwritestart =
  FS_proto.onprogress =
  FS_proto.onwrite =
  FS_proto.onabort =
  FS_proto.onerror =
  FS_proto.onwriteend =
    null;

  view.addEventListener('unload', process_deletion_queue, false);
  return saveAs;
}(self));
// ------------------------------------------------------------------------
// Y.ACMACS.WidgetTreeNode
// ------------------------------------------------------------------------

/**
 * This mix-in class allows widgets to from a tree-like hierarchy
 *
 * @class ACMACS.WidgetTreeNode
 * @constructor
 */
Y.ACMACS.WidgetTreeNode = function () {};
Y.ACMACS.WidgetTreeNode.prototype = {
  /**
   * This proprety is set to `this` in the root widget's
   * <a href="../classes/ACMACS.MapWidget.html#method_initializer">initializer()</a>
   * method to be propagated to all descendants in the widget
   * hierarchy.
   *
   * @property {Widget} rootWidget
   * @protected
   */
  rootWidget: null,

  /**
   * The leaf element of is widget's path name.
   *
   * For example, if this widget's instance name is `map`, its
   * full path name may be `/layerStack/map`.
   *
   * @property {String} instanceName
   * @protected
   */
  instanceName: 'root',

  /**
   * Reference to this widget's parent.
   *
   * When set to `null`, it terminates the search for ancestors
   * in widget composition hierarchy.
   *
   * @property {Widget} parent
   * @protected
   */
  parent: null,

  /**
   * The list of child widgets
   *
   * @property {Array} children
   * @protected
   */
  children: null,

  /**
   * Create a new child widget
   *
   * @method add
   * @param {String} name child's instance name
   * @param {Prototype} ChildPrototype the prototype from which to create the new child
   * @param {Object} config child's configuration data
   * @return {Widget} the child created by this method
   * @protected
   */
  add: function (name, ChildPrototype, config) {
    var widget;

    if (ChildPrototype === undefined) {
      throw new Error('udefined child widget prototype for "' + name + '"');
    }

    if (this[name]) {
      throw new Error('child widget named \'' + name + '\' already exists');
    }

    widget = new ChildPrototype(Y.merge({
      parent: this,
      rootWidget: this.rootWidget,
      instanceName: name,
      render: this.get('contentBox')
    }, config));

    // Establish parenthood. Just be sure, in case the child widget ignores the
    // parent config property, set the property on the newly created widget.
    this[name] = widget;
    widget.parent = this;
    widget.rootWidget = this.rootWidget;
    widget.instanceName = name;

    this.children.push(widget);

    return widget;
  },

  /**
   * Tarverse the widget hierarchy
   *
   * @method traverse
   * @param {Function} callback The function to apply to each node
   * @param {Object} context Execution context for the callback function
   * @param {Integer} [depth] If the callback needs to be aware of the depth of traversal, it can use this argument.
   * @protected
   */
  traverse: function (callback, context, depth) {
    if (depth === undefined) {
      depth = 0;
    }
    callback(this, depth);
    depth += 1;
    Y.each(this.children, function (child) {
      child.traverse(callback, context, depth);
    }, context);
  },

  /**
   * Use a path name to retrieve a widget
   *
   * @method find
   * @param {String} path absolute or relative path
   * @protected
   */
  find: function (path) {
    var pathList,
        widget = this,
        child;

    if (path) {

      if (path === '/') {
        return this.rootWidget;
      }

      pathList = path.split('/');
      if (pathList[0] === '') {
        widget = this.rootWidget;
        pathList.shift();
      }
      Y.some(pathList, Y.bind(function (pathElement) {
        if (widget[pathElement]) {
          widget = widget[pathElement];
        }
        else {
          widget = undefined;
          return true;
        }
      }, this));
      if (widget !== this) {
        return widget;
      }
      return undefined;
    }

    // Null, undefined, or empty path argument
    return null;
  }
};


// ------------------------------------------------------------------------
// Y.Base
// ------------------------------------------------------------------------
/**
 * Extensions to Base required by ACMACS
 *
 * @class Base
 */

/**
 * This function returns an attribute or if it is undefined, a safe default for
 * that attribute from the object's `default` property.
 *
 * @method setting
 * @param {String} name Attribute name
 * @return {Object|Array|String|Number} Attribute value
 */
Y.Base.prototype.setting = function (name) {
  var attr = this.get(name);
  if (attr !== undefined && attr !== null) {
    return attr;
  }
  if (this['default']) {
    return this['default'][name];
  }
  return undefined;
};


/**
 * This function returns a profile setting unless it is overridden by
 * the attribute value or the object's `default` property.
 *
 * @method attributeOrProfileSetting
 *
 * @param {String} name Attribute name
 * @return {Object|Array|String|Number} Attribute value
 */
Y.Base.prototype.attributeOrProfileSetting = function (name) {
  var attrValue = this.get(name),
      profileValue;
      // nameToLog = 'chartSize';

  if (attrValue !== undefined) {
    // if (name === nameToLog) {
    //   Y.log([name + ': returning attribute: ', attrValue]);
    // }
    return attrValue;
  }

  if (Y.ACMACS.profile) {
    profileValue = Y.ACMACS.profile.get(name);
  }
  if (profileValue !== undefined && profileValue !== null) {
    // if (name === nameToLog) {
    //   Y.log([name + ': returning profile value: ', profileValue]);
    // }
    return profileValue;
  }
  if (this['default']) {
    // if (name === nameToLog) {
    //   Y.log([name + ': returning default: ', this['default'][name]]);
    // }
    return this['default'][name];
  }
  return undefined;
};


// ------------------------------------------------------------------------
// String
// ------------------------------------------------------------------------
/**
 * Extensions to String required by ACMACS
 *
 * @class String
 */

/**
 * Concatenate the string to itself the specified number of times.
 *
 * Used in `widget-null.js`
 *
 * @method repeat
 * @param {Integer} num The number of times to replicate
 * @return {String} The concatenated string
 */
String.prototype.repeat = function (num) {
  var a = [];
  a.length = parseInt(num, 10) + 1;
  return a.join(this);
};



// ------------------------------------------------------------------------
// Blob
// ------------------------------------------------------------------------

/**
 * A browser-neutral Blob implementation by Eli Grey.
 *
 * @class Blob
 * @constructor
 */

/* Blob.js
 * A Blob implementation.
 * 2013-06-20
 *
 * By Eli Grey, http://eligrey.com
 * By Devin Samarin, https://github.com/eboyjr
 * License: X11/MIT
 *   See LICENSE.md
 */


/*! @source http://purl.eligrey.com/github/Blob.js/blob/master/Blob.js */

if (typeof Blob !== 'function' || typeof URL === 'undefined') {
  if (typeof Blob === 'function' && typeof webkitURL !== 'undefined') {
    URL = webkitURL;
  }
  else {
    Blob = (function (view) {
      'use strict';

      var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || view.MSBlobBuilder || (function (view) {
        var
          get_class = function (object) {
          /*jslint regexp: false */
            return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
          },
          FakeBlobBuilder = function BlobBuilder() {
            this.data = [];
          },
          FakeBlob = function Blob(data, type, encoding) {
            this.data = data;
            this.size = data.length;
            this.type = type;
            this.encoding = encoding;
          },
          FBB_proto = FakeBlobBuilder.prototype,
          FB_proto = FakeBlob.prototype,
          FileReaderSync = view.FileReaderSync,
          FileException = function (type) {
            this.code = this[this.name = type];
          },
          file_ex_codes = String.prototype.split.call(
            'NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR',
            ' '
          ),
          file_ex_code = file_ex_codes.length,
          real_URL = view.URL || view.webkitURL || view,
          real_create_object_URL = real_URL.createObjectURL,
          real_revoke_object_URL = real_URL.revokeObjectURL,
          URL = real_URL,
          btoa = view.btoa,
          atob = view.atob,
          can_apply_typed_arrays = false,
          can_apply_typed_arrays_test = function (pass) {
            can_apply_typed_arrays = !pass;
          },

          ArrayBuffer = view.ArrayBuffer,
          Uint8Array = view.Uint8Array;

        FakeBlob.fake = FB_proto.fake = true;
        while (file_ex_code) {
          file_ex_code -= 1;
          FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
        }
        try {
          if (Uint8Array) {
            can_apply_typed_arrays_test.apply(0, new Uint8Array(1));
          }
        } catch (ex) {}
        if (!real_URL.createObjectURL) {
          URL = view.URL = {};
        }
        URL.createObjectURL = function (blob) {
          var
            type = blob.type,
            data_URI_header;

          if (type === null) {
            type = 'application/octet-stream';
          }
          if (blob instanceof FakeBlob) {
            data_URI_header = 'data:' + type;
            if (blob.encoding === 'base64') {
              return data_URI_header + ';base64,' + blob.data;
            }
            if (blob.encoding === 'URI') {
              return data_URI_header + ',' + decodeURIComponent(blob.data);
            }
            if (btoa) {
              return data_URI_header + ';base64,' + btoa(blob.data);
            }
            return data_URI_header + ',' + encodeURIComponent(blob.data);

          }
          if (real_create_object_URL) {
            return real_create_object_URL.call(real_URL, blob);
          }
        };
        URL.revokeObjectURL = function (object_URL) {
          if (object_URL.substring(0, 5) !== 'data:' && real_revoke_object_URL) {
            real_revoke_object_URL.call(real_URL, object_URL);
          }
        };
        FBB_proto.append = function (data/*, endings*/) {
          var
            bb = this.data,
            str,
            buf,
            i,
            buf_len,
            fr;

          // decode data to a binary string
          if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
            if (can_apply_typed_arrays) {
              bb.push(String.fromCharCode.apply(String, new Uint8Array(data)));
            } else {
              str = '';
              buf = new Uint8Array(data);
              buf_len = buf.length;
              for (i = 0; i < buf_len; i += 1) {
                str += String.fromCharCode(buf[i]);
              }
            }
          } else if (get_class(data) === 'Blob' || get_class(data) === 'File') {
            if (FileReaderSync) {
              fr = new FileReaderSync();
              bb.push(fr.readAsBinaryString(data));
            } else {
              // async FileReader won't work as BlobBuilder is sync
              throw new FileException('NOT_READABLE_ERR');
            }
          } else if (data instanceof FakeBlob) {
            if (data.encoding === 'base64' && atob) {
              bb.push(atob(data.data));
            } else if (data.encoding === 'URI') {
              bb.push(decodeURIComponent(data.data));
            } else if (data.encoding === 'raw') {
              bb.push(data.data);
            }
          } else {
            if (typeof data !== 'string') {
              data += ''; // convert unsupported types to strings
            }
            // decode UTF-16 to binary string
            bb.push(unescape(encodeURIComponent(data)));
          }
        };
        FBB_proto.getBlob = function (type) {
          return new FakeBlob(this.data.join(''), type || null, 'raw');
        };
        FBB_proto.toString = function () {
          return '[object BlobBuilder]';
        };
        FB_proto.slice = function (start, end, type) {
          var
            args = arguments.length;

          return new FakeBlob(
            this.data.slice(start, args > 1 ? end : this.data.length),
            type || null,
            this.encoding
          );
        };
        FB_proto.toString = function () {
          return '[object Blob]';
        };
        return FakeBlobBuilder;
      }(view));

      return function Blob(blobParts, options) {
        var
          type = options ? (options.type || '') : '',
          builder = new BlobBuilder(),
          i,
          len;

        if (blobParts) {
          for (i = 0, len = blobParts.length; i < len; i += 1) {
            builder.append(blobParts[i]);
          }
        }
        return builder.getBlob(type);
      };
    }(self));
  }
}

}, '@VERSION@', {
  requires: ['base', 'node', 'acmacs-profile', 'widget-stack']
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
