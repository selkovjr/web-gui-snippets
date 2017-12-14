/*
  # license
  # license.
*/
// ======================================================================

// _Stackable label layer_
//

// This module extends `Y.ACMACS.LayerWidget` with label-specific functionality.
//

/*global Y: false */
Y.namespace('ACMACS').ErrorLayer = Y.Base.create('acmacsErrorLayer', Y.ACMACS.LayerWidget, [], {

  initializer : function (config) {
    // All properties of `this` need to be initialised in order to work as
    // instance variables.  Otherwise they will become properties of the
    // prototype.
    this.listeners = [];
  },

  destructor: function () {
    Y.each(this.listeners, function (handle) {
      handle.detach();
      handle = null;
    });
  },

  // ### plot()

  // Plot all error lines
  //
  plot: function () {
    var data = this.rootWidget.get('data'),
        nSera = data.error_lines.sera.length,
        positive;

    positive = Y.bind(function (p1, p2, probe) {
      var arg, t, r, s1, s2, sProbe;

      if (p1[0] === p2[0]) {
        return Math.abs(probe[1] - p2[1]) >= Math.abs(probe[1] - p1[1]);
      }
      else {
        arg = Math.atan((p2[1] - p1[1]) / (p2[0] - p1[0])) * 360 / (2 * Math.PI);
        t = this.canvasDOMNode.createSVGMatrix().rotate(-arg);
        s1 = this.svgPoint({x: p1[0], y: p1[1]}).matrixTransform(t);
        s2 = this.svgPoint({x: p2[0], y: p2[1]}).matrixTransform(t);
        sProbe = this.svgPoint({x: probe[0], y: probe[1]}).matrixTransform(t);
        return (
          (sProbe.x >= s1.x && s1.x >= s2.x) ||
          (sProbe.x <= s1.x && s1.x <= s2.x)
        );
      }
    }, this);

    // Copy the current transformation from the shadow layer
    this.groupDOMNode.applyTransformation(
      this.parent.map.groupDOMNode.getCTM()
    );

    // Draw the error lines for antigens
    Y.some(data.error_lines.antigens, Y.bind(function (sera, antigenIndex) {
      // if (antigenIndex < 34) {
      //   return false;
      // }
      Y.some(sera, Y.bind(function (error, serumIndex) {
        var colour, simulatedErrorPoint;
        if (positive(
          // data.layout[nSera + antigenIndex],
          data.layout[antigenIndex],
          data.layout[nSera + serumIndex],
          error
        )) {
          colour = 'red';
        }
        else {
          colour = 'blue';
        }

        // if (serumIndex < 30) {
        //   return false;
        // }

        simulatedErrorPoint = this.parent.map.worldPoint(
          this.parent.shadow.displayPoint({
            x: error[0],
            y: error[1]
          })
        );
        this.addLine({
          // start: data.layout[nSera + antigenIndex],
          // start: data.layout[antigenIndex],
          start: this.parent.map.point[antigenIndex].pointDOMNode.getPosition(),
          end: [
            simulatedErrorPoint.x,
            simulatedErrorPoint.y
          ],
          stroke: colour,
          width: 0.01,
          strokeOpacity: 0.5
        });
      }, this));
    }, this));

    // Draw the error lines for sera
//     Y.each(this.parent.map.groupDOMNode.childNodes, function (el) {
//       Y.log([el.tagName, el.getAttribute('index')]);
//       Y.log(el);
//     });

  },


  // <a name="zoom">
  // ### zoom()

  // Scale this layer's content using the specified zoom factor `zf` (no change
  // at `zf == 1`). The co-ordinates `x` and `y` set the transformation origin
  // (the fixed point), and the `units` parameter indicates whether the
  // co-ordinates are measured in `world` or `viewport` units.
  zoom: function (zf, x, y, units) {
    //
    var
        // The `SVGPoint` object representing the origin of the transformation
        p,

        // Components of `p` to be stored separately, avoiding property lookups
        // inside the fake zoom loop
        px, py;

    p = this.worldPoint({x: x, y: y});

    // The real-world zoom is a scale transformation applied to the group and
    // it is a nice and fast way to zoom, but it does not work with ACMACS
    // maps, where lines must preserve their widgth regardless of the zoom
    // level.

    // The ACMACS maps perform a simulated transformation that spreads the
    // line ends away from the zoom centre or gathers them towards it without
    // changing their size (see
    // [`SVGElement.fakeZoom()`](svg-methods.html#fakeZoom). It is 2.5-3
    // times slower than the real-world zoom.
    px = p.x;
    py = p.y;
    Y.each(this.groupDOMNode.childNodes, function (el) {
      // The `fakeZoom()` method takes the zoom delta as input, instead of
      // zoom factor.
      el.fakeZoom(px, py, zf - 1);
    }, this);
    //
  }
}, {
  ATTRS: {
    kind: {
      value: 'SVG'
    },

    can: {
      value: {
        pan: true,
        rotate: true,
        flip: true,
        zoom: true
      },
      readOnly: true
    },

    monolithic: {
      value: true
    },

    simulated: {
      value: true
    },

    data: {
      value: null
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
