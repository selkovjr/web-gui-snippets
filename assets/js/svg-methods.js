/*
  # license
  # license.
*/

/*jslint regexp: false */
/*global
Y: false,
document: false,
SVGSVGElement: true,
SVGGElement: true,
SVGLineElement: true,
SVGCircleElement: true,
SVGElement: true,
SVGMatrix: true
*/

// Yes, I am aware of the potential problems of extending the DOM. But I can
// reap huge benefits in doing so, and the problems, at the moment, are too
// remote.

/**
 * Extensions to SVG DOM required by ACMACS
 *
 * @module acmacs-base
 * @submodule svg-methods
 */


// ----------------------------------------------------------------------
// SVGMatrix methods
// ----------------------------------------------------------------------

/**
 * Extensions to SVGMatrix required by ACMACS
 * @class SVGMatrix
 * @static
 */

/**
Create a console-writeable string representation of an `SVGMatrix` object.

@method formatIn3Lines
@return {String}
    [ a, c, e
      b, d, f
      0, 0, 1 ]
*/
SVGMatrix.prototype.formatIn3Lines = function () {
  return "[ " + this.a + ", " + this.c + ", " + this.e + "\n  " +
    this.b + ", " + this.d + ", " + this.f +
    "\n  0, 0, 1 ]";
};



// ----------------------------------------------------------------------
// SVGElement methods
// ----------------------------------------------------------------------
/**
 * Extensions to SVGElement required by ACMACS
 * @class SVGElement
 * @static
 */

/**
 * Converts a 6-element transformation matrix (`SVGMatrix`) into a string
 * compliant with the SVG `transform` attribute and applies it to the element.
 *
 * @method applyTransformation
 * @param {SVGMatrix} Transformation to apply
 */
SVGElement.prototype.applyTransformation = function (matrix) {
  this.setAttribute('transform',
    'matrix(' +
      matrix.a + ',' +
      matrix.b + ',' +
      matrix.c + ',' +
      matrix.d + ',' +
      matrix.e + ',' +
      matrix.f +
    ')'
  );
};


/**
 * This method checks whether a rotation transformation is set on the element
 * and updates it with the new pivot co-ordinates (x, y).
 *
 * Such adjustment is necessary to preserve the appearance of tilted shapes
 * -- the effect achieved by rotating a shape about its centre. Once the shape
 * has moved, its `transform` attribute must be recalculated taking into account
 * the new centre co-ordinates.
 *
 * @method setPivotPoint
 * @param {Number} x x-coordinate of the pivot point
 * @param {Number} y y-coordinate of the pivot point
 */
SVGElement.prototype.setPivotPoint = function (x, y) {
  this.X = x;
  this.Y = y;

  // Circles do not need this service.
  if (!(this instanceof SVGCircleElement)) {
    // This is based on the assumption that rotation is the only local
    // transformation applied to the shape.
    var t = this.getAttribute('transform');

    // If there is no transformation applied, there is nothing to update.
    if (t) {
      this.setAttribute('transform',
        // There are two syntax variants for setting the rotation transformation:
        // `rotation(angle, x, y)` and `rotation(angle)`. The latter variant is
        // preferred by some browsers when the pivot co-ordinates are both set to
        // zero, so it is essential  that this expression recognises both
        // patterns.
        //
        // Note that only the value of the angle of rotation is preserved; the
        // pivot point is set from the arguments and therefore the second
        // matching group in the search expression is discarded.
        t.replace(/\(([^, \)]+)([, \)].+)?\)/,
          function (match, angle) {
            return Y.substitute('({angle}, {x}, {y})',
              {angle: angle, x: x, y: y}
            );
          }
        )
      );
    }
  }
};


/**
Scale the world preserving the size of all SVG nodes

Because scale transformations of the view are not allowed to change the
sizes of point shapes, we are faking such transformations by shifting the
world locations of points on the map layer. This destroys the world, making
point locations meaningless, so in order to preserve information about the
original world co-ordinates, a real scale transformation commensurate with
the fake zoom must be applied to an empty layer of the same initial geometry
as the map layer. This layer is used as a keeper of state.

A theoretically better alternative would be to scale the viewing
transformation and then iterate through all shapes, adjusting their scale.
But in practice, this operation proved to be slower and computationally
unstable, resulting in jerky movement.

<a href="../../diagrams/fake_zoom.svg"><img width="80%" height="64%"
src="../../diagrams/fake_zoom.png" /></a>

The fake zoom is implemented as a function that is sequentially applied to
each node on the SVG canvas. The `SVGElement` prototpye is a convenient host
for this function.

Applies to: `circle`, `ellipse`, `rect`, `image`, `text`, and `path`. Line
nodes implement their own
[fakeZoom()](../classes/SVGLineElement.html#method_fakeZoom) method.

@method fakeZoom
@param {Number} px x-coordinate of zoom centre
@param {Number} py y-coordinate of zoom centre
@param {Number} delta zoom factor increment (difference from 1)
*/
SVGElement.prototype.fakeZoom = function (px, py, delta) {
  //
  var x, y, cx, cy, dx, dy, bb, width, height, path;

  switch (this.tagName) {

  // Circular shapes are anchored at the centre, so changing centre
  // co-ordinates is all there is to it.
  case "circle":
    x = parseFloat(this.getAttribute('cx'));
    y = parseFloat(this.getAttribute('cy'));
    dx = delta * (x - px);
    dy = delta * (y - py);
    x += dx;
    y += dy;
    this.setAttribute('cx', x);
    this.setAttribute('cy', y);
    this.X = x;
    this.Y = y;
    break;

  // The code for ellipse is the same as circle's, except for the last line;
  // duplicating the code is more efficient than adding another switch or
  // letting the function test whether it is applicable or not.
  case "ellipse":
    x = parseFloat(this.getAttribute('cx'));
    y = parseFloat(this.getAttribute('cy'));
    dx = delta * (x - px);
    dy = delta * (y - py);
    x += dx;
    y += dy;
    this.setAttribute('cx', x);
    this.setAttribute('cy', y);
    this.X = x;
    this.Y = y;

    // If the element is tilted, the rotation transformation implementing the
    // tilt needs to be adjusted with the new centre co-ordinates.
    this.setPivotPoint(x, y);
    break;

  // Rectangular shapes are anchored at a corner, requiring additional
  // calculations to find the centre co-ordinates.
  case "rect":
  case "image":
    x = parseFloat(this.getAttribute('x'));
    y = parseFloat(this.getAttribute('y'));
    width = parseFloat(this.getAttribute('width'));
    height = parseFloat(this.getAttribute('height'));
    cx = x + width / 2;
    cy = y + height / 2;
    dx = delta * (cx - px);
    dy = delta * (cy - py);
    x += dx;
    y += dy;
    this.setAttribute('x', x);
    this.setAttribute('y', y);
    this.X = x + width / 2;
    this.Y = y + height / 2;

    // If the element is tilted, the rotation transformation implementing the
    // tilt needs to be adjusted with the new centre co-ordinates.
    this.setPivotPoint(x + width / 2, y + height / 2);
    break;

  // This assumes the text node is anchored at the centre, which is not really
  // true because the text is rendered relative to its baseline. It may work
  // incorrectly.
  case "text":
    x = parseFloat(this.getAttribute('x'));
    y = parseFloat(this.getAttribute('y'));
    dx = delta * (x - px);
    dy = delta * (y - py);
    x += dx;
    y += dy;
    this.setAttribute('x', x);
    this.setAttribute('y', y);
    this.X = x;
    this.Y = y;

    // If the element is tilted, the rotation transformation implementing the
    // tilt needs to be adjusted with the new centre co-ordinates.
    bb = this.getBBox();
    this.setPivotPoint(bb.x + bb.width / 2, bb.y + bb.height / 2);
    break;

  // Translating a polygon is a more difficult task because its co-ordinates
  // are encoded only in a string form, and that string needs parsing. The
  // methods for manipulating paths, `parsePathString()` and
  // `pathToRelative()`, are defined in this module, but they live in the
  // `Y.ACMACS` namespace.

  case "path":
    path = Y.ACMACS.pathToRelative(
      Y.ACMACS.parsePathString(
        this.getAttribute('d')
      )
    );
    dx = delta * (this.X - px);
    dy = delta * (this.Y - py);
    path[0][1] += dx;
    path[0][2] += dy;
    this.setAttribute('d', path.toString());

    // Preserve the shape's tilt by updating the pivot point.
    this.X += dx;
    this.Y += dy;
    this.setPivotPoint(this.X, this.Y);
    break;
  }
  //

  return [dx, dy];
}; // fakeZoom


/**
 * Implements translation of svg SVG node in such a way that its rotation
 * transformation, if defined as an attribute, is adjusted with the new pivot
 * co-ordinates. Without such adjustment, the resultant transformation will
 * include the rotation around the old centre instead of the new one.
 *
 * Applies to: `circle`, `ellipse`, `rect`, `image`, `text`, `line`, and `path`.
 *
 * @method translatePreservingTilt
 * @param {Number} dx x-displacement
 * @param {Number} dy y-displacement
 */
SVGElement.prototype.translatePreservingTilt = function (dx, dy) {
  //
  var x, y, x2, y2, bb, path;

  switch (this.tagName) {

  // For a circle, it is simply a matter of shifting its centre co-ordinates.
  case "circle":
    this.setAttribute('cx', parseFloat(this.getAttribute('cx')) + dx);
    this.setAttribute('cy', parseFloat(this.getAttribute('cy')) + dy);
    this.X = parseFloat(this.getAttribute('cx'));
    this.Y = parseFloat(this.getAttribute('cy'));
    break;

  // An ellipse may be tilted by setting its rotation attribute, in which case
  // the pivot point of rotation needs to be adjusted after translation.
  case "ellipse":
    x = parseFloat(this.getAttribute('cx'));
    y = parseFloat(this.getAttribute('cy'));
    x += dx;
    y += dy;
    this.setAttribute('cx', x);
    this.setAttribute('cy', y);
    this.setPivotPoint(x, y);
    break;

  // Rectangular shapes are anchored at a corner, requiring additional
  // calculations to find the centre co-ordinates.
  case "rect":
  case "image":
    x = parseFloat(this.getAttribute('x')) + dx;
    y = parseFloat(this.getAttribute('y')) + dy;
    this.setAttribute('x', x);
    this.setAttribute('y', y);
    this.setPivotPoint(
      x + parseFloat(this.getAttribute('width')) / 2,
      y + parseFloat(this.getAttribute('height')) / 2
    );
    break;

  case "text":
    x = parseFloat(this.getAttribute('x')) + dx;
    y = parseFloat(this.getAttribute('y')) + dy;
    this.setAttribute('x', x);
    this.setAttribute('y', y);
    bb = this.getBBox();
    this.setPivotPoint(bb.x + bb.width / 2, bb.y + bb.height / 2);
    break;

  // Lines (only used as label links) get re-rendered upon each transformation,
  // so there is no need to rotate them and thus to preserve rotation, so no
  // pivot point is defined for them.
  case "line":
    x = parseFloat(this.getAttribute('x1')) + dx;
    y = parseFloat(this.getAttribute('y1')) + dy;
    x2 = parseFloat(this.getAttribute('x2')) + dx;
    y2 = parseFloat(this.getAttribute('y2')) + dy;
    this.setAttribute('x1', x);
    this.setAttribute('y1', y);
    this.setAttribute('x2', x2);
    this.setAttribute('y2', y2);
    break;

  // Translating a polygon is a more difficult task because its co-ordinates
  // are encoded only in a string form, and that string needs parsing. The
  // methods for manipulating paths, `parsePathString()` and
  // `pathToRelative()`, are defined in this module, but they live in the
  // `Y.ACMACS` namespace.
  case "path":
    path = Y.ACMACS.pathToRelative(
      Y.ACMACS.parsePathString(
        this.getAttribute('d')
      )
    );
    path[0][1] += +dx;
    path[0][2] += +dy;
    this.setAttribute('d', path.toString());

    // Preserve the shape's tilt by updating the pivot point.
    this.X += dx;
    this.Y += dy;
    this.setPivotPoint(this.X, this.Y);
    break;
  }

  return this;
}; // translatePreservingTilt


/**
 * Implements the in-place scaling of several SVG node types by adjusting
 * their specific geometry attributes.
 *
 * Applies to: `circle`, `ellipse`, `rect`, `image`, `text`, and `path`.
 *
 * @method scale
 * @param {Number} arg Scale factor
 */
SVGElement.prototype.scale = function (arg) {
  //
  var x, y, cx, cy, w, h, nw, nh, path;

  switch (this.tagName) {

  // For circles and ellipses, it is simply a matter of scaling their radii.
  case "circle":
    this.setAttribute('r', parseFloat(this.getAttribute('r')) * arg);
    break;

  case "ellipse":
    this.setAttribute('rx', parseFloat(this.getAttribute('rx')) * arg);
    this.setAttribute('ry', parseFloat(this.getAttribute('ry')) * arg);
    break;

  // Rectangular shapes are anchored at a corner, requiring additional
  // calculations to find the new anchor co-ordinates.
  case "rect":
  case "image":
    x = parseFloat(this.getAttribute('x'));
    y = parseFloat(this.getAttribute('y'));
    w = parseFloat(this.getAttribute('width'));
    h = parseFloat(this.getAttribute('height'));
    nw = w * arg;
    nh = h * arg;
    x += (w - nw) / 2;
    y += (h - nh) / 2;
    this.setAttribute('x', x);
    this.setAttribute('y', y);
    this.setAttribute('width', nw);
    this.setAttribute('height', nh);
    break;

  case "text":
    this.setAttribute(
      'font-size',
      parseFloat(this.getAttribute('font-size')) * arg
    );
    break;

  // Scaling a polygon is a more difficult task because its co-ordinates
  // are encoded only in a string form, and that string needs parsing. The
  // methods for manipulating paths, `parsePathString()` and
  // `pathToRelative()`, are defined in this module, but they live in the
  // `Y.ACMACS` namespace. Scaling a polygon works by moving the first element
  // of the path command (which is absolute) and then scaling all remaning
  // parameters, which are relative.
  case "path":
    path = Y.ACMACS.pathToRelative(
      Y.ACMACS.parsePathString(
        this.getAttribute('d')
      )
    );
    x = path[0][1];
    y = path[0][2];
    cx = this.X;
    cy = this.Y;
    x = cx - arg * (cx - x);
    y = cy - arg * (cy - y);
    path[0][1] = x;
    path[0][2] = y;

    // Now, because the path is relative, all command parameters can be scaled
    // independently.
    Y.some(path, function (command, index) {
      var i;
      if (index === 0 || command[0] === 'z') {
        return false;
      }
      for (i = 1; i < command.length; i += 1) {
        path[index][i] *= arg;
      }
    });
    this.setAttribute('d', path.toString());
    break;

  default:
    throw new Error("don't know how to scale " + this.tagName);
  }

  this.size *= arg;

  return this;
}; // scale()


/**
 * Returns a list of nodes hit by an event.
 *
 * http://my.opera.com/MacDev_ed/blog/2010/02/01/how-to-get-all-svg-elements-intersected-by-a-given-rectangle
 *
 * This method is only implemented it Chrome and it almost never works because
 * of rounding errors.
 *
 * @method hitList
 */
SVGSVGElement.prototype.hitList = function (e) {
  var rect = this.createSVGRect();
  rect.x = e.clientX;
  rect.y = e.clientY;
  rect.width = rect.height = 1;
  return this.getIntersectionList(rect, null);
};


// ----------------------------------------------------------------------
// SVGGElement methods
// ----------------------------------------------------------------------
/**
 * Extensions to SVGGElement required by ACMACS
 * @class SVGGElement
 * @static
 */

/**
 * Parses the `transform` attribute of the group node and converts to
 * an SVGMatrix.
 *
 * @method getTransformation
 * @return SVGMatrix
 */
SVGGElement.prototype.getTransformation = function () {
  var
    t = Y.ACMACS.newSVGMatrix(),
    str = this.getAttribute('transform'),
    list;

  if (str) {
    if (str.match('matrix')) {
      list = str.split(/[()]/);
      str = list[1];
      list = str.split(/[ ,]+/);
      Y.each(['a', 'b', 'c', 'd', 'e', 'f'], function (k, i) {
        t[k] = parseFloat(list[i]);
      });
    }
    if (str.match('translate')) {
      list = str.split(/[()]/);
      str = list[1];
      list = str.split(/[ ,]+/);
      t = t.translate(
        parseFloat(list[0]),
        parseFloat(list[1])
      );
    }
  }

  return t;
};


/**
 * Converts a 6-element transformation matrix (`SVGMatrix`) into a string
 * compliant with the SVG `transform` attribute and appends it to the existing
 * `transform` attribute of the group node.
 *
 * This method is presently not used.
 *
 * @method appendTransformation
 * @param SVGMatrix
 */
SVGGElement.prototype.appendTransformation = function (matrix) {
  var current = this.getAttribute('transform');

  if (current) {
    this.setAttribute('transform',
      current +
      ' matrix(' +
        matrix.a + ',' +
        matrix.b + ',' +
        matrix.c + ',' +
        matrix.d + ',' +
        matrix.e + ',' +
        matrix.f +
      ')'
    );
  }
  else {
    this.applyTransformation(matrix);
  }
};


/**
Multiplies the existing transformation defined on the group by the matrix
supplied.

Unlike [applyTransformation()](../classes/SVGElement.html#method_applyTransformation),
which simply sets the `transform` property of the node to the argument
supplied, this method combines the supplied and the previously existing
transformation.

It has the same effect as the appendTrransformation() methed above,
except it does not maintain the factorised form of the resultant transformation.

The awkward name avoids name collision with the even more awkwardly named
`transform` property on the DOM node.

@method transformBy
@param {SVGMatrix} matrix
*/
SVGGElement.prototype.transformBy = function (matrix) {
  var t = this.getTransformation().multiply(matrix);

  this.setAttribute('transform',
    'matrix(' +
      t.a + ',' +
      t.b + ',' +
      t.c + ',' +
      t.d + ',' +
      t.e + ',' +
      t.f +
    ')'
  );
};


/**
 * Parses the `transform` attribute of the group node and returns
 * its translational component as an object with `x` and `y` properties.
 *
 * @method getTranslation
 * @return Object
 */
SVGGElement.prototype.getTranslation = function () {
  var
    str = this.getAttribute('transform'),
    list;

  if (str) {
    if (str.match('matrix')) {
      // return the translational component
      list = str.split(/[()]/);
      str = list[1];
      list = str.split(/[ ,]+/);
      return {x: parseFloat(list[4]), y: parseFloat(list[5])};
    }

    if (str.match('translate')) {
      list = str.split(/[()]/);
      str = list[1];
      list = str.split(/[ ,]+/);
      return {x: parseFloat(list[0]), y: parseFloat(list[1])};
    }

    throw new Error("can't extract translation from " + str);
  }

  return {x: 0, y: 0};
};


/**
 * Converts a pair of numbers to a `translate` formula compliant
 * with the SVG `transform` attribute and applies it to the group node.
 *
 * @method applyTranslation
 * @param {Number} x x-displacement
 * @param {Number} y y-displacement
 */
SVGGElement.prototype.applyTranslation = function (x, y) {
  this.setAttribute('transform', 'translate(' + x + ', ' + y + ')');
};


/**
Parses the `transform` attribute of the group node and returns
its rotatioanal component as an object with `x`, `y` and `angle`
properties.

@method getRotation
@return {Object}
    {
      x: centreX,
      y: centreY,
      angle: rotation
    }
*/
SVGGElement.prototype.getRotation = function () {
  var
    str = this.getAttribute('transform'),
    list,
    cos,
    sin,
    ef, // the container for the e and f elemenst of the rotation matrix
    m,  // the matrix transforming the pivot point to (e, f)
    p;  // pivot point, p = (inverse m) * ef

  // Pivot point equation:
  //
  //  | 1 - cos   sin   |   | x |   | e |
  //  |                 | * |   | = |   |
  //  |   sin   1 - cos |   | y |   | f |
  //
  // cos: rotation matrix [a]
  // sin: rotation matrix [b]
  // (e, f): rotation matrix [e, f]
  // (x, y): pivot point

  if (str) {
    if (str.match('matrix')) {
      list = str.split(/[()]/);
      str = list[1];
      list = str.split(/[ ,]+/);

      cos = parseFloat(list[0]);  /* a */
      sin = parseFloat(list[1]);  /* b */
      if (cos === 1 && sin === 0) {
        return {angle: 0, x: 0, y: 0};
      }

      // calculate the pivot point
      ef = Y.ACMACS.newSVGPoint(list[4], list[5]); /* e, f */
      m = Y.ACMACS.newSVGMatrix({
        a: 1 - cos,
        b: -sin,
        c: sin,
        d: 1 - cos,
        e: 0,
        f: 0
      });
      p = ef.matrixTransform(m.inverse());

      return {
        angle: Math.atan2(sin, cos) * 360 / (2 * Math.PI),
        x: p.x,
        y: p.y
      };
    }

    throw new Error("can't extract rotation from " + str);
  }

  return {angle: 0, x: 0, y: 0};
}; // getRotation()


/**
 * Applies a reflection transformation determined by the line
 * passing through points `p1` and `p2`.
 *
 * @method reflectThroughLine
 * @param {SVGPoint|Object} p1
 * @param {SVGPoint|Object} p2
 */
SVGGElement.prototype.reflectThroughLine = function (p1, p2) {
  var
    slope,
    intercept,
    angle;

  if (p1.x === p2.x) {
    // this.appendTransformation(
    this.transformBy(
      Y.ACMACS.newSVGMatrix()
      .translate(p1.x, 0)
      .multiply(Y.ACMACS.reflectY)
      .translate(-p1.x, 0)
    );
  }
  else {
    slope = (p1.y - p2.y) / (p1.x - p2.x);
    intercept = p2.y - slope * p2.x;
    angle = Math.atan(slope) * 360 / Math.PI;
    // this.appendTransformation(
    this.transformBy(
      Y.ACMACS.newSVGMatrix()
      .translate(0, intercept)
      .rotate(angle)
      .multiply(Y.ACMACS.reflectX)
      .translate(0, -intercept)
    );
  }
}; // reflectThroughLine()


// ----------------------------------------------------------------------
// SVGLineElement methods
// ----------------------------------------------------------------------
/**
 * Extensions to SVGLineElement required by ACMACS
 * @class SVGLineElement
 * @static
 */

/**
 * Simulate the scaling transformation of a line by spreading its ends
 * away from the zoom centre
 *
 * @method fakeZoom
 * @param {Number} px x-coordinate of zoom centre
 * @param {Number} py y-coordinate of zoom centre
 * @param {Number} delta zoom factor increment (difference from 1)
 * @return {Array} translation vector
 */
SVGLineElement.prototype.fakeZoom = function (px, py, delta) {
  //
  var x1, y1, x2, y2, dx, dy;

  x1 = parseFloat(this.getAttribute('x1'));
  y1 = parseFloat(this.getAttribute('y1'));
  x2 = parseFloat(this.getAttribute('x2'));
  y2 = parseFloat(this.getAttribute('y2'));
  dx = delta * (x1 - px);
  dy = delta * (y1 - py);
  x1 += dx;
  y1 += dy;
  dx = delta * (x2 - px);
  dy = delta * (y2 - py);
  x2 += dx;
  y2 += dy;
  this.setAttribute('x1', x1);
  this.setAttribute('y1', y1);
  this.setAttribute('x2', x2);
  this.setAttribute('y2', y2);
  //
  return [dx, dy];
}; // fakeZoom


/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
