YUI.add('kd-tree', function(Y) {
/*global SVGMatrix: false, Y: false */

/**
 * A k-d tree <a href="https://github.com/ubilabs/kd-tree-javascript">acquired from Ubilabs</a>
 *
 * @module acmacs-base
 * @submodule kdtree
 */

/**
 * kd-Tree index node
 *
 * @class KdNode
 * @constructor
 */
Y.namespace('KdNode');

/**
 * kd-Tree node constructor
 *
 * @method KdNode
 * @param {Object} obj Object to place at this node
 * @param {String|Integer} d Dimension index
 * @param {KdNode} parent Parent node
 */
Y.KdNode = function (obj, d, parent) {
  this.obj = obj;
  this.left = null;
  this.right = null;
  this.parent = parent;
  this.dimension = d;
};

/**
 * kd-Tree index
 *
 * @class KdTree
 * @constructor
 */
Y.namespace('KdTree');

/**
 * kd-Tree index constructor
 *
 * @method KdTree
 * @param {Array} points The list of objects to index. The points must
 * have geometric properties specified in the `dimensions` argument.
 * @param {Function} metric The metric function used to calculate
 * distances between points
 * @param {String|Integer} dimensions The list of geometric property names
 * in each point object (_e.g._, `['x', 'y']` or `['RA', 'Dec']`)
 * @param {Number} tolerance An index compression parameter indicating how
 * close the points must be in order to be placed in the same bin. Greater
 * tolerance results in more points per bin.
 */
Y.KdTree = function (points, metric, dimensions, tolerance) {
  var self = this;

  this.dimensions = dimensions;
  this.tolerance = tolerance === undefined ? 0 : tolerance;

  // Binary heap implementation from:
  // http://eloquentjavascript.net/appendix2.html
  function BinaryHeap(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  }

  BinaryHeap.prototype = {
    push: function (element) {
      this.content.push(element);
      this.bubbleUp(this.content.length - 1);
    },

    pop: function () {
      var result = this.content[0],
          end = this.content.pop();

      if (this.content.length > 0) {
        this.content[0] = end;
        this.sinkDown(0);
      }
      return result;
    },

    peek: function () {
      return this.content[0];
    },

    remove: function (node) {
      var len = this.content.length,
          i,
          end;

      for (i = 0; i < len; i += 1) {
        if (this.content[i] === node) {
          end = this.content.pop();
          if (i !== len - 1) {
            this.content[i] = end;
            if (this.scoreFunction(end) < this.scoreFunction(node)) {
              this.bubbleUp(i);
            }
            else {
              this.sinkDown(i);
            }
          }
          return;
        }
      }
      throw new Error("Node not found.");
    },

    size: function () {
      return this.content.length;
    },

    bubbleUp: function (n) {
      var element = this.content[n],
          parent,
          parentN;

      while (n > 0) {
        parentN = Math.floor((n + 1) / 2) - 1;
        parent = this.content[parentN];
        if (this.scoreFunction(element) < this.scoreFunction(parent)) {
          this.content[parentN] = element;
          this.content[n] = parent;
          n = parentN;
        }
        else {
          break;
        }
      }
    },

    sinkDown: function (n) {
      var length = this.content.length,
          element = this.content[n],
          elemScore = this.scoreFunction(element),
          child1,
          child2,
          child1N,
          child2N,
          child1Score,
          child2Score,
          swap;

      while (true) {
        child2N = (n + 1) * 2;
        child1N = child2N - 1;
        swap = null;
        if (child1N < length) {
          child1 = this.content[child1N];
          child1Score = this.scoreFunction(child1);
          if (child1Score < elemScore) {
            swap = child1N;
          }
        }
        if (child2N < length) {
          child2 = this.content[child2N];
          child2Score = this.scoreFunction(child2);
          if (child2Score < (swap === null ? elemScore : child1Score)) {
            swap = child2N;
          }
        }

        if (swap !== null) {
          this.content[n] = this.content[swap];
          this.content[swap] = element;
          n = swap;
        }
        else {
          break;
        }
      }
    }
  }; // BinaryHeap


  // ------------------------ kd-tree starts here ---------------------

  /**
   * A recursive index-making method
   *
   * @method buildTree
   * @private
   * @param {Array} points Point objects to be indexed
   * @param {Integer} depth Recursion depth.
   *
   * This argument is only needed as a means to alternate between
   * dimensions (or cycle through them when more than two exist).
   * @return KdNode
   */
  function buildTree(points, depth, parent) {
    var dim = depth % dimensions.length,
        median,
        node;

    if (points.length === 0) {
      return null;
    }
    if (points.length === 1) {
      return new Y.KdNode(points[0], dim, parent);
    }

    points.sort(function (a, b) {
      return a[dimensions[dim]] - b[dimensions[dim]];
    });

    median = Math.floor(points.length / 2);
    node = new Y.KdNode(points[median], dim, parent);
    node.left = buildTree(points.slice(0, median), depth + 1, node);
    node.right = buildTree(points.slice(median + 1), depth + 1, node);
    return node;
  }

  /**
   * The root node
   *
   * @property root
   * @private
   */
  this.root = buildTree(points, 0, null);


  /**
   * Add a new point to the index.
   *
   * @method insert
   * @param {Object} point The object to be indexed. It must have geometric
   * properties defined in constructor's `dimensions` argument.
   * @return KdNode
   */
  this.insert = function (point) {
    function innerSearch(node, parent) {

      if (node === null) {
        return parent;
      }

      var dimension = dimensions[node.dimension];
      if (point[dimension] < node.obj[dimension]) {
        return innerSearch(node.left, node);
      }
      return innerSearch(node.right, node);
    }

    var insertPosition = innerSearch(self.root, null),
        newNode,
        dimension;

    if (insertPosition === null) {
      self.root = new Y.KdNode(point, 0, null);
      return;
    }

    newNode = new Y.KdNode(point, (insertPosition.dimension + 1) % dimensions.length, insertPosition);
    dimension = dimensions[insertPosition.dimension];

    if (point[dimension] < insertPosition.obj[dimension]) {
      insertPosition.left = newNode;
    } else {
      insertPosition.right = newNode;
    }
  }; // insert()


  /**
   * Add a new point to the index, if it is not there already. Return the new
   * index if no pre-existing point is found, or the index node of the existing
   * point.
   *
   * @method insertUnique
   * @private
   * @param {Object} p Point object defined by geometric dimensions specified
   * in `KdTree` constructor
   * @return KdNode
   */
  this.insertUnique = function (p) {
    if (self.root === null) {
      self.root = new Y.KdNode(p, 0, null);
      return self.root;
    }

    var currentNode = self.root, // the node to return if similar to p
        parentNode = self.root,
        isOddLevel = true,
        isLessThan = true,
        node,
        nodeName,
        parentName;

    // Check the new point for similarity to root, because it is not touched by
    // the traversal routine below.
    if (metric(p, currentNode.obj) < self.tolerance) {
      if (currentNode.similar) {
        currentNode.similar.push(p);
      }
      else {
        currentNode.similar = [p];
      }
      return currentNode;
    }

    // traverse the tree first cutting the plane left-right then top-bottom
    while (currentNode) {
      if (isOddLevel) {
        isLessThan = p.x < currentNode.obj.x;
      } else {
        isLessThan = p.y < currentNode.obj.y;
      }
      parentNode = currentNode;
      parentName = parentNode.obj.x + ', ' + parentNode.obj.y;
      if (isLessThan) {
        currentNode = currentNode.left;
      } else {
        currentNode = currentNode.right;
      }

      if (currentNode) {
        // check if point is already in tree (up to tolerance) and if so simply
        // return existing node
        if (metric(p, currentNode.obj) < self.tolerance) {
          if (currentNode.similar) {
            currentNode.similar.push(p);
          }
          else {
            currentNode.similar = [p];
          }
          return currentNode;
        }
      }
      isOddLevel = !isOddLevel;
    }

    // no node found, add new leaf node to tree
    node = new Y.KdNode(p, isOddLevel ? 1 : 0, parentNode);
    nodeName = p.x + ', ' + p.y;
    node.left = node.right = null;
    if (isLessThan) {
      parentNode.left = node;
    } else {
      parentNode.right = node;
    }
    return node;
  }; // insertUnique()


  /**
   * Find up to `maxNodes` points in the vicinity of `point` limited by
   * `maxDistance`.
   *
   * @method nearest
   * @param {Object} point The query point
   * @param {Integer} maxNodes The maximum number of points to return
   * @param {Float} maxDistance The radius of the circle to search
   * @return {Array} The list of KdNodes found
   */
  this.nearest = function (point, maxNodes, maxDistance) {
    var i,
        result,
        bestNodes = new BinaryHeap(
          function (e) {
            return -e[1];
          }
        );

    function nearestSearch(node) {
      var bestChild,
          dimension = dimensions[node.dimension],
          ownDistance = metric(point, node.obj),
          linearPoint = {},
          linearDistance,
          otherChild,
          i;

      function saveNode(node, distance) {
        bestNodes.push([node, distance]);
        if (bestNodes.size() > maxNodes) {
          bestNodes.pop();
        }
      }

      for (i = 0; i < dimensions.length; i += 1) {
        if (i === node.dimension) {
          linearPoint[dimensions[i]] = point[dimensions[i]];
        }
        else {
          linearPoint[dimensions[i]] = node.obj[dimensions[i]];
        }
      }
      linearDistance = metric(linearPoint, node.obj);

      if (node.right === null && node.left === null) {
        if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
          saveNode(node, ownDistance);
        }
        return;
      }

      if (node.right === null) {
        bestChild = node.left;
      }
      else if (node.left === null) {
        bestChild = node.right;
      }
      else {
        if (point[dimension] < node.obj[dimension]) {
          bestChild = node.left;
        }
        else {
          bestChild = node.right;
        }
      }

      nearestSearch(bestChild);

      if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
        saveNode(node, ownDistance);
      }

      if (bestNodes.size() < maxNodes || Math.abs(linearDistance) < bestNodes.peek()[1]) {
        if (bestChild === node.left) {
          otherChild = node.right;
        }
        else {
          otherChild = node.left;
        }
        if (otherChild !== null) {
          nearestSearch(otherChild);
        }
      }
    } // nearestSearch()

    if (maxDistance) {
      for (i = 0; i < maxNodes; i += 1) {
        bestNodes.push([null, maxDistance]);
      }
    }

    nearestSearch(self.root);

    result = [];
    for (i = 0; i < maxNodes; i += 1) {
      if (bestNodes.content[i][0]) {
        result.push({point: bestNodes.content[i][0].obj, dist: bestNodes.content[i][1]});
      }
    }
    return result;
  }; // this.nearest()


  /**
   * Return the tree's aspect ratio. The ideal value is 1.0; the larger the
   * value, the less balanced the tree.
   *
   * @method balanceFactor
   * @return Number
   */
  this.balanceFactor = function () {
    function height(node) {
      if (node === null) {
        return 0;
      }
      return Math.max(height(node.left), height(node.right)) + 1;
    }

    function count(node) {
      if (node === null) {
        return 0;
      }
      return count(node.left) + count(node.right) + 1;
    }

    return height(self.root) / (Math.log(count(self.root)) / Math.log(2));
  };


  // The following methods were adapted from jsts
  // (https://github.com/bjornharrtell/jsts/tree/master/src/jsts/index/kdtree)


  /**
   * Index tree iterator for range queries
   *
   * _This method only works with two-dimensional trees!_
   *
   * @method queryNode
   * @private
   * @param {KdNode} currentNode The current node
   * @param {Object} queryBox The query envelope object. Its bottom left
   * corner must be defined in terms of geometric dimensions supplied
   * to the `KdTree` constructor. The opposite corner is defined using
   * the `width` and `height` properties, with `width` corresponding
   * to the odd dimension and `height` to the even one.
   * @param {Boolean} odd True if the current index level (alternating between dimensions) is odd.
   * @param {Array} result The array to fill with search results
   */
  this.queryNode = function (currentNode, queryBox, odd, result) {
    if (currentNode === null) {
      return;
    }

    var min, max, discriminant, searchLeft, searchRight;

    if (odd) {
      min = queryBox[dimensions[0]];
      max = queryBox[dimensions[0]] + queryBox.width;
      discriminant = currentNode.obj[dimensions[0]];
    } else {
      min = queryBox[dimensions[1]];
      max = queryBox[dimensions[1]] + queryBox.height;
      discriminant = currentNode.obj[dimensions[1]];
    }

    searchLeft = min < discriminant;
    searchRight = discriminant <= max;

    if (searchLeft) {
      this.queryNode(currentNode.left, queryBox, !odd, result);
    }

    // if (queryBox.contains(currentNode.getCoordinate())) {
    if (
      queryBox[dimensions[0]] <= currentNode.obj[dimensions[0]] &&
        currentNode.obj[dimensions[0]] <= queryBox[dimensions[0]] + queryBox.width &&
          queryBox[dimensions[1]] < currentNode.obj[dimensions[1]] &&
            currentNode.obj[dimensions[1]] <= queryBox[dimensions[1]] + queryBox.height) {
      result.push(currentNode);
    }

    if (searchRight) {
      this.queryNode(currentNode.right, queryBox, !odd, result);
    }
  };


  /**
   * Find all points encompassed by the query box. This method is the public
   * wrapper around `queryNode()`.
   *
   * @method rangeQuery
   * @param {Object} queryBox The query envelope object. Its bottom left
   * corner must be defined in terms of geometric dimensions supplied
   * to the `KdTree` constructor. The opposite corner is defined using
   * the `width` and `height` properties, with `width` corresponding
   * to the odd dimension and `height` to the even one.
   * @return {Array} The list of KdNodes found
   * @example
      result = this.kdTree.rangeQuery({RA: 2, Dec: 89, width: 1, height: 1}); // Tarazed
   */
  this.rangeQuery = function (queryBox) {
    var result = [];
    this.queryNode(this.root, queryBox, true, result);
    return result;
  };


  /**
   * Returns the number of unique (non-overlapping) points covered by the query
   * box. The number of points tested is limited by the `threshold` argument.
   *
   * @method numberOfUniquePoints
   * @param {Object} queryBox The query envelope object. Its bottom left
   * corner must be defined in terms of geometric dimensions supplied
   * to the `KdTree` constructor. The opposite corner is defined using
   * the `width` and `height` properties, with `width` corresponding
   * to the odd dimension and `height` to the even one.
   * @return {Integer} The number of KdNodes found
   * @example
      if (this.map.kdTree.numberOfUniquePoints(this.map.visibleWorld().bbox) > 4) {
        // OK to proceed
        . . .
      }
   */
  this.numberOfUniquePoints = function (queryBox, threshold) {
    var t = threshold !== undefined ? threshold : 100,
        result = this.rangeQuery(queryBox),
        hash = {};

    if (result.length > t) {
      return t;
    }

    Y.each(result, function (node) {
      hash[node.obj[self.dimensions[0]].toFixed(4) + ':' + node.obj[self.dimensions[1]].toFixed(4)] = true;
    });
    return Y.Object.keys(hash).length;
  };

  /**
  * Render the index tree in the form of a graph for plotting.
  *
  * @method exportGraph
  * @return {Object} Graph representation of the tree
  * @example
     {
       name: "0.5, 0",
       left: {
         name: "0.5, 0.5",
         left: {
           name: "0, 0.5",
           left: {
             name: "0, 0"
           },
           right: {
             name: "-" // This node is vacant
           }
         },
         right: {
           name: "0, 1"
         }
       },
       right: {
         name: "0.5, 1",
         left: {
           name: "1, 0"
         },
         right: {
           name: "1, 1"
         }
       }
     }
  */
  this.exportGraph = function () {
    function traverse(node) {
      var tree = {};
      if (node) {
        tree.name = node.obj.x + ', ' + node.obj.y;
        tree.left = node.left ? traverse(node.left) : {name: '-'};
        tree.right = node.right ? traverse(node.right) : {name: '-'};
        if (tree.left.name === '-' && tree.right.name === '-') {
          tree.left = undefined;
          tree.right = undefined;
        }
        return tree;
      }
      return null;
    }

    return traverse(this.root);
  };
};

}, '@VERSION@', {});
