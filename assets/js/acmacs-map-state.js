/*global Y: false */
/*jslint regexp: false */

YUI.add('acmacs-map-state', function(Y) {
/**
 * Interactive ACMACS map widget
 *
 * @module acmacs-map
 * @main acmacs-map
 */

/**
 * Provides state management for the ACMACS map widget
 *
 * @module acmacs-map
 * @submodule acmacs-map-state
 */

/**
 * This is a compound widget hosting several other widgets, incliding
 * map-rendering widgets and surrounding controls.
 *
 * @example
     widget =  new Y.ACMACS.MapWidget({
       data: Y.ACMACS.bjorn6x5Data,
       chartSize: {x: 600, y: 400},
       background: 'gradient',
       menu: false,
       render: testbed
     });

 * @namespace ACMACS
 * @class MapWidget
 * @constructor
 * @extends Widget
 * @uses ACMACS.MapWidgetInteractivity, ACMACS.MapWidgetUI
 */


// ---------------------------------------------------------------
// C U S T O M   E V E N T S
// ---------------------------------------------------------------

/**
 * Fired on [`data`](#attr_data) attribute change.
 *
 * One special case of `data` change occurs when when the user drags
 * points on the map. In that case, the event fired by setting
 * `MapWidget.data` attribute in `MapLayer`.
 *
 * Listener: an anonymous function that resets and replots the map.
 *
 * @event dataChange
 * @param {String} modified Names the data attribute modified by
 *   user action (currently the only attribute modified is `layout`)
 */

/**
 * Fired after any of these attributes changes its value:
 *
 * * [`connectionsLayerVisible`](#attr_connectionsLayerVisible)
 * * [`labelsVisible`](#attr_labelsVisible)
 * * [`procrustesLayerVisible`](#attr_procrustesLayerVisible)
 * * [`renderConnectionLines`](#attr_renderConnectionLines)
 * * [`renderErrorLines`](#attr_renderErrorLines)
 *
 * @event stateChange
 * @param {String} attrName The name of the attribute whose change fired this event
 * @param {Number} newVal The new value of this attribute
 */

/**
 * Fired on [`selected`](#attr_selected) attribute change.
 *
 * This attribute keeps track of the number of selected points.
 * The list of selected points can be obtained at any moment with
 * the [`listSelectedPoints`](#method_listSelectedPoints) method.
 *
 * @event selectedChange
 * @param {Number} newVal The current number of selected points
 */

/**
 * Fired after each user-directed style change.
 *
 * Fired in: `MapWidget`
 *
 * There are no internal listeners to this event.
 *
 * @event pointStyleChange
 * @param {Array} affectedPoints A list of points affected by style change
 * @param {Object} styleApplied An object listing styles that were applied
 *   to each point
 */

/**
 * Fired after each transformation, icluding initial data plotting
 * and the change of viewport dimensions.
 *
 * Fired in: `MapWidget`, `LayerStackWidget`
 *
 * There are no internal listeners to this event. It carries no payload.
 *
 * @event viewportChange
 */

/**
 * Fired after each rotation or reflection.
 *
 * Fired in `LayerStackWidget`
 *
 * There are no internal listeners to this event. It carries no payload.
 *
 * @event orientationChange
 */

/**
 * Fired when a `mousemove` event occurs over the blank canvas.
 * The payload property, `message`, describes translation
 * from viewport co-ordinates to world.
 *
 * Fired in: `LayerStackWidget`
 *
 * There are no internal listeners to this event.
 *
 * @event pointer-over-canvas
 * @param {Integer} x Pointer offset in pixels from the left edge of the widget
 * @param {Integer} y Pointer offset in pixels from the top edge of the widget
 * @param {Integer} wx Pointer co-ordinate in world units
 * @param {Integer} wy Pointer co-ordinate in world units
 * @param {String} message
 * @example
      (5,272) → (-0.422,0.275)
 */

/**
 * Fired when the pointer moves out of the last point in a stack of
 * overlapping points. The [`pointer-over-canvas`](#event_pointer-over-canvas)
 * event is fired at the same time; the difference between the two events is that
 * `point-abandoned` fires only once, while `pointer-over-canvas` continues
 * to replicate `mousemove` events until the next time a point is hit.
 * a stack of points'.
 *
 * Fired in: `LayerStackWidget`
 *
 * There are no internal listeners to this event.
 *
 * @event point-abandoned
 * @param {Integer} x Pointer offset in pixels from the left edge of the widget
 * @param {Integer} y Pointer offset in pixels from the top edge of the widget
 * @param {Integer} wx Pointer co-ordinate in world units
 * @param {Integer} wy Pointer co-ordinate in world units
 */

/**
 * Fired when a `mousemove` event occurs over a point or
 * a stack of points'.
 *
 * All points hit by this event are listed in the
 * `targetList` property.
 *
 * Fired in: `LayerStackWidget`
 *
 * There are no internal listeners to this event.
 *
 * @event point-hit
 * @param {Integer} x Pointer offset in pixels from the left edge of the widget
 * @param {Integer} y Pointer offset in pixels from the top edge of the widget
 * @param {Array} targetList
 * @example
     [
       {
         label: 'point label 1',
         pointObject: MapPoint
       },
       {
         label: 'point label 2',
         pointObject: MapPoint
       },
       . . .
     ]
 */

/**
 * Fired in response to a (modified) `mousedown` event
 * (Meta-click), toggling point selection.
 *
 * All points hit by this event are listed in the
 * `targetList` property.
 *
 * Fired in: `LayerStackWidget`
 *
 * Listener: `MapWidget.toggleEventTarget()`
 *
 * @event point-clicked
 * @param {Integer} x Pointer offset in pixels from the left edge of the widget
 * @param {Integer} y Pointer offset in pixels from the top edge of the widget
 * @param {Array} targetList
 * @example
     [
       {
         label: 'point label 1',
         pointObject: MapPoint
       },
       {
         label: 'point label 2',
         pointObject: MapPoint
       },
       . . .
     ]
 */

/**
 * Fired in response to a `mousedown` event immediately
 * followed by `mouseup` event.
 *
 * Fired in: `LayerStackWidget`
 *
 * There are no internal listeners to this event.
 *
 * @event label-clicked
 * @param {Integer} x Pointer offset in pixels from the left edge of the widget
 * @param {Integer} y Pointer offset in pixels from the top edge of the widget
 * @param {Node} label Text node clicked
 */

/**
 * Fires a set period of time after pointer movement has ceased.
 *
 * Fired in: `LayerStackWidget`
 *
 * Listeners: `MapWidget.mousemoveEnd`
 *
 * @event mousemove-end
 * @param {Integer} x Pointer offset in pixels from the left edge of the widget
 * @param {Integer} y Pointer offset in pixels from the top edge of the widget
 * @param {Node} label Text node clicked
 */

var code = {
  // ## Prototype properties
  prototypeProperties: {

    /**
     * Parameters affecting appearance or behaviour. They provide
     * sane defaults in the absence of external configuration.
     *
     * @property {Object} default
     * @property {Integer} default.minSize 50
     * @private
     */
    'default': {
      // <a name="minSize">
      // Miminum chart size (used in `chartSize` validator). Applies to both
      // width and height.
      minSize: 50
    },

    /**
     * Reference to the stack of map layers
     *
     * @property {LayerStackWidget} layerStack
     * @private
     */
    layerStack: null,

    /**
     * Reference to TargetLayer's `contentBox`, the z-top node in the
     * widget that serves as a UI event target
     *
     * @property {Node} targetNode
     * @private
     */
    targetNode: null,

    /**
     * Reference to the sidebar menu
     *
     * @property {SidebarWidget} sidebar
     * @private
     */
    sidebar: null,

    /**
     * The names of all attributes representing the widget's state
     *
     * This is essentially an ordered hash represented by an array of keys.
     * It specifies both the names of the attributes to save and the order
     * in which they must be restored.
     *
     * @property {Object} stateAttributes
     * @property {Boolean} statAttributes.background (`true`) Save widget background setting
     * @property {Boolean} statAttributes.chartSize (`true`) Save current size settings
     * @property {Boolean} statAttributes.connectionsLayerVisible (`true`) Save connections layer visibility
     * @property {Boolean} statAttributes.connectionsMax (`true`) Save the maximum number of connection lines
     * @property {Boolean} statAttributes.empty (`true`) Emptiness is saved to prevent interactions with empty widgets
     * @property {Boolean} statAttributes.labelScale (`true`) Save label scale (not sure this must be done, given that scale will vary from point to point)
     * @property {Boolean} statAttributes.labelSizeCalibration (`true`) Save label size calibration (if it ever gets changed; presently it does not)
     * @property {Boolean} statAttributes.labelsVisible (`true`) Save label layer visibility (this should not be done, as label visibility will vary from point to point)
     * @property {Boolean} statAttributes.labelType (`true`) Save label type (assuming all points have the same label type)
     * @property {Boolean} statAttributes.menu (`true`) Save sidebar menu availability
     * @property {Boolean} statAttributes.pointScale (`true`) Save point scale (not sure this must be done, given that scale will vary from point to point)
     * @property {Boolean} statAttributes.pointSizeCalibration (`true`) Save point size calibration (if it ever gets changed; presently it does not)
     * @property {Boolean} statAttributes.procrustesLayerVisible (`true`) Save procrustes layer visibility
     * @property {Boolean} statAttributes.procrustesDistanceThreshold (`true`) Save the minimum procrustes distance
     * @property {Boolean} statAttributes.renderConnectionLines (`true`) Save connection lines' visibility
     * @property {Boolean} statAttributes.renderErrorLines (`true`) Save error lines' visibility
     * @property {Boolean} statAttributes.selected (`true`) Save the number of points in selection
     * @property {Boolean} statAttributes.selection (`true`) Save the list of selected points (it is a non-attribute, so is an exception)
     * @property {Boolean} statAttributes.transformation (`true`) Save the current viewing transformation
     * @private
     */
    stateAttributes: {
      '00': 'background',
      '01': 'chartSize',
      '02': 'connectionsLayerVisible',
      '03': 'connectionsMax',
      '04': 'empty',  // emptiness is saved to prevnent interactions with empty widgets
      '05': 'labelScale',
      '06': 'labelSizeCalibration',
      '07': 'labelsVisible',
      '08': 'labelType',
      '09': 'pointScale',
      '10': 'pointSizeCalibration',
      '11': 'procrustesLayerVisible',
      '12': 'procrustesDistanceThreshold',
      '13': 'renderConnectionLines',
      '14': 'renderErrorLines',
      '15': 'selected', // the number of points in selection
      '16': 'selection', // not quite an attribute; enumerates selected points
      '17': 'transformation'
    },

    /**
     * Initial viewing transformation as received with the data
     * @property {SVGMatrix} viewingTransformation
     * @private
     */
    viewingTransformation: null,

    /**
     * Setting this property delayis rendering on attribute change,
     * allowing the simultaneous update of multiple attributes.
     *
     * @property {Boolean} delayRendering
     * @private
     */
    delayRendering: false,

    /**
     * The hash of point styles. It allows the reuse of existing styles
     * when point styles are changed by the user.
     *
     * Possibly confusing: there is a `styleIndex` property in the normalised
     * data object sent to `map.plot()`.
     *
     * @property {Object} styleIndex
     * @private
     */
    styleIndex: null,

    // ## Method summary
    // * **Life cycle methods**
    //   * **[initializer](#initializer)**(config)
    //   * **[destructor](#destructor)**()
    // * **Event bindings**
    //   * **[bindUI](#bindUI)**()
    //   * **[fireGUIEvent](#fireGUIEvent)**(_e_)
    // * **Composition methods**
    //   * *[renderUI](acmacs-map-ui.html#renderUI)*()  [_in acmacs-map-ui.js_]
    //   * *[syncUI](acmacs-map-ui.html#syncUI)*()  [_in acmacs-map-ui.js_]
    //   * **[plot](#plot)**()
    //   * *[toggleSidebar](acmacs-map-ui.html#toggleSidebar)*()  [_in acmacs-map-ui.js_]
    //   * *[resizeMapContainer](acmacs-map-ui.html#resizeMapContainer)*()  [_in acmacs-map-ui.js_]
    // * **State methods**
    //   * **[listSelectedPoints](#listSelectedPoints)**()
    //   * **[selectPoints](#selectPoints)**()
    //   * **[clearSelection](#clearSelection)**()
    //   * **[toggleEventTarget](#toggleEventTarget)**(e)
    //   * **[labelsOn](#labelsOn)**()
    //   * **[labelsOff](#labelsOff)**()
    //   * **[labelVisibility](#labelVisibility)**()
    //   * **[setPointStyle](#setPointStyle)**(arg)
    //   * **[getState](#getState)**()
    //   * **[setState](#setState)**(o)


    // ------------------------------------------------------------------------
    // ## Life cycle methods

    /**
     * A `Base` lifecycle method.
     *
     * It initialises instance properties to prevent them from
     * being interpreted as prototype properties and thus shared
     * among all widget instances.
     *
     * @method initializer
     * @param {Object} config Contains values passed to `Base` constructor (not used)
     * @private
     */
    initializer: function (config) {
      // The config argument has the values passed to the Y.Base constructor.
      // It is not used here; retained as a reminder of the possibility to
      // examine the arguments of the parent constructor.

      // All properties of `this` need to be initialised in order to work as
      // instance variables.  Otherwise they will become properties of the
      // prototype.
      this.rootWidget = this;
      this.children = [];

      this.listeners = [];
      this.uiListeners = [];
      this.namedListeners = {};
    },

    /**
     * A `Base` lifecycle method.
     *
     * It cleans up the DOM on destruction.
     *
     * @method destructor
     * @private
     */
    destructor: function () {
      this.detachListeners();
      if (this.sidebar) {
        this.sidebar.destroy(true);
        this.toggleButton.destroy(true);
      }

      this.layerStack.destroy(true);
      this.targetNode = undefined;

      this.sidebar = this.layerStack = this.toggleButton = undefined;
      this.children = this.rootWidget = undefined;
      this.toggleButtonWidth = undefined;

      this.viewingTransformation = undefined;
    },

    detachListeners: function () {
      Y.each([this.listeners, this.uiListeners, this.namedListeners], function (list) {
        Y.each(list, function (handle, key) {
          handle.detach();
        });
      });
      this.listeners = [];
      this.uiListeners = [];
      this.hudHelpDelayTimer = undefined;
    },

    // ------------------------------------------------------------------------
    // ## Event Bindings

    /**
     * A `Widget` lifecycle method
     *
     * Set up event bindings to communicate changes between the UI and state.
     *
     * @method bindUI
     * @private
     */
    bindUI: function () {
      // * Set initial bindings for navigation mode
      if (this.modalBindings !== undefined) {
        this.setModalBindings('navigation');
      }

      if (this.get('menu')) {
        // <a name="sidebar-visibleChange">
        //
        // * Map widget needs to resize when sidebar shows or hides itself.
        this.listeners.push(this.sidebar.after(
          'visibleChange', this.resizeMapContainer, this
        ));

        // <a name="layerstack-layersChange">
        //
        // * Update the layer menu in the sidebar to reflect the changes in layer
        // composition.
        this.listeners.push(this.layerStack.after(
          'layersChange', Y.bind(this.sidebar.renderLayersMenu, this.sidebar)
        ));
      }

      // <a name="chartSizeChange">
      //
      // * Also, it needs to resize when the `chartSize` setting changes.
      this.listeners.push(Y.ACMACS.profile.after(
        'chartSizeChange', this.resizeMapContainer, this
      ));
      this.listeners.push(this.after(
        'chartSizeChange', this.resizeMapContainer
      ));

      // * Profile change events for transferring the new profile settings to all
      // unconfigured map widgets.
      this.listeners.push(Y.ACMACS.profile.after('pointSizeCalibrationChange',
        function () {
          this.set('pointSizeCalibration'); // Implicitly, from Y.ACMACS.profile
        },
        this
      ));

      this.listeners.push(Y.ACMACS.profile.after('pointScaleChange',
        function () {
          this.set('pointScale');
        },
        this
      ));

      this.listeners.push(Y.ACMACS.profile.after('labelSizeCalibrationChange',
        function () {
          this.set('labelSizeCalibration');
        },
        this
      ));

      this.listeners.push(Y.ACMACS.profile.after('labelScaleChange',
        function () {
          this.set('labelScale');
        },
        this
      ));

      this.listeners.push(Y.ACMACS.profile.after('labelTypeChange',
        function (e) {
          this.set('labelType');
        },
        this
      ));

      this.listeners.push(Y.ACMACS.profile.after('labelsVisibleChange',
        function (e) {
          this.set('labelsVisible');
        },
        this
      ));

      this.listeners.push(Y.ACMACS.profile.after('hudFillColorChange',
        function (e) {
          this.layerStack.targetLayer.hudFillRectangle.set('fill', e.newVal);
        },
        this
      ));

      this.listeners.push(Y.ACMACS.profile.after('hudFillOpacityChange',
        function (e) {
          this.layerStack.targetLayer.hudMaskRectangle.set(
            'fill',
            Y.ACMACS.opacity2Color(e.newVal)
          );
        },
        this
      ));

      // <a name="dataChange">
      //
      // * Setting the data attribute means the chart needs to be replotted. Not
      // doing that in the attribute's setter because the plot() method assumes
      // the data is complete and consistent.
      this.listeners.push(this.after(
        'dataChange', function (e) {
          // The assumption here is that `data.layout` can only be changed by the
          // widget itself, so it does not need a replot when that happens.
          if (e.modified && e.modified === 'layout') {
            Y.log(['dataChange, modified = ' + e.modified, e]);
            if (this.layerStack.connections) {
              Y.log('dataChange, layerStack.connections.clear()');
              this.layerStack.connections.clear();
            }
            this.get('data').error_lines = undefined;
          }
          else {
            Y.log(['dataChange, layerStack.clear()', e]);
            this.layerStack.clearLayers();
            this.plot();
          }
        }, this
      ));

      this.listeners.push(this.after(
        [
          'connectionsLayerVisible',
          'labelsVisible',
          'procrustesLayerVisible',
          'renderConnectionLines',
          'renderErrorLines'
        ].map(function (attr) {
          return attr + 'Change';
        }),
        function (e) {
          this.fireGUIEvent('stateChange', e);
        },
        this
      ));

      // <a name="toggleButton-click">
      //
      // * Show or hide the sidebar menu.
      if (this.get('menu')) {
        this.listeners.push(this.toggleButton.on('click',
          this.toggleSidebar, this
        ));
      }
    }, // bindUI()


    /**
     * Fire an event on behalf of a component widget. Also, a `viewportChange`
     * event is fired from our own `plot()` method.
     *
     * @method fireGUIEvent
     * @param {String} type Event type
     * @param {EventFacade} e Event payload
     * @protected
     */
    fireGUIEvent: function (type, e) {
      this.fire(type, e);
    },


    /**
     * Grab focus
     *
     * This method selects one widget out of possibly multiple widgets on the
     * page to own keyboard events.
     *
     * It is related, but not the same as keyboard focus provided by the host GUI.
     * It instructs the widget to respond to all `keydown` and `keyup` events, to
     * allow modified mouse events. Widgets that are not presently in * focus
     * ignore such events.
     *
     * @method focus
     */
    focus: function () {
      Y.ACMACS.selectedMapWidget = this;
    },


    /**
     * Release focus (stop responding to `keyup` and `keydown` events)
     *
     * @method defocus
     */
    defocus: function () {
      Y.ACMACS.selectedMapWidget = null;
    },

    // ------------------------------------------------------------------------
    // ## Composition methods

    /**
     * Sort through map data storted in the [data](#attr_data) attribute and
     * dispatch plotting jobs to specialized stack layers.
     *
     * @method plot
     * @param {Object} [arg] Optional plot parameters
     * @param {Array} [arg.selection] list of numeric IDs of poits to be selected
     */
    plot: function (arg) {
      var initialTransformation,
          chartSize = this.attributeOrProfileSetting('chartSize'),
          data = this.get('data');

      // Hash all point styles to allow testing for style equality later.
      this.styleIndex = {};
      Y.each(data.styles.styles, Y.bind(function (style, i) {
        this.styleIndex[Y.ACMACS.stringify(style)] = i;
      }, this));

      this.viewingTransformation = this.composeSvgViewingTransformation({
        width: chartSize.x,
        height: chartSize.y,
        data: data
      });

      Y.log(this.viewingTransformation);

      this.layerStack.map.clear();
      // Apply the same viewing transformation to map layer and shadow layer,
      this.layerStack.map.groupDOMNode.setAttribute(
        'transform',
        this.viewingTransformation.asMatrixString
      );
      this.layerStack.shadow.groupDOMNode.setAttribute(
        'transform',
        this.viewingTransformation.asMatrixString
      );
      this.layerStack.shadow.viewportGroup.setAttribute(
        'transform',
        this.viewingTransformation.asMatrixString
      );

      // The label layer must be scaled up to allow small font sizes.
      // Because of Safari's hostility to frational units, fonts must be
      // sized in pixels.
      this.layerStack.labels.groupDOMNode.setAttribute(
        'transform',
        'matrix(0.5 0 0 0.5 0 0)'
      );

      this.layerStack.shadow.setPixelSize();
      this.layerStack.map.setPixelSize();

      this.layerStack.labels.clear();
      this.layerStack.labels.setPixelSize();
      this.layerStack.labels.scale = this.layerStack.labels.onePixel / this.layerStack.map.onePixel;

      if (this.get('initialTransformation')) {
        initialTransformation = this.get('initialTransformation');
      }
      else {
        initialTransformation = Y.ACMACS.newSVGMatrix();
        initialTransformation.a = data.transformation[0][0];
        initialTransformation.b = data.transformation[0][1];
        initialTransformation.c = data.transformation[1][0];
        initialTransformation.d = data.transformation[1][1];
      }
      this.layerStack.shadow.initGroup.getDOMNode().applyTransformation(initialTransformation);

      // This subtle data-munging is done to make the data layout a bit more
      // readable in layer code.
      this.layerStack.map.plot({
        style: data.styles.styles,
        scale: data.scale,
        renderingOrder: data.styles.drawing_order,
        styleIndex: data.styles.points,
        point: data.layout,
        pointInfo: data.point_info,
        // If we pay attention to data.show_labels, it needs to be altered and saved in sync
        // with labelsVisible.
        // showLabels: this.attributeOrProfileSetting('labelsVisible') || data.show_labels
        showLabels: this.attributeOrProfileSetting('labelsVisible')
      });

      if (arg && arg.selected) {
        this.layerStack.map.applySelection(arg.selected);
      }

      this.layerStack.map.simulateTransformation(initialTransformation);

      // Apply the viewing transformation to connections layer, followed by the
      // initial transformation from the data or from stored state, then call the
      // plot() method.
      if (this.layerStack.connections) {
        if (this.layerStack.connections.kind === 'SVG') {
          this.layerStack.connections.groupDOMNode.setAttribute(
            'transform',
            this.viewingTransformation.asMatrixString
          );
          this.layerStack.connections.clear();
          this.layerStack.connections.setPixelSize();
          this.layerStack.connections.plot();
          this.layerStack.connections.applyTransformation(
            this.layerStack.connections.groupDOMNode.getCTM().multiply(initialTransformation)
          );

          // Need to compensate for the change in thickness, because it is only
          // done automatically inside the zoom() method.
          Y.each(this.layerStack.connections.groupDOMNode.childNodes, function (el) {
            var strokeWidth = el.getAttribute('stroke-width');
            el.setAttribute('stroke-width', strokeWidth / Math.abs(initialTransformation.a));
          });
        }
        else if (this.layerStack.connections.kind === 'canvas') {
          this.layerStack.connections.plot();
        }
        else {
          throw new Error(
            'unknown connections layer type "' +
            this.layerStack.connections.kind + '"'
          );
        }
      }

      // Apply the viewing transformation to procrustes layer, followed by the
      // initial transformation from the data or from stored state, then call
      // the plot() method.
      if (this.layerStack.procrustes) {
        if (this.layerStack.procrustes.kind === 'SVG') {
          Y.log('**** plotting SVG procrustes ****');
          this.layerStack.procrustes.groupDOMNode.setAttribute(
            'transform',
            this.viewingTransformation.asMatrixString
          );
          this.layerStack.procrustes.clear();
          this.layerStack.procrustes.setPixelSize();
          this.layerStack.procrustes.plot();
          this.layerStack.procrustes.applyTransformation(
            this.layerStack.procrustes.groupDOMNode.getCTM().multiply(initialTransformation)
          );

          // Need to compensate for the change in thickness, because it is only
          // done automatically inside the zoom() method.
          Y.each(this.layerStack.procrustes.groupDOMNode.childNodes, function (el) {
            var strokeWidth = el.getAttribute('stroke-width');
            el.setAttribute('stroke-width', strokeWidth / Math.abs(initialTransformation.a));
          });
        }
        else if (this.layerStack.procrustes.kind === 'canvas') {
          Y.log('**** plotting procrustes on canvas ****');
          this.layerStack.procrustes.plot();
        }
        else {
          throw new Error(
            'unknown procrustes layer type "' +
            this.layerStack.procrustes.kind + '"'
          );
        }
      }

      // Apply the same initial transformation to the shadow layer, so it can
      // track changes on the map layer.
      this.layerStack.shadow.applyTransformation(
        this.layerStack.shadow.groupDOMNode.getCTM().multiply(initialTransformation)
      );

      if (this.layerStack.grid) {
        this.layerStack.grid.update('init');
      }

      // This goes around Chrome's reluctance to do the initial rendering of
      // certain sizes of labels.
      this.layerStack.labels.touch();

      this.set('initialTransformation', initialTransformation);
      this.layerStack.updateHud();
      this.fireGUIEvent('viewportChange');

      this.set('empty', false);
    }, // plot()


    /**
    * Creates a transformation of the viewable world to an SVG viewport of
    * possibly incongruent geometry.  The mapping is done so that all points fall within
    * the _viewport projection_ onto the world without distortion or clipping.
    *
    * The function returns a literal object with three properties describing the
    * viewing transformation:
    *
    *  * **matrix**: an SVGMatrix
    *  * **asMatrixString**: a parseable string suitable as a value of a node's
    *    `transform` attribute
    *  * **rotation**: the rotational component expressed in degrees
    *  * **viewport**: the original viewport in world co-ordinates
    *  * **transformedViewport**: transformed viewport in world co-ordinates
    *
    * <span style="color: brown">_**Note**_: The map data sent by the ACMACS
    * backend contains properties named `viewport_origin` and `viewport_size`,
    * which define the _reverse mapping_ of the viewport. To avoid confusion with
    * the <em>physical SVG viewport</em>, which is defined as a rectangle on the
    * display surface, the backend data is immediately transformed into a
    * structure where these elements are referred to as `viewportWorldOrigin` and
    * `viewportWordlSize`. This transformation is performed inside
    * `Y.ACMACS.MapWidget`</span>
    *
    * @method composeSvgViewingTransformation
    * @private
    * @param {Object} arg
    * @param {Number} arg.width Viewport width
    * @param {Number} arg.height Viewport height
    * @param {Object} arg.data Chart data (the contents of the `data` attribute)
    * @return {Object} Viewing transformation in string and matrix forms and transformation details
    */
    composeSvgViewingTransformation: function (arg) {
      //
      var scale,
          offsetX,
          offsetY,
          minX = 0,
          minY = 0,
          maxX = 0,
          maxY = 0,
          tMinX = 0,
          tMinY = 0,
          tMaxX = 0,
          tMaxY = 0,
          viewportWorldSize,
          viewportWorldOrigin,
          transformedViewportWorldSize,
          transformedViewportWorldOrigin,
          svgMatrix,
          point = Y.ACMACS.newSVGPoint(),
          initialTransformation,
          list = [];

      // Find the bounding box for map points transformed with
      // the initial transformation specified in the data.
      initialTransformation = Y.ACMACS.newSVGMatrix({
        a: arg.data.transformation[0][0],
        b: arg.data.transformation[0][1],
        c: arg.data.transformation[1][0],
        d: arg.data.transformation[1][1],
        e: 0,
        f: 0
      });
      Y.each(arg.data.layout, function (p, i) {
        var tp;

        if (isNaN(p[0]) || p[0] === null || p[0] === undefined) {
          return;
        }
        if (isNaN(p[1]) || p[1] === null || p[1] === undefined) {
          return;
        }

        point.x = p[0];
        point.y = p[1];
        tp = point.matrixTransform(initialTransformation);

        if (tp.x <= tMinX) {
          tMinX = tp.x;
        }
        if (tp.y <= tMinY) {
          tMinY = tp.y;
        }
        if (tp.x >= tMaxX) {
          tMaxX = tp.x;
        }
        if (tp.y >= tMaxY) {
          tMaxY = tp.y;
        }

        if (point.x <= minX) {
          minX = point.x;
        }
        if (point.y <= minY) {
          minY = point.y;
        }
        if (point.x >= maxX) {
          maxX = point.x;
        }
        if (point.y >= maxY) {
          maxY = point.y;
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

      transformedViewportWorldSize = [
        1.25 * (tMaxX - tMinX),
        1.25 * (tMaxY - tMinY)
      ];
      transformedViewportWorldOrigin = [
        (tMinX + tMaxX - transformedViewportWorldSize[0]) / 2,
        (tMinY + tMaxY - transformedViewportWorldSize[1]) / 2
      ];

      // The scale factor is calculated so that the scaled viewport image can
      // entirely fit within the display area. No assumption of proportionality
      // can be made because it is possible that the stored viewport image
      // was saved in a past session by another viewer with different
      // viewport settings.
      scale = Math.min(
        arg.width / transformedViewportWorldSize[0], arg.height / transformedViewportWorldSize[1]
      );

      // And now it needs to be centred within the current viewport.
      offsetX = (arg.width - scale * transformedViewportWorldSize[0]) / 2;
      offsetY = (arg.height - scale * transformedViewportWorldSize[1]) / 2;

      svgMatrix = Y.ACMACS.newSVGMatrix({
        a: scale,
        b: 0,
        c: 0,
        d: scale,
        e: offsetX - transformedViewportWorldOrigin[0] * scale,
        f: offsetY - transformedViewportWorldOrigin[1] * scale
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
        rotation: Math.atan2(svgMatrix.b, svgMatrix.d) * 360 / (2 * Math.PI),
        viewport: {
          x: viewportWorldOrigin[0],
          y: viewportWorldOrigin[1],
          width: viewportWorldSize[0],
          height: viewportWorldSize[1]
        },
        transformedViewport: {
          x: transformedViewportWorldOrigin[0],
          y: transformedViewportWorldOrigin[1],
          width: transformedViewportWorldSize[0],
          height: transformedViewportWorldSize[1]
        }
      };
    }, // composeViewingTransformation()


    // ------------------------------------------------------------------------
    // ## State methods


    // ----------------------- S E L E C T I O N ----------------------------

    /**
     * Select points whose data indices are given in the `set` argument,
     * clearing pre-existing selection if the `replace` argument is truthy,
     * otherwise adding to existing selection.
     *
     * @method selectPoints
     * @param {Array|Object|Number|String} set The list or boolean hash of
     *   point indices, a single index,  or a keyword describing the set
     *   (`'all'`, `'selected'`, `'unselected'`, `'if_label_invisible'`)
     * @param {Boolean|String} replace Clear existing selection
     * @param {Boolean|String} enlarge Enlarge selected points
     * @chainable
     */
    selectPoints: function (set, replace, enlarge) {
      var selectHash;
      if (typeof set === 'object') {
        if (Y.Lang.isArray(set)) {
          selectHash = {};
          Y.each(set, function (el) {
            selectHash[el] = true;
          });
        }
        else {
          selectHash = set;
        }

        Y.each(this.layerStack.map.pointList, Y.bind(function (p) {
          if (selectHash[p.index] === undefined) {
            if (replace) {
              selectHash[p.index] = false;
            }
            else {
              selectHash[p.index] = p.selected;
            }
          }
        }, this));
      }
      else if (typeof set === 'number' && set % 1 === 0) {
        selectHash = {};
        selectHash[set] = true;
        Y.each(this.layerStack.map.pointList, Y.bind(function (p) {
          if (p.index !== set) {
            if (replace) {
              selectHash[p.index] = false;
            }
            else {
              selectHash[p.index] = p.selected;
            }
          }
        }, this));
      }
      else if (set === 'all') {
        selectHash = {};
        Y.each(this.layerStack.map.pointList, Y.bind(function (p) {
          selectHash[p.index] = true;
        }, this));
      }
      else {
        throw new Error('selectPoints(): cannot apply selection to ' + set);
      }
      this.layerStack.map.applySelection(selectHash, enlarge);
      return this;
    },


    /**
     * Deselect points whose data indices are given in the `set` argument,
     *
     * @method deselectPoints
     * @param {Array|Number|String} set The list of point indices, a single
     *   scalar index, or `'all'`
     * @chainable
     */
    deselectPoints: function (set) {
      var selectHash = {};
      if (Y.Lang.isArray(set)) {
        Y.each(set, function (el) {
          selectHash[el] = false;
        });
      }
      else if (typeof set === 'number' && set % 1 === 0) {
        selectHash[set] = false;
      }
      else if (set === 'all') {
        Y.each(this.layerStack.map.pointList, Y.bind(function (p) {
          if (p.selected) {
            selectHash[p.index] = false;
          }
        }, this));
      }
      else {
        throw new Error('selectPoints(): cannot apply selection to ' + set);
      }
      this.layerStack.map.applySelection(selectHash);
      return this;
    },


    /**
     * Toggle the selection state of points whose data indices are given
     * in the `set` argument.
     *
     * @method toggleSelection
     * @param {Array|Number|String} set The list of point indices, a single
     *   scalar index, or `'all'`
     * @chainable
     */
    toggleSelection: function (set, enlarge) {
      var selectHash = {};
      if (Y.Lang.isArray(set)) {
        Y.each(set, function (el) {
          selectHash[el] = true;
        });
      }
      else if (typeof set === 'number' && set % 1 === 0) {
        selectHash[set] = true;
      }
      else if (set === 'all') {
        Y.each(this.layerStack.map.pointList, Y.bind(function (p) {
          selectHash[p.index] = true;
        }, this));
      }
      else {
        throw new Error('selectPoints(): cannot toggle selection for ' + set);
      }
      this.layerStack.map.toggleSelection(selectHash, enlarge);
      return this;
    },


    /**
     * Select all points and update their style attributes to indicate selection.
     *
     * @method selectAllPoints
     * @chainable
     */
    selectAllPoints: function (enlarge) {
      this.selectPoints('all', false, enlarge);
      return this;
    },


    /**
     * Reset the selected state and style attributes of all points in selection.
     *
     * @method clearSelection
     * @chainable
     */
    clearSelection: function () {
      this.layerStack.map.clearSelection();
      return this;
    },


    /**
     * Invert the selection status of each point on the event target list and
     * indicate status change visually, by changing point style.
     *
     * This method is used as a `point-clicked` event handler, so it receives
     * an `EventFacade` as argument.
     *
     * @method toggleEventTarget
     * @private
     * @param {EventFacade} e
     * @param {Array} e.targetList The list of points hit by a click event
     */
    toggleEventTarget: function (e) {
      Y.each(e.targetList, function (item) {
        item.pointObject.toggle();
      });
      this.layerStack.map.syncSelected();
    },


    /**
     * Return data indices of selected points.
     *
     * @method listSelectedPoints
     * @return {Array} The list of indices of selected points
     */
    listSelectedPoints: function () {
      return this.layerStack.map.listSelectedPoints();
    },


    /**
     * Test selection state for a point, a set of points or the entire map.
     *
     * @method selected
     * @param {null|Number|Array|String} set The set of points to test, specified in one of these forms:
     *   * **not provided**: return the number of selected points
     *   * **integer (point index)**: return selection state for the point at that index
     *   * **array (list of point indices)**: return an object of boolean values indicating selection state for each point on the list
     *   * **string (`'all'`, `'selected'`, `'unselected'`)**: return an object of boolean
     *     values indicating selection state for each point on the map, for each selected
     *     point, and for each point outside selection, respectively
     * @return {Number|Boolean|Object} Assertion of selection state in one of alternative forms depending on the argument
     */
    selected: function (set) {
      var list = {};

      if (set === undefined) {
        return this.get('selected');
      }

      if (typeof set === 'number') {
        if (this.layerStack.map.pointList[set].selected === undefined) {
          return false;
        }
        return this.layerStack.map.pointList[set].selected;
      }

      if (set === 'all') {
        Y.each(this.layerStack.map.pointList, Y.bind(function (point, i) {
          list[i] = point.selected;
        }, this));
        return list;
      }

      if (Y.Lang.isArray(set)) {
        Y.each(set, Y.bind(function (i) {
          list[i] = this.layerStack.map.pointList[i].selected;
        }, this));
        return list;
      }
    }, // selected()



    // -------------------------- L A B E L S -------------------------------

    /**
     * Show labels for a set of points described by a keyword or listed
     * in an array.
     *
     * This method ignores selection (unless instructed to act on it) and the
     * previous state of label visibulity.
     *
     * @method showLabels
     * @param {Array|Number|String} set The list of point indices, a single index,
     *   or a keyword describing the set
     *   (`'all'`, `'selected'`, `'unselected'`, `'if_label_invisible'`)
     */
    showLabels: function (set) {
      if (!this.get('labelsVisible')) {
        // `delayRendering is a trick to prevent the call
        // to map.generateLabels() inside layer visibility setter.
        this.delayRendering = true;
        this.set('labelsVisible', true);
        this.delayRendering = false;
      }

      this.layerStack.map.generateLabels(set, 'keep');
      this.setPointStyle(set, {
        show_label: true
      });
    },


    /**
     * Turn all labels on.
     *
     * This method ignores selection and the previous state of label visibulity.
     *
     * @method showAllLabels
     */
    showAllLabels: function () {
      if (!this.get('labelsVisible')) {
        this.set('labelsVisible', true);
      }
      this.layerStack.map.generateLabels('missing');
      this.setPointStyle('if_label_invisible', {
        show_label: true
      });
    },


    /**
     * Hide labels for a set of points described by a keyword or listed
     * in an array.
     *
     * This method ignores selection (unless instructed to act on it) and the
     * previous state of label visibulity.
     *
     * @method hideLabels
     * @param {Array|Number|String} set The list of point indices, a single index,
     *   or a keyword describing the set
     *   (`'all'`, `'selected'`, `'unselected'`)
     */
    hideLabels: function (set) {
      if (this.get('labelsVisible')) {
        this.layerStack.map.generateLabels(set, 'keep');
        this.setPointStyle(set, {
          show_label: false
        });
      }
    },


    /**
     * Hide all labels and forget their current visibility.
     *
     * This method ignores selection and it renders the subsequent calls
     * of the [labelsOn()](#method_labelsOn) method ineffective in the
     * absence of selection.
     *
     * To restore label visibility, either select some points and call
     * [labelsOn()](#method_labelsOn) or call
     * [showAllLabels()](#method_showAllLabels).
     *
     * @method hideAndForgetAllLabels
     */
    hideAndForgetAllLabels: function () {
      this.setPointStyle('all', {
        show_label: false
      });
    },


    /**
     * Turn the labels on by changing label visibility or label layer
     * visibility, depending on point selection state and visibility styles in
     * the data.
     *
     * This method is sensitive to selection and, in its absence, to previous
     * state of label visibility.
     *
     * In the absence of selection, all labels that were previously visible
     * and were hidden with the [labelsOff()](#method_labelsOff) method become
     * visible again. If the [hideAllLabels()](#method_hideAllLabels) method
     * was instead used to hide the labels, previous visibilty is lost and
     * all labels defined on on the map become visible.
     *
     * If any points are selected, these points become visible, while the
     * visibility of points outside selection remains unchanged.
     *
     * @method labelsOn
     */
    labelsOn: function () {
      if (this.get('labelsVisible')) {
        Y.log('labelsVisible = true (label layer is visible)');
        if (this.get('selected')) {
          Y.log('  selected = true => setPointStyle(selected)');
          this.setPointStyle('selected', {
            show_label: true
          });
        }
        else {
          Y.log('  selected = false => generateLabels(all, keep)');
          this.layerStack.map.generateLabels('all', 'keep');
        }
      }
      else {
        Y.log('labelsVisible = false (label layer not visible)');
        if (this.get('selected')) {
          Y.log('  selected = true => generateLabels(selected, keep)');
          // It is important to run this check before showing labels because
          // it depends on map.showLabelAbsent, which will be reset when any
          // of the labels is shown.
          if (this.layerStack.map.labelsPotentiallyVisibleOutsideSelection()) {
            Y.log('    hiding labels outside selection');
            this.setPointStyle('unselected', {
              show_label: undefined
            });
          }
          if (this.layerStack.map.labelsVisibleInsideSelection() < this.layerStack.map.selected) {
            Y.log('    generating additional labels inside selection');
            // this.layerStack.map.generateLabels('selected', 'keep');
            this.showLabels('selected');
          }
        }
        else {
          Y.log('  selected = false');
          if (this.layerStack.map.visibleLabelCount() === 0) {
            Y.log('  visibleLabelCount() === 0 => generateLabels(all, keep)');
            this.layerStack.map.generateLabels('all', 'keep');
          }
        }
      }
      Y.log('  set labelsVisible');
      this.set('labelsVisible', true);
    },


    /**
     * Turn the labels off by changing label visibility or label layer
     * visibility, depending on point selection state and visibility styles in
     * the data.
     *
     * In the absence of selection, all visible labels on the map become invisible,
     * but the visibility state of each label (visible or not) is preserved and can
     * be restored with the [labelsOn()](#method_labelsOn) method.
     *
     * If any points are selected, these points become invisible, while the
     * visibility of points outside selection remains unchanged.
     *
     * @method labelsOff
     */
    labelsOff: function () {
      if (this.get('labelsVisible')) {
        if (this.get('selected')) {
          if (this.layerStack.map.labelsVisibleOutsideSelection()) {
            this.setPointStyle('selected', {
              show_label: undefined
            });
            this.setPointStyle('unselected', {
              show_label: true
            });
          }
          else {
            this.set('labelsVisible', null);
          }
        }
        else {
          this.set('labelsVisible', null);
        }
      }
    },


    /**
     * Toggle label visibility for a set of points described by a keyword or listed
     * in an array.
     *
     * This method ignores selection (unless instructed to act on it) and the
     * previous state of label visibulity.
     *
     * @method toggleLabels
     * @param {Array|Number|String} set The list of point indices, a single index,
     *   or a keyword describing the set
     *   (`'all'`, `'selected'`, `'unselected'`)
     */
    toggleLabels: function (set) {
      var
        list,
        visible = [],
        hidden = [];

      if (set === undefined) {
        set = 'all';
      }
      if (typeof set === 'number') {
        set = [set];
      }
      list = this.labelVisibility(set);
      Y.each(list, function (vis, i) {
        if (vis) {
          visible.push(i);
        }
        else {
          hidden.push(i);
        }
      });
      if (hidden.length > 0) {
        this.showLabels(hidden);
      }
      if (visible.length > 0) {
        this.hideLabels(visible);
      }
    },


    /**
     * Calculate effective label visibility, combining label layer visibility
     * and the visibility of labels rendered on it.
     *
     * @method labelVisibility
     * @param {null|Number|Array|String} set The set of points to test for label visibility,
     *   specified in one of these forms:
     *   * **not provided**: return the number of visible lables
     *   * **integer (point index)**: return label visibilty for the point at that index
     *   * **array (list of point indices)**: return an object of boolean valuesi
     *     indicating label visibilty for each point on the list
     *   * **string (`'all'`, `'selected'`, `'unselected'`)**: return an object of boolean
     *     values indicating label visibilty for each point on the map, for each selected
     *     point, and for each point outside selection, respectively
     * @return {Number|Boolean|Object} Assertion of label visibility in one of alternativei
     *   forms depending on the argument
     */
    labelVisibility: function (set) {
      var list = {};

      if (set === undefined) {
        return this.layerStack.map.visibleLabelCount();
      }

      if (typeof set === 'number') {
        return this.layerStack.map.pointList[set].labelVisible();
      }

      if (set === 'all') {
        Y.each(this.layerStack.map.pointList, Y.bind(function (point, i) {
          if (point.textNode) {
            list[i] = point.labelVisible();
          }
          else {
            list[i] = undefined;
          }
        }, this));
        return list;
      }

      if (set === 'selected') {
        Y.each(this.layerStack.map.pointList, Y.bind(function (point, i) {
          if (point.selected) {
            if (point.textNode) {
              list[i] = point.labelVisible();
            }
            else {
              list[i] = undefined;
            }
          }
        }, this));
        return list;
      }

      if (set === 'unselected') {
        Y.each(this.layerStack.map.pointList, Y.bind(function (point, i) {
          if (!point.selected) {
            if (point.textNode) {
              list[i] = point.labelVisible();
            }
            else {
              list[i] = undefined;
            }
          }
        }, this));
        return list;
      }

      if (Y.Lang.isArray(set)) {
        Y.each(set, Y.bind(function (i) {
          var point = this.layerStack.map.pointList[i];
          if (point.textNode) {
            list[i] = point.labelVisible();
          }
          else {
            list[i] = undefined;
          }
        }, this));
        return list;
      }
    }, // labelVisibility()




    // -------------------- P O I N T   S T Y L E S -------------------------

    /**
     * Apply a set of styles to a set of points.
     *
     * @method setPointStyle
     * @param {Object|Number|Array|String} pointSpec A point (MapPoint or index),
     *   a list of point data indices, or set name (`'all'`, `'selected'`,
     *   `'uneselected'`, `'if_label_invisible'`)
     * @param {Object} arg Styles to apply
     * @param {Boolean} arg.show_label Label visibility
     */
    setPointStyle: function (pointSpec, arg) {
      var
        data = this.get('data'),
        widget = this,
        affected = [];

      // Check whether the is an old style consistent with the style to be
      // applied. Add a new style if there isn't.
      function applyToPoint(p) {
        var
          style = data.styles.styles[data.styles.points[p.index]],
          newStyle,
          oldStyleHash = Y.ACMACS.stringify(style),
          newStyleHash,
          index;

        newStyle = Y.clone(style, true);
        Y.log(['point', p.index, 'style', style, 'arg', arg]);
        Y.each(arg, function (value, key) {
          Y.log('testing arg key: ' + key);
          if (typeof value === 'string' && value.charAt(0) === '*') {
            Y.log('setting ' + key  + ' to ' + value);
            newStyle[key] = style[key] * parseFloat(value.substr(1));
          }
          else {
            if (newStyle[key] !== value) { // ATTENTION! Value may be an object (as in 'fill_color')
              Y.log('setting ' + key  + ' to ' + value);
              if (value === undefined) {
                delete newStyle[key];
              }
              else {
                newStyle[key] = value;
              }
            }
          }
        });
        newStyleHash = Y.ACMACS.stringify(newStyle);
        Y.log('old style:' + oldStyleHash);
        Y.log('testing:  ' + newStyleHash);
        if (newStyleHash !== oldStyleHash) {
          affected.push(p.index);
        }

        Y.log(widget.styleIndex);
        Y.log('index of new style: ' + widget.styleIndex[newStyleHash]);

        if (widget.styleIndex[newStyleHash] === undefined) {
          data.styles.styles.push(newStyle);
          index = data.styles.styles.length - 1;
          widget.styleIndex[newStyleHash] = index;
          Y.log('new style created at ' + index);
        }
        else {
          index = widget.styleIndex[newStyleHash];
          Y.log('reusing existing style at ' + index);
        }

        data.styles.points[p.index] = index;
        Y.log(data.styles.styles);
        Y.log(data.styles.points);

        widget.layerStack.map.restylePoint(p.index, style); // style is now old style

        Y.log('----------');
      }

      if (typeof pointSpec === 'string') {
        if (this.get('selected')) {
          Y.each(this.layerStack.map.pointList, Y.bind(function (p) {
            if (
              (pointSpec === 'selected' && p.selected) ||
              (pointSpec === 'unselected' && !p.selected)
            ) {
              applyToPoint(p);
            }
          }, this));
        }
        Y.each(this.layerStack.map.pointList, Y.bind(function (p) {
          if (
            (pointSpec === 'all') ||
            (pointSpec === 'if_label_invisible' && !p.labelVisible())
          ) {
            applyToPoint(p);
          }
        }, this));
      }
      else if (typeof pointSpec === 'number') {
        applyToPoint(
          this.layerStack.map.pointList[pointSpec]
        );
      }
      else if (typeof pointSpec === 'object' && pointSpec.pointNode) {
        applyToPoint(pointSpec);
      }
      else if (Y.Lang.isArray(pointSpec)) {
        Y.each(pointSpec, Y.bind(function (i) {
          applyToPoint(
            this.layerStack.map.pointList[i]
          );
        }, this));
      }
      else {
        throw new Error('unknown point spec in setPointStyle(' + pointSpec + '); type: ' + typeof pointSpec);
      }

      this.fireGUIEvent('pointStyleChange', {
        affectedPoints: affected,
        newStyle: arg
      });
    }, // setPointStyle()



    // ------------------------ B L O B S -----------------------------

    /**
     * Show blobs using blob contours and style data specified for each
     * point.
     *
     * The rendering of each blob is controlled by an object with two
     * properties: `contour` and `smooth`. The `contour` property
     * specifies a set of equally spaced radii emanating from the map point,
     * starting at 12 o'clock. The `smooth` property takes values
     * in the range `0 .. 1.0`, where `0` corresponds to no smoothing
     * and `1`, maximum smoothing.
     *
     * In this example, a blob will be shown for the point at index 2:
     *
     * ``` JavaScript
     * widget.showBlobs([
     *   null,
     *   null,
     *   {
     *     contour: [0.2, 0.21, 0.3, 0.16, 0.06, 0.08, 0.04, 0.12],
     *     smooth: 0.1
     *   }
     * ]);
     * ```
     *
     * The list does not need to be filled with nulls following the last
     * non-null element.
     *
     * @method showBlobs
     * @param {Array} list A list of blob specs for each point on the map.
     *   Null elements indicate points for which no blobs must be shown.
     */
    showBlobs: function (list) {
      var
        data = this.get('data'),
        style;

      Y.each(list, function (arg, i) {
        var p = this.layerStack.map.pointList[i];
        if (arg) {
          style = data.styles.styles[data.styles.points[i]];
          p.showBlob(data.layout[i], style, arg);
        }
        else {
          p.hideBlob();
        }
      }, this);
    },


    /**
     * Hide all blobs, revealing their respective map points.
     *
     * @method hideBlobs
     */
    hideBlobs: function () {
      var
        data = this.get('data'),
        style;

      Y.each(this.layerStack.shadow.groupDOMNode.childNodes, function (node) {
        this.layerStack.map.pointList[node.index].hideBlob();
      }, this);
    },


    /**
     * Assert blob visibility.
     *
     * @method hideBlobs
     */
    blobsVisible: function () {
      if (this.layerStack.shadow.groupDOMNode.childNodes.length) {
        return true;
      }
      return false;
    },


    scalePoints: function (scaleFactor) {
      if (this.get('selected')) {
        this.setPointStyle('selected', {
          size: '*' + scaleFactor
        });
      }
      else {
        this.set('pointScale', this.get('pointScale') * scaleFactor);
      }
    },



    /**
     * The internal listener for the `mousemove-end` event.
     *
     * This method presently does nothing. It is only used to test the
     * firing of the event.
     *
     * @method mousemoveEnd
     * @private
     * @param {EventFacade} e Event object
     */
    mousemoveEnd: function (e) {
      Y.log('mousemove end received at x = ' + e.x + ', y = ' + e.y);
    },


    /**
     * Get the values of all attributes representing widget state from the
     * user's perspective.
     *
     * The names of state attributes are listed in
     * [this.stateAttributes](#property_stateAttributes).
     *
     * This list also * includes `selection`, which is not an attribute
     * and is treated as an exception. It aggregates each point's
     * `selected` property.
     *
     * Map data stored in the widget's `data` attribute should not
     * be part of its state. Excluding map data from state allows the
     * view to be changed without replotting the data.
     *
     * <span style="color: brown">_**Note**_:
     * As a temporary hack, data has been added to allow saving label visibility.
     * This is wrong, but doing so was needed to test the visibility logic.
     * </span>
     *
     * @method getState
     * @return {Object} Complete state that can be used to initialise
     * the widget with the [setState()](#method_setState) method.
     */
    getState: function () {
      var data = {},
          keys = [],
          selected = 0;

      Y.each(this.stateAttributes, function (name, ord) {
        var val = this.get(name);

        if (name === 'transformation') {
          // clone it
          data[name] = {
            a: val.a,
            b: val.b,
            c: val.c,
            d: val.d,
            e: val.e < 1e-5 ? 0 : val.e,
            f: val.f < 1e-5 ? 0 : val.f
          };
        }
        else if (val) {
          data[name] = val;
        }
      }, this);

      // Save selection
      data.selection = {};
      Y.each(this.layerStack.map.pointList, Y.bind(function (p) {
        if (p.selected) {
          data.selection[p.index] = true;
          selected += 1;
        }
      }, this));
      data.selected = selected;

      Y.log(['=== MapWidget.getState() ===', data]);
      return data;
    }, // getState()


    /**
     * Restore widget state from data passed in the `state` argument.
     *
     * See [this.stateAttributes](#property_stateAttributes) for the list
     * of all state attributes.
     *
     * @method setState
     * @chainable
     * @param {Object} state The state object returned by the
     * [getState()](#method_getState) method.
     * @param {Boolean|String} [replot] A truthy value indicating that
     * the map has changed and needs replotting
     */
    setState: function (state, replot) {
      var t, selection;

      if (replot === undefined) {
        replot = true;
      }
      if (replot !== true) {
        replot = false;
      }
      if (state.empty) {
        replot = false;
      }

      Y.log(['=== MapWidget.setState() ===', state]);
      Y.log('  -- MapWidget.setState: this.delayRendering = true');
      this.delayRendering = true;

      Y.each(Y.Object.keys(this.stateAttributes).sort(), function (i) {
        var name = this.stateAttributes[i];
        Y.log(['  -- ' + name, state[name]]);
        switch (name) {
        case 'transformation':
          t = Y.ACMACS.newSVGMatrix();
          t.a = state[name].a;
          t.b = state[name].b;
          t.c = state[name].c;
          t.d = state[name].d;
          t.e = state[name].e;
          t.f = state[name].f;
          this.set('initialTransformation', t);
          break;
        case 'selected':
          // MapWidget only echoes the value of the `selected` attribute in the
          // map layer.
          this.layerStack.map.set('selected', state[name]);
          break;
        case 'selection':
          selection = state.selection;
          break;
        case 'chartSize':
          // Delay updating the chart size until the map is fully rendered.
          break;
        default:
          if (state[name]) {
            this.set(name, state[name]);
          }
        }
      }, this);

      if (replot) {
        Y.log('  -- MapWidget.setState: this.delayRendering = false');
        this.delayRendering = false;

        Y.log('  -- MapWidget.setState: calling this.plot()');
        this.plot({selected: selection});
      }

      Y.log('  -- MapWidget.setState: calling this.set(chartSize)');
      // It is now safe to change size.
      this.set('chartSize', state.chartSize);

      return this;
    }, // setState()


    /**
     * Return the set of data indices of points whose lapbels match a query.
     * The query expression should contain a space-delimited set of conjunctive
     * terms. Search terms including space characters can be matched by
     * enclosing them in double quotes.
     *
     * @method search
     * @param {String} query Search expression
     * @return {Array} The list of point indices (`point.index`)
     */
    search: function (query) {
      var result = [],
          re = [],
          terms,
          item,
          i,
          j,
          l,
          matched,
          o = this.get('data').point_info,
          pointList = this.layerStack.map.pointList;

      function escapeForRegEx(text) {
        text = decodeURIComponent(text);
        text = text.replace(/\\/g, '\\\\').replace(/\./g, '\\.').replace(/\*/g, '\\*').replace(/\$/g, '\\$').replace(/\^/g, '\\^').replace(/\?/g, '\\?');
        text = text.replace(/\|/g, '\\|').replace(/\+/g, '\\+').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
        text = text.replace(/\"/g, ''); // remove quotes from quoted terms
        return text;
      }

      function substituteEquivalentChars(text) {
        var table, n, i;

        table = [
          '(?:ae|æ)',
          '(?:oe|œ)',
          '(?:ss|ß)',
          '(?:th|Þ)',
          '[aáàâäãåấ]',
          '[eéèêëě3]',
          '[iíìîïǐ]',
          '[oóòôöõǒỏơớờởỡợø]',
          '[uúùûüǔǚưứừửữự]',
          '[yýÿ]', '[cçč]',
          '[dÐ]', '[fƒ]',
          '[gǧ]', '[hȟ]',
          '[jǰ]', '[kǩ]',
          '[lľ]', '[nñň]',
          '[rř®]', '[sšṧ]',
          '[tť]', '[zž]'
        ];

        n = table.length;
        for (i = 0; i < n; i += 1) {
          text = text.replace(new RegExp(table[i], 'gi'), table[i]);
        }
        return text;
      }

      function matchTerm(term, n) {
        if (item.label_capitalized && item.label_capitalized.search(re[n]) !== -1) {
          item.matches.push(term);
        }
        else {
          matched = false;
          return true; // The conjunction of terms does not match; quit the loop.
        }
      }

      if (o && query && typeof query === 'string') {
        // terms = query.match(/\w+|"[^"]+"/g);
        terms = query.match(/[A-Za-z0-9\/]+|"[^"]+"/g);

        Y.each(terms, function (term, i) {
          terms[i] = terms[i].replace(/\"/g, ''); // remove quotes from quoted terms
          term = escapeForRegEx(term);
          term = substituteEquivalentChars(term);
          term = term.replace(/\s+/g, '\\s+');
          re.push(new RegExp(term, 'i'));
        });

        for (i = 0, l = o.length; i < l; i += 1) {
          matched = true;
          item = o[i];
          item.matches = [];

          Y.some(terms, matchTerm);

          if (matched) {
            item.index = i;
            if (!pointList[i]) {
              item.missing = true;
            }
            result.push(item);
          }
        }
      }

      return result;
    }, // search()


    /**
     * Get the widget's state transformation -- the cumulative
     * transformation projecting onto the world the combined result of
     * all interactive transformations and the initial transformation
     * sent by the server.
     *
     * @method transformation
     * @return {SVGMatrix} State transformation
     */
    transformation: function () {
      return this.layerStack.shadow.transformation();
    },


    /**
     * A version of state transformation invariant of translation and scaling.
     *
     * @method orientation
     * @return {SVGMatrix} State transformation less translation and scaling
     */
    orientation: function () {
      return this.layerStack.shadow.orientation();
    },

    getSVG: function () {
      var
        unit = this.layerStack.shadow.mapUnitSize(),
        w = this.layerStack.trueVisibleWorld(),
        size = this.get('chartSize'),
        gridLayer,
        grid = [],
        i,
        text;

      for (i = 1; i < Math.round(w.gridWidth / unit); i += 1) {
        grid.push(Y.substitute(
          '  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#bbb" stroke-width="1" stroke-opacity="0.5" />',
          {
            x1: i * unit,
            y1: 0,
            x2: i * unit,
            y2: w.gridHeight
          }
        ));
      }
      for (i = 1; i < Math.round(w.gridHeight / unit); i += 1) {
        grid.push(Y.substitute(
          '  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#bbb" stroke-width="1" stroke-opacity="0.5" />',
          {
            x1: 0,
            y1: i * unit,
            x2: w.gridWidth,
            y2: i * unit
          }
        ));
      }

      gridLayer = Y.substitute(
        '  <g> <!-- grid -->\n' +
        '    <rect x="0" y="0" width="{width}" height="{height}" fill="#ffffff" fill-opacity="0" stroke-width="1" stroke="#888888" />\n' +
        '  {grid}\n' +
        '  </g>\n',
        {
          width: Math.ceil(w.gridWidth),
          height: Math.ceil(w.gridHeight),
          grid: grid.join('\n  ')
        }
      );

      text = Y.substitute(
        '<?xml version="1.0"?>\n' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="{gridWidth}" height="{gridHeight}" text-rendering="geometricPrecision">\n' +
        '  <title>{title}</title>\n\n' +
        '{grid}\n' +
        '  <!-- recenter the original viewport after padding to the whole number of units -->\n' +
        '  <g transform="translate({offsetX}, {offsetY})">\n' +
        '    <!-- shadow layer with factorised transformations, one per group -->\n' +
        '  {shadow}\n\n' +
        '    <!-- map layer -->\n' +
        '    {map}\n\n' +
        '    <!-- label layer -->\n' +
        '    {labels}\n' +
        '  </g>\n' +
        '</svg>\n',
        {
          title: this.get('data').title[0].text[0].replace(/</, '&lt;').replace(/>/, '&gt;'),
          gridWidth: Math.ceil(w.gridWidth),
          gridHeight: Math.ceil(w.gridHeight),
          offsetX: (w.gridWidth - size.x) / 2,
          offsetY: (w.gridHeight - size.y) / 2,
          grid: gridLayer,
          // Safari doesn't have the innerHTML property on SVG nodes, so get contentBox and remove <svg>.
          shadow: this.layerStack.shadow.contentBox.getHTML()
            .replace(/^<svg[^>]+>/, '')
            .replace(/<\/svg>$/, '')
            .replace(/> /g, '>\n   '),
          map: this.layerStack.map.contentBox.getHTML()
            .replace(/^<svg[^>]+>/, '')
            .replace(/<\/svg>$/, '')
            .replace(/\n.*<defs.+<\/defs>/, '')
            .replace(/></g, '>\n      <')
            .replace(/(\s|\n)*<text[^>]+\/>\n?$/, '')
            .replace(/ {2}<\/g>\n?$/, '</g>'),
          labels: this.get('labelsVisible') ?
            this.layerStack.labels.contentBox.getHTML()
              .replace(/^<svg[^>]+>\n?\s*/, '')
              .replace(/<\/svg>$/, '')
              .replace(/></g, '>\n      <')
              .replace(/ {2}<\/g>\n?$/, '</g>')
            :
            ''
        }
      );

      return text;
    }
  }, // prototypeProperties

  staticProperties: {
    // ------------------------------------------------------------------------
    // Static members and methods
    // ------------------------------------------------------------------------

    // <a name="ATTRS">
    // ### Instance attributes

    ATTRS: {

      /**
       * A flag indicating that the map has not been rendered.
       *
       * @attribute {Boolean} empty
       * @default true
       */
      empty: {
        value: true
      },


      /**
       * Map data as it comes from the server. The data are processed inside
       * the [plot()](#method_plot) method.
       *
       * @attribute {Object} data
       */
      data: {
        value: null,
        setter: function (arg) {
          this.set('initialTransformation', undefined);
          return arg;
        },
        validator: Y.Lang.isObject
      },


      /**
       * The current state of point styles.
       *
       * @attribute {Object} style
       */
      style: {
        getter: function () {
          var
            used = {},
            indexMap = {},
            output = {
              drawing_order: this.layerStack.map.data.renderingOrder,
              styles: [],
              points: []
            };

          // Mark those styles that are in use by points
          Y.each(this.layerStack.map.data.styleIndex, function (style) {
            used[style] = true;
          });

          // Filter unused styles out
          Y.each(this.layerStack.map.data.style, function (style, i) {
            if (used[i]) {
              output.styles.push(style);
              indexMap[i] = output.styles.length - 1;
            }
          });

          // Build the new style index
          Y.each(this.layerStack.map.data.styleIndex, function (style, i) {
            output.points[i] = indexMap[style];
          });

          return output;
        },

        setter: function (arg) {
          var
            oldStyleClone,
            styleCopied = false;

          if (this.layerStack.map && this.layerStack.map.data) { // if the map has already been plotted
            oldStyleClone = Y.JSON.parse(Y.JSON.stringify(this.get('data').styles));

            // restyle all points
            Y.each(this.layerStack.map.pointList, Y.bind(function (p, i) {
              var
                oldStyle = oldStyleClone.styles[oldStyleClone.points[i]],
                newStyle = arg.styles[arg.points[i]];

              if (Y.ACMACS.stringify(newStyle) !== Y.ACMACS.stringify(oldStyle)) {
                if (!styleCopied) {
                  Y.log('style copied', 'info', 'map');
                  this.get('data').styles.points = arg.points;
                  this.get('data').styles.styles = arg.styles;
                  this.layerStack.map.data.styleIndex = arg.points;
                  this.layerStack.map.data.style = arg.styles;
                  styleCopied = true;
                }
                Y.log(Y.ACMACS.stringify(newStyle));
                this.layerStack.map.restylePoint(i, oldStyle);
              }
            }, this));

            // disable style change events
          }
          this.get('data').styles.points = arg.points;
          this.get('data').styles.styles = arg.styles;
          Y.log(this.get('data').styles);
          return arg;
        },

        validator: function (arg) {
          if (!Y.Lang.isObject(arg)) {
            return Y.Attribute.INVALID_VALUE;
          }
          if (!Y.Lang.isArray(arg.points)) {
            return Y.Attribute.INVALID_VALUE;
          }
          if (!Y.Lang.isArray(arg.styles)) {
            return Y.Attribute.INVALID_VALUE;
          }
          return true;
        }
      },


      /**
       * Initial map size in pixels.
       *
       * @attribute {Object} chartSize
       * @default {x: 400, y: 400}
       */
      // This attribute is a proxy for the `LayerStack` `chartSize` attribute.
      chartSize: {
        setter: function (arg) {
          // Don't bother if the stack has not been rendered yet. The renderUI()
          // method will take care of it.
          if (!this.layerStack) {
            return;
          }

          // The layerStack setting (i.e., this widget's setting) trumps the
          // global setting. If no value is passed, the local parameter value is
          // not set, and the act of calling this setter is interpreted as the
          // desire to sync the widget with the global setting.
          if (arg !== undefined) {
            // Null is the value that can be used to unset this attribute. The
            // undefined value is already busy as a signal to use the profile
            // setting.
            if (arg === null) {
              arg = undefined;
            }
            // Apply this value to LayerStack.
            this.layerStack.set('chartSize', arg);

            // And set our own copy of the attribute to indicate whether the
            // global setting is applicable or not.
            return arg;
          }
        },
        validator: function (arg) {
          if (arg === null) {
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
      }, // chartSize:


      /**
       * Device-specific adjustment of map point size.
       *
       * @attribute {Number} pointSizeCalibration
       * @default set in profile
       */
      // This attribute is a proxy for the `MapLayer` `pointSizeCalibration` attribute.
      pointSizeCalibration: {
        getter: function () {
          return parseFloat(
            this.layerStack.map.attributeOrProfileSetting(
              'pointSizeCalibration'
            )
          );
        },
        setter: function (arg) {
          // The layer setting (i.e., this widget's setting) trumps the global
          // setting. If no value is passed, the local parameter value is not
          // set, and a call to the setter is interpreted as the desire to sync
          // the widget with the global setting.
          if (arg !== undefined) {
            // Null is the value that can be used to unset this attribute. The
            // undefined value is already busy as a signal to use the profile
            // setting.
            if (arg === null) {
              arg = undefined;
            }

            // Apply this value to the map layer.
            this.layerStack.map.set('pointSizeCalibration', arg);
            if (!this.delayRendering) {
              this.layerStack.map.updatePointSize();
            }

            // And set our own copy of the attribute to indicate whether the global
            // setting is applicable.
            return arg;
          }

          if (!this.layerStack.map.get('pointSizeCalibration')) {
            // No value has been passed and the local parameter is not set.
            this.layerStack.map.updatePointSize();
          }
          // Don't do anything if no value has been passed and the widget has its
          // attribute set.
        },
        validator: function (arg) {
          if (arg === undefined || arg === null || Y.Lang.isNumber(arg) || arg.match(
            /^\+?([1-9][0-9]*(?:[\.][0-9]*)?|0*\.0*[1-9][0-9]*)(?:[eE][+\-][0-9]+)?$/
          )) {
            return true;
          }
          throw new Error("not a positive number: '" + arg + "'");
        }
      }, // pointSizeCalibration:


      /**
       * Device-independent adjustment of map point size.
       *
       * @attribute {Number} pointScale
       * @default set in profile
       */
      // This attribute is a proxy for the `MapLayer` `pointScale` attribute.
      pointScale: {
        getter: function () {
          return parseFloat(
            this.layerStack.map.attributeOrProfileSetting('pointScale')
          );
        },
        setter: function (arg) {
          // The layer setting (i.e., this widget's setting) trumps the global
          // setting. If no value is passed, the local parameter value is not
          // set, and a call to the setter is interpreted as the desire to sync
          // the widget with the global setting.
          if (arg !== undefined) {
            // Null is the value that can be used to unset this attribute. The
            // undefined value is already busy as a signal to use the profile
            // setting.
            if (arg === null) {
              arg = undefined;
            }

            // Apply this value to the map layer. If arg is undefined, the
            // attribute value in the map laye will be unset.
            this.layerStack.map.set('pointScale', arg);

            // This operation uses attributeOrProfileSetting() to find the right
            // value for pointScale.
            if (!this.delayRendering) {
              this.layerStack.map.updatePointSize();
            }

            // And set our own copy of the attribute to indicate whether the global
            // setting is applicable.
            return arg;
          }

          if (!this.layerStack.map.get('pointScale')) {
            // No value has been passed and the local parameter is not set.
            this.layerStack.map.updatePointSize();
          }
          // Don't do anything if no value has been passed and the widget has its
          // attribute set.
        },
        validator: function (arg) {
          if (arg === undefined ||
              arg === null ||
              Y.Lang.isNumber(arg) ||
              arg.match(
                /^\+?([1-9][0-9]*(?:[\.][0-9]*)?|0*\.0*[1-9][0-9]*)(?:[eE][+\-][0-9]+)?$/
              )
             ) {
            return true;
          }
          throw new Error("not a positive number: '" + arg + "'");
        }
      }, // pointScale:


      /**
       * Device-specific adjustment of label size.
       *
       * @attribute {Number} labelSizeCalibration
       * @default set in profile
       */
      // This attribute is a proxy for the `LabelLayer` `labelSizeCalibration` attribute.
      labelSizeCalibration: {
        getter: function () {
          return parseFloat(
            this.layerStack.labels.attributeOrProfileSetting('labelSizeCalibration')
          );
        },
        setter: function (arg) {
          // The layer setting (i.e., this widget's setting) trumps the global
          // setting. If no value is passed, the local parameter value is not
          // set, and a call to the setter is interpreted as the desire to sync
          // the widget with the global setting.
          if (arg !== undefined) {
            // Null is the value that can be used to unset this attribute. The
            // undefined value is already busy as a signal to use the profile
            // setting.
            if (arg === null) {
              arg = undefined;
            }

            // Apply this value to the label layer.
            this.layerStack.labels.set('labelSizeCalibration', arg);
            if (!this.delayRendering) {
              this.layerStack.labels.updateLabelSize();
            }

            // And set our own copy of the attribute to indicate that the global
            // setting is no longer applicable.
            return arg;
          }

          if (!this.layerStack.labels.get('labelSizeCalibration')) {
            // No value has been passed and the local parameter is not set.
            this.layerStack.labels.updateLabelSize();
          }
          // Don't do anything if no value has been passed and the widget has its
          // attribute set.
        },
        validator: function (arg) {
          if (arg === undefined || arg === null || Y.Lang.isNumber(arg) || arg.match(
            /^\+?([1-9][0-9]*(?:[\.][0-9]*)?|0*\.0*[1-9][0-9]*)(?:[eE][+\-][0-9]+)?$/
          )) {
            return true;
          }
          throw new Error("not a positive number: '" + arg + "'");
        }
      }, // labelSizeCalibration:


      /**
       * Device-independent adjustment of label size.
       *
       * @attribute {Number} labelScale
       * @default set in profile
       */
      // This attribute is a proxy for the `LabelLayer` `labelScale` attribute.
      labelScale: {
        getter: function () {
          return parseFloat(
            this.layerStack.labels.attributeOrProfileSetting('labelScale')
          );
        },
        setter: function (arg) {
          Y.log('MapWidget.labelScale.setter(' + arg + ')');
          if (arg !== undefined) {
            if (arg === null) {
              arg = undefined;
            }
            this.layerStack.labels.set('labelScale', arg);
            if (!this.delayRendering) {
              this.layerStack.labels.updateLabelSize();
            }
            return arg;
          }
          if (!this.layerStack.labels.get('labelScale')) {
            this.layerStack.labels.updateLabelSize();
          }
          return undefined;
        },
        validator: function (arg) {
          if (arg === undefined || arg === null || Y.Lang.isNumber(arg) || arg.match(
            /^\+?([1-9][0-9]*(?:[\.][0-9]*)?|0*\.0*[1-9][0-9]*)(?:[eE][+\-][0-9]+)?$/
          )) {
            return true;
          }
          throw new Error("not a positive number: '" + arg + "'");
        }
      }, // labelScale:


      /**
       * Label text type (refers to display options specified in `point_info`)
       *
       * @attribute {Number} labelType
       * @default set in profile
       */
      // This attribute is a proxy for the `LabelLayer` `labelType` attribute.
      labelType: {
        getter: function () {
          return this.layerStack.labels.attributeOrProfileSetting('labelType');
        },
        setter: function (arg) {
          Y.log('MapWidget.labelType.setter(' + arg + ')');
          if (arg !== undefined) {
            if (arg === null) {
              arg = undefined;
            }
            this.layerStack.labels.set('labelType', arg);
            if (!this.delayRendering) {
              this.layerStack.labels.updateLabelText();
            }
            return arg;
          }
          if (!this.layerStack.labels.get('labelType')) {
            this.layerStack.labels.updateLabelText();
          }
          return undefined;
        }
      }, // labelType:


      /**
       * Label layer visibility.
       *
       * <span style="color: brown">_**Note**_:
       * When queried, this attribute only reports layer visibility. Not to be
       * confused with the similarly named [labelVisibility()](#method_labelVisibility)
       * method, which determnes whether there are actually any labels visible on
       * the layer when it itself is turned on.
       *
       * In the case of delayed rendering, setting this attribute commands
       * the rendering of labels.
       *
       * @attribute {Boolean} labelsVisible
       * @default set in profile
       */
      // This attribute is a proxy for the `LabelLayer` visibility attribute
      // (`visible`). That attribute is inherited from `Widget`so it will
      // not be found among the declared layer attributes.
      labelsVisible: {
        setter: function (arg) {

          var setLabelVisibility = Y.bind(function (value) {
            // Show/hide the label layer.
            // In the case of delayed rendering, proceed to render the labels
            // if the layer is to be shown for the first time.
            if (value) {
              if (!this.get('labelsVisible')) {
                this.layerStack.labels.set('visible', true);
                if (
                  this.layerStack.labels.numberOfNodes() === 0 &&
                  !this.delayRendering
                ) {
                  Y.log('generateLabels(all, keep)');
                  this.layerStack.map.generateLabels('all', 'keep');
                }
              } // not already visible
            }
            else {
              this.layerStack.labels.set('visible', false);
            }
          }, this); // setLabelVisibility

          // The layer setting (i.e., this widget's setting) trumps the global
          // setting. If no value is passed, the local parameter value is not
          // set, and a call to the setter is interpreted as the desire to sync
          // the widget with the global setting.
          if (arg !== undefined) {
            if (arg === null) {
              setLabelVisibility(Y.ACMACS.profile.get('labelsVisible'));
              // Unset the current attribute value.
              return undefined;
            }
            // Apply this `arg` value to the label layer.
            setLabelVisibility(arg);

            // And set our own copy of the attribute to indicate that the global
            // setting is no longer applicable.
            return arg;
          }

          if (this.get('labelsVisible') === undefined ||
              this.get('labelsVisible') === null
             ) {
            // No value has been passed and the local attribute is not set.
            setLabelVisibility(Y.ACMACS.profile.get('labelsVisible'));
            return;
          }

          // Don't change the current value if it is not undefined and no new
          // value has been passed.
          return this.get('labelsVisible');
        }
      }, // labelsVisible:


      /**
       * Visibility of connections layer.
       *
       * In the case of delayed rendering, setting this attribute commands
       * the rendering of connection and/or error lines, according to the
       * settings of the [renderConnectionLines](#attr_renderConnectionLines)
       * and [renderErrorLines](#attr_renderErrorLines) attributes.
       *
       * @attribute {Boolean} connectionsLayerVisible
       * @default set in profile
       */
      // This attribute is a proxy for the `ConnectionsLayer` visibility attribute
      // (`visible`). That attribute is inherited from `Widget`so it will
      // not be found among the declared layer attributes.
      connectionsLayerVisible: {
        setter: function (arg) {
          var setErrorLineVisibility = Y.bind(function (value) {
            // Add the connections layer if it does not exist; otherwise make it
            // visible
            if (value) {
              if (this.layerStack.connections) {
                this.layerStack.connections.set('visible', true);
              }
              else {
                this.layerStack.insertLayer(
                  'connections',
                  Y.ACMACS.ConnectionsLayer,
                  {before: 'map'}
                );
              }

              if (
                this.get('data') &&
                this.get('data').error_lines &&
                !this.delayRendering
              ) {
                Y.log('  MapWidget.connectionsLayerVisible.setter: rendering not delayed; calling connections.plot()');
                this.layerStack.connections.plot();
              }

            }
            else {
              if (this.layerStack.connections && this.layerStack.connections.numberOfNodes() > 0) {
                this.layerStack.connections.clear();
              }
            }
          }, this); // setErrorLineVisibility

          // The layer setting (i.e., this widget's setting) trumps the global
          // setting. If no value is passed, the local parameter value is not
          // set, and a call to the setter is interpreted as the desire to sync
          // the widget with the global setting.
          if (arg !== undefined) {
            if (arg === null) {
              setErrorLineVisibility(Y.ACMACS.profile.get('connectionsLayerVisible'));
              // Unset the current attribute value.
              return undefined;
            }
            // Apply this `arg` value to the connections layer.
            setErrorLineVisibility(arg);

            // And set our own copy of the attribute to indicate that the global
            // setting is no longer applicable.
            return arg;
          }

          if (this.get('connectionsLayerVisible') === undefined ||
              this.get('connectionsLayerVisible') === null
             ) {
            // No value has been passed and the local attribute is not set.
            setErrorLineVisibility(Y.ACMACS.profile.get('connectionsLayerVisible'));
            return;
          }
          // Don't change the current value if it is not undefined and no new
          // value has been passed.
          return this.get('connectionsLayerVisible');
        }
      }, // connectionsLayerVisible:


      /**
       * This attribute turns the rendering of connection lines on and off,
       * without changing the visibility of connections layer.
       *
       * Changing this attribute causes the connection layer to replot itself.
       *
       * @attribute {Boolean} renderConnectionLines
       * @default set in profile
       */
      renderConnectionLines: {
        getter: function () {
          if (this.layerStack.connections) {
            return this.layerStack.connections
            .attributeOrProfileSetting('renderConnectionLines');
          }
          return Y.ACMACS.profile.get('renderConnectionLines');
        },
        setter: function (arg) {
          if (arg !== undefined) {
            if (arg === null) {
              arg = undefined;
            }
            if (this.layerStack.connections) {
              this.layerStack.connections.set('renderConnectionLines', arg);
              if (!this.delayRendering) {
                this.layerStack.connections.plot();
              }
            }
            return arg;
          }
          if (!this.layerStack.connections.get('renderConnectionLines')) {
            this.layerStack.connections.plot();
          }
          return undefined;
        }
      }, // connectionLinesVisible:


      /**
       * This attribute turns the rendering of error lines on and off,
       * without changing the visibility of connections layer.
       *
       * Changing this attribute causes the connection layer to replot itself.
       *
       * @attribute {Boolean} renderErrorLines
       * @default set in profile
       */
      renderErrorLines: {
        getter: function () {
          if (this.layerStack.connections) {
            return this.layerStack.connections
            .attributeOrProfileSetting('renderErrorLines');
          }
          return Y.ACMACS.profile.get('renderErrorLines');
        },
        setter: function (arg) {
          if (arg !== undefined) {
            if (arg === null) {
              arg = undefined;
            }
            if (this.layerStack.connections) {
              this.layerStack.connections.set('renderErrorLines', arg);
              if (!this.delayRendering) {
                Y.log('MapWidget.renderErrorLines.setter: rendering not delayed, calling layerStack.connections.plot()');
                this.layerStack.connections.plot();
              }
            }
            return arg;
          }
          else if (!this.layerStack.connections.get('renderErrorLines')) {
            this.layerStack.connections.plot();
          }
          return undefined;
        }
      }, // errorLinesVisible:


      /**
       * The limit on the number of connection or error lines at each point.
       *
       * Changing this attribute causes the connection layer to replot itself.
       *
       * @attribute {Number} connectionsMax
       * @default set in profile
       */
      connectionsMax: {
        getter: function () {
          if (this.layerStack.connections) {
            return this.layerStack.connections
            .attributeOrProfileSetting('connectionsMax');
          }
          return Y.ACMACS.profile.get('connectionsMax');
        },
        setter: function (arg) {
          if (arg !== undefined) {
            if (arg === null) {
              arg = undefined;
            }
            if (this.layerStack.connections) {
              this.layerStack.connections.set('connectionsMax', arg);
              if (!this.delayRendering) {
                this.layerStack.connections.plot();
              }
            }
            return arg;
          }
          else if (!this.layerStack.connections.get('connectionsMax')) {
            this.layerStack.connections.plot();
          }
          return undefined;
        }
      }, // errorLinesVisible:


      /**
       * Visibility of procrustes layer.
       *
       * In the case of delayed rendering, setting this attribute commands
       * the rendering of procrustes arrows whose length exceeds the
       * threshold set in the
       * [procrustesDistanceThreshold](#attr_procrustesDistanceThreshold)
       * attribute.
       *
       * @attribute {Boolean} procrustesLayerVisible
       * @default set in profile
       */
      // This attribute is a proxy for the `ProcrustesLayer` visibility attribute
      // (`visible`). That attribute is inherited from `Widget`so it will
      // not be found among the declared layer attributes.
      procrustesLayerVisible: {
        setter: function (arg) {
          Y.log('MapWidget.procrustesLayerVisible.setter(' + arg + ')');
          var setErrorLineVisibility = Y.bind(function (value) {
            // Add the procrustes layer if it does not exist; otherwise make it
            // visible
            if (value) {
              if (this.layerStack.procrustes) {
                this.layerStack.procrustes.set('visible', true);
              }
              else {
                this.layerStack.insertLayer(
                  'procrustes',
                  Y.ACMACS.ProcrustesLayer,
                  {before: 'map'}
                );
              }

              if (
                this.get('data') &&
                this.get('data').error_lines &&
                !this.delayRendering
              ) {
                Y.log('  MapWidget.procrustesLayerVisible.setter: rendering not delayed; calling procrustes.plot()');
                this.layerStack.procrustes.plot();
              }

            }
            else {
              if (this.layerStack.procrustes && this.layerStack.procrustes.numberOfNodes() > 0) {
                this.layerStack.procrustes.clear();
              }
            }
          }, this); // setErrorLineVisibility

          // The layer setting (i.e., this widget's setting) trumps the global
          // setting. If no value is passed, the local parameter value is not
          // set, and a call to the setter is interpreted as the desire to sync
          // the widget with the global setting.
          if (arg !== undefined) {
            if (arg === null) {
              setErrorLineVisibility(Y.ACMACS.profile.get('procrustesLayerVisible'));
              // Unset the current attribute value.
              return undefined;
            }
            else {
              // Apply this `arg` value to the procrustes layer.
              setErrorLineVisibility(arg);

              // And set our own copy of the attribute to indicate that the global
              // setting is no longer applicable.
              return arg;
            }
          }
          else if (this.get('procrustesLayerVisible') === undefined ||
                   this.get('procrustesLayerVisible') === null
                  ) {
            // No value has been passed and the local attribute is not set.
            setErrorLineVisibility(Y.ACMACS.profile.get('procrustesLayerVisible'));
            return;
          }
          // Don't change the current value if it is not undefined and no new
          // value has been passed.
          return this.get('procrustesLayerVisible');
        }
      }, // procrustesLayerVisible:


      /**
       * Enables the rendering of procrustes lines.
       *
       * If the procrustes layer has not rendered itself yet (due to delayed
       * rendering), setting this attribute causes the procrustes layer to
       * replot itself.
       *
       * @attribute {Boolean} renderProcrustesLines
       * @default set in profile
       */
      renderProcrustesLines: {
        getter: function () {
          if (this.layerStack.procrustes) {
            return this.layerStack.procrustes
            .attributeOrProfileSetting('renderProcrustesLines');
          }
          return Y.ACMACS.profile.get('renderProcrustesLines');
        },
        setter: function (arg) {
          if (arg !== undefined) {
            if (arg === null) {
              arg = undefined;
            }
            if (this.layerStack.procrustes) {
              this.layerStack.procrustes.set('renderProcrustesLines', arg);
              if (!this.delayRendering) {
                this.layerStack.procrustes.plot();
              }
            }
            return arg;
          }

          if (!this.layerStack.procrustes.get('renderProcrustesLines')) {
            this.layerStack.procrustes.plot();
          }
          return undefined;
        }
      }, // procrustesinesVisible:


      /**
       * Disables the rendering of procrustes arrows for ponts that have
       * moved less than this amount.
       *
       * Changes to this attribute cause the procrustes layer to
       * replot itself.
       *
       * @attribute {Number} procrustesDistanceThreshold
       * @default set in profile
       */
      procrustesDistanceThreshold: {
        getter: function () {
          if (this.layerStack.procrustes) {
            return this.layerStack.procrustes
            .attributeOrProfileSetting('procrustesDistanceThreshold');
          }
          return Y.ACMACS.profile.get('procrustesDistanceThreshold');
        },
        setter: function (arg) {
          Y.log(['setting threshold', arg]);
          if (arg !== undefined) {
            if (arg === null) {
              arg = undefined;
            }
            if (this.layerStack.procrustes) {
              this.layerStack.procrustes.set('procrustesDistanceThreshold', arg);
              if (!this.delayRendering) {
                this.layerStack.procrustes.plot();
              }
            }
            return arg;
          }

          if (!this.layerStack.procrustes.get('procrustesDistanceThreshold')) {
            this.layerStack.procrustes.plot();
          }
          return undefined;
        }
      }, // errorLinesVisible:


      /**
       * This attribute controls the presence and the type of the background
       * layer.
       *
       * To build a transparent widget, leave it undefined. To set a solid
       * background, specify a CSS colour. To insert an HTML canvas layer with
       * a grey gradient painted on it, set this attribute to `'gradient'`.
       *
       * @attribute {String} background
       */
      background: {
        value: undefined,
        validator: function (val) {
          if (val === undefined || val === null) {
            return true;
          }
          if (Y.Lang.isString(val)) {
            /* this case can be extended to test for CSS colours */
            return true;
          }
          return false;
        }
      },

      /**
       * Enables the sidebar menu.
       *
       * @attribute {Boolean} menu
       * @default false
       */
      menu: {
        value: false,
        validator: Y.Lang.isBoolean
      },

      /**
       * The current viewing transformation
       *
       * @attribute {SVGMatrix} transformation
       */
      transformation: {
        getter: function () {
          if (this.get('empty')) {
            return Y.ACMACS.newSVGMatrix(); // a unity matrix
          }
          return this.viewingTransformation.matrix.inverse().multiply(
            this.layerStack.shadow.groupDOMNode.getCTM()
          );
        }
      },

      /**
       * Initial transformation (as received from the server).
       *
       * @attribute {SVGMatrix} initialTransformation
       */
      initialTransformation: {
        value: undefined
      },

      /**
       * The number of selected points.
       *
       * @attribute {Number} selected
       */
       // replicated from the map layer
      selected: {
        value: 0
      }
    }
  }
};

/**
 * @method MapWidget
 * @constructor
 * @param {Object}  config               Configuration parameters
 * @param {Object}  config.chartSize     Chart size descriptor
 * @param {Integer} config.chartSize.x   Width in pixels
 * @param {Integer} config.chartSize.y   Height in pixels
 * @param {String}  [config.background]  Background type: CSS colour spec or `gradient`
 * @param {Boolean} [config.menu]        Show the sidebar menu toggle
 * @param {Object}  [config.data]        Map data (as sent from the server)
 */
Y.namespace('ACMACS').MapWidget = Y.Base.create(
  'acmacsMapWidget',
  Y.Widget,
  [Y.ACMACS.WidgetTreeNode],
  code.prototypeProperties,
  code.staticProperties
);

}, '@VERSION@', {
  requires: ['base', 'node', 'acmacs-base']
});
/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * js2-basic-offset: 2
 * End:
 */
