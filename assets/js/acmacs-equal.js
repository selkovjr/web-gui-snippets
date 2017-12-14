/*
  # license
  # license.
*/

/*jslint plusplus: false, eqeqeq: false, nomen: false, onevar: false*/
/*global document: false, window: false */

// ======================================================================
// Deep comparison of two objects
// ======================================================================

// http://documentcloud.github.com/underscore/underscore.js
// deep comparison of two objects
var equal_internal = function (a, b, stack) 
{
  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
  if (a === b) {
    return a !== 0 || 1 / a == 1 / b;
  }
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }
  // Unwrap any wrapped objects.
  if (a._chain) {
    a = a._wrapped;
  }
  if (b._chain) {
    b = b._wrapped;
  }
  // Invoke a custom `isEqual` method if one is provided.
  // if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
  // if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
  // Compare `[[Class]]` names.
  var className = Object.prototype.toString.call(a);
  if (className != Object.prototype.toString.call(b)) {
    return false;
  }
  switch (className) {
    // Strings, numbers, dates, and booleans are compared by value.
  case '[object String]':
    // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
    // equivalent to `new String("5")`.
    return a == String(b);
  case '[object Number]':
    // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
    // other numeric values.
    return a != +a ? b != +b : (a === 0 ? 1 / a == 1 / b : a == +b);
  case '[object Date]':
  case '[object Boolean]':
    // Coerce dates and booleans to numeric primitive values. Dates are compared by their
    // millisecond representations. Note that invalid dates with millisecond representations
    // of `NaN` are not equivalent.
    return +a == +b;
    // RegExps are compared by their source patterns and flags.
  case '[object RegExp]':
    return a.source == b.source &&
      a.global == b.global &&
      a.multiline == b.multiline &&
      a.ignoreCase == b.ignoreCase;
  }
  if (typeof a != 'object' || typeof b != 'object') {
    return false;
  }
  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
  var length = stack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (stack[length] == a) {
      return true;
    }
  }
  // Add the first object to the stack of traversed objects.
  stack.push(a);
  var size = 0, result = true;
  // Recursively compare objects and arrays.
  if (className == '[object Array]') {
    // Compare array lengths to determine if a deep comparison is necessary.
    size = a.length;
    result = size == b.length;
    if (result) {
      // Deep compare the contents, ignoring non-numeric properties.
      while (size--) {
        // Ensure commutative equality for sparse arrays.
        if (!(result = size in a == size in b && equal_internal(a[size], b[size], stack))) {
          break;
        }
      }
    }
  } else {
    // Objects with different constructors are not equivalent.
    if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) {
      return false;
    }
    // Deep compare objects.
    for (var key in a) {
      if (a.hasOwnProperty(key)) {
        // console.log('equal', key);
        // Count the expected number of properties.
        size++;
        // Deep compare each member.
        if (!(result = b.hasOwnProperty(key) && equal_internal(a[key], b[key], stack))) {
          break;
        }
      }
    }
    // Ensure that both objects contain the same number of properties.
    if (result) {
      for (key in b) {
        if (b.hasOwnProperty(key) && !(size--)) {
          break;
        }
      }
      result = !size;
    }
  }
  // Remove the first object from the stack of traversed objects.
  stack.pop();
  return result;
};

Y.namespace('ACMACS').equal = function (a, b) 
{
  return equal_internal(a, b, []);
};

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * js2-basic-offset: 2
 * End:
 */
