YUI.add('acmacs-shadowlayer', function(Y) {

// ======================================================================

// ----------------------------------------------------------------------------
// Y.ACMACS.ShadowLayer
// ----------------------------------------------------------------------------

// This is a sleazy cheat: instead of trying to understand the transformation
// mechanics enough to be able to keep track of a sequence of changes in the
// view, I insert this empty layer into the stack, and it does that for me. By
// default, it is configured to receive all the same transformations as the map
// layer(s) in the same stack, with the only difference that it will do the
// real common-mode zoom and thus preserve the information necessary to recover
// world co-ordinates of the objects residing on map layers.
//
// It is even possible that this method achieves a better performance because it
// relieves me from doing expensive calculations in JavaScript.

// This module is based on `Y.ACMACS.LayerWidget`, but it redefines some of
// LayerWidget's methods for efficiency.

/*global Y: false, document: false */
var code = {
  // ## Prototype properties
  prototypeProperties: {
    // ------------------------------------------------------------------------
    // ## Life cycle methods

    // <a name="initializer">
    // ### initializer()

    // Make sure the instance propreties exist. Failing to assign a value to them
    // will result in prototype properties shared among all instances of the
    // widget.
    //
    // Initializers are chained, so only initialize the properties used in
    // `ShadowLayer`.
    //
    initializer: function (config) {
      this.viewportGroup = null;
      this.slideGroup = null;
      this.zoomGroup = null;
      this.pivotGroup = null;
      this.reflectorGroup = null;
      this.initGroup = null;
      this.worldGroup = null;
    },

    // <a name="destructor">
    // ### destructor()

    // Clean up the DOM and the JavaScript objects on destruction.
    //
    // Destructors are chained, so only initialize the properties used in
    // `ShadowLayer`.
    //
    destructor: function () {
      this.viewportGroup = undefined;
      this.slideGroup = undefined;
      this.zoomGroup = undefined;
      this.pivotGroup = undefined;
      this.reflectorGroup = undefined;
      this.initGroup = undefined;
      this.worldGroup = undefined;
      this.canvasDOMNode = undefined;
      this.baseGroup = undefined;
      this.groupDOMNode = undefined;
      this.contentBox = undefined;
    },


    // ------------------------------------------------------------------------
    // ## Composition methods

    // <a name="renderUI">
    // ### renderUI()
    // This method implements the part of Widget's life cycle where widget
    // elements are assembled and rendered into the DOM.
    // <a name="renderUI">
    // ### renderUI()

    // This is almost a copy of the base layer's `renderUI()` method, except it
    // includes a set of group nodes, each tracking an component of the
    // factorised transformation. If any points were rendered in the innermost
    // group, they would coincide with their counterparts on the map layer.
    //
    // The renderUI() methods are not chained, so this method needs to do the
    // entire construction job.
    //
    renderUI: function () {
      var
        width = parseInt(this.get('width'), 10),
        height = parseInt(this.get('height'), 10);

      this.canvas = Y.Node.create(Y.substitute(
        '<svg' +
        ' xmlns="http://www.w3.org/2000/svg"' +
        ' version="1.1"' +
        ' width="{width}"' +
        ' height="{height}"' +
        '>' +
        '  <g class="basegroup"></g>' +
        '  <g class="viewport">' +
        '    <g class="slide">' +
        '      <g class="pivot">' +
        '        <g class="zoom">' +
        '          <g class="reflector">' +
        '            <g class="init">' +
        '              <g class="world" />' +
        '            </g>' +
        '          </g>' +
        '        </g>' +
        '      </g>' +
        '    </g>' +
        '  </g>' +
        '</svg>',
        {
          width: width,
          height: height
        }
      ));

      this.viewportGroup = this.canvas.one('.viewport');
      this.slideGroup = this.canvas.one('.slide');
      this.zoomGroup = this.canvas.one('.zoom');
      this.pivotGroup = this.canvas.one('.pivot');
      this.reflectorGroup = this.canvas.one('.reflector');
      this.initGroup = this.canvas.one('.init');
      this.worldGroup = this.canvas.one('.world');

      this.canvasDOMNode = Y.Node.getDOMNode(this.canvas);
      this.baseGroup = this.canvas.one('.basegroup');
      this.groupDOMNode = Y.Node.getDOMNode(this.baseGroup);

      this.contentBox = this.get('contentBox');
      this.contentBox.append(this.canvas);

      return this;
    },

    // <a name="centredRotate">
    // ### centredRotate()

    // Rotate the p relative to the centre of the viewport.
    //
    centredRotate: function (arg) {
      var vc = this.viewportCentre();
      this.rotate(arg, vc.x, vc.y);
    },

    centredZoom: function (delta) {
      var vc = this.viewportCentre();
      this.zoom(1 + delta, vc.x, vc.y);
    },

    // <a name="pan">
    // ### pan()

    // Translate the layer along a vector defined by the (x, y) co-ordinate pair.
    pan: function (x, y) {
      var
        startPoint,
        endPoint,
        sp,
        ep,
        delta = {},
        tr = this.slideGroup.getDOMNode().getTranslation(),
        rot = this.pivotGroup.getDOMNode().getRotation(),

        // Pivot centre
        slideWorldPoint = Y.bind(function (x, y) {
          return this.svgPoint(x, y).matrixTransform(
            this.pivotGroup.getDOMNode().getCTM().inverse()
          );
        }, this);

      startPoint = this.worldPoint(0, 0);
      sp = slideWorldPoint(0, 0);

      // Translation vector on the viewport.
      endPoint = this.worldPoint(x, y);
      ep = slideWorldPoint(x, y);

      delta.x = ep.x - sp.x;
      delta.y = ep.y - sp.y;

      this.groupDOMNode.applyTransformation(
        this.groupDOMNode.getCTM().translate(
          endPoint.x - startPoint.x,
          endPoint.y - startPoint.y
        )
      );

      this.slideGroup.getDOMNode().applyTranslation(
        tr.x + delta.x,
        tr.y + delta.y
      );

      this.pivotGroup.getDOMNode().applyTranslation(
        tr.x + delta.x,
        tr.y + delta.y
      );

      // Can't shift the pivot group without shifting the pivot point in the opposite direction.
      this.pivotGroup.getDOMNode().applyTransformation(
        Y.ACMACS.newSVGMatrix()
        .translate(rot.x - delta.x, rot.y - delta.y)
        .rotate(rot.angle)
        .translate(-(rot.x - delta.x), -(rot.y - delta.y))
      );
    }, // pan()


    // <a name="horizontalFlip">
    // ### horizontalFlip()

    // Flip this layer relative to the centre of the viewport.
    //
    horizontalFlip: function () {
      var
        // Reflection matrix
        r,

        // Flip centre
        c = this.viewportCentre(),

        // Reflector group
        reflector = this.reflectorGroup.getDOMNode(),

        // From screen to world
        m = reflector.getCTM().inverse(),

        w = this.get('width'),
        h = this.get('height'),

        // Top centre and bottom centre points
        t = this.svgPoint(w / 2, 0).matrixTransform(m),
        b = this.svgPoint(w / 2, h).matrixTransform(m);

      // Transform the base group
      r = Y.ACMACS.newSVGMatrix()
      .translate(c.x, 0)
      .flipX()
      .translate(-c.x, 0);

      this.groupDOMNode.applyTransformation(
        r.multiply(this.groupDOMNode.getCTM())
      );

      // Transform the compound slide
      reflector.reflectThroughLine(b, t);
    },


    // <a name="verticalFlip">
    // ### verticalFlip()

    // Flip this layer relative to the centre of the viewport.
    //
    verticalFlip: function () {
      var
        // Reflection matrix
        r,

        // Flip centre
        c = this.viewportCentre(),

        // Reflector group
        reflector = this.reflectorGroup.getDOMNode(),

        // From screen to world
        m = reflector.getCTM().inverse(),

        w = this.get('width'),
        h = this.get('height'),

        // Top centre and bottom centre points
        right = this.svgPoint(w, h / 2).matrixTransform(m),
        left = this.svgPoint(0, h / 2).matrixTransform(m);


      // Transform the base group
      r = Y.ACMACS.newSVGMatrix()
      .translate(0, c.y)
      .flipY()
      .translate(0, -c.y);

      this.groupDOMNode.applyTransformation(
        r.multiply(this.groupDOMNode.getCTM())
      );

      // Transform the compound slide
      reflector.reflectThroughLine(left, right);
    },


    // <a name="rotate">
    // ### rotate()

    // Rotate the layer by the angle supplied in the first argument, around the
    // pivot point defined by the second and third arguments (x and y,
    // respectively).
    rotate: function (arg, x, y) {
      var pivotPoint,
          r,
          p,
          angle,

          // Pivot centre
          pivotWorldPoint = Y.bind(function (x, y) {
            return this.svgPoint(x, y).matrixTransform(
              this.pivotGroup.getDOMNode().getCTM().inverse()
            );
          }, this);

      p = pivotWorldPoint(x, y);
      pivotPoint = this.worldPoint(x, y);

      angle = arg * this.chirality();

      r = Y.ACMACS.newSVGMatrix()
      .translate(pivotPoint.x, pivotPoint.y)
      .rotate(angle)
      .translate(-pivotPoint.x, -pivotPoint.y);

      // Transform the base group
      this.groupDOMNode.applyTransformation(
        this.groupDOMNode.getCTM().multiply(r)
      );

      // Transform the compound slide
      this.pivotGroup.getDOMNode().transformBy(
        Y.ACMACS.newSVGMatrix()
        .translate(p.x, p.y)
        .rotate(arg)
        .translate(-p.x, -p.y)
      );
    },


    // <a name="zoom">
    // ### zoom()

    // Scale this layer's content using the specified zoom factor `zf` (no change
    // at `zf == 1`). The co-ordinates `x` and `y` set the transformation origin
    // (the fixed point).
    zoom: function (zf, x, y) {
      //
      var
        // The `SVGPoint` object representing the origin of the transformation
        p = this.worldPoint(x, y),
        pz,

        // Scale matrix
        k, kz,

        // Zoom centre
        zoomWorldPoint = Y.bind(function (x, y) {
          return this.svgPoint(x, y).matrixTransform(
            this.zoomGroup.getDOMNode().getCTM().inverse()
          );
        }, this);

      pz = zoomWorldPoint(x, y);
      // Compute the scale matrix at the current pointer position. What this
      // expression does, it translates the world to place the current event
      // point to space origin, scales the space, then translates it back.
      // Nothing happens to the world at this point, because the result is just
      // a matrix.
      k = Y.ACMACS.newSVGMatrix().translate(p.x, p.y).scale(zf)
      .translate(-p.x, -p.y);

      // Compute the scale matrix for the scale group.
      kz = Y.ACMACS.newSVGMatrix().translate(pz.x, pz.y).scale(zf)
      .translate(-pz.x, -pz.y);

      // And now this matrix is applied to the viewing transformation and to
      // the current transformation on the scale group, so again, nothing
      // happens to the world. Only the view gets scaled.
      this.groupDOMNode.applyTransformation(
        this.groupDOMNode.getCTM().multiply(k)
      );

      // Transform the compound slide
      this.zoomGroup.getDOMNode().applyTransformation(
        this.zoomGroup.getDOMNode().getTransformation().multiply(kz)
      );

      // Adjust stroke width
      Y.each(this.groupDOMNode.childNodes, function (node) {
        var w = parseFloat(node.getAttribute('stroke-width'));
        node.setAttribute('stroke-width', w / zf);
      });
    }, /* zoom() */


    // <a name="transformation">
    // ### transformation()

    // Return the cumulative transformation from the initial state of the world
    // to its current state (not including the initial transformation).
    transformation: function () {
      return Y.ACMACS.newSVGMatrix().multiply(
        this.slideGroup.getDOMNode().getTransformation().multiply(
          this.pivotGroup.getDOMNode().getTransformation().multiply(
            this.zoomGroup.getDOMNode().getTransformation().multiply(
              this.reflectorGroup.getDOMNode().getTransformation().multiply(
                this.initGroup.getDOMNode().getTransformation()
              )
            )
          )
        ).inverse()
      );
    },

    // <a name="orientation">
    // ### orientation()

    // Return the orientation matrix that combines rotation and reflection
    // applied to the initial map by the user.
    orientation: function () {
      var m = Y.ACMACS.newSVGMatrix().multiply(
        this.pivotGroup.getDOMNode().getTransformation().multiply(
          this.reflectorGroup.getDOMNode().getTransformation().multiply(
            this.initGroup.getDOMNode().getTransformation()
          )
        ).inverse()
      );
      m.e = m.f = 0;
      return m;
    },

    initialTransformation: function () {
      return Y.ACMACS.newSVGMatrix()
        .multiply(this.initGroup.getDOMNode().getTransformation())
      ;
    }
  },
  staticProperties: {
    ATTRS: {
      simulated: {
        value: false,
        readOnly: true
      }
    }
  }
};

Y.namespace('ACMACS').ShadowLayer = Y.Base.create(
  'acmacsShadowLayer',
  Y.ACMACS.LayerWidget,
  [Y.ACMACS.WidgetTreeNode],
  code.prototypeProperties,
  code.staticProperties
);

}, '@VERSION@', {
  requires: ['base', 'acmacs-base', 'acmacs-layer', 'svg-methods', 'array-methods']
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
