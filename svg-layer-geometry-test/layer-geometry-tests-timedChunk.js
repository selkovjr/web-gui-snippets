/*global document: false, YUI: false */
"use strict";

YUI.add('layer-geometry-tests', function (Y) {
  YUI.hook = Y;
  var self,
    viewportWidth = 600, // pixels, to be set from the current style value
    initialWidth = viewportWidth + 'px',
    initialHeight = '400px',
    panStepVP = 50, // pixels
    panStepWorld, // to be calculated from panStepVP
    panStepFrac = 15, // percent
    chunkSize = 5,
    i,
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
      Y.one('#controls').append('<div><button id="func">Func</button></div>');
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
        var
          arg = i * Math.PI / 24,
          angle = arg * 180 / Math.PI;

        if (angle > 180) {
          angle = angle - 360;
        }

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

        rot['spot_' + i] = angle;

        Y.on('click', function (e) {
          var vc = self.layer.viewportCentre();

          e.preventDefault();
          e.target.setAttribute('fill', 'grey');
          Y.later(2000, e.target, function () {
            this.setAttribute('fill', 'white');
          });
          self.layer.rotate(rot[e.target.get('id')], vc.x, vc.y);
          self.shadow.rotate(rot[e.target.get('id')], vc.x, vc.y);
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
        width: initialWidth,
        height: initialHeight,
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

      Y.log(['name', layer.name]);
      labelLayer = new Y.ACMACS.LabelLayer({
        parent: self,
        instanceName: 'labels',
        map: 'test',
        render: '#labelcontainer'
      });
      labelLayer.scale = 1;

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

      Y.one('#func').on('click', function () {
        Y.log(self.shadow.worldGroup.getDOMNode().getTransformation().formatIn3Lines());
        Y.log(self.shadow.initGroup.getDOMNode().getTransformation().formatIn3Lines());
        Y.log(self.shadow.reflectorGroup.getDOMNode().getTransformation().formatIn3Lines());
        Y.log(self.shadow.zoomGroup.getDOMNode().getTransformation().formatIn3Lines());
        Y.log(self.shadow.pivotGroup.getDOMNode().getTransformation().formatIn3Lines());
        Y.log(self.shadow.pivotGroup.getDOMNode().getRotation());
        // Y.log(self.shadow.Group.getDOMNode().getTransformation().formatIn3Lines());
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
        self.labels.centredZoom(0.1);
        self.shadow.centredZoom(0.1);
        self.reportTransformations();
      });

      Y.one('#zoom_out').on('click', function () {
        self.layer.centredZoom(-0.1);
        self.labels.centredZoom(-0.1);
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
        self.layer.pan(-panStepVP, 0); // pixels
        if (self.labels) {
          self.labels.pan(-panStepVP, 0);
        }
        self.shadow.pan(-panStepVP, 0); // pixels
        self.reportTransformations();
      });

      Y.one('#pan_right').on('click', function () {
        self.layer.pan(panStepVP, 0);
        if (self.labels) {
          self.labels.pan(panStepVP, 0);
        }
        self.shadow.pan(panStepVP, 0);
        self.reportTransformations();
      });

      // Note that the Up direction in world co-ordinates is not the same as on
      // the viewport!
      Y.one('#pan_up').on('click', function () {
        self.layer.pan(0, -panStepVP);
        if (self.labels) {
          self.labels.pan(0, -panStepVP);
        }
        self.shadow.pan(0, -panStepVP);
        self.reportTransformations();
      });

      Y.one('#pan_down').on('click', function () {
        self.layer.pan(0, panStepVP);
        if (self.labels) {
          self.labels.pan(0, panStepVP);
        }
        self.shadow.pan(0, panStepVP);
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
      self.layer.pan(cn.x - co.x, cn.y - co.y);
      if (self.labels) {
        self.labels.pan(cn.x - co.x, cn.y - co.y);
      }
      self.shadow.pan(cn.x - co.x, cn.y - co.y);

      self.reportTransformations();
    },

    composeSvgViewingTransformation: function (arg) {
      //
      var scale,
          offsetX,
          offsetY,
          minX = 0,
          minY = 0,
          maxX = 0,
          maxY = 0,
          viewportWorldSize,
          viewportWorldOrigin,
          svgMatrix,
          point = Y.ACMACS.newSVGPoint(),
          initialTransformation,
          list = [];

      // Find the bounding box for map points transformed with
      // the initial transformation specified in the daat.
      if (self.data === Y.ACMACS.pointArrayData) {
        initialTransformation = Y.ACMACS.newSVGMatrix({
          a: self.data.transformation[0][0],
          b: self.data.transformation[0][1],
          c: self.data.transformation[1][0],
          d: self.data.transformation[1][1],
          e: 0,
          f: 0
        });
        Y.each(self.data.layout, function (p) {
          var tp;

          point.x = p[0];
          point.y = p[1];
          tp = point.matrixTransform(initialTransformation);

          if (tp.x <= minX) {
            minX = tp.x;
          }
          if (tp.y <= minY) {
            minY = tp.y;
          }
          if (tp.x >= maxX) {
            maxX = tp.x;
          }
          if (tp.y >= maxY) {
            maxY = tp.y;
          }
        });
        viewportWorldSize = [
          1.25 * (maxX - minX),
          1.25 * (maxY - minY)
        ];
        viewportWorldOrigin = [
          (minX + maxX - viewportWorldSize[0]) / 2,
          (minY + maxY - viewportWorldSize[1]) / 2
        ];
      }
      else {
        // starts
        viewportWorldSize = [360, 180];
        viewportWorldOrigin = [0, -90];
      }

      // The scale factor is calculated so that the scaled viewport image can
      // entirely fit within the display area. No assumption of proportionality
      // can be made because it is possible that the stored viewport image
      // was saved in a past session by another viewer with different
      // viewport settings.
      scale = Math.min(
        arg.width / viewportWorldSize[0], arg.height / viewportWorldSize[1]
      );

      // And now it needs to be centred within the current viewport.
      offsetX = (arg.width - scale * viewportWorldSize[0]) / 2;
      offsetY = (arg.height - scale * viewportWorldSize[1]) / 2;

      svgMatrix = Y.ACMACS.newSVGMatrix({
        a: scale,
        b: 0,
        c: 0,
        d: scale,
        e: offsetX - viewportWorldOrigin[0] * scale,
        f: offsetY - viewportWorldOrigin[1] * scale
      });

      list = [
        svgMatrix.a,
        svgMatrix.b,
        svgMatrix.c,
        svgMatrix.d,
        svgMatrix.e,
        svgMatrix.f
      ];

      return {
        matrix: svgMatrix,
        asMatrixString: 'matrix(' + list.join(', ') + ')',
        rotation: Math.atan2(svgMatrix.b, svgMatrix.d) * 360 / (2 * Math.PI)
      };
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
      var t, vp, star, l, node, p;

      function adjustViewport(o, option) {
        var aspect,
        width = o.viewportWorldSize[0],
        height = o.viewportWorldSize[1],
        offsetX = 0,
        offsetY = 0,
        list = [];

        Y.log(o);
        aspect = Math.max(o.width, o.height) / Math.min(o.width, o.height);

        if (o.width > o.height) {
          width *= aspect;
          offsetX = (width - o.viewportWorldSize[0]) / 2;
        }
        if (o.width < o.height) {
          height *= aspect;
          offsetY = (height - o.viewportWorldSize[1]) / 2;
        }

        // And now it needs to be centred within the current viewport.
        if (option === 'without offset') {
          offsetX = offsetY = 0;
        }

        list = [
          o.viewportWorldOrigin[0] - offsetX,
          o.viewportWorldOrigin[1] - offsetY,
          width,
          height
        ];

        return {
          list: list,
          asString: list.join(' ')
        };
      }

      self.data = Y.ACMACS.pointArrayData;
      self.highlightedPoints = [];

      t = self.composeSvgViewingTransformation({
        width: self.layer.get('width'),
        height: self.layer.get('height')
      });

      vp = adjustViewport({
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
      self.shadow.viewportGroup.setAttribute('transform', t.asMatrixString);
      self.shadow.initGroup.setAttribute('transform', 'matrix(1 0 0 -1 0 0)');

      self.shadow.worldGroup.empty();

      node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      node.setAttribute('d', Y.substitute(
        'M {l},{b} L {l},{t} L {r},{t} L {r},{b} L {l},{b}',
        {
          l: vp.list[0],
          b: vp.list[1],
          r: vp.list[0] + vp.list[2],
          t: vp.list[1] + vp.list[3]
        }
      ));
      node.setAttribute('fill-opacity', 0.1);
      node.setAttribute('fill', 'red');
      node.setAttribute('stroke', 'red');
      node.setAttribute('stroke-width', '0.01');
      self.shadow.viewportGroup.append(node);

      Y.log(self.shadow.viewportGroup.getDOMNode().getTransformation());
      Y.log(self.shadow.pivotGroup.getDOMNode().getTransformation());

      Y.one('#stack').setStyle('background', 'white');

      self.shadow.setPixelSize(); // because the points are going to be plotted on the shadow in this test
      self.layer.setPixelSize();
      if (self.labels) {
        self.labels.setPixelSize();
      }

      self.nodeCount = 0;

      // This loop is copied from MapLayer.plot() with adaptations to the raw data format
      Y.each(self.data.styles.drawing_order, function (tranche) {
        Y.each(tranche, function (i) {
          // This test prevents points with undefined co-ordinates from being
          // rendered and consequently from being added to this.pointList. The
          // undefined values in this.pointList are used later to prevent lines
          // from being rendered on the connections layer.
          if (Y.Lang.isNumber(self.data.layout[i][0]) && Y.Lang.isNumber(self.data.layout[i][1])) {
            var style = self.data.styles.styles[self.data.styles.points[i]],
                fillRgba = style.fill_color || '#000000',
                fillColor,
                fillOpacity,
                strokeRgba = style.outline_color || '#000000',
                strokeColor = strokeRgba,
                strokeOpacity,
                arg;

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

            arg = {
              index: i,
              dataIndex: i,
              point: self.data.layout[i],
              size: style.size,
              aspect: style.aspect,
              rotation: style.rotation,
              fill: fillColor,
              fillOpacity: fillOpacity * 0.6,
              stroke: strokeColor,
              strokeOpacity: strokeOpacity * 0.6,
              strokeWidth: style.outline_width
            };

            switch (style.shape) {
            case 'circle':
              break;
            case 'box':
              Y.mix(arg, {
                shape: 'box'
              });
              break;
            case 'path':
              Y.mix(arg, {
                shape: 'path',
                d: style.path
              });
              break;
            case 'star':
              Y.mix(arg, {
                shape: 'star',
                star: style.star
              });
              break;
            default:
              throw new Error("unrecognised shape");
            } // shape switch

            if (self.data.showLabel) {
              if (style.show_label) {
                Y.mix(arg, {
                  label: self.data.pointInfo[i].label_full,
                  labelSize: style.label_size,
                  labelX: style.label_position_x,
                  labelY: style.label_position_y,
                  labelColour: style.label_color || 'black',
                  labelFont: style.label_font
                });
              }

              if (Y.Lang.isObject(arg.labelFont)) {
                arg.labelFont = 'sans-serif';
              }
            }

            if (arg.point[0] === 0 && arg.point[1] === 0) {
              Y.mix(arg, {
                label: 'label text',
                labelSize: 1.0
              });
              self.nodeCount += 1;
            }
            if (arg.point[0] === 1 && arg.point[1] === 0) {
              Y.mix(arg, {
                label: 'label text 2',
                labelSize: 2.0
              });
              self.nodeCount += 1;
            }
            if (arg.point[0] === 0.5 && arg.point[1] === 0.5) {
              Y.mix(arg, {
                label: 'label text 3',
                labelSize: 1.5
              });
              self.nodeCount += 1;
            }

            self.layer.addPoint(arg);
            self.nodeCount += 1;
          } // points with valid co-ordinates
        }, this); // each point in the rendering tranche
      }, this); // each rendering tranche


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

      self.layer.updateIndex();
      Y.log('k-d tree balance factor: ' + self.layer.kdTree.balanceFactor());

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
          start,
          t;

      self.data = Y.ACMACS.stars;
      self.highlightedPoints = [];

      t = self.composeSvgViewingTransformation({
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
      self.shadow.worldGroup.empty();
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

      start = +new Date();

      // self.chunk(chunks, function (chunkNo) {
      self.timedChunk(chunks, function (chunkNo) {
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
            self.layer.addPoint({
              index: self.nodeCount,
              point: [360 - star.RA * 15, star.Dec],
              size: (Math.max(1.5, radius * 6)) / 4,
              fill: fill,
              strokeWidth: 0,
              opacity: 0.6,

              label: star.ProperName,
              labelColour: 'white',
              labelSize: 1.5
            });
          }
          self.nodeCount += 1;
        } // for each star

        //Y.log('chunk ' + chunkNo + ', elapsed: ' + time);
        Y.one('#count_display').setContent(self.nodeCount + ' nodes');

      }, self, function () {
        var
          time;

        self.layer.updateIndex();

        Y.log('done');
        time = (new Date()).getTime() - start;
        Y.log('elapsed: ' + time);
        self.labels.hide();

        // The star map must be plotted upside-down (relative to the SVG
        // co-ordinates). This requires an initial transformation to be applied
        // both to the map layer and to the shadow.
        self.layer.verticalFlip();
        self.shadow.verticalFlip();
        self.reportTransformations();
        Y.log('k-d tree balance factor: ' + self.layer.kdTree.balanceFactor());
      }); // each chunk

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
        o.point.mapObject.highlight('enlarge');
        self.highlightedPoints.push(o.point.mapObject);
      });
    },

    reportTransformations: function () {
      Y.one('#report_layer_trans').setContent('layer:  ' + self.layer.groupDOMNode.getAttribute('transform'));
      Y.one('#report_shadow_trans').setContent(
        'shadow: ' + self.shadow.groupDOMNode.getAttribute('transform') +
        ' (chirality: ' +
        self.shadow.groupDOMNode.getCTM().chirality() +
        ')'
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
    },

    timedChunk: function (items, process, context, callback) {
      var processChunk = function () {
        var start = +new Date();

        do {
          process.call(context, items.shift());
        } while (items.length > 0 && (+new Date() - start < 100));

        if (items.length > 0) {
          Y.later(50, self, processChunk);
        } else {
          callback();
        }
      };
      Y.later(2, self, processChunk);
    }
  };

  Y.mix(self, Y.Base); // for Y.Base.attributeOrProfileSetting();
  Y.ACMACS.GeometryTests = self;
}, '@VERSION@', {requires: ['acmacs-maplayer', 'acmacs-labellayer', 'event-mousewheel', 'event-key', 'node-screen', 'stars', 'point-array', 'pngdecoder', 'transition', 'substitute']});
