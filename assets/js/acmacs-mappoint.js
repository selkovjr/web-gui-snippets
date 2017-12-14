YUI.add('acmacs-mappoint', function(Y) {

// ======================================================================

// _Map point_
//

// This object co-ordinates the positioning and styling of point nodes and
// their corresponding label nodes.
//

/*global Y: false, document: false */
var code = {
  pointNode: null,
  pointDOMNode: null,

  textNode: null,
  textDOMNode: null,

  blobNode: null,
  blobDOMNode: null,

  leaderNode: null, // The line connecting the label to its point
  leaderDOMNode: null,

  layer: null,
  labelLayer: null,

  // Co-ordinates of label anchor relative to the point centre
  labelPositionX: 0,
  labelPositionY: 1,

  pickupPoint: null,

  savedData: null,

  index: null,
  selected: null,

  initializer: function (arg) {
    this.layer = arg.layer;
    this.x = arg.x;
    this.y = arg.y;
    this.pointDOMNode = arg.pointDOMNode;
    this.pointNode = Y.one(this.pointDOMNode);
    this.index = arg.index;
    this.selected = false;
    this.savedData = {};
    this.savedData.attr = {};
    this.saveAttributes();
  },


  // The explicit point object destructor
  destroy: function () {
    this.index = undefined;
    this.selected = undefined;
    this.savedData = undefined;
    this.pointNode = undefined;
    this.pointDOMNode = undefined;
    this.textNode = undefined;
    this.blobtDOMNode = undefined;
    this.blobNode = undefined;
    this.textDOMNode = undefined;
    this.leaderNode = undefined;
    this.leaderDOMNode = undefined;
    this.layer = undefined;
    this.labelLayer = undefined;
    this.pickupPoint = undefined;
  },


  addLabel: function (arg) {
    var
      dp = this.layer.displayPoint(this.pointDOMNode.X, this.pointDOMNode.Y),
      wp,
      offsetX = arg.labelX,
      offsetY = arg.labelY;

    if (arg.labelX === undefined) {
      offsetX = 0;
    }
    if (arg.labelY === undefined) {
      offsetY = 1;
    }

    this.labelPositionX = offsetX;
    this.labelPositionY = offsetY;

    this.labelLayer = arg.layer;

    // The label layer may be trnanslatd, so need to know the
    // world point on it.
    wp = this.labelLayer.worldPoint(dp.x, dp.y);

    this.textDOMNode = this.labelLayer.addText({
      x: wp.x,
      y: wp.y,
      offsetX: offsetX,
      offsetY: offsetY,
      label_position_type: arg.label_position_type,
      pointSize: this.pointDOMNode.getBBox().width * this.labelLayer.scale,
      size: arg.size,
      text: arg.text,
      font: arg.font,
      fill: arg.fill,
      opacity: arg.opacity
    });

    this.textNode = Y.one(this.textDOMNode);

    this.textDOMNode.index = arg.index;

    if (arg.label_position_type && arg.label_position_type === 'tethered') {
      this.tethered = true;
      this.updateLeader();
    }
  },


  labelVisible: function () {
    var nodeExists = this.textNode ? true : false;
    if (nodeExists) {
      if (this.textNode.getStyle('display') === 'block') {
        if (this.textNode.getStyle('visibility') === 'hidden') {
          return false;
        }
        return true;
      }
    }
    return false;
  },


  removeLabel: function () {
    this.labelPositionX = undefined;
    this.labelPositionY = undefined;
    this.textNode.remove();
    this.textDOMNode.index = undefined;
  },


  hideLabel: function () {
    if (this.textNode) {
      this.textNode.hide();
      if (this.leaderNode) {
        this.leaderNode.hide();
      }
    }
  },


  showLabel: function () {
    if (this.textNode) {
      this.textNode.show();
      if (this.leaderNode) {
        this.leaderNode.show();
      }
    }
  },


  showBlob: function (point, pointStyle, blobStyle) {
    var
      fillRgba = pointStyle.fill_color || '#000000',
      fillColor,
      fillOpacity,
      strokeRgba = pointStyle.outline_color || '#000000',
      strokeColor = strokeRgba,
      strokeOpacity,
      strokeWidth,
      zoomFactor = Math.abs(this.layer.rootWidget.transformation().a) /
        Math.abs(this.layer.parent.shadow.initialTransformation().a);

    // If the type of fillRgba or strokeRgba is 'array', it contains
    // colour and opacity in separate items. If it is a scalar, then it
    // is just colour with the opacity of 1.

    if (Y.Lang.isArray(fillRgba)) {
      fillColor = fillRgba[0];
      fillOpacity = fillRgba[1];
    }
    else {
      fillColor = fillRgba;
      fillOpacity = 1;
    }
    if (Y.Lang.isArray(strokeRgba)) {
      strokeColor = strokeRgba[0];
      strokeOpacity = strokeRgba[1];
    }
    else {
      strokeColor = strokeRgba;
      strokeOpacity = 1;
    }

    // Copy stroke-width from the point node. Because the value stored on the node
    // has been calibrated inside addPoint(), in needs to be un-calibrated before
    // using it in another call to addPoint(). It also needs to be scaled with the
    // current zoomFactor obtained from the shadow layer.
    strokeWidth = zoomFactor *
      parseFloat(this.pointDOMNode.getAttribute('stroke-width')) /
      this.layer.onePixel /
      this.layer.attributeOrProfileSetting('pointSizeCalibration');

    if (this.blobNode) {
      this.blobNode.remove();
    }
    this.blobDOMNode = this.layer.parent.shadow.addPoint({
      index: this.index,
      point: point,
      shape: 'blob',
      aspect: 1, // needed to fall in the right case in layer.addPoint()
      contour: blobStyle.contour,
      smooth: blobStyle.smooth,
      fill: fillColor,
      fillOpacity: fillOpacity * this.layer.setting('forcedOpacityFactor'),
      stroke: strokeColor,
      strokeOpacity: strokeOpacity * this.layer.setting('forcedOpacityFactor'),
      strokeWidth: strokeWidth
    });
    this.blobNode = Y.one(this.blobDOMNode);

    this.pointNode.hide();

    this.updateLeader();
  },


  hideBlob: function () {
    this.pointNode.show();
    if (this.blobNode) {
      this.blobNode.remove();
      delete this.blobNode;
      delete this.blobDOMNode;
      this.updateLeader();
    }
  },


  saveAttributes: function () {
    this.savedData.attr.strokeWidth = parseFloat(this.pointDOMNode.getAttribute('stroke-width'));
    this.savedData.attr.strokeOpacity = parseFloat(this.pointDOMNode.getAttribute('stroke-opacity'));
    this.savedData.attr.fillOpacity = parseFloat(this.pointDOMNode.getAttribute('fill-opacity'));
  },


  restoreAttributes: function () {
    this.pointDOMNode.setAttribute('stroke-width', this.savedData.attr.strokeWidth);
    this.pointDOMNode.setAttribute('stroke-opacity', this.savedData.attr.strokeOpacity);
    this.pointDOMNode.setAttribute('fill-opacity', this.savedData.attr.fillOpacity);
    if (this.enlarged) {
      // expansion = node.size * (scale - 1) / 2;
      if (this.textNode) {
        this.adjustLabelPosition(-0.25 * this.pointDOMNode.size);
      }
      this.pointDOMNode.scale(0.5);
      this.enlarged = undefined;
    }
  },


  pale: function () {
    this.pointDOMNode.setAttribute('stroke-width', this.savedData.attr.strokeWidth);
    this.pointDOMNode.setAttribute('stroke-opacity', 0.4 * this.savedData.attr.strokeOpacity);
    this.pointDOMNode.setAttribute('fill-opacity', 0.4 * this.savedData.attr.fillOpacity);
    if (this.enlarged) {
      // expansion = node.size * (scale - 1) / 2;
      if (this.textNode) {
        this.adjustLabelPosition(-0.25 * this.pointDOMNode.size);
      }
      this.pointDOMNode.scale(0.5);
      this.enlarged = undefined;
    }
  },


  highlight: function (enlarge) {
    this.pointDOMNode.setAttribute('stroke-width', 2 * this.savedData.attr.strokeWidth);
    this.pointDOMNode.setAttribute('stroke-opacity', 1.4 * this.savedData.attr.strokeOpacity);
    this.pointDOMNode.setAttribute('fill-opacity', 1.4 * this.savedData.attr.fillOpacity);
    if (enlarge) {
      // expansion = node.size * (scale - 1) / 2;
      if (this.textNode) {
        this.adjustLabelPosition(0.5 * this.pointDOMNode.size);
      }
      this.pointDOMNode.scale(2);
      this.enlarged = true;
    }
  },


  toggle: function (enlarge) {
    if (this.selected) {
      this.selected = false;
      this.layer.selected -= 1;
      if (this.layer.selected) {
        this.pale();
      }
      else {
        this.restoreAttributes();
      }
    }
    else {
      this.selected = true;
      this.layer.selected += 1;
      this.highlight(enlarge);
    }
  },

  translateLabelSimple: function (dx, dy) {
    var x, y, bb;

    x = parseFloat(this.textDOMNode.getAttribute('x')) + dx;
    y = parseFloat(this.textDOMNode.getAttribute('y')) + dy;
    this.textDOMNode.setAttribute('x', x);
    this.textDOMNode.setAttribute('y', y);

    bb = this.textDOMNode.getBBox();
    this.textDOMNode.X = bb.x + bb.width / 2;
    this.textDOMNode.Y = bb.y + bb.height / 2;
  },

  pointerLabelMoveStart: function (e) {
    this.pickupPoint = this.labelLayer.worldPoint(e.x, e.y);
    this.tethered = true;
  },


  pointerLabelMove: function (e) {
    var p = this.labelLayer.worldPoint(e.x, e.y),
    dx = p.x - this.pickupPoint.x,
    dy = p.y - this.pickupPoint.y,
    bb = this.textDOMNode.getBBox();

    // Change label anchor to centre without moving the label
    if (this.textDOMNode.getAttribute('text-anchor') !== 'middle') {
      if (this.textDOMNode.getAttribute('text-anchor') === 'start') {
        this.textDOMNode.setAttribute(
          'x',
          parseInt(this.textDOMNode.getAttribute('x'), 10) + bb.width / 2
        );
      }
      else {
        this.textDOMNode.setAttribute(
          'x',
          parseInt(this.textDOMNode.getAttribute('x'), 10) - bb.width / 2
        );
      }
      this.textDOMNode.setAttribute('text-anchor', 'middle');
      return;
    }
    if (this.textDOMNode.getAttribute('dy') !== '0.35em') {
      if (this.textDOMNode.getAttribute('dy') === '0.7em') {
        this.textDOMNode.setAttribute(
          'y',
          // The offset should be half-height, but at half-height the label jumps.
          parseInt(this.textDOMNode.getAttribute('y'), 10) + 0.35 * bb.height
        );
      }
      else {
        this.textDOMNode.setAttribute(
          'y',
          parseInt(this.textDOMNode.getAttribute('y'), 10) - bb.height / 2
        );
      }
      this.textDOMNode.setAttribute('dy', '0.35em');
      return;
    }

    // Need to divide by label scale here because translateLabel() uses map layer
    // co-ordinates.
    this.translateLabel(dx / this.labelLayer.scale, dy / this.labelLayer.scale);
    this.pickupPoint = this.labelLayer.worldPoint(e.x, e.y);
  }, // pointerLabelMove


  // Translate this point's label, drawing a tag line (leader) when the
  // label is dragged too far from its point.
  translateLabel: function (dx, dy) {
    var x, y;

    if (this.textNode) {
      x = parseFloat(this.textDOMNode.getAttribute('x')) + dx * this.labelLayer.scale;
      y = parseFloat(this.textDOMNode.getAttribute('y')) + dy * this.labelLayer.scale;

      this.textDOMNode.setAttribute('x', x);
      this.textDOMNode.setAttribute('y', y);
      this.textDOMNode.X = x;
      this.textDOMNode.Y = y;

      this.updateLeader();
    }
  }, // translateLabel()


  updateLeader: function () {
    var
      x, y,
      xb, yb, // Leader endpoint at label boundary
      bb, // label bounding box
      dp,
      wp, twp, // label world point, true world point
      bp, dbp, wbp, // boundary point on label layer; on the display; in world
      xo, yo, // Leader origin
      iX;

    function distance() {
      // Calculate the distance between the point and the label
      return Math.sqrt(
        (x - wp.x) * (x - wp.x) +
        (y - wp.y) * (y - wp.y)
      );
    }

    function pointInsideLabel() {
      return (Math.abs(wp.x - x) <= bb.width / 2) && (Math.abs(wp.y - y) <= bb.height / 2);
    }

    if (this.tethered && this.textNode) {
      // project the map point to label layer
      dp = this.layer.displayPoint(this.pointDOMNode.X, this.pointDOMNode.Y);
      wp = this.labelLayer.worldPoint(dp.x, dp.y);

      x = parseFloat(this.textDOMNode.getAttribute('x'));
      y = parseFloat(this.textDOMNode.getAttribute('y'));
      bb = this.textDOMNode.getBBox();

      // Compute the boundary point for each of the four sides.
      //
      // Consider label axes first to prevent division by zero.
      if (wp.y === y) {
        yb = y;
        if (wp.x > x) {
          xb = x + bb.width / 2;
        }
        else if (wp.x < x) {
          xb = x - bb.width / 2;
        }
        else {
          xb = x;
        }
      }
      else if (wp.x === x) {
        xb = x;
        if (wp.y > y) {
          yb = y + bb.height / 2;
        }
        else if (wp.y < y) {
          yb = y - bb.height / 2;
        }
        else {
          yb = y;
        }
      }

      // Left and right sectors
      else if (
        ((wp.y - y) / (wp.x - x) > -bb.height / bb.width) &&
        ((wp.y - y) / (wp.x - x) <= bb.height / bb.width)
      ) {
        if (wp.x > x) {
          // point right of the label
          xb = x + 0.5 * bb.width;
          yb = y + 0.5 * bb.width * (wp.y - y) / (wp.x - x);
        }
        if (wp.x < x) {
          // point left of the label
          xb = x - 0.5 * bb.width;
          yb = y - 0.5 * bb.width * (wp.y - y) / (wp.x - x);
        }
      }

      // Top and bottom sectors
      else {
        if (wp.y > y) {
          // point below the label
          xb = x + 0.5 * bb.height * (wp.x - x) / (wp.y - y);
          yb = y + 0.5 * bb.height;
        }
        if (wp.y < y) {
          // point above the label
          xb = x - 0.5 * bb.height * (wp.x - x) / (wp.y - y);
          yb = y - 0.5 * bb.height;
        }
      }

      if (
        !pointInsideLabel() &&
          distance() > 0.9 * this.pointDOMNode.size * this.labelLayer.scale // 0.9 = 1.8 * half-size
      ) {
        if (this.blobDOMNode) {
          // Project the display image of the map point to world
          twp = this.layer.parent.shadow.worldPoint(dp.x, dp.y);

          // Transform label boundary point to world
          bp = this.labelLayer.svgPoint(xb, yb);
          dbp = this.labelLayer.displayPoint(bp.x, bp.y);
          wbp = this.layer.parent.shadow.worldPoint(dbp.x, dbp.y);

          iX = Y.ACMACS.intersectShapes(
            new Y.ACMACS.Path(this.blobDOMNode),
            new Y.ACMACS.Line({ // Simulate SVGLineElement
              localName: 'line',
              getAttributeNS: function (ns, name) {
                Y.log(['getAttributeNS(' + name + ')', this[name]]);
                return this[name];
              },
              x1: twp.x,
              y1: twp.y,
              x2: wbp.x,
              y2: wbp.y
            })
          );
          if (iX.status === 'Intersection') {
            bp = iX.points[0];
            dbp = this.layer.parent.shadow.displayPoint(bp.x, bp.y);
            wbp = this.labelLayer.worldPoint(dbp.x, dbp.y);
            // Leader origin
            xo = wbp.x;
            yo = wbp.y;
          }
          else {
            xo = wp.x;
            yo = wp.y;
          }
        }
        else {
          // Regular point; set leader origin to point centre.
          xo = wp.x;
          yo = wp.y;
        }

        if (this.leaderDOMNode) {
          this.leaderDOMNode.setAttribute('x1', xo);
          this.leaderDOMNode.setAttribute('y1', yo);
          this.leaderDOMNode.setAttribute('x2', xb);
          this.leaderDOMNode.setAttribute('y2', yb);
        }
        else {
          this.leaderDOMNode = this.labelLayer.addLine({
            start: [xo, yo],
            end: [xb, yb],
            stroke: 'grey',
            strokeOpacity: 0.5
          });
          this.leaderNode = Y.Node(this.leaderDOMNode);
        }
      }
      else {
        if (this.leaderDOMNode) {
          Y.one(this.leaderDOMNode).remove();
          this.leaderDOMNode = null;
        }
      }
    }
  }, // updateLeader()


  adjustLabelPosition: function (expansion) {
    var
      vx = this.labelPositionX,
      vy = this.labelPositionY,
      length;

    if (vy >= 1) {
      // compute a unit vector aiming at label anchor
      length = Math.sqrt(vx * vx + vy * vy);
      vx /= length;
      vy /= length;

      this.translateLabelSimple(
        vx * expansion * this.labelLayer.scale,
        vy * expansion * this.labelLayer.scale
      );
    }
  },

  setTetheredStyle: function () {
    var
      dp = this.labelLayer.displayPoint(this.textDOMNode.getAttribute('x'), this.textDOMNode.getAttribute('y')),
      wp = this.layer.worldPoint(dp.x, dp.y);

    Y.log('setTetheredStyle()');

    if (this.textNode) {
      this.layer.rootWidget.setPointStyle(this, {
        label_position_type: 'tethered',
        label_position_x: wp.x - this.pointDOMNode.X,
        label_position_y: wp.y - this.pointDOMNode.Y
      });
      this.textNode.show(); // The label may vanish if no point on the map has a show_label property
    }
  }
}; // code



// A lightweigt point constructor
Y.namespace('ACMACS').MapPoint = function (config) {
  Y.mix(this, code);
  this.initializer(config);
};

}, '@VERSION@', {
  requires: ['base', 'node', 'acmacs-base']
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
