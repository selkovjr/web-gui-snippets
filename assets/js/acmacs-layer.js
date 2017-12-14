YUI.add('acmacs-layer', function(Y) {
// ======================================================================

// The base functionality of a stackable map layer
//
//
// This module is based on `Y.Widget` and it includes everything that is needed
// to host a basic SVG canvas and perform the viewing transformations on the
// nodes contained in it.
//
// It **does not** implement view rotation because the requirement to preserve
// the orientation of shapes relative to the viewport is best satisfied by more
// than one layer instance working concurrently. View rotation is implemented
// in the containing widget, `Y.ACMACS.MapWidget`.
//
// Furthermore, the scaling transformation (zoom), although it is implemented
// inside this module, depends on a special instance of `Y.ACMACS.LayerWidget`,
// `Y.ACMACS.ShadowLayer`, which must be created and managed in the containing
// widgets, `Y.ACMACS.LayerStack` and `Y.ACMACS.MapWidget`.
//
// ### Layer Structure and Viewing Transformation
//
// The basic (static) viewing transformation is achieved by enclosing all SVG
// nodes in a group node and setting the group's `transform` attribute to a
// matrix converting from world co-ordinates to display co-ordinates:
//
//     <svg>
//       <g transform="matrix(150, 0, 0, -150, 75, 250)">
//         ...
//       </g>
//     </svg>
//
// With this transformation in place, all children of the group node rendered
// in world co-ordinates inside a 2x2 viewport are displayed in a
// 300x300 rectangle inside the SVG element's client area.
//
// The following diagram illustrates how the points located at `(0,0)`,
// `(0,1)`, `(0.5,0.5)`, `(1,0)` and `(1,1)` are projected onto a 300x300-pixel
// display surface when rendered inside the above SVG group (_click to enlarge_).
//
// <a href="diagrams/viewing_transformation.png"><img width="320px" height="240px"
// src="diagrams/viewing_transformation.png" /></a>

//<a name="normalisation">
// ### Interactivity and co-ordinate normalisation
//

// All interactively applied transformations implemented by `LayerWidget` rely
// on the SVG facility known as **CTM** (Current Transformation Matrix), which
// defines the mapping between the world co-ordinates and the SVG viewport on
// the display device. Any change in the page layout or a transformation
// applied to the SVG canvas results in a new CTM, automatically recalculated
// by the browser.
//
// To make this mechanism useful in interactive applications, the user event
// co-ordinates must be translated to the SVG viewport co-ordinates. The only
// reliable co-ordinate pair reported by all browsers (or normalised by YUI,
// whichever the case may be) is (`pageX`, `pageY`). To translate these
// co-ordinates to viewport, the viewport origin must be subtracted from them.
//
// The viewport origin can be determined by calling the `getXY()` method on the
// parent node of the SVG canvas. Calling `getXY()` on the canvas itself yields
// a counter-intuitive result: it returns the origin of the bounding box of all
// svg nodes rendered on the canvas.
//
// <a href="diagrams/viewport-coords.svg"><img width="320px" height="240px"
// src="diagrams/viewport-coords.png" /></a>
//
// The following is the correct formula for event co-ordinate normalisation:
//
//
//      e.x = e.pageX - layer.get('contentBox').getX();
//      e.y = e.pageY - layer.get('contentBox').getY();
//
// Note that `LayerWidget` itself does not do this normalisation; it must be
// done in the parent widget. Because the
// same interactive event may be translated into simultaneous transformations
// on several stacked layers, it would be superfluous for each layer to do such
// normalisation. In the context of `LayerWidget`, it is expected that device
// co-ordinates are already translated to viewport.

// ------------------------------------------------------------------------
// Y.ACMACS.LayerWidget
// ------------------------------------------------------------------------

/*global Y: false, document: false, SVGMatrix: false */
var code = {
// ## Prototype properties
  prototypeProperties: {
    // ### Widget configuration

    // * Setting `CONTENT_TEMPLATE` to `null` disposes of Widget's two-box
    // rendering model. Content box and bounding box become the same.
    CONTENT_TEMPLATE: null,

    // Specifies the rendering engine used by the layer.
    kind: 'SVG',

    // This attribute controls whether or not individual objects displayed on
    // the layer can be dragged away from their initial locations. It must be
    // set to `false` to enable drag-and-drop operations on them (see [point
    // translation](#drag_and_drop)).
    monolithic: true,

    // The transformation mode for this layer. A layer that must preserve the
    // shape of all rendered nodes simulates the transformations to the world
    // by translating all nodes no new co-ordinates. Its own world remains static
    // and therefore does not reflect the state of the widget. A layer that
    // must preserve the state of its world and allows its nodes to be
    // transformed (or has none rendered) needs to have this attribute set to
    // `false`.
    simulated: true,

    // Layers use this property to declare their capabilities to their
    // containing widget, `Y.ACMACS.LayerStack`, which uses this information to
    // dispatch event actions across multiple layers. For example, a layer that
    // has the `rotate` property of its `can` attribute set to `false` will be
    // immune to rotation.
    can: {
      pan: true,
      rotate: true,
      flip: true,
      zoom: true
    },

    // * Parameters affectng appearance or behaviour
    'default': {
      // These parameters provide sane defaults in the absence of
      // external configuration.

      // Abstract point size (to be used in the absence of data)
      pointSize: 1,

      // The point scale factor common for all devices
      pointScale: 1,

      // The point scale factor specific for this rendering device
      pointSizeCalibration: 5,


      // The point shape's stroke width in pixels
      strokeWidth: 1,


      // Abstract label size (to be used in the absence of data)
      labelSize: 1,

      // The label scale factor common for all devices
      labelScale: 1,

      // The label scale factor specific for this rendering device
      labelSizeCalibration: 9,


      // This adjustment is applied to all nodes to make sure the overlapping
      // nodes remain visible
      forcedOpacityFactor: 0.6
    },

    // ### Component references

    // * SVG or HTML canvas element
    canvas: null,

    // * Reference to the raw DOM node for `<svg>` or `<canvas>`
    canvasDOMNode: null,

    // * Reference to the DOM node for the outermost SVG group hosting the
    // viewing transformation
    groupDOMNode: null,

    // * Reference to the DOM node for the group used to move points
    operationGroupDOMNode: null,

    // ### State (non-attributes)

    // The following properties are needed to exchange data between the
    // co-operating event handlers that only share the prototype scope:

    // * The size of one display pixel in world co-ordinates.
    onePixel: null,

    // * The point marking the start of an interactive transformation
    pickupPoint: null,

    // * Line hash used to exclude co-incident lines
    lineHash: {},


    // ## Method summary
    // * Life cycle methods
    //   * **[initializer](#initializer)**()
    //   * **[destructor](#destructor)**()
    // * Composition methods
    //   * **[renderUI](#renderUI)**()
    //   * **[addPoint](#addPoint)**(_attributes_)
    //   * **[addLine](#addLine)**(_attributes_)
    //   * **[addPath](#addPath)**(_attributes_)
    //   * **[addText](#addText)**(_attributes_)
    //   * **[clear](#clear)**()
    //   * **[createOperationGroup](#createOperationGroup)**()
    //   * **[removeOperationGroup](#removeOperationGroup)**()
    // * Interactivity methods
    //   * **[pointerPanStart](#pointerPanStart)**(_e_)
    //   * **[pointerPanDrag](#pointerPanDrag)**(_e_)
    //   * **[pointerFlip](#pointerFlip)**(_e_)
    //   * **[pointerZoom](#pointerZoom)**(_e_)
    //   * **[pointerRotate](#pointerRotate)**(_e_)
    //   * **[pointerMoveStart](#pointerMoveStart)**(_e_)
    //   * **[pointerMoveDrag](#pointerMoveDrag)**(_e_)
    //   * **[pointerMoveCancel](#pointerMoveCancel)**()
    // * Core transformation methods
    //   * **[pan](#pan)**(_x, y)
    //   * **[rotate](#rotate)**(_x, y)
    //   * **[zoom](#zoom)**(_x, y_)
    //   * **[centredRotate](#centredRotate)**(_arg_)
    //   * **[centredZoom](#centredZoom)**(_delta_)
    //   * **[horizontalFlip](#horizontalFlip)**(_arg_)
    //   * **[verticalFlip](#verticalFlip)**(_arg_)
    //   * **[applyTransformation](#applyTransformation)**(_matrix_)
    //   * **[simulateTransformation](#simulateTransformation)**(_matrix_)
    // * Auxiliary methods
    //   * **[svgPoint](#svgPoint)**(_x, y_)
    //   * **[svgPoint2](#svgPoint2)**(_x, y_)
    //   * **[displayPoint](#displayPoint)**(_x, y_)
    //   * **[displayPointOp](#displayPoint)**(_x, y_)
    //   * **[worldPoint](#worldPoint)**(_x, y_)
    //   * **[chirality](#chirality)**()
    //   * **[getBBox](#getBBox)**()
    //   * **[displayBoundingBox](#displayBoundingBox)**()
    //   * **[visibleWorld](#visibleWorld)**()
    //   * **[viewportWidth](#viewportWidth)**()
    //   * **[viewportHeight](#viewportHeight)**()
    //   * **[viewportCentre](#viewportCentre)**()
    //   * **[setDeviceDimensions](#setDeviceDimensions)**()
    //   * **[numberOfNodes](#numberOfNodes)**()
    //   * **[lineExists](#lineExists)**()

    // ------------------------------------------------------------------------
    // ## Life cycle methods

    // <a name="initializer">
    // ### initializer()

    // Make sure the instance propreties exist. Failing to assign a value to them
    // will result in prototype properties shared among all instances of the
    // widget.
    //
    initializer: function (config) {
      this.instanceName = config.instanceName;
      this.parent = config.parent;
      this.pickupPoint = Y.ACMACS.newSVGPoint();
    },

    // <a name="destructor">
    // ### destructor()

    // Clean up the DOM and the JavaScript objects on destruction.
    //
    destructor: function () {
      this.clear();
      this.canvas.remove().destroy(true);
      this.canvas = undefined;
      this.canvasDOMNode = undefined;
      this.groupDOMNode = undefined;
      this.operationGroupDOMNode = undefined;
      this.onePixel = undefined;
      this.pickupPoint = undefined;
      this.lineHash = undefined;

      // Y.ACMACS.WidgetTreeNode properties
      this.parent = undefined;
      this.rootWidget = undefined;
    },


    // ------------------------------------------------------------------------
    // ## Composition methods

    // <a name="renderUI">
    // ### renderUI()
    // This method implements the part of Widget's life cycle where widget
    // elements are assembled and rendered into the DOM.
    renderUI: function () {
      if (this.kind === 'SVG') {
        this.canvas = Y.Node.create(Y.substitute(
          [
            '<svg',
            ' xmlns="http://www.w3.org/2000/svg"',
            ' version="1.1"',
            ' width="{width}"',
            ' height="{height}"',
            '{textRendering}>',
            '  <g class="basegroup"></g>',
            '</svg>'
          ].join('\n'),
          {
            width: this.get('width'),
            height: this.get('height'),
            textRendering: this.name === 'acmacsLabelLayer' ? ' text-rendering="geometricPrecision"' : ''
          }
        ));

        this.canvasDOMNode = Y.Node.getDOMNode(this.canvas);
        this.groupDOMNode = Y.Node.getDOMNode(this.canvas.one('.basegroup'));
        this.contentBox = this.get('contentBox');
        this.contentBox.append(this.canvas);
      }

      // The plan to implement non-SVG map layers is on a hiatus.  Non-map layers
      // sharing the same interface can be implemented as bitmaps (see
      // `Y.ACMACS.BackgroundLayer`), but they will not derive from this
      // prototype.
      else {
        throw new Error("non-SVG canvas not implemented");
      }

      return this;
    },

    // <a name="addPoint">
    // ### addPoint()
    // Render a circle, an ellipse, or a box in world co-ordinates
    addPoint: function (arg) {
      // #### Point shape attributes:
      // * _Required_:
      //   * **point** = [**x**, **y**]: The location of the shape's centre (in world co-ordinates)
      //   * **size**: Mean diameter measured in world units
      // * _Optional_:
      //   * **shape**: 'circular' or 'box'. _Default: circular_
      //   * **aspect**: Vertical/horizontal size ratio. _Default: 1_
      //   * **rotation**: The amount of tilt for shapes with non-unity aspect ratio, in degrees. _Default: 0_
      //   * **strokeWidth**: The width of the shape's outline. _Default: 1 transformed pixel_
      //   * **fill**: The colour of the shape's interior, in DOM-compatible encoding. _Default: white_
      //   * **stroke**: Outline colour, in DOM-compatible encoding. _Default: black_
      //   * **fillOpacity**: 0 .. 1; _Default: 1_
      //   * **strokeOpacity**: 0 .. 1; _Default: 1_
      // * _Alternative_:
      //   * **opacity**: 0 .. 1: Sets `fillOpacity` and `strokeOpacity` to the
      //   same value

      // Function-scope variables
      var node,
          shape,
          size,
          aspect,
          r,
          rx,
          ry,
          w,
          h,
          path,
          fillOpacity,
          strokeOpacity;

      // Set the defaults for shape and aspect
      if (arg.shape === undefined) {
        shape = 'circular';
      }
      else if ({
        circular: true,
        box: true,
        star: true,
        blob: true,
        path: true
      }[arg.shape]) {
        shape = arg.shape;
      }
      else {
        throw new Error("unknown shape '" + arg.shape + "'");
      }

      size = this['default'].pointSize;
      if (arg.size !== undefined) {
        size *= arg.size;
      }

      // Apply the scale factor specific for this device
      size *= this.attributeOrProfileSetting('pointSizeCalibration') *
        this.attributeOrProfileSetting('pointScale') *
        this.onePixel;

      if (arg.aspect === undefined) {
        aspect = 1;
      }
      else {
        aspect = arg.aspect;
      }

      // A shape with a unity aspect ratio is more economical both in terms of
      // calculations required to assign the SVG properties and the cost of
      // rendering. Circular shapes can be rendered with the `circle` element
      // without adjustments, and equilateral box shapes are rendered as `rect`
      // elements with a simple adjustment of the origin.

      // <a href="diagrams/rect+ellipse-no-aspect.svg"><img src="diagrams/rect+ellipse-no-aspect.svg" /></a>

      if (aspect === 1) {
        switch (shape) {
        case 'circular':
          node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          node.setAttribute('cx', arg.point[0]);
          node.setAttribute('cy', arg.point[1]);
          node.setAttribute('r', size / 2);
          break;
        case 'box':
          node = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          node.setAttribute('x', arg.point[0] - size / 2);
          node.setAttribute('y', arg.point[1] - size / 2);
          node.setAttribute('width', size);
          node.setAttribute('height', size);
          break;
        case 'path':
          node = this.addPath(arg);
          node.scale(size);
          break;
        case 'blob':
          // Generate a blob from polar contour co-ordinates
          path = Y.ACMACS.pathFromPolar(arg.point, arg.contour, arg.smooth);
          node = this.addPath(Y.merge(arg, {d: path}));
          break;
        case 'star':
          // Generate a unit-size star, then scale it to point size
          path = Y.ACMACS.starGeneratePath(
            Y.merge(arg.star, {size: 1})
          );
          Y.mix(arg, {
            d: path
          });
          node = this.addPath(arg);
          node.scale(size);
          break;
        default:
          throw new Error('addPoint() does not recognize ' + shape);
        }
      }

      // A shape with a non-unity aspect ratio requires a more complex
      // derivation of SVG properties. This diagram illustrates property
      // assignments for the `ellipse` and `rect` shapes:

      // <a href="diagrams/rect+ellipse.svg"><img src="diagrams/rect+ellipse.svg" /></a>

      else {
        if (shape === 'circular') {
          node = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
          r = size / 2;
          ry = Math.sqrt(r * r / aspect);
          rx = ry * aspect;
          node.setAttribute('cx', arg.point[0]);
          node.setAttribute('cy', arg.point[1]);
          node.setAttribute('rx', rx);
          node.setAttribute('ry', ry);
        }
        else if (shape === 'box') {
          node = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          h = Math.sqrt(size * size / aspect);
          w = h * aspect;
          node.setAttribute('x', arg.point[0] - w / 2);
          node.setAttribute('y', arg.point[1] - h / 2);
          node.setAttribute('width', w);
          node.setAttribute('height', h);
        }
        else {
          throw new Error('non-unity aspect can only be applied to circular or box shapes');
        }
      }

      // Apply static tilt to all shapes except cicrles, for which it does not
      // make sense.
      if (node.tagName !== 'circle') {
        node.setAttribute(
          'transform',
          Y.substitute('rotate({angle} {x} {y})', {
            angle: (arg.rotation || 0),
            x: arg.point[0],
            y: arg.point[1]
          })
        );
      }

      // Set the properties common to all shapes.
      if (arg.opacity !== undefined) {
        fillOpacity = arg.opacity;
        strokeOpacity = arg.opacity;
      }
      else {
        if (arg.fillOpacity === undefined) {
          fillOpacity = 1;
        }
        else {
          fillOpacity = arg.fillOpacity;
        }
        if (arg.strokeOpacity === undefined) {
          strokeOpacity = 1;
        }
        else {
          strokeOpacity = arg.strokeOpacity;
        }
      }

      node.setAttribute('fill', arg.fill || 'white');
      node.setAttribute('fill-opacity', fillOpacity);
      if (arg.strokeWidth === 0) {
        node.setAttribute('stroke-width', 0);
      }
      else {
        // Stroke width cannot be allowed to assume its default value of 1 because
        // this value is interpreted using the world metric. That is fine in
        // pixel-based applications, but does not make sense in a transformed
        // world. It a transformed world, we use the default value of "one
        // translated pixel".
        if (arg.strokeWidth !== undefined) {
          node.setAttribute('stroke-width',
            arg.strokeWidth *
              this.attributeOrProfileSetting('pointSizeCalibration') *
              this.onePixel
          );
        }
        else {
          node.setAttribute('stroke-width',
            this['default'].strokeWidth * this.onePixel
          );
        }
      }
      node.setAttribute('stroke', arg.stroke || 'black');
      node.setAttribute('stroke-opacity', strokeOpacity);

      node.size = size;
      node.abstractSize = arg.size || this['default'].pointSize;
      node.aspect = aspect;

      // Render the node into the DOM.
      this.groupDOMNode.appendChild(node);

      if (this.name === 'acmacsMapLayer') {
        this.labelAndIndex(node, arg);
      }

      node.X = arg.point[0];
      node.Y = arg.point[1];
      return node;
    }, // addPoint()


    // <a name="addLine">
    // ### addLine()
    // Render a simple line in world co-ordinates without attaching it to a map point.
    addLine: function (arg) {
      // #### Line attributes:
      // * _Required_:
      //   * **start** = [**x**, **y**]
      //   * **end** = [**x**, **y**]
      // * _Optional_:
      //   * **width**: Line width. _Default: 1 transformed pixel_
      //   * **colour**: Line colour, in DOM-compatible encoding. _Default: black_
      //   * **opacity**: 0 .. 1; _Default: 1_

      // Function-scope variables
      var node,
          width,
          stroke,
          opacity;


      // Set style attributes
      if (arg.width !== undefined) {
        width = arg.width * this.onePixel;
      }
      else {
        width = this['default'].strokeWidth * this.onePixel;
      }

      stroke = arg.stroke || 'black';

      if (arg.opacity !== undefined) {
        opacity = arg.opacity;
      }
      else {
        if (arg.opacity === undefined) {
          opacity = 1;
        }
        else {
          opacity = arg.opacity;
        }
      }

      node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      node.setAttribute('x1', arg.start[0]);
      node.setAttribute('y1', arg.start[1]);
      node.setAttribute('x2', arg.end[0]);
      node.setAttribute('y2', arg.end[1]);
      node.setAttribute('stroke', stroke);
      node.setAttribute('stroke-width', width);
      node.setAttribute('stroke-opacity', opacity);
      node.setAttribute('stroke-linecap', 'round');
      Y.each(arg.style, function (value, key) {
        node.style[key] = value;
      });

      // Render the node into the DOM.
      this.groupDOMNode.appendChild(node);

      return node;
    }, // addLine()

    // <a name="addPath">
    // ### addPath()
    // Render an SVG path object in world co-ordinates without attaching it to a map point.
    addPath: function (arg) {
      // #### Point shape attributes:
      // * _Required_:
      //   * **d**: Path specification in SVG format
      //   * **point** = [**x**, **y**]: The location of the shape's centre (in
      //   world co-ordinates). For an arbitrary path without a natural centre of
      //   symmetry, it has to be assigned manually.
      // * _Optional_:
      //   * **rotation**: The amount of tilt. _Default: 0_
      //   * **strokeWidth**: The width of the shape's outline. _Default: 1 transformed pixel_
      //   * **fill**: The colour of the shape's interior, in DOM-compatible encoding. _Default: white_
      //   * **stroke**: Outline colour, in DOM-compatible encoding. _Default: black_
      //   * **fillOpacity**: 0 .. 1; _Default: 1_
      //   * **strokeOpacity**: 0 .. 1; _Default: 1_
      // * _Alternative_:
      //   * **opacity**: 0 .. 1: Sets `fillOpacity` and `strokeOpacity` to the
      //   same value

      // Function-scope variables
      var node,
          path,
          fillOpacity,
          strokeOpacity;

      node = document.createElementNS('http://www.w3.org/2000/svg', 'path');

      // Save the assigned centre point.
      node.X = arg.point[0];
      node.Y = arg.point[1];

      // Interpret the supplied path relative to point.
      path = Y.ACMACS.pathToRelative(Y.ACMACS.parsePathString(arg.d));
      path[0][1] += arg.point[0];
      path[0][2] += arg.point[1];
      node.setAttribute('d', path.toString());

      node.setAttribute(
        'transform',
        Y.substitute('rotate({angle} {x} {y})', {
          angle: (arg.rotation || 0),
          x: arg.point[0],
          y: arg.point[1]
        })
      );
      if (arg.opacity !== undefined) {
        fillOpacity = arg.opacity;
        strokeOpacity = arg.opacity;
      }
      else {
        if (arg.fillOpacity === undefined) {
          fillOpacity = 1;
        }
        else {
          fillOpacity = arg.fillOpacity;
        }
        if (arg.strokeOpacity === undefined) {
          strokeOpacity = 1;
        }
        else {
          strokeOpacity = arg.strokeOpacity;
        }
      }
      node.setAttribute('fill', arg.fill || 'white');
      node.setAttribute('fill-opacity', fillOpacity);

      if (arg.strokeWidth === 0) {
        node.setAttribute('stroke-width', 0);
      }
      else {
        // Stroke width cannot be allowed to assume its default value of 1 because
        // this value is interpreted as a world metric. That is fine in
        // pixel-based applications, but does not make sense in a transformed
        // world. It a transformed world, we use the default value of "one
        // translated pixel".
        if (arg.strokeWidth) {
          node.setAttribute('stroke-width',
            arg.strokeWidth *
              this.attributeOrProfileSetting('pointSizeCalibration') *
              this.onePixel
          );
        }
        else {
          node.setAttribute('stroke-width',
            this['default'].strokeWidth * this.onePixel
          );
        }
      }

      node.setAttribute('stroke', arg.stroke || 'black');
      node.setAttribute('stroke-opacity', strokeOpacity);

      // Render the node into the DOM.
      this.groupDOMNode.appendChild(node);

      node.index = arg.index;
      node.X = arg.point[0];
      node.Y = arg.point[1];

      return node;
    }, // addPath()


    // <a name="addText">
    // ### addText()

    // Render a text node specified in world co-ordinates without logically
    // attaching it to a map point, but use offset and point size arguments to
    // make it easy to render the text next to a point to serve as that point's
    // label.
    addText: function (arg) {
      // #### Label attributes:
      // * _Required_:
      //   * **x**, **y**: The location at which this text node is anchored
      //   * **size**: Label height measured in world units
      //   * **text**: Label text
      // * _Optional_:
      //   * **fill**: The colour of the shape's interior, in DOM-compatible encoding. _Default: white_
      //   * **fillOpacity**: 0 .. 1; _Default: 1_
      //   * **offsetX**
      //   * **offsetY**
      //   * **pointSize**
      // * _Alternative_:
      //   * **opacity**: 0 .. 1: Same as `fillOpacity`

      // Function-scope variables
      var
        node, marker,
        size,
        offsetX = (arg.offsetX || 0),
        offsetY = (arg.offsetY || 0),
        pointSize = (arg.pointSize || 0),
        x,
        y,
        dy,
        fillOpacity,
        strokeOpacity;

      node = document.createElementNS('http://www.w3.org/2000/svg', 'text');

      size = this['default'].labelSize;
      if (arg.size !== undefined) {
        size *= arg.size;
      }
      // Apply the scale factor specific for this device
      size *= this.attributeOrProfileSetting('labelSizeCalibration') *
        this.attributeOrProfileSetting('labelScale') *
        this.onePixel;

      Y.one(node).setContent(arg.text);
      node.setAttribute('font-size', size);
      node.setAttribute('font-family', arg.font);
      node.setAttribute('font-weight', 'normal');

      if (arg.opacity !== undefined) {
        fillOpacity = arg.opacity;
      }
      else {
        if (arg.fillOpacity === undefined) {
          fillOpacity = 1;
        }
        else {
          fillOpacity = arg.fillOpacity;
        }
      }
      node.setAttribute('fill', arg.fill || 'white');
      node.setAttribute('fill-opacity', fillOpacity);
      node.setAttribute('stroke-width', 0);

      if (arg.label_position_type && arg.label_position_type === 'tethered') {
        x = offsetX * this.scale;
        y = offsetY * this.scale;
        node.setAttribute('text-anchor', 'middle');
        node.setAttribute('dy', '0.35em');
      }
      else {
        // Align according to offsetX and offsetY
        if (offsetY >= 1) {
          // top anchor
          y = offsetY * pointSize / 2 + this.onePixel;
          dy = '0.7em';
        }
        else if (offsetY <= -1) {
          // bottom anchor
          y = offsetY * pointSize / 2 - this.onePixel;
          dy = 0;
        }
        else {
          // middle anchor
          y = 0;
          dy = '0.35em';
        }

        if (offsetX >= 1) {
          node.setAttribute('text-anchor', 'start');
          x = offsetX * pointSize / 2 + this.onePixel;
        }
        else if (offsetX <= -1) {
          node.setAttribute('text-anchor', 'end');
          x = offsetX * pointSize / 2 - this.onePixel;
        }
        else {
          node.setAttribute('text-anchor', 'middle');
          x = 0;
        }
      }

      node.index = arg.index;
      node.size = size;
      node.abstractSize = arg.size || this['default'].labelSize;
      node.X = arg.x + x;
      node.Y = arg.y + y;
      node.setAttribute('x', arg.x + x);
      node.setAttribute('y', arg.y + y);
      if (dy) {
        node.setAttribute('dy', dy);
      }
      else {
        node.removeAttribute('dy');
      }

      // Render the node into the DOM.
      this.groupDOMNode.appendChild(node);

      return node;
    }, // addText()


    // <a name="clear">
    // ### clear()

    // Removes all children of this layer's outermost group, reverting it to the
    // empty initial state.
    clear: function () {
      if (this.canvas) {
        this.canvas.one('g').empty();
      }
      this.lineHash = {};
    },


    // <a name="createOperationGroup">
    // ### createOperationGroup()

    // Reparent the elements contained in the operation group preserving their
    // co-ordinates relative to base group and remove the operation group.
    createOperationGroup: function () {
      if (this.operationGroupDOMNode) {
        this.removeOperationGroup();
      }
      this.operationGroupDOMNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.operationGroupDOMNode.setAttribute('class', 'opgroup');
      this.operationGroupDOMNode.setAttribute('transform', this.groupDOMNode.getAttribute('transform'));
      this.canvas.append(Y.one(this.operationGroupDOMNode));
    },

    // <a name="removeOperationGroup">
    // ### removeOperationGroup()

    // Reparent the elements contained in the operation group preserving their
    // co-ordinates relative to base group and remove the operation group.
    removeOperationGroup: function () {
      if (this.operationGroupDOMNode) {
        Y.each(this.operationGroupDOMNode.childNodes, Y.bind(function (node) {
          Y.one(node).remove();
          this.groupDOMNode.appendChild(node);
        }, this));
        Y.one(this.operationGroupDOMNode).remove().destroy(true);
        this.operationGroupDOMNode = undefined;
      }
    },


    // ------------------------------------------------------------------------
    // ## Interactivity methods
    // ### View translation

    // Interactive view translation is based on two mouse events: `mousedown` and
    // `mousedrag`. The listeners for these events are defined in
    // `Y.ACMACS.LayerStack` and they dispatch the event actions among those
    // layers in the stack that have declared the ability to respond to them. The
    // actions are `pointerPanStart()` and `pointerPanDrag()` (for `mousedown`
    // and `mousemove`, respectively), and they act on the outermost SVG group.

    // Both `pointerPanStart()` and `pointerPanDrag()` receive the normalised
    // event object as their sole argument. [Normalisation](#normalisation) means
    // that the raw event co-ordinates (`pageX` and `pageY`) must be translated
    // to display co-ordinates `e.x` and `e.y` measured relative to the viewport
    // origin.  Because of this, these methods cannot be used as event handlers
    // directly, requiring a super-handler to do event translations and to
    // dispatch event actions to multiple layers.

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
    //
    // This method is not used while operating inside the stack. It is only used in tests.
    // Consider removing it.
    pointerPanDrag: function (e) {
      this.pan(
        e.x - this.pickupPoint.x,
        e.y - this.pickupPoint.y
      );

      // Use this event as a starting point for the next step.
      this.pointerPanStart(e);
    },

    // <a name="pointerFlip">
    // ### pointerFlip()

    // This method calculates the vector between the event point and the viewport
    // centre, and if it is approximately horizontal or vertical, it calls an
    // appropriate flip method.
    pointerFlip: function (e) {
      var c = this.viewportCentre(),
          x = Math.abs(e.x - c.x),
          y = Math.abs(e.y - c.y);

      // if (0.25 * y > x) {
      if (y > x) {
        this.verticalFlip();
      }
      // else if (0.25 * x > y) {
      else if (x >= y) {
        this.horizontalFlip();
      }
    },


    // <a name="pointerZoom">
    // ### pointerZoom()

    // Scale this layer's content on each `mousewheel` event.

    // The event object `e` that this method receives is expected to be
    // normalised by the caller in two ways. One, the properties `e.x` and
    // `e.y` must contain event co-ordinates relative to the viewport origin
    // (see [Normalisation](#normalisation)). An additional normalisation
    // involves limiting the wheel delta at some sensible value, or simply
    // setting the same fixed value for each `mousewheel` event. This is needed
    // to prevent the occurrence of insane scale factors that might arise from
    // unfiltered mouse wheel actions.

    pointerZoom: function (e) {
      // Zoom factor is calculated using the normalised wheel delta, which is
      // assumed to be of constant magnitude.
      //
      // Because the sign of delta varies, the zoom factor can
      // take one of two values: slightly below 1 or slightly above.

      this.zoom(1 + e.wheelDelta, e.x, e.y);
    },


    // <a name="pointerRotate">
    // ### pointerRotate()

    // Rotate the layer around the point `(e.x, e.y)` by `e.arg` degrees.
    pointerRotate: function (e) {
      this.rotate(e.arg, e.x, e.y);
    },


    // <a name="pointerMoveStart">
    // ### pointerMoveStart()

    // This method initialises the drag-and-drop action on a modified `mousedown`
    // event. If followed by mousemove events, the location it saves in
    // `this.pickupPoint` is used to calculate the amount of translation of the
    // affected point or a set of points. In the absence of subsequent
    // `mousemove` events, it has no effect.
    //
    // Implemented in specific ways in derived objects, `Y.ACMACS.MapLayer` and
    // `Y.ACMACS.LabelLayer`.


    // <a name="pointerMoveDrag">
    // ### pointerMoveDrag()

    // Applies translation to the SVG node being dragged by a pointer action.
    // The `constraint` argument, when specified, constrains the motion along
    // one of the axes.
    pointerMoveDrag: function (e, constraint) {
      // Convert the current event point to world co-ordinates.
      var p = this.worldPoint(e.x, e.y),
          dx = p.x - this.pickupPoint.x,
          dy = p.y - this.pickupPoint.y;

      if (constraint && constraint === 'horizontal') {
        dy = 0;
      }
      if (constraint && constraint === 'vertical') {
        dx = 0;
      }

      this.operationGroupDOMNode.applyTransformation(
        this.operationGroupDOMNode.getCTM().translate(dx, dy)
      );

      // In case another `mousemove` event fires following this, we need to
      // pretend that the node has just been selected at its new location. Doing
      // so makes the drag operation appear smooth and keeps the target node
      // 'attached' to the mouse pointer.
      this.pickupPoint = p;

      // This operation brings about the following changes in the DOM (target
      // node is an SVG circle shape; the
      // varibale parts are marked with `###`:
      //
      //     <svg>
      //       <g transform="matrix(200, 0, 0, -200, 218, 268)">
      //         . . .
      //         <circle cx="###" cy="###" ...>
      //         . . .
      //       </g>
      //     </svg>
    },


    // <a name="pointerMoveCancel">
    // ### pointerMoveCancel()

    // Cleans up the state after a drag-and-drop operation has been cancelled
    // (mouse released outside the viewport).
    pointerMoveCancel: function () {
      var anim,
          // This is the transform from the origital position of the operation
          // group to its current position; it will be undone through animated
          // transition.
          t = this.groupDOMNode.getCTM().inverse().multiply(this.operationGroupDOMNode.getCTM());

      // Just move the operation group where it was before the move.
      anim = new Y.Animate({
        node: Y.one(this.operationGroupDOMNode),
        from: {
          // transform: this.operationGroupDOMNode.getAttribute('transform')
          transform: {tx: t.e, ty: t.f}
        },
        to: {
          // transform: this.groupDOMNode.getAttribute('transform')
          transform: {tx: 0, ty: 0}
        },
        transformTemplate: this.groupDOMNode.getAttribute('transform') + ' translate(#tx, #ty)',
        duration: 1,
        easing: Y.Easing.easeBoth
      });

      anim.onEnd(Y.bind(function (arg) {
        // Clean up the refernece to the operation group
        anim.destroy(true);
        anim = undefined;
        this.removeOperationGroup();
      }, this));

      anim.run();
    },

    // ------------------------------------------------------------------------
    // ## Core transformation methods

    // <a name="pan">
    // ### pan()

    // Translate the layer along a vector defined by the (x, y) co-ordinate pair.
    // The arguments are given in display co-ordinates.
    //
    pan: function (x, y) {
      var startPoint,
          endPoint;

      // Convert the translation vector expressed in viewport co-ordinates to a
      // pair of `SVGPoint` objects, `startPoint` and `endPoint`.
      startPoint = this.worldPoint(0, 0);
      endPoint = this.worldPoint(x, y);
      this.groupDOMNode.applyTransformation(
        this.groupDOMNode.getCTM().translate(
          endPoint.x - startPoint.x,
          endPoint.y - startPoint.y
        )
      );
    }, // pan()


    // <a name="rotate">
    // ### rotate()

    // Rotate the layer by the angle supplied in the first argument, around the
    // pivot point defined by the second and third arguments (x and y,
    // respectively).
    //
    // The x and y arguments are given in display co-ordinates.
    //
    rotate: function (arg, x, y) {
      var pivotPoint,
          r;

      pivotPoint = this.worldPoint(x, y);

      if (this.simulated) {
        r = Y.ACMACS.newSVGMatrix()
        .translate(pivotPoint.x, pivotPoint.y)
        .rotate(arg)
        .translate(-pivotPoint.x, -pivotPoint.y);

        this.simulateTransformation(r);
      }
      else {
        arg = arg * this.chirality();

        r = Y.ACMACS.newSVGMatrix()
        .translate(pivotPoint.x, pivotPoint.y)
        .rotate(arg)
        .translate(-pivotPoint.x, -pivotPoint.y);

        this.groupDOMNode.applyTransformation(
          this.groupDOMNode.getCTM().multiply(r)
        );
      }
    },


    // <a name="zoom">
    // ### zoom()

    // Scale this layer's base group using the specified zoom factor `zf`
    // (no change at `zf == 1`). The co-ordinates `x` and `y` set the
    // transformation origin (the fixed point), and they are specified in
    // display co-ordinates.
    //
    zoom: function (zf, x, y) {
      //
      var
          // The `SVGPoint` object representing the origin of the transformation
          p = this.worldPoint(x, y),

          // Components of `p` to be stored separately, avoiding property lookups
          // inside the fake zoom loop
          px, py,

          tv,

          // Scale matrix
          k;


      // The real-world zoom is a scale transformation applied to the group and
      // it is a nice and fast way to zoom, but it does not work on an ACMACS
      // map layer, where points must preserve their size regardless of the zoom
      // level. It is, however, used on other layers; for example,
      // [`Y.ACMACS.ShadowLayer`](#ShadowLayer), which is used in combination
      // with [`Y.ACMACS.MapLayer`](acmacs-maplayer.html) to preserve
      // world co-ordinates clobbered by the simulated transformation.

      // The ACMACS maps perform a simulated transformation that spreads the
      // nodes away from the zoom centre or gathers them towards it without
      // changing their size (see
      // [`SVGElement.fakeZoom()`](svg-methods.html#fakeZoom). It is 2.5-3
      // times slower than the real-world zoom.
      if (this.simulated) {
        px = p.x;
        py = p.y;
        Y.each(this.groupDOMNode.childNodes, function (node) {
          // The `fakeZoom()` method takes the zoom delta as input, instead of
          // zoom factor. It returns the translation vector.
          tv = node.fakeZoom(px, py, zf - 1);
          if (node.index !== undefined) {
            // some nodes may remain un-indexed
            if (this.pointList[node.index]) {
              // and some may be left without a label
              this.pointList[node.index].translateLabel(tv[0], tv[1]);
            }
          }
        }, this);

        // Since the simulated transformation changes world co-ordinates on the
        // map layer, the k-d tree index needs to be updated.
        this.updateIndex();
        //
      }

      // Do the real-world transformation.
      else {
        // Compute the scale matrix at the current pointer position. What this
        // expression does, it translates the world to place the current event
        // point to space origin, scales the space, then translates it back.
        // Nothing happens to the world at this point, because the result is just
        // a matrix.
        k = Y.ACMACS.newSVGMatrix().translate(p.x, p.y).scale(zf)
        .translate(-p.x, -p.y);

        // And now this matrix is applied to the viewing transformation, so
        // again, nothing happens to the world. Only the view gets scaled.
        this.groupDOMNode.applyTransformation(
          this.groupDOMNode.getCTM().multiply(k)
        );
        //
      }
    }, /* zoom() */


    // <a name="centredRotate">
    // ### centredRotate()

    // Rotate this layer about the centre of the viewport.
    //
    centredRotate: function (arg) {
      var vc = this.viewportCentre();
      this.rotate(arg, vc.x, vc.y);
    },

    // <a name="centredZoom">
    // ### centredZoom()

    // Scale this layer relative to the centre of the viewport.
    //
    // The function's argument is equivalent to the mousewheel delta used in the
    // interactive zoom. The delta of 0 means no charge. The value of 1 results
    // in a 2-fold dilation of visible distances. The next whole value, 2,
    // corresponds to a 3-fold dilation; 3 to a 4-fold, and so on.
    //
    // Another way to imagine positive deltas is to think of them as multiples of
    // of a 100% increase. Thus, the delta of 1 is a 100%, or a 2-fold, dilation.
    // A delta of 0.1 corresponds to a 10% dilation.
    //
    // Conversely, a delta of -0.1 corresponds to a 10% contraction, and these
    // operations are the exact opposites of each other. That is, a zoom with a
    // delta of 0.1 followed by a zoom with a delta of -0.1 will cancel each
    // other, returning the view to its original state.
    //
    // The negative deltas with a magnitude of 1 or higher hardly make any sense,
    // but there are two of them with a peculiar meaning. The delta of -1 causes
    // a singularity: all points converge to (0, 0) and such transformation
    // cannot be reversed. The second curious delta is that of -2, leading to the
    // inversion of the image around (0, 0).
    centredZoom: function (delta) {
      var vc = this.viewportCentre();
      this.zoom(1 + delta, vc.x, vc.y);
    },


    // <a name="horizontalFlip">
    // ### horizontalFlip()

    // Flip this layer relative to the centre of the viewport.
    //
    horizontalFlip: function () {
      var
          vpc = this.viewportCentre(),

          // Transformation origin
          flipX,

          // Reflection matrix
          r;


      if (this.simulated) {
        flipX = this.worldPoint(vpc.x, vpc.y).x;
        r = Y.ACMACS.newSVGMatrix()
        .translate(flipX, 0)
        .flipX()
        .translate(-flipX, 0);
        this.simulateTransformation(r);
      }
      else {
        flipX = this.viewportCentre().x;
        r = Y.ACMACS.newSVGMatrix()
        .translate(flipX, 0)
        .flipX()
        .translate(-flipX, 0);

        this.groupDOMNode.applyTransformation(
          r.multiply(this.groupDOMNode.getCTM())
        );
      }
    },


    // <a name="verticalFlip">
    // ### verticalFlip()

    // Flip this layer relative to the centre of the viewport.
    //
    verticalFlip: function () {
      var
          vpc = this.viewportCentre(),

          // Transformation origin
          flipY,

          // Reflection matrix
          r;


      if (this.simulated) {
        flipY = this.worldPoint(vpc.x, vpc.y).y;
        r = Y.ACMACS.newSVGMatrix()
        .translate(0, flipY)
        .flipY()
        .translate(0, -flipY);
        this.simulateTransformation(r);
      }
      else {
        flipY = this.viewportCentre().y;
        r = Y.ACMACS.newSVGMatrix()
        .translate(0, flipY)
        .flipY()
        .translate(0, -flipY);

        this.groupDOMNode.applyTransformation(
          r.multiply(this.groupDOMNode.getCTM())
        );
      }
    },


    // <a name="applyTransformation">
    // ### applyTransformation()

    // Applies a transformation to this layer's base group, discarding any
    // transformation it may already have.
    //
    applyTransformation: function (matrix) {
      this.groupDOMNode.applyTransformation(matrix);
    },

    // <a name="simulateTransformation">
    // ### simulateTransformation()

    // Move the nodes on the canvas simulating a transformation applied to base
    // group.
    //
    simulateTransformation: function (matrix) {
      //
      var
          // Transformation matrix
          t,

          // The point to be transformed, corresponding to each node's centre
          p = this.canvasDOMNode.createSVGPoint(),

          // The transformed point
          tp = this.canvasDOMNode.createSVGPoint();

      if (matrix instanceof SVGMatrix) {
        t = matrix;
      }
      else if (Y.Lang.isArray(matrix)) {
        t = Y.ACMACS.newSVGMatrix();
        Y.each(['a', 'b', 'c', 'd', 'e', 'f'], function (k, i) {
          t[k] = matrix[i];
        });
      }

      // Translate the node from point `p` to the transformed point `tp`.
      //
      // SVG nodes do not have a `translate()` method; to keep the layer code
      // better organised, the method implementing translation of an ACMACS map
      // point,
      // [`translatePreservingTilt()`](svg-methods.html#translatePreservingTilt),
      // has been added as a DOM extension.

      Y.each(this.groupDOMNode.childNodes, function (node) {
        p.x = node.X;
        p.y = node.Y;
        tp = p.matrixTransform(t);
        node.translatePreservingTilt(tp.x - p.x, tp.y - p.y);
        if (node.index !== undefined) {
          // some nodes may remain un-indexed while this code develops
          if (this.pointList[node.index]) {
            this.pointList[node.index].translateLabel(tp.x - p.x, tp.y - p.y);
          }
        }
      }, this);

      // Point co-ordinates have changed; update the index tree
      this.updateIndex();
    }, // simulateTransformation()


    // ------------------------------------------------------------------------
    // ## Auxiliary methods


    // <a name="svgPoint">
    // ### svgPoint()

    // Creates an SVGPoint object from `x` and `y` co-ordinates passed as
    // arguments.
    svgPoint: function (x, y) {
      var svgp = this.canvasDOMNode.createSVGPoint();
      svgp.x = x;
      svgp.y = y;
      return svgp;
    },


    // <a name="displayPoint">
    // ### displayPoint()

    // Creates an `SVGPoint` object representing the display image of a point
    // in world co-ordinates passed as arguments.
    displayPoint: function (x, y) {
      return this.svgPoint(x, y).matrixTransform(
        this.groupDOMNode.getCTM()
      );
    },

    // <a name="displayPointOp">
    // ### displayPointOp()

    // Creates an `SVGPoint` object representing the display image of a point
    // in operation group co-ordinates. The operation group is used to
    // translate selected points together during pointer move events.
    displayPointOp: function (x, y) {
      return this.svgPoint(x, y).matrixTransform(
        this.operationGroupDOMNode.getCTM()
      );
    },


    // <a name="worldPoint">
    // ### worldPoint()

    // Creates an `SVGPoint` object representing a world point corresponding to
    // display co-ordinates passed as arguments.
    worldPoint: function (x, y) {
      return this.svgPoint(x, y).matrixTransform(
        this.groupDOMNode.getCTM().inverse()
      );
    },

    // <a name="chirality">
    // ### chirality()

    // The layer's chirality: left (-1) or right (1). Right-handed layers
    // preserve the sense of rotation; the left-handed ones reverse it.
    chirality: function () {
      return this.groupDOMNode.getCTM().chirality();
    },

    // <a name="getBBox">
    // ### getBBox()

    // Returns the bounding box of all nodes on this layer.
    getBBox: function () {
      return this.groupDOMNode.getBBox();
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


    // <a name="mapUnitSize">
    // ### mapUnitSize()

    // Returns the length of the map unit in display co-ordinates.
    mapUnitSize: function () {
      var
        wp0 = this.svgPoint(0, 0),
        wp1 = this.svgPoint(0, 1),
        p0 = this.displayPoint(wp0.x, wp0.y),
        p1 = this.displayPoint(wp1.x, wp1.y);

      return Math.sqrt(
        (p1.x - p0.x) * (p1.x - p0.x) + (p1.y - p0.y) * (p1.y - p0.y)
      );
    },


    // <a name="visibleWorld">
    // ### visibleWorld()

    // Returns an object representing the area in this layer's world co-ordinates
    // visible through the viewport.
    visibleWorld: function () {
      var tl, bl, tr, br, minX, minY, maxX, maxY;

      tl = this.worldPoint(0, 0);
      br = this.worldPoint(this.get('width'), this.get('height'));
      bl = {x: tl.x, y: br.y};
      tr = {x: br.x, y: tl.y};

      minX = [tl.x, tr.x, bl.x, br.x].min();
      minY = [tl.y, tr.y, bl.y, br.y].min();
      maxX = [tl.x, tr.x, bl.x, br.x].max();
      maxY = [tl.y, tr.y, bl.y, br.y].max();

      return {
        rotation: this.groupDOMNode.getCTM().rotation(),
        bbox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        }
      };
    },


    // <a name="viewportwidth">
    // ### viewportWidth()

    // Return viewport width in pixels
    viewportWidth: function () {
      return parseInt(this.get('contentBox').getStyle('width').split("px")[0], 10);
    },

    // <a name="viewportHeight">
    // ### viewportHeight()

    // Return viewport height in pixels
    viewportHeight: function () {
      return parseInt(this.get('contentBox').getStyle('height').split("px")[0], 10);
    },

    // <a name="viewportCentre">
    // ### viewportCentre()

    // Return an object whose `x` and `y` properties represent the current
    // viewport centre.
    viewportCentre: function () {
      var contentBox = this.get('contentBox');
      return {
        x: parseInt(contentBox.getStyle('width').split("px")[0], 10) / 2,
        y: parseInt(contentBox.getStyle('height').split("px")[0], 10) / 2
      };
    },


    // <a name="setDeviceDimensions">
    // ### setDeviceDimensions()

    // Sets the viewing transformation given the new viewport width and height
    // in pixels.
    //
    // Resizing the SVG canvas does not automatically update the viewing
    // transformation, so ann update method like this is needed to prevent
    // geometry change due to resizing.
    //
    // This method is hooked up to the `width` and `height` attribute setters.
    //
    // It is roughly similar to
    // [`SVGElement.applyTransformation()`](svg-methods.html#applyTransformation) so
    // there may be a potential for abstraction or re-use (although
    // `applyTransformation()` takes a matrix object as input, while here we're
    // composing it out of two numbers -- device dimensions).
    //
    // It is only needed for an SVG layer; the canvas-based layer will have its
    // `syncUI()` method called by the chartSizeChange listener.
    setDeviceDimensions: function (width, height) {
      if (this.kind === 'SVG') {
        if (this.name === 'acmacsLabelLayer') {
          this.setPixelSize();
          this.scale = this.onePixel / this.parent.map.onePixel;
        }
        else {
          this.groupDOMNode.setAttribute('transform', Y.substitute(
            'matrix({width}, 0, 0, {height}, 0, 0)',
            {
              width: width,
              height: height
            }
          ));
        }
      }
    },


    // <a name="setPixelSize">
    // ### setPixelSize()

    // Determine the pixel size in world co-ordinates. This operation is a
    // pre-requisite for calling plot() routines.
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


    // <a name="numberOfNodes">
    // ### numberOfNodes()

    // Count the number of nodes in the base group.
    //
    numberOfNodes: function () {
      return this.groupDOMNode.childNodes.length;
    },


    // <a name="lineExists">
    // ### lineExists()

    // Test if a fully co-incident line exists and add the given line
    // to the layer's line hash if it does not. Co-incidence is determined
    // to the 10-th floating point digit.
    //
    lineExists: function (start, end) {
      var
        that = this,
        string = start.concat(end).map(function (arg) {
          return Math.round(arg / that.onePixel);
        }).join(':');


      if (this.lineHash[string]) {
        return true;
      }

      this.lineHash[string] = true;
      return false;
    }
  },

  // ------------------------------------------------------------------------
  // Static members and methods
  // ------------------------------------------------------------------------
  staticProperties: {
    // ### Instance attributes
    ATTRS: {
      // The width of the layer widget and of the SVG canvas it hosts, in pixels.
      width: {
        setter: function (arg) {
          var w = arg;
          if (this.canvas) {
            if (Y.Lang.isString(arg)) {
              w = parseInt(arg.split("px")[0], 10);
            }
            this.canvas.setAttribute('width', w);
            // Chrome fails to update geometry on attribute change.
            this.canvas.setStyle('width',  w + 'px');
          }
          return w;
        }
      },

      // The height of the layer widget and of the SVG canvas it hosts, in
      // pixels. The setter method for this attribute passes the value inherited
      // from the stack (`this.parent`) on to the canvas and adjusts the viewing
      // transformation on it to reflect the new setting.
      height: {
        setter: function (arg) {
          var h = arg;
          if (this.canvas) {
            if (Y.Lang.isString(arg)) {
              h = parseInt(arg.split("px")[0], 10);
            }
            this.canvas.setAttribute('height', h);
            // Chrome fails to update geometry on attribute change.
            this.canvas.setStyle('height',  h + 'px');
          }
          return h;
        }
      },

      // The layer's opacity in fractions of one
      opacity: {
        value: 1,
        setter: function (value) {
          this.get('contentBox').setStyle('opacity', value / 100);
        }
      },

      // <a name="pointSizeCalibration">

      // Device-dependent point size calibration; per-widget setting
      pointSizeCalibration: {
        value: undefined
      },

      // <a name="pointScale">

      // The point scale factor; per-widget setting
      pointScale: {
        value: undefined
      },

      // <a name="labelSizeCalibration">

      // Device-dependent label size calibration
      labelSizeCalibration: {
        value: undefined
      },

      // <a name="labelScale">

      // The label scale factor
      labelScale: {
        value: undefined
      }
    }
  }
};

Y.namespace('ACMACS').LayerWidget = Y.Base.create(
  "acmacsLayerWidget",
  Y.Widget,
  [Y.WidgetStack, Y.ACMACS.WidgetTreeNode],
  code.prototypeProperties,
  code.staticProperties
);


}, '@VERSION@', {
  requires: ['base', 'acmacs-base']
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
