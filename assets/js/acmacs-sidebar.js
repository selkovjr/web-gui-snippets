/*
  # license
  # license.
*/
// ======================================================================

// Signature of Y.Base.create(..) is
// Y.Base.create(
//     name_string,                  e.g. "camelCase"
//     ClassToExtend,                e.g. Y.Base or Y.Widget
//     array_of_extension_Classes,   e.g. [Y.WidgetStdMod]
//     obj_of_prototype_members_and_methods,   (see below)
//     static_members_and_methods);            (see below)
// @returns a class constructor function

/*global Y: false */

// Create Y.ACMACS.SidebarWidget from Y.Base with no extensions
Y.namespace('ACMACS').SidebarWidget = Y.Base.create(
  "acmacsSidebarWidget",
  Y.Widget,
  [Y.ACMACS.WidgetTreeNode],
  {

  initializer: function (config) {
    this.parent = config.parent;
    this.layerMenu = null;
    this.checkboxes = {}; // input elements in the layers menu
    this.sliders = {}; // input elements in the layers menu
    this.listener = {}; // event listeners for the menu
  },

  destructor: function () {
    Y.each(this.listener, function (listener) {
      listener.detach();
    });
    this.listener = undefined;
    Y.each(this.checkboxes, function (input) {
      input.destroy(true);
    });
    this.checkboxes = undefined;
    Y.each(this.sliders, function (input) {
      input.destroy(true);
    });
    this.sliders = undefined;
  },

  renderUI: function () {
    this.layerMenu = Y.Node.create('<div class="acmacs-layermenu"></div>');
    this.get('contentBox').append(this.layerMenu);
    this.renderLayersMenu();
  },

  renderLayersMenu: function () {
    var stack = this.parent.layerStack;

    this.layerMenu.empty();

    Y.each(this.listener, function (listener) {
      listener.detach();
    });
    this.listener = {};

    Y.each(stack.get('layers').concat().reverse(), function (layer) {
      var layerName = layer.instanceName,
          id = Y.guid(),
          sliderId = Y.guid(),
          status,
          checkbox,
          slider;

      if (layerName === 'shadow') {
        return;
      }

      // get current layer status
      if (layer.get('visible')) {
        status = ' checked="1"';
      }
      else {
        status = '';
      }

      // add the on/off checkboxes and labels
      this.layerMenu.append(Y.substitute(
        '<div style="white-space: nowrap">' +
        '  <input type="checkbox" id="{id}" name="{name}"{status} />&#160;' +
        '  <label for="{id}">{name}</label>' +
        '</div>' +
        '<div>' +
        '  <span id="{sliderId}" class="yui3-skin-sam"></span>' +
        '</div>',
        {id: id, sliderId: sliderId, name: layerName, status: status}
      ));
      checkbox = this.layerMenu.one('#' + id);
      this.checkboxes[layerName] = checkbox;

      // Bind checkbox events
      this.listener[layerName] = checkbox.after('change', Y.bind(function () {
        this.setLayerVisibility(layerName, checkbox.get('checked'));
      }, this));

      if (layerName === 'labels') {
        this.listener[layerName + '.visible'] = this.parent.after('labelsVisibleChange', function (e) {
          // Could use e.newVal, but checking parent state tests the entire
          // loop.
          checkbox.set('checked', this.parent.get('labelsVisible'));
        }, this);
      }
      else if (layerName === 'connections') {
        this.listener[layerName + '.visible'] = this.parent.after('connectionsLayerVisibleChange', function (e) {
          checkbox.set('checked', this.parent.get('connectionsLayerVisible'));
        }, this);
      }
      else if (layerName === 'procrustes') {
        this.listener[layerName + '.visible'] = this.parent.after('procrustesLayerVisibleChange', function (e) {
          checkbox.set('checked', this.parent.get('procrustesLayerVisible'));
        }, this);
      }
      else {
        this.listener[layerName + '.visible'] = stack[layerName].after('visibleChange', function (e) {
          checkbox.set('checked', e.target.get('visible'));
        }, this);
      }

      // add sliders
      slider = new Y.Slider({
        axis: 'x',
        min: 0,
        max: 100,
        value: 100,
        length: '82px'
      }).render('#' + sliderId);
      this.sliders[layerName] = slider;

      // Bind slider events
      this.listener[layerName + '-opacity'] = slider.after('valueChange', function (e) {
        stack[layerName].set('opacity', e.newVal);
      }, this);
    }, this); // each layer

    this.set('width', this.get('contentBox').getComputedStyle('width'));
  }, // renderLayersMenu()

  bindUI: function () {
    var stack = this.parent.layerStack;

    stack.after('layersChange', function () {
      this.renderLayersMenu();
    }, this);
  },

  setLayerVisibility: function (layerName, arg) {
    var stack = this.parent.layerStack,
        checkbox = this.checkboxes[layerName];
    if (layerName === 'labels') {
      this.parent.set('labelsVisible', arg);
    }
    else if (layerName === 'connections') {
      this.parent.set('connectionsLayerVisible', arg);
    }
    else if (layerName === 'procrustes') {
      this.parent.set('procrustesLayerVisible', arg);
    }
    else {
      stack[layerName].set('visible', arg);
    }
  }

}, {
  // Static members and methods

  ATTRS : {
    parent: {
      value: null
    },

    width: {
      getter: function (val) {
        if (Y.Lang.isString(val)) {
          return parseInt(val.split('px')[0], 10);
        }
        else {
          return val;
        }
      }
    }
  }
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
