/*global document: false, window: false, SVGElement: false, SVGCircleElement: false, SVGEllipseElement: false, SVGRectElement: false */
YUI.add('overscroll-1', function (Y) {
  var self;

  Y.namespace('ACMACS');

  // This object emulates LayerStack
  self = {
    map: null,
    pickupPoint: {},
    eventIndex: 0,
    operation: null,
    wasOverscrolling: {
      x: {
        left: false,
        right: false
      },
      y: {
        top: false,
        bottom: false
      }
    },

    trueWorldPoint: function (p) {
      return this.shadow.svgPoint(p).matrixTransform(
        this.shadow.groupDOMNode.getCTM().inverse()
      );
    },

    setUp: function () {
      // top overscroll
      var scheduleT = [
        {type: 'down', y: 50},
        {type: 'move', y: 20},
        // {type: 'move', y: 5},
        {type: 'move', y: 0},
        {type: 'move', y: -20},
        {type: 'move', y: -50},
        {type: 'move', y: -30},
        {type: 'move', y: 20},
        // {type: 'move', y: 100},
        {type: 'up', y: 20}
      ];

      // bottom overscroll
      var scheduleB = [
        {type: 'down', y: 50},
        {type: 'move', y: 70},
        {type: 'move', y: 170},
        {type: 'move', y: 180},
        // {type: 'move', y: 190},
        {type: 'move', y: 200},
        {type: 'move', y: 205},
        {type: 'move', y: 210},
        {type: 'move', y: 240},
        {type: 'move', y: 220},
        // {type: 'move', y: 200},
        // {type: 'move', y: 190},
        {type: 'move', y: 180},
        {type: 'move', y: 100},
        {type: 'up', y: 100}
      ];

      // top-to-bottom overscroll
      var scheduleTB = [
        {type: 'down', y: 50},
        {type: 'move', y: 20},
        {type: 'move', y: -20},
        {type: 'move', y: -50},
        {type: 'move', y: -30},
        // {type: 'move', y: 20},
        // {type: 'move', y: 70},
        // {type: 'move', y: 170},
        // {type: 'move', y: 180},
        // {type: 'move', y: 200},
        // {type: 'move', y: 205},
        // {type: 'move', y: 210},
        {type: 'move', y: 220},
        {type: 'move', y: 240},
        {type: 'move', y: 220},
        {type: 'move', y: 180},
        {type: 'move', y: 100},
        {type: 'up', y: 100}
      ];

      Y.one('body').append(
        '<canvas id="ruler" width="41" height="391"></canvas>' +
        '<div id="container">' +
        '  <div style="top: 0px; left: 0px; position: absolute; background: #bec2c8; width: 20px; height: 0px;" id="margin-top"></div>' +
        '  <div id="widget" width="20" height="200">' +
        '    <svg id="canvas" xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="200">' +
        '      <circle id="map" cx="10" cy="50" r="10" fill="#802020">' +
        '    </svg>' +
        '  </div>' +
        '  <div style="bottom: 0px; left: 0px; position: absolute; background: #bec2c8; width: 20px; height: 0px;" id="margin-bottom"></div>' +
        '  <pre id="report">' +
        '  </pre>' +
        '  <div id="controls">' +
        '    <div id="schedule-t">' +
        '      <button id="reset-t">Reset</button>' +
        '      <div id="steps-t">' +
        '      </div>' +
        '      <button id="next-t">Next</button>' +
        '    </div>' +
        '    <div id="schedule-b">' +
        '      <button id="reset-b">Reset</button>' +
        '      <div id="steps-b">' +
        '      </div>' +
        '      <button id="next-b">Next</button>' +
        '      </div>' +
        '    <div id="schedule-tb">' +
        '      <button id="reset-tb">Reset</button>' +
        '      <div id="steps-tb">' +
        '      </div>' +
        '      <button id="next-tb">Next</button>' +
        '      </div>' +
        '  </div>' +
        '</div>'
      );

      this.ruler = function () {
        var canvas = Y.one('#ruler'),
            canvasDOMNode = Y.Node.getDOMNode(canvas),
            context = canvasDOMNode.getContext('2d');

        context.strokeStyle = "#000000";
        context.lineWidth = 1;
        context.setTransform(1, 0, 0, 1, 0, 100);

        return {
          drawPointer: function (y) {
            context.clearRect(0, -100, 49, 391);
            context.beginPath();
            context.moveTo(20, y);
            context.lineTo(32, y);
            context.stroke();
            context.lineTo(28, y - 3);
            context.stroke();
            context.moveTo(28, y + 3);
            context.lineTo(32, y);
            context.stroke();
            context.closePath();
          }
        };
      }();

      this.ruler.drawPointer(5);

      Y.each(scheduleT, function (e, i) {
        Y.one('#steps-t').append(Y.substitute('<div id="step-t_{i}" class="step_default">{y} {type}</div>', {
          i: i,
          y: e.y,
          type: e.type
        }));
      });

      Y.each(scheduleB, function (e, i) {
        Y.one('#steps-b').append(Y.substitute('<div id="step-b_{i}" class="step_default">{y} {type}</div>', {
          i: i,
          y: e.y,
          type: e.type
        }));
      });

      Y.each(scheduleTB, function (e, i) {
        Y.one('#steps-tb').append(Y.substitute('<div id="step-tb_{i}" class="step_default">{y} {type}</div>', {
          i: i,
          y: e.y,
          type: e.type
        }));
      });

      this.container = Y.one('#container');
      this.map = Y.one('#map');
      this.mapDOMNode = Y.Node.getDOMNode(Y.one('#map'));
      this.widget = Y.one('#widget');
      this.canvas = Y.one('#canvas');
      this.widgetDOMNode = Y.Node.getDOMNode(Y.one('#canvas'));
      this.reportBox = Y.one('#report');

      this.map.on('mousedown', Y.bind(function (e) {
        if (e.altKey) {
          e.halt();
          // e.x = e.pageX - this.widget.getX();
          // e.y = e.pageY - this.widget.getY();
          e.x = e.pageX;
          e.y = e.pageY;
          this.pickupPoint.x = e.x;
          this.pickupPoint.y = e.y;

          this.operation = 'drag';
          this.report(e);
          this.ruler.drawPointer(e.y - this.container.getY());
        }
      }, this));

      Y.on('mouseup', Y.bind(function (e) {
        if (e.altKey) {
          e.halt();
          this.shift(0, 0);
          this.operation = null;
          this.report(e);
        }
      }, this));

      Y.on('mousemove', Y.bind(function (e) {
        var height = 200,
            eventDelta,
            panPart,
            shiftPart,
            newPickupPoint = {x: null, y: null},
            action = {shift: {x: null, y: null}, pan: {x: null, y: null}};

        if (e.altKey) {
          // e.x = e.pageX - this.widget.getX();
          // e.y = e.pageY - this.widget.getY();
          e.x = e.pageX;
          e.y = e.pageY;
          e.halt();

          if (this.operation === 'drag') {
            eventDelta = e.y - this.pickupPoint.y;
            Y.log('calculating eventDelta: ' + eventDelta + ' = ' + e.y + ' - ' + this.pickupPoint.y);
            Y.log(['drag', this.pickupPoint.y, 'eventDelta', eventDelta, 'cy', this.cy(), 'was overscrolling on top', this.wasOverscrolling.y.top, 'was overscrolling at bottom', this.wasOverscrolling.y.bottom]);

            if (this.wasOverscrolling.y.top && eventDelta > 0 || this.wasOverscrolling.y.bottom && eventDelta < 0) {
              // About to regress from overscroll. The motion must be divided
              // between the shift portion cancelling the overscroll and the
              // pan motion. The pan part is exactly equal to eventDelta
              // because the pick-up point did not change during overscroll.
              // The shift part does not matter because we're simply
              // eliminating the entire shift amount.
              if (Math.abs(eventDelta) >= height) {
                Y.log(['overscrolling reversal', panPart, this.shiftY]);
                if (this.wasOverscrolling.y.top) {
                  action.pan.y = height;
                  action.shift.y = eventDelta - height;
                  this.pickupPoint.x = e.x;
                  this.pickupPoint.y += height;
                  Y.log('assigning this.wasOverscrolling.y.top == false on reversal');
                  this.wasOverscrolling.y.top = false;
                  this.wasOverscrolling.y.bottom = true;
                }
                else if (this.wasOverscrolling.y.bottom) {
                  Y.log('assigning this.wasOverscrolling.y.top == true on reversal');
                  this.wasOverscrolling.y.bottom = false;
                  this.wasOverscrolling.y.top = true;
                }
              }
              else {
                Y.log(['was overscrolling vertically', panPart, this.shiftY]);
                // ----------------------- A C T I O N ---------------------------
                action.pan.y = eventDelta;
                action.shift.y = 0;
                // ---------------------------------------------------------------
                this.pickupPoint.x = e.x;
                this.pickupPoint.y = e.y;
                if (this.wasOverscrolling.y.top) {
                  this.wasOverscrolling.y.top = false;
                }
                if (this.wasOverscrolling.y.bottom) {
                  this.wasOverscrolling.y.bottom = false;
                }
              }
            }

            else if (this.cy() < height && this.cy() + eventDelta >= height) {
              // About to overscroll to the bottom. The motion will be divided between the
              // pan part and the shift part.
              panPart = height - this.cy();
              shiftPart = this.cy() + eventDelta - height;
              Y.log(['bottom overscroll, pan part:', panPart, 'shift part', shiftPart]);
              Y.log(['pan', panPart]);
              // ----------------------- A C T I O N ---------------------------
              action.pan.y = panPart;
              action.shift.y = shiftPart;
              // ---------------------------------------------------------------
              this.pickupPoint.x = e.x;
              this.pickupPoint.y += panPart;
              Y.log(['shift', shiftPart]);
              this.wasOverscrolling.y.bottom = true;
              this.wasOverscrolling.y.top = false;
            }

            else if (this.cy() > 0 && this.cy() + eventDelta <= 0) {
              // About to overscroll to the top. The motion will be divided between the
              // pan part and the shift part.
              panPart = 0 - this.cy();
              shiftPart = this.cy() + eventDelta ;
              Y.log(['top overscroll, pan part:', panPart, 'shift part', shiftPart]);
              Y.log(['pan', panPart]);
              // ----------------------- A C T I O N ---------------------------
              action.pan.y = panPart;
              action.shift.y = shiftPart;
              // ---------------------------------------------------------------
              this.pickupPoint.x = e.x;
              this.pickupPoint.y += panPart;
              Y.log(['shift', shiftPart]);
              Y.log('assigning this.wasOverscrolling.y.top == true going into top overscroll');
              this.wasOverscrolling.y.top = true;
              this.wasOverscrolling.y.bottom = false;
            }

            else if (this.cy() <= 0 || this.cy() >= height) {
              Y.log('deep vertical overscroll');
              // Deep overscroll (increasing or decreasing the existing
              // overscroll, but not enough to cancel it entirely).
              // ----------------------- A C T I O N ---------------------------
              action.shift.y = e.y - this.pickupPoint.y;
              // ---------------------------------------------------------------
              if (this.cy() <= 0) {
                Y.log('assigning this.wasOverscrolling.y.top == true doing deep overscroll');
                this.wasOverscrolling.y.top = true;
              }
              else {
                this.wasOverscrolling.y.bottom = true;
              }
            }
            else {
              // Normal action
              // ----------------------- A C T I O N ---------------------------
              action.pan.y = e.y - this.pickupPoint.y;
              // ---------------------------------------------------------------
              this.pickupPoint.x = e.x;
              this.pickupPoint.y = e.y;
              this.wasOverscrolling.y.top = false;
              this.wasOverscrolling.y.bottom = false;
            }

            // Apply shift and pan
            if (action.shift.y !== null || action.shift.y !== null) {
              this.shift(
                action.shift.x === null ? 0 : action.shift.x,
                action.shift.y === null ? 0 : action.shift.y
              );
            }
            if (action.pan.y !== null || action.pan.y !== null) {
              this.pan(
                action.pan.x === null ? 0 : action.pan.x,
                action.pan.y === null ? 0 : action.pan.y
              );
            }
          } // operation == drag
          this.ruler.drawPointer(e.y - this.container.getY());
        }
        this.report(e);
      }, this));

      Y.each(['t', 'b', 'tb'], function(edge) {
        var schedule;

        if (edge === 't') {
          schedule = scheduleT;
        }
        else if (edge === 'b') {
          schedule = scheduleB;
        }
        else {
          schedule = scheduleTB;
        }

        Y.one('#next-' + edge).on('click', Y.bind(function () {
          if (this.eventIndex > 0) {
            Y.one('#step-' + edge + '_' + (this.eventIndex - 1)).replaceClass('step_current', 'step_default');
          }
          if (this.eventIndex < schedule.length) {
            Y.one('#step-' + edge + '_' + this.eventIndex).replaceClass('step_default', 'step_current');
            this.map.simulate(
              'mouse' + schedule[this.eventIndex].type,
              {clientX: this.container.getX() + 20, clientY: this.container.getY() + schedule[this.eventIndex].y, altKey: true}
            );
            this.ruler.drawPointer(schedule[this.eventIndex].y);
            this.eventIndex += 1;
            if (this.eventIndex === schedule.length) {
              Y.one('#next-' + edge).set('disabled', true);
            }
          }
        }, this));

        Y.one('#reset-' + edge).on('click', Y.bind(function () {
          if (this.eventIndex) {
            Y.one('#step-' + edge + '_' + (this.eventIndex - 1)).replaceClass('step_current', 'step_default');
            this.mapDOMNode.setAttribute('transform', '');
            Y.one('#next-' + edge).set('disabled', false);
          }
          this.operation = null;
          this.eventIndex = 0;
          this.shift(0, 0);
          this.ruler.drawPointer(5);
        }, this));
      }, this);
    },

    pan: function (x, y) {
      Y.log('pan(' + x + ', ' + y + ')');
      this.mapDOMNode.applyTransformation(
        this.mapDOMNode.getCTM().translate(0, y)
      );
    },

    shift: function (x, yArg) {
      var width = 20,
          height = 200,
          clipSpec,
          y = this.elasticDisplacement(yArg),
          mar = {};

      this.widget.setStyle('top', y + 'px');
      this.widget.setStyle('left', x + 'px');

      mar.l = 0;
      mar.r = width;

      if (y >= 1) {
        mar.t = 0;
        mar.b = height - y;
        Y.one('#margin-top').setStyle('height', y + 'px');
        Y.one('#margin-bottom').setStyle('height', '0px');
      }
      else if (y <= -1) {
        mar.t = -y;
        mar.b = height;
        Y.one('#margin-top').setStyle('height', '0px');
        Y.one('#margin-bottom').setStyle('height', -y + 'px');
      }
      else {
        mar.t = 0;
        mar.b = height;
        Y.one('#margin-top').setStyle('height', '0px');
        Y.one('#margin-bottom').setStyle('height', '0px');
      }

      clipSpec = Y.substitute(
        'rect({t}px, {r}px, {b}px, {l}px)',
        {
          t: mar.t.toFixed(0),
          r: mar.r.toFixed(0),
          b: mar.b.toFixed(0),
          l: mar.l.toFixed(0)
        }
      );
      // this.widget.setStyle('clip', clipSpec);
      this.shiftY = y;
    },

    elasticDisplacement: function (delta) {
      var k1 = 8, // delta * delta / 10,
          k2 = 1;
      return (k2 / (k1 + k2)) * delta;
    },

    report: function (e) {
      var text = '';

      text += Y.substitute('e.clientX = {x}, e.clientY = {y}\n', {x: e.clientX, y: e.clientY});
      text += Y.substitute('e.pageX = {x}, e.pageY = {y}\n', {x: e.pageX, y: e.pageY});
      text += Y.substitute('e.x = {x}, e.y = {y}\n', {x: e.x, y: e.y});
      text += Y.substitute('pickupPoint: ({x}, {y})\n', {x: this.pickupPoint.x, y: this.pickupPoint.y});
      text += Y.substitute('cy = {y}', {y: this.cy()});
      this.reportBox.setContent(text);
    },

    displayBoundingBox: function () {
      var bbox = this.mapDOMNode.getBBox(),
          dtl, dbr;

      dtl = this.displayPoint(bbox.x, bbox.y);
      dbr = this.displayPoint(bbox.x + bbox.width, bbox.y + bbox.height);

      return {
        x: dtl.x,
        y: dtl.y,
        width: dbr.x - dtl.x,
        height: dbr.y - dtl.y
      };
    },

    displayPoint: function (x, y) {
      return this.svgPoint(x, y).matrixTransform(
        this.mapDOMNode.getCTM()
      );
    },

    svgPoint: function (x, y) {
      var svgp = this.widgetDOMNode.createSVGPoint();
      svgp.x = x;
      svgp.y = y;
      return svgp;
    },

    cy: function () {
      var bbox = this.displayBoundingBox();
      return bbox.y + bbox.height / 2;
    }
  };


  // Converts a 6-element transformation matrix (`SVGMatrix`) into a string that
  // can be assigned to the transform property of an SVG element and applies it
  // to the element.
  SVGElement.prototype.applyTransformation = function (matrix) {
    this.setAttribute('transform',
      'matrix(' +
        matrix.a + ',' +
        matrix.b + ',' +
        matrix.c + ',' +
        matrix.d + ',' +
        matrix.e + ',' +
        matrix.f +
      ')'
    );
  };

  Y.ACMACS.OverscrollTest = self;
}, '@VERSION@', {requires: ['event-mousewheel', 'event-key', 'node-style', 'node-screen', 'node-event-simulate', 'substitute']});
