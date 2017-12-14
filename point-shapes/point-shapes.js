/*global document: false, SVGElement: false, SVGCircleElement: false, SVGEllipseElement: false, SVGRectElement: false */
YUI.add('point-shape-tests', function (Y) {
  var self;

  Y.namespace('ACMACS');

  // This object emulates LayerStack
  self = {
    layer: null,
    currentZoomLevel: 0,
    nodeCount: 0,
    operation: null,

    setUp: function () {
      var map, layer, t;

      Y.one('body').append('<div style="position:absolute; top: 2em; left: 0" id="testbed"></div>');
      Y.one('#testbed').setContent('<div style="float: left; width:800px; height:1100px" id="graphiccontainer"></div>');
      Y.one('#testbed').append('<div style="float: left; padding-left: 0.5em;" id="controls"></div>');

      map = new Y.ACMACS.MapWidget({});

      layer = new Y.ACMACS.LayerWidget({
        name: 'test',
        render: '#graphiccontainer',
        width: '800px',
        height: '1100px',
        stack: self
      });

      t = map.composeSvgViewingTransformation({
        data: {
          transformation: [[1, 0], [0, 1]],
          layout: [
            [60, 100],
            [160, 220]
          ]
        },
        width: parseInt(layer.get('width').split("px")[0], 10),
        height: parseInt(layer.get('height').split("px")[0], 10)
      });

      layer.groupDOMNode.setAttribute('transform', t.asMatrixString);
      layer.setPixelSize();
      layer.canvas.setStyle('background', 'transparent');

      layer.on('init', function (e) {
        self.layer = layer;
        self.iterateNodeProperties();
      });

    },

    // This function emulates LayerStack.get()
    get: function (param) {
      var data = {
        zoomLimits: [-10, 100],
        width: '800px',
        height: '600px'
      };
      return data[param];
    },

    renderText: function (x, y, text) {
      var node = document.createElementNS('http://www.w3.org/2000/svg', 'text');

      node.setAttribute('x', x);
      node.setAttribute('y', y);
      node.setAttribute('font-size', 3);
      node.appendChild(document.createTextNode(text));
      self.layer.groupDOMNode.appendChild(node);
      return node;
    },

    iterateNodeProperties: function () {
      var offset = 30,
          textOffset = 5,
          rh = 7,
          i, r, g, b,
          node,
          starOptions,
          optionsTemplate = Y.Template.Micro.compile(
            'star: {<%= Y.Array.map(Y.Object.keys(data.options).sort(), function (key) {return key + ": " + data.options[key]}).join(", ") %>}'
          );

      self.renderText(textOffset, 4, 'default point:');
      self.layer.addPoint({
        point: [offset, 3],
        size: 3
      });

      self.renderText(textOffset, rh + 4, 'default circle:');
      self.layer.addPoint({
        shape: 'circular',
        point: [offset, rh + 3],
        size: 3
      });

      self.renderText(textOffset, 2 * rh + 4, 'default box:');
      self.layer.addPoint({
        shape: 'box',
        point: [offset, 2 * rh + 3],
        size: 3
      });

      self.renderText(textOffset, 3 * rh + 4, 'fill:');
      for (i = 0; i < 16; i += 1) {
        r = 128 + 8 * i;
        b = 255 - 8 * i;
        g = 128 + 4 * i;
        self.layer.addPoint({
          point: [offset + i * 7, 3 * rh + 3],
          size: 4,
          fill: '#' + r.toString(16) + g.toString(16) + b.toString(16),
          strokeFill: 'black',
          strokeWidth: 0
        });
      }

      self.renderText(textOffset, 4 * rh + 4, 'stroke:');
      for (i = 0; i < 16; i += 1) {
        r = 128 + 8 * i;
        b = 255 - 8 * i;
        g = 128 + 4 * i;
        self.layer.addPoint({
          point: [offset + i * 7, 4 * rh + 3],
          size: 4,
          stroke: '#' + b.toString(16) + g.toString(16) + r.toString(16),
          strokeWidth: 1.5,
          fillOpacity: 0
        });
      }

      self.renderText(textOffset, 5 * rh + 4, 'fillOpacity:');
      for (i = 0; i < 16; i += 1) {
        self.layer.addPoint({
          shape: 'box',
          point: [offset + i * 7, 5 * rh + 3],
          size: 4,
          fill: 'black',
          stroke: 'black',
          strokeWidth: 0.5,
          fillOpacity: i / 15
        });
      }

      self.renderText(textOffset, 6 * rh + 4, 'strokeOpacity:');
      for (i = 0; i < 16; i += 1) {
        self.layer.addPoint({
          shape: 'box',
          point: [offset + i * 7, 6 * rh + 3],
          size: 3,
          fill: '#C0C0C0',
          stroke: '#4040FF',
          strokeOpacity: i / 15,
          strokeWidth: 2
        });
      }

      self.renderText(textOffset, 7 * rh + 4, 'opacity:');
      for (i = 0; i < 16; i += 1) {
        self.layer.addPoint({
          shape: 'box',
          point: [offset + i * 7, 7 * rh + 3],
          size: 3,
          fill: '#C0C0C0',
          stroke: '#4040FF',
          opacity: i / 15,
          strokeWidth: 2
        });
      }

      self.renderText(textOffset, 8 * rh + 4, 'strokeWidth:');
      for (i = 0; i < 16; i += 1) {
        self.layer.addPoint({
          point: [offset + i * 7, 8 * rh + 3],
          size: 3,
          fill: 'goldenrod',
          stroke: 'black',
          strokeWidth: 2 * (i / 15)
        });
      }

      self.renderText(textOffset, 9 * rh + 4, 'aspect:');
      for (i = 0; i < 9; i += 1) {
        self.layer.addPoint({
          point: [offset + i * 16, 9 * rh + 10],
          size: 10,
          stroke: 'black',
          aspect: 0.5 + 0.125 * i
        });
        node = self.renderText(offset + 0.2 + i * 16, 9 * rh + 11, (0.5 + 0.125 * i).toString(10));
        Y.one(node).setStyle('textAnchor', 'middle');
      }
      for (i = 0; i < 9; i += 1) {
        self.layer.addPoint({
          shape: 'box',
          point: [offset + i * 16, 11 * rh + 10],
          size: 8,
          stroke: 'black',
          aspect: 1.5 - 0.125 * i
        });
        node = self.renderText(offset + 0.2 + i * 16, 11 * rh + 11, (1.5 - 0.125 * i).toString(10));
        Y.one(node).setStyle('textAnchor', 'middle');
      }

      self.renderText(textOffset, 13.5 * rh + 4, 'rotation:');
      for (i = 0; i < 9; i += 1) {
        self.layer.addPoint({
          point: [offset + i * 16, 13.5 * rh + 10],
          size: 8,
          stroke: 'black',
          aspect: 0.5,
          rotation: -180 + 45 * i
        });
        node = self.renderText(offset + 0.2 + i * 16, 13.5 * rh + 11, (-180 + 45 * i).toString(10));
        Y.one(node).setStyle('textAnchor', 'middle');
      }
      for (i = 0; i < 9; i += 1) {
        self.layer.addPoint({
          shape: 'box',
          point: [offset + i * 16, 15.5 * rh + 10],
          size: 8,
          stroke: 'black',
          aspect: 2,
          rotation: -180 + 45 * i
        });
        node = self.renderText(offset + 0.2 + i * 16, 15.5 * rh + 11, (-180 + 45 * i).toString(10));
        Y.one(node).setStyle('textAnchor', 'middle');
      }
      for (i = 0; i < 17; i += 1) {
        self.layer.addPoint({
          shape: 'box',
          point: [offset + i * 8, 17.5 * rh + 10],
          size: 6,
          stroke: 'black',
          rotation: -180 + 22.5 * i
        });
      }

      starOptions = {
        arg1: 0,
        arg2: 0.2,
        corners: '[2 .. 8]',
        proportion: 0.6,
        rotation: 0,
        rounded: 0.4,
        size: 1
      };

      self.renderText(textOffset + 0.2, 20 * rh + 4, optionsTemplate({options: starOptions}));
      for (i = 2; i < 9; i += 1) {
        starOptions.corners = i;
        self.layer.addPoint({
          shape: 'star',
          point: [offset + i * 16, 20.2 * rh + 10],
          size: 8,
          stroke: 'black',
          aspect: 1,
          rotation: 0,
          star: starOptions
        });
        node = self.renderText(offset + 0.2 + i * 16, 20.2 * rh + 11, i.toString(10));
        Y.one(node).setStyle('textAnchor', 'middle');
      }

      starOptions.flatsided = true;
      delete starOptions.proportion;
      starOptions.rounded = 0.1;
      starOptions.corners = '[2 .. 8]';
      starOptions.arg1 = 0.0;
      delete starOptions.arg2;
      self.renderText(textOffset + 0.2, 22.7 * rh + 4, optionsTemplate({options: starOptions}));
      for (i = 2; i < 9; i += 1) {
        starOptions.corners = i;
        self.layer.addPoint({
          shape: 'star',
          point: [offset + i * 16, 23.0 * rh + 10],
          size: 8,
          stroke: 'black',
          aspect: 1,
          rotation: 0,
          star: starOptions
        });
        node = self.renderText(offset + 0.2 + i * 16, 23.0 * rh + 11, i.toString(10));
        Y.one(node).setStyle('textAnchor', 'middle');
      }

      delete starOptions.flatsided;
      starOptions.arg1 = 0.0;
      starOptions.arg2 = '[0 .. 8] * 0.157';
      starOptions.proportion = 0.6;
      starOptions.rounded = 0;
      starOptions.corners = 5;
      self.renderText(textOffset + 0.2, 25.5 * rh + 4, optionsTemplate({options: starOptions}));
      for (i = 0; i < 9; i += 1) {
        starOptions.arg2 = i * 0.15;
        self.layer.addPoint({
          shape: 'star',
          point: [offset + i * 16, 25.7 * rh + 10],
          size: 8,
          stroke: 'grey',
          strokeWidth: 0.25,
          aspect: 1,
          rotation: 0,
          star: starOptions
        });
        node = self.renderText(offset + 0.2 + i * 16, 25.7 * rh + 11, i.toString(10));
        Y.one(node).setStyle('textAnchor', 'middle');
      }

      delete starOptions.flatsided;
      starOptions.arg1 = 0.0;
      starOptions.arg2 = 0.628;
      starOptions.proportion = 0.5;
      starOptions.corners = 5;
      starOptions.size = 1.4;
      starOptions.rounded = '[0 .. 8] * 0.25';
      self.renderText(textOffset + 0.2, 28.2 * rh + 4, optionsTemplate({options: starOptions}));
      for (i = 0; i < 9; i += 1) {
        starOptions.rounded = i * 0.25;
        self.layer.addPoint({
          shape: 'star',
          point: [offset + i * 16, 28.7 * rh + 10],
          size: 8,
          stroke: 'grey',
          strokeWidth: 0.4,
          fill: 'wheat',
          aspect: 1,
          rotation: 0,
          star: starOptions
        });
        node = self.renderText(offset + 0.2 + i * 16, 28.7 * rh + 11, i.toString(10));
        Y.one(node).setStyle('textAnchor', 'middle');
      }

      delete starOptions.flatsided;
      starOptions.arg1 = -0.53;
      starOptions.arg2 = 0.53;
      starOptions.proportion = -1;
      starOptions.corners = 5;
      starOptions.size = 1.4;
      starOptions.rounded = '[0 .. 8] * 0.025';
      self.renderText(textOffset + 0.2, 31.5 * rh + 4, optionsTemplate({options: starOptions}));
      for (i = 0; i < 9; i += 1) {
        starOptions.rounded = i * 0.025;
        self.layer.addPoint({
          shape: 'star',
          point: [offset + i * 16, 32 * rh + 10],
          size: 8,
          stroke: 'grey',
          strokeWidth: 0.4,
          fill: 'lavender',
          aspect: 1,
          rotation: 0,
          star: starOptions
        });
        // node = self.renderText(offset + 0.2 + i * 16, 32 * rh + 11, i.toString(10));
        // Y.one(node).setStyle('textAnchor', 'middle');
      }
    }
  };

  Y.ACMACS.NodeTests = self;
}, '@VERSION@', {requires: ['acmacs-map', 'node-screen', 'substitute', 'array-extras', 'template-micro']});
