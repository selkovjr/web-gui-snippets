/*global document: false, YUI: false */
"use strict";

YUI.add('layer-geometry-tests', function (Y) {
  var self,
    viewportWidth = 600, // pixels, to be set from the current style value
    initialWidth = viewportWidth + 'px',
    initialHeight = '400px',
    panStepVP = 50, // pixels
    panStepWorld, // to be calculated from panStepVP
    panStepFrac = 15, // percent
    chunkSize = 100,
    i,
    arg,
    rot = {},
    x,
    y,
    node,
    renderStart,
    elapsed;

  Y.namespace('ACMACS');

  // This object emulates LayerStack
  self = {
    layer: null,
    shadow: null,
    target: null,
    labelLayer: null,
    currentZoomLevel: 0,
    nodeCount: 0,
    operation: null,

    trueWorldPoint: function (p) {
      return this.shadow.svgPoint(p).matrixTransform(
        this.shadow.groupDOMNode.getCTM().inverse()
      );
    },

    setUp: function () {
      var t,
        layer,
        labelLayer,
        shadow,
        target;

      Y.one('body').append('<div style="position:absolute; top: 1em; left: 0; padding-left: 1em;"><code id="report"></code></div>');
      Y.one('body').append('<div style="position:absolute; top: 2.2em; left: 0; padding-left: 1em;"><code id="report_layer_trans"></code><br /><code id="report_shadow_trans"></code></div>');
      Y.one('body').append('<div style="position:absolute; top: 4.6em; left: 0; padding-left: 1em;"><code id="report_bbox"></code></div>');
      Y.one('body').append('<div style="position:absolute; top: 4em; left: 0" id="testbed"></div>');
      Y.one('#testbed').setContent('<div style="float: left; width: ' + initialWidth + '; height: ' + initialHeight + '" id="stack"></div>');
      Y.one('#stack').append('<div style="position: absolute; top: 0px; left: 0px; zindex: 0; width: ' + initialWidth + '; height: ' + initialHeight + '" id="shadowcontainer"></div>');
      Y.one('#stack').append('<div style="position: absolute; top: 0px; left: 0px; zindex: 2; width: ' + initialWidth + '; height: ' + initialHeight + '" id="graphiccontainer"></div>');
      Y.one('#stack').append('<div style="position: absolute; top: 0px; left: 0px; zindex: 2; width: ' + initialWidth + '; height: ' + initialHeight + '" id="labelcontainer"></div>');

      Y.one('#testbed').append('<div style="float: right; width: 300px; padding-left: 0.5em;" id="controls"></div>');
      Y.one('#controls').append('<div id="count_display"></div>');
      Y.one('#controls').append('<div><input type="checkbox" id="display_shadow"/><label for="display_shadow">Display shadow layer</label></div>');
      Y.one('#controls').append('<div><button id="clear">Clear</button></div>');
      Y.one('#controls').append('<div><button id="destroy">Destroy</button></div>');
      Y.one('#controls').append('<div><button id="load_simple">Load simple data</button></div>');
      Y.one('#controls').append('<div><button id="load_stars">Load visible stars</button></div>');
      Y.one('#controls').append('<div><button id="load_stars_as_solids">Load visible stars as solid dots</button></div>');
      Y.one('#controls').append('<div><button id="load_stars_minimal">Load just a few stars</button></div>');
      Y.one('#controls').append('<div><input id="chart_width" type="text" style="width: 4em" value="600" />' +
                                '<input id="chart_height" type="text" style="width: 4em" value="400" />' +
                                '<button id="set_size">Set chart size</button></div>');
      Y.one('#controls').append('<div><button id="zoom_in">Zoom in</button><button id="zoom_out">Zoom out</button></div>');
      Y.one('#controls').append('<div><table>' +
                                '<tr><td colspan="3">Translate in: <select id="units"><option>world</option><option selected="1">viewport</option></select></td></tr>' +
                                '<tr><td></td><td style="text-align: center"><button id="pan_up">Up</button></td><td></td></tr>' +
                                '<tr><td><button id="pan_left">Left</button></td><td></td><td><button id="pan_right">Right</button></td></tr>' +
                                '<tr><td></td><td><button id="pan_down">Down</button></td><td></td></tr>' +
                                '</table></div>');


      Y.one('#controls').append(Y.Node.create(
        '<svg' +
        ' xmlns="http://www.w3.org/2000/svg"' +
        ' version="1.1"' +
        ' width="160"' +
        ' height="80"' +
        ' id="dial"' +
        '>' +
          '<text x="75" y="62" text-anchor="middle" font-family="Verdana" font-size="14" fill="black">Rotate</text>' +
        '</svg>'
      ));

      // for (i = 0; i < 48; i += 1) {  // One-48th of a circle is 7.5 degrees
      Y.each([1, 2, 3, 4, 5, 43, 44, 45, 46, 47], function (i) {
        arg = i * Math.PI / 24;
        x = 100 * Math.sin(arg); // swap sin and -cos to place the 0 index on top
        y = -100 * Math.cos(arg);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('cx', 75 + x);
        node.setAttribute('cy', 120 + y);
        node.setAttribute('r', 6);
        node.setAttribute('fill', 'white');
        node.setAttribute('stroke', 'black');
        node.setAttribute('stroke-width', 2);
        node.setAttribute('id', 'spot_' + i);
        Y.one('#dial').append(node);

        rot['spot_' + i] = arg * 180 / Math.PI;

        Y.on('click', function (e) {
          var vc = self.layer.viewportCentre();

          e.preventDefault();
          e.target.setAttribute('fill', 'grey');
          Y.later(2000, e.target, function () {
            this.setAttribute('fill', 'white');
          });
          self.layer.rotate(rot[e.target.get('id')], vc.x, vc.y, 'viewport');
          self.shadow.rotate(rot[e.target.get('id')], vc.x, vc.y, 'viewport');
          self.reportTransformations();
        }, node);

      });

      Y.one('#controls').append('<div><button id="flip_h">Flip horizontally</button><button id="flip_v">Flip vertically</button></div>');

      Y.one('#controls').append(
        '<div style="position: relative; height: 50px; margin-top: 0.5em">' +
        '  <div style="position: absolute; top: 0; left: 0; width: 120px">' +
        '    <span>' +
        '      <input id="matrix_a" type="text" style="width: 48px" value="1" />' +
        '      <input id="matrix_c" type="text" style="width: 48px" value="0" />' +
        '    </span>' +
        '    <br />' +
        '    <span>' +
        '      <input id="matrix_b" type="text" style="width: 48px" value="0" />' +
        '      <input id="matrix_d" type="text" style="width: 48px" value="1" />' +
        '    </span>' +
        '  </div>' +
        '  <div style="position: absolute; top: 0.8em; left: 120px">' +
        '    <button id="apply_trans">Apply transformation</button>' +
        '  </div>' +
        '</div>'
      );

      Y.one('#controls').append('<div style="margin-top: 1em; margin-bottom: 2em"><em>Also, test the mousewheel and click-and-drag actions. ' +
                                'Shift-click-and-drag should move individual nodes.<br /><br />' +
                                'Test whether the reported world co-ordinates are correct.<br /><br />' +
                                '<b>Note:</b> scaling (mousewheel action) on the map layer does not preserve world co-ordinates.' +
                                'An additional layer of type Y.ACMACS.ShadowLayer is needed to make ' +
                                'world co-ordinates invariant of scaling. It is hidden below the test layer.</em></div>');

      shadow = new Y.ACMACS.ShadowLayer({
        parent: self,
        instanceName: 'shadow', // this name is used to create the 'shadow' property on the stack, referring to this layer
        render: '#shadowcontainer'
      });

      target = new Y.ACMACS.TargetLayer({
        parent: self,
        render: '#graphiccontainer',
        width: initialWidth,
        height: initialHeight,
        zIndex: 100
      });

      layer = new Y.ACMACS.MapLayer({
        parent: self,
        instanceName: 'test',
        render: '#graphiccontainer'
      });

      labelLayer = new Y.ACMACS.LabelLayer({
        parent: self,
        instanceName: 'labels',
        map: 'test',
        render: '#labelcontainer'
      });

      layer.on('init', function (e) {
        self.layer = layer;
        self.labels = labelLayer;
        self.shadow = shadow;
        self.target = target;
        self.shadow.set('width', initialWidth);
        self.shadow.set('height', initialHeight);
        self.layer.set('width', initialWidth);
        self.layer.set('height', initialHeight);
        if (self.labels) {
          self.labels.set('width', initialWidth);
          self.labels.set('height', initialHeight);
        }
        self.loadSimpleData();
        Y.later(500, layer, function () {
          shadow.get('boundingBox').hide();
        });
      });

      Y.one('#clear').on('click', function () {
        self.layer.clear();
      });

      Y.one('#destroy').on('click', function () {
        self.target.destroy(true);
        self.shadow.destroy(true);
        self.layer.destroy(true);
        if (self.labels) {
          self.labels.destroy(true);
        }
      });

      Y.one('#load_simple').on('click', function () {
        self.loadSimpleData();
      });

      Y.one('#load_stars').on('click', function () {
        self.loadVisibleStars('gradient');
      });

      Y.one('#load_stars_as_solids').on('click', function () {
        self.loadVisibleStars('solid');
      });

      Y.one('#load_stars_minimal').on('click', function () {
        self.loadVisibleStars('minimal');
      });

      Y.one('#display_shadow').on('change', function () {
        if (Y.Node.getDOMNode(Y.one('#display_shadow')).checked) {
          self.shadow.get('boundingBox').show();
        }
        else {
          self.shadow.get('boundingBox').hide();
        }
      });

      Y.one('#set_size').on('click', function () {
        self.setChartSize();
      });
      Y.one('#chart_width').on('key', function () {
        self.setChartSize();
      }, 'enter');
      Y.one('#chart_height').on('key', function () {
        self.setChartSize();
      }, 'enter');

      Y.one('#zoom_in').on('click', function () {
        self.layer.centredZoom(0.1);
        self.shadow.centredZoom(0.1);
        self.reportTransformations();
      });

      Y.one('#zoom_out').on('click', function () {
        self.layer.centredZoom(-0.1);
        self.shadow.centredZoom(-0.1);
        self.reportTransformations();
      });

      Y.one('#flip_h').on('click', function () {
        self.layer.horizontalFlip();
        self.shadow.horizontalFlip();
        self.reportTransformations();
      });

      Y.one('#flip_v').on('click', function () {
        self.layer.verticalFlip();
        self.shadow.verticalFlip();
        self.reportTransformations();
      });

      Y.one('#apply_trans').on('click', function () {
        self.applyTransformation();
      });
      Y.one('#matrix_a').on('key', function () {
        self.applyTransformation();
      }, 'enter');
      Y.one('#matrix_b').on('key', function () {
        self.applyTransformation();
      }, 'enter');
      Y.one('#matrix_c').on('key', function () {
        self.applyTransformation();
      }, 'enter');
      Y.one('#matrix_d').on('key', function () {
        self.applyTransformation();
      }, 'enter');


      Y.one('#pan_left').on('click', function () {
        // The efficiency of calculating the transformation once and applying
        // it to both layers is lost, doing it with each lyer's own pan()
        // method.
        switch (Y.one('#units').get('value')) {
        case 'world':
          self.layer.pan(-panStepWorld, 0); // pixels
          if (self.labels) {
            self.labels.pan(-panStepWorld, 0);
          }
          self.shadow.pan(-panStepWorld, 0); // pixels
          break;
        case 'viewport':
          self.layer.pan(-panStepVP, 0, 'viewport'); // pixels
          if (self.labels) {
            self.labels.pan(-panStepVP, 0, 'viewport');
          }
          self.shadow.pan(-panStepVP, 0, 'viewport'); // pixels
          break;
        }
        self.reportTransformations();
      });

      Y.one('#pan_right').on('click', function () {
        switch (Y.one('#units').get('value')) {
        case 'world':
          self.layer.pan(panStepWorld, 0);
          if (self.labels) {
            self.labels.pan(panStepWorld, 0);
          }
          self.shadow.pan(panStepWorld, 0);
          break;
        case 'viewport':
          self.layer.pan(panStepVP, 0, 'viewport');
          if (self.labels) {
            self.labels.pan(panStepVP, 0, 'viewport');
          }
          self.shadow.pan(panStepVP, 0, 'viewport');
          break;
        }
        self.reportTransformations();
      });

      // Note that the Up direction in world co-ordinates is not the same as on
      // the viewport!
      Y.one('#pan_up').on('click', function () {
        switch (Y.one('#units').get('value')) {
        case 'world':
          self.layer.pan(0, panStepWorld);
          if (self.labels) {
            self.labels.pan(0, panStepWorld);
          }
          self.shadow.pan(0, panStepWorld);
          break;
        case 'viewport':
          self.layer.pan(0, -panStepVP, 'viewport');
          if (self.labels) {
            self.labels.pan(0, -panStepVP, 'viewport');
          }
          self.shadow.pan(0, -panStepVP, 'viewport');
          break;
        }
        self.reportTransformations();
      });

      Y.one('#pan_down').on('click', function () {
        switch (Y.one('#units').get('value')) {
        case 'world':
          self.layer.pan(0, -panStepWorld);
          if (self.labels) {
            self.labels.pan(0, -panStepWorld);
          }
          self.shadow.pan(0, -panStepWorld);
          break;
        case 'viewport':
          self.layer.pan(0, panStepVP, 'viewport');
          if (self.labels) {
            self.labels.pan(0, panStepVP, 'viewport');
          }
          self.shadow.pan(0, panStepVP, 'viewport');
          break;
        }
        self.reportTransformations();
      });

      target.get('contentBox').on('contextmenu', function (e) {
        var zi, mapTarget, labelTarget;
        e.halt();

        zi = self.layer.get('zIndex');
        self.layer.set('zIndex', 200); // to make sure it is above the target layer
        mapTarget = Y.one(document.elementFromPoint(e.clientX, e.clientY));
        self.layer.set('zIndex', zi);

        zi = self.labels.get('zIndex');
        self.labels.set('zIndex', 200); // to make sure it is above the target layer
        labelTarget = Y.one(document.elementFromPoint(e.clientX, e.clientY));
        self.labels.set('zIndex', zi);

        if (layer.canvas.contains(mapTarget) && layer.canvas !== mapTarget) {
          e.target = mapTarget;
          Y.log(e.target.get('tagName'));
        }
        else if (labelLayer.canvas.contains(labelTarget) && labelLayer.canvas !== labelTarget) {
          Y.log('label');
        }
        else {
          Y.log('canvas');
          return;
        }

      });

      // When catching events with a target node, the hit test in the form of
      // document.getElementFromPoint() needs to be done, instead of
      // delegation.
      target.get('contentBox').on('mousedown', function (e) {
        var mapTarget, labelTarget, zi;

        e.preventDefault();
        e.stopPropagation();
        e.x = e.pageX - self.layer.get('contentBox').getX();
        e.y = e.pageY - self.layer.get('contentBox').getY();
        self.reportCoordinates(e);

        if (e.shiftKey) {
          zi = self.layer.get('zIndex');
          self.layer.set('zIndex', 200); // to make sure it is above the target layer
          mapTarget = Y.one(document.elementFromPoint(e.clientX, e.clientY));
          self.layer.set('zIndex', zi);

          zi = self.labels.get('zIndex');
          self.labels.set('zIndex', 200); // to make sure it is above the target layer
          labelTarget = Y.one(document.elementFromPoint(e.clientX, e.clientY));
          self.labels.set('zIndex', zi);

          if (layer.canvas.contains(mapTarget) && layer.canvas !== mapTarget) {
            e.target = mapTarget;
            self.operation = 'move-drag';
            self.layer.pointerMoveStart(e);
          }
          else if (labelLayer.canvas.contains(labelTarget) && labelLayer.canvas !== labelTarget) {
            Y.log('label was hit');
          }
          else {
            Y.log('no element was hit: not doing anything');
            return;
          }

        }
        else if (e.altKey) {
          self.operation = undefined;
          self.layer.pointerFlip(e);
          self.shadow.pointerFlip(e);
        }
        else {
          self.operation = 'pan-drag';
          self.layer.pointerPanStart(e);
          self.shadow.pointerPanStart(e);
          if (self.labels) {
            self.labels.pointerPanStart(e);
          }
        }
        self.reportTransformations();
      });

      target.get('contentBox').on('mouseup', function (e) {
        self.operation = undefined;
      });

      target.get('contentBox').on('mousemove', function (e) {
        var point;

        // Since none of the browsers we use sends any data in e.x and e.y, use
        // these properties to pass the relative layer co-ordinates to the drag
        // method. These co-ordinates are transformable to world by
        // layer.groupDOMNode.getCTM().
        e.x = e.pageX - self.layer.get('contentBox').getX();
        e.y = e.pageY - self.layer.get('contentBox').getY();

        self.reportCoordinates(e);
        self.highlightNeighbours(e);

        if (self.operation) {
          e.preventDefault();
          e.stopPropagation();
          if (self.operation === 'pan-drag') {
            self.layer.pointerPanDrag(e);
            self.shadow.pointerPanDrag(e);
            if (self.labels) {
              self.labels.pointerPanDrag(e);
            }
          }
          if (self.operation === 'move-drag') {
            self.layer.pointerMoveDrag(e);
          }
        }
        self.reportTransformations();
      });

      self.layer.get('contentBox').on('mouseup', function (e) {
        if (self.operation === 'pan-drag' || self.operation === 'move-drag') {
          self.operation = null;
        }
      });

      Y.on('mousewheel', function (e) {
        // if (layer.get('contentBox').contains(e.target)) { /* instead, assume each widget has its own target node */
        if (target.get('contentBox').contains(e.target)) {
          // Without this test, all widgets on the page will zoom at once.
          // Testing for content box instead of topLayerCanvas because events
          // on blank svg canvas fall through in Safari.
          e.preventDefault();
          e.stopPropagation();
          // It does not seem to matter which co-ordinates to use as a zoom
          // focus: clientXY, pageXY or this (why?). But since it does not
          // matter why not give the correct ones, to avoid confusion?
          e.x = e.pageX - self.layer.get('contentBox').getX();
          e.y = e.pageY - self.layer.get('contentBox').getY();
          self.filteredZoomEvent(e);
        }
        self.reportTransformations();
      });
    },

    // This function emulates LayerStack.get()
    get: function (param) {
      var data = {
        zoomLimits: [-10, 100],
        width: 600,
        height: 400
      };
      return data[param];
    },

    // This function emulates LayerStack.pointerZoom()
    filteredZoomEvent: function (e) {
      if (e.wheelDelta > 0) {
        if (self.get('zoomLimits')[1] <= self.currentZoomLevel) {
          return;
        }
        self.currentZoomLevel += 1;
        e.wheelDelta = 0.1; // fixing the delta helps prevent the occurrence of insane zoom factors
      }
      else {
        if (self.get('zoomLimits')[0] >= self.currentZoomLevel) {
          return;
        }
        self.currentZoomLevel -= 1;
        e.wheelDelta = -0.1;
      }
      self.layer.pointerZoom(e);
      self.shadow.pointerZoom(e);
    },

    setChartSize: function () {
      var tl, // current transformation on the layer
          ts, // current transformation on the shadow
          co, // original viewport centre
          cn, // new viewport centre
          width = Y.one('#chart_width').get('value'),
          height = Y.one('#chart_height').get('value');

      co = self.layer.viewportCentre();

      // Keep the current transformation
      tl = self.layer.groupDOMNode.getAttribute('transform');
      ts = self.shadow.groupDOMNode.getAttribute('transform');

      Y.one('#stack').setStyle('width', width);
      Y.one('#graphiccontainer').setStyle('width', width);
      Y.one('#shadowcontainer').setStyle('width', width);
      Y.one('#stack').setStyle('height', height);
      Y.one('#graphiccontainer').setStyle('height', height);
      Y.one('#shadowcontainer').setStyle('height', height);
      self.layer.set('width', width);
      self.layer.set('height', height);
      self.shadow.set('width', width);
      self.shadow.set('height', height);
      self.target.set('width', width);
      self.target.set('height', height);
      if (self.labels) {
        Y.one('#labelcontainer').setStyle('width', width);
        Y.one('#labelcontainer').setStyle('height', height);
        self.labels.set('width', width);
        self.labels.set('height', height);
        self.labels.groupDOMNode.setAttribute('transform', tl);
      }

      // Restore the transformation
      self.layer.groupDOMNode.setAttribute('transform', tl);
      self.shadow.groupDOMNode.setAttribute('transform', ts);

      // Translate to new centre (this should be optional)
      cn = self.layer.viewportCentre();
      self.layer.pan(cn.x - co.x, cn.y - co.y, 'viewport');
      if (self.labels) {
        self.labels.pan(cn.x - co.x, cn.y - co.y, 'viewport');
      }
      self.shadow.pan(cn.x - co.x, cn.y - co.y, 'viewport');

      self.reportTransformations();
    },

    applyTransformation: function () {
      var t = self.layer.canvasDOMNode.createSVGMatrix();
      Y.each(['a', 'b', 'c', 'd'], function (el) {
        t[el] = Y.one('#matrix_' + el).get('value');
      });

      self.shadow.groupDOMNode.applyTransformation(
        self.shadow.groupDOMNode.getCTM().multiply(t)
      );

      self.layer.simulateTransformation(t);

      self.reportTransformations();
    },

    loadSimpleData: function () {
      var t, star, l;

      t = Y.ACMACS.composeSvgViewingTransformation({
        matrix: [[1, 0], [0, 1]],
        viewportWorldSize: [2, 2],
        viewportWorldOrigin: [-0.587, -1.335],
        width: self.layer.get('width'),
        height: self.layer.get('height')
      });
      panStepWorld = 2 * 50 / viewportWidth;

      self.layer.clear();
      self.shadow.clear();
      self.layer.canvas.setStyle('background', 'transparent');
      if (self.labelLayer) {
        self.labelLayer.clear();
      }

      self.layer.groupDOMNode.setAttribute('transform', t.asMatrixString);
      if (self.labels) {
        self.labels.groupDOMNode.setAttribute('transform', t.asMatrixString);
      }
      self.shadow.groupDOMNode.setAttribute('transform', t.asMatrixString);

      Y.one('#stack').setStyle('background', 'white');

      self.shadow.setPixelSize(); // because the points are going to be plotted on the shadow in this test
      self.layer.setPixelSize();
      if (self.labels) {
        self.labels.setPixelSize();
      }

      self.nodeCount = 0;

      self.layer.addPoint({
        point: [0, 0],
        size: 2.5,
        fill: 'green',
        opacity: 0.66,
        label: 'label text',
        labelSize: 1.0
      });
      self.nodeCount += 1;

      self.layer.addPoint({
        point: [0, 1],
        size: 2.5,
        fill: 'green',
        opacity: 0.66
      });
      self.nodeCount += 1;

      self.layer.addPoint({
        point: [1, 0],
        size: 2.5,
        fill: 'green',
        opacity: 0.66,
        label: 'label text 2',
        labelSize: 2.0
      });
      self.nodeCount += 1;

      self.layer.addPoint({
        shape: 'box',
        point: [0.5, 0.5],
        size: 4,
        rotation: 30,
        fill: 'white',
        opacity: 0.36,
        label: 'label text 3',
        labelSize: 1.5
      });
      self.nodeCount += 1;

      self.layer.addPoint({
        shape: 'box',
        point: [1, 1],
        size: 4,
        fill: 'white',
        opacity: 0.36
      });
      self.nodeCount += 1;

      // the red cross marking the text node's 'point'
      self.layer.addPath({
        d: 'M -0.025,0 0.025,0 M 0,-0.025 0,0.025',
        point: [0.5, 0],
        rotation: 45,
        fill: 'red',
        stroke: 'red',
        opacity: 0.9
      });
      self.nodeCount += 1;
      self.layer.addText({
        x: 0.5,
        y: 0.0,
        text: 'Just text',
        size: 1.5,
        fill: '#4040FF',
        font: 'sans-serif',
        opacity: 0.6,
        offsetX: 0,
        offsetY: 0,
        pointSize: 0
      });
      self.nodeCount += 1;


      // Draw a triangle using the general path method
      self.layer.addPoint({
        shape: 'path',
        d: 'M -0.0866 -0.05 L 0.0866 -0.05 L 0 0.1 z',
        point: [0.0, 0.5],
        size: 40,
        rotation: 10,
        fill: 'red',
        stroke: 'blue',
        opacity: 0.66
      });
      // Alternatively (separate fill and stroke opacities):
      // self.layer.addPath({
      //   d: 'M -0.0866 -0.05 L 0.0866 -0.05 L 0 0.1 z',
      //   point: [0.0, 0.5],
      //   rotation: 10,
      //   fill: 'red',
      //   fillOpacity: 0.26,
      //   stroke: 'blue',
      //   strokeOpacity: 0.66
      // });

      self.nodeCount += 1;


      // Draw a flat-sided star (a simple polygon)
      star = {
        flatsided: true,
        point: [0.5, 1.0],
        size: 6 * self.layer.attributeOrProfileSetting('pointSizeCalibration') * self.layer.onePixel,
        rotation: 0,
        fill: 'white',
        proportion: 0,
        rounded: 0,
        arg1: 0,
        arg2: 0.2,
        opacity: 0.36,
        corners: 6
      };
      self.layer.addPoint({
        shape: 'star',
        star: star,
        point: star.point,
        size: 50,
        rotation: 0,
        fill: "#808000",
        fillOpacity: 0.48,
        stroke: 'black',
        strokeOpacity: 0.5
      });
      self.nodeCount += 1;


      // Draw a star
      star = {
        point: [1.0, 0.5],
        size: 6 * self.layer.attributeOrProfileSetting('pointSizeCalibration') * self.layer.onePixel,
        rotation: 0,
        fill: 'white',
        opacity: 0.36,
        corners: 6,
        proportion: 0.6,
        rounded: 0.4,
        arg1: 0,
        arg2: 0.2
      };
      self.layer.addPoint({
        shape: 'star',
        star: star,
        point: star.point,
        size: 50,
        fill: "blue",
        fillOpacity: 0.48,
        rotation: 0,
        stroke: 'black',
        opacity: 0.5
      });
      self.nodeCount += 1;

      self.layer.updateIndex();
      Y.log('k-d tree balance factor: ' + self.layer.kdTree.balanceFactor());

      // --------------------  now draw this on the shadow -------------

      self.shadow.addLine({
        start: [0, 0],
        end: [1, 1],
        width: 1.5,
        stroke: 'darkgreen',
        opacity: 0.50
      });


      self.shadow.addPoint({
        point: [0, 0],
        size: 2.5,
        fill: 'green',
        opacity: 0.40
      });

      self.shadow.addPoint({
        point: [0, 1],
        size: 2.5,
        fill: 'green',
        opacity: 0.40
      });

      self.shadow.addPoint({
        point: [1, 0],
        size: 2.5,
        fill: 'green',
        opacity: 0.40
      });

      self.shadow.addPoint({
        shape: 'box',
        point: [0.5, 0.5],
        size: 4,
        rotation: 30,
        fill: 'white',
        opacity: 0.40
      });

      self.shadow.addPoint({
        shape: 'box',
        point: [1, 1],
        size: 4,
        fill: 'white',
        opacity: 0.40
      });


      // Draw a triangle using the general path method
      self.shadow.addPath({
        d: 'M -0.0866 -0.05 L 0.0866 -0.05 L 0 0.1 z',
        point: [0.0, 0.5],
        rotation: 10,
        fill: 'red',
        stroke: 'blue',
        opacity: 0.40
      });


      // Draw a flat-sided star (a simple polygon)
      star = {
        flatsided: true,
        point: [0.5, 1.0],
        size: 6 * self.layer.attributeOrProfileSetting('pointSizeCalibration') * self.layer.onePixel,
        rotation: 0,
        proportion: 0,
        rounded: 0,
        arg1: 0,
        arg2: 0.2,
        corners: 6
      };
      self.shadow.addPath({
        d: Y.ACMACS.starGeneratePath(star),
        point: star.point,
        rotation: 0,
        stroke: 'black',
        opacity: 0.5
      });


      // Draw a star
      star = {
        point: [1.0, 0.5],
        size: 6 * self.layer.attributeOrProfileSetting('pointSizeCalibration') * self.layer.onePixel,
        rotation: 0,
        corners: 6,
        proportion: 0.6,
        rounded: 0.4,
        arg1: 0,
        arg2: 0.2
      };
      self.shadow.addPath({
        d: Y.ACMACS.starGeneratePath(star),
        point: star.point,
        rotation: 0,
        stroke: 'black',
        opacity: 0.5
      });

      self.dataset = 'simple';
      Y.one('#count_display').setContent(self.nodeCount + ' nodes');

      // Now apply the initial transformation (which just happens to be a flip)
      // both to the layer and to the shadow
      t = self.shadow.canvasDOMNode.createSVGMatrix();
      t.a = 1;
      t.b = 0;
      t.c = 0;
      t.d = -1;
      self.shadow.groupDOMNode.applyTransformation(
        self.shadow.groupDOMNode.getCTM().multiply(t)
      );

      self.layer.simulateTransformation(t);

      self.reportTransformations();
    },


    loadVisibleStars: function (mode) {
      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
          rgBlue = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient'),
          rgWhite = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient'),
          rgYellow = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient'),
          rgOrange = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient'),
          rgRed = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient'),
          rgBlueStart = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgBlueStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgWhiteStart = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgWhiteStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgYellowStart = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgYellowStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgOrangeStart = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgOrangeStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgRedStart = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          rgRedStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'),
          thresholdMagnitude = 4,
          thresholdLuminance = Math.pow(100, -parseFloat(thresholdMagnitude) / 5),
          chunks,
          t;

      t = Y.ACMACS.composeSvgViewingTransformation({
        matrix: [[1, 0], [0, 1]],
        viewportWorldSize: [360, 180],
        viewportWorldOrigin: [0, -90],
        width: self.layer.get('width'),
        height: self.layer.get('height')
      });
      panStepWorld = 360 * 50 / viewportWidth;

      self.layer.groupDOMNode.setAttribute('transform', t.asMatrixString);
      if (self.labels) {
        self.labels.groupDOMNode.setAttribute('transform', t.asMatrixString);
      }
      self.shadow.groupDOMNode.setAttribute('transform', t.asMatrixString);

      self.shadow.clear();
      self.layer.clear();
      if (self.labels) {
        self.labels.clear();
      }
      self.layer.canvas.append(defs);

      Y.one('#stack').setStyle('background', 'black');

      self.shadow.setPixelSize(); // because the points are going to be plotted on the shadow in this test
      self.layer.setPixelSize();
      if (self.labels) {
        self.labels.setPixelSize();
      }

      if (mode === 'gradient' || mode === 'minimal') {
        defs.appendChild(rgBlue);
        defs.appendChild(rgWhite);
        defs.appendChild(rgYellow);
        defs.appendChild(rgOrange);
        defs.appendChild(rgRed);

        rgBlue.setAttribute('id', 'pointSpreadBlue');
        rgBlue.setAttribute('r', '50%');
        rgBlueStart.setAttribute('offset', '0%');
        rgBlueStart.setAttribute('stop-color', '#A2C3ED');
        rgBlueStart.setAttribute('stop-opacity', 1);
        rgBlueStop.setAttribute('offset', '100%');
        rgBlueStop.setAttribute('stop-color', '#A2C3ED');
        rgBlueStop.setAttribute('stop-opacity', 0);
        rgBlue.appendChild(rgBlueStart);
        rgBlue.appendChild(rgBlueStop);

        rgWhite.setAttribute('id', 'pointSpreadWhite');
        rgWhite.setAttribute('r', '50%');
        rgWhiteStart.setAttribute('offset', '0%');
        rgWhiteStart.setAttribute('stop-color', 'white');
        rgWhiteStart.setAttribute('stop-opacity', 1);
        rgWhiteStop.setAttribute('offset', '100%');
        rgWhiteStop.setAttribute('stop-color', 'white');
        rgWhiteStop.setAttribute('stop-opacity', 0);
        rgWhite.appendChild(rgWhiteStart);
        rgWhite.appendChild(rgWhiteStop);

        rgYellow.setAttribute('id', 'pointSpreadYellow');
        rgYellow.setAttribute('r', '50%');
        rgYellowStart.setAttribute('offset', '0%');
        rgYellowStart.setAttribute('stop-color', '#FFFB44');
        rgYellowStart.setAttribute('stop-opacity', 1);
        rgYellowStop.setAttribute('offset', '100%');
        rgYellowStop.setAttribute('stop-color', '#FFFB44');
        rgYellowStop.setAttribute('stop-opacity', 0);
        rgYellow.appendChild(rgYellowStart);
        rgYellow.appendChild(rgYellowStop);

        rgOrange.setAttribute('id', 'pointSpreadOrange');
        rgOrange.setAttribute('r', '50%');
        rgOrangeStart.setAttribute('offset', '0%');
        rgOrangeStart.setAttribute('stop-color', '#F6B9C1');
        rgOrangeStart.setAttribute('stop-opacity', 1);
        rgOrangeStop.setAttribute('offset', '100%');
        rgOrangeStop.setAttribute('stop-color', '#F6B9C1');
        rgOrangeStop.setAttribute('stop-opacity', 0);
        rgOrange.appendChild(rgOrangeStart);
        rgOrange.appendChild(rgOrangeStop);

        rgRed.setAttribute('id', 'pointSpreadRed');
        rgRed.setAttribute('r', '50%');
        rgRedStart.setAttribute('offset', '0%');
        rgRedStart.setAttribute('stop-color', '#EB6064');
        rgRedStart.setAttribute('stop-opacity', 1);
        rgRedStop.setAttribute('offset', '100%');
        rgRedStop.setAttribute('stop-color', '#EB6064');
        rgRedStop.setAttribute('stop-opacity', 0);
        rgRed.appendChild(rgRedStart);
        rgRed.appendChild(rgRedStop);
      }

      self.nodeCount = 0;

      chunks = [];
      for (i = 0; i < Math.ceil(Y.ACMACS.stars.length / chunkSize); i += 1) {
        chunks.push(i);
      }

      self.chunk(chunks, function (chunkNo) {
        var star, nil, luminance, radius, bvColour, fill, start = (new Date()).getTime(), time;

        for (i = chunkSize * chunkNo; i < chunkSize * (chunkNo + 1) && i < Y.ACMACS.stars.length; i += 1) {
          star = Y.ACMACS.stars[i];

          if (star.Mag > 1 && mode === 'minimal') {
            nil = "don't do anything";
          }
          else {
            // Point spread function from:
            // http://www.nightscapes.net/techniques/TechnicalPapers/StarColors.pdf
            luminance = Math.pow(100, -parseFloat(star.Mag) / 5);
            radius = 1.2 * luminance / (Math.pow(luminance, 4 / 5) + thresholdLuminance);
            bvColour = star.ColorIndex;

            // Colours from:
            // http://worldwind31.arc.nasa.gov/svn/trunk/WorldWind/src/gov/nasa/worldwind/layers/StarsConvertor.java
            if (mode === 'gradient' || mode === 'minimal') {
              if (bvColour < 0) {
                fill = 'url(#pointSpreadBlue)';
              }
              else if (bvColour < 0.5) {
                fill = 'url(#pointSpreadWhite)';
              }
              else if (bvColour < 1) {
                fill = 'url(#pointSpreadYellow)';
              }
              else if (bvColour < 1.5) {
                fill = 'url(#pointSpreadOrange)';
              }
              else {
                fill = 'url(#pointSpreadRed)';
              }
            }
            else {
              if (bvColour < 0) {
                fill = '#A2C3ED';
              }
              else if (bvColour < 0.5) {
                fill = 'white';
              }
              else if (bvColour < 1) {
                fill = '#FFFB44';
              }
              else if (bvColour < 1.5) {
                fill = '#F6B9C';
              }
              else {
                fill = '#EB6064';
              }
            }
            //if (mode === 'minimal') {
            if (true) {
              self.layer.addPoint({
                point: [360 - star.RA * 15, star.Dec],
                size: (Math.max(1.5, radius * 6)) / 4,
                fill: fill,
                strokeWidth: 0,
                opacity: 0.6,

                label: star.ProperName,
                labelColour: 'white',
                labelSize: 1.5
                // label size was 2.5 with addText()
              });
            }
            else {
              self.layer.addPoint({
                point: [360 - star.RA * 15, star.Dec],
                size: (Math.max(1.5, radius * 6)) / 4,
                fill: fill,
                strokeWidth: 0,
                opacity: 0.6
              });
            }
          }
          self.nodeCount += 1;
        } // for each star

        time = (new Date()).getTime() - start;
        Y.log('chunk ' + chunkNo + ', elapsed: ' + time);
        Y.one('#count_display').setContent(self.nodeCount + ' nodes');

        if (self.nodeCount === Y.ACMACS.stars.length) {
          Y.later(50, this, function () {
            Y.log('all done');
            // Connect the starts in Ursa Major
            self.shadow.addPath({
              // Alkaid: (153.114, 49.313)
              // Mizar: (159.019, 54.925)
              // Alioth: (166.493, 55.96)
              // Megrez: (176.144, 57.032)
              // Phad: (181.543, 53.695)
              // Merak: (194.54, 56.382)
              // Dubhe: (194.067, 61.751)
              d: "M153.114 49.313   L159.019 54.925   L166.493 55.96   L176.144 57.032  L181.543 53.695  L194.54 56.382  L194.067 61.751",
              point: [0, 0],
              rotation: 0,
              fill: 'none',
              stroke: 'white',
              strokeWidth: 0.5,
              opacity: 0.5
            });

            // The star map must be plotted upside-down (relative to the SVG
            // co-ordinates). This requires an initial transformation to be applied
            // both to the map layer and to the shadow.
            self.layer.verticalFlip();
            self.shadow.verticalFlip();
            self.reportTransformations();
            Y.log('k-d tree balance factor: ' + self.layer.kdTree.balanceFactor());
          });
        }
      }); // each chunk

      self.dataset = 'stars';
    },

    reportCoordinates: function (e) {
      var client,
          layer,
          offset,
          page,
          screen,
          xy,
          worldPoint = self.shadow.worldPoint(e.x, e.y),
          displayPoint = self.layer.displayPoint(worldPoint),
          world = worldPoint.x.toFixed(2) + ', ' + worldPoint.y.toFixed(2);

      client = layer = offset = page = screen = xy = '';

      if (e.clientX !== undefined) {
        client = e.clientX + ', ' + e.clientY;
      }
      if (e.layerX !== undefined) {
        layer = e.layerX + ', ' + e.layerY;
      }
      if (e.offsetX !== undefined) {
        offset = e.offsetX + ', ' + e.offsetY;
      }
      if (e.pageX !== undefined) {
        page = e.pageX + ', ' + e.pageY;
      }
      if (e.screenX !== undefined) {
        screen = e.screenX + ', ' + e.screenY;
      }
      if (e.x !== undefined) {
        xy = e.x + ', ' + e.y;
      }

      Y.one('#report').setContent(Y.substitute(
        'client = ({client}); layer = ({layer}); offset = ({offset}); page = ({page}); screen = ({screen}); (x,y) = ({xy}); world = ({world})',
        {
          client: client,
          layer: layer,
          offset: offset,
          page: page,
          screen: screen,
          xy: xy,
          world: world
        }
      ));
    },

    highlightNeighbours: function (e) {
      var worldPoint = self.layer.worldPoint(e.x, e.y),
          n = self.dataset === 'stars' ? 16 : 1;

      if (self.highlightedPoints) {
        Y.each(self.highlightedPoints, function (p) {
          p.restoreAttributes();
        });
      }
      self.highlightedPoints = [];
      // Y.log('-----');
      Y.each(self.layer.kdTree.nearest(worldPoint, n), function (o) {
        // Y.log([o.point.x, o.point.y, o.point.mapObject]);
        o.point.mapObject.highlight();
        self.highlightedPoints.push(o.point.mapObject);
      });
    },

    reportTransformations: function () {
      var margin = self.layer.viewportMargins();

      Y.one('#report_layer_trans').setContent('layer:  ' + self.layer.groupDOMNode.getAttribute('transform'));
      Y.one('#report_shadow_trans').setContent(
        'shadow: ' + self.shadow.groupDOMNode.getAttribute('transform') +
        ' (chirality: ' +
        self.shadow.groupDOMNode.getCTM().chirality() +
        ')'
      );
      Y.one('#report_bbox').setContent(
        'margins: l = ' + margin.l.toFixed(2) + ', t = ' + margin.t.toFixed(2) +
        ', b = ' + margin.b.toFixed(2) + ', r = ' + margin.r.toFixed(2)
      );
    },

    chunk: function (items, process, context) {
      var processChunk = function () {
        var item = items.shift();
        process.call(context, item);

        if (items.length > 0) {
          Y.later(2, this, processChunk);
        }
        elapsed = (new Date()).getTime() - renderStart;
        Y.log('total: ' + elapsed);
      };

      renderStart = (new Date()).getTime();
      Y.later(2, this, processChunk);
    }
  };

  Y.mix(self, Y.Base); // for Y.Base.attributeOrProfileSetting();
  Y.ACMACS.GeometryTests = self;
}, '@VERSION@', {requires: ['acmacs-maplayer', 'acmacs-labellayer', 'event-mousewheel', 'event-key', 'node-screen', 'stars', 'substitute']});
