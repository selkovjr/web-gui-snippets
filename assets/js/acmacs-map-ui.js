/*
  # license
  # license.
*/

/*global Y: false */

/**
 * User interface mix-in for the ACMACS map widget.
 *
 * @module acmacs-map
 * @submodule acmacs-map-ui
 */

// ## Method summary
// * Life cycle methods
//   * *[initializer](acmacs-map-state.html#initializer)*()  [_in acmacs-map-state.js_]
//   * *[destructor](acmacs-map-state.html#destructor)*()  [_in acmacs-map-state.js_]
// * Event bindings
//   * *[bindUI](acmacs-map-state.html#bindUI)*()  [_in acmacs-map-state.js_]
// * **Composition methods**
//   * **[renderUI](#renderUI)**()
//   * **[syncUI](#syncUI)**()
//   * *[plot](acmacs-map-state.html#plot)*()  [_in acmacs-map-state.js_]
//   * **[toggleSidebar](#toggleSidebar)**()
//   * **[resizeMapContainer](#resizeMapContainer)**()

// ## Prototype properties
var code = {
  /**
   * Sidebar toggle button
   *
   * @property {Node} toggleButton
   * @for ACMACS.MapWidget
   * @protected
   */
  toggleButton: null,

  /**
   * Base64-encoded toggle button image
   *
   * @property {String} toggleButtonImage
   * @for ACMACS.MapWidget
   * @private
   */
  toggleButtonImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAKC' +
    'AYAAAC0VX7mAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAAC' +
    'xMBAJqcGAAAAAd0SU1FB9sBEBMFLf+cjXoAAAEkSURBVCjPpdGxapRBFMXx3w3fgoKmEDRdU' +
    'glpbBaRb2LQZ7D2OVKLD5DHsPYZFGQGVwxubSMIQYUIG0mELLk2E9hCYSUHhjlw53843Ilaq' +
    '1LKLTzEFDdwaT1t4Dc+4kOt9VfgNp7hLl5l5lPsYLNDEwzdL/t9gXN8jog3eI4feL3RW23XW' +
    'g8zc6/Dpzjp4BV83v1Zn51gyMy9WushtjENHGCWmfOVNhPcXDmrWvbws+4vsIyIXTwasMCn1' +
    'trPUkqskrXW/NfySilxNR/HcYI5dof+AafjOE4z07r6y9s5Lgcc4w4eu56+4njADA9w/xqh7' +
    '3rGLDJzMyJ2cC8z3+IFttYM+oaXEfEE3zPzy9BaW2TmMiKOImIf7/+z3T6OMnOrtbb4A4imd' +
    'UpjLEbpAAAAAElFTkSuQmCC',

  /**
   * The width of sidebar toggle button to be extracted from `toggleButtonImage`
   *
   * @property {Number} toggleButtonWidth
   * @for ACMACS.MapWidget
   * @private
   */
  toggleButtonWidth: null,

  // ------------------------------------------------------------------------
  // ## Composition methods

  /**
   * A `Widget` life cycle method.
   *
   * It assembles widget elements and renders them into the DOM.
   * @method renderUI
   * @for ACMACS.MapWidget
   * @private
   */
  renderUI: function () {

    // The only information the widget needs to render itself is a pair of
    // numbers setting the pixel-dimensions of the viewable area of the map.
    // It can be configured either in the common application profile,
    // `Y.ACMACS.Profile` ([`acmacs-profile.js`](acmacs-profile.html)), or as a
    // widget attribute (`chartSize`). If not configured by either of these
    // methods, the widget will use a [hard-coded default
    // value](acmacs-map-state.html#chartSize).
    var chartSize = this.attributeOrProfileSetting('chartSize');

    // The map widget consists of the following components:

    this.add('infoLayer', Y.ACMACS.InfoLayer, {
      width: chartSize.x,
      height: chartSize.y,
      parent: this
    }).hide();

    // #### * Layer stack

    // `Y.ACMACS.LayerStackWidget` ([`acmacs-layerstack.js`](acmacs-layerstack.html))
    // is a set of equally sized transparent graphics widgets stacked up along
    // the _z-axis_. The `add()` method defined in `Y.ACMACS.WidgetTreeNode` is
    // used to build the widget hierarchy.
    this.add('layerStack', Y.ACMACS.LayerStackWidget, {
      width: chartSize.x,
      height: chartSize.y,
      parent: this
    });
    this.targetNode = this.layerStack.targetNode;

    // * **Optional background layer**
    // ([`acmacs-background.js`](acmacs-background.html)). Its presence and
    // kind are controlled by the map widget's `background` attribute. When it
    // is set to a CSS colour spec, a blank layer of that colour is inserted at
    // the bottom of the stack.  When set to `'graident'`, the background layer
    // will contain an HMTL canvas with a grey gradient rendered on it. If
    // the background layer is not included in the stack, the entire map widget
    // is transparent, allowing the background of the parent node to show
    // through.
    if (this.get('background')) {
      this.layerStack.addLayer('background', Y.ACMACS.BackgroundLayer, {
        fill: this.get('background')
      });
    }

    // * **Shadow layer** ([`acmacs-layer.js`](acmacs-layer.html#ShadowLayer))
    this.layerStack.addLayer('shadow', Y.ACMACS.ShadowLayer);

    // * **Label layer** ([`acmacs-labellayer.js`](acmacs-labellayer.html))
    // Point labels are rendered on this layer. Their co-ordinates are
    // synchronised with the points on the map layer using an array of
    // [MapPoint](acmacs-maplayer.html#MapPoint) objects contained the map
    // layer's [point](acmacs-layer.html#point) property.
    this.layerStack.addLayer('labels', Y.ACMACS.LabelLayer);

    if (this.attributeOrProfileSetting('connectionsLayerVisible')) {
      this.layerStack.insertLayer(
        'connections',
        Y.ACMACS.ConnectionsLayer,
        {before: 'map'}
      );
    }

    if (this.attributeOrProfileSetting('procrustesLayerVisible')) {
      this.layerStack.insertLayer(
        'procrustes',
        Y.ACMACS.ProcrustesLayer,
        {before: 'map'}
      );
    }

    // * **Map layer** ([`acmacs-maplayer.js`](acmacs-maplayer.html)). This is
    // the layer on which point shapes are rendered.
    this.layerStack.addLayer('map', Y.ACMACS.MapLayer);

    // * **Grid layer** ([`acmacs-grid.js`](acmacs-grid.html)). It is the
    // topmost information layer in the stack, on which the antigenic distance
    // grid is rendered.
    this.layerStack.addLayer('grid', Y.ACMACS.GridLayer);

    // In addition to the above information layers,
    // [`Y.ACMACS.LayerStack`](acmacs-layerstack.html) automatically creates
    // two auxiliary layers. On top of the stack, the **target layer**
    // ([`Y.ACMACS.TargetLayer`](acmacs-layer.html#TargetLayer)) receives all
    // user input events for the stack. Stashed at the bottom of the stack is
    // the **shadow layer**
    // ([`Y.ACMACS.ShadowLayer`](acmacs-layer.html#ShadowLayer)). It is not
    // interactive and it does not contain any visual information.  Its purpose
    // is to keep track of the co-ordinate transformations taking place on the
    // map layer, which itself is not transformable.

    // #### **Sidebar**

    // `Y.ACMACS.SidebarWidget` ([`acmacs-sidebar.js`](acmacs-sidebar.html))
    // This is an optional menu that is inserted into the map widget on the
    // right side of the layer stack. When present, it is automatically
    // configured to show a set of controls for manipulating the visibilty and
    // transparency of the layers in the stack.
    if (this.get('menu')) {
      this.add('sidebar', Y.ACMACS.SidebarWidget, {
        width: '50px',  // just so it is visible when empty
        height: this.get('chartHeight'),
        parent: this
      });
      this.sidebar.hide();

      // The user activates the sidebar menu by clicking on the toggle button
      // in the upper right corner of the stack.
      this.toggleButtonWidth = new Y.PNGDecoder(
        // the offset of 22 strips the 'data uri' part
        this.toggleButtonImage.substr(22)
      ).width;
      this.toggleButton = Y.Node.create(
        '<div class="acmacs-togglebutton"><img src="' +
          this.toggleButtonImage +
        '" /></div>'
      );
      this.toggleButton.setStyle('width', this.toggleButtonWidth + 'px');

      /*
       * The toggle button sticks to the corner of widget, moving with the menu
       * as it opens.
       * this.get('contentBox').append(this.toggleButton);
       */

      /* The toggle button is always at the corner of the map. */
      this.layerStack.get('contentBox').append(this.toggleButton);
    }

    // #### **Float terminator**

    // Because the map widget uses a floated layout of its sub-widgets (layer
    // stack and sidebar), it needs a dummy `<div>` node at the end of its
    // child list to cancel floating.
    this.get('contentBox').append(
      '<div class="acmacs-float-terminator"></div>' /* style = clear: both */
    );
  }, // renderUI()


  /**
   * Show/hide the sidebar
   *
   * Bound to the `click` event in `this.toggleButton`.
   * @method toggleSidebar
   * @private
   */
  toggleSidebar: function () {
    if (this.sidebar.get('visible')) {
      this.sidebar.hide();
      this.get('contentBox').setStyle(
        'width',
        this.layerStack.get('width') + 'px'
      );
    }
    else {
      this.sidebar.show();
      this.get('contentBox').setStyle(
        'width',
        (
          this.layerStack.get('width') + parseInt(
            this.sidebar.get('boundingBox').getComputedStyle('width'),
            10
          )
        ) + 'px'
      );
    }
  },

  /**
   * This method needs to be called every time the sidebar menu shows or hides
   * itself, or when the map dimensions are changed.
   *
   * Because these changes violate the assumption of fixed-size dimensions for
   * child nodes that is essential for the floated layout of the map widget,
   * the style engine cannot update this layout automatically and the map widget
   * needs to resize itself.
   *
   * Bound to:
   * * [chartSzieChange event in Profile](../classes/ACMACS.Profile.html#event_chartSizeChange)
   * * [visibleChange event in SidebarWidget](../classes/ACMACS.SidebarWidget.html#event_visibleChange)
   *
   * @method resizeMapContainer
   * @protected
   */
  resizeMapContainer: function () {
    var newWidth,
        newWidthNumeric,
        buttonWidth = this.toggleButtonWidth;

    if (this.get('menu')) {
      if (this.sidebar.get('visible')) {
        newWidthNumeric = this.layerStack.get('width') + this.sidebar.get('width');
        newWidth = newWidthNumeric + 'px';
      }
      else {
        newWidth = this.layerStack.get('width');
        newWidthNumeric = parseFloat(newWidth);
      }
    }
    this.get('contentBox').setStyle('width', newWidth);
  }

}; // code

// This is a way to add prototype properties defined in this file to the
// prototype passed to the `Y.ACMACS.MapWidget` constructor defined in
// [`acmacs-map-state.js`](acmacs-map-state.html).
Y.mix(Y.ACMACS.MapWidget.prototype, code, true);

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
