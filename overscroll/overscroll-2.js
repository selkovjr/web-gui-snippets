/*global document: false, window: false, SVGElement: false, SVGCircleElement: false, SVGEllipseElement: false, SVGRectElement: false */
YUI.add('overscroll-2', function (Y) {
  var self;

  Y.namespace('ACMACS');

  function selectTextareaLine(tarea, lineNum) {
    lineNum--; // array starts at 0
    var lines = tarea.value.split("\n");

    // calculate start/end
    var startPos = 0, endPos = tarea.value.length;
    for(var x = 0; x < lines.length; x++) {
      if(x == lineNum) {
        break;
      }
      startPos += (lines[x].length+1);

    }

    var endPos = lines[lineNum].length+startPos;

    // do selection
    // Chrome / Firefox
    if(typeof(tarea.selectionStart) != "undefined") {
      tarea.focus();
      tarea.selectionStart = startPos;
      tarea.selectionEnd = endPos;
      return true;
    }

    // IE
    if (document.selection && document.selection.createRange) {
      tarea.focus();
      tarea.select();
      var range = document.selection.createRange();
      range.collapse(true);
      range.moveEnd("character", endPos);
      range.moveStart("character", startPos);
      range.select();
      return true;
    }
  }

  // This object emulates LayerStack
  self = {
    height: 200,
    width: 100,
    map: null,
    eventIndex: 0,
    event: [],
    eventOffset: [],
    operation: null,
    pickupPoint: {},

    schedule: [
      {
        title: 'Zx = 1.5; left overscroll',
        steps: [
          'zoom x 1.5',
          'down 20, 70',
          'move 20, 100',
          'move 0, 100',
          'move -20, 100',
          'move 0, 100',
          'move 20, 100',
          'up 20, 100'
        ]
      },
      {
        title: 'Zx = 1.5; right overscroll',
        steps: [
          'zoom x 1.5',
          'down 20, 70',
          'move 20, 100',
          'move 40, 100',
          'move 60, 100',
          'move 40, 100',
          'move 20, 100',
          'up 20, 100'
        ]
      },
      {
        title: 'Zx = 1.5; abrupt left-to-right overscroll',
        steps: [
          'zoom x 1.5',
          'down 20, 70',
          'move 20, 100',
          'move 0, 100',
          'move -20, 100',
          'move 60, 100',
          'move 40, 100',
          'move 20, 100',
          'up 20, 100'
        ]
      },
      {
        title: 'Zx = 1.5; abrupt right-to-left overscroll',
        steps: [
          'zoom x 1.5',
          'down 20, 70',
          'move 20, 100',
          'move 40, 100',
          'move 60, 100',
          'move -20, 100',
          'move 0, 100',
          'move 20, 100',
          'up 20, 100'
        ]
      },
      {
        title: 'Zx = 1.5; initial top overscroll',
        steps: [
          'zoom x 1.5',
          'down 50, 75',
          'move 50, 70',
          'move 50, 80',
          'move 50, 100',
          'move 50, 120',
          'up 50, 120'
        ]
      },
      {
        title: 'Zx = 2.5; initial top overscroll',
        steps: [
          'zoom x 2.5',
          'down 50, 75',
          'move 50, 70',
          'move 50, 80',
          'move 50, 100',
          'move 50, 120',
          'up 50, 120'
        ]
      },
      {
        title: 'Zx = 0.8; top overscroll',
        steps: [
          'zoom x 0.8',
          'down 50, 50',
          'move 50, -50',
          'move 50, -30',
          'move 50, 80',
          'up 50, 80'
        ]
      },
      {
        title: 'Zx = 0.8; bottom overscroll',
        steps: [
          'zoom x 0.8',
          'down 20, 50',
          'move 20, 70',
          'move 20, 170',
          'move 20, 200',
          'move 20, 205',
          'move 20, 210',
          'move 20, 180',
          'move 20, 100',
          'up 20, 100'
        ]
      },
      {
        title: 'Zx = 0.8; abrupt top-to-bottom overscroll',
        steps: [
          'zoom x 0.8',
          'down 20, 50',
          'move 20, 20',
          'move 20, -20',
          'move 20, -50',
          'move 20, -30',
          'move 20, 220',
          'move 20, 240',
          'move 20, 220',
          'move 20, 180',
          'move 20, 100',
          'up 20, 100'
        ]
      },
      {
        title: 'Zx = 0.8; abrupt bottom-to-top overscroll',
        steps: [
          'zoom x 0.8',
          'down 50, 50',
          'move 50, 75',
          'move 50, 160',
          'move 50, 250',
          'move 50, 350',
          'move 50, -60',
          'move 50, -90',
          'move 50, -110',
          'up 50, -110'
        ]
      },
      {
        title: 'Zx = 1.0; left overscroll',
        steps: [
          'zoom x 1',
          'down 50, 50',
          'move 20, 50',
          'move 10, 50',
          'move 0, 50',
          'move 30, 50',
          'move 35, 50',
          'move 50 50',
          'up 50, 50'
        ]
      },
      {
        title: 'Zx = 1.0; right overscroll',
        steps: [
          'zoom x 1',
          'down 50, 50',
          'move 80, 50',
          'move 90, 50',
          'move 100, 50',
          'move 80, 50',
          'move 55, 50',
          'move 50 50',
          'up 50, 50'
        ]
      },
      {
        title: 'Zx = 1.0; left-to-right overscroll reversal',
        steps: [
          'zoom x 1',
          'down 50, 50',
          'move 20, 50',
          'move 0, 50',
          'move 80, 50',
          'move 55, 50',
          'move 50 50',
          'up 50, 50'
        ]
      },
      {
        title: 'Zx = 1.0; right-to-left overscroll reversal',
        steps: [
          'zoom x 1',
          'down 50, 50',
          'move 80, 50',
          'move 0, 50',
          'move 30, 50',
          'move 35, 50',
          'move 50 50',
          'up 50, 50'
        ]
      }
    ],

    setUp: function () {
      Y.one('body').append(
        '<canvas id="ruler-v" width="41" height="391"></canvas>' +
        '<canvas id="ruler-h" width="391" height="41"></canvas>' +
        '<div id="container">' +
        '  <div id="stack">' +
        '    <div style="left: 0px; top: 0px; position: absolute; background: DarkBlue; width: 0px; height: 200px;" id="margin-left"></div>' +
        '    <div style="right: 0px; top: 0px; position: absolute; background: DarkBlue; width: 0px; height: 200px;" id="margin-right"></div>' +
        '    <div style="top: 0px; left: 0px; position: absolute; background: DarkBlue; width: 100px; height: 0px;" id="margin-top"></div>' +
        '    <div style="bottom: 0px; left: 0px; position: absolute; background: DarkBlue; width: 100px; height: 0px;" id="margin-bottom"></div>' +
        '    <div id="widget" width="100" height="200">' +
        '      <svg id="canvas" xmlns="http://www.w3.org/2000/svg" version="1.1" width="100" height="200">' +
        '        <circle id="map" cx="50" cy="50" r="40" fill="#802020" />' +
        '        <circle id="point" cx="-50" cy="-50" r="2" fill="yellow" stroke="black" />' +
        '      </svg>' +
        '    </div>' +
        '  </div>' +
        '  <pre id="report">' +
        '  </pre>' +
        '  <div id="controls">' +
        '    <div id="event-log">' +
        '      <textarea id="steps-log" rows="20"> </textarea>' +
        '      <button id="reset-log">Reset</button>' +
        '      <button id="clear-log">Clear</button>' +
        '      <button id="next-log" disabled="1">Next</button>' +
        '    </div>' +
        '    <div id="selector-container">' +
        '      <select id="selector">' +
        '      </select>' +
        '      <button id="load-log">Load</button>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div id="constraint-container">' +
        '  <span id="constraint-span"><input id="constraint" type="checkbox">Enable constrained panning</span>' +
        '  <br />' +
        '  <input id="clip" type="checkbox">Clip map layer to widget boundaries' +
        '</div>' +
        '<div id="instructions">Shift-drag the circle for a manual test. The circle emulates the convex hull of map objects.</div>' +
        '<div id="zoom">' +
        '  <span>Zoom ratio, x:</span>' +
        '  <input id="zoom-x" type="text" style="width: 4em">' +
        '  <span>y:</span>' +
        '  <input id="zoom-y" type="text" style="width: 4em">' +
        '</div>'
      );

      Y.each(this.schedule, Y.bind(function (s, i) {
        var option = Y.Node.create('<option value="' + i + '">' + s.title + '</option>');
        if (i === 0) {
          option.set('selected', true);
        }
        Y.one('#selector').appendChild(option);
      }, this));


      this.rulerV = (function () {
        var canvas = Y.one('#ruler-v'),
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
      }());

      this.rulerH = (function () {
        var canvas = Y.one('#ruler-h'),
            canvasDOMNode = Y.Node.getDOMNode(canvas),
            context = canvasDOMNode.getContext('2d');

        context.strokeStyle = "#000000";
        context.lineWidth = 1;
        context.setTransform(1, 0, 0, 1, 100, 0);

        return {
          drawPointer: function (xArg) {
            var x = xArg - 11; // why 11?
            context.clearRect(-100, 0, 391, 49);
            context.beginPath();
            context.moveTo(x, 20);
            context.lineTo(x, 32);
            context.stroke();
            context.lineTo(x - 3, 28);
            context.stroke();
            context.lineTo(x + 3, 28);
            context.lineTo(x, 32);
            context.stroke();
            context.closePath();
          }
        };
      }());

      this.rulerV.drawPointer(5);
      this.rulerH.drawPointer(5);

      this.container = Y.one('#container');
      this.map = Y.one('#map');
      this.mapDOMNode = Y.Node.getDOMNode(Y.one('#map'));
      this.pointDOMNode = Y.Node.getDOMNode(Y.one('#point'));
      this.widget = Y.one('#widget');
      this.canvas = Y.one('#canvas');
      this.widgetDOMNode = Y.Node.getDOMNode(Y.one('#canvas'));
      this.reportBox = Y.one('#report');
      this.log = document.getElementById('steps-log');

      Y.on('mousedown', Y.bind(function (e) {
        if (e.target === this.map && e.shiftKey) {
          e.halt();

          this.operation = 'drag';

          this.constrainedPointerPanStart(e);

          if (!e.ctrlKey) {
            this.log.value = '';
            this.event = [];
            this.eventOffset = [0];
            this.logging = true;
          }
          this.report(e);
          this.rulerV.drawPointer(e.y - this.container.getY());
          this.rulerH.drawPointer(e.x - this.container.getX());
        }
      }, this));

      Y.on('mousewheel', Y.bind(function (e) {
        if (e.target === this.map || e.target === this.canvas) {
          e.preventDefault();
          e.stopPropagation();
          e.x = e.pageX - this.container.getX();
          e.y = e.pageY - this.container.getY();
          this.filteredZoomEvent(e);
          this.report(e);
        }
      }, this));

      Y.on('mouseup', Y.bind(function (e) {
        if (e.shiftKey) {
          e.halt();
          this.constrainedPointerPanEnd(e);
          this.operation = null;
          this.report(e);
          this.logging = false;
        }
      }, this));

      Y.on('mousemove', Y.bind(function (e) {
        if (e.shiftKey) {
          e.x = e.pageX;
          e.y = e.pageY;
          e.halt();

          if (this.operation === 'drag') {
            this.constrainedPointerPan(e);
          }

          this.rulerV.drawPointer(e.y - this.container.getY());
          this.rulerH.drawPointer(e.x - this.container.getX());
        }
        this.report(e);
      }, this));

      Y.one('#constraint').on('click', Y.bind(function () {
        Y.one('#constraint').set('disabled', true);
        Y.one('#constraint-span').setStyle('color', 'grey');
        Y.mix(this, Y.ACMACS.ElasticOverscroll, true);
        Y.mix(this, Y.ACMACS.ElasticZoom, true);
      }, this));

      Y.one('#clip').on('click', Y.bind(function () {
        this.clip = Y.one('#clip').get('checked');
      }, this));

      Y.one('#next-log').on('click', Y.bind(function () {
        var e;

        if (this.eventIndex < this.event.length) {
          e = this.event[this.eventIndex].split(' ');
          if (e[0] === 'zoom') {
            Y.one('#zoom-' + e[1]).set('value', e[2]);
            this.setZoom(e[1]);
          }
          else {
            this.map.simulate(
              'mouse' + e[0],
              {
                clientX: this.container.getX() + parseFloat(e[1]),
                clientY: this.container.getY() + parseFloat(e[2]),
                shiftKey: true,
                ctrlKey: true
              }
            );
            this.rulerH.drawPointer(parseFloat(e[1]));
            this.rulerV.drawPointer(parseFloat(e[2]));
          }

          this.log.setSelectionRange(this.eventOffset[this.eventIndex], this.eventOffset[this.eventIndex + 1]);
          this.eventIndex += 1;
          selectTextareaLine(this.log, this.eventIndex);
          if (this.eventIndex === this.event.length) {
            Y.one('#next-log').set('disabled', true);
          }
          Y.one('#reset-log').set('disabled', false);
        }
      }, this));

      Y.one('#reset-log').on('click', Y.bind(function () {
        this.mapDOMNode.setAttribute('transform', '');
        this.mapDOMNode.setAttribute('r', this.size / 2);
        this.operation = null;
        this.eventIndex = 0;
        this.shift(0, 0);
        this.rulerV.drawPointer(5);
        this.rulerH.drawPointer(5);
        Y.one('#next-log').set('disabled', false);
        Y.one('#reset-log').set('disabled', true);
      }, this));

      Y.one(this.log).on('valuechange', Y.bind(function () {
        var l = 0;

        if (!this.logging) {
          this.mapDOMNode.setAttribute('transform', '');
          this.mapDOMNode.setAttribute('r', this.size / 2);
          this.operation = null;
          this.eventIndex = 0;
          this.shift(0, 0);
          this.rulerV.drawPointer(5);
          this.rulerH.drawPointer(5);
          Y.one('#next-log').set('disabled', false);

          this.event = this.log.value.split('\n');
          this.eventOffset = [0];
          Y.each(this.event, Y.bind(function (event) {
            l += event.length + 1;
            this.eventOffset.push(l);
          }, this));
          Y.log(this.event);
          Y.log(this.eventOffset);
        }
      }, this));

      Y.one('#load-log').on('click', Y.bind(function () {
        var l = 0;

        this.event = this.schedule[Y.one('#selector').get('value')].steps;
        console.log(this.event);
        this.log.value = this.event.join('\n');
        this.mapDOMNode.setAttribute('transform', '');
        this.mapDOMNode.setAttribute('r', this.size / 2);
        this.operation = null;
        this.eventIndex = 0;
        this.shift(0, 0);
        this.rulerV.drawPointer(5);
        this.rulerH.drawPointer(5);
        Y.one('#next-log').set('disabled', false);

        this.eventOffset = [0];
        Y.each(this.event, Y.bind(function (event) {
          l += event.length + 1;
          this.eventOffset.push(l);
        }, this));
      }, this));

      Y.one('#clear-log').on('click', Y.bind(function () {
        this.log.value = '';
        this.event = [];
        this.eventOffset = [0];
      }, this));

      Y.one('#zoom-x').on('key', Y.bind(function () {
        this.setZoom('x');
      }, this), 'enter');

      Y.one('#zoom-y').on('key', Y.bind(function () {
        this.setZoom('y');
      }, this), 'enter');

      this.updateZoomRatio();

    }, // setUp()

    pan: function (x, y) {
      Y.log('pan(' + x + ', ' + y + ')');
      this.mapDOMNode.applyTransformation(
        this.mapDOMNode.getCTM().translate(x, y)
      );
    },

    shift: function (xArg, yArg) {
      var width = 100,
          height = 200,
          clipSpec,
          x, y,
          mar = {};

      if (this.elasticDisplacement) {
        x = this.elasticDisplacement(xArg);
        y = this.elasticDisplacement(yArg);
      }

      Y.log('shift(' + x + ', ' + y + ')');
      this.widget.setStyle('top', y + 'px');
      this.widget.setStyle('left', x + 'px');

      if (x >= 1) {
        mar.l = 0;
        mar.r = width - x;
        Y.one('#margin-left').setStyle('width', x + 'px');
        Y.one('#margin-right').setStyle('width', '0px');
      }
      else if (x <= -1) {
        mar.l = -x;
        mar.r = width;
        Y.one('#margin-left').setStyle('width', '0px');
        Y.one('#margin-right').setStyle('width', -x + 'px');
      }
      else {
        mar.l = 0;
        mar.r = width;
        Y.one('#margin-left').setStyle('width', '0px');
        Y.one('#margin-right').setStyle('width', '0px');
      }

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
      if (this.clip) {
        this.widget.setStyle('clip', clipSpec);
      }
    },

    report: function (e) {
      var text = '',
          newline = '',
          event = e.type.replace(/^mouse/, ''),
          eventSpec,
          start,
          x, y;

      x = e.pageX - this.container.getX();
      y = e.pageY - this.container.getY();
      text += Y.substitute('e.clientX = {x}, e.clientY = {y}\n', {x: e.clientX, y: e.clientY});
      text += Y.substitute('e.pageX = {x}, e.pageY = {y}\n', {x: e.pageX, y: e.pageY});
      text += Y.substitute('e.x = {x}, e.y = {y}\n', {x: e.x, y: e.y});
      text += Y.substitute('world.x = {x}\n', this.worldPoint(x, y));
      text += Y.substitute('world.y = {y}\n', this.worldPoint(x, y));
      text += Y.substitute('pickupPoint: ({x}, {y})\n', {
        x: this.pickupPoint.x === undefined ? undefined : this.pickupPoint.x.toFixed(1),
        y: this.pickupPoint.y === undefined ? undefined : this.pickupPoint.y.toFixed(1)
      });
      text += Y.substitute('cx = {x}, cy = {y}', {y: this.cy().toFixed(1), x: this.cx().toFixed(1)});
      this.reportBox.setContent(text);

      if (this.logging && e.shiftKey && !e.ctrlKey) {
        if (this.log.value.length) {
          newline = '\n';
        }
        if (this.log.value.length) {
          start = this.log.value.length + 1;
        }
        else {
          start = 0;
        }
        x = (e.pageX - this.container.getX()).toFixed(1).replace(/\.0$/, '');
        y = (e.pageY - this.container.getY()).toFixed(1).replace(/\.0$/, '');
        eventSpec = event + ' ' + x + ', ' + y;
        this.log.value += newline + eventSpec;
        this.log.setSelectionRange(start, this.log.value.length);
        this.event.push(eventSpec);
        this.eventOffset.push(this.log.value.length + 1); // +1 skips the newline
      }
    },

    zoomRatio: function () {
      return ({
        x: parseFloat(Y.one('#zoom-x').get('value')),
        y: parseFloat(Y.one('#zoom-y').get('value'))
      });
    },

    updateZoomRatio: function () {
      var size = 2 * this.mapDOMNode.getAttribute('r') * this.mapDOMNode.getCTM().a;
      this.size = size;
      Y.one('#zoom-x').set('value', (size / this.width).toFixed(3));
      Y.one('#zoom-y').set('value', (size / this.height).toFixed(3));
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

    worldPoint: function (x, y) {
      return this.svgPoint(x, y).matrixTransform(
        this.mapDOMNode.getCTM().inverse()
      );
    },

    svgPoint: function (x, y) {
      var svgp = this.widgetDOMNode.createSVGPoint();
      svgp.x = x;
      svgp.y = y;
      return svgp;
    },

    cx: function () {
      var bbox = this.displayBoundingBox();
      return bbox.x + bbox.width / 2;
    },

    cy: function () {
      var bbox = this.displayBoundingBox();
      return bbox.y + bbox.height / 2;
    },

    viewportSize: function (dimension) {
      if (dimension === 'x') {
        return this.width;
      }
      else if (dimension === 'y') {
        return this.height;
      }
      else {
        throw new Error('unkown dimension \'' + dimension + '\'');
      }
    },

    bBox: function () {
      var bbox = this.displayBoundingBox();
      return {
        left: bbox.x,
        top: bbox.y,
        right: bbox.x + bbox.width,
        bottom: bbox.y + bbox.height
      };
    },

    bBoxRange: function (dimension) {
      var bbox = this.displayBoundingBox();
      if (dimension === 'x') {
        return {
          top: bbox.x,
          bottom: bbox.x + bbox.width,
          span: bbox.width
        };
      }
      else if (dimension === 'y') {
        return {
          top: bbox.y,
          bottom: bbox.y + bbox.height,
          span: bbox.height
        };
      }
      else {
        throw new Error('unkown dimension \'' + dimension + '\'');
      }
    },

    // This function emulates LayerStack.pointerZoom()
    filteredZoomEvent: function (e) {
      if (e.wheelDelta > 0) {
        e.wheelDelta = 0.1; // fixing the delta helps prevent the occurrence of insane zoom factors
      }
      else {
        e.wheelDelta = -0.1;
      }
      this.pointerZoom(e);
    },

    pointerZoom: function (e) {
      // Zoom factor is calculated using the normalised wheel delta, which is
      // assumed to be of constant magnitude.
      //
      // Because the sign of delta varies, the zoom factor can
      // take one of two values: slightly below 1 or slightly above.
      this.zoom(1 + e.wheelDelta, e.x, e.y, 'viewport');
      this.updateZoomRatio();
    },

    zoom: function (zf, x, y) {
      var k = this.widgetDOMNode
          .createSVGMatrix()
          .translate(x, y)
          .scale(zf)
          .translate(-x, -y);
      this.mapDOMNode.applyTransformation(
        this.mapDOMNode.getCTM().multiply(k)
      );
    },

    setZoom: function (dimension) {
      if (dimension === 'x') {
        this.mapDOMNode.setAttribute('r', this.width * Y.one('#zoom-x').get('value') / 2);
      }
      else {
        this.mapDOMNode.setAttribute('r', this.height * Y.one('#zoom-y').get('value') / 2);
      }
      this.mapDOMNode.setAttribute('transform', '');
      this.updateZoomRatio();
    },

    constrainedPointerPanStart: function (e) {
      this.pickupPoint.x = e.pageX;
      this.pickupPoint.y = e.pageY;
    },

    constrainedPointerPanEnd: function (e) {
    },

    constrainedPointerPan: function (e) {
      this.pan(
        e.pageX - this.pickupPoint.x,
        e.pageY - this.pickupPoint.y
      );
      this.pickupPoint.x = e.pageX;
      this.pickupPoint.y = e.pageY;
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
}, '@VERSION@', {requires: ['event-mousewheel', 'event-key', 'event-valuechange', 'node-style', 'node-screen', 'node-event-simulate', 'substitute', 'overscroll-elastic', 'zoom-elastic']});


YUI.add('zoom-elastic', function(Y) {
  Y.namespace('ACMACS').ElasticZoom = {
    pointerZoom: function (e) {
      var bbox = this.mapDOMNode.getBBox(),
          displayX = (e.pageX - this.container.getX()).toFixed(1).replace(/\.0$/, ''),
          displayY = (e.pageY - this.container.getY()).toFixed(1).replace(/\.0$/, ''),
          stablePoint;

      if (this.outsideTheHull(e)) {
        Y.log('outside');
        stablePoint = this.nearestPointOnTheHull(e);
        e.x = stablePoint.x;
        e.y = stablePoint.y;
      }

      // Zoom factor is calculated using the normalised wheel delta, which is
      // assumed to be of constant magnitude.
      //
      // Because the sign of delta varies, the zoom factor can
      // take one of two values: slightly below 1 or slightly above.
      this.zoom(1 + e.wheelDelta, e.x, e.y, 'viewport');
      this.updateZoomRatio();
      Y.log('constrained zoom: ' + e.x + ', ' + e.y);
      this.outsideTheHull(e);
    },

    outsideTheHull: function (e) {
      var bbox = this.displayBoundingBox(),
          r = bbox.width / 2,
          cx = bbox.x + r,
          cy = bbox.y + r,
          displayX = e.pageX - this.container.getX(),
          displayY = e.pageY - this.container.getY(),
          dist = Math.sqrt((displayX - cx) * (displayX - cx) + (displayY - cy) * (displayY - cy));

      this.pointDOMNode.setAttribute('cx', cx + r * (displayX - cx) / dist);
      this.pointDOMNode.setAttribute('cy', cy + r * (displayY - cy) / dist);
      return dist > r;
    },

    nearestPointOnTheHull: function (e) {
      var bbox = this.displayBoundingBox(),
          r = bbox.width / 2,
          cx = bbox.x + r,
          cy = bbox.y + r,
          displayX = e.pageX - this.container.getX(),
          displayY = e.pageY - this.container.getY(),
          dist = Math.sqrt((displayX - cx) * (displayX - cx) + (displayY - cy) * (displayY - cy));

      return {
        x: cx + r * (displayX - cx) / dist,
        y: cy + r * (displayY - cy) / dist
      };
    },

    nearestPoint: function (point) {
    }
  };
}, "0.0.1", {requires: ['node']});
