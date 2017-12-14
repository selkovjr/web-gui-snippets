/*
  # license
  # license.
*/

// advice from: http://dev.opera.com/articles/view/raw-webgl-part1-getting-started
//              http://www.html5rocks.com/en/tutorials/webgl/webgl_fundamentals/
// ======================================================================

/*global Y: false, Float32Array: false */
Y.namespace('ACMACS').ConnectionsLayer = Y.Base.create('acmacsConnectionsLayer', Y.Widget, [Y.ACMACS.WidgetChild], {
  CONTENT_TEMPLATE: null,

  // * Parameters affectng appearance or behaviour
  'default': {
    // These parameters provide sane defaults in the absence of
    // external configuration.

    // The line stroke width in pixels
    strokeWidth: 1
  },

  // * The number of nodes
  n: 0,

  // * The size of one display pixel in world co-ordinates.
  onePixel: null,

  // * The point in world co-ordinates marking the start of an interactive
  // transformation
  pickupPoint: null,

  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,

  // HTML5 canvas node, its DOM node and painting context
  canvas: undefined,
  canvasDOMNode: undefined,
  context: undefined,
  vertexBuffer: undefined,
  vertexBufferLocation: undefined,
  program: undefined,
  listeners: undefined,
  parent: undefined,
  rootWidget: undefined,

  initializer: function (config) {
    this.instanceName = config.instanceName;
    this.pickupPoint = {};
    this.listeners = [];
    this.pan = this.transform;
    this.centredZoom = this.transform;
    this.pointerZoom = this.transform;
    this.pointerRotate = this.transform;
    this.pointerFlip = this.transform;
  },

  destructor: function () {
    this.context = undefined;
    this.vertexBuffer = undefined;
    this.vertexBufferLocation = undefined;
    this.program = undefined;
    this.canvas = undefined;
    this.canvasDOMNode = undefined;

    Y.each(this.listeners, function (handle) {
      handle.detach();
    });

    // Y.ACMACS.WidgetChild properties
    this.parent = undefined;
    this.rootWidget = undefined;
  },

  renderUI: function () {
    var contentBox = this.get('contentBox'),
        vertexShader,
        fragmentShader;

    function createShader(gl, str, type) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, str);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    function createProgram(gl, vstr, fstr) {
      var program = gl.createProgram(),
          vshader = createShader(gl, vstr, gl.VERTEX_SHADER),
          fshader = createShader(gl, fstr, gl.FRAGMENT_SHADER);

      gl.attachShader(program, vshader);
      gl.attachShader(program, fshader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
      }

      return program;
    }

    vertexShader = [
      'precision mediump float;', // can possibly be set to lowp
      'attribute vec2 vertex_buffer;',
      'uniform mat3 viewing_transformation;',
      '',
      'void main () {',
      '  vec3 transformed_vertices = viewing_transformation * vec3(vertex_buffer, 1);',
      '  gl_Position = vec4(transformed_vertices.xy, 0, 1);',
      '}'
    ].join('\n');

    fragmentShader = [
      'precision mediump float;', // can possibly be set to lowp
      '',
      'void main() {',
      '  gl_FragColor = vec4(0, 0.8, 0, 1);', // green
      '}'
    ].join('\n');

    contentBox.append(
      '<canvas class="acmacs-canvas">' +
      'This browser does not support the canvas element' +
      '</canvas>'
    );

    /* 1 */
    this.canvas = contentBox.one('canvas');
    this.canvasDOMNode = Y.Node.getDOMNode(this.canvas);

    /* 2 */
    this.context = this.canvasDOMNode.getContext('experimental-webgl', {antialias: false});
    if (!this.context) {
      throw new Error('could not create webgl context');
    }

    this.context.setTransform = function (t) {
      Y.log('connections.context.setTransform()');
      Y.log(t);
    };

    /* 3 */
    this.program = createProgram(this.context, vertexShader, fragmentShader);
    this.context.useProgram(this.program);

    /* 4 */
    this.vertexBufferLocation = this.context.getAttribLocation(this.program, 'vertex_buffer');

    /* 5 */
    this.vertexBuffer = this.context.createBuffer();

    /* 6 */
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexBuffer);

    // ---- cut ----

    /* 8 */
    this.context.enableVertexAttribArray(this.vertexBufferLocation);

    /* 9 */
    this.context.vertexAttribPointer(this.vertexBufferLocation, 2, this.context.FLOAT, false, 0, 0);

    this.syncUI();
  }, // renderUI()

  syncUI: function () {
    var grad,
        width = this.get('width'),
        height = this.get('height'),
        canvas = this.canvasDOMNode,
        context = this.context;

    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.viewport(0, 0, context.drawingBufferWidth, context.drawingBufferHeight);
  },

  bindUI: function () {
    this.listeners.push(this.after('widthChange', this.syncUI));
    this.listeners.push(this.after('heightChange', this.syncUI));
  },

  clear: function () {
    Y.log('ConnectionsLayer.clear()');
    // var b = this.getBBox();
    // this.context.clearRect(b.x, b.y, b.width, b.height);
    this.blueVertices = [];
    this.redVertices = [];
    this.greyVertices = [];
    this.n = 0;
  },

  // ### plot()

  // Plot all connection lines and/or error lines
  //
  plot_lines: function () {
    // var vertices = [-0.5, -0.5, 0.5, -0.5, 0, 0.5],
    var vertices = [
      -1.0, -1.0,
      1.0, -1.0,
      -1.0,  1.0,
      1.0,  1.0,
      -1.0, 0,
      1.0,  0
    ],
        setViewingTransformation;

    setViewingTransformation = Y.bind(function (t) {
      // The 4 accounts for the size of the range [-1 .. 1] mapped to viewport
      // (that's 2), times the downsampling factor (another 2; see syncUI() above).
      var scale = {
        x: this.context.canvas.width / 4,
        y: this.context.canvas.height / 4
      };

      this.context.uniformMatrix3fv(
        this.context.getUniformLocation(this.program, 'viewing_transformation'),
        false,
        [
          t.a / scale.x, t.b / scale.y, 0,
          t.c / scale.x, t.d / scale.y, 0,
          -1 + t.e / scale.x, 1 - t.f / scale.y, 1 // the y-scale is inverted w.r.t. SVG
        ]
      );
    }, this);

    /* 7 */
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(vertices), this.context.STATIC_DRAW);

    /* 10 */
    setViewingTransformation(this.parent.shadow.groupDOMNode.getCTM());
    this.context.drawArrays(this.context.LINES, 0, 6);
  }, // plot()

  plot_rect: function () {
    // var vertices = [-0.5, -0.5, 0.5, -0.5, 0, 0.5],
    var vertices = [
      -1.0, -1.0,
      1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
      1.0, -1.0,
      1.0,  1.0
    ],
        setViewingTransformation;

    setViewingTransformation = Y.bind(function (t) {
      // The 4 accounts for the size of the range [-1 .. 1] mapped to viewport
      // (that's 2), times the downsampling factor (another 2; see syncUI() above).
      var scale = {
        x: this.context.canvas.width / 4,
        y: this.context.canvas.height / 4
      };

      this.context.uniformMatrix3fv(
        this.context.getUniformLocation(this.program, 'viewing_transformation'),
        false,
        [
          t.a / scale.x, t.b / scale.y, 0,
          t.c / scale.x, t.d / scale.y, 0,
          -1 + t.e / scale.x, 1 - t.f / scale.y, 1 // the y-scale is inverted w.r.t. SVG
        ]
      );
    }, this);

    /* 7 */
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(vertices), this.context.STATIC_DRAW);

    /* 10 */
    setViewingTransformation(this.parent.shadow.groupDOMNode.getCTM());
    this.context.drawArrays(this.context.TRIANGLES, 0, 6);
  }, // plot()

  plot: function () {
    Y.log('**** ConnectionsLayer.plot()');
    var data = this.rootWidget.get('data'),
        positive,
        connect,
        colour,
        selected = {},
        connection = {},
        pointsConnected = {},
        setViewingTransformation;

    setViewingTransformation = Y.bind(function (t) {
      // The 4 accounts for the size of the range [-1 .. 1] mapped to viewport
      // (that's 2), times the downsampling factor (another 2; see syncUI() above).
      var scale = {
        x: this.context.canvas.width / 4,
        y: this.context.canvas.height / 4
      };

      this.context.uniformMatrix3fv(
        this.context.getUniformLocation(this.program, 'viewing_transformation'),
        false,
        [
          t.a / scale.x, -t.b / scale.y, 0,
          t.c / scale.x, -t.d / scale.y, 0,
          -1 + t.e / scale.x, 1 - t.f / scale.y, 1 // the y-scale is inverted w.r.t. SVG
        ]
      );
    }, this);


    // Determine the sign of the error.
    positive = Y.bind(function (p1, p2, probe) {
      var arg, t, r, s1, s2, sProbe;


      if (p1[0] === p2[0]) {
        return Math.abs(probe[1] - p2[1]) >= Math.abs(probe[1] - p1[1]);
      }
      else {
        arg = Math.atan((p2[1] - p1[1]) / (p2[0] - p1[0])) * 360 / (2 * Math.PI);
        t = this.parent.shadow.canvasDOMNode.createSVGMatrix().rotate(-arg);
        s1 = this.parent.shadow.svgPoint(p1[0], p1[1]).matrixTransform(t);
        s2 = this.parent.shadow.svgPoint(p2[0], p2[1]).matrixTransform(t);
        sProbe = this.parent.shadow.svgPoint(probe[0], probe[1]).matrixTransform(t);
        return (
          (sProbe.x >= s1.x && s1.x >= s2.x) ||
          (sProbe.x <= s1.x && s1.x <= s2.x)
        );
      }
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
          break;
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
            this.addLine({
              start: from,
              end: to,
              stroke: 'grey',
              width: 0.4,
              opacity: this.attributeOrProfileSetting('connectionLineOpacity')
            });
          }

          if (this.get('renderErrorLines')) {
            this.addLine({
              start: from,
              end: errorLineEnd[d],
              stroke: colour,
              width: 0.6,
              opacity: this.attributeOrProfileSetting('errorLineOpacity')
            });
          }

          // Mark this connection to allow testing for duplicates.
          connection[originIndex + ':' + destIndex] = true;
        }
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

              this.addLine({
                start: to,
                end: errorLineEnd[o],
                stroke: colour,
                width: 0.6,
                opacity: this.attributeOrProfileSetting('errorLineOpacity')
              });
            }
          }
        }
      } // renderErrorLines (at the opposite end)
    }, this);

    // Copy the current transformation from the shadow layer
    this.applyTransformation(
      this.parent.shadow.groupDOMNode.getCTM()
    );

    this.setPixelSize();

    if (!data || !data.error_lines) {
      Y.log(data);
      Y.log('ConnectionsLayer: bailing out because there is no data to plot');
      return false;
    }

    this.clear();

    if (this.get('renderConnectionLines') || this.get('renderErrorLines')) {
      Y.log(data);
      // Because both antigens and sera can be selected for the rendering of
      // error and titre lines around them, there is a possibility for the same
      // line to be rendered twice. To avoid that, startwith antigens and mark
      // the end points of each line in a hash and then skip that line while
      // rendering the lines for sera.

      // First, draw the error lines for antigens
      connect({from: 'antigens', to: 'sera'});
      connect({from: 'sera', to: 'antigens'});
      Y.log(['blue', this.blueVertices]);
      Y.log(['red', this.redVertices]);

      setViewingTransformation(this.parent.shadow.groupDOMNode.getCTM());

      /* 7 */
      this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(this.blueVertices), this.context.STATIC_DRAW);

      /* 10 */
      // this.context.drawArrays(this.context.LINES, 0, this.blueVertices.length / 4);
      /* 7 */

      this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(this.redVertices), this.context.STATIC_DRAW);

      /* 10 */
      this.context.drawArrays(this.context.LINES, 0, this.redVertices.length / 4);
    }
  },

  // <a name="addLine">
  // ### addLine()
  // Render a simple line
  addLine: function (arg) {
    // #### Line attributes:
    // * _Required_:
    //   * **start** = [**x**, **y**]
    //   * **end** = [**x**, **y**]
    // * _Optional_:
    //   * **width**: Line width. _Default: 1 transformed pixel_
    //   * **colour**: Line colour, in DOM-compatible encoding. _Default: black_
    //   * **opacity**: 0 .. 1; _Default: 1_

    var width;

    // Set style attributes
    if (arg.width !== undefined) {
      width = arg.width * this.onePixel;
    }
    else {
      width = this['default'].strokeWidth * this.onePixel;
    }

    if (arg.stroke === 'red') {
      this.redVertices.push(arg.start[0], arg.start[1]);
      this.redVertices.push(arg.end[0], arg.end[1]);
    }

    if (arg.stroke === 'blue') {
      this.blueVertices.push(arg.start[0], arg.start[1]);
      this.blueVertices.push(arg.end[0], arg.end[1]);
    }

    if (arg.stroke === 'grey') {
      this.greyVertices.push(arg.start[0], arg.start[1]);
      this.greyVertices.push(arg.end[0], arg.end[1]);
    }

    this.n += 1;

    this.minX = Math.min(this.minX, arg.start[0]);
    this.minX = Math.min(this.minX, arg.end[0]);
    this.maxX = Math.max(this.maxX, arg.start[0]);
    this.maxX = Math.max(this.maxX, arg.end[0]);

    this.minY = Math.min(this.minY, arg.start[1]);
    this.minY = Math.min(this.minY, arg.end[1]);
    this.maxY = Math.max(this.maxY, arg.start[1]);
    this.maxY = Math.max(this.maxY, arg.end[1]);
  },

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

  // <a name="pointerPanDrag">
  // ### pointerPanDrag()

  // Applies the translation transformation to this layer's outermost group on each
  // `mousemove` event subsequent to the initial `mousedown`.
  pointerPanDrag: function (e) {
    this.pan(
      e.x - this.pickupPoint.x,
      e.y - this.pickupPoint.y,
      'viewport'
    );

    // Use this event as a starting point for the next step.
    this.pointerPanStart(e);
  },

  transform: function (x, y) {
    this.clear();
    this.plot();
  },

  applyTransformation: function (matrix) {
    Y.log('applyTransformation(matrix), ' + matrix.formatIn3Lines());
    // this.context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
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


  getBBox: function () {
    return {
      x: this.minX,
      y: this.minY,
      width: this.maxX - this.minX,
      height: this.maxY - this.minY
    };
  },


  // <a name="displayBoundingBox">
  // ### displayBoundingBox()

  // Return an `(x, y, width, height)` tuple representing the bounding box of all
  // nodes rendered on this layer in display co-ordinates.
  displayBoundingBox: function () {
    var bbox = this.getBBox(),
        dtl = this.displayPoint(bbox.x, bbox.y),
        dbr = this.displayPoint(bbox.x + bbox.width, bbox.y + bbox.height);

    return {
      x: Math.min(dtl.x, dbr.x),
      y: Math.min(dtl.y, dbr.y),
      width: Math.max(dtl.x, dbr.x) - Math.min(dtl.x, dbr.x),
      height: Math.max(dtl.y, dbr.y) - Math.min(dtl.y, dbr.y)
    };
  },


  displayPoint: function (x, y) {
    return this.parent.shadow.displayPoint(x, y);
  },

  // <a name="viewportMargins">
  // ### viewportMargins()

  // Return an object containing the four visible margins around the viewport,
  // measured in display units. A negative number indictates that the
  // corresponding margin is not visible.
  //
  // The `expand` argument indicates how many pixels to add to the bounding box
  // before calculating the margins.
  viewportMargins: function (expand) {
    var tl = this.displayPoint({x: this.minX, y: this.minY}),
        br = this.displayPoint({x: this.maxX, y: this.maxY}),
        exp,
        margins;

    if (expand) {
      exp = parseFloat(expand);
      tl.x -= exp;
      tl.y -= exp;
      br.x += exp;
      br.y += exp;
    }

    margins = {
      l: tl.x,
      t: tl.y,
      b: this.get('height') - br.y,
      r: this.get('width') - br.x
    };

    // Round to the nearest pixel.
    Y.each(margins, function (val, key) {
      margins[key] = Math.round(val);
    });

    return margins;
  },


  numberOfNodes: function () {
    Y.log('numberOfNodes() = ' + this.n);
    return this.n;
  }

}, {
  ATTRS: {
    // Specifies the rendering engine used by the layer. No other rendereres
    // besides SVG are used by the layers deriving from the `WidgetLayer`
    // prototype, so this value is set in stone for those, but other prototypes
    // implementing the layer interface are possible (_e.g._, `BackgroundLayer`
    // and this attribute can be used to tell one from another.
    kind: {
      value: 'gl',
      readOnly: true
    },

    can: {
      value: {
        pan: true,
        rotate: true,
        zoom: true,
        flip: true
      }
    },

    monolithic: {
      value: true,
      readOnly: true
    },

    simulated: {
      value: false
    },

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
        else {
          return val;
        }
      }
    },

    height: {
      getter: function (val) {
        if (Y.Lang.isString(val)) {
          return parseInt(val.split('px')[0], 10);
        }
        else {
          return val;
        }
      }
    },

    // The layer's opacity in fractions of one
    opacity: {
      value: 1,
      setter: function (value) {
        this.get('contentBox').setStyle('opacity', value / 100);
      }
    }
  }
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
