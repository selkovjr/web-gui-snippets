/*
  # license
  # license.
*/
// ======================================================================

/*global Y: false */
Y.namespace('ACMACS').GridLayer = Y.Base.create('acmacsGridLayer', Y.ACMACS.LayerWidget, [], {
  CONTENT_TEMPLATE: null,

  kind: 'canvas',

  can: {
    pan: true,
    rotate: false,
    zoom: false,
    flip: false
  },

  monolithic: true,

  simulated: false,

  // HTML5 canvas node, its DOM node and painting context
  canvas: undefined,
  canvasDOMNode: undefined,
  context: undefined,
  heightListener: undefined,

  initializer: function () {
    this.canvas = null;
    this.canvasDOMNode = null;
    this.context = null;
    this.listeners = [];
  },

  destructor: function () {
    this.canvas.remove();
    this.canvas.destroy();
    this.canvas = null;
    this.canvasDOMNode = null;
    this.context = null;
    Y.each(this.listeners, function (handle) {
      handle.detach();
    });
  },

  renderUI: function () {
    var contentBox = this.get('contentBox');

    contentBox.append(
      '<canvas class="acmacs-canvas">' +
      'This browser does not support the canvas element' +
      '</canvas>'
    );
    this.canvas = contentBox.one('canvas');
    this.canvasDOMNode = Y.Node.getDOMNode(this.canvas);
    this.context = this.canvasDOMNode.getContext('2d');
    this.syncUI();
  },

  syncUI: function () {
    var grad,
        width = this.get('width'),
        height = this.get('height'),
        canvas = this.canvasDOMNode,
        context = this.context,
        w = this.parent.trueVisibleWorld();

    canvas.width = width;
    canvas.height = height;
    this.context.fillStyle = "rgba(230, 230, 230, 0.5)";
    this.context.fillRect(w.bbox.x, w.bbox.y, w.bbox.width, w.bbox.height);
  },

  bindUI: function () {
    this.listeners.push(this.after('widthChange', this.syncUI));
    this.listeners.push(this.after('heightChange', this.syncUI));
  },

  pan: function (x, y) {
    var startPoint = this.worldPoint(0, 0),
        endPoint = this.worldPoint(x, y),
        w = this.parent.trueVisibleWorld();

    // Store the current transformation matrix
    this.context.save();

    // Use the identity matrix while clearing the canvas
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.get('width'), this.get('height'));
    // This is needed to clear the lines.
    this.context.beginPath();

    // Restore the transform
    this.context.restore();

    this.context.translate(-(endPoint.x - startPoint.x), -(endPoint.y - startPoint.y));
    this.context.fillStyle = "rgba(230, 230, 230, 0.5)";
    this.context.fillRect(w.bbox.x, w.bbox.y, w.bbox.width, w.bbox.height);
    this.context.fillStyle = 'rgb(0, 0, 0, 0.5)';
    this.context.font = '10px sans-serif';
    this.context.fillText('(0, 0)', 0, 0);
  },

  worldPoint: function (x, y) {
    return this.parent.shadow.worldPoint(x, y);
  }

}, {
  ATTRS: {
    // Specifies the rendering engine used by the layer. No other rendereres
    // besides SVG are used by the layers deriving from the `WidgetLayer`
    // prototype, so this value is set in stone for those, but other prototypes
    // implementing the layer interface are possible (_e.g._, `BackgroundLayer`
    // and this attribute can be used to tell one from another.

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
