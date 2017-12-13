/*global YUI: false, d3: false */
"use strict";
YUI.add('d3-render-binary-tree', function (Y) {

  Y.renderTree = function (containerName, treeData, customOptions) {
    // build the options object
    var options,
      totalNodes = 0,
      size,
      tree,
      nodes,
      link,
      links,
      layoutRoot,
      nodeGroup;

    options = Y.merge(
      {
        nodeRadius: 5,
        fontSize: 9,
        width: 400,
        height: 400,
        verticalOffset: 30
      },
      customOptions
    );

    function visitFn(d) {
      if (d.name !== '-') {
        totalNodes += 1;
      }
    }

    function childrenFn (d) {
      return {
        left: d.left,
        right: d.right
      }
    }

    function visit(parent, visitFn, childrenFn) {
      if (parent) {
        visitFn(parent);

        Y.each(childrenFn(parent), function (child) {
          visit(child, visitFn, childrenFn);
        });
      }
      else {
        return;
      }
    }

    // Calculate the number of nodes
    visit(treeData, visitFn, childrenFn);

    tree = d3.layout.tree().sort(null).size([options.width, options.height]).children(
      function (d) {
        if (d.left && d.right) {
          return [d.left, d.right];
        }
        if (d.left) {
          return [d.left];
        }
        if (d.right) {
          return [d.right];
        }
        // return (d.left || d.right) ? [d.left, d.right] : null;
      }
    );

    nodes = tree.nodes(treeData);
    links = tree.links(nodes);

    /*
    <svg>
      <g class="container" />
    </svg>
    */
    layoutRoot = d3.select(containerName)
    .append("svg:svg").attr("width", options.width).attr("height", options.height + options.verticalOffset * 2)
    .append("svg:g").attr("class", "container").attr("transform", 'translate(0, ' + options.verticalOffset + ')');

    d3.select(containerName).select('svg').append("text")
    .attr("x", options.width - 50)
    .attr("y", 6)
    .attr("dy", ".71em")
    .attr('class', 'label')
    .text('n = ' + totalNodes);

    if (options.title) {
      d3.select(containerName).select('svg').append("text")
      .attr("x", 30)
      .attr("y", 6)
      .attr("dy", ".71em")
      .attr('class', 'label')
      .text(options.title);
    }

    // Edges between nodes as a <path class="link" />
    link = d3.svg.diagonal().projection(function (d) {
      return [d.x, d.y];
    });

    layoutRoot.selectAll("path.link").data(links).enter().append("svg:path").attr("class", "link").attr("d", link);


    /*
     Nodes as
     <g class="node">
       <circle class="node-dot" />
       <text />
     </g>
     */
    nodeGroup = layoutRoot.selectAll("g.node").data(nodes).enter().append("svg:g").attr("class", "node").attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

    nodeGroup.append("svg:circle").attr("class", "node-dot").attr("r", options.nodeRadius);

    nodeGroup.append("svg:text").attr("text-anchor", function (d) {
      return d.children ? "end" : "start";
    }).attr("dx", function (d) {
      var gap = 2 * options.nodeRadius;
      return d.children ? -gap : gap;
    }).attr("dy", 3).text(function (d) {
      return d.name;
    });

  };
}, "0.0.1", {requires: []});

