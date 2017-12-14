/*global Y: false */
/*jslint plusplus: false*/

YUI.add('acmacs-profile', function(Y) {

/**
 * Application-level configuration settings
 *
 * @module acmacs-base
 * @submodule acmacs-profile
 */

/**
@namespace ACMACS
@class Profile
@extends Base
@static
*/
Y.namespace('ACMACS');

/**
 * Attribute change event.
 *
 * All widgets on the page that still have the default
 * size setting resize themselves when they receive this
 * event.
 *
 * Listeners:
 *
 * * [MapWidget.resizeMapContainer()](../classes/ACMACS.MapWidget.html#method_resizeMapContainer)
 * * [LayerStack.updateDimensions()](../classes/ACMACS.LayerStack.html#method_updateDimensions)
 *
 * @event chartSizeChange
 */

/**
 * Attribute change event.
 *
 * All widgets on the page that still have the default
 * `pointSizeCalibration` setting respond to this event
 * by updating their map layer.
 *
 * Listeners:
 *
 * * `MapWidget`'s [pointSizeCalibration](../classes/ACMACS.MapWidget.html#attr_pointSizeCalibration) setter
 *
 * @event pointSizeCalibrationChange
 */

/**
 * Attribute change event.
 *
 * All widgets on the page that still have the default
 * `pointScale` setting respond to this event by updating
 * their map layer.
 *
 * Listeners:
 *
 * * `MapWidget`'s [pointScale](../classes/ACMACS.MapWidget.html#attr_pointScale) setter
 *
 * @event pointScaleChange
 */

/**
 * Attribute change event.
 *
 * All widgets on the page that still have the default
 * `labelSizeCalibration` setting respond to this event
 * by updating their label layer.
 *
 * Listeners:
 *
 * * `MapWidget`'s [labelSizeCalibration](../classes/ACMACS.MapWidget.html#attr_labelSizeCalibration) setter
 *
 * @event labelSizeCalibrationChange
 */

/**
 * Attribute change event.
 *
 * All widgets on the page that still have the default
 * `labelScale` setting respond to this event by updating
 * their label layer.
 *
 * Listeners:
 *
 * * `MapWidget`'s [labelScale](../classes/ACMACS.MapWidget.html#attr_labelScale) setter
 *
 * @event labelScaleChange
 */

/**
 * Attribute change event.
 *
 * All widgets on the page that still have the default
 * `labelsVisible` setting respond to this event by updating
 * their label layer.
 *
 * Listeners:
 *
 * * `MapWidget`'s [labelsVisible](../classes/ACMACS.MapWidget.html#attr_labelsVisible) setter
 *
 * @event labelsVisibleChange
 */

/**
 * Attribute change event.
 *
 * All widgets on the page that still have the default
 * `labelType` setting respond to this event by updating
 * their label layer.
 *
 * Listeners:
 *
 * * `MapWidget`'s [labelType](../classes/ACMACS.MapWidget.html#attr_labelType) setter
 *
 * @event labelTypeChange
 */

/**
 * Attribute change event.
 *
 * All widgets on the page respond to this event by updating
 * their target layer.
 *
 * Listeners:
 *
 * * Anonymous listener set up in `MapWidget`'s [bindUI()](../classes/ACMACS.MapWidget.html#method_bindUI) method
 *
 * @event hudFillColorChange
 */

/**
 * Attribute change event.
 *
 * All widgets on the page respond to this event by updating
 * their target layer.
 *
 * Listeners:
 *
 * * Anonymous listener set up in `MapWidget`'s [bindUI()](../classes/ACMACS.MapWidget.html#method_bindUI) method
 *
 * @event hudFillOpacityChange
 */


var code = {
  prototypeProperties: {
    /* Instance members */

    /* methods */

    /**
     * Create a reference to profile instance.
     *
     * @method initialize
     * @private
     */
    initializer: function (config) {
      Y.ACMACS.profile = this;
    }
  },
  staticProperties: {
    NAME: 'acmacsProfile',
    ATTRS: {
      /**
       * Device-independent adjustment of map point size.
       *
       * @attribute {Number} pointScale
       * @default 1.0 == no adjustment
       */
      pointScale: {
        value: 1.0
      },

      /**
       * Device-specific adjustment of map point size.
       *
       * @attribute {Number} pointSizeCalibration
       * @default 5.0 (pixels per size unit)
       */
      pointSizeCalibration: {
        value: 5.0,
        setter: function (val) {
        }
      },

      /**
       * Initial label visibility.
       *
       * @attribute {Boolean} labelsVisible
       * @default false
       */
      labelsVisible: {
        value: false
      },

      /**
       * Initial label type.
       *
       * @attribute {Boolean} labelType
       * @default 'label_full'
       */
      labelType: {
        value: 'label_full'
      },

      /**
       * Device-independent adjustment of label size.
       *
       * @attribute {Number} labelScale
       * @default 1.0 == no adjustment
       */
      labelScale: {
        value: 1.0
      },

      /**
       * Device-specific adjustment of label size.
       *
       * @attribute {Number} labelSizeCalibration
       * @default 9.0 (pixels per size unit)
       */
      labelSizeCalibration: {
        value: 7.5
      },

      /**
       * The limit on the number of connection or error lines at each point.
       *
       * @attribute {Number} connectionsMax
       * @default 40
       */
      connectionsMax: {
        value: 40
      },

      /**
       * Initial visibility of connections layer.
       *
       * @attribute {Boolean} connectionsLayerVisible
       * @default false
       */
      connectionsLayerVisible: {
        value: false
      },

      /**
       * Specifies whether or not to render connection lines
       * at creation. Because connection lines are expensive,
       * this setting can be used to speed up the initial
       * rendering of the widget.
       *
       * @attribute {Boolean} renderConnectionLines
       * @default false
       */
      renderConnectionLines: {
        value: false
      },

      /**
       * Specifies whether or not to render error lines
       * at creation. Because error lines are expensive,
       * this setting can be used to speed up the initial
       * rendering of the widget.
       *
       * @attribute {Boolean} renderErrorLines
       * @default false
       */
      renderErrorLines: {
        value: false
      },

      /**
       * Initial visibility of procrustes layer.
       *
       * @attribute {Boolean} procrustesLayerVisible
       * @default false
       */
      procrustesLayerVisible: {
        value: false
      },

      /**
       * Specifies whether or not to render procrustes arrows at
       * creation. Because procrustes arrows are expensive, this
       * setting can be used to speed up the initial rendering of
       * the widget.
       *
       * @attribute {Boolean} renderProcrustesLines
       * @default false
       */
      renderProcrustesLines: {
        value: false
      },

      /**
       * Disables the rendering of procrustes arrows for ponts that have
       * moved less than this amount.
       *
       * @attribute {Number} procrustesDistanceThreshold
       * @default 0.0 == render all arrows
       */
      procrustesDistanceThreshold: {
        value: 0.0
      },

      /**
       * The CSS coulour spec of the HUD background.
       *
       * Widgets do not have this attribute; it can only be set globally
       * through Profile.
       *
       * @attribute {String} hudFillColor
       * @default 'black'
       */
      hudFillColor: {
        value: 'black'
      },

      /**
       * The opacity of the navigation HUD.
       *
       * Opacity values range from 0 to 1, with 1 being fully opaque.
       *
       * Widgets do not have this attribute; it can only be set globally
       * through Profile.
       *
       * @attribute {Number} hudFillOpacity
       * @default 0.4
       */
      hudFillOpacity: {
        value: 0.4
      },

      hudLingerTime: {
        // The time the viewport HUD stays on after the motion has ceased.
        value: 500
      },

      iButtonDelay: {
        // The time before the i-button appears. The timer starts
        // on mousemove-end.
        value: 100
      },

      /**
       * The time in milliseconds between the cessation of mouse
       * motion and the firing of the `mousemove-end` event.
       *
       * @attribute {Number} motionTimeout
       * @default 600
       */
      motionTimeout: {
        value: 600
      },

      /**
       * Initial map size in pixels.
       *
       * @attribute {Object} chartSize
       * @default {x: 400, y: 400}
       */
      chartSize: {
        value: {
          x: 400,
          y: 400
        }
      }
    }
  }
};

/**
 * This singleton object provides application-level defaults to
 * all ACMACS map widgets on the page.
 *
 * To access these values, widgets use the
 * [attributeOrProfileSetting()](../classes/Base.html##method_attributeOrProfileSetting)
 * method that ACMACS attaches to `Base`.
 *
 * Widgets listen to changes in these attributes and update
 * themseves each time the `set()` method is called on the profile.
 *
 * @class ACMACS.Profile
 * @constructor
 */
Y.ACMACS.Profile = function (config) {
  Y.ACMACS.Profile.superclass.constructor.apply(this, arguments);
};

/* Static */
Y.mix(Y.ACMACS.Profile, code.staticProperties);

/* Prototype */
Y.extend(Y.ACMACS.Profile, Y.Base, code.prototypeProperties);

}, '@VERSION@', {
  requires: ['base']
});
/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * js2-basic-offset: 2
 * End:
 */
