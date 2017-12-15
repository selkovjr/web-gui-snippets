YUI.add('acmacs-infolayer', function(Y) {

  // ======================================================================

// Saved this from map-interactivity

//         if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
//           this.showBindingsFor('ctrl');
//         }
//         if (!e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
//           this.showBindingsFor('shift');
//         }
//         if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
//           this.showBindingsFor('ctrl+shift');
//         }
//         if (!e.ctrlKey && !e.shiftKey && e.altKey && !e.metaKey) {
//           this.showBindingsFor('alt');
//         }
//         if (!e.ctrlKey && !e.shiftKey && !e.altKey && e.metaKey) {
//           this.showBindingsFor('meta');
//         }
//         if (!e.ctrlKey && !e.shiftKey && e.altKey && e.metaKey) {
//           this.showBindingsFor('alt+meta');
//         }

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
    },

    // ------------------------------------------------------------------------
    // ## Life cycle methods

    initializer: function (config) {
      // Make sure the instance propreties exist. Failing to assign a value to them
      // will result in prototype properties shared among all instances of the
      // widget.
      this.instanceName = config.instanceName;
      this.children = [];
      this.listeners = [];
    },

    // <a name="destructor">
    // ### destructor()

    // Clean up the DOM on destruction.
    destructor: function () {
      Y.each(this.listeners, function (handle) {
        handle.detach();
      });
      this.listeners = undefined;

      // Y.ACMACS.WidgetTreeNode properties
      this.children = undefined;
      this.parent = undefined;
      this.rootWidget = undefined;
    },


    renderUI: function () {
      var
        cb = this.get('contentBox'),
        sidebar,
        contentHeight;

      cb.append(
        '<div class="acmacs-infolayer-sidebar">' +
        '</div>' +
        '<div class="acmacs-infolayer-content">' +
        '  <div><input class="acmacs-infolayer-label-mode" type="checkbox" />Label mode</div>' +
        '  <h3>' +
        '    Keyboard and pointer inputs' +
        '  </h3>' +
        '  <p>' +
        '   The description of widget interactivity and test targets will be shown here' +
        '  </p>' +
        '</div>' +
        '<div class="acmacs-infolayer-footer">' +
        '  <div><input class="acmacs-infolayer-done-button" type="button" value="Done" /></div>' +
        '</div>'
      );

      contentHeight = this.get('height') - parseInt(cb.one('.acmacs-infolayer-footer').getComputedStyle('height'), 10);

      sidebar = cb.one('.acmacs-infolayer-sidebar');
      sidebar.setStyle('height', contentHeight + 'px');
      sidebar.append(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="94" height="170">' +
        '  <defs>' +
        '    <linearGradient id="lgr1">' +
        '      <stop style="stop-color:#eee;stop-opacity:0.7" offset="0" />' +
        '      <stop style="stop-color:#555;stop-opacity:0.7" offset="1" />' +
        '    </linearGradient>' +
        '    <linearGradient id="lgr2">' +
        '      <stop style="stop-color:#bbb;stop-opacity:0" offset="0" />' +
        '      <stop style="stop-color:#222;stop-opacity:0.7" offset="1" />' +
        '    </linearGradient>' +
        '    <linearGradient id="lgr3">' +
        '      <stop style="stop-color:#555;stop-opacity:0.7" offset="0" />' +
        '      <stop style="stop-color:#eee;stop-opacity:0.7" offset="1" />' +
        '    </linearGradient>' +
        '    <linearGradient x1="193.6" y1="161.6" x2="193.6" y2="162.4" id="lgr4" xlink:href="#lgr3" gradientUnits="userSpaceOnUse" gradientTransform="scale(0.66,1.5)" spreadMethod="reflect" />' +
        '    <radialGradient cx="158.0" cy="169.2" r="31.16" fx="158.0" fy="169.2" id="rgr1" xlink:href="#lgr2" gradientUnits="userSpaceOnUse" gradientTransform="scale(0.66,1.5)" spreadMethod="reflect" />' +
        '    <radialGradient cx="85.53" cy="170.1" r="252.08" fx="85.53" fy="170.1" id="rgr2" xlink:href="#lgr1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0.73,0,0,1.37,37.3,-124)" spreadMethod="reflect" />' +
        '    <radialGradient cx="193.4" cy="181.6" r="68.14" fx="193.4" fy="181.6" id="rgr3" xlink:href="#lgr1" gradientUnits="userSpaceOnUse" gradientTransform="scale(0.68,1.47)" spreadMethod="reflect" />' +
        '  </defs>' +
        '  <g transform="matrix(0.5 0 0 0.5 -28 -25)">' +
        '    <path d="m 154.9,388.9 c -73.24,0 -84.31,-65.01 -83.55,-85.61 l 0,0 0,0 0,0 0,0 0,0 c 1.12,-19.43 2.06,-97.56 -1.17,-163.4 0.82,-71.92 55.77,-70.20 84.71,-70.2 28.94,0 83.89,-1.72 84.71,70.2 -3.23,65.81 -2.3,144 -1.17,163.4 l 0,0 0,0 0,0 0,0 0,0 c 0.76,20.6 -10.31,85.62 -83.56,85.61" style="fill:url(#rgr2);fill-rule:evenodd;stroke:none" />' +
        '    <path d="m 133.7,254.9 a 15.94,34.69 0 1 1 -31.87,0 15.94,34.69 0 1 1 31.87,0 z" transform="matrix(0.98,0,0,1.24,39.36,-186.4)" style="fill:url(#rgr3);fill-opacity:1;fill-rule:evenodd;stroke:none" />' +
        '    <path d="m 154.9,70.07 0,118.6" style="fill:none;stroke:#555;stroke-width:1.5" />' +
        '    <path d="m 129.375,257.12103 a 11.5625,26.25 0 1 1 -23.125,0 11.56,26.25 0 1 1 23.125,0 z" transform="translate(37.36,-127.2)" style="fill:url(#lgr4);fill-opacity:1;fill-rule:evenodd;stroke:none" />' +
        '    <path d="m 129.375,257.12103 a 11.5625,26.25 0 1 1 -23.125,0 11.56,26.25 0 1 1 23.125,0 z" transform="translate(37.36,-127.2)" style="fill:url(#rgr1);fill-opacity:1;fill-rule:evenodd;stroke:#555;stroke-width:0.55;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" />' +
        '    <path d="m 154.7,188.6 c -82.35,0 -80.16,3.3 -82.62,3.92" style="fill:none;stroke:#555;stroke-width:1.5" />' +
        '    <path d="m 154.9,188.6 c 83.17,0 82.88,4.67 82.2,4.67" style="fill:none;stroke:#555;stroke-width:1.5;stroke-linecap:round" />' +
        '  </g>' +
        '</svg>'
      );

      sidebar.append(
        '<svg width="68" height="68" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
        '  <defs>' +
        '    <linearGradient id="lgr1-shift">' +
        '      <stop stop-color="#888" offset="0"/>' +
        '      <stop stop-color="#bbb" offset="1"/>' +
        '    </linearGradient>' +
        '    <linearGradient id="lgr2-shift">' +
        '      <stop stop-color="#444" offset="0"/>' +
        '      <stop stop-color="#aaa" offset="1"/>' +
        '    </linearGradient>' +
        '    <linearGradient y2="0.075" x2="0.881" y1="0.823" x1="0.105" spreadMethod="pad" id="lgr4-shift" xlink:href="#lgr2-shift"/>' +
        '    <linearGradient y2="0.116" x2="0.836" y1="0.860" x1="0.229" spreadMethod="pad" id="lgr3-shift" xlink:href="#lgr1-shift"/>' +
        '    <linearGradient y2="0.500" x2="1.012" y1="0.500" x1="-0.01" id="lgr5-shift" xlink:href="#lgr1-shift"/>' +
        '  </defs>' +
        '  <g transform="matrix(0.25 0 0 0.25 0 0)">' +
        '    <g transform="matrix(1 0 0 0.75 0 0)">' +
        '      <path fill="url(#lgr3-shift)" fill-rule="evenodd" stroke="url(#lgr5-shift)" stroke-width="4.36" d="m52.73,42.27 l161.8,0 c7.272,0 13.13,8.042 13.12,18.03 l0,150.9 c0,10 -5.855,18.03 -13.13,18.03 l-161.8,0 c-7.272,0 -13.13,-8.042 -13.13,-18.03 l0,-150.89 c0,-10 5.854,-18.03 13.13,-18.03z"/>' +
        '    </g>' +
        '    <text transform="matrix(3 0 0 3 0 0)" xml:space="preserve" text-anchor="middle" font-family="Arial" font-size="24" y="52" x="44" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" fill="#ddd">shift</text>' +
        '  </g>' +
        '</svg>'
      );

      sidebar.append(
        '<svg width="68" height="68" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
        '  <defs>' +
        '    <linearGradient id="lgr1-ctrl">' +
        '      <stop stop-color="#888" offset="0"/>' +
        '      <stop stop-color="#bbb" offset="1"/>' +
        '    </linearGradient>' +
        '    <linearGradient id="lgr2-ctrl">' +
        '      <stop stop-color="#444" offset="0"/>' +
        '      <stop stop-color="#aaa" offset="1"/>' +
        '    </linearGradient>' +
        '    <linearGradient y2="0.075" x2="0.881" y1="0.823" x1="0.105" spreadMethod="pad" id="lgr4-ctrl" xlink:href="#lgr2-ctrl"/>' +
        '    <linearGradient y2="0.116" x2="0.836" y1="0.860" x1="0.229" spreadMethod="pad" id="lgr3-ctrl" xlink:href="#lgr1-ctrl"/>' +
        '    <linearGradient y2="0.500" x2="1.012" y1="0.500" x1="-0.01" id="lgr5-ctrl" xlink:href="#lgr1-ctrl"/>' +
        '  </defs>' +
        '  <g transform="matrix(0.25 0 0 0.25 0 0)">' +
        '    <g transform="matrix(1 0 0 0.75 0 0)">' +
        '      <path fill="url(#lgr3-ctrl)" fill-rule="evenodd" stroke="url(#lgr5-ctrl)" stroke-width="4.36" d="m52.73,42.27 l161.8,0 c7.272,0 13.13,8.042 13.12,18.03 l0,150.9 c0,10 -5.855,18.03 -13.13,18.03 l-161.8,0 c-7.272,0 -13.13,-8.042 -13.13,-18.03 l0,-150.89 c0,-10 5.854,-18.03 13.13,-18.03z"/>' +
        '    </g>' +
        '    <text transform="matrix(3 0 0 3 0 0)" xml:space="preserve" text-anchor="middle" font-family="Arial" font-size="24" y="52" x="44" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="0" fill="#ddd">ctrl</text>' +
        '  </g>' +
        '</svg>'
      );

      this.scrollView = new Y.ScrollView({
        id: "scrollview",
        srcNode: cb.one('.acmacs-infolayer-content'),
        height: contentHeight,
        flick: {
          minDistance: 10,
          minVelocity: 0.3,
          axis: "y"
        }
      });
      this.scrollView.render();
    },


    bindUI: function () {
      this.listeners.push(
        this.get('contentBox').one('.acmacs-infolayer-done-button').on('click',
          Y.bind(function () {
            this.get('contentBox').setStyle('zIndex', -1);
            this.hide();
          }, this)
        )
      );
      this.listeners.push(
        this.get('contentBox').one('.acmacs-infolayer-label-mode').on('change',
          Y.bind(function (e) {
            Y.log('change');
            if (this.parent.layerStack.labels && this.parent.setModalBindings !== undefined) {
              if (e.target.get('checked')) {
                this.parent.setModalBindings('labels');
                e.target.set('checked', true);
              }
              else {
                this.parent.setModalBindings('navigation');
                e.target.set('checked', false);
              }
            }
          }, this)
        )
      );
    },

    updateDimensions: function () {
      var
        width = parseInt(this.parent.layerStack.get('width'), 10),
        height = parseInt(this.parent.layerStack.get('height'), 10),
        cb = this.get('contentBox'),
        contentHeight = height - parseInt(cb.one('.acmacs-infolayer-footer').getComputedStyle('height'), 10);

      Y.log(['width', width, 'height', height, 'contentHeight', contentHeight]);
      cb.setStyle('height', height + 'px');
      cb.setStyle('width', width + 'px');
      cb.one('.acmacs-infolayer-sidebar').setStyle('height', contentHeight + 'px');
      this.scrollView.set('height', contentHeight);

      return this;
    }
  }, // prototypeProperties

  staticProperties: {
    // Static members and methods

    ATTRS: {
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
      }
    }
  }
};

Y.namespace('ACMACS').InfoLayer = Y.Base.create(
  "acmacsInfoLayer",
  Y.Widget,
  [Y.ACMACS.WidgetTreeNode],
  code.prototypeProperties,
  code.staticProperties
);

}, '@VERSION@', {
  requires: ['base', 'node', 'acmacs-base', 'acmacs-layer']
});
/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
