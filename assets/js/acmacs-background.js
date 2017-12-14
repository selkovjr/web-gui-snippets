/*
  # license
  # license.
*/
// ======================================================================

/*global Y: false */
Y.namespace('ACMACS').BackgroundLayer = Y.Base.create('acmacsBackgroundLayer', Y.Widget, [Y.ACMACS.WidgetTreeNode], {

  // * Setting `CONTENT_TEMPLATE` to `null` disposes of Widget's two-box
  // rendering model. Content box and bounding box become the same.
  CONTENT_TEMPLATE: null,

  kind: 'canvas',

  can: {
    pan: null,
    rotate: null,
    zoom: null,
    flip: null
  },

  monolithic: true,

  // HTML5 canvas node, its DOM node and painting context
  canvas: undefined,
  canvasDOMNode: undefined,
  context: undefined,
  parent: undefined,
  rootWidget: undefined,

  initializer: function (config) {
    this.instanceName = config.instanceName;
  },

  destructor: function () {
    this.context = undefined;
    this.canvas = undefined;
    this.canvasDOMNode = undefined;

    // Y.ACMACS.WidgetTreeNode properties
    this.parent = undefined;
    this.rootWidget = undefined;
  },

  renderUI: function () {
    var fill = this.get('fill');

    this.contentBox = this.get('contentBox');
    if (fill === 'gradient') {
      this.contentBox.append(
        '<canvas class="acmacs-canvas">' +
        'This browser does not support the canvas element' +
        '</canvas>'
      );
      this.canvas = this.contentBox.one('canvas');
      this.canvasDOMNode = Y.Node.getDOMNode(this.canvas);
      this.context = this.canvasDOMNode.getContext('2d');
      this.syncUI();
    }
    else {
      // Presume fill is a CSS colour spec.
      this.canvas = this.contentBox;
      this.canvasDOMNode = Y.Node.getDOMNode(this.contentBox);
      this.contentBox.addClass('acmacs-canvas');
      this.contentBox.setStyle('backgroundColor', fill);
    }
  },

  syncUI: function () {
    var grad,
        width = this.get('width'),
        height = this.get('height'),
        canvas = this.canvasDOMNode,
        context;

    canvas.width = width;
    canvas.height = height;
    if (canvas.tagName === 'canvas') {
      context = this.context;
      grad = context.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#d0d0d0');
      grad.addColorStop(1, 'white');
      context.fillStyle = grad;
      context.fillRect(0, 0, width, height);
      context.fillStyle = 'rgb(240, 240, 240)';
      context.fillText('Background Layer', width / 3, height / 6);
    }
  },

  // A dummy API call, to be consistent with other layers
  setDeviceDimensions: function (width, height) {
    this.syncUI();
  }
}, {
  ATTRS: {
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
        this.contentBox.setStyle('opacity', value / 100);
      }
    },

    fill: {
      value: undefined
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
