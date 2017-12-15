YUI.add('acmacs-procrustes', function(Y) {

// ======================================================================

// _Stackable procrustes layer_
//

// This module extends `Y.ACMACS.LayerWidget` with procrustes-specific functionality.
//

/*global Y: false */
Y.namespace('ACMACS').ProcrustesLayer = Y.Base.create('acmacsProcrustesLayer', Y.ACMACS.LayerWidget, [], {
  kind: 'SVG',

  can: {
    pan: true,
    rotate: true,
    flip: true,
    zoom: true
  },

  monolithic: true,

  simulated: false,

  // <a name="renderUI">
  // ### renderUI()
  // This method implements the part of Widget's life cycle where widget
  // elements are assembled and rendered into the DOM.
  renderUI: function () {
    Y.log('this renderUI()');
    this.canvas = Y.Node.create(Y.substitute(
      '<svg' +
      ' xmlns="http://www.w3.org/2000/svg"' +
      ' version="1.1"' +
      ' width="{width}"' +
      ' height="{height}"' +
      '>' +
      '  <defs />' +
      '  <g class="basegroup" />' +
      '</svg>',
      {
        width: this.get('width'),
        height: this.get('height'),
        arrowWidth: 20,
        arrowHeight: 8
      }
    ));

    this.canvasDOMNode = Y.Node.getDOMNode(this.canvas);
    this.groupDOMNode = Y.Node.getDOMNode(this.canvas.one('.basegroup'));
    this.contentBox = this.get('contentBox');
    this.contentBox.append(this.canvas);

    return this;
  },

  addMarker: function (n, arg) {
    this.canvas.one('defs').append(Y.substitute(
      '    <marker xmlns="http://www.w3.org/2000/svg"' +
      '      id="Arrow2Lend-{id}"' +
      '      orient="auto"' +
      '      refY="0.0"' +
      '      refX="0.0"' +
      '      style="overflow:visible;"' +
      '    >' +
      '      <path style="fill-rule:evenodd;' +
      '        fill: {colour}; stroke: {colour}; stroke-width:0.625; stroke-linejoin:round;' +
      '        fill-opacity: {opacity}; stroke-opacity: {opacity};"' +
      '        d="M 8.72,4.03 L -2.21,0.02 L 8.72,-4 C 6.97,-1.63 6.98,1.61 8.72,4.03 z "' +
      '        transform="scale({length}, {width}) rotate(180) translate(1,0)" />' +
      '    </marker>'.replace(/ +/g, ' '),
      {
        id: n,
        colour: arg.color,
        length: 0.75 * arg.arrow_length,
        width: 0.75 * arg.arrow_width,
        opacity: 0.7
      }
    ));
  },


  // ### plot()

  // Plot all procrustes lines and/or error lines
  //
  plot: function () {
    var data = this.rootWidget.get('data');

    // Copy the current transformation from the shadow layer
    this.groupDOMNode.applyTransformation(
      this.parent.shadow.groupDOMNode.getCTM()
    );

    this.setPixelSize();

    if (!data || !data.procrustes) {
      Y.log(data);
      Y.log('ProcrustesLayer: bailing out because there is no data to plot');
      return false;
    }

    this.clear();

    Y.each(this.canvas.all('marker'), function (node) {
      Y.log(['destroy', node]);
      node.remove().destroy(true);
    });

    Y.each(data.styles.procrustes_lines_styles, Y.bind(function (style, n) {
      this.addMarker(n, style);
    }, this));

    if (this.get('renderProcrustesLines')) {
      Y.each(data.procrustes.common_points, Y.bind(function (to, key) {
        var
          from = parseInt(key, 10),
          fx = data.layout[from][0],
          fy = data.layout[from][1],
          tx = data.procrustes.layout[to][0],
          ty = data.procrustes.layout[to][1],
          distSquared = (tx - fx) * (tx - fx) + (ty - fy) * (ty - fy),
          minDist = this.get('procrustesDistanceThreshold');

        // Protect from non-numeric data in point co-ordinates and reject the
        // procrustes lines that are too short.
        if (Y.Lang.isNumber(fx) && Y.Lang.isNumber(fy) &&
            Y.Lang.isNumber(tx) && Y.Lang.isNumber(ty) &&
            (distSquared >= minDist * minDist) &&
            !this.lineExists(data.layout[from], data.procrustes.layout[to])
           ) {
          this.addLine({
            start: data.layout[from],
            end: data.procrustes.layout[to],
            stroke: data.styles.procrustes_lines_styles[data.styles.procrustes_lines[from]].color,
            width: data.styles.procrustes_lines_styles[data.styles.procrustes_lines[from]].width,
            opacity: this.attributeOrProfileSetting('procrustesLineOpacity'),
            style: {
              'marker-end': Y.substitute('url(#Arrow2Lend-{n})', {
                n: data.styles.procrustes_lines[from]
              })
            }
          });
        } // valid map point
        else {
          Y.log('bailing out from: ' + from + ' -> ' + to + ' because of non-numeric co-ordinates');
        }
      }, this));
    }

  },

  // This method is redefined to allow the lines to have a constant rendered
  // width.
  zoom: function (zf, x, y) {
    //
    var
        // The `SVGPoint` object representing the origin of the transformation
        p = this.worldPoint(x, y),

        // Components of `p` to be stored separately, avoiding property lookups
        // inside the fake zoom loop
        px, py,

        // Scale matrix
        k;

    // Compute the scale matrix at the current pointer position. What this
    // expression does, it translates the world to place the current event
    // point to space origin, scales the space, then translates it back.
    // Nothing happens to the world at this point, because the result is just
    // a matrix.
    k = Y.ACMACS.newSVGMatrix().translate(p.x, p.y).scale(zf).translate(-p.x, -p.y);

    // And now this matrix is applied to the viewing transformation, so
    // again, nothing happens to the world. Only the view gets scaled.
    this.groupDOMNode.applyTransformation(
      this.groupDOMNode.getCTM().multiply(k)
    );

    Y.each(this.groupDOMNode.childNodes, function (el) {
      var strokeWidth = el.getAttribute('stroke-width');
      el.setAttribute('stroke-width', strokeWidth / zf);
    });
    //
  } /* zoom() */
}, {
  ATTRS: {
    renderProcrustesines: {
      value: false
    },

    procrustesDistanceThreshold: {
      value: 0.0
    },

    procrustesLineOpacity: {
      value: 0.7
    },

    errorLineOpacity: {
      value: 0.8
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
