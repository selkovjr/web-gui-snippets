YUI.add('acmacs-connections', function(Y) {

// ======================================================================

/*global Y: false, document: false */
Y.namespace('ACMACS').ConnectionsLayer = Y.Base.create('acmacsConnectionsLayer', Y.Widget, [Y.ACMACS.WidgetTreeNode], {
  CONTENT_TEMPLATE: null,

  kind: 'canvas',

  can: {
    pan: true,
    rotate: true,
    zoom: true,
    flip: true
  },

  monolithic: true,

  simulated: false,

  // * Parameters affectng appearance or behaviour
  'default': {
    // These parameters provide sane defaults in the absence of
    // external configuration.

    // The line stroke width in pixels
    strokeWidth: 1
  },

  extendedBuffer: true,

  // * The number of nodes
  n: 0,

  // * The size of one display pixel in world co-ordinates.
  onePixel: null,

  // * The point in world co-ordinates marking the start of an interactive
  // transformation
  pickupPoint: null,

  // * Bounding box co-ordinates
  minX: undefined,
  minY: undefined,
  maxX: undefined,
  maxY: undefined,

  // * Line hash used to exclude co-incident lines
  lineHash: {},

  // HTML5 canvas node, its DOM node and painting context
  canvas: undefined,
  canvasDOMNode: undefined,
  bufferDOMNode: undefined,
  context: undefined,
  bufferContext: undefined,
  parent: undefined,
  rootWidget: undefined,

  initializer: function (config) {
    this.instanceName = config.instanceName;
    this.pickupPoint = {};
    // this.pan = this.transform;
    this.centredZoom = this.transform;
    this.pointerZoom = this.transform;
    this.centredRotate = this.transform;
    this.pointerRotate = this.transform;
    this.pointerFlip = this.transform;
    this.lines = {
      black: [],
      grey: [],
      red: [],
      blue: []
    };
    this.currentTransformation = Y.ACMACS.newSVGMatrix({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0
    });
  },

  destructor: function () {
    this.bufferContext = undefined;
    this.context = undefined;
    this.canvas = undefined;
    this.canvasDOMNode = undefined;
    this.bufferDOMNode = undefined;

    this.lines = undefined;
    this.currentTransformation = undefined;

    // Y.ACMACS.WidgetTreeNode properties
    this.parent = undefined;
    this.rootWidget = undefined;
  },

  renderUI: function () {
    this.contentBox = this.get('contentBox');

    this.contentBox.append(
      '<canvas class="acmacs-canvas">' +
      'This browser does not support the canvas element' +
      '</canvas>'
    );

    this.canvas = this.contentBox.one('canvas');
    this.canvasDOMNode = Y.Node.getDOMNode(this.canvas);

    this.context = this.canvasDOMNode.getContext('2d');
    if (!this.context) {
      throw new Error('could not create 2d context');
    }

    // this.buffer = Y.one('#renderBuffer');
    // this.bufferDOMNode = Y.Node.getDOMNode(Y.one('#renderBuffer'));
    this.bufferDOMNode = document.createElement('canvas');
    this.bufferContext = this.bufferDOMNode.getContext('2d');

    this.syncUI();
  }, // renderUI()

  syncUI: function () {
    var grad,
        width = this.get('width'),
        height = this.get('height'),
        canvas = this.canvasDOMNode,
        buffer = this.bufferDOMNode;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    if (this.extendedBuffer) {
      buffer.width = 2 * width;
      buffer.height = 2 * height;
    }
    else {
      buffer.width = width;
      buffer.height = height;
    }
  },

  // A dummy API call, to be consistent with other layers
  setDeviceDimensions: function (width, height) {
    this.syncUI();
  },

  clear: function () {
    this.clearCanvas();
    this.clearBuffer();
    this.lineHash = {};
  },

  clearCanvas: function () {
    this.context.clearRect(0, 0, this.get('width'), this.get('height'));
  },

  clearBuffer: function () {
    var b = this.getBBox();
    if (b) {
      this.bufferContext.clearRect(b.x, b.y, b.width, b.height);

      this.lines = {
        black: [],
        grey: [],
        red: [],
        blue: []
      };
      this.n = 0;

      this.minX = this.minY = this.maxX = this.maxY = undefined;
    }
  },


  // <a name="lineExists">
  // ### lineExists()

  // Test if a fully co-incident line exists and add the given line
  // to the layer's line hash if it does not. Co-incidence is determined
  // to the 10-th floating point digit.
  //
  lineExists: function (start, end) {
    var
      xs = start[0].toFixed(10),
      ys = start[1].toFixed(10),
      xe = end[0].toFixed(10),
      ye = end[1].toFixed(10),
      string = [xs, ys, xe, ye].join(':');


    if (this.lineHash[string]) {
      return true;
    }

    this.lineHash[string] = true;
    return false;
  },

  // ### plot()

  // Plot all connection lines and/or error lines
  //
  plot: function () {
    var data = this.rootWidget.get('data'),
        positive,
        connect,
        colour,
        selected = {},
        connection = {},
        pointsConnected = {},
        stroke,
        opacity,

        errorCount = 0,
        errorMessage;

    if (!data || !data.error_lines) {
      Y.log('no error line data to plot', 'warn', this.name);
    }
    // Determine the sign of the error.
    positive = Y.bind(function (p1, p2, probe) {
      var arg, t, r, s1, s2, sProbe;


      if (p1[0] === p2[0]) {
        return Math.abs(probe[1] - p2[1]) >= Math.abs(probe[1] - p1[1]);
      }

      arg = Math.atan((p2[1] - p1[1]) / (p2[0] - p1[0])) * 360 / (2 * Math.PI);
      t = Y.ACMACS.newSVGMatrix().rotate(-arg);
      s1 = this.parent.shadow.svgPoint(p1[0], p1[1]).matrixTransform(t);
      s2 = this.parent.shadow.svgPoint(p2[0], p2[1]).matrixTransform(t);
      sProbe = this.parent.shadow.svgPoint(probe[0], probe[1]).matrixTransform(t);
      return (
        (sProbe.x >= s1.x && s1.x >= s2.x) ||
        (sProbe.x <= s1.x && s1.x <= s2.x)
      );
    }, this);

    // Render titre or error lines in one direction: from antigens to sera or
    // from sera to antigens.
    connect = Y.bind(function (arg) {
      var
          // The set of pre-calculated error line endpoints pointing to the
          // opposite end of each of the the current point's connections
          errorLineEnd,

          // The co-ordinates of the current line's origin
          from,

          // The co-ordinates of the current line's destination
          to,

          nAntigens = data.error_lines.antigens.length,
          nSera = data.error_lines.sera.length,

          originIndex,
          destIndex,
          o, d;

      for (o = 0; o < data.error_lines[arg.from].length; o += 1) {
        if (arg.from === 'antigens') {
          originIndex = o;
        }
        else {
          originIndex = nAntigens + o;
        }

        if (Y.Object.keys(pointsConnected).length > this.get('connectionsMax')) {
          Y.log(Y.substitute(
            'Not all error/connection lines have been rendered: the limit of {limit} has been reached',
            {limit: this.get('connectionsMax')}
          ), 'warn', this.name);
          break;
        }

        // Ignore points that didn't make it past the initial sanity check
        if (!this.parent.map.pointList[originIndex]) {
          errorCount += 1;
          errorMessage = Y.substitute(
            'Line origin point {n} with co-ordinates ({x}, {y}) has not been plotted',
            {
              n: originIndex,
              x: Y.Lang.isUndefined(data.layout[originIndex][0]) ? 'undefined' : data.layout[originIndex][0],
              y: Y.Lang.isUndefined(data.layout[originIndex][1]) ? 'undefined' : data.layout[originIndex][1]
            }
          );
          // Y.log(errorMessage, 'warn', this.name);
          continue;
        }

        // If any points are selected, do not display connectiions or error
        // lines for those that are not.
        if (
          this.parent.map.get('selected') &&
          !this.parent.map.pointList[originIndex].selected
        ) {
          continue;
        }

        from = data.layout[originIndex];
        pointsConnected[from] = true;

        // Cache this point's selection status to reduce complex property
        // look-ups.
        selected[originIndex] = true;

        errorLineEnd = data.error_lines[arg.from][o];
        for (d = 0; d < errorLineEnd.length; d += 1) {
          if (arg.from === 'antigens') {
            destIndex = nAntigens + d;
          }
          else {
            destIndex = d;
          }

          // Ignore points that didn't make it past the initial sanity check
          if (!this.parent.map.pointList[destIndex]) {
            // Don't report the error because it will be caught later while
            // attempting to plot error lines at the opposite end of this
            // connection.
            continue;
          }

          if (
            connection[originIndex + ':' + destIndex] ||
            connection[destIndex + ':' + originIndex]
          ) {
            // This connection has already been plotted.
            continue;
          }

          to = data.layout[destIndex];

          if (positive(from, to, errorLineEnd[d])) {
            colour = 'red';
          }
          else {
            colour = 'blue';
          }

          if (this.get('renderConnectionLines')) {
            if (
              Y.Lang.isNumber(to[0]) &&
              Y.Lang.isNumber(to[1]) &&
              !this.lineExists(from, to)
            ) {
              this.addLine({
                start: from,
                end: to,
                stroke: 'grey'
              });
            }
            else {
              // Bail out if error line end has non-numeric co-ordinates
              errorCount += 1;
              errorMessage = Y.substitute(
                'Connection line from point {fIndex} ({fx}, {fy}) to point {tIndex} ({tx}, {ty}) has invalid co-ordinates',
                {
                  fIndex: originIndex,
                  tIndex: destIndex,
                  fx: Y.Lang.isUndefined(from[0]) ? 'undefined' : from[0],
                  fy: Y.Lang.isUndefined(from[1]) ? 'undefined' : from[1],
                  tx: Y.Lang.isUndefined(to[0]) ? 'undefined' : to[0],
                  ty: Y.Lang.isUndefined(to[1]) ? 'undefined' : to[1]
                }
              );
              // Y.log(errorMessage, 'warn', this.name);
            }
          }

          if (this.get('renderErrorLines')) {
            if (
              Y.Lang.isNumber(errorLineEnd[d][0]) &&
              Y.Lang.isNumber(errorLineEnd[d][1]) &&
              !this.lineExists(from, errorLineEnd[d])
            ) {
              this.addLine({
                start: from,
                end: errorLineEnd[d],
                stroke: colour
              });
            }
            else {
              // Bail out if error line end has non-numeric co-ordinates
              errorCount += 1;
              errorMessage = Y.substitute(
                'Proximal error line end ({x}, {y}) for point {n} with co-ordinates ({px}, {py}) is invalid',
                {
                  n: originIndex,
                  x: Y.Lang.isUndefined(errorLineEnd[d][0]) ? 'undefined' : errorLineEnd[d][0],
                  y: Y.Lang.isUndefined(errorLineEnd[d][1]) ? 'undefined' : errorLineEnd[d][1],
                  px: Y.Lang.isUndefined(data.layout[originIndex][0]) ? 'undefined' : data.layout[originIndex][0],
                  py: Y.Lang.isUndefined(data.layout[originIndex][1]) ? 'undefined' : data.layout[originIndex][1]
                }
              );
              // Y.log(errorMessage, 'warn', this.name);
            }
          }

          // Mark this connection to allow testing for duplicates.
          connection[originIndex + ':' + destIndex] = true;
        } // each destination point
      } // for each origin: connection lines or the near-end error lines

      // Render the error lines at the opposite end of each connection
      if (this.get('renderErrorLines')) {
        for (d = 0; d < data.error_lines[arg.to].length; d += 1) {
          if (arg.from === 'antigens') {
            destIndex = nAntigens + d;
          }
          else {
            destIndex = d;
          }

          // Ignore points that didn't make it to the map layer
          if (!this.parent.map.pointList[destIndex]) {
            errorCount += 1;
            errorMessage = Y.substitute(
              'Line end point {n} with co-ordinates ({x}, {y}) has not been plotted',
              {
                n: destIndex,
                x: Y.Lang.isUndefined(data.layout[destIndex][0]) ? 'undefined' : data.layout[destIndex][0],
                y: Y.Lang.isUndefined(data.layout[destIndex][1]) ? 'undefined' : data.layout[destIndex][1]
              }
            );
            // Y.log(errorMessage, 'warn', this.name);
            continue;
          }

          to = data.layout[destIndex];

          errorLineEnd = data.error_lines[arg.to][d];
          for (o = 0; o < errorLineEnd.length; o += 1) {
            if (arg.from === 'antigens') {
              originIndex = o;
            }
            else {
              originIndex = nAntigens + o;
            }
            from = data.layout[originIndex];

            if (connection[destIndex + ':' + originIndex]) {
              // This connection has already been plotted.
              continue;
            }

            // This filter selects only the error lines corresponding to selected points
            if (selected[originIndex]) {
              // Note the reversal of `to` and `from` in this case.
              if (positive(to, from, errorLineEnd[o])) {
                colour = 'red';
              }
              else {
                colour = 'blue';
              }

              if (
                Y.Lang.isNumber(errorLineEnd[o][0]) &&
                Y.Lang.isNumber(errorLineEnd[o][1]) &&
                !this.lineExists(to, errorLineEnd[o])
              ) {
                this.addLine({
                  start: to,
                  end: errorLineEnd[o],
                  stroke: colour
                });
              }
              else {
                // Bail out if error line end has non-numeric co-ordinates
                errorCount += 1;
                errorMessage = Y.substitute(
                  'Distal error line end ({x}, {y}) for point {n} with co-ordinates ({px}, {py}) is invalid',
                  {
                    n: originIndex,
                    x: Y.Lang.isUndefined(errorLineEnd[o][0]) ? 'undefined' : errorLineEnd[o][0],
                    y: Y.Lang.isUndefined(errorLineEnd[o][1]) ? 'undefined' : errorLineEnd[o][1],
                    px: Y.Lang.isUndefined(data.layout[originIndex][0]) ? 'undefined' : data.layout[originIndex][0],
                    py: Y.Lang.isUndefined(data.layout[originIndex][1]) ? 'undefined' : data.layout[originIndex][1]
                  }
                );
                // Y.log(errorMessage, 'warn', this.name);
              } // valid line end co-ordinates
            } // selection filter
          } // each origin
        } // each destination
      } // renderErrorLines (at the opposite end)
    }, this); // connect()

    this.clear();

    // Copy the current transformation from the shadow layer
    // this.applyTransformation(
    this.applyTransformationToBuffer(
      this.parent.shadow.groupDOMNode.getCTM()
    );

    this.setPixelSize();

    if (!data || !data.error_lines) {
      Y.log('bailing out because there is no data to plot', 'warn', this.name);
      return false;
    }

    if (this.get('renderConnectionLines') || this.get('renderErrorLines')) {
      // Because both antigens and sera can be selected for the rendering of
      // error and titre lines around them, there is a possibility for the same
      // line to be rendered twice. To avoid that, startwith antigens and mark
      // the end points of each line in a hash and then skip that line while
      // rendering the lines for sera.

      // First, draw the error lines for antigens
      connect({from: 'antigens', to: 'sera'});
      connect({from: 'sera', to: 'antigens'});

      // Render error lines
      this.bufferContext.lineWidth = 0.6 * this.onePixel;
      opacity = this.attributeOrProfileSetting('errorLineOpacity');

      // draw red lines
      stroke = [255, 0, 0];
      this.bufferContext.strokeStyle = 'rgba(' + stroke[0] + ',' +  stroke[1] + ',' +  stroke[2] + ',' + opacity + ')';
      this.bufferContext.beginPath();
      Y.each(this.lines.red, Y.bind(function (line) {
        this.bufferContext.moveTo(line[0][0], line[0][1]);
        this.bufferContext.lineTo(line[1][0], line[1][1]);
      }, this));
      this.bufferContext.stroke();
      this.bufferContext.closePath();

      // draw blue lines
      stroke = [0, 0, 255];
      this.bufferContext.strokeStyle = 'rgba(' + stroke[0] + ',' +  stroke[1] + ',' +  stroke[2] + ',' + opacity + ')';
      this.bufferContext.beginPath();
      Y.each(this.lines.blue, Y.bind(function (line) {
        this.bufferContext.moveTo(line[0][0], line[0][1]);
        this.bufferContext.lineTo(line[1][0], line[1][1]);
      }, this));
      this.bufferContext.stroke();
      this.bufferContext.closePath();

      // Render connection lines
      this.bufferContext.lineWidth = 0.4 * this.onePixel;
      opacity = this.attributeOrProfileSetting('connectionLineOpacity');

      // draw grey lines
      stroke = [128, 128, 128];
      this.bufferContext.strokeStyle = 'rgba(' + stroke[0] + ',' +  stroke[1] + ',' +  stroke[2] + ',' + opacity + ')';
      this.bufferContext.beginPath();
      Y.each(this.lines.grey, Y.bind(function (line) {
        this.bufferContext.moveTo(line[0][0], line[0][1]);
        this.bufferContext.lineTo(line[1][0], line[1][1]);
      }, this));
      this.bufferContext.stroke();
      this.bufferContext.closePath();
    }

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    if (this.extendedBuffer) {
      this.context.drawImage(
        this.bufferDOMNode,
        this.bufferDOMNode.width / 4,
        this.bufferDOMNode.height / 4,
        this.canvasDOMNode.width,
        this.canvasDOMNode.height,
        0,
        0,
        this.canvasDOMNode.width,
        this.canvasDOMNode.height
      );
    }
    else {
      this.context.drawImage(this.bufferDOMNode, 0, 0);
    }

    // Initialise the current transformation to be used in the pan() and flip()
    // methods that both translate the buffer content without changing it.
    this.currentTransformation = Y.ACMACS.newSVGMatrix({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0
    });

    if (errorCount > 0) {
      Y.log(Y.substitute(
        '{message}. It is the last of {n} errors in this plot',
        {
          message: errorMessage,
          n: errorCount
        }
      ), 'warn', this.name);
    }
  }, // plot()

  // <a name="addLine">
  // ### addLine()
  // Render a simple line
  addLine: function (arg) {
    // #### Line attributes:
    // * _Required_:
    //   * **start** = [**x**, **y**]
    //   * **end** = [**x**, **y**]
    // * _Optional_:
    //   * **stroke**: Stroke colour. _Default: black_

    var stroke;
    /* Tight bounding box */
    //    startPoint,
    //    endPoint;

    // Set style attributes
    if (arg.stroke !== undefined) {
      stroke = arg.stroke;
    }
    else {
      stroke = 'black';
    }

    this.lines[stroke].push([
      [arg.start[0], arg.start[1]],
      [arg.end[0], arg.end[1]]
    ]);

    this.n += 1;

    // Calculate the bounding box
    this.minX = [this.minX, arg.start[0], arg.end[0]].min();
    this.maxX = [this.maxX, arg.start[0], arg.end[0]].max();
    this.minY = [this.minY, arg.start[1], arg.end[1]].min();
    this.maxY = [this.maxY, arg.start[1], arg.end[1]].max();
  }, // addLine()

  // <a name="pointerPanStart">
  // ### pointerPanStart()

  // This method initialises the pan action on `mousedown`. If followed by
  // `mousemove` events, the data it saves are used to calculate the amount of
  // translation of the view. In the absence of subsequent move events, it has
  // no effect.

  pointerPanStart: function (e) {
    this.pickupPoint.x = e.x;
    this.pickupPoint.y = e.y;
  },

  pan: function (x, y) {

    // Clamp x between min and max
    function clamp(x, min, max) {
      if (x < min) {
        return min;
      }
      if (x > max) {
        return max;
      }
      return x;
    }

    // Calculate the amouunt by which x exceeds either min or max
    function excess(x, min, max) {
      if (x < min) {
        return x + min;
      }
      if (x > max) {
        return x - max;
      }
      return 0;
    }

    this.clearCanvas();
    this.currentTransformation = this.currentTransformation.translate(x, y);

    if (this.extendedBuffer) {
      // With the extended render buffer, panning is achieved by adding the
      // current tarnsformation's translational component to source offset in
      // drawImage(). If current pan offset exceeds render buffer margines,
      // fix the drawImage() source offset at the edge, using the clamp()
      // function, and continue panning by translating the destination context,
      // using the excess() function.
      this.context.setTransform(
        1, 0, 0, 1,
        -excess(
          this.bufferDOMNode.width / 4 - this.currentTransformation.e,
          0,
          this.canvasDOMNode.width
        ),
        -excess(
          this.bufferDOMNode.height / 4 - this.currentTransformation.f,
          0,
          this.canvasDOMNode.height
        )
      );
      this.context.drawImage(
        this.bufferDOMNode,
        clamp(
          this.bufferDOMNode.width / 4 - this.currentTransformation.e,
          0,
          this.canvasDOMNode.width
        ),
        clamp(
          this.bufferDOMNode.height / 4 - this.currentTransformation.f,
          0,
          this.canvasDOMNode.height
        ),
        this.canvasDOMNode.width,
        this.canvasDOMNode.height,
        0,
        0,
        this.canvasDOMNode.width,
        this.canvasDOMNode.height
      );
    }
    else {
      // With the render buffer of the matching size, panning is achieved by
      // translating the context.
      this.context.setTransform(
        1, 0, 0, 1,
        this.currentTransformation.e,
        this.currentTransformation.f
      );
      this.context.drawImage(this.bufferDOMNode, 0, 0);
    }
  },

  transform: function () {
    this.plot();
  },

  applyTransformationToBuffer: function (matrix) {
    if (this.extendedBuffer) {
      this.bufferContext.setTransform(
        matrix.a,
        matrix.b,
        matrix.c,
        matrix.d,
        matrix.e + this.bufferDOMNode.width / 4,
        matrix.f + this.bufferDOMNode.height / 4
      );
    }
    else {
      this.bufferContext.setTransform(
        matrix.a,
        matrix.b,
        matrix.c,
        matrix.d,
        matrix.e,
        matrix.f
      );
    }
  },

  // <a name="setPixelSize">
  // ### setPixelSize()

  // Set the pixel size in world co-ordinates. This function works in
  // conjunction with the plot() routines. It needs to be called once, before
  // the points and labels are plotted.
  //
  setPixelSize: function () {
    var p0 = this.worldPoint(0, 0),
        p1 = this.worldPoint(1, 1);
    this.onePixel = Math.sqrt(
      (
        (p1.x - p0.x) * (p1.x - p0.x) + (p1.y - p0.y) * (p1.y - p0.y)
      ) / 2
    );
  },


  // <a name="worldPoint">
  // ### worldPoint()

  // Creates an `SVGPoint` object mapping the given point in the veiwport to
  // the world co-ordinates of this layer.
  worldPoint: function (x, y) {
    return this.parent.shadow.worldPoint(x, y);
  },


  // <a name="getBBox">
  // ### getBBox()

  // Creates an rectangle object representing the bounding box of all lines
  // rendered on the canvas.
  getBBox: function () {
    if (this.minX) {
      return {
        x: this.minX,
        y: this.minY,
        width: this.maxX - this.minX,
        height: this.maxY - this.minY
      };
    }

    return undefined;
  },


  // <a name="displayBoundingBox">
  // ### displayBoundingBox()

  // Return an `(x, y, width, height)` tuple representing the bounding box of all
  // lines rendered on this layer in display co-ordinates.
  //
  displayBoundingBox: function () {
    if (!this.minX) {
      return undefined;
    }

    var bbox = this.getBBox(),
        dtl = this.displayPoint(bbox.x, bbox.y),
        dtr = this.displayPoint(bbox.x + bbox.width, bbox.y),
        dbl = this.displayPoint(bbox.x, bbox.y + bbox.height),
        dbr = this.displayPoint(bbox.x + bbox.width, bbox.y + bbox.height),
        minX = [dtl.x, dtr.x, dbl.x, dbr.x].min(),
        minY = [dtl.y, dtr.y, dbl.y, dbr.y].min(),
        maxX = [dtl.x, dtr.x, dbl.x, dbr.x].max(),
        maxY = [dtl.y, dtr.y, dbl.y, dbr.y].max();

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },


  displayPoint: function (x, y) {
    return this.parent.shadow.displayPoint(x, y);
  },


  numberOfNodes: function () {
    return this.n;
  }

}, {
  ATTRS: {
    // Specifies the rendering engine used by the layer. No other rendereres
    // besides SVG are used by the layers deriving from the `WidgetLayer`
    // prototype, so this value is set in stone for those, but other prototypes
    // implementing the layer interface are possible (_e.g._, `BackgroundLayer`
    // and this attribute can be used to tell one from another.
    renderConnectionLines: {
      value: false
    },

    connectionLineOpacity: {
      value: 0.7
    },

    renderErrorLines: {
      value: false
    },

    errorLineOpacity: {
      value: 0.8
    },

    connectionsMax: {
      value: 1000
    },

    width: {
      getter: function (val) {
        if (Y.Lang.isString(val)) {
          return parseInt(val.split('px')[0], 10);
        }
        return val;
      }
    },

    height: {
      getter: function (val) {
        if (Y.Lang.isString(val)) {
          return parseInt(val.split('px')[0], 10);
        }
        return val;
      }
    },

    // The layer's opacity in fractions of one
    opacity: {
      value: 1,
      setter: function (value) {
        this.contentBox.setStyle('opacity', value / 100);
      }
    }
  }
});

}, '@VERSION@', {
  requires: ['base', 'acmacs-base', 'acmacs-layer']
});
/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
