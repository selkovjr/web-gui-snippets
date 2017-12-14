/*global console: false */
YUI.add('kdtree-tests', function (Y) {

  var suite = new Y.Test.Suite('k-d tree'),
      treeCreationTests,
      queryTests,
      starQueryTests,
      nonredundantQueryTests,
      points,
      redundantPoints,
      nearlyRedundantPoints;

  points = [
    {x: 0, y: 0},
    {x: 0, y: 1},
    {x: 1, y: 0},
    {x: 0.5, y: 0.5},
    {x: 1, y: 1},
    {x: 0, y: 0.5},
    {x: 0.5, y: 0},
    {x: 0.5, y: 1}
  ];

  redundantPoints = [
    {x: 0, y: 0},
    {x: 0, y: 1},
    {x: 1, y: 0},
    {x: 0.5, y: 0.5},
    {x: 1, y: 1},
    {x: 0, y: 0.5},
    {x: 0.5, y: 0},
    {x: 0.5, y: 1},

    {x: 0, y: 0},
    {x: 0, y: 1},
    {x: 1, y: 0},
    {x: 0.5, y: 0.5},
    {x: 1, y: 1},
    {x: 0, y: 0.5},
    {x: 0.5, y: 0},
    {x: 0.5, y: 1}
  ];

  nearlyRedundantPoints = [
    {x: 0, y: 0},
    {x: 0, y: 1},
    {x: 1, y: 0},
    {x: 0.5, y: 0.5},
    {x: 1, y: 1},
    {x: 0, y: 0.5},
    {x: 0.5, y: 0},
    {x: 0.5, y: 1},

    {x: 0.01, y: 0.01},
    {x: 0.01, y: 1.01},
    {x: 1.01, y: 0.01},
    {x: 0.51, y: 0.51},
    {x: 1.01, y: 1.01},
    {x: 0.01, y: 0.51},
    {x: 0.51, y: 0.01},
    {x: 0.51, y: 1.01}
  ];


  treeCreationTests = new Y.Test.Case({
    name: 'tree building',

    indexingMetric: function (a, b) {
      return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
    },

    arrayIndexingMetric: function (a, b) {
      return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2);
    },

    'test 1: new()': function () {
      var pointExists = {};

      this.kdTree = new KdTree(points, this.indexingMetric, ['x', 'y']);
      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('x: {x}, y: {y}', this.kdTree.root.obj) === 'x: 0.5, y: 0', 'The object in root.obj must have coordinates x = 0.5 and y = 0');
      Y.assert(this.kdTree.balanceFactor() === 4 / 3, 'Tree balance factor must be equal to 4 / 3');

      Y.one('body').append('<div id="fig-1" />');
      Y.renderTree('#fig-1', this.kdTree.exportGraph(), {title: 'new()', width: 300, height: 100});

      // To make sure the result of this query does not depend on the manner of
      // tree generation (from an array in new() or by insertion):
      Y.each(this.kdTree.nearest({x: -0.5, y: 0.4}, 3), function (o) {
        pointExists[o.point.x + ', ' + o.point.y] = true;
      });
      Y.assert(pointExists['0, 0'], 'Point (0, 0) must exist in the result set');
      Y.assert(pointExists['0, 0.5'], 'Point (0, 0.5) must exist in the result set');
      Y.assert(pointExists['0, 1'], 'Point (0, 1) must exist in the result set');
    },

    'test 2: insert()': function () {
      var pointExists = {};

      this.kdTree = new KdTree([], this.indexingMetric, ['x', 'y']);
      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.assert(this.kdTree.root === null, 'The root property of the new tree must be null.');

      Y.each(points, Y.bind(function (p) {
        this.kdTree.insert(p);
      }, this));

      Y.one('body').append('<div id="fig-2" />');
      Y.renderTree('#fig-2', this.kdTree.exportGraph(), {title: 'insert()', width: 400, height: 160});

      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('x: {x}, y: {y}', this.kdTree.root.obj) === 'x: 0, y: 0', 'The object in root.obj must have coordinates x = 0 and y = 0');
      Y.assert(this.kdTree.balanceFactor() === 2, 'Tree balance factor must be equal to 2');

      // To make sure the result of this query does not depend on the manner of
      // tree generation (from an array in new() or by insertion):
      Y.each(this.kdTree.nearest({x: -0.5, y: 0.4}, 3), function (o) {
        pointExists[o.point.x + ', ' + o.point.y] = true;
      });
      Y.assert(pointExists['0, 0'], 'Point (0, 0) must exist in the result set');
      Y.assert(pointExists['0, 0.5'], 'Point (0, 0.5) must exist in the result set');
      Y.assert(pointExists['0, 1'], 'Point (0, 1) must exist in the result set');
    },

    'test 3: insertUnique(), duplicate data, tolerance = 0.1': function () {
      var result, pointExists = {};

      this.kdTree = new KdTree([], this.indexingMetric, ['x', 'y'], 0.1);
      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.assert(this.kdTree.root === null, 'The root property of the new tree must be null.');
      Y.assert(this.kdTree.tolerance === 0.1, 'The tolerance property of the new tree must be 0.1');

      Y.each(redundantPoints, Y.bind(function (p) {
        this.kdTree.insertUnique(p);
      }, this));

      Y.one('body').append('<div id="fig-3" />');
      Y.renderTree('#fig-3', this.kdTree.exportGraph(), {title: 'insertUnique(); duplicate; tolerance = 0.1', width: 400, height: 160});

      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('x: {x}, y: {y}', this.kdTree.root.obj) === 'x: 0, y: 0', 'The object in root.obj must have coordinates x = 0 and y = 0');
      Y.assert(this.kdTree.balanceFactor() === 1.6666666666666667, 'Tree balance factor must be equal to 1.6666666666666667');

      result = this.kdTree.nearest({x: -0.5, y: 0.4}, 3);
      Y.assert(result.length === 3, 'The result must include exactly three points');
      Y.each(result, function (o) {
        pointExists[o.point.x + ', ' + o.point.y] = true;
      });
      Y.assert(pointExists['0, 0'], 'Point (0, 0) must exist in the result set');
      Y.assert(pointExists['0, 0.5'], 'Point (0, 0.5) must exist in the result set');
      Y.assert(pointExists['0, 1'], 'Point (0, 1) must exist in the result set');
    },

    'test 4: insertUnique(), duplicate data, zero tolerance': function () {
      var result, pointExists = {};

      this.kdTree = new KdTree([], this.indexingMetric, ['x', 'y']);
      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.assert(this.kdTree.root === null, 'The root property of the new tree must be null.');
      Y.assert(this.kdTree.tolerance === 0, 'The tolerance property of the new tree must be 0');

      Y.each(redundantPoints, Y.bind(function (p) {
        this.kdTree.insertUnique(p);
      }, this));

      Y.one('body').append('<div id="fig-4" />');
      Y.renderTree('#fig-4', this.kdTree.exportGraph(), {title: 'insertUnique(); duplicate; tolerance = 0', width: 600, height: 240});

      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('x: {x}, y: {y}', this.kdTree.root.obj) === 'x: 0, y: 0', 'The object in root.obj must have coordinates x = 0 and y = 0');
      Y.assert(this.kdTree.balanceFactor() === 1.75, 'Tree balance factor must be equal to 1.75');

      result = this.kdTree.nearest({x: -0.5, y: 0.4}, 6);
      Y.assert(result.length === 6, 'The result must include exactly six points');

      Y.each(result, function (o) {
        pointExists[o.point.x + ', ' + o.point.y] = true;
      });
      Y.assert(pointExists['0, 0'], 'Point (0, 0) must exist in the result set');
      Y.assert(pointExists['0, 0.5'], 'Point (0, 0.5) must exist in the result set');
      Y.assert(pointExists['0, 1'], 'Point (0, 1) must exist in the result set');
      Y.assert(Y.Object.keys(pointExists).length === 3, 'The result must consist of three unique points');
    },

    'test 5: insertUnique(), quasi duplicate data, zero tolerance': function () {
      var result, pointExists = {};

      this.kdTree = new KdTree([], this.indexingMetric, ['x', 'y']);
      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.assert(this.kdTree.root === null, 'The root property of the new tree must be null.');
      Y.assert(this.kdTree.tolerance === 0, 'The tolerance property of the new tree must be 0');

      Y.each(nearlyRedundantPoints, Y.bind(function (p) {
        this.kdTree.insertUnique(p);
      }, this));

      Y.one('body').append('<div id="fig-5" />');
      Y.renderTree('#fig-5', this.kdTree.exportGraph(), {title: 'insertUnique(); quasi duplicate; tolerance = 0', width: 600, height: 240});

      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('x: {x}, y: {y}', this.kdTree.root.obj) === 'x: 0, y: 0', 'The object in root.obj must have coordinates x = 0 and y = 0');
      Y.assert(this.kdTree.balanceFactor() === 1.75, 'Tree balance factor must be equal to 1.75');

      result = this.kdTree.nearest({x: -0.5, y: 0.4}, 6);
      Y.assert(result.length === 6, 'The result must include exactly six points');

      Y.each(result, function (o) {
        pointExists[o.point.x + ', ' + o.point.y] = true;
      });
      Y.assert(pointExists['0, 0'], 'Point (0, 0) must exist in the result set');
      Y.assert(pointExists['0, 0.5'], 'Point (0, 0.5) must exist in the result set');
      Y.assert(pointExists['0, 1'], 'Point (0, 1) must exist in the result set');
      Y.assert(pointExists['0.01, 0.01'], 'Point (0.01, 0.01) must exist in the result set');
      Y.assert(pointExists['0.01, 0.51'], 'Point (0.01, 0.51) must exist in the result set');
      Y.assert(pointExists['0.01, 1.01'], 'Point (0.01, 1.01) must exist in the result set');
      Y.assert(Y.Object.keys(pointExists).length === 6, 'The result must consist of six unique points');
    },

    'test 6: insertUnique(), quasi duplicate data, tolerance = 0.1': function () {
      var result, pointExists = {};

      this.kdTree = new KdTree([], this.indexingMetric, ['x', 'y'], 0.1);
      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.assert(this.kdTree.root === null, 'The root property of the new tree must be null.');
      Y.assert(this.kdTree.tolerance === 0.1, 'The tolerance property of the new tree must be 0');

      Y.each(nearlyRedundantPoints, Y.bind(function (p) {
        this.kdTree.insertUnique(p);
      }, this));

      Y.one('body').append('<div id="fig-6" />');
      Y.renderTree('#fig-6', this.kdTree.exportGraph(), {title: 'insertUnique(); quasi duplicate; tolerance = 0', width: 600, height: 240});

      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('x: {x}, y: {y}', this.kdTree.root.obj) === 'x: 0, y: 0', 'The object in root.obj must have coordinates x = 0 and y = 0');
      Y.assert(this.kdTree.balanceFactor() === 1.6666666666666667, 'Tree balance factor must be equal to 1.6666666666666667');

      result = this.kdTree.nearest({x: -0.5, y: 0.4}, 3);
      Y.assert(result.length === 3, 'The result must include exactly three points');

      Y.each(result, function (o) {
        pointExists[o.point.x + ', ' + o.point.y] = true;
      });
      Y.assert(pointExists['0, 0'], 'Point (0, 0) must exist in the result set');
      Y.assert(pointExists['0, 0.5'], 'Point (0, 0.5) must exist in the result set');
      Y.assert(pointExists['0, 1'], 'Point (0, 1) must exist in the result set');
      Y.assert(Y.Object.keys(pointExists).length === 3, 'The result must consist of three unique points');
    },

    'test 7: new(stars)': function () {
      var result, pointExists = {}, start = (new Date()).getTime(), time;

      this.kdTree = new KdTree(Y.ACMACS.stars, this.indexingMetric, ['RA', 'Dec']);

      time = (new Date()).getTime() - start;
      Y.log('test 7: tree for stars with the balance factor of ' + this.kdTree.balanceFactor() + ' created with new() in ' + time + ' ms');

      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('RA: {RA}, Dec: {Dec}', this.kdTree.root.obj) === 'RA: 11.61688935, Dec: -61.28344643', 'The object in root.obj must have coordinates RA = 11.61688935 and Dec = -61.28344643');
      Y.assert(this.kdTree.balanceFactor() === 1.0562921822437994, 'Tree balance factor must be equal to 1.0562921822437994');
    },

    'test 8: insert(stars)': function () {
      var result, pointExists = {}, start = (new Date()).getTime(), time;

      this.kdTree = new KdTree([], this.indexingMetric, ['RA', 'Dec']);
      Y.each(Y.ACMACS.stars, Y.bind(function (p) {
        this.kdTree.insert(p);
      }, this));

      time = (new Date()).getTime() - start;
      Y.log('test 8: tree for stars with the balance factor of ' + this.kdTree.balanceFactor() + ' created with insert() in ' + time + ' ms');

      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('RA: {RA}, Dec: {Dec}', this.kdTree.root.obj) === 'RA: 0.01794397, Dec: -48.80985919', 'The object in root.obj must have coordinates RA = 0.01794397 and Dec = -48.80985919');
      Y.assert(this.kdTree.balanceFactor() === 4.062662239399229, 'Tree balance factor must be equal to 4.062662239399229');
    },

    'test 9: insertUnique(), stars, zero tolerance': function () {
      var result, pointExists = {}, start = (new Date()).getTime(), time;

      this.kdTree = new KdTree([], this.indexingMetric, ['RA', 'Dec']);
      Y.each(Y.ACMACS.stars, Y.bind(function (p) {
        this.kdTree.insertUnique(p);
      }, this));

      time = (new Date()).getTime() - start;
      Y.log('test 9: tree for stars with the balance factor of ' + this.kdTree.balanceFactor() + ' created with insert() in ' + time + ' ms');

      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('RA: {RA}, Dec: {Dec}', this.kdTree.root.obj) === 'RA: 0.01794397, Dec: -48.80985919', 'The object in root.obj must have coordinates RA = 0.01794397 and Dec = -48.80985919');
      // This tree grows highly unbalanced because star data are ordered on RA. Loading the data randomly should improve balance.
      Y.assert(this.kdTree.balanceFactor() === 411.7914445855058, 'Tree balance factor must be equal to 411.7914445855058');
    },

    'test 10: insertUnique(), quasi duplicate data, tolerance = 0.1': function () {
      var result, pointExists = {};

      this.kdTree = new KdTree(Y.ACMACS.cdcH1N1Data.layout, this.arrayIndexingMetric, [0, 1]);
      Y.Assert.isInstanceOf(KdTree, this.kdTree, 'An instance of KdTree should have been created.');
      Y.Assert.isInstanceOf(KdNode, this.kdTree.root, 'The root property of the new tree must be a Node instance.');
      Y.assert(Y.substitute('x: {0}, y: {1}', this.kdTree.root.obj) === 'x: 0.5771058225857544, y: -1.2558547054428553', 'The object in root.obj must have coordinates x = 0.5771058225857544 and y = -1.2558547054428553');

      Y.assert(this.kdTree.balanceFactor() >= 1.073 && this.kdTree.balanceFactor() <= 1.074, 'Tree balance factor must be approximately equal to 1.0735');

      // result = this.kdTree.nearest({x: -0.5, y: 0.4}, 3);
      result = this.kdTree.nearest({0: 1.124, 1: 1.775}, 3);
      Y.assert(result.length === 3, 'The result must include exactly three points');

      Y.each(result, function (o) {
        pointExists[o.point[0] + ', ' + o.point[1]] = true;
      });
      Y.assert(pointExists['1.0089820061712427, 1.5800142489525713'], 'Point (1.0089820061712427, 1.5800142489525713) must exist in the result set');
      Y.assert(pointExists['1.2788329694859555, 1.5649016380051546'], 'Point (1.2788329694859555, 1.5649016380051546) must exist in the result set');
      Y.assert(pointExists['1.0917584585427358, 1.9774385792241536'], 'Point (1.0917584585427358, 1.9774385792241536) must exist in the result set');
      Y.assert(Y.Object.keys(pointExists).length === 3, 'The result must consist of three unique points');
    }
  });


  queryTests = new Y.Test.Case({
    name: 'closest neigbour search',

    indexingMetric: function (a, b) {
      return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
    },

    // This function is called once for each test in the suite.
    setUp: function () {
      this.kdTree = new KdTree(points, this.indexingMetric, ['x', 'y']);
    },

    tearDown: function () {
      this.kdTree = undefined;
    },

    'test nearest(-0.5, 0.4, 1)': function () {
      var result;

      result = this.kdTree.nearest({x: -0.5, y: 0.4}, 1);
      Y.assert(result.length === 1, 'The result must include exactly one point');
      Y.assert(result[0].dist === 0.26, 'The distance to the nearest point must be 0.26');
    },

    'test nearest(-0.5, 0.4, 2)': function () {
      var result, pointExists = {};

      result = this.kdTree.nearest({x: -0.5, y: 0.4}, 2);
      Y.each(result, function (o) {
        pointExists[o.point.x + ', ' + o.point.y] = true;
      });
      Y.assert(result.length === 2, 'The result must include exactly two points');
      Y.assert(pointExists['0, 0'], 'Point (0, 0) must exist in the result set');
      Y.assert(pointExists['0, 0.5'], 'Point (0, 0.5) must exist in the result set');
    },

    'test nearest(-0.5, 0.4, 3)': function () {
      var result, pointExists = {};

      result = this.kdTree.nearest({x: -0.5, y: 0.4}, 3);
      Y.each(result, function (o) {
        pointExists[o.point.x + ', ' + o.point.y] = true;
      });
      Y.assert(result.length === 3, 'The result must include exactly three points');
      Y.assert(pointExists['0, 0'], 'Point (0, 0) must exist in the result set');
      Y.assert(pointExists['0, 0.5'], 'Point (0, 0.5) must exist in the result set');
      Y.assert(pointExists['0, 1'], 'Point (0, 1) must exist in the result set');
    }
  });

  starQueryTests = new Y.Test.Case({
    name: 'closest neigbour search among stars',

    indexingMetric: function (a, b) {
      return Math.sqrt(Math.pow(a.RA - b.RA, 2) +  Math.pow(a.Dec - b.Dec, 2));
    },

    // This function is called once for each test in the suite.
    setUp: function () {
      this.kdTree = new KdTree(Y.ACMACS.stars, this.indexingMetric, ['RA', 'Dec']);
    },

    tearDown: function () {
      this.kdTree = undefined;
    },

    'test nearest(Tarazed, 22)': function () {
      var result, pointExists = {};

      result = this.kdTree.nearest({RA: 19.771, Dec: 10.613}, 22); // Tarazed
      Y.each(result, function (o) {
        pointExists[(o.point.ProperName || '') + '(' + o.point.RA + ', ' + o.point.Dec + ')'] = true;
      });
      Y.assert(pointExists['Tarazed(19.77099171, 10.61326869)'], 'Tarazed(19.77099171, 10.61326869) must exist in the result set');
      Y.assert(pointExists['Altair(19.84630057, 8.86738491)'], 'Altair(19.84630057, 8.86738491) must exist in the result set');
      Y.assert(result[15].dist === 0.00026881785692215723, 'Distance to Tarazed must be 0.00026881785692215723');
    },

    'test rangeQuery(the vicinity of Polaris, 1-degree square)': function () {
      var result, pointExists = {};

      result = this.kdTree.rangeQuery({RA: 2, Dec: 89, width: 1, height: 1}); // Tarazed
      Y.each(result, function (o) {
        pointExists[(o.obj.ProperName || '') + '(' + o.obj.RA + ', ' + o.obj.Dec + ')'] = true;
      });
      Y.assert(result.length === 1, 'The result must include exactly one star');
      Y.assert(pointExists['Polaris(2.52974312, 89.26413805)'], 'Polaris(2.52974312, 89.26413805) must exist in the result set');
    },

    'test rangeQuery() over the entire sky)': function () {
      var result;

      result = this.kdTree.rangeQuery({RA: 0, Dec: -90, width: 24, height: 180});
      Y.assert(result.length === 5068, 'The result must include all 5068 stars');
    },

    'test numberOfUniquePoints() over the entire sky; default threshold = 100)': function () {
      var result, start, time;

      start = (new Date()).getTime();
      result = this.kdTree.numberOfUniquePoints({RA: 0, Dec: -90, width: 24, height: 180});
      time = (new Date()).getTime() - start;

      Y.log('test numberOfUniquePoints() over the entire sky; default threshold = 100; run time = ' + time + ' ms');
      Y.assert(result === 100, 'The result must be equal to the default threshold of 100');
    },

    'test numberOfUniquePoints() over the entire sky; no threshold)': function () {
      var result, start, time;

      start = (new Date()).getTime();
      result = this.kdTree.numberOfUniquePoints({RA: 0, Dec: -90, width: 24, height: 180}, 100000);
      time = (new Date()).getTime() - start;

      Y.log('test numberOfUniquePoints() over the entire sky; no threshold; run time = ' + time + ' ms');
      Y.assert(result === 5066, 'The result must be equal to the default threshold of 100');
    }
  });

  nonredundantQueryTests = new Y.Test.Case({
    name: 'the number of unique points in a box',

    arrayIndexingMetric: function (a, b) {
      return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2);
    },

    // This function is called once for each test in the suite.
    setUp: function () {
      this.kdTree = new KdTree(Y.ACMACS.cdcH1N1Data.layout, this.arrayIndexingMetric, [0, 1]);
    },

    tearDown: function () {
      this.kdTree = undefined;
    },

    'test numberOfUniquePoints(); within a 2 x 2-unit box centreed on (-1.2, -0.8)': function () {
      var result;

      result = this.kdTree.numberOfUniquePoints({0: -2.2, 1: -1.8, width: 2, height: 2});
      Y.assert(result === 46, 'there should be 46 unique points within (-1.2 +/- 1, -0.8 +/- 1)');
    },

    'test numberOfUniquePoints(); within a 2 x 2-unit box centreed on (-1.79, -0.3)': function () {
      var result;

      result = this.kdTree.rangeQuery({0: -2, 1: -0.4, width: 0.4, height: 0.2});
      Y.assert(result.length === 7, 'there should be 7 points within (-1.2 +/- 1, -0.8 +/- 1)');

      result = this.kdTree.numberOfUniquePoints({0: -2, 1: -0.4, width: 0.4, height: 0.2});
      Y.assert(result === 4, 'there should be 4 unique points within (-1.2 +/- 1, -0.8 +/- 1)');
    }
  });


  suite.add(treeCreationTests);
  suite.add(queryTests);
  suite.add(starQueryTests);
  suite.add(nonredundantQueryTests);

  Y.Test.Runner.add(suite);

}, '@VERSION@', {requires: ['acmacs-base', 'test', 'substitute']});
