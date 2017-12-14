YUI.add('svg-intersect', function(Y) {

/**
 * Extensions to SVGPathElement and SVGLineElement that allow
 * finding their intersection points.
 *
 * After [Kevin Lindsey](http://www.kevlindev.com/geometry/2D/intersections/index.htm)
 *
 * The following changes were made in the original module:
 *
 *  * Removed all interactivity, including the Handle class
 *    (all occurences of Handle were replaced with Point2D)
 *  * Removed many unused methods from Intersection, Polynomial,
 *    Vector2D, and Point2D
 *  * Removed toString() methods from all objects
 *
 * @module acmacs-base
 * @submodule svg-intersect
 */

/*global Y: false */
var Intersection;

// ----------------------------------------------------------------------
// Point2D methods
// ----------------------------------------------------------------------

/**
 * This class has includes a small subset of Kevin Lindsey's original
 * Point2D, just enough to support line-path intersections.
 *
 * @class Point2D
 * @constructor
 * @param {Number} x
 * @param {Number} y
 */
function Point2D(x, y) {
  if (arguments.length > 0) {
    this.x = x;
    this.y = y;
  }
}

Point2D.prototype.add = function (that) {
  return new Point2D(this.x + that.x, this.y + that.y);
};

Point2D.prototype.multiply = function (scalar) {
  return new Point2D(this.x * scalar, this.y * scalar);
};

Point2D.prototype.lte = function (that) {
  return (this.x <= that.x && this.y <= that.y);
};

Point2D.prototype.gte = function (that) {
  return (this.x >= that.x && this.y >= that.y);
};

Point2D.prototype.lerp = function (that, t) {
  return new Point2D(this.x + (that.x - this.x) * t, this.y + (that.y - this.y) * t);
};

Point2D.prototype.min = function (that) {
  return new Point2D(Math.min(this.x, that.x), Math.min(this.y, that.y));
};

Point2D.prototype.max = function (that) {
  return new Point2D(Math.max(this.x, that.x), Math.max(this.y, that.y));
};


// ----------------------------------------------------------------------
// Vector2D methods
// ----------------------------------------------------------------------

/**
 * The Vector2D class represents a vector originating at [0, 0]
 * two SVG-derived shapes.
 *
 * This is a mere vestige of Kevin Lindsey's original Vector2D;
 * it is only here to support a dot-product of two vertors.
 *
 * @class Vector2D
 * @constructor
 * @param {Number} x
 * @param {Number} y
 */
function Vector2D(x, y) {
  if (arguments.length > 0) {
    this.x = x;
    this.y = y;
  }
}

/**
 * Dot-product of two vectors.
 *
 * @method dot
 * @param {Vector2D} that The other vector
 */
Vector2D.prototype.dot = function (that) {
  return this.x * that.x + this.y * that.y;
};


// ----------------------------------------------------------------------
// IntersectionParams
// ----------------------------------------------------------------------

/**
 * The IntersectionParams class represents a parameter group to be
 * passed to particular intersect methods, making those methods
 * polymorphic.
 *
 * @class IntersectionParams
 * @constructor
 * @private
 */
function IntersectionParams(name, params) {
  if (arguments.length > 0) {
    this.init(name, params);
  }
}

IntersectionParams.prototype.init = function (name, params) {
  this.name = name;
  this.params = params;
};



// ----------------------------------------------------------------------
// Shape methods
// ----------------------------------------------------------------------

/**
 * This is the prototype for all SVG node wrappers that gives them
 * the svgNode property.
 *
 * @class Shape
 * @private
 * @constructor
 */
function Shape(svgNode) {
  if (arguments.length > 0) {
    this.init(svgNode);
  }
}

Shape.prototype.init = function (svgNode) {
  this.svgNode = svgNode;
};


// ----------------------------------------------------------------------
// Line methods
// ----------------------------------------------------------------------

/**
 * This is an object wrapper for SVGLineElement. It gets initialised
 * with the data from an existing node.
 *
 * @class Line
 * @private
 * @constructor
 */
function Line(svgNode) {
  if (arguments.length > 0) {
    this.init(svgNode);
  }
}
Line.prototype = new Shape();
Line.prototype.constructor = Line;
Line.superclass = Shape.prototype;
Y.namespace('ACMACS').Line = Line;

Line.prototype.init = function (svgNode) {
  var x1, x2, y1, y2;
  if (svgNode === null || svgNode.localName !== 'line') {
    throw new Error('Line.init: Invalid localName: ' + svgNode.localName);
  }
  Line.superclass.init.call(this, svgNode);
  x1 = parseFloat(svgNode.getAttributeNS(null, 'x1'));
  y1 = parseFloat(svgNode.getAttributeNS(null, 'y1'));
  x2 = parseFloat(svgNode.getAttributeNS(null, 'x2'));
  y2 = parseFloat(svgNode.getAttributeNS(null, 'y2'));
  this.p1 = new Point2D(x1, y1);
  this.p2 = new Point2D(x2, y2);
};

Line.prototype.cut = function (t) {
  var cutPoint, line, newLine;

  cutPoint = this.p1.lerp(this.p2, t);
  newLine = this.svgNode.cloneNode(true);
  this.p2.setFromPoint(cutPoint);
  if (this.svgNode.nextSibling !== null) {
    this.svgNode.parentNode.insertBefore(newLine, this.svgNode.nextSibling);
  }
  else {
    this.svgNode.parentNode.appendChild(newLine);
  }
  line = new Line(newLine);
  line.p1.setFromPoint(cutPoint);
};

Line.prototype.getIntersectionParams = function () {
  return new IntersectionParams('Line', [this.p1, this.p2]);
};


// ----------------------------------------------------------------------
// Path methods
// ----------------------------------------------------------------------

/**
 * This is an object wrapper for SVGPathElement. It gets initialised
 * with the data from an existing node.
 *
 * @class Path
 * @private
 * @constructor
 */
function Path(svgNode) {
  if (arguments.length > 0) {
    this.init(svgNode);
  }
}
Y.namespace('ACMACS').Path = Path;

Path.prototype = new Shape();
Path.prototype.constructor = Path;
Path.superclass = Shape.prototype;
Path.COMMAND = 0;
Path.NUMBER = 1;
Path.EOD = 2;
Path.PARAMS = {
  A: ['rx', 'ry', 'x-axis-rotation', 'large-arc-flag', 'sweep-flag', 'x', 'y'],
  a: ['rx', 'ry', 'x-axis-rotation', 'large-arc-flag', 'sweep-flag', 'x', 'y'],
  C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  c: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  H: ['x'],
  h: ['x'],
  L: ['x', 'y'],
  l: ['x', 'y'],
  M: ['x', 'y'],
  m: ['x', 'y'],
  Q: ['x1', 'y1', 'x', 'y'],
  q: ['x1', 'y1', 'x', 'y'],
  S: ['x2', 'y2', 'x', 'y'],
  s: ['x2', 'y2', 'x', 'y'],
  T: ['x', 'y'],
  t: ['x', 'y'],
  V: ['y'],
  v: ['y'],
  Z: [],
  z: []
};

Path.prototype.init = function (svgNode) {
  if (svgNode === null || svgNode.localName !== 'path') {
    throw new Error('Path.init: Invalid localName: ' + svgNode.localName);
  }
  Path.superclass.init.call(this, svgNode);
  this.segments = null;
  this.parseData(svgNode.getAttributeNS(null, 'd'));
};

Path.prototype.appendPathSegment = function (segment) {
  segment.previous = this.segments[this.segments.length - 1];
  this.segments.push(segment);
};

Path.prototype.parseData = function (d) {
  var
    tokens = this.tokenize(d),
    index = 0,
    token = tokens[index],
    mode = 'BOD',
    param_length,
    params,
    number,
    segment,
    previous,
    length,
    i;

  function AbsolutePathSegment(command, params, owner, previous) {
    if (arguments.length > 0) {
      this.init(command, params, owner, previous);
    }
  }

  AbsolutePathSegment.prototype.init = function (command, params, owner, previous) {
    var
      handle,
      index = 0;

    this.command = command;
    this.owner = owner;
    this.previous = previous;
    this.handles = [];
    while (index < params.length) {
      handle = new Point2D(params[index], params[index + 1]);
      this.handles.push(handle);
      index += 2;
    }
  };

  AbsolutePathSegment.prototype.getLastPoint = function () {
    return this.handles[this.handles.length - 1];
  };

  AbsolutePathSegment.prototype.getIntersectionParams = function () {
    return null;
  };

  function AbsoluteArcPath(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('A', params, owner, previous);
    }
  }
  AbsoluteArcPath.prototype = new AbsolutePathSegment();
  AbsoluteArcPath.prototype.constructor = AbsoluteArcPath;
  AbsoluteArcPath.superclass = AbsolutePathSegment.prototype;

  AbsoluteArcPath.prototype.init = function (command, params, owner, previous) {
    var
      point = [],
      y = params.pop(),
      x = params.pop();

    point.push(x, y);
    AbsoluteArcPath.superclass.init.call(this, command, point, owner, previous);
    this.rx = parseFloat(params.shift());
    this.ry = parseFloat(params.shift());
    this.angle = parseFloat(params.shift());
    this.arcFlag = parseFloat(params.shift());
    this.sweepFlag = parseFloat(params.shift());
  };

  AbsoluteArcPath.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Ellipse', [this.getCenter(), this.rx, this.ry]);
  };

  AbsoluteArcPath.prototype.getCenter = function () {
    var
      startPoint = this.previous.getLastPoint(),
      endPoint = this.handles[0],
      rx = this.rx,
      ry = this.ry,
      angle = this.angle * Math.PI / 180,
      c = Math.cos(angle),
      s = Math.sin(angle),
      TOLERANCE = 1e-6,
      halfDiff = startPoint.subtract(endPoint).divide(2),
      x1p = halfDiff.x * c + halfDiff.y * s,
      y1p = halfDiff.x * -s + halfDiff.y * c,
      x1px1p = x1p * x1p,
      y1py1p = y1p * y1p,
      lambda = (x1px1p / (rx * rx)) + (y1py1p / (ry * ry)),
      rxrx,
      ryry,
      rxy1,
      ryx1,
      factor,
      sq,
      mid,
      cxp,
      cyp;

    if (lambda > 1) {
      factor = Math.sqrt(lambda);
      rx *= factor;
      ry *= factor;
    }

    rxrx = rx * rx;
    ryry = ry * ry;
    rxy1 = rxrx * y1py1p;
    ryx1 = ryry * x1px1p;
    factor = (rxrx * ryry - rxy1 - ryx1) / (rxy1 + ryx1);

    if (Math.abs(factor) < TOLERANCE) {
      factor = 0;
    }

    sq = Math.sqrt(factor);

    if (this.arcFlag === this.sweepFlag) {
      sq = -sq;
    }

    mid = startPoint.add(endPoint).divide(2);
    cxp = sq * rx * y1p / ry;
    cyp = sq * -ry * x1p / rx;

    return new Point2D(cxp * c - cyp * s + mid.x, cxp * s + cyp * c + mid.y);
  };

  function AbsoluteCurveto2(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('Q', params, owner, previous);
    }
  }
  AbsoluteCurveto2.prototype = new AbsolutePathSegment();
  AbsoluteCurveto2.prototype.constructor = AbsoluteCurveto2;
  AbsoluteCurveto2.superclass = AbsolutePathSegment.prototype;
  AbsoluteCurveto2.prototype.getControlPoint = function () {
    return this.handles[0];
  };

  AbsoluteCurveto2.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Bezier2', [this.previous.getLastPoint(), this.handles[0], this.handles[1]]);
  };

  function AbsoluteCurveto3(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('C', params, owner, previous);
    }
  }
  AbsoluteCurveto3.prototype = new AbsolutePathSegment();
  AbsoluteCurveto3.prototype.constructor = AbsoluteCurveto3;
  AbsoluteCurveto3.superclass = AbsolutePathSegment.prototype;
  AbsoluteCurveto3.prototype.getLastControlPoint = function () {
    return this.handles[1];
  };
  AbsoluteCurveto3.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Bezier3', [this.previous.getLastPoint(), this.handles[0], this.handles[1], this.handles[2]]);
  };

  function AbsoluteMoveto(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('M', params, owner, previous);
    }
  }
  AbsoluteMoveto.prototype = new AbsolutePathSegment();
  AbsoluteMoveto.prototype.constructor = AbsoluteMoveto;
  AbsoluteMoveto.superclass = AbsolutePathSegment.prototype;

  function AbsoluteHLineto(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('H', params, owner, previous);
    }
  }
  AbsoluteHLineto.prototype = new AbsolutePathSegment();
  AbsoluteHLineto.prototype.constructor = AbsoluteHLineto;
  AbsoluteHLineto.superclass = AbsolutePathSegment.prototype;
  AbsoluteHLineto.prototype.init = function (command, params, owner, previous) {
    var
      prevPoint = previous.getLastPoint(),
      point = [];
    point.push(params.pop(), prevPoint.y);
    AbsoluteHLineto.superclass.init.call(this, command, point, owner, previous);
  };

  function AbsoluteLineto(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('L', params, owner, previous);
    }
  }
  AbsoluteLineto.prototype = new AbsolutePathSegment();
  AbsoluteLineto.prototype.constructor = AbsoluteLineto;
  AbsoluteLineto.superclass = AbsolutePathSegment.prototype;
  AbsoluteLineto.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Line', [this.previous.getLastPoint(), this.handles[0]]);
  };

  function AbsoluteSmoothCurveto2(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('T', params, owner, previous);
    }
  }
  AbsoluteSmoothCurveto2.prototype = new AbsolutePathSegment();
  AbsoluteSmoothCurveto2.prototype.constructor = AbsoluteSmoothCurveto2;
  AbsoluteSmoothCurveto2.superclass = AbsolutePathSegment.prototype;
  AbsoluteSmoothCurveto2.prototype.getControlPoint = function () {
    var
      lastPoint = this.previous.getLastPoint(),
      ctrlPoint,
      diff,
      point;
    if (this.previous.command.match(/^[QqTt]$/)) {
      ctrlPoint = this.previous.getControlPoint();
      diff = ctrlPoint.subtract(lastPoint);
      point = lastPoint.subtract(diff);
    } else {
      point = lastPoint;
    }
    return point;
  };
  AbsoluteSmoothCurveto2.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Bezier2', [this.previous.getLastPoint(), this.getControlPoint(), this.handles[0]]);
  };

  function AbsoluteSmoothCurveto3(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('S', params, owner, previous);
    }
  }
  AbsoluteSmoothCurveto3.prototype = new AbsolutePathSegment();
  AbsoluteSmoothCurveto3.prototype.constructor = AbsoluteSmoothCurveto3;
  AbsoluteSmoothCurveto3.superclass = AbsolutePathSegment.prototype;
  AbsoluteSmoothCurveto3.prototype.getFirstControlPoint = function () {
    var
      lastPoint = this.previous.getLastPoint(),
      lastControl,
      diff,
      point;
    if (this.previous.command.match(/^[SsCc]$/)) {
      lastControl = this.previous.getLastControlPoint();
      diff = lastControl.subtract(lastPoint);
      point = lastPoint.subtract(diff);
    } else {
      point = lastPoint;
    }
    return point;
  };
  AbsoluteSmoothCurveto3.prototype.getLastControlPoint = function () {
    return this.handles[0];
  };
  AbsoluteSmoothCurveto3.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Bezier3', [this.previous.getLastPoint(), this.getFirstControlPoint(), this.handles[0], this.handles[1]]);
  };

  function RelativePathSegment(command, params, owner, previous) {
    if (arguments.length > 0) {
      this.init(command, params, owner, previous);
    }
  }
  RelativePathSegment.prototype = new AbsolutePathSegment();
  RelativePathSegment.prototype.constructor = RelativePathSegment;
  RelativePathSegment.superclass = AbsolutePathSegment.prototype;
  RelativePathSegment.prototype.init = function (command, params, owner, previous) {
    var
      lastPoint,
      handle,
      index = 0;
    this.command = command;
    this.owner = owner;
    this.previous = previous;
    this.handles = [];
    if (this.previous) {
      lastPoint = this.previous.getLastPoint();
    }
    else {
      lastPoint = new Point2D(0, 0);
    }
    while (index < params.length) {
      handle = new Point2D(lastPoint.x + params[index], lastPoint.y + params[index + 1]);
      this.handles.push(handle);
      index += 2;
    }
  };

  function RelativeClosePath(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('z', params, owner, previous);
    }
  }
  RelativeClosePath.prototype = new RelativePathSegment();
  RelativeClosePath.prototype.constructor = RelativeClosePath;
  RelativeClosePath.superclass = RelativePathSegment.prototype;
  RelativeClosePath.prototype.getLastPoint = function () {
    var
      point,
      current = this.previous;
    while (current) {
      if (current.command.match(/^[mMzZ]$/)) {
        point = current.getLastPoint();
        break;
      }
      current = current.previous;
    }
    return point;
  };
  RelativeClosePath.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Line', [this.previous.getLastPoint(), this.getLastPoint()]);
  };

  function RelativeCurveto2(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('q', params, owner, previous);
    }
  }
  RelativeCurveto2.prototype = new RelativePathSegment();
  RelativeCurveto2.prototype.constructor = RelativeCurveto2;
  RelativeCurveto2.superclass = RelativePathSegment.prototype;
  RelativeCurveto2.prototype.getControlPoint = function () {
    return this.handles[0];
  };
  RelativeCurveto2.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Bezier2', [this.previous.getLastPoint(), this.handles[0], this.handles[1]]);
  };

  function RelativeCurveto3(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('c', params, owner, previous);
    }
  }
  RelativeCurveto3.prototype = new RelativePathSegment();
  RelativeCurveto3.prototype.constructor = RelativeCurveto3;
  RelativeCurveto3.superclass = RelativePathSegment.prototype;
  RelativeCurveto3.prototype.getLastControlPoint = function () {
    return this.handles[1];
  };
  RelativeCurveto3.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Bezier3', [this.previous.getLastPoint(), this.handles[0], this.handles[1], this.handles[2]]);
  };

  function RelativeLineto(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('l', params, owner, previous);
    }
  }
  RelativeLineto.prototype = new RelativePathSegment();
  RelativeLineto.prototype.constructor = RelativeLineto;
  RelativeLineto.superclass = RelativePathSegment.prototype;
  RelativeLineto.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Line', [this.previous.getLastPoint(), this.handles[0]]);
  };

  function RelativeMoveto(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('m', params, owner, previous);
    }
  }
  RelativeMoveto.prototype = new RelativePathSegment();
  RelativeMoveto.prototype.constructor = RelativeMoveto;
  RelativeMoveto.superclass = RelativePathSegment.prototype;

  function RelativeSmoothCurveto2(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('t', params, owner, previous);
    }
  }
  RelativeSmoothCurveto2.prototype = new RelativePathSegment();
  RelativeSmoothCurveto2.prototype.constructor = RelativeSmoothCurveto2;
  RelativeSmoothCurveto2.superclass = RelativePathSegment.prototype;
  RelativeSmoothCurveto2.prototype.getControlPoint = function () {
    var
      point,
      ctrlPoint,
      lastPoint = this.previous.getLastPoint(),
      diff;
    if (this.previous.command.match(/^[QqTt]$/)) {
      ctrlPoint = this.previous.getControlPoint();
      diff = ctrlPoint.subtract(lastPoint);
      point = lastPoint.subtract(diff);
    } else {
      point = lastPoint;
    }
    return point;
  };
  RelativeSmoothCurveto2.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Bezier2', [this.previous.getLastPoint(), this.getControlPoint(), this.handles[0]]);
  };

  function RelativeSmoothCurveto3(params, owner, previous) {
    if (arguments.length > 0) {
      this.init('s', params, owner, previous);
    }
  }
  RelativeSmoothCurveto3.prototype = new RelativePathSegment();
  RelativeSmoothCurveto3.prototype.constructor = RelativeSmoothCurveto3;
  RelativeSmoothCurveto3.superclass = RelativePathSegment.prototype;
  RelativeSmoothCurveto3.prototype.getFirstControlPoint = function () {
    var
      point,
      lastControl,
      lastPoint = this.previous.getLastPoint(),
      diff;
    if (this.previous.command.match(/^[SsCc]$/)) {
      lastControl = this.previous.getLastControlPoint();
      diff = lastControl.subtract(lastPoint);
      point = lastPoint.subtract(diff);
    } else {
      point = lastPoint;
    }
    return point;
  };
  RelativeSmoothCurveto3.prototype.getLastControlPoint = function () {
    return this.handles[0];
  };
  RelativeSmoothCurveto3.prototype.getIntersectionParams = function () {
    return new IntersectionParams('Bezier3', [this.previous.getLastPoint(), this.getFirstControlPoint(), this.handles[0], this.handles[1]]);
  };

  // The parser code begins here.
  this.segments = [];
  while (!token.typeis(Path.EOD)) {
    params = [];
    if (mode === 'BOD') {
      if (token.text === 'M' || token.text === 'm') {
        index += 1;
        param_length = Path.PARAMS[token.text].length;
        mode = token.text;
      } else {
        throw new Error('Path data must begin with a moveto command');
      }
    } else {
      if (token.typeis(Path.NUMBER)) {
        param_length = Path.PARAMS[mode].length;
      } else {
        index += 1;
        param_length = Path.PARAMS[token.text].length;
        mode = token.text;
      }
    }
    if ((index + param_length) < tokens.length) {
      for (i = index; i < index + param_length; i += 1) {
        number = tokens[i];
        if (number.typeis(Path.NUMBER)) {
          params[params.length] = number.text;
        }
        else {
          throw new Error('Parameter type is not a number: ' + mode + ',' + number.text);
        }
      }
      length = this.segments.length;
      previous = (length === 0) ? null : this.segments[length - 1];
      switch (mode) {
      case 'A':
        segment = new AbsoluteArcPath(params, this, previous);
        break;
      case 'C':
        segment = new AbsoluteCurveto3(params, this, previous);
        break;
      case 'c':
        segment = new RelativeCurveto3(params, this, previous);
        break;
      case 'H':
        segment = new AbsoluteHLineto(params, this, previous);
        break;
      case 'L':
        segment = new AbsoluteLineto(params, this, previous);
        break;
      case 'l':
        segment = new RelativeLineto(params, this, previous);
        break;
      case 'M':
        segment = new AbsoluteMoveto(params, this, previous);
        break;
      case 'm':
        segment = new RelativeMoveto(params, this, previous);
        break;
      case 'Q':
        segment = new AbsoluteCurveto2(params, this, previous);
        break;
      case 'q':
        segment = new RelativeCurveto2(params, this, previous);
        break;
      case 'S':
        segment = new AbsoluteSmoothCurveto3(params, this, previous);
        break;
      case 's':
        segment = new RelativeSmoothCurveto3(params, this, previous);
        break;
      case 'T':
        segment = new AbsoluteSmoothCurveto2(params, this, previous);
        break;
      case 't':
        segment = new RelativeSmoothCurveto2(params, this, previous);
        break;
      case 'Z':
        segment = new RelativeClosePath(params, this, previous);
        break;
      case 'z':
        segment = new RelativeClosePath(params, this, previous);
        break;
      default:
        throw new Error('Unsupported segment type: ' + mode);
      }
      this.segments.push(segment);
      index += param_length;
      token = tokens[index];
      if (mode === 'M') {
        mode = 'L';
      }
      if (mode === 'm') {
        mode = 'l';
      }
    } else {
      throw new Error('Path data ended before all parameters were found');
    }
  }
};

Path.prototype.tokenize = function (d) {
  var tokens = [];

  function Token(type, text) {
    if (arguments.length > 0) {
      this.init(type, text);
    }
  }

  Token.prototype.init = function (type, text) {
    this.type = type;
    this.text = text;
  };

  Token.prototype.typeis = function (type) {
    return this.type === type;
  };

  while (d !== '') {
    if (d.match(/^([ \t\r\n,]+)/)) {
      d = d.substr(RegExp.$1.length);
    } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
      tokens[tokens.length] = new Token(Path.COMMAND, RegExp.$1);
      d = d.substr(RegExp.$1.length);
    } else if (d.match(/^(([\-+]?[0-9]+(\.[0-9]*)?|[\-+]?\.[0-9]+)([eE][\-+]?[0-9]+)?)/)) {
      tokens[tokens.length] = new Token(Path.NUMBER, parseFloat(RegExp.$1));
      d = d.substr(RegExp.$1.length);
    } else {
      throw new Error('Unrecognized segment command: ' + d);
    }
  }
  tokens[tokens.length] = new Token(Path.EOD, null);
  return tokens;
};

Path.prototype.intersectShape = function (shape) {
  var
    result = new Intersection('No Intersection'),
    inter,
    i;
  for (i = 0; i < this.segments.length; i += 1) {
    inter = Intersection.intersectShapes(this.segments[i], shape);
    result.appendPoints(inter.points);
  }
  if (result.points.length > 0) {
    result.status = 'Intersection';
  }
  return result;
};

Path.prototype.getIntersectionParams = function () {
  return new IntersectionParams('Path', []);
};



// ----------------------------------------------------------------------
// Polynomial methods
// ----------------------------------------------------------------------

/**
 * The Polynomial class represents a vector originating at [0, 0]
 * two SVG-derived shapes.
 *
 * This is a mere vestige of Kevin Lindsey's original Polynomial;
 * it is only here to support a dot-product of two vertors.
 *
 * @class Polynomial
 * @private
 * @constructor
 */
function Polynomial() {
  this.init(arguments);
}

Polynomial.TOLERANCE = 1e-6;
Polynomial.ACCURACY = 6;

Polynomial.prototype.init = function (coefs) {
  var i;
  this.coefs = [];
  for (i = coefs.length - 1; i >= 0; i -= 1) {
    this.coefs.push(coefs[i]);
  }
};

Polynomial.prototype.simplify = function () {
  var i;
  for (i = this.getDegree(); i >= 0; i -= 1) {
    if (Math.abs(this.coefs[i]) <= Polynomial.TOLERANCE) {
      this.coefs.pop();
    }
    else {
      break;
    }
  }
};

Polynomial.prototype.getDegree = function () {
  return this.coefs.length - 1;
};

Polynomial.prototype.getRoots = function () {
  var result;
  this.simplify();
  if (this.getDegree() === 3) {
    result = this.getCubicRoots();
  }
  else {
    result = [];
  }
  return result;
};

Polynomial.prototype.getCubicRoots = function () {
  var
    c3,
    c2,
    c1,
    c0,
    a,
    b,
    e,
    offset,
    discrim,
    halfB,
    tmp,
    distance,
    angle,
    cos,
    sin,
    sqrt3,
    root,
    results = [];

  if (this.getDegree() === 3) {
    c3 = this.coefs[3];
    c2 = this.coefs[2] / c3;
    c1 = this.coefs[1] / c3;
    c0 = this.coefs[0] / c3;
    a = (3 * c1 - c2 * c2) / 3;
    b = (2 * c2 * c2 * c2 - 9 * c1 * c2 + 27 * c0) / 27;
    offset = c2 / 3;
    discrim = b * b / 4 + a * a * a / 27;
    halfB = b / 2;
    if (Math.abs(discrim) <= Polynomial.TOLERANCE) {
      discrim = 0;
    }
    if (discrim > 0) {
      e = Math.sqrt(discrim);
      tmp = -halfB + e;
      if (tmp >= 0) {
        root = Math.pow(tmp, 1 / 3);
      }
      else {
        root = -Math.pow(-tmp, 1 / 3);
      }
      tmp = -halfB - e;
      if (tmp >= 0) {
        root += Math.pow(tmp, 1 / 3);
      }
      else {
        root -= Math.pow(-tmp, 1 / 3);
      }
      results.push(root - offset);
    }
    else if (discrim < 0) {
      distance = Math.sqrt(-a / 3);
      angle = Math.atan2(Math.sqrt(-discrim), -halfB) / 3;
      cos = Math.cos(angle);
      sin = Math.sin(angle);
      sqrt3 = Math.sqrt(3);
      results.push(2 * distance * cos - offset);
      results.push(-distance * (cos + sqrt3 * sin) - offset);
      results.push(-distance * (cos - sqrt3 * sin) - offset);
    } else {
      if (halfB >= 0) {
        tmp = -Math.pow(halfB, 1 / 3);
      }
      else {
        tmp = Math.pow(-halfB, 1 / 3);
      }
      results.push(2 * tmp - offset);
      results.push(-tmp - offset);
    }
  }
  return results;
};


// ----------------------------------------------------------------------
// Intersection methods
// ----------------------------------------------------------------------

/**
 * The Intersection class represents a set of intersection points between
 * two SVG-derived shapes.
 *
 * This implementation only knows how to compute intersection between a
 * Path and a Line.
 *
 * @class Intersection
 * @static
 */
function Intersection(status) {
  if (arguments.length > 0) {
    this.init(status);
  }
}

Intersection.prototype.init = function (status) {
  this.status = status;
  this.points = [];
};

Intersection.prototype.appendPoint = function (point) {
  this.points.push(point);
};

Intersection.prototype.appendPoints = function (points) {
  this.points = this.points.concat(points);
};

Y.namespace('ACMACS').intersectShapes =
Intersection.intersectShapes =
function (shape1, shape2) {
  var
    ip1 = shape1.getIntersectionParams(),
    ip2 = shape2.getIntersectionParams(),
    method,
    params,
    result;

  if (ip1 !== null && ip2 !== null) {
    if (ip1.name === 'Path') {
      result = Intersection.intersectPathShape(shape1, shape2);
    } else if (ip2.name === 'Path') {
      result = Intersection.intersectPathShape(shape2, shape1);
    } else {
      if (ip1.name < ip2.name) {
        method = 'intersect' + ip1.name + ip2.name;
        params = ip1.params.concat(ip2.params);
      } else {
        method = 'intersect' + ip2.name + ip1.name;
        params = ip2.params.concat(ip1.params);
      }
      if (!(Intersection.hasOwnProperty(method))) {
        throw new Error('Intersection not available: ' + method);
      }
      result = Intersection[method].apply(null, params);
    }
  } else {
    result = new Intersection('No Intersection');
  }
  return result;
};

Intersection.intersectPathShape = function (path, shape) {
  return path.intersectShape(shape);
};

Intersection.intersectBezier3Line = function (p1, p2, p3, p4, a1, a2) {
  var
    a, b, c, d,
    c3, c2, c1, c0,
    cl,
    i,
    n,
    min = a1.min(a2),
    max = a1.max(a2),
    t,
    p5, p6, p7, p8, p9, p10,
    roots,
    result = new Intersection('No Intersection');

  a = p1.multiply(-1);
  b = p2.multiply(3);
  c = p3.multiply(-3);
  d = a.add(b.add(c.add(p4)));
  c3 = new Vector2D(d.x, d.y);
  a = p1.multiply(3);
  b = p2.multiply(-6);
  c = p3.multiply(3);
  d = a.add(b.add(c));
  c2 = new Vector2D(d.x, d.y);
  a = p1.multiply(-3);
  b = p2.multiply(3);
  c = a.add(b);
  c1 = new Vector2D(c.x, c.y);
  c0 = new Vector2D(p1.x, p1.y);
  n = new Vector2D(a1.y - a2.y, a2.x - a1.x);
  cl = a1.x * a2.y - a2.x * a1.y;
  roots = new Polynomial(n.dot(c3), n.dot(c2), n.dot(c1), n.dot(c0) + cl).getRoots();
  for (i = 0; i < roots.length; i += 1) {
    t = roots[i];
    if (0 <= t && t <= 1) {
      p5 = p1.lerp(p2, t);
      p6 = p2.lerp(p3, t);
      p7 = p3.lerp(p4, t);
      p8 = p5.lerp(p6, t);
      p9 = p6.lerp(p7, t);
      p10 = p8.lerp(p9, t);
      if (a1.x === a2.x) {
        if (min.y <= p10.y && p10.y <= max.y) {
          result.status = 'Intersection';
          result.appendPoint(p10);
        }
      } else if (a1.y === a2.y) {
        if (min.x <= p10.x && p10.x <= max.x) {
          result.status = 'Intersection';
          result.appendPoint(p10);
        }
      } else if (p10.gte(min) && p10.lte(max)) {
        result.status = 'Intersection';
        result.appendPoint(p10);
      }
    }
  }
  return result;
}; // intersectBezier3Line


Intersection.intersectLineLine = function (a1, a2, b1, b2) {
  var
    ua,
    ub,
    ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
    ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
    u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y),
    result;

  if (u_b !== 0) {
    ua = ua_t / u_b;
    ub = ub_t / u_b;
    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      result = new Intersection('Intersection');
      result.points.push(new Point2D(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)));
    } else {
      result = new Intersection('No Intersection');
    }
  } else {
    if (ua_t === 0 || ub_t === 0) {
      result = new Intersection('Coincident');
    } else {
      result = new Intersection('Parallel');
    }
  }
  return result;
};

}, '@VERSION@', {
  requires: []
});
/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */

