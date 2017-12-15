YUI.add('acmacs-grid', function(Y) {

// ======================================================================

// _Stackable map layer_
//

// The purpose of this module is to add ACMACS-specific functionality to the
// basic layer widget. It extends `Y.ACMACS.LayerWidget` by adding the `plot()`
// method and setting the values of map-specific attributes.
//

/*global Y: false, document: false */
Y.namespace('ACMACS').GridLayer = Y.Base.create('acmacsGridLayer', Y.ACMACS.LayerWidget, [], {

  kind: 'SVG',

  can: {
    pan: false,
    rotate: false,
    flip: false,
    zoom: false
  },

  simulate: false,

  gridPoint: null,

  destructor: function () {
    this.gridPoint = undefined;
  },

  update: function (operation) {
    var behaviour = this.get('behaviour');

    // No point in updating the grid if there is nothing on the map.
    if (this.parent.map.numberOfNodes() > 0) {
      if (behaviour === 'default') {
        switch (operation) {
        case 'init':
          this.draw('tied to corner');
          break;
        case 'zoom':
        case 'pan':
        case 'resize':
          this.draw('following the world');
          break;
        default:
        }
      }
      else {
        this.draw(behaviour);
      }
    }
  },

  draw: function (behaviour) {
    var width,
        height,
        point0,
        point1,
        gridUnit,
        transformedGridPoint,
        node,
        w = this.parent.trueVisibleWorld(),
        nLat,
        nLong,
        padX,
        padY,
        x, y,
        ix, iy,
        start,
        end;

    this.clear();
    // plot the grid lines

    // World origin
    point0 = this.parent.shadow.displayPoint(0, 0);

    // // mark world origin with a red cross
    // this.addPath({
    //   d: 'M -10,0 10,0 M 0,-10 0,10',
    //   point: [point0.x, point0.y],
    //   fill: 'red',
    //   stroke: 'red',
    //   opacity: 0.9
    // });

    if (behaviour === 'transformable') {
      nLat = Math.floor(w.bbox.y + w.bbox.height) - Math.ceil(w.bbox.y) + 1;
      nLong = Math.floor(w.bbox.x + w.bbox.width) - Math.ceil(w.bbox.x) + 1;
      for (iy = 1; iy <= nLat; iy += 1) {
        start = this.parent.shadow.displayPoint(
          w.bbox.x,
          Math.floor(w.bbox.y + iy)
        );
        end = this.parent.shadow.displayPoint(
          w.bbox.x + w.bbox.width,
          Math.floor(w.bbox.y + iy)
        );
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', Y.substitute('M {sx},{sy} L{ex},{ey}', {sx: start.x, sy: start.y, ex: end.x, ey: end.y}));
        node.setAttribute('stroke', 'grey');
        node.setAttribute('stroke-width', 0.5);
        this.groupDOMNode.appendChild(node);
      }
      for (ix = 1; ix <= nLat; ix += 1) {
        start = this.parent.shadow.displayPoint(
          Math.floor(w.bbox.x + ix),
          w.bbox.y
        );
        end = this.parent.shadow.displayPoint(
          Math.floor(w.bbox.x + ix),
          w.bbox.y + w.bbox.height
        );
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', Y.substitute('M {sx},{sy} L{ex},{ey}', {sx: start.x, sy: start.y, ex: end.x, ey: end.y}));
        node.setAttribute('stroke', 'grey');
        node.setAttribute('stroke-width', 0.5);
        this.groupDOMNode.appendChild(node);
      }
    } // transformable
    else {
      width = this.attributeOrProfileSetting('width');
      height = this.attributeOrProfileSetting('height');
      point1 = this.parent.shadow.displayPoint(1, 0);
      gridUnit = Math.sqrt((point1.x - point0.x) * (point1.x - point0.x) + (point1.y - point0.y) * (point1.y - point0.y));
      nLong = Math.round(1000 * width / gridUnit) / 1000;
      nLat = Math.round(1000 * height / gridUnit) / 1000;

      switch (behaviour) {
      case 'following the world':
        transformedGridPoint = this.parent.shadow.displayPoint(this.gridPoint.x, this.gridPoint.y);
        padX = (transformedGridPoint.x / gridUnit - Math.floor(transformedGridPoint.x / gridUnit));
        padY = (transformedGridPoint.y / gridUnit - Math.floor(transformedGridPoint.y / gridUnit));
        break;
      case 'linked to world':
        padX = (point0.x / gridUnit - Math.floor(point0.x / gridUnit));
        padY = (point0.y / gridUnit - Math.floor(point0.y / gridUnit));
        break;
      case 'centred':
        padX = (nLong - Math.floor(nLong)) / 2;
        padY = (nLat - Math.floor(nLat)) / 2;
        break;
      case 'tied to corner':
        padX = padY = 0;
        this.gridPoint = this.parent.shadow.worldPoint(gridUnit, gridUnit);
        break;
      default: // the most desired behaviour: transformable by zoom
        padX = padY = 0;
      }

      for (iy = 0; iy <= Math.floor(nLat); iy += 1) {
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', Y.substitute('M 0,{y} L{width},{y}', {
          width: width,
          y: (iy + padY) * gridUnit
        }));
        node.setAttribute('stroke', 'grey');
        node.setAttribute('stroke-width', 0.5);
        this.groupDOMNode.appendChild(node);
      }
      for (ix = 0; ix <= Math.floor(nLong); ix += 1) {
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', Y.substitute('M {x},0 L{x},{height}', {
          height: this.get('height'),
          x: (ix + padX) * gridUnit
        }));
        node.setAttribute('stroke', 'grey');
        node.setAttribute('stroke-width', 0.5);
        this.groupDOMNode.appendChild(node);
      }
    }
  }
}, {
  ATTRS: {
    behaviour: {
      value: 'default'
    }
  }
});

}, '@VERSION@', {
  requires: ['base', 'acmacs-base', 'acmacs-layer', 'svg-methods']
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
