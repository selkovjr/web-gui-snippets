/*
  # license
  # license.
*/
// ======================================================================

// _Stackable connections layer_
//

// This module extends `Y.ACMACS.LayerWidget` with connections-specific functionality.
//

/*global Y: false */
Y.namespace('ACMACS').ConnectionsLayer = Y.Base.create('acmacsConnectionsLayer', Y.ACMACS.LayerWidget, [], {
  // Prototype properties

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
        pointsConnected = {};

    // Determine the sign of the error.
    positive = Y.bind(function (p1, p2, probe) {
      var arg, t, r, s1, s2, sProbe;


      if (p1[0] === p2[0]) {
        return Math.abs(probe[1] - p2[1]) >= Math.abs(probe[1] - p1[1]);
      }
      else {
        arg = Math.atan((p2[1] - p1[1]) / (p2[0] - p1[0])) * 360 / (2 * Math.PI);
        t = this.canvasDOMNode.createSVGMatrix().rotate(-arg);
        s1 = this.svgPoint(p1[0], p1[1]).matrixTransform(t);
        s2 = this.svgPoint(p2[0], p2[1]).matrixTransform(t);
        sProbe = this.svgPoint(probe[0], probe[1]).matrixTransform(t);
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

        if (Y.Object.keys(pointsConnected).length > this.attributeOrProfileSetting('connectionsMax')) {
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
    this.groupDOMNode.applyTransformation(
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
      // Because both antigens and sera can be selected for the rendering of
      // error and titre lines around them, there is a possibility for the same
      // line to be rendered twice. To avoid that, startwith antigens and mark
      // the end points of each line in a hash and then skip that line while
      // rendering the lines for sera.

      // First, draw the error lines for antigens
      connect({from: 'antigens', to: 'sera'});
      connect({from: 'sera', to: 'antigens'});
    }
  },

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
    k = this.canvasDOMNode.createSVGMatrix().translate(p.x, p.y).scale(zf)
    .translate(-p.x, -p.y);

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

    connectionsMaxAntigens: {
      value: 10
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
