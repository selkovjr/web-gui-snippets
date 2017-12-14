YUI.add('array-methods', function(Y) {

/**
 * Array extensions
 *
 * @module acmacs-base
 * @submodule array-methods
 */

/**
* @class Array
*/

/**
 * Get the last element of an array.
 *
 * Having to write `ar[ar.length - 1]` is just too inconvenient.
 *
 * @method last
 * @return Object
 */
if (!Array.prototype.last) {
  Array.prototype.last = function () {
    return this[this.length - 1];
  };
}

/**
 * A `min()` function tolerant of undefined values.
 *
 * It applies `Math.min()` to array elements.
 *
 * @method min
 * @return Object
 */
if (!Array.prototype.min) {
  Array.prototype.min = function () {
    return Math.min.apply(
      Math,
      this.filter(function (el) {
        return el !== undefined;
      })
    );
  };
}

/**
 * A `max()` function tolerant of undefined values.
 *
 * It applies `Math.max()` to array elements.
 *
 * @method min
 * @return Object
 */
if (!Array.prototype.max) {
  Array.prototype.max = function () {
    return Math.max.apply(
      Math,
      this.filter(function (el) {
        return el !== undefined;
      })
    );
  };
}

}, '@VERSION@', {
  requires: []
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
