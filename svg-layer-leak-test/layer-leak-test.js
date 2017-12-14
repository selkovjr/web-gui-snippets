/*global SVGElement: false, SVGGElement: false, SVGCircleElement: false, SVGEllipseElement: false, SVGRectElement: false, HTMLCanvasElement: false */
YUI.add('layer-leak-test', function (Y) {

  var suite = new Y.Test.Suite('Y.ACMACS.LayerWidget'),
      DOCUMENT = Y.config.doc,
      E_TEST_COMPLETE = Y.publish('test:complete'),
      E_LAYER_READY = Y.publish('layer:ready'),
      layerFeatureTests,
      layerDestructionTests;


  function round(arg) {
    return Math.round(parseFloat(arg) * 1000000) / 1000000;
  }

  layerFeatureTests = new Y.Test.Case({
    name: 'Layer creation and shape properties',
    layer: null,
    circleFillColour: '#ffc000',
    boxFillColour: '#00c0ff',

    'test render()': function () {
      Y.one('#testbed').empty();
      Y.one('#testbed').setContent('<div style="position:absolute;float: left;width:500px;height:500px" id="graphiccontainer"></div>');
      var layer;

      layer = new Y.ACMACS.LayerWidget({
        instanceName: 'test',
        width: 500,
        height: 500
      }).render(Y.one('#graphiccontainer'));

      layer.on('init', function (e) {
        Y.Assert.isInstanceOf(SVGSVGElement, Y.Node.getDOMNode(layer.canvas), "An SVG canvas should exist.");
        Y.Assert.isInstanceOf(SVGGElement, Y.Node.getDOMNode(layer.canvas.one('g')), "An SVG group should exist.");
      });

      this.layer = layer;
      this.layer.groupDOMNode.setAttribute('transform', 'matrix(500, 0, 0, 500, 0, 0 )');
      this.layer.setPixelSize();
    },

    'test addPoint()': function () {
      var circle = this.layer.addPoint({
        point: [0.25, 0.25],
        size: 10,
        fill: this.circleFillColour,
        opacity: 0.66,
        label: 'label text',
        labelSize: 1.0
      });

      this.circle = circle;
      Y.Assert.isInstanceOf(SVGCircleElement, circle, "An SVG circle element should exist.");
    },

    'test circle fill colour': function () {
      var node = this.circle;
      Y.assert(node.getAttribute('fill') === this.circleFillColour);
    },

    'test circle fill opacity': function () {
      var node = this.circle;
      Y.assert(node.getAttribute('fill-opacity') === '0.66');
    },

    'test circle stroke colour': function () {
      var node = this.circle;
      Y.assert(node.getAttribute('stroke') === 'black');
    },

    'test circle stroke opacity': function () {
      var node = this.circle;
      Y.assert(node.getAttribute('stroke-opacity') === '0.66');
    },

    'test circle stroke width': function () {
      var node = this.circle;
      Y.assert(round(node.getAttribute('stroke-width')) === round(1 / 500));
    },

    'test addPoint(aspect)': function () {
      var ellipse = this.layer.addPoint({
        point: [0.6, 0.5],
        size: 10,
        aspect: 0.5,
        rotation: -15,
        fill: '#ffc000',
        stroke: 'black',
        opacity: 0.66
      });

      this.ellipse = ellipse;
      Y.Assert.isInstanceOf(SVGEllipseElement, ellipse, "An SVG ellipse element should exist.");
    },

    'test ellipse transform attribute': function () {
      var node = this.ellipse;
      Y.assert(node.getAttribute('transform').match(/rotate\(-15,? 0\.6,? 0\.5\)/));
    },

    "test addPoint(shape: 'box')": function () {
      var box = this.layer.addPoint({
        shape: 'box',
        point: [0.4, 0.4],
        size: 12,
        fill: '#6060d0',
        stroke: 'black',
        fillOpacity: 0.66,
        rotation: 30
      });

      this.box = box;
      Y.Assert.isInstanceOf(SVGRectElement, box, "An SVG rectangle element should exist.");
    },

    'test box positioning': function () {
      var node = this.box;
      Y.assert(round(node.getAttribute('width')) === round(5 * 12 / 500), "The node's width must be equal to 0.12");
      Y.assert(round(node.getAttribute('height')) === round(5 * 12 / 500), "The node's height must be equal to 0.2");
      Y.assert(round(node.getAttribute('x')) === round(0.34), "The node's x attribute must be equal to 0.34");
      Y.assert(round(node.getAttribute('y')) === round(0.34), "The node's y attribute must be equal to 0.34");
    },

    'test box transform attribute': function () {
      var node = this.box;
      Y.assert(node.getAttribute('transform').match(/rotate\(30,? 0\.4,? 0\.4\)/));
    },

    'test clear()': function () {
      this.layer.clear();
      Y.assert(!this.layer.canvas.one('g').hasChildNodes());
    },

    'test addPoint() after clear()': function () {
      var circle = this.layer.addPoint({
        point: [0.25, 0.25],
        size: 10,
        fill: this.circleFillColour,
        opacity: 0.66
      });

      this.circle = circle;
      Y.Assert.isInstanceOf(SVGCircleElement, circle);
    },

    'test shape destruction': function () {
      Y.one(this.circle).remove().destroy();
      Y.assert(!this.layer.canvas.one('g').hasChildNodes());
    },

    'test empty layer destruction': function () {
      this.layer.destroy();
      Y.assert(!Y.one('.yui3-acmacslayerwidget'));
    }
  });


  layerDestructionTests = new Y.Test.Case({
    name: 'Layer creation and destruction',
    layer: null,
    circleFillColour: '#ffc000',
    numberOfNodes: 1000,
    n: 5,
    count: 0,

    setUp: function () {
      Y.one('#testbed').empty();
      Y.one('#testbed').setContent('<div style="float: left; width:500px; height:500px" id="graphiccontainer"></div>');
    },

    createLayer: function () {
      var layer,
          i;

      layer = new Y.ACMACS.LayerWidget({
        name: 'test',
        width: 500,
        height: 500
      }).render(Y.one('#graphiccontainer'));

      this.layer = layer;
      this.layer.groupDOMNode.setAttribute('transform', 'matrix(500, 0, 0, 500, 0, 0 )');
      this.layer.setPixelSize();

      layer.on('init', function (e) {
        var x, y, s, circle;
        for (i = 0; i < this.numberOfNodes; i += 1) {
          x = 0.1 + Math.random() * 0.8;
          y = 0.1 + Math.random() * 0.8;
          s = 2 + 10 * Math.random();
          circle = this.layer.addPoint({
            point: [x, y],
            size: s,
            fill: this.circleFillColour,
            opacity: 0.66
          });
        }
        Y.fire(E_LAYER_READY);
      }, this);
    },

    'test repeated construction/destruction': function () {
      // Destroy the layer as soon as it is ready and populated, until the
      // desired number of create/destroy cycles has been reached
      Y.on('layer:ready', function (e) {
        if (this.count < this.n) {
          this.count += 1;
          this.layer.destroy();
          Y.later(50, this, this.createLayer); // let the browser breathe
        }
        else {
          Y.fire(E_TEST_COMPLETE);
        }
      }, this);

      Y.on('test:complete', function () {
        this.resume(function () {
          Y.Assert.isInstanceOf(Y.ACMACS.LayerWidget, this.layer, 'should have left the last layer instance intact');
          Y.assert(
            this.layer.numberOfNodes() === this.numberOfNodes,
            Y.substitute('the SVG canvans should contain {n} nodes', {n: this.numberOfNodes})
          );
        });

        Y.log(Y.substitute('completed {n} cycles', {n: this.count}), 'info');
        Y.one('#testbed').append(
          Y.substitute(
            '<div style="text-align: center">Completed {n} new/destroy cycles.</div>',
            {n: this.count}
          )
        );
        Y.one('#testbed').append(
          Y.substitute(
            '<div style="text-align: center">The SVG canvas contains {n} nodes.</div>',
            {n: this.layer.numberOfNodes()}
          )
        );
        Y.one('#testbed').append(
          '<div style="text-align: center"><button id="delete">Delete all</button></div>'
        );

        Y.one('#delete').on('click', function (e) {
          this.layer.destroy();
          Y.one('#testbed').remove(true);
        }, this);
      }, this);

      this.createLayer();
      this.wait(15000);
    }

  });

  suite.add(layerFeatureTests);
  suite.add(layerDestructionTests);

  Y.Test.Runner.add(suite);

}, '@VERSION@', {requires: ['acmacs-layerstack', 'acmacs-layer', 'acmacs-background', 'substitute', 'test']});
