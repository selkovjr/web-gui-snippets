/*
  # license
  # license.
*/

/*jslint plusplus: false*/
/*global document: false, window: false */

// ======================================================================
// Extension, destroys all children having destroy() method
// ======================================================================

function ParentExtension(config) {
}

ParentExtension.prototype =
{
  destructor: function () {
    Y.each(this, function (child, name) {
      if (name[0] !== '_' && child && child.destroy) {
        //console.log('ParentExtension destroy', name, child.name); 
        child.destroy();
      }
    });
  }
};

Y.namespace('ACMACS').ParentExtension = ParentExtension;


// ======================================================================

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * js2-basic-offset: 2
 * End:
 */
