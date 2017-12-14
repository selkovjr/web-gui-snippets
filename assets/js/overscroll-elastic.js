/*global Y: false, document: false */

var code = {
  // * Boolean flags indicating the overscrolling status at each of the four
  // sides.
  wasOverscrolling: {
    x: {
      top: false, // right
      bottom: false // left
    },
    y: {
      top: false,
      bottom: false
    }
  },

  // * This flag indicates the condition where the bounding box of the map is
  // partly outside the viewport but its dimensions do not exceed those of the
  // viewport. This condition can occur at a low zoom level when, for example,
  // the map is translated to the edge of the viewport and then rotated or
  // reflected out of it. This condition is equivalent to overscrolling, except
  // it already exists on `mousedown`.
  initialOverscroll: false,  /* presently not used because it is not
                                clear how to handle this situation */

  constrainedPointerPanStart: function (e) {
    var shift = {x: 0, y: 0};

    this.pickupPoint.x = e.pageX;
    this.pickupPoint.y = e.pageY;

    // Establish the initial amount of overscroll.
    Y.each(['x', 'y'], Y.bind(function (dimension) {
      if (this.zoomRatio()[dimension] <= 1) {
        if (this.bBoxRange(dimension).top < 0) {
          this.wasOverscrolling[dimension].top = true;
          shift[dimension] = this.bBoxRange(dimension).top;
        }
        if (this.bBoxRange(dimension).bottom > this.viewportSize(dimension)) {
          this.wasOverscrolling[dimension].bottom = true;
          shift[dimension] = this.bBoxRange(dimension).bottom - this.viewportSize(dimension);
        }
      }
      else {
        if (this.bBoxRange(dimension).bottom < this.viewportSize(dimension)) {
          this.wasOverscrolling[dimension].top = true;
          shift[dimension] = this.bBoxRange(dimension).bottom - this.viewportSize(dimension);
        }
        if (this.bBoxRange(dimension).top > 0) {
          this.wasOverscrolling[dimension].top = true;
          shift[dimension] = this.bBoxRange(dimension).top;
        }
      }
    }, this));

    // Shift the map to indicate the initial overscroll
    if (shift.x !== 0 || shift.y !== 0) {
      this.initialOverscroll = true;
      this.shift(shift.x, shift.y);
      this.pan(-shift.x, -shift.y);
      this.pickupPoint.x -= shift.x;
      this.pickupPoint.y -= shift.y;
    }
  },

  constrainedPointerPanEnd: function (e) {
    this.shift(0, 0);
    this.initialOverscroll = false;
  },

  constrainedPointerPan: function (e) {
    var eventDelta = {x: null, y: null},
        panPart,
        shiftPart,
        action = {shift: {x: null, y: null}, pan: {x: null, y: null}},
        dimension;

    e.x = e.pageX;
    e.y = e.pageY;

    eventDelta.x = e.x - this.pickupPoint.x;
    eventDelta.y = e.y - this.pickupPoint.y;

    Y.each(['x', 'y'], Y.bind(function (dimension) {
      var limit = this.viewportSize(dimension);

      if (this.aboutToEndOverscroll(eventDelta, dimension)) {
        // About to regress from overscroll. The motion must be divided
        // between the shift portion cancelling the overscroll and the
        // pan motion. The pan part is exactly equal to eventDelta
        // because the pick-up point did not change during overscroll.
        // The shift part does not matter because we're simply
        // eliminating the entire shift amount.
        if (
          this.zoomRatio()[dimension] < 1 && (Math.abs(eventDelta[dimension]) + this.bBoxRange(dimension).span >= limit) ||
          this.zoomRatio()[dimension] >= 1 && (Math.abs(eventDelta[dimension]) > this.bBoxRange(dimension).span - limit)
        ) {
          // Abrupt reversal
          if (this.wasOverscrolling[dimension].top) {
            if (this.zoomRatio()[dimension] <= 1) {
              panPart = limit - this.bBoxRange(dimension).bottom;
              shiftPart = this.bBoxRange(dimension).bottom + eventDelta[dimension] - limit;
            }
            else {
              panPart = 0 - this.bBoxRange(dimension).top;
              shiftPart = this.bBoxRange(dimension).top + eventDelta[dimension];
            }
            // ----------------------- A C T I O N ---------------------------
            action.pan[dimension] = panPart;
            action.shift[dimension] = shiftPart;
            // ---------------------------------------------------------------
            this.pickupPoint[dimension] += panPart;
            this.wasOverscrolling[dimension].top = false;
            this.wasOverscrolling[dimension].bottom = true;
          }
          else if (this.wasOverscrolling[dimension].bottom) {
            if (this.zoomRatio()[dimension] <= 1) {
              panPart =  0 - this.bBoxRange(dimension).top;
              shiftPart = this.bBoxRange(dimension).top + eventDelta[dimension];
            }
            else {
              panPart = limit - this.bBoxRange(dimension).bottom;
              shiftPart = this.bBoxRange(dimension).bottom + eventDelta[dimension] - limit;
            }
            // ----------------------- A C T I O N ---------------------------
            action.pan[dimension] = panPart;
            action.shift[dimension] = shiftPart;
            // ---------------------------------------------------------------
            this.pickupPoint[dimension] += panPart;
            this.wasOverscrolling[dimension].bottom = false;
            this.wasOverscrolling[dimension].top = true;
          }
        }
        else {
          // ----------------------- A C T I O N ---------------------------
          action.pan[dimension] = eventDelta[dimension];
          action.shift[dimension] = 0;
          // ---------------------------------------------------------------
          this.pickupPoint[dimension] = e[dimension];
          if (this.wasOverscrolling[dimension].top) {
            this.wasOverscrolling[dimension].top = false;
          }
          if (this.wasOverscrolling[dimension].bottom) {
            this.wasOverscrolling[dimension].bottom = false;
          }
        }
      }

      else if (this.aboutToOverscrollPositively(eventDelta, dimension)) {
        // About to overscroll beyond the positive end. The motion will
        // be divided between the pan part and the shift part.
        if (this.zoomRatio()[dimension] < 1) {
          // This cas is identical to negative overscroll at zoom >= 1
          panPart = limit - this.bBoxRange(dimension).bottom;
          shiftPart = this.bBoxRange(dimension).bottom + eventDelta[dimension] - limit;
        }
        else {
          // This cas is identical to negative overscroll at zoom < 1
          panPart = 0 - this.bBoxRange(dimension).top;
          shiftPart = this.bBoxRange(dimension).top + eventDelta[dimension] - 0;
        }
        // ----------------------- A C T I O N ---------------------------
        action.pan[dimension] = panPart;
        action.shift[dimension] = shiftPart;
        // ---------------------------------------------------------------
        this.pickupPoint[dimension] += panPart;
        this.wasOverscrolling[dimension].bottom = true;
        this.wasOverscrolling[dimension].top = false;
      }

      else if (this.aboutToOverscrollNegatively(eventDelta, dimension)) {
        // About to overscroll beyond the negative end. The motion will
        // be divided between the pan part and the shift part.
        if (this.zoomRatio()[dimension] < 1) {
          panPart = 0 - this.bBoxRange(dimension).top;
          shiftPart = this.bBoxRange(dimension).top + eventDelta[dimension] - 0;
        }
        else {
          panPart = limit - this.bBoxRange(dimension).bottom;
          shiftPart = this.bBoxRange(dimension).bottom + eventDelta[dimension] - limit;
        }
        // ----------------------- A C T I O N ---------------------------
        action.pan[dimension] = panPart;
        action.shift[dimension] = shiftPart;
        // ---------------------------------------------------------------
        this.pickupPoint[dimension] += panPart;
        this.wasOverscrolling[dimension].top = true;
        this.wasOverscrolling[dimension].bottom = false;
      }

      else if (this.deepOverscroll(dimension)) {
        // Deep overscroll (increasing or decreasing the existing
        // overscroll, but not enough to cancel it entirely).
        // ----------------------- A C T I O N ---------------------------
        action.shift[dimension] = e[dimension] - this.pickupPoint[dimension];
        // ---------------------------------------------------------------

        // Remembor the state of overscrolling for the next event.
        if (this.zoomRatio()[dimension] <= 1) {
          // A zoom ratio exactly equal to 1 is just as good as a smaller ones.
          if (this.bBoxRange(dimension).top <= 0) {
            this.wasOverscrolling[dimension].top = true;
          }
          else {
            this.wasOverscrolling[dimension].bottom = true;
          }
        }
        else {
          if (this.bBoxRange(dimension).top >= 0) {
            this.wasOverscrolling[dimension].bottom = true;
          }
          else if (this.bBoxRange(dimension).bottom <= limit) {
            this.wasOverscrolling[dimension].top = true;
          }
        }
      }
      else {
        // Normal action
        // ----------------------- A C T I O N ---------------------------
        action.pan[dimension] = e[dimension] - this.pickupPoint[dimension];
        // ---------------------------------------------------------------
        this.pickupPoint[dimension] = e[dimension];
        this.wasOverscrolling[dimension].top = false;
        this.wasOverscrolling[dimension].bottom = false;
      }
    }, this));

    // Apply shift and pan
    if (action.shift.x !== null || action.shift.y !== null) {
      this.shift(
        action.shift.x === null ? 0 : action.shift.x,
        action.shift.y === null ? 0 : action.shift.y
      );
    }
    if (action.pan.x !== null || action.pan.y !== null) {
      this.pan(
        action.pan.x === null ? 0 : action.pan.x,
        action.pan.y === null ? 0 : action.pan.y
      );
    }
  },

  aboutToOverscrollPositively: function (eventDelta, dimension) {
    if (dimension === 'x' || dimension === 'y') {
      if (this.zoomRatio()[dimension] < 1) {
        return this.bBoxRange(dimension).bottom < this.viewportSize(dimension) &&
               this.bBoxRange(dimension).bottom + eventDelta[dimension] >= this.viewportSize(dimension);
      }
      else {
        return this.bBoxRange(dimension).top < 0 &&
               this.bBoxRange(dimension).top + eventDelta[dimension] >= 0;
      }
    }
    else {
      throw new Error('unkown dimension \'' + dimension + '\'');
    }
  },

  aboutToOverscrollNegatively: function (eventDelta, dimension) {
    if (dimension === 'x' || dimension === 'y') {
      if (this.zoomRatio()[dimension] < 1) {
        return this.bBoxRange(dimension).top > 0 &&
               this.bBoxRange(dimension).top + eventDelta[dimension] <= 0;
      }
      else {
        return this.bBoxRange(dimension).bottom > this.viewportSize(dimension) &&
               this.bBoxRange(dimension).bottom + eventDelta[dimension] <= this.viewportSize(dimension);
      }
    }
    else {
      throw new Error('unkown dimension \'' + dimension + '\'');
    }
  },

  aboutToEndOverscroll: function (eventDelta, dimension) {
    if (dimension === 'x' || dimension === 'y') {
      if (this.zoomRatio()[dimension] <= 1) {
        return this.wasOverscrolling[dimension].top && this.bBoxRange(dimension).top + eventDelta[dimension] > 0 ||
               this.wasOverscrolling[dimension].bottom && eventDelta[dimension] < 0;
      }
      else {
        return this.wasOverscrolling[dimension].top && this.bBoxRange(dimension).bottom + eventDelta[dimension] > this.viewportSize(dimension) ||
               this.wasOverscrolling[dimension].bottom && this.bBoxRange(dimension).top + eventDelta[dimension] < 0;
      }
    }
    else {
      throw new Error('unkown dimension \'' + dimension + '\'');
    }
  },

  deepOverscroll: function (dimension) {
    if (dimension === 'x' || dimension === 'y') {
      if (this.zoomRatio()[dimension] <= 1) {
        return this.bBoxRange(dimension).top <= 0 ||
               this.bBoxRange(dimension).bottom >= this.viewportSize(dimension);
      }
      else {
        return this.bBoxRange(dimension).top >= 0 ||
               this.bBoxRange(dimension).bottom <= this.viewportSize(dimension);
      }
    }
    else {
      throw new Error('unkown dimension \'' + dimension + '\'');
    }
  },


  // This function calculates the displacement of the first of the two springs connected
  // in series between the last known good position of the viewport and the
  // pointer. It could be replaced by a single constant, but having two
  // constants instead of one makes the mechanical analogy easier to imagine.
  // If the stiffness of the proximal spring, `k1`, is greater than the
  // stiffness of the distal spring, `k2`, the motion of the viewport will be
  // smaller than the motion of the pointer. Also, in this form, it is easier
  // to create a non-linear spring, should one be desired.
  elasticDisplacement: function (delta) {
    // These constants model the elasticities of two springs connected in
    // series betwee the pointer and the scrollable area, with the stiffer
    // spring connected to the scrollable.
    var k1 = 18,
        k2 = 1;

    if (this.initialOverscroll && 0) {
      // Can't use elasticity while regressing from initial overscroll
      // because it leads to cursor detachment.
      return delta;
    }
    return (k2 / (k1 + k2)) * delta;
  },

  cx: function () {
    var bbox = this.displayBoundingBox();
    return bbox.x + bbox.width / 2;
  },

  cy: function () {
    var bbox = this.displayBoundingBox();
    return bbox.y + bbox.height / 2;
  }
};

Y.namespace('ACMACS').ElasticOverscroll = code;

