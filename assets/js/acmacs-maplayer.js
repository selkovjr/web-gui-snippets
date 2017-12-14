YUI.add('acmacs-maplayer', function(Y) {

// ======================================================================

// _Stackable map layer_
//

// The purpose of this module is to add ACMACS-specific functionality to the
// basic layer widget. It extends `Y.ACMACS.LayerWidget` by adding the `plot()`
// method and setting the values of map-specific attributes.
//

/*global Y: false, document: false */
var code = {
  prototypeProperties: {
    // This attribute controls whether or not individual objects displayed on
    // the layer can be dragged away from their initial locations. It must be
    // set to `false` to enable drag-and-drop operations on them (see [point
    // translation](#drag_and_drop)).
    monolithic: false,

    // Use this property to store the reference to plot data.
    // `LayerStack` uses it.
    data: null,

    // * Reference to the raw DOM node for the `<defs>` element containing the
    // emboss filter for message text
    defsDOMNode: null,

    // The text node immediately following the base group node; used to display
    // the status message.
    messageText: null,

    // The number of selected points; stores data for the attribute of the same
    // name.
    selected: 0,

    // The flag indicating the absence of the `show_label` property in
    // all point styles.
    showLabelAbsent: null,

    // <a name="pointList">
    // * The list of point objects holding point-label associations and other
    // non-DOM data about map points.
    pointList: null,

    // <a name="kdTree">
    // * An index tree supporting the nearest neighbour queries against
    // `this.pointList`.
    kdTree: null,


    // ## Method summary
    // * Life cycle methods
    //   * **[initializer](#initializer)**()
    //   * **[destructor](#destructor)**()
    // * Composition methods
    //   * **[renderUI](#renderUI)**()
    //   * **[plot](#plot)**(_data_)
    //   * **[generateLabels](#generateLabels)**()
    //   * **[labelAndIndex](#labelAndIndex)**(_node, attr_)
    // * State methods
    //   * **[updatePointSize](#updatePointSize)**()
    //   * **[updatePositionData](#updatePositionData)**()
    //   * **[repositionMessageText](#repositionMessageText)**()
    //   * **[createSelectionRect](#createSelectionRect)**(_startingPoint, negative_)
    //   * **[extendSelectionRect](#extendSelectionRect)**(_pickupPoint, dx, dy_)
    //   * **[processSelectionRect](#processSelectionRect)**()
    //   * **[coveredBySelectionRect](#coveredBySelectionRect)**()
    //   * **[listSelectedPoints](#listSelectedPoints)**()
    //   * **[visibleLabelCount](#visibleLabelCount)**()
    //   * **[labelsVisibleOutsideSelection](#labelsVisibleOutsideSelection)**()
    //   * **[clearSelection](#clearSelection)**()
    //   * **[syncSelected](#syncSelected)**()
    //   * **[updateSelectionHighlights](#updateSelectionHighlights)**(_e_)
    //   * **[indexingMetric](#indexingMetric)**(_a, b_)
    //   * **[updateIndex](#updateIndex)**()
    // * Interactivity methods
    //   * **[pointerMoveStart](#pointerMoveStart)**(_e_)
    //   * **[pointerMoveDrag](#pointerMoveDrag)**(_e_)
    //   * **[pointerMoveCancel](#pointerMoveCancel)**()

    initializer: function (config) {
      this.pointList = {};
    },

    destructor: function () {
      this.messageText.remove().destroy(true);
      this.messageText = undefined;
      this.defsDOMNode = undefined;

      this.kdTree = undefined;

      Y.each(this.pointList, function (p) {
        p.destroy();
      });
      this.pointList = undefined;

      // This property overrides LayerWidget's and must be destroyed here.
      this.pickupPoint = undefined;
    },

    renderUI: function () {
      // Set up a text node for status messages to render in the background.
      // The map widget will set `this.messageText` to `preparing...` while
      // wating for data.
      var node, filter, textHeight = Math.floor(this.get('height') / 8);

      Y.ACMACS.MapLayer.superclass.renderUI.call(this);

      filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', 'emboss');
      node = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      node.setAttribute('in', 'SourceGraphic');
      node.setAttribute('stdDeviation', (textHeight / 50).toString());
      node.setAttribute('result', 'blur');
      filter.appendChild(node);
      this.defsDOMNode = this.canvas.insertBefore('<defs />', this.canvas.one('.basegroup'));
      this.defsDOMNode.appendChild(filter);

      node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      node.setAttribute('x', this.get('width') / 2);
      node.setAttribute('y', this.get('height') / 2);
      node.setAttribute('font-size', textHeight + 'px');
      node.setAttribute('font-family', 'sans');
      node.setAttribute('font-weight', 'bold');
      node.setAttribute('text-anchor', 'middle');
      node.setAttribute('class', 'maplayer-message');
      node.setAttribute('style', 'fill: hsl(0, 0%, 80%); fill-opacity: 0.5; filter: none'); // url(#emboss)

      this.canvasDOMNode.appendChild(node);
      this.messageText = Y.one(node);
    },

    plot: function (data) {
      var
        arg,
        t,
        labelType = this.rootWidget.get('labelType');

      // Retain the reference to data for future use
      this.data = data;

      // Scan styles for the presence of `show_label`.
      this.showLabelAbsent = true;
      Y.each(data.style, function (s) {
        if (s.show_label !== undefined) {
          this.showLabelAbsent = false;
        }
      }, this);

      this.clear();
      this.selected = 0;
      this.syncSelected();

      this.messageText.setContent('');
      Y.each(data.renderingOrder, function (tranche) {
        Y.each(tranche, function (i) {
          var
            layer = this,
            style = data.style[data.styleIndex[i]],
            fillRgba = style.fill_color || '#000000',
            fillColor,
            fillOpacity,
            strokeRgba = style.outline_color || '#000000',
            strokeColor = strokeRgba,
            strokeOpacity;

          // This test prevents points with undefined co-ordinates from being
          // rendered and consequently from being added to this.pointList. The
          // undefined values in this.pointList are used later to prevent lines
          // from being rendered on the connections layer.
          if (
            Y.Lang.isNumber(data.point[i][0]) &&
            Y.Lang.isNumber(data.point[i][1]) &&
            (style.shown === undefined || style.shown)
          ) {
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
              point: data.point[i],
              size: style.size,
              aspect: style.aspect,
              rotation: style.rotation,
              fill: fillColor,
              fillOpacity: fillOpacity * this.setting('forcedOpacityFactor'),
              stroke: strokeColor,
              strokeOpacity: strokeOpacity * this.setting('forcedOpacityFactor'),
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
              throw new Error("unrecognised shape '" + style.shape + "'");
            } // shape switch

            if (data.showLabels && (style.show_label || this.showLabelAbsent)) {
              Y.mix(arg, {
                label: data.pointInfo[i][labelType],
                labelSize: style.label_size,
                labelX: style.label_position_x,
                labelY: style.label_position_y,
                label_position_type: style.label_position_type,
                labelColour: style.label_color || 'black',
                labelFont: style.label_font,
                labelVisible: style.show_label
              });

              if (Y.Lang.isObject(arg.labelFont)) {
                arg.labelFont = 'sans-serif';
              }
            }

            this.addPoint(arg);
          } // points with valid co-ordinates
        }, this); // each point in the rendering tranche
      }, this); // each rendering tranche
    }, // plot()


    // <a name="generateLabels">
    // ### generateLabels()
    // Run through the list of points and create a label for each.
    generateLabels: function (list, keep) {
      var
        labelLayer = this.parent.labels,
        labelType = this.rootWidget.get('labelType'),
        data = this.data, // a streamlined version of widget data stored in plot()
        filterMap = {},
        me = this;

      Y.log('map.generateLabels()');
      Y.log('label type: ' + labelType);
      if (!data) {
        return;
      }

      if (typeof list === 'object') {
        Y.each(list, function (i) {
          filterMap[i] = true;
        });
      }

      function filter(i) {
        if (typeof list === 'string') {
          if (list === 'all') {
            return true;
          }
          if (list === 'missing') {
            return !me.pointList[i].textNode;
          }
          if (list === 'selected') {
            return me.pointList[i].selected;
          }
        }
        if (typeof list === 'number' && list === i) {
          return true;
        }
        if (typeof list === 'object') { // actually, array
          return filterMap[i];
        }
        return false;
      }

      Y.each(data.renderingOrder, function (tranche) {
        Y.log('tranche: ' + tranche);
        Y.each(tranche, function (index) {
          Y.log('index: ' + index + ' -> ' + filter(index));
          var
            p,
            style,
            pointInfo,
            font;

          if (filter(index)) {
            p = me.pointList[index];
            if (p) {
              style = data.style[data.styleIndex[p.index]];
              pointInfo = data.pointInfo[p.index];
              Y.log('  generating for ' + p.index + ': ' + Y.ACMACS.stringify(style));
              font = style.label_font;
              if (Y.Lang.isObject(font)) {
                font = 'sans-serif';
              }

              if (p.textNode && !keep) {
                Y.log('    removing old text node');
                p.textNode.remove(true);
              }

              if (!p.textNode && (style.show_label || style.show_label === undefined)) { // || !(style.show_label !== undefined && style.show_label === false))) {
                Y.log('    adding new text node');
                Y.log('      ' + pointInfo[labelType]);
                p.addLabel({
                  layer: labelLayer,
                  size: style.label_size,
                  labelX: style.label_position_x,
                  labelY: style.label_position_y,
                  label_position_type: style.label_position_type,
                  text: pointInfo[labelType],
                  font: font,
                  fill: style.label_color || 'black',
                  opacity: me['default'].forcedOpacityFactor,
                  index: p.index
                });
              }
            } // point exists (was not excluded for invalid co-ordinates)
          } // filter positive
        }); // each point
      }); // each tranche
    }, // generateLabels()


    // <a name="labelAndIndex">
    // ### labelAndIndex()

    // Set up an index structure for a node, create a label on the label layer
    // and link it to the point on the map with a leader line.
    //
    labelAndIndex: function (node, arg) {
      var labelLayer = this.parent.labels;

      node.index = arg.index;
      node.X = arg.point[0];
      node.Y = arg.point[1];

      // Create a proxy object for this point to store point-label associations
      // and other data.
      this.pointList[arg.index] = new Y.ACMACS.MapPoint({
        layer: this,
        x: arg.point[0], // point co-ordinates
        y: arg.point[1],
        pointDOMNode: node,
        index: arg.index
      });

      // Render this point's label
      if (arg.label) {
        this.pointList[arg.index].addLabel({
          layer: labelLayer,
          size: arg.labelSize,
          labelX: arg.labelX,
          labelY: arg.labelY,
          label_position_type: arg.label_position_type,
          text: arg.label,
          font: arg.labelFont,
          fill: arg.labelColour || 'black',
          opacity: this['default'].forcedOpacityFactor,
          index: arg.index
        });
      }
    }, // labelAndIndex()


    // <a name="restylePoint">
    // ### restylePoint()
    // Apply new styles to the point givin by index `i`
    restylePoint: function (i, oldStyle) {
      var
        point = this.pointList[i],
        node = point.pointDOMNode,
        labelLayer = this.parent.labels,
        labelType = this.rootWidget.get('labelType'),
        style = this.data.style[this.data.styleIndex[i]],
        highlightSensitive = false,
        keys = Y.Object.keys(style),
        arg;

      Y.log(['restylePoint', i, oldStyle, style, style.show_label, labelType]);

      // The show_label property can be omitted
      if (style.show_label === undefined) {
        keys.push('show_label');
      }
      Y.each(keys, function (key) {
        var s = style[key];
        Y.log(['checking ' + key, Y.ACMACS.stringify(oldStyle[key]), Y.ACMACS.stringify(s)]);
        if (key === 'show_label') {
          // This procedure will set `show_label` in any event
          this.showLabelAbsent = false;
          Y.log([s, oldStyle[key]]);
          if (s) {
            Y.log('  OK');
            if (point.textNode) {
              point.showLabel();
            }
            else {
              // Need to add the label
              arg = Y.clone(style, true);
              Y.mix(arg, {
                label: this.data.pointInfo[i][labelType],
                labelSize: style.label_size,
                labelX: style.label_position_x,
                labelY: style.label_position_y,
                label_position_type: style.label_position_type,
                labelColour: style.label_color || 'black',
                labelFont: style.label_font,
                labelVisible: style.show_label
              });

              if (Y.Lang.isObject(arg.labelFont)) {
                arg.labelFont = 'sans-serif';
              }

              if (arg.label) {
                point.addLabel({
                  layer: labelLayer,
                  size: arg.labelSize,
                  labelX: arg.labelX,
                  labelY: arg.labelY,
                  text: arg.label,
                  font: arg.labelFont,
                  fill: arg.labelColour || 'black',
                  opacity: this['default'].forcedOpacityFactor,
                  index: point.index
                });
              }

            }
          }
          else {
            point.hideLabel();
            style.show_label = false;
          }
        } // style.show_label
        else {
          // All other keys
          if (Y.ACMACS.stringify(s) !== Y.ACMACS.stringify(oldStyle[key])) {
            Y.log('  OK');
            if (key === 'size' && s !== undefined) {
              this.updatePointSize({
                node: node,
                scale: style.size / oldStyle.size
              });
            } // style.size

            if (key === 'fill_color' && s !== undefined) {
              Y.log('restylePoint: changing fill_color to ' + Y.ACMACS.stringify(s));
              if (Y.Lang.isArray(s)) {
                node.setAttribute('fill', s[0]);
                node.setAttribute('fill-opacity', (s[1] * this.setting('forcedOpacityFactor')).toString());
              }
              else {
                Y.log('simple color');
                node.setAttribute('fill', s);
              }
              highlightSensitive = true;
            } // style.fill_color

            if (key === 'outline_color' && s !== undefined) {
              Y.log('restylePoint: changing outline_color to ' + Y.ACMACS.stringify(s));
              if (Y.Lang.isArray(s)) {
                node.setAttribute('stroke', s[0]);
                node.setAttribute('stroke-opacity', (s[1] * this.setting('forcedOpacityFactor')).toString());
              }
              else {
                node.setAttribute('stroke', s);
              }
              highlightSensitive = true;
            } // style.outline_color

            // // Apply static tilt to all shapes except cicrles, for which it does not
            // // make sense.
            // if (node.tagName !== 'circle') {
            //   node.setAttribute(
            //     'transform',
            //     Y.substitute('rotate({angle} {x} {y})', {
            //       angle: (arg.rotation || 0),
            //       x: arg.point[0],
            //       y: arg.point[1]
            //     })
            //   );
            // }

            // if (arg.strokeWidth === 0) {
            //   node.setAttribute('stroke-width', 0);
            // }
            // else {
            //   // Stroke width cannot be allowed to assume its default value of 1 because
            //   // this value is interpreted as a world metric. That is fine in
            //   // pixel-based applications, but does not make sense in a transformed
            //   // world. It a transformed world, we use the default value of "one
            //   // translated pixel".
            //   if (arg.strokeWidth) {
            //     node.setAttribute('stroke-width',
            //       arg.strokeWidth *
            //         this.attributeOrProfileSetting('pointSizeCalibration') *
            //         this.onePixel
            //     );
            //   }
            //   else {
            //     node.setAttribute('stroke-width',
            //       this['default'].strokeWidth * this.onePixel
            //     );
            //   }
            // }
            // node.setAttribute('stroke', arg.stroke || 'black');
            // node.setAttribute('stroke-opacity', strokeOpacity);

          } // old and new styles differ
        } // key !== 'show_label'
      }, this); // each key

      // After applying styles that affect stroke-width, stroke-opacity and fill-opacity,
      // the new values of these attributes must be preserved to allow highlighting.
      //
      // if (style['stroke-width'] || style['stroke-opacity'] || style['fill-opacity']) {
      if (highlightSensitive) {
        point.saveAttributes();
      }
    }, // restylePoint()


    // <a name="clear">
    // ### clear()

    // Purge the point list and related indices and clean out the rendered DOM
    // nodes.
    clear: function () {
      Y.each(this.pointList, function (p) {
        p.destroy();
      });
      this.pointList = {};

      // Remove all children of this layer's outermost group, reverting it to the
      // empty initial state.
      Y.ACMACS.MapLayer.superclass.clear.call(this);
    },

    // <a name="updatePointSize">
    // ### updatePointSize()

    // Recalculate and update point sizes using this object's or profile
    // settings.
    //
    updatePointSize: function (arg) {
      var
        layer = this,
        nodeSet;

      if (arg && arg.node) {
        nodeSet = [arg.node];
        Y.log(arg.node);
      }
      else {
        nodeSet = this.groupDOMNode.childNodes;
      }

      Y.each(nodeSet, Y.bind(function (node) {
        var index = node.index,
            newSize,
            scale,
            expansion,
            vx,
            vy,
            length,
            textDOMNode,
            p;


        if (arg && arg.scale) {
          scale = arg.scale;
          newSize = node.size * scale;
        }
        else {
          newSize = this.attributeOrProfileSetting('pointScale');
          if (node.abstractSize !== undefined) {
            newSize = newSize * node.abstractSize;
          }
          // Apply the scale factor specific for this device
          newSize *= this.attributeOrProfileSetting('pointSizeCalibration') * this.onePixel;
          scale = newSize / node.size;
        }


        // The amount by which the point's radius expands or contracts.
        expansion = node.size * (scale - 1) / 2;

        node.scale(scale);

        node.size = newSize;

        // Adjust the label.
        if (index !== undefined) {
          p = this.pointList[index];
          if (p && p.textDOMNode) {
            // compute a unit vector aiming at label anchor
            vx = p.labelPositionX;
            vy = p.labelPositionY;
            length = Math.sqrt(vx * vx + vy * vy);
            vx /= length;
            vy /= length;

            p.textDOMNode.translatePreservingTilt(
              vx * expansion * p.labelLayer.scale,
              vy * expansion * p.labelLayer.scale
            );
          }
        }
      }, this));
    }, // updatePointSize()


    // <a name="updatePositionData">
    // ### updatePositionData()

    // Record changes resulting from user-initiated point move.
    // This method is called in a `mouseup` listener.
    updatePositionData: function () {
      var data = this.rootWidget.get('data'),
          t = this.groupDOMNode.getCTM().inverse().multiply(this.operationGroupDOMNode.getCTM());

      Y.each(this.operationGroupDOMNode.childNodes, Y.bind(function (node) {
        var p = this.pointList[node.index],
            displayPoint,
            transformedMapPoint;

        // Map the point to display using the operation group's transformation.
        displayPoint = this.displayPointOp(p.pointDOMNode.X, p.pointDOMNode.Y);

        // And now transform back to the base map co-ordinates.
        transformedMapPoint = this.parent.trueWorldPoint(displayPoint.x, displayPoint.y);

        // Reparent the point from the operation group back to base group.
        p.pointNode.remove();
        this.groupDOMNode.appendChild(p.pointDOMNode);

        // Translate the selected node to new co-ordinates, which are determined
        // from the transformation on the operation group.
        //
        // SVG nodes do not have a `translate()` method; to keep the layer code
        // better organised, the method implementing translation of an ACMACS map
        // point,
        // [`translatePreservingTilt()`](svg-methods.html#translatePreservingTilt),
        // has been added as a DOM extension.
        p.pointDOMNode.translatePreservingTilt(t.e, t.f);

        data.layout[p.index][0] = transformedMapPoint.x;
        data.layout[p.index][1] = transformedMapPoint.y;
      }, this));

      this.removeOperationGroup();

      this.rootWidget.set('data', data, {modified: 'layout'});
    },


    // <a name="repositionMessageText">
    // ### repositionMessageText()

    // Recalculate the co-ordinates of message text node on widget resize.
    //
    repositionMessageText: function () {
      var node = Y.Node.getDOMNode(this.messageText),
          textHeight = Math.floor(this.get('height') / 8);
      node.setAttribute('x', this.get('width') / 2);
      node.setAttribute('y', this.get('height') / 2);
      node.setAttribute('font-size', textHeight + 'px');
    },


    // <a name="createSelectionRect">
    // ### createSelectionRect()

    // Create an SVG rectangle node to indicate the extent of selection.
    //
    createSelectionRect: function (startingPoint, negative) {
      var node = document.createElementNS('http://www.w3.org/2000/svg', 'rect'),
          size = 10 * this.onePixel;

      if (negative) {
        node.setAttribute('class', 'map-selection-negative');
      }
      else {
        node.setAttribute('class', 'map-selection');
      }
      node.setAttribute('x', startingPoint.x);
      node.setAttribute('y', startingPoint.y);
      node.setAttribute('width', size);
      node.setAttribute('height', size);
      this.groupDOMNode.appendChild(node);
      this.selectionRect = Y.one(node);
    },


    // <a name="extendSelectionRect">
    // ### extendSelectionRect()

    // Update the selection rectangle created at the start of selection-drag.
    //
    extendSelectionRect: function (pickupPoint, dx, dy) {
      var rectNode = Y.Node.getDOMNode(this.selectionRect),
          width = Math.abs(dx),
          height = Math.abs(dy),
          x, y;

      if (dx > 0) {
        x = pickupPoint.x;
      }
      else {
        x = pickupPoint.x - width;
      }
      if (dy > 0) {
        y = pickupPoint.y;
      }
      else {
        y = pickupPoint.y - height;
      }
      rectNode.setAttribute('x', x);
      rectNode.setAttribute('y', y);
      rectNode.setAttribute('width', width);
      rectNode.setAttribute('height', height);
    },


    // <a name="processSelectionRect">
    // ### processSelectionRect()

    // Find all points inside the selection rectangle. Add them to selection or
    // remove them from it if selection is negative. When done, remove the
    // rectangle.
    //
    processSelectionRect: function () {
      var rectNode,
          negative = false;

      if (this.selectionRect) {
        rectNode = Y.Node.getDOMNode(this.selectionRect);
        if (rectNode.getAttribute('class') === 'map-selection-negative') {
          negative = true;
        }

        Y.each(this.coveredBySelectionRect(), Y.bind(function (treeNode) {
          var index = treeNode.obj.mapObject.index;
          if (negative) {
            if (this.pointList[index].selected) {
              this.pointList[index].toggle();
            }
          }
          else {
            if (!this.pointList[index].selected) {
              this.pointList[index].toggle();
            }
          }
        }, this));

        this.syncSelected();
      }
    }, // processSelectionRect()


    // <a name="coveredBySelectionRect">
    // ### coveredBySelectionRect()

    // Return the kdTree nodes of all selected points.
    coveredBySelectionRect: function () {
      var rect;
      if (this.selectionRect) {
        rect = this.canvasDOMNode.createSVGRect();
        rect.x = this.selectionRect.get('x');
        rect.y = this.selectionRect.get('y');
        rect.width = this.selectionRect.get('width');
        rect.height = this.selectionRect.get('height');

        this.selectionRect.remove(true);
        this.selectionRect = undefined;

        return this.kdTree.rangeQuery(rect);
      }
    },


    // <a name="listSelectedPoints">
    // ### listSelectedPoints()

    // Return the data indices of all selected points.
    listSelectedPoints: function () {
      var list = [];
      Y.each(this.pointList, function (p) {
        if (p.selected) {
          list.push(p.index);
        }
      });
      return list;
    },


    // <a name="visibleLabelCount">
    // ### visibleLabelCount()

    // The number of point labels that have been rendered and are visible.
    visibleLabelCount: function () {
      var count = 0;
      Y.each(this.pointList, function (p) {
        if (p.labelVisible()) {
          count += 1;
        }
      });
      return count;
    },


    // <a name="labelsVisibleOutsideSelection">
    // ### labelsVisibleOutsideSelection()

    // Return the data indices of unselected points with visible labels.
    labelsVisibleOutsideSelection: function () {
      var count = 0;
      Y.each(this.pointList, function (p) {
        if (!p.selected && p.labelVisible()) {
          count += 1;
        }
      });
      return count;
    },


    // <a name="labelsPotentiallyVisibleOutsideSelection">
    // ### labelsPotentiallyVisibleOutsideSelection()

    // Return the data indices of unselected points with affirmative show_label
    // property in their styles.
    labelsPotentiallyVisibleOutsideSelection: function () {
      var count = 0;
      if (this.showLabelAbsent) {
        return this.numberOfNodes();
      }
      Y.each(this.pointList, Y.bind(function (p) {
        if (!p.selected && this.data.style[this.data.styleIndex[p.index]].show_label) {
          count += 1;
        }
      }, this));
      return count;
    },


    // <a name="labelsVisibleOutsideSelection">
    // ### labelsVisibleOutsideSelection()

    // Return the data indices of selected points with visible labels.
    labelsVisibleInsideSelection: function () {
      var count = 0;
      Y.each(this.pointList, function (p) {
        if (p.selected && p.labelVisible()) {
          count += 1;
        }
      });
      return count;
    },


    // <a name="clearSelection">
    // ### clearSelection()
    clearSelection: function () {
      Y.each(this.pointList, function (p) {
        if (p.selected) {
          p.selected = undefined;
        }
        p.restoreAttributes();
      });
      this.selected = 0;
      this.syncSelected();
    },


    // <a name="syncSelected">
    // ### syncSelected()

    // Transfer the number of selected points from instance property to
    // attributes, as an indirect way to fire the `selectedChange` event in
    // this map layer and in the root widget.
    //
    syncSelected: function () {
      this.set('selected', this.selected);
      this.rootWidget.set('selected', this.selected);
    },


    // <a name="updateSelectionHighlights">
    // ### updateSelectionHighlights()

    // Update all layers affected by selection on `selectedChange`.
    updateSelectionHighlights: function (e) {
      if (e.prevVal === 0) {
        Y.each(this.pointList, Y.bind(function (p, i) {
          if (!p.selected) {
            p.pale();
          }
        }, this));
      }

      if (e.newVal === 0) {
        Y.each(this.pointList, Y.bind(function (p) {
          p.restoreAttributes();
        }, this));
      }

      if (this.parent.connections) {
        this.parent.connections.plot();
      }
    },


    // Use a hash of point selection booleans to select or deselect each point
    // whose `index` is contained in the hash. One of the uses of this method
    // is to toggle the selection state of event targets pulled by the hit test
    // method.
    applySelection: function (selected, enlarge) {
      Y.each(this.pointList, Y.bind(function (p) {
        if (
          selected[p.index] !== undefined && (
            (p.selected && !selected[p.index]) ||
            (!p.selected && selected[p.index])
          )
        ) {
          p.toggle(enlarge);
        }
      }, this));
      this.syncSelected();
    },


    // Use a hash of point selection booleans to toggle the selection state of
    // each point whose `index` is contained in the hash.
    toggleSelection: function (selected, enlarge) {
      Y.each(this.pointList, Y.bind(function (p) {
        if (selected[p.index]) {
          p.toggle(enlarge);
        }
      }, this));
      this.syncSelected();
    },


    // <a name="indexingMetric">
    // ### indexingMetric()

    // The metric distance function used to build the k-d tree index
    //
    // It calculates the distance betwee two points, each having `x` and `y`
    // properties.
    //
    indexingMetric: function (a, b) {
      return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
    },

    // <a name="updateIndex">
    // ### updateIndex()

    // Build a new index tree. To be called whenever points on the map change
    // their location.
    //
    updateIndex: function () {
      var list = [];

      Y.each(this.pointList, function (p) {
        var node = p.pointDOMNode;
        list.push({x: node.X, y: node.Y, mapObject: p});
      });

      this.kdTree = new Y.KdTree(list, this.indexingMetric, ['x', 'y']);
    },

    // <a name="drag_and_drop">
    // ### Point translation (drag-and-drop)

    // Translating a point or a set of points is similar to translating a view.
    // The same pointer events are needed to initiate it and to carry it out,
    // although the `mousedown` event needs a modifier. The transformation itself
    // is exactly the same as in view translation; the only difference is that it
    // is applied to a group node that is created to wrap the selected nodes and
    // serves as a target for this operation (`this.operationGroupDOMNode`), while
    // during view translation, the operation is applied to the base group node
    // (`this.groupDOMNode`). The selected nodes are temporarily reparented from
    // the base group to the operation group.

    // <a name="pointerMoveStart">
    // ### pointerMoveStart()

    // This method initialises the drag-and-drop action on a modified `mousedown`
    // event. If followed by mousemove events, the location it saves in
    // `this.pickupPoint` is used to calculate the amount of translation of the
    // affected point or a set of points. In the absence of subsequent
    // `mousemove` events, it has no effect.

    pointerMoveStart: function (e) {
      var targetPoint;

      // Remember where the action started, to allow `pointerMoveDrag()` to
      // calculate the amount of translation. The pick-up point is defined in
      // world co-ordinates.
      this.pickupPoint = this.worldPoint(e.x, e.y);

      this.createOperationGroup();
      this.operationGroupDOMNode.setAttribute('class', 'opgroup');
      this.operationGroupDOMNode.setAttribute('transform', this.groupDOMNode.getAttribute('transform'));
      this.canvas.append(Y.one(this.operationGroupDOMNode));

      if (this.get('selected')) {
        // If any points are selected, they must all be moved. In anticipation of the move,
        // reparent all selected points to operation group.
        Y.each(this.pointList, Y.bind(function (p) {
          if (p.selected) {
            // Reparent this point to operation group.
            p.pointNode.remove();
            this.operationGroupDOMNode.appendChild(p.pointDOMNode);
          }
        }, this));
      }
      else {
        targetPoint = this.parent.map.pointList[Y.Node.getDOMNode(e.target).index];

        // Reparent this point to operation group.
        targetPoint.pointNode.remove();
        this.operationGroupDOMNode.appendChild(targetPoint.pointDOMNode);
      }
    }

    // <a name="pointerMoveDrag">
    // ### pointerMoveDrag()

    // Applies translation to the SVG node that received the modified `mousedown`
    // event. Implemented in the prototype, `Y.ACMACS.LayerWidget`.


    // <a name="pointerMoveCancel">
    // ### pointerMoveCancel()

    // Cleans up the state after a drag-and-drop operation has been cancelled
    // (mouse released outside the viewport). Implemented in the prototype,
    // `Y.ACMACS.LayerWidget`.
  },
  staticProperties: {
    ATTRS: {
      // The number of selected points, echoed in the root widget on
      // selectedChange for interactivity purposes.
      selected: {
        value: 0
      }
    }
  }
};

Y.namespace('ACMACS').MapLayer = Y.Base.create(
  'acmacsMapLayer',
  Y.ACMACS.LayerWidget,
  [],
  code.prototypeProperties,
  code.staticProperties
);

}, '@VERSION@', {
  requires: ['base', 'node', 'acmacs-base', 'acmacs-layer', 'acmacs-mappoint', 'kd-tree']
});
/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
