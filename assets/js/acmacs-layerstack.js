/*
  # license
  # license.
*/
// ======================================================================

// ------------------------------------------------------------------------
// Y.ACMACS.LayerStackWidget
// ------------------------------------------------------------------------

// ## Prototype properties
/*global Y: false, document: false */
var code = {
// ## Prototype properties
  prototypeProperties: {
    // * Setting `CONTENT_TEMPLATE` to `null` disposes of Widget's two-box
    // rendering model. Content box and bounding box become the same.
    CONTENT_TEMPLATE: null,

    // * Parameters affecting appearance or behaviour
    'default': {
      minSize: 50,

      chartSize: {
        x: 300,
        y: 300
      }
    },

    // ### Component references

    // * The pointer target layer and its target node (`contentBox`)
    targetLayer: null,
    targetNode: null,

    // * The named list of overscroll margin nodes on all four sides
    margin: null,

    // ### State variables

    // * A derivative of all child layers' `monolithic` attribute. It helps
    // optimise performance by shunting the unnecessary operations on
    // monolithic layers.
    //
    // Needs to be changed if any of the component layers are non-monolithic.
    monolithic: true,

    // * The point marking the start of a drag-type interactive transformation.
    // Depending on the mode (constrained or unconstrained), it is expressed
    // either in world or display co-ordinates, respectively.
    pickupPoint: null,

    pointHit: false,

    // * Two-element object with x and y boolean properties indicating continued
    // viewport excursion during pointer-drag operations
    priorExcursion: null,

    // * The flag updated by a `mousemove` handler to detect the absence of change
    // during the `mouseup` event.
    motionDetected: false,

    // * HUD visibility flag used to prevent repeat action in event listeners
    hudVisible: false,

    // * The timer used to fade the HUD in and out
    hudAnimateTimer: null,

    // * The timer used to assert end-of-motion and to fire the `mousemove-end` event
    motionTimer: null,

    // ## Method summary
    // * **Life cycle methods**
    //   * **[initializer](#initializer)**()
    //   * **[destructor](#destructor)**()
    // * **Event bindings**
    //   * **[bindUI](#bindUI)**()
    // * **Composition methods**
    //   * **[renderUI](acmacs-map-ui.html#renderUI)**()
    //   * **[addLayer](#addLayer)**(_name_, _LayerPrototype_, _config_)
    //   * **[insertLayer](#addLayer)**(_name_, _LayerPrototype_, _config_)
    //   * **[removeLayer](#removeLayer)**(_name_)
    //   * **[clearLayers](#clearLayers)**()
    // * **Event listeners and their component methods**
    //   * **[enter](#enter)**(_e_)
    //   * **[leave](#leave)**(_e_)
    //   * **[pointerStartDrag](#pointerStartDrag)**(_e_)
    //   * **[pointerContinueDrag](#pointerContinueDrag)**(_e_)
    //   * **[pointerStopDrag](#pointerStopDrag)**(_e_)
    //   * **[constrainedPointerPanStart](#constrainedPointerPanStart)**(_e_)
    //   * **[constrainedPointerPan](#constrainedPointerPan)**(_e_)
    //   * **[constrainedPointerPanEnd](#constrainedPointerPanEnd)**(_e_)
    //   * **[pointerMoveStart](#pointerMoveStart)**(_e_)
    //   * **[pointerSelectStart](#pointerSelectStart)**(e)
    //   * **[pointerDeselectStart](#pointerDeselectStart)**(e)
    //   * **[pointerMoveDragWithExcursion](#pointerMoveDrag)**(_e_)
    //   * **[pointerMoveDrag](#pointerMoveDrag)**(_e, constraint_)
    //   * **[pointerSelectDrag](#pointerSelectDrag)**(_e_)
    //   * **[pointerFlip](#pointerFlip)**(_e_)
    //   * **[filteredPointerZoom](#filteredPointerZoom)**(_e_)
    //   * **[pointerZoom](#pointerZoom)**(_e_)
    //   * **[pointerRotate](#pointerRotate)**(_e_)
    //   * **[centredRotate](#centredRotate)**(_e_)
    //   * **[hitTest](#hitTest)**(e)
    //   * **[labelHitTest](#labelHitTest)**(e)
    // * **Non-interactive tranformations**
    //   * **[centredZoom](#centredZoom)**(_delta_)
    //   * **[fitToViewport](#fitToViewport)**()
    //   * **[horizontalFLip](#horizontalFLip)**()
    //   * **[verticalFlip](#verticalFlip)**()
    //   * **[pan](#pan)**(_x_, _y_)
    //   * **[rotate](#rotate)**(_arg_, _x_, _y_)
    //   * **[shift](#shift)**(_x_, _y_)
    //   * **[applyStyleToLayers](#applyStyleToLayers)**(_style, _value_)
    // * Auxiliary methods
    //   * **[trueWorldPoint](#trueWorldPoint)**(_p_)
    //   * **[trueVisibleWorld](#trueVisibleWorld)**()
    //   * **[viewportSize](#viewportSize)**(dimension)
    //   * **[scaleFactor](#scaleFactor)**()
    //   * **[zoomRatio](#zoomRatio)**()
    //   * **[bBoxRange](#bBoxRange)**(dimension)
    //   * **[displayBoundingBox](#displayBoundingBox)**()
    //   * **[updateDimensions](#updateDimensions)**()
    //   * **[springDisplacement](#springDisplacement)**()
    //   * **[updateHud](#updateHud)**()

    // ------------------------------------------------------------------------
    // ## Life cycle methods

    // <a name="initializer">
    // ### intializer()

    initializer: function (config) {
      // Mix in the paning constraints.
      Y.mix(this, Y.ACMACS.ElasticOverscroll, true);

      // Make sure the instance propreties exist. Failing to assign a value to them
      // will result in prototype properties shared among all instances of the
      // widget.
      this.instanceName = config.instanceName;
      this.children = [];
      this.pickupPoint = {};
      this.margin = {};

      this.listeners = [];
    },

    // <a name="destructor">
    // ### destructor()

    // Clean up the DOM on destruction.
    destructor: function () {
      this.pickupPoint = undefined;
      this.priorExcursion = undefined;

      Y.each(this.listeners, function (handle) {
        handle.detach();
      });
      this.listeners = undefined;
      this.hudAnimateTimer = undefined;
      this.motionTimer = undefined;

      // The target layer is not included in the `layers` attribute.
      if (this.targetLayer) {
        this.targetLayer.destroy(true);
        delete this.targetLayer;
      }
      this.targetNode = undefined;

      Y.each(this.get('layers'), function (layer) {
        layer.destroy(true);
        // A reference to each layer is stored as a property for ease of access.
        delete this[layer.instanceName];
      }, this);

      // Y.ACMACS.WidgetTreeNode properties
      this.children = undefined;
      this.parent = undefined;
      this.rootWidget = undefined;

      Y.each(this.margin, function (node) {
        node.remove().destroy(true);
      });
      this.margin = undefined;
    },


    // ------------------------------------------------------------------------
    // ## Event Bindings

    // <a name="bindUI">
    // ### bindUI()

    // Set up event bindings to communicate changes between UI and state.
    bindUI: function () {
      this.listeners.push(Y.ACMACS.profile.after('chartSizeChange', this.updateDimensions, this));
      this.listeners.push(this.after('chartSizeChange', this.updateDimensions));
    }, // bindUI()

    // ------------------------------------------------------------------------
    // ## Composition methods

    // <a name="renderUI">
    // ### renderUI()

    // Insert the auxiliary layers: the target layer and the shadow layer. The
    // information-bearing layers will be inserted by the `bindUI()` method of
    // `MapWidget`.
    renderUI: function () {
      this.margin.left = Y.Node.create(
        '<div style="height: ' + this.get('height') + 'px" class="yui3-acmacslayerstackwidget-margin-left"></div>'
      ).appendTo(this.get('contentBox'));

      this.margin.top = Y.Node.create(
        '<div style="width: ' + this.get('width') + 'px" class="yui3-acmacslayerstackwidget-margin-top"></div>'
      ).appendTo(this.get('contentBox'));

      this.margin.right = Y.Node.create(
        '<div style="height: ' + this.get('height') + 'px" class="yui3-acmacslayerstackwidget-margin-right"></div>'
      ).appendTo(this.get('contentBox'));

      this.margin.bottom = Y.Node.create(
        '<div style="width: ' + this.get('width') + 'px" class="yui3-acmacslayerstackwidget-margin-bottom"></div>'
      ).appendTo(this.get('contentBox'));

      this.targetLayer = new Y.ACMACS.TargetLayer({
        render: this.get('contentBox'),
        width: this.get('width'),
        height: this.get('height')
      });
      this.targetLayer.parent = this;

      this.targetNode = this.targetLayer.get('contentBox');
    },

    // <a name="addLayer">
    // ### addLayer()

    // Add a layer of the type determined by `LayerPrototype` to the top of the
    // stack and pass the `config` object to the prototype constructor.
    addLayer: function (name, LayerPrototype, config) {
      // The `layers` array duplicates the function of `this.chilrden`, but
      // stores only the layer-type children.
      var layer,
          layers = [];

      // Because the new layer will be appended to the DOM, the target node must
      // be removed and re-inserted later.
      if (this.targetNode) {
        this.targetNode.remove();
      }

      layer = this.add(name, LayerPrototype, Y.merge({
        width: this.get('width'),
        height: this.get('height')
      }, config));

      // If the layer being added is non-monolithic, mark the fact.  Knowing this
      // allows to avoid superfluous responses to non-monolithic drag events if
      // all layers are monolithic.
      if (!layer.monolithic) {
        this.monolithic = false;
      }

      // Re-insert the target layer
      this.get('contentBox').append(this.targetNode);

      // Save the layers list in a variable so that it could be set using the
      // set() method, firing a change event.
      layers = this.get('layers');
      layers.push(layer);
      this.set('layers', layers);
    },

    // <a name="insertLayer">
    // ### insertLayer()

    // Insert a layer of the type determined by `LayerPrototype` before the
    // layer specified in `index` and pass the `config` object to the prototype
    // constructor.
    insertLayer: function (name, LayerPrototype, index, config) {
      var layer,
          layers = [],
          tail = [],
          tailIndex = 0;

      // Copy the layers to a temp array, so it can be later set as LayerStack
      // attribute, triggering the menu update on layersChange event.
      Y.each(this.get('layers'), function (layer) {
        layers.push(layer);
      });

      // Calculate the numerical index of the insertion point.
      if (index.before || index.after) {
        if (index.before) {
          if (layers.indexOf(this[index.before]) >= 0) {
            tailIndex = layers.indexOf(this[index.before]);
          }
          else {
            throw new Error('layer stack does not have a layer tagged "' + index.before + '"');
          }
        }
        if (index.after) {
          if (layers.indexOf(this[index.after]) >= 0) {
            tailIndex = layers.indexOf(this[index.after]) + 1;
          }
          else {
            throw new Error('layer stack does not have a layer tagged "' + index.after + '"');
          }
        }
      }
      else {
        throw new Error('the "index" argument of insertLayer() must have a "before" or "after" property');
      }

      // Separate the layers above the insertion point and remove them from the
      // DOM.
      tail = layers.splice(tailIndex, layers.length - tailIndex);
      this.targetNode.remove();
      if (this.parent.get('menu')) {
        this.parent.toggleButton.remove();
      }
      Y.each(tail, function (layer) {
        layer.get('boundingBox').remove();
      });

      // Create the new layer on top of the stack.
      layer = this.add(name, LayerPrototype, Y.merge({
        stack: this,
        width: this.get('width'),
        height: this.get('height')
      }, config));

      // If the layer being added is non-monolithic, mark the fact. Knowing this
      // allows to avoid superfluous responses to non-monolithic drag events if
      // all layers are monolithic.
      if (!layer.monolithic) {
        this.monolithic = false;
      }

      layers.push(layer);

      // Re-insert the layers from the etail array.
      Y.each(tail, Y.bind(function (layer) {
        this.get('contentBox').append(
          layer.get('boundingBox')
        );
        layers.push(layer);
      }, this));

      // Re-insert the target layer
      this.get('contentBox').append(this.targetNode);
      if (this.parent.get('menu')) {
        this.get('contentBox').append(this.parent.toggleButton);
      }

      // Trigger the layersChange event, which will allow the layers menu to
      // update itself.
      this.set('layers', layers);
    }, // insertLayer()

    // <a name="removeLayer">
    // ### removeLayer()

    // Remove layer by name.
    removeLayer: function (name) {
      this[name].destroy(true);
      delete this[name];
    },

    // <a name="clearLayers">
    // ### clearLayers()

    // Remove all child nodes in all layers
    clearLayers: function (name) {
      Y.each(this.get('layers'), function (layer) {
        if (layer.clear) {
          layer.clear();
        }
      });
    },

    // ------------------------------------------------------------------------
    // ## Event listeners

    // <a name="enter">
    // ### enter()

    // The listener for `mouseenter` events.
    enter: function (e) {
      this.parent.focus();
    },


    // <a name="leave">
    // ### leave()

    // The listener for `mouseleave` events.
    leave: function (e) {
      Y.log('layerstack.leave()');
      this.parent.defocus();
      this.parent.hideIButton();
    },


    // <a name="pointerStartDrag">
    // ### pointerStartDrag()

    // The listener for `mousedown` events. It dispatches the
    // `constrainedPointerPanStart()` method and calls the `pointerPanStart()`
    // method on all layers that can pan.
    pointerStartDrag: function (e) {
      // A mix-in method
      this.constrainedPointerPanStart(e);

      this.operation = 'pan-drag';
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.pan) {
          layer.pointerPanStart(e);
        }
      });

      this.updateHud();
    },


    // <a name="pointerContinueDrag">
    // ### pointerContinueDrag()

    // Continue the current drag operation on `mousemove`.
    pointerContinueDrag: function (e) {
      this.hitTest(e);
      switch (this.operation) {
      case 'pan-drag':
        this.constrainedPointerPan(e);
        this.updateHud();
        this.parent.fireGUIEvent('viewportChange');
        break;
      case 'move-drag':
        this.pointerMoveDragWithExcursion(e);
        break;
      case 'label-drag':
        this.operand.pointerLabelMove(e);
        break;
      case 'select-drag':
      case 'deselect-drag':
        this.pointerSelectDrag(e);
        break;
      }
      this.motionDetected = true;
    },


    // <a name="pointerStopDrag">
    // ### pointerStopDrag()

    // Terminate the current drag operation on `mouseup`.
    pointerStopDrag: function (e) {
      var bb = this.displayBoundingBox(),
          viewportWidth = this.map.get('width'),
          viewportHeight = this.map.get('height'),
          offsetX = 0,
          offsetY = 0;

      if (this.operation === 'move-drag') {
        if (this.motionDetected) {
          if (e.outside) {
            this.map.pointerMoveCancel();
            this.labels.pointerMoveCancel();
          }
          else {
            this.map.updatePositionData();
            this.labels.pointerStopDrag();
          }
        }
        else {
          // No motion detected; it was just a click-and-release.
          this.map.removeOperationGroup();
          this.labels.removeOperationGroup();
        }
      }

      if (this.operation === 'pan-drag') {
        this.constrainedPointerPanEnd(); // redefined in Y.ACMACS.ElasticOverscroll
        this.updateHud();
        this.parent.fireGUIEvent('viewportChange');
        if (this.connections) {
          this.connections.plot();
        }
      }

      if (
        this.operation === 'select-drag' ||
        this.operation === 'deselect-drag'
      ) {

        if (this.motionDetected) {
          this.map.processSelectionRect();
        }
        else {
          // If a point was hit and no mousemove events have occurred, this hit
          // test will fire a point-clicked event.
          this.hitTest(e);
        }
      }

      if (this.operation === 'label-drag') {
        if (this.motionDetected) {
          Y.log('stopped label drag');
          this.operand.setTetheredStyle(e);
        }
        else {
          // If a point was hit and no mousemove events have occurred, this hit
          // test will fire a point-clicked event.
          this.labelHitTest(e);
        }
      }

      this.operation = null;
    },  // pointerStopDrag()

    // <a name="constrainedPointerPanStart">
    // ### constrainedPointerPanStart()

    // Remember the pickup point. This method is the default (unconstrained)
    // implementation of constrained scrolling. It can be overridden by the
    // Y.ACMACS.ElasticOverscroll mix-in (see `this.initializer()`).
    constrainedPointerPanStart: function (e) {
      this.pickupPoint.x = e.pageX;
      this.pickupPoint.y = e.pageY;
    },

    // <a name="constrainedPointerPan">
    // ### constrainedPointerPan()

    // Pan to the new coordinates given by the `mousemove` event and replace
    // the pickup point.
    //
    // This method is the default (unconstrained) implementation of constrained
    // scrolling. It can be overridden by the Y.ACMACS.ElasticOverscroll mix-in
    // (see `this.initializer()`).
    constrainedPointerPan: function (e) {
      this.pan(
        e.pageX - this.pickupPoint.x,
        e.pageY - this.pickupPoint.y
      );
      this.pickupPoint.x = e.pageX;
      this.pickupPoint.y = e.pageY;
    },

    // <a name="constrainedPointerPanEnd">
    // ### constrainedPointerPanEnd()

    // Do nothing on`mouseup`.
    //
    // This method is the default (unconstrained) implementation of constrained
    // scrolling. It can be overridden by the Y.ACMACS.ElasticOverscroll mix-in
    // (see `this.initializer()`).
    constrainedPointerPanEnd: function (e) {
    },


    // <a name="pointerMoveStart">
    // ### pointerMoveStart()

    // Initiate the point move operation (on Shift+B1). If any points are
    // selected, move those points. In the absence of selection, move the point
    // under cursor.
    pointerMoveStart: function (e) {
      var eventTarget, z;

      if (this.monolithic) {
        Y.log('only monolithic layers in this widget; not doing anything');
        return;
      }

      if (this.map.get('selected')) {
        this.priorExcursion = undefined;
        this.operation = 'move-drag';
        Y.each(this.get('layers'), function (layer) {
          if (!layer.monolithic) {
            layer.pointerMoveStart(e);
          }
        });
      }
      else {
        // This hit test code will only work in a stack having one single
        // map layer named 'map'. It needs to be generalised to work in more
        // complex situations.
        z = this.map.get('zIndex');
        this.map.set('zIndex', 100); // to make sure it is above the target layer
        eventTarget = Y.one(document.elementFromPoint(e.clientX, e.clientY));
        this.map.set('zIndex', z);

        if (this.map.canvas.contains(eventTarget) &&
            this.map.canvas !== eventTarget) {
          e.target = eventTarget;
          this.priorExcursion = undefined;
          this.operation = 'move-drag';
          Y.each(this.get('layers'), function (layer) {
            if (!layer.monolithic) {
              layer.pointerMoveStart(e);
            }
          });
        }
        else {
          Y.log('no selection and no element was hit: not doing anything');
          return;
        }
      }

      this.motionDetected = false;
    }, // pointerMoveStart()

    // <a name="pointerSelectStart">
    // ### pointerSelectStart()

    // The listener for modified `mousedown` events (`Meta-B1`)
    pointerSelectStart: function (e) {
      this.operation = 'select-drag';
      this.pickupPoint = this.map.worldPoint(e.x, e.y);
      this.motionDetected = false;
    },


    // <a name="pointerDeselectStart">
    // ### pointerDeselectStart()

    // The listener for modified `mousedown` events (`Alt+Meta-B1`)
    pointerDeselectStart: function (e) {
      this.operation = 'deselect-drag';
      this.pickupPoint = this.map.worldPoint(e.x, e.y);
      this.motionDetected = false;
    },


    // <a name="pointerLabelMoveStart">
    // ### pointerLabelMoveStart()

    // Initiate the label move operation (typically, on a user event fired in the
    // label layer in label-editing mode.
    pointerLabelMoveStart: function (e) {
      Y.log('pointerLabelMoveStart');
      this.operation = 'label-drag';
      this.operand = this.map.pointList[e.label.index];
      this.map.pointList[e.label.index].pointerLabelMoveStart(e);
      this.motionDetected = false;
    },

    // <a name="pointerMoveDragWithExcursion">
    // ### pointerMoveDragWithExcursion()

    // Move points interactively, allowing for pointer excursion outside the
    // widget. In the case of excursion, pan the map to keep the drop location
    // in sight. Return the points to their original location if the `mouseup`
    // event occurs outside the widget.
    pointerMoveDragWithExcursion: function (e) {
      var excursion = {x: 0, y: 0},
          d = {x: 0, y: 0};

      if (e.outside) {
        // For the outside pointer motion, calculate the amount of excursion
        // along each axis and convert it to the shift value, `d.x` or `d.y`. For
        // the axis with a non-zero shift, offset the base group by that amount,
        // instead of shifting the operation group as it would be normally done
        // with `pointerMoveDrag(e)`.
        Y.each({
          x: this.map.get('width'),
          y: this.map.get('height')
        }, Y.bind(function (span, axis) {
          // Calculate the amount of excursion.
          if (e[axis] < 0) {
            excursion[axis] = e[axis];
          }
          else if (e[axis] > span) {
            excursion[axis] = e[axis] - span;
          }

          // Compare to prior excursion and calculate the amount of shift. No
          // shifting while retreating from an excursion.
          if (this.priorExcursion && this.priorExcursion[axis]) {
            // Increasingly negative excursion (upward or to the left)
            if (e[axis] < 0 && excursion[axis] < this.priorExcursion[axis]) {
              d[axis] = this.priorExcursion[axis] - excursion[axis];
            }

            // Increasingly positive excursion (downward or to the right)
            else if (e[axis] > span && excursion[axis] > this.priorExcursion[axis]) {
              d[axis] = this.priorExcursion[axis] - excursion[axis];
            }
          }
        }, this));

        // Translate the base group. The operation group stays in place until the
        // excursion ends, unless it is a single-axis excursion, in which case
        // the motion along the other axis must continue (the code further down
        // handles such cases).
        if (d.x || d.y) {
          this.pan(d.x, d.y);
        }

        // In the case of single-axis excursion, translate the operation group.
        // along the free axis.
        Y.each({x: 'y', y: 'x'}, Y.bind(function (axis, otherAxis) {
          var constraint = (axis === 'x' ? 'vertical' : 'horizontal');
          if (excursion[axis] && !excursion[otherAxis]) {
            // Check whether prior excursion took place along the other axis. If it
            // did, adjust the pick-up point to compensate for base group
            // translation (see above).
            if (this.priorExcursion && this.priorExcursion[otherAxis]) {
              this.priorExcursion[otherAxis] = 0;
              Y.each(this.get('layers'), function (layer) {
                if (!layer.monolithic && layer.pickupPoint) {
                  layer.pickupPoint[otherAxis] = layer.worldPoint(e.x, e.y)[otherAxis];
                }
              });
            }
            // Drag the points along the unbounded axis.
            this.pointerMoveDrag(e, constraint);
          }
        }, this));

        // Remember where we are for the next drag event.
        this.priorExcursion = excursion;
      } // outside
      else {
        // Inside the viewport.
        if (this.priorExcursion) {
          // If prior excursion took place, it is possible that points were
          // effectively dragged by translating the base group, without updating
          // the pick-up point. Update it now, separately for each axis (because
          // it could have been a two-axis or a single-axis excursion.
          Y.each(['x', 'y'], Y.bind(function (axis) {
            if (this.priorExcursion[axis]) {
              this.priorExcursion[axis] = 0;
              Y.each(this.get('layers'), function (layer) {
                if (!layer.monolithic && layer.pickupPoint) {
                  layer.pickupPoint[axis] = layer.worldPoint(e.x, e.y)[axis];
                }
              });
            }
          }, this));

          if (this.priorExcursion.x === 0 && this.priorExcursion.y === 0) {
            this.priorExcursion = undefined;
          }
        }
        else {
          // Translate the operation group.
          this.pointerMoveDrag(e);
        }
      } // inside
    }, // pointerMoveDragWithExcursion()


    // <a name="pointerMoveDrag">
    // ### pointerMoveDrag()

    // Dispatches the point drag operation to all non-monolithic layers (it
    // probably makes no sense for multiple layers, but for now, we only have
    // one map layer). It is equivalent to simpy calling
    // `map.pointerMoveDrag()`).
    //
    // This method is called from `pointerMoveDragWithExcursion()`. The
    // `constraint` argument, if present, can be either `horizontal` or
    // `vertical`, restricting point translation to one of the cardinal
    // directions.
    pointerMoveDrag: function (e, constraint) {
      Y.each(this.get('layers'), function (layer) {
        if (!layer.monolithic) {
          layer.pointerMoveDrag(e, constraint);
        }
      });
    },


    // <a name="pointerSelectDrag">
    // ### pointerSelectDrag()

    // The listener for modified `mousemove` events (initiated with `Meta+mousedown`).
    pointerSelectDrag: function (e) {
      // Convert the current event point to world co-ordinates.
      var p = this.map.worldPoint(e.x, e.y),
          dx = p.x - this.pickupPoint.x,
          dy = p.y - this.pickupPoint.y;

      if (!this.motionDetected) {
        if (this.operation === 'select-drag') {
          this.map.createSelectionRect(this.pickupPoint);
        }
        else if (this.operation === 'deselect-drag') {
          this.map.createSelectionRect(this.pickupPoint, 'negative');
        }
        else {
          throw new Error('wrong operation \'' + this.operation + '\' in pointerSelectDrag()');
        }
      }

      this.map.extendSelectionRect(this.pickupPoint, dx, dy);
    },


    // <a name="pointerLabelMoveDrag">
    // ### pointerLabelMoveDrag()

    // Contiune the label move operation (typically, on a user event fired in the
    // label layer in label-editing mode.
    pointerLabelMoveDrag: function (e) {
      var targetList = [],
          hits = 0,
          zi,
          p,
          labelType = this.parent.get('labelType');

      e.x = e.pageX - this.get('contentBox').getX();
      e.y = e.pageY - this.get('contentBox').getY();

      // Test whether a point on the map is hit, or more than one point. For
      // browser hit-testing method to work, tha map layer must be brought to
      // top, then restored to its original z-index when hit-testing is
      // complete.
      zi = this.map.get('zIndex');
      this.map.set('zIndex', 200);

      // Return false if no point was hit; if there is a point, add it to
      // `targetList` and return true. Also, if a point is hit, it must be
      // moved to the side to expose other points possibly hiding underneath.
      function elementAtPoint(x, y, map) {
        var targetDOMNode = document.elementFromPoint(x, y),
        target = Y.one(targetDOMNode);

        if (target.get('tagName') === 'svg' ||
            targetDOMNode.getAttribute('class') === 'maplayer-message') {
          return false;
        }

        targetList.push({
          node: target,
          domNode: targetDOMNode,
          tagName: target.get('tagName'),
          index: target.index,
          label: map.data.pointInfo[target.index] && map.data.pointInfo[target.index][labelType]
        });
        targetDOMNode.translatePreservingTilt(100, 100);
        return true;
      }

      while (elementAtPoint(e.clientX, e.clientY, this.map)) {
        hits += 1; // to make jslint happy with a non-empty block
      }

      // With hit testing complete, all points in `targetList` must be returned
      // to their original positions.
      Y.each(targetList, function (p) {
        p.domNode.translatePreservingTilt(-100, -100);
      });

      this.map.set('zIndex', zi);

      // Could use `targetList.length`, but instead have already calculated the
      // number of hits in the dummy block above.
      if (hits > 0) {
        this.pointHit = true;
        this.parent.fireGUIEvent('point-hit', {
          x: e.x,
          y: e.y,
          targetList: targetList
        });
      }
      else {
        // If no points were hit, let the GUI know, so it can display pointer co-ordinates
        p = this.trueWorldPoint(e.x, e.y);
        if (this.pointHit) {
          this.parent.fireGUIEvent('point-abandoned', {
            x: e.x,
            y: e.y,
            wx: p.x,
            wy: p.y
          });
          this.pointHit = false;
        }

        this.parent.fireGUIEvent('pointer-over-canvas', {
          x: e.x,
          y: e.y,
          wx: p.x,
          wy: p.y,
          message: Y.substitute('({ex},{ey}) \u2192 ({wx},{wy})', {
            ex: e.x.toFixed(0),
            ey: e.y.toFixed(0),
            wx: p.x.toFixed(3),
            wy: p.y.toFixed(3)
          })
        });
      } // no points were hit
    }, // pointerLabelMoveDrag()


    // <a name="pointerFlip">
    // ### pointerFlip()

    // The listener for modified `mousedown` events (`Alt+mousedown`).
    //
    // The events are additionally filtered inside the
    // [`LayerWidget.pointerFlip()`](acmacs-layer.html#pointerFlip) method to
    // respond to clicks near chart edges.
    pointerFlip: function (e) {
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.flip) {
          layer.pointerFlip(e);
        }
      });
      if (this.grid) {
        this.grid.update('flip');
      }
      this.updateHud();
      this.parent.fireGUIEvent('viewportChange');
      this.parent.fireGUIEvent('orientationChange');
    },

    // <a name="filteredPointerZoom">
    // ### filteredPointerZoom()

    // The listener for `mousewheel` events.  It limits the wheel delta and
    // applies constraints on zoom levels before calling the `pointerZoom()`
    // method.
    filteredPointerZoom: function (e) {
      var
        z = this.scaleFactor(),
        intendedScale;

      if (e.wheelDelta > 0) {
        // Zooming in
        e.wheelDelta = 0.05; // fixing the delta helps prevent the occurrence of insane zoom factors

        // Do not zoom any further if there are too few points that are still
        // visible.
        if (this.map.kdTree.numberOfUniquePoints(this.map.visibleWorld().bbox) > 4) {
          this.pointerZoom(e);
        }
      }
      else {
        // Zooming out
        e.wheelDelta = -0.047619;
        intendedScale = z * (1 - e.wheelDelta);

        if (intendedScale >= this.get('zoomLimit')) {
          this.pointerZoom(e);
        }
        else {
          Y.log('lower zoom level reached; not zooming');
        }
      }
    },

    // <a name="pointerZoom">
    // ### pointerZoom()

    // Call the `pointerZoom()` method on all layers and update the viewport.
    pointerZoom: function (e) {
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.zoom) {
          layer.pointerZoom(e);
        }
      });
      if (this.grid) {
        this.grid.update('zoom');
      }
      this.updateHud();
      this.parent.fireGUIEvent('viewportChange');
    },

    // <a name="pointerRotate">
    // ### pointerRotate()

    // Rotate the map around the pointer location on pointer-rotate event
    // (Shift+mousewheel). It limits the wheel delta before calling
    // `pointerRotate()` on each layer and then updates the viewport.
    pointerRotate: function (e) {
      if (e.wheelDelta > 0) {
        e.arg = 1; // limiting the delta helps prevent the occurrence of insane rotation angles
      }
      else {
        e.arg = -1;
      }
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.rotate) {
          layer.pointerRotate(e);
        }
      });
      if (this.grid) {
        this.grid.update('rotate');
      }
      this.updateHud();
      this.parent.fireGUIEvent('viewportChange');
      this.parent.fireGUIEvent('orientationChange');
    },

    // <a name="centredRotate">
    // ### centredRotate()

    // The listener for modified `mousewheel` events (`Alt+mousewheel`)
    centredRotate: function (e) {
      var arg;
      if (e.wheelDelta > 0) {
        arg = 1; // limiting the delta helps prevent the occurrence of insane rotation angles
      }
      else {
        arg = -1;
      }
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.rotate) {
          layer.centredRotate(arg);
        }
      });
      if (this.grid) {
        this.grid.update('rotate');
      }
      this.updateHud();
      this.parent.fireGUIEvent('viewportChange');
      this.parent.fireGUIEvent('orientationChange');
    },


    // <a name="hitTest">
    // ### hitTest()

    // Check whether anything of interest is hit on the map layer or on the
    // shadow layer. If there are any targets, list them in the payload of a
    // user-defined event.
    hitTest: function (e) {
      var
        targetList = [],
        hits = 0,
        zi,
        p,
        labelType = this.parent.get('labelType');


      // Return false if no point was hit; if there is a point, add it to
      // `targetList` and return true. Also, if a point is hit, it must be
      // moved to the side to expose other points possibly stacked underneath.
      function elementAtPoint(x, y, layer) {
        var targetDOMNode = document.elementFromPoint(x, y),
            target = Y.one(targetDOMNode),
            pointObject;

        if (layer.parent.map.pointList) { // An indirect test for the presence of labels
          pointObject = layer.parent.map.pointList[targetDOMNode.index];
        }

        if (
          target.get('tagName') === 'circle' ||
          target.get('tagName') === 'ellipse' ||
          target.get('tagName') === 'path' ||
          (
            target.get('tagName') === 'rect' &&
            // Could draw selection on the target layer instead?
            targetDOMNode.getAttribute('class') !== 'map-selection' &&
            targetDOMNode.getAttribute('class') !== 'map-selection-negative'
          )
        ) {
          targetList.push({
            label: layer.parent.map.data.pointInfo[targetDOMNode.index] && layer.parent.map.data.pointInfo[targetDOMNode.index][labelType],
            pointObject: pointObject,
            nodeHit: targetDOMNode
          });
          targetDOMNode.translatePreservingTilt(100, 100);
          return true;
        }
        return false;
      } // elementAtPoint()

      // Cancel the timer on each `mousemove` to make sure the `mousemove-end`
      // event does not fire outside the widget.
      if (this.motionTimer) {
        this.motionTimer.cancel();
      }

      // The `outside` property is only set for `mouseup` and `mousemove`
      // events that occur during a pending operation (see `acmacs-map-interactivity.js`)
      if (e.outside) {
        return false;
      }

      this.motionTimer = Y.later(Y.ACMACS.profile.get('motionTimeout'), this, function () {
        if (this.get('contentBox').contains(e.target)) {
          this.parent.fireGUIEvent('mousemove-end', {
            pageX: e.pageX,
            pageY: e.pageY,
            x: e.x,
            y: e.y
          });
        }
      });

      // Test whether a point on the map is hit, or more than one point. For
      // browser hit-testing method to work, tha map layer must be brought to
      // top, then restored to its original z-index when hit-testing is
      // complete.
      zi = this.map.get('zIndex');
      this.map.set('zIndex', 200);
      while (elementAtPoint(e.clientX, e.clientY, this.map)) {
        hits += 1; // to make jslint happy with a non-empty block
      }
      this.map.set('zIndex', zi);

      // If nothing is found on the map layer, repeat the same test on the
      // shadow layer.
      if (targetList.length === 0) {
        zi = this.shadow.get('zIndex');
        this.shadow.set('zIndex', 200);
        while (elementAtPoint(e.clientX, e.clientY, this.shadow)) {
          hits += 1; // to make jslint happy with a non-empty block
        }
        this.shadow.set('zIndex', zi);
      }

      // With hit testing complete, all points in `targetList` must be returned
      // to their original positions.
      Y.each(targetList, function (item) {
        item.nodeHit.translatePreservingTilt(-100, -100);
        delete item.nodeHit;
      });

      // Could have used `targetList.length`, but instead have already calculated
      // the number of hits in the dummy block above.
      if (hits > 0) {
        this.pointHit = true;
        if (e.type === 'mouseup') {
          this.parent.fireGUIEvent('point-clicked', {
            pageX: e.pageX,
            pageY: e.pageY,
            x: e.x,
            y: e.y,
            targetList: targetList
          });
        }
        else {
          this.parent.fireGUIEvent('point-hit', {
            x: e.x,
            y: e.y,
            targetList: targetList
          });
        }
        return true;
      }

      /* no points were hit */
      if (!e.outside) {
        // If no points were hit, let the GUI know, so it can display pointer co-ordinates
        p = this.trueWorldPoint(e.x, e.y);
        if (this.pointHit) {
          this.parent.fireGUIEvent('point-abandoned', {
            x: e.x,
            y: e.y,
            wx: p.x,
            wy: p.y
          });
          this.pointHit = false;
        }

        this.parent.fireGUIEvent('pointer-over-canvas', {
          x: e.x,
          y: e.y,
          wx: p.x,
          wy: p.y,
          message: Y.substitute('({ex},{ey}) \u2192 ({wx},{wy})', {
            ex: e.x.toFixed(0),
            ey: e.y.toFixed(0),
            wx: p.x.toFixed(3),
            wy: p.y.toFixed(3)
          })
        });
      }
      return false;
    }, // hitTest()


    // <a name="labelHitTest">
    // ### labelHitTest()

    // Check whether anything of interest is hit on the label layer. If there
    // are any targets, list them in the payload of a user-defined event.
    labelHitTest: function (e) {
      var
        zi,
        target,
        targetDOMNode,
        p;

      // Cancel the timer on each `mousemove` to make sure the `mousemove-end`
      // event does not fire outside the widget.
      if (this.motionTimer) {
        this.motionTimer.cancel();
      }

      // The `outside` property is only set for `mouseup` and `mousemove`
      // events that occur during a pending operation (see `acmacs-map-interactivity.js`)
      if (e.outside) {
        return false;
      }

      this.motionTimer = Y.later(Y.ACMACS.profile.get('motionTimeout'), this, function () {
        if (this.get('contentBox').contains(e.target)) {
          this.parent.fireGUIEvent('mousemove-end', {
            pageX: e.pageX,
            pageY: e.pageY,
            x: e.x,
            y: e.y
          });
        }
      });

      // Test whether a label is hit.
      if (Y.UA.webkit) {
        // Doing it the hard way because elementFromPoint does not work for
        // text set in fractional co-ordinates.
        Y.some(this.labels.groupDOMNode.childNodes, function (node) {
          var bbox = node.getBoundingClientRect();
          if (
            (e.clientX >= bbox.left && e.clientX <= bbox.right) &&
            (e.clientY >= bbox.top && e.clientY <= bbox.bottom)
          ) {
            targetDOMNode = node;
            target = Y.one(node);
            return true;
          }
        });
      }
      else {
        // For browser hit-testing method to work, the label layer must be
        // brought to top, then restored to its original z-index when
        // hit-testing is complete.
        zi = this.labels.get('zIndex');
        this.labels.set('zIndex', 200);
        targetDOMNode = document.elementFromPoint(e.clientX, e.clientY);
        target = Y.one(targetDOMNode);
        this.labels.set('zIndex', zi);
      }

      if (target && target.get('tagName') === 'text') {
        if (e.type === 'mousedown') {
          e.label = targetDOMNode;
          this.pointerLabelMoveStart(e);
          return true;
        }
        if (e.type === 'mouseup') {
          Y.log('emitting the label-clicked event');
          this.parent.fireGUIEvent('label-clicked', {
            x: e.x,
            y: e.y,
            label: target
          });
          return true;
        }
      }

      /* no labels were hit */
      if (!e.outside) {
        // If no labels were hit, let the GUI know, so it can display pointer co-ordinates
        p = this.trueWorldPoint(e.x, e.y);
        this.parent.fireGUIEvent('pointer-over-canvas', {
          x: e.x,
          y: e.y,
          wx: p.x,
          wy: p.y,
          message: Y.substitute('({ex},{ey}) \u2192 ({wx},{wy})', {
            ex: e.x.toFixed(0),
            ey: e.y.toFixed(0),
            wx: p.x.toFixed(3),
            wy: p.y.toFixed(3)
          })
        });
      }
      return false;
    }, // labelHitTest()


    // ------------------------------------------------------------------------
    // ## Non-interactive transformations

    // <a name="centredZoom">
    // ### centredZoom()

    centredZoom: function (delta) {
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.zoom) {
          layer.centredZoom(delta);
        }
      });
      if (this.grid) {
        this.grid.update('zoom');
      }
    },

    // <a name="fitToViewport">
    // ### fitToViewport()

    fitToViewport: function () {
      var bb = this.displayBoundingBox(),
          cbb = {x: bb.x + bb.width / 2, y: bb.y + bb.height / 2},
          scale = Math.min(this.get('width'), this.get('height')) / Math.max(bb.width, bb.height),
          cvp = this.map.viewportCentre(),
          margin = 0.0;

      // Recentre first, then zoom (there should be a way to do it with a single
      // transformation, but it eludes me now). Because `centredZoom()` takes a
      // delta, need to subtract `1.0` from `scale`, and then subtract an
      // additional amount to create an empty margin around the map's bounding
      // box.
      this.pan(cvp.x - cbb.x, cvp.y - cbb.y);
      this.centredZoom(scale - 1.0 - margin);

      this.updateHud();
      this.parent.fireGUIEvent('viewportChange');
    },

    // <a name="horizontalFlip">
    // ### horizontalFlip()

    horizontalFlip: function () {
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.flip) {
          layer.horizontalFlip();
        }
      });
      if (this.grid) {
        this.grid.update('flip');
      }
    },

    // <a name="verticalFlip">
    // ### verticalFlip()

    verticalFlip: function () {
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.flip) {
          layer.verticalFlip();
        }
      });
      if (this.grid) {
        this.grid.update('flip');
      }
    },

    // <a name="pan">
    // ### pan()

    pan: function (x, y) {
      Y.each(this.get('layers'), function (layer) {
        if (layer.can.pan) {
          layer.pan(x, y);
        }
      });
      if (this.grid) {
        this.grid.update('pan');
      }
    },

    // <a name="rotate">
    // ### rotate()

    rotate: function (arg, x, y) {
      var vc;

      // In the absence of arguments, use the viewport centre.
      if (arguments.length === 1) {
        vc = this.map.viewportCentre();
      }

      Y.each(this.get('layers'), function (layer) {
        if (layer.can.rotate) {
          layer.rotate(arg, x || vc.x, y || vc.y);
        }
      });
      if (this.grid) {
        this.grid.update('rotate');
      }
    },

    // <a name="shift">
    // ### shift()

    // This function shift the graphics layers, shimming them with visible margin
    // divs to indicate overscrolling.
    shift: function (xArg, yArg) {
      var width = this.get('width'),
          height = this.get('height'),
          clipSpec,
          x, y,
          mar = {};

      if (this.elasticDisplacement) {
        x = this.elasticDisplacement(xArg);
        y = this.elasticDisplacement(yArg);
      }
      else {
        x = xArg;
        y = yArg;
      }

      this.applyStyleToLayers('top', y + 'px');
      this.applyStyleToLayers('left', x + 'px');

      // Expand the corresponding margins
      if (x >= 1) {
        mar.l = 0;
        mar.r = width - x;
        this.margin.left.setStyle('width', x + 'px');
        this.margin.right.setStyle('width', '0px');
      }
      else if (x <= -1) {
        mar.l = -x;
        mar.r = width;
        this.margin.left.setStyle('width', '0px');
        this.margin.right.setStyle('width', -x + 'px');
      }
      else {
        mar.l = 0;
        mar.r = width;
        this.margin.left.setStyle('width', '0px');
        this.margin.right.setStyle('width', '0px');
      }

      if (y >= 1) {
        mar.t = 0;
        mar.b = height - y;
        this.margin.top.setStyle('height', y + 'px');
        this.margin.bottom.setStyle('height', '0px');
      }
      else if (y <= -1) {
        mar.t = -y;
        mar.b = height;
        this.margin.top.setStyle('height', '0px');
        this.margin.bottom.setStyle('height', -y + 'px');
      }
      else {
        mar.t = 0;
        mar.b = height;
        this.margin.top.setStyle('height', '0px');
        this.margin.bottom.setStyle('height', '0px');
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
      this.applyStyleToLayers('clip', clipSpec);
    },

    // <a name="applyStyleToLayers">
    // ### applyStyleToLayers()

    // Applies the specified style to each layer's content box. This method is
    // intended to support overscroll shift operations; use with care to apply
    // visual styles, which may need to be applyed to the canvas rather than the
    // content box.
    applyStyleToLayers: function (style, value) {
      Y.each(this.get('layers'), function (layer) {
        layer.contentBox.setStyle(style, value);
      });
    },

    // <a name="trueWorldPoint">
    // ### trueWorldPoint()

    // Creates an `SVGPoint` object mapping the given display point to
    // world co-ordinates, using the shadow layer as state keeper.
    trueWorldPoint: function (x, y) {
      return this.shadow.svgPoint(x, y).matrixTransform(
        this.shadow.groupDOMNode.getCTM().inverse()
      );
    },


    // <a name="trueVisibleWorld">
    // ### trueVisibleWorld()

    // Returns an object representing the area in the world mapped to
    // the current viewport.
    trueVisibleWorld: function () {
      var tl, bl, tr, br, c, minX, minY, maxX, maxY, diag, h, w, height, width, gridHeight, gridWidth, unit;

      width = this.get('width');
      height = this.get('height');
      unit = this.shadow.mapUnitSize();

      gridWidth = unit * Math.ceil(width / unit);
      gridHeight = unit * Math.ceil(height / unit);

      tl = this.trueWorldPoint(0, 0);
      tr = this.trueWorldPoint(width, 0);
      bl = this.trueWorldPoint(0, height);
      br = this.trueWorldPoint(width, height);
      c = this.map.viewportCentre();

      minX = [tl.x, tr.x, bl.x, br.x].min();
      minY = [tl.y, tr.y, bl.y, br.y].min();
      maxX = [tl.x, tr.x, bl.x, br.x].max();
      maxY = [tl.y, tr.y, bl.y, br.y].max();

      diag = Math.sqrt((tl.x - br.x) * (tl.x - br.x) + (tl.y - br.y) * (tl.y - br.y));
      w = diag * Math.cos(Math.atan(height / width));
      h = diag * Math.sin(Math.atan(height / width));

      return {
        tl: tl,
        tr: tr,
        bl: bl,
        br: br,
        gtl: this.trueWorldPoint(c.x - gridWidth / 2, c.y - gridHeight  / 2),
        gtr: this.trueWorldPoint(c.x + gridWidth / 2, c.y - gridHeight  / 2),
        gbl: this.trueWorldPoint(c.x - gridWidth / 2, c.y + gridHeight  / 2),
        gbr: this.trueWorldPoint(c.x + gridWidth / 2, c.y + gridHeight  / 2),
        chirality: this.shadow.groupDOMNode.getCTM().chirality(),
        rotation: this.shadow.groupDOMNode.getCTM().rotation(),
        origin: this.trueWorldPoint(0, 0),
        centre: this.trueWorldPoint(c.x, c.y),
        width: w,
        height: h,
        gridWidth: gridWidth,
        gridHeight: gridHeight,
        bbox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        }
      };
    },


    // <a name="viewportSize">
    // ### viewportSize()

    // Return the size of the map in screen units along the dimension specified
    // in the argument. Useful as an attribute wrapper in routines that iterate
    // over map dimensions.
    viewportSize: function (dimension) {
      if (dimension === 'x') {
        return this.get('width');
      }
      else if (dimension === 'y') {
        return this.get('height');
      }
      else {
        throw new Error('unkown dimension \'' + dimension + '\'');
      }
    },


    // <a name="scaleFactor">
    // ### scaleFactor()

    // Return the scale component of the current transformation.
    scaleFactor: function () {
      var t = this.parent.get('transformation');
      return Math.sqrt(t.a * t.a + t.b * t.b);
    },


    // <a name="zoomRatio">
    // ### zoomRatio()

    // Return an object whose `x` and `y` properties represent the ratio of the
    // map bounding box dimension to the corresponding viewport dimension. The
    // bounding box and the viewport are both measured in screen units.
    zoomRatio: function () {
      var bbox = this.displayBoundingBox();
      return {
        x: bbox.width / this.get('width'),
        y: bbox.height / this.get('height')
      };
    },

    // <a name="bBoxRange">
    // ### bBoxRange()

    // Return the object representing the extent of the map bounding box in
    // world units along the dimension specified in the argument. The object
    // returned is of the form:
    // {
    //   bottom: the low end of the range,
    //   top: the high end of the range,
    //   span: the extent of the range
    // }
    //
    // Note that for the horizontal dimension, `top` corresponds to "left", and
    // `bottom`, "right".
    bBoxRange: function (dimension) {
      var bbox = this.displayBoundingBox();
      if (dimension === 'x') {
        return {
          top: bbox.x,
          bottom: bbox.x + bbox.width,
          span: bbox.width
        };
      }

      if (dimension === 'y') {
        return {
          top: bbox.y,
          bottom: bbox.y + bbox.height,
          span: bbox.height
        };
      }

      throw new Error('unkown dimension \'' + dimension + '\'');
    },


    // <a name="displayBoundingBox">
    // ### displayBoundingBox()

    // Return an `(x, y, width, height)` tuple representing the bounding box of all
    // nodes rendered on all visible layers in display co-ordinates.
    displayBoundingBox: function () {
      var mbbox = this.map.displayBoundingBox(),
          lbbox = this.labels.displayBoundingBox(),
          cbbox = this.connections && this.connections.minX ? this.connections.displayBoundingBox() : mbbox,
          pbbox = this.procrustes ? this.procrustes.displayBoundingBox() : mbbox,
          dtl, dbr;

      dtl = {
        x: Math.min.apply(Math, [mbbox.x, lbbox.x, cbbox.x, pbbox.x]),
        y: Math.min.apply(Math, [mbbox.y, lbbox.y, cbbox.y, pbbox.y])
      };
      dbr = {
        x: Math.max.apply(Math, [mbbox.x + mbbox.width, lbbox.x + lbbox.width, cbbox.x + cbbox.width, pbbox.x + pbbox.width]),
        y: Math.max.apply(Math, [mbbox.y + mbbox.height, lbbox.y + lbbox.height, cbbox.y + cbbox.height, pbbox.y + pbbox.height])
      };

      return {
        x: dtl.x,
        y: dtl.y,
        width: dbr.x - dtl.x,
        height: dbr.y - dtl.y
      };
    },


    // <a name="updateDimensions">
    // ### updateDimensions()

    // The listener for `chartSizeChange` events.
    updateDimensions: function () {
      var chartSize = this.attributeOrProfileSetting('chartSize'),
          tMap, // current transformation on the map layer
          tShadow, // current transformation on the shadow
          co, // original viewport centre
          cn, // new viewport centre
          clipSpec; // clipping rectangle used in overscroll protectino

      this.setAttrs({width: chartSize.x, height: chartSize.y});

      co = this.map.viewportCentre();

      // Save the current transformation to re-apply after resize.
      tMap = this.map.groupDOMNode.getAttribute('transform');
      tShadow = this.shadow.groupDOMNode.getAttribute('transform');

      Y.each(this.get('layers'), function (layer) {
        var change = false;
        if (layer.get('width') !== chartSize.x) {
          layer.set('width', chartSize.x);
          change = true;
        }
        if (layer.get('height') !== chartSize.y) {
          layer.set('height', chartSize.y);
          change = true;
        }
        if (change) {
          layer.setDeviceDimensions(chartSize.x, chartSize.y);
        }
      });

      // This does not change the dimensions of child nodes. For that,
      // see `targetLayer.updateDimensions()`.
      this.targetLayer.setAttrs({width: chartSize.x, height: chartSize.y});

      this.shadow.groupDOMNode.setAttribute('transform', tShadow);

      if (this.grid) {
        this.grid.groupDOMNode.setAttribute('transform', 'matrix(1 0 0 1 0 0)');
        this.grid.update('resize');
      }

      this.map.groupDOMNode.setAttribute('transform', tMap);

      if (this.connections) {
        // Resising the canvas causes it to clear, so it needs to redraw itself.
        this.connections.plot();
      }

      if (this.procrustes) {
        this.procrustes.groupDOMNode.setAttribute('transform', tShadow);
      }

      if (this.map.numberOfNodes() > 0) {
        // Translate to new centre (this should be optional)
        cn = this.map.viewportCentre();
      }
      else {
        this.map.repositionMessageText();
      }

      this.margin.left.setStyle('height', chartSize.y);
      this.margin.top.setStyle('width', chartSize.x);
      this.margin.right.setStyle('height', chartSize.y);
      this.margin.bottom.setStyle('width', chartSize.x);

      clipSpec = Y.substitute(
        'rect({t}px, {r}px, {b}px, {l}px)',
        {
          t: 0,
          r: chartSize.x,
          b: chartSize.y,
          l: 0
        }
      );
      this.applyStyleToLayers('clip', clipSpec);

      this.updateHud(); // This function updates the viewport overview HUD
      this.targetLayer.updateHudDimensions(); // This updates the input HUD

      // it sucks to have to operate on the parent
      this.parent.infoLayer.updateDimensions();

      this.parent.fireGUIEvent('viewportChange');
    }, // updateDimensions()

    // Update the navigation HUD to reflect new state. Called by all
    // transformation routines.
    updateHud: function () {
      var bb = this.displayBoundingBox(),
          tl, br,
          offsetX, offsetY,
          viewportWidth = this.get('width'),
          viewportHeight = this.get('height'),
          t = this.parent.get('transformation');

      // Update the vieport indicator. First, calculate the union of the
      // viewport and the bounding box.
      tl = {
        x: Math.min(bb.x, 0),
        y: Math.min(bb.y, 0)
      };

      br = {
        x: Math.max(
          bb.x + bb.width,
          viewportWidth
        ),
        y: Math.max(
          bb.y + bb.height,
          viewportHeight
        )
      };

      if (this.hudAnimateTimer) {
        this.hudAnimateTimer.cancel();
      }

      this.targetLayer.hud.transition({
        duration: 0.2,
        opacity: 1
      });
      this.targetLayer.hud.setStyle('opacity', 1);

      // There seems to be a bug in vieBox code. It leads to incorrect results
      // when the negative co-ordinates are given for the top left corner.
      offsetX = tl.x < 0 ? -tl.x : 0;
      offsetY = tl.y < 0 ? -tl.y : 0;
      Y.Node.getDOMNode(this.targetLayer.viewportIndicatorGroup).setAttribute(
        'viewBox',
        [tl.x + offsetX, tl.y + offsetY, br.x + offsetX, br.y + offsetY].join(' ')
      );
      Y.Node.getDOMNode(this.targetLayer.bBoxIndicatorGroup).setAttribute(
        'viewBox',
        [tl.x + offsetX, tl.y + offsetY, br.x + offsetX, br.y + offsetY].join(' ')
      );

      Y.Node.getDOMNode(this.targetLayer.viewportIndicator).setAttribute('x', offsetX);
      Y.Node.getDOMNode(this.targetLayer.viewportIndicator).setAttribute('y', offsetY);
      Y.Node.getDOMNode(this.targetLayer.viewportIndicator).setAttribute('width', viewportWidth);
      Y.Node.getDOMNode(this.targetLayer.viewportIndicator).setAttribute('height', viewportHeight);

      Y.Node.getDOMNode(this.targetLayer.bBoxIndicator).setAttribute('x', bb.x + offsetX);
      Y.Node.getDOMNode(this.targetLayer.bBoxIndicator).setAttribute('y', bb.y + offsetY);
      Y.Node.getDOMNode(this.targetLayer.bBoxIndicator).setAttribute('width', bb.width);
      Y.Node.getDOMNode(this.targetLayer.bBoxIndicator).setAttribute('height', bb.height);

      // Adjust stroke-width to approximately 1px
      Y.Node.getDOMNode(this.targetLayer.bBoxIndicator).setAttribute(
        'stroke-width',
        0.75 * (br.x - tl.x) / 100
      );

      this.hudAnimateTimer = Y.later(500, this, function () {
        if (this.targetLayer && this.targetLayer.hud) { // could be already destroyed when function is called
          this.targetLayer.hud.transition({
            duration: 1.5,
            opacity: 0
          });
        }
      });
    }, // updateHud()

    showMapHud: function (mod, modList, bindingData) {
      this.targetLayer.renderHudContent(mod, modList, bindingData);

      this.targetLayer.mapHud.transition({
        duration: 0.2,
        opacity: 1
      });

      this.hudVisible = true;
    }, // showMapHud()


    hideMapHud: function () {
      // Spare some cycles
      if (!this.hudVisible) {
        return;
      }

      this.targetLayer.mapHud.transition({
        duration: 0.5,
        opacity: 0
      });

      this.hudVisible = false;
    }, // hideMapHud()


    showIButton: function () {
      this.targetLayer.iButton.transition({
        duration: 0.3,
        opacity: 1
      });

      this.iButtonVisible = true;
    }, // showIButton()


    hideIButton: function () {
      // Spare some cycles
      if (!this.iButtonVisible) {
        return;
      }

      this.targetLayer.iButton.transition({
        duration: 0.5,
        opacity: 0
      });

      this.iButtonVisible = false;
    } // hideIButton()
  },
  staticProperties: {
    // Static members and methods

    ATTRS: {
      layers: {
        value: []
      },

      width: {
        getter: function (val) {
          if (Y.Lang.isString(val)) {
            return parseInt(val.split('px')[0], 10);
          }
          return val;
        },
        validator: function (val) {
          /* unsigned integer; accept truncated floating-point values */
          return val.toString().search(/^[0-9]+$/) === 0;
        }
      },

      height: {
        getter: function (val) {
          if (Y.Lang.isString(val)) {
            return parseInt(val.split('px')[0], 10);
          }
          return val;
        },
        validator: function (val) {
          /* unsigned integer; accept truncated floating-point values */
          return val.toString().search(/^[0-9]+$/) === 0;
        }
      },

      // <a name="chartSize">
      //
      // The attribute representing the chart dimensions in pixels:
      //
      //         {x: width, y: height}
      chartSize: {
        validator: function (arg) {
          if (arg === undefined) {
            return true;
          }
          if (
            Y.Lang.isObject(arg) &&
              Y.Lang.isNumber(arg.x) &&
                Y.Lang.isNumber(arg.y) &&
                  arg.x >= this['default'].minSize &&
                    arg.y >= this['default'].minSize) {
            return true;
          }
          return false;
        }
      },

      // The lower zoom limit. Can't zoom farther out than this.
      zoomLimit: {
        value: 0.8
      }
    }
  }
};

Y.namespace('ACMACS').LayerStackWidget = Y.Base.create(
  "acmacsLayerStackWidget",
  Y.Widget,
  [Y.ACMACS.WidgetTreeNode],
  code.prototypeProperties,
  code.staticProperties
);

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
