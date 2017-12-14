/*global SVGElement: false, SVGGElement: false, SVGCircleElement: false, SVGEllipseElement: false, SVGRectElement: false, HTMLCanvasElement: false */
YUI.add('svg-node-property', function (Y) {

  var suite = new Y.Test.Suite('SVG node property test'),
      DOCUMENT = Y.config.doc,
      E_TEST_COMPLETE = Y.publish('test:complete'),
      E_LAYER_READY = Y.publish('layer:ready'),
      nodePropertyTests;


  nodePropertyTests = new Y.Test.Case({
    name: 'attaching data to nodes',
    layer: null,
    circleFillColour: '#ffc000',
    numberOfNodes: 10000,
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

    'node properties in repeated construction/destruction': function () {
      // As soon as the layer has been created and populated, test the setting
      // of the node properties on it until the desired number of
      // create/destroy cycles has been reached
      Y.on('layer:ready', function (e) {
        var nodeNo = 0,
            start,
            time,
            setTime;

        if (this.count < this.n) {
          this.count += 1;

          start = (new Date()).getTime();
          Y.each(this.layer.groupDOMNode.childNodes, function (el) {
            el.property = nodeNo;
            nodeNo += 1;
          });
          setTime = (new Date()).getTime() - start;

          nodeNo = 0;
          start = (new Date()).getTime();
          Y.each(this.layer.groupDOMNode.childNodes, function (el) {
            if(el.property !== nodeNo) {
              Y.log('property value mismatch for nodeNo = ' + node + ': ' + el.property, 'error');
            }
            nodeNo += 1;
          });
          time = (new Date()).getTime() - start;
          Y.log('run ' + this.count + ': set/get times for property values on ' + nodeNo + ' nodes: ' + setTime + ' ms / ' + time + ' ms', 'info');

          this.layer.destroy();
          Y.later(50, this, this.createLayer); // let the browser breathe
        }
        else {
          Y.fire(E_TEST_COMPLETE);
        }
      }, this);

      Y.on('test:complete', function () {
        this.resume(function () {
          Y.log(Y.substitute('completed {n} cycles', {n: this.count}), 'info');
        });
      }, this);

      this.createLayer();
      this.wait(15000);
    }
  });

  suite.add(nodePropertyTests);

  Y.Test.Runner.add(suite);

}, '@VERSION@', {requires: ['acmacs-layer', 'substitute', 'test']});
