/*
  # license
  # license.
*/
// ======================================================================

/* jslint white: true, onevar: true, undef: true, newcap: true, nomen: true,
 * regexp: true, plusplus: true, bitwise: true, browser: true, devel: true,
 *  widget: true, indent: 2 */
/*global Y */

// Signature of Y.Base.create(..) is
// Y.Base.create(
//     name_string,                  e.g. "camelCase"
//     ClassToExtend,                e.g. Y.Base or Y.Widget
//     array_of_extension_Classes,   e.g. [Y.WidgetStdMod]
//     obj_of_prototype_members_and_methods,   (see below)
//     static_members_and_methods);            (see below)
// @returns a class constructor function

// Create Y.ACMACS.MapWidget from Y.Base with no extensions
Y.namespace('ACMACS').MapWidget = Y.Base.create("acmacsMap", Y.Widget, [], {

  // Prototype properties and methods
  // (Prefer attributes over properties for) Public instance properties
  foo: "default value for instance.foo property (public)",

  // Underscore prefix (quasi) private properties for common internal refs
  _type : null,

  initializer : function (config) {
    // Code that runs at instantiation (constructor code) goes here
  },

  somePublicMethod: function () {
    var val = this.get('myAttribute');
    this.set('myAttribute', "new value");
    // etc
  },

  _quasiPrivateMethod: function () {
    // publicly available, but implementers shouldn't access directly
  }
}, {
  // Static members and methods

  // Instance attributes made available via, e.g.,
  // instance.get('myAttribute') and
  // instance.set('myAttribute', "new value");
  ATTRS : {
    myAttribute : {
      value : "default value",
      validator: Y.Lang.isString
      // see also setter, getter, writeOnce, readOnly, etc
    },
    anotherAttribute : {
      value : null,
      setter : function (val) {
        if (val === true) {
          return "a new value to assign to the attribute";
        } else if (val % 2) {
          // don't update attribute value
          return Y.Attribute.INVALID_VALUE;
        }
        return val; // is stored as the new value
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
