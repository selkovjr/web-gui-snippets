YUI.add('acmacs-map-interactivity', function(Y) {

/*global Y: false */

/**
 * Interactivity mix-in for the ACMACS map widget
 * @module acmacs-map
 * @submodule acmacs-map-interactivity
 */

/**
This prototype adds interactivity to an otherwise non-interactive
[MapWidget](../classes/ACMACS.MapWidget.html).

Interactivity is defined as a set of input bindings for each of
several interactivity modes, in this general form:

    modalBindings: {
      mode1: {
        eventA: binding1
        eventB: binding2
        . . .
      },
      mode1: {
        eventA: binding3
        eventC: binding4
        . . .
      },
      . . .
    }

Modes allow different listeners subscribe to the same event.

Whenever a mode is selected by calling the (protected)
<a href="#method_setModalBindings">setModalBindings()</a> method,
the previous mode's bindings are unsubscribed.

Each binding is a combination of event type, keyboard modifier state,
and mouse button state mapped to a target widget and its listener method.
Bindings have this general form:


    event: {
      key: {
        button: {
          desc: 'Description of the action accomplished by this binding',
          display: 'Text to display on the help screen',
          target: 'targetNode', // The property of subscriber
          subscriber: '/path/to/widget',
          method: 'listenerMethod',
          halt: true // if so desired
        },
        . . .
      },
      . . .
    }

Here, __key__ represents a keyboard modifier, and __button__ -- a mouse button.

A keyboard modifier can be specified as follows:

  * `noKey` (subscriebs to events in which no modifire is pressed)
  * `allKeys` (subscribes to events in which any of the four modifiers is pressed)
  * `ctrlKey`
  * `shiftKey`
  * `altKey`
  * `metaKey`
  * a specific combination of modifiers, _e.g._, `'ctrlKey+shiftKey'`

The mouse button key can have one of these three values: `b1`, `b2`, `b3`. It may
be absent altogether, in which case the binding is included directly under the
keyboard modifier key, like so:

    mousewheel: {
      noKey: {
        desc: 'Zoom in / out',
        display: 'Scroll to zoom in and out',
        target: 'body',
        subscriber: '/layerStack',
        method: 'filteredPointerZoom',
        halt: true
      }
    }

@namespace ACMACS
@class MapWidgetInteractivity
@extends MapWidget
@static
*/
Y.namespace('ACMACS');

Y.ACMACS.MapWidgetInteractivity = function () {};
Y.ACMACS.MapWidgetInteractivity.prototype = {

  /**
   * Because firefox does not provide button information for mousemove events,
   * we need to remember what button was pressed on mousedown.
   * @property {String} button
   * @private
   */
  button: null,

  /**
   * This property is used to remember the last selected UI mode (navigation, labels, ...)
   * @property {String} mode
   * @private
   */
  mode: null,

  /**
   * This property is used to mark a `mouseenter` event.
   * @property {Boolean} incursion
   * @private
   */
  incursion: false,

  /**
   * The timer used to activate the i-button after a period of inactivity
   * @property {Object} iButtonDelayTimer
   * @private
   */
  iButtonDelayTimer: null,

  /**
   * Marks the current i-button visibility to prevent repeat activation
   * @property {Boolean} iButtonActive
   * @private
   */
  iButtonActive: false,

  /**
   * This structure defines user input bindings for each of the alternative interactivity modes.
   * @property {Object} modalBindings
   * @property {Object} modalBindings.navigation navigation bindings
   * @property {Object} modalBindings.labels     label-editing mode bindings
   * @protected
   */
  modalBindings: {
    navigation: {
      // The mousewheel event still (as of 3.5.0) does not have consistent
      // node-level support. It seems as though Mozilla only fires body-level
      // wheel events, so `Y` is the event target here.
      mousewheel: {
        noKey: {
          desc: 'Zoom in / out',
          display: 'Scroll to zoom in and out',
          target: 'body',
          subscriber: '/layerStack',
          method: 'filteredPointerZoom',
          halt: true
        },
        shiftKey: {
          desc: 'Rotate around the pointer',
          display: 'Rotate around the pointer',
          target: 'body',
          subscriber: '/layerStack',
          method: 'pointerRotate',
          halt: true
        },
        altKey: {
          desc: 'Rotate around viewport centre',
          display: 'Rotate around viewport centre',
          target: 'body',
          subscriber: '/layerStack',
          method: 'centredRotate',
          halt: true
        }
      },

      mousedown: {
        noKey: {
          b1: {
            desc: 'Pan the map by dragging',
            display: 'Click and drag anywhere on the map\\nto navigate it',
            target: 'targetNode', // The property of subscriber
            subscriber: '/layerStack',
            method: 'pointerStartDrag',
            halt: true
          },
          b3: { // See contextmenu binding below
            desc: 'Prevents context menu',
            target: 'targetNode',
            subscriber: '/layerStack',
            method: null, // Assign listener here
            halt: true
          }
        },
        ctrlKey: {
          b1: {
            desc: 'Toggle point selection (if followed by mouseup)',
            altDesc: 'Enter point selection mode (if followed by mousemove)',
            display: 'Click and release to toggle point selection.\\nClick and drag to select a range of points.',
            target: 'targetNode',
            subscriber: '/layerStack',
            method: 'pointerSelectStart',
            halt: true
          },
          b3: {
            desc: 'Toggle point selection (if followed by mouseup)',
            altDesc: 'Enter point selection mode (if followed by mousemove)',
            display: 'Click and release to toggle point selection.\\nClick and drag to select a range of points.',
            target: 'targetNode',
            subscriber: '/layerStack',
            method: 'pointerSelectStart',
            halt: true
          }
        },

        shiftKey: {
          b1: {
            desc: 'Click and drag a single point or a selected set of points',
            display: 'Click on a point to drag it.\\nIf any points are selected, only\\nthose points will be moved.',
            target: 'targetNode',
            subscriber: '/layerStack',
            method: 'pointerMoveStart',
            halt: true
          }
        },

        altKey: {
          desc: 'Flip the map by clicking off-centre to set the direction of flip',
          display: 'Flip the map by clicking off-centre\\nto set the direction of flip.\\nAny mouse button can be used.',
          target: 'targetNode',
          subscriber: '/layerStack',
          method: 'pointerFlip',
          halt: true
        },

        metaKey: {
          b1: {
            desc: 'Toggle point selection (if followed by mouseup)',
            altDesc: 'Enter point selection mode (if followed by mousemove)',
            display: 'Click and release to toggle point selection.\\nClick and drag to select a range of points.',
            target: 'targetNode',
            subscriber: '/layerStack',
            method: 'pointerSelectStart',
            halt: true
          }
        },

        'ctrlKey+shiftKey': {
          b1: {
            desc: 'Toggle point selection (if followed by mouseup)',
            altDesc: 'Enter point de-selection mode (if followed by mousemove)',
            display: 'Click and release to toggle point selection.\\nClick and drag to de-select a range of points.',
            target: 'targetNode',
            subscriber: '/layerStack',
            method: 'pointerDeselectStart',
            halt: true
          },
          b3: {
            desc: 'Toggle point selection (if followed by mouseup)',
            altDesc: 'Enter point de-selection mode (if followed by mousemove)',
            display: 'Click and release to toggle point selection.\\nClick and drag to de-select a range of points.',
            target: 'targetNode',
            subscriber: '/layerStack',
            method: 'pointerDeselectStart',
            halt: true
          }
        },
        'altKey+metaKey': {
          b1: {
            desc: 'Toggle point selection (if followed by mouseup)',
            altDesc: 'Enter point de-selection mode (if followed by mousemove)',
            display: 'Click and release to toggle point selection.\\nClick and drag to de-select a range of points.',
            target: 'targetNode',
            subscriber: '/layerStack',
            method: 'pointerDeselectStart',
            halt: true
          }
        }
      },

      dblclick: {
        noKey: {
          b1: {
            desc: 'Fit to viewport',
            display: 'Double-click to fit the map to viewport',
            target: 'targetNode', // The property of subscriber
            subscriber: '/layerStack',
            method: 'fitToViewport',
            halt: true
          }
        }
      },

      'point-clicked': {
        noKey: {
          desc: 'Widget event fired in response to a (modified) mousedown event that toggles point selection (Meta-click)',
          target: 'subscriber',
          subscriber: '/',
          emitter: true,
          method: 'toggleEventTarget'
        }
      },

      'point-hit': {
        noKey: {
          desc: 'Widget event fired when a mousemove event occurs over a point or a stack of points',
          target: 'subscriber',
          subscriber: null,
          emitter: true,
          method: null
        }
      },

      'point-abandoned': {
        noKey: {
          desc: 'Widget event fired when the mouse pointer leaves the last point in a stack of overlapping points',
          target: 'subscriber',
          subscriber: null,
          emitter: true,
          method: null
        }
      },

      mouseenter: {
        allKeys: {
          desc: 'A non-GUI event that allows the widget to have an idea of "focus"',
          target: 'targetNode',
          subscriber: '/layerStack',
          method: 'enter',
          halt: false
        }
      },

      mouseleave: {
        allKeys: {
          desc: 'A non-GUI event that allows the widget to have an idea of "losing focus"',
          target: 'targetNode',
          subscriber: '/layerStack',
          method: 'leave',
          halt: false
        }
      },

      mousemove: {
        noKey: {
          desc: 'Follow pointer movements to see if any points get hit',
          display: 'Hover over a point to see its label',
          target: 'body',
          subscriber: '/layerStack',
          method: 'hitTest'
        },
        allKeys: {
          b1: {
            desc: 'Continued drag operation',
            target: 'body',
            subscriber: '/layerStack',
            method: 'pointerContinueDrag',
            halt: true
          },
          b3: {
            desc: 'Continued drag operation',
            target: 'body',
            subscriber: '/layerStack',
            method: 'pointerContinueDrag',
            halt: true
          }
        }
      },

      'mousemove-end': {
        noKey: {
          desc: 'Fires a set period of time after pointer movement has ceased',
          target: 'subscriber',
          subscriber: '/',
          emitter: true,
          method: 'mousemoveEnd'
        }
      },

      mouseup: {
        allKeys: {
          b1: {
            desc: 'End a drag operation in progress',
            target: 'body',
            subscriber: '/layerStack',
            method: 'pointerStopDrag',
            halt: true
          },
          b3: {
            desc: 'End a drag operation in progress',
            target: 'body',
            subscriber: '/layerStack',
            method: 'pointerStopDrag',
            halt: true
          }
        }
      },

      contextmenu: {
        allKeys: { // allKeys includes no modifier
          desc: 'Prevent browser context menu inside the widget',
          target: 'targetNode', // The property of subscriber
          subscriber: '/layerStack',
          method: null, // Prevent context menu
          halt: true
        }
      },

      selectedChange: {
        noKey: {
          desc: 'A non-GUI event to communicate selection changes to subscribers',
          moment: 'after',
          target: 'subscriber',
          subscriber: '/layerStack/map',
          emitter: true,
          method: 'updateSelectionHighlights'
        }
      }
    }, // navigation

    labels: {
      mousedown: {
        allKeys: {
          b1: {
            desc: 'Drag a label to a different place',
            target: 'targetNode',
            subscriber: '/layerStack',
            emitter: true,
            method: 'labelHitTest', // calls pointerLabelMoveStart()
            halt: true
          }
        }
      },

      mousemove: {
        noKeys: {
          desc: 'Hover',
          target: 'body',
          subscriber: '/layerStack',
          method: 'pointerContinueDrag',
          halt: true
        },
        allKeys: {
          b1: {
            desc: 'Continued label drag operation',
            target: 'body',
            subscriber: '/layerStack',
            method: 'pointerContinueDrag',
            halt: true
          }
        }
      },

      mouseup: {
        allKeys: {
          b1: {
            desc: 'End the label drag operation in progress',
            target: 'body',
            subscriber: '/layerStack',
            method: 'pointerStopDrag', // calls labelHitTest()
            halt: true
          }
        }
      }
    } // labels
  },


  /**
   * Update event subscriptions according to the current UI mode.
   *
   * This method is somewhat wasteful because it installs a listener for each
   * `eventType`+`modifier` combination instead of creating a single listener
   * that would be able to filter modifiers during each event firing,
   * but it is a small overhead and it makes a lot of * things easier.
   *
   * @method setModalBindings
   * @param {String} selectedMode The UI mode to select
   * @protected
   */
  setModalBindings: function (selectedMode) {
    var widget = this; // to have a reference to this in the listeners bound to subscriber

    this.mode = selectedMode;
    Y.log(['setting mode: ' + this.mode, this]);

    Y.each(this.uiListeners, function (handle) {
      handle.detach();
    });
    this.uiListeners = [];

    Y.each(this.modalBindings, Y.bind(function (modeMap, mode) {
      // Each binding mode: navigation, label editing, etc.
      if (mode === selectedMode) {
        Y.each(modeMap, Y.bind(function (bindings, eventType) {
          // Each event type: mousdown, mousewheel, etc.
          Y.each(bindings, Y.bind(function (binding, kbMod) {
            // Each modifier
            //
            // See whether it's bound to a button
            var buttonBindings;

            if (binding.b1 || binding.b2 || binding.b3) {
              buttonBindings = binding;
            }
            else {
              buttonBindings = {any: binding};
            }

            Y.each(buttonBindings, Y.bind(function (buttonBinding, button) {
              // Each button-specific binding for this eventType, or 'any' if
              // not specific
              var target,
                  moment = 'on',
                  modifier,
                  subscriber;

              if (buttonBinding.subscriber) {
                subscriber = this.find(buttonBinding.subscriber);

                if (subscriber) {
                  modifier = {
                    shiftKey: false,
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false
                  };

                  Y.each(kbMod.split(/\s*\+\s*/), function (mod) {
                    modifier[mod] = true;
                  });

                  if (buttonBinding.moment === 'after') {
                    moment = 'after';
                  }

                  Y.log([mode, eventType, kbMod, button, modifier, buttonBinding.subscriber, buttonBinding.target, subscriber.instanceName, buttonBinding.method]);
                  if (buttonBinding.target === 'body') {
                    target = Y;
                  }
                  else if (buttonBinding.target === 'subscriber') {
                    target = subscriber;
                  }
                  else {
                    target = subscriber[buttonBinding.target];
                    if (!target) {
                      throw new Error('(2) \'' + buttonBinding.subscriber + '\' does not contain \'' + buttonBinding.target + '\'');
                    }
                  }

                  this.uiListeners.push(target[moment](eventType, Y.bind(function (e) {
                    // Normalise event co-ordinates
                    e.x = e.pageX - this.get('contentBox').getX();
                    e.y = e.pageY - this.get('contentBox').getY();

                    if (eventType === 'mousewheel' && widget.iButtonDelayTimer) {
                      widget.iButtonDelayTimer.cancel();
                    }

                    if (eventType === 'mousedown' || eventType === 'mousewheel') {
                      if (widget.iButtonActive) {
                        widget.hideIButton();
                      }
                    }

                    if (eventType === 'mousedown' || eventType === 'mousewheel') {
                      widget.incursion = false;
                    }

                    // Because firefox does not provide button information for mousemove events,
                    // we need to remember what button was pressed on mousedown.
                    if (eventType === 'mousedown') {
                      widget.button = e.button;
                    }
                    if (eventType === 'mouseup') {
                      widget.button = null;
                    }
                    if (eventType === 'mousemove') {
                      e.button = widget.button;
                    }

                    // Without this test, all widgets on the page subscribed to
                    // body-level events will respond to this event. Testing
                    // for content box instead of the SVG canvas because events
                    // on a blank canvas fall through in Safari.
                    if (target === Y && !this.get('contentBox').contains(e.target)) {
                      if ((eventType === 'mouseup' || eventType === 'mousemove') && subscriber.operation) {
                        // The assumption here is that only one widget on the page
                        // can have an active (non-null) operation (widgets are
                        // responsible for cleaning up their operation state). So if
                        // there is an active widget, it has the right to know about
                        // the `mouseup` event anywhere on the screen, so it can
                        // cancel the operation in progress.
                        Y.mix(e, {outside: true});
                        subscriber[buttonBinding.method](e);
                      }
                      else {
                        return;
                      }
                    }

                    if (
                      kbMod === 'allKeys' || (
                        e.shiftKey === modifier.shiftKey &&
                          e.ctrlKey ===  modifier.ctrlKey &&
                            e.altKey === modifier.altKey &&
                              e.metaKey === modifier.metaKey
                      ) ||
                      (
                        kbMod === 'noKey' && !(
                          e.shiftKey || e.ctrlKey || e.altKey || e.metaKey
                        )
                      )
                    ) {
                      if (button === 'any' || button === 'b' + e.button) {
                        if (buttonBinding.halt) {
                          e.halt();
                        }
                        if (buttonBinding.method) {
                          this[buttonBinding.method](e);
                        }
                      }
                    }
                  }, subscriber)));
                } // subscriber found
                else {
                  throw new Error('(1) \'' + this.name + '\' does not contain \'' + buttonBinding.subscriber + '\'');
                }
              } // non-null subscriber path provided
            }, this)); // each button-specific binding
          }, this)); // each modifier
        }, this)); // each event type
      } // mode === selectedMode
    }, this)); // each binding mode

    this.uiListeners.push(Y.on('keydown', Y.bind(function (e) {
      if (this === Y.ACMACS.selectedMapWidget) {
        Y.log(['keydown', this, Y.ACMACS.selectedMapWidget, e]);
        this.hideIButton();
      }
    }, this)));

    // If this prototype is actually used by a MapWidget...
    if (this.layerStack) {
      this.uiListeners.push(this.layerStack.targetLayer.on('mouseenter', Y.bind(function (e) {
        if (!this.layerStack.operation) {
          this.incursion = true;
        }
      }, this)));

      this.uiListeners.push(this.layerStack.targetLayer.on('mouseleave', Y.bind(function (e) {
        this.incursion = false;
      }, this)));

      this.uiListeners.push(this.on('mousemove-end', Y.bind(function (e) {
        // Prevent repeat activation of the i-button on `mousemove-end` events not
        // preceded by an excursion outside the widget.
        if (this.incursion && !this.iButtonActive) {
          this.showIButton(null);
        }
        this.incursion = false;
      }, this)));

      this.uiListeners.push(Y.on('blur', Y.bind(function (e) {
        if (this === Y.ACMACS.selectedMapWidget) {
          Y.log('Window blur event in selected widget');
          this.hideIButton();
        }
      }, this)));

      this.uiListeners.push(Y.on('keyup', Y.bind(function (e) {
        if (this === Y.ACMACS.selectedMapWidget) {
          Y.log(['keyup', e]);
          this.hideIButton();
        }
      }, this)));
    } // layerStack exists

  }, // setModalBindings()


  /**
   * Set the timer for layer stack's `showIButton` method.
   *
   * This method is somehow essential. Calling `layerStack.showIButton()`
   * directly makes the button remain active after `layerStack.leave()`.
   *
   * @method showIButton
   * @private
   */
  showIButton: function () {
    this.iButtonDelayTimer = Y.later(Y.ACMACS.profile.get('iButtonDelay'), this, function () {
      this.layerStack.showIButton();
      this.iButtonActive = true;
    });
  },


  /**
   * Set the timer for layer stack's `showMapHud` method to display bindings
   * for the active keyboard modifier.
   *
   * @method showBindingsFor
   * @param {String} mod The modifier to show bindings for
   * @private
   */
  showBindingsFor: function (mod) {
    this.hudHelpDelayTimer = Y.later(Y.ACMACS.profile.get('iButtonDelay'), this, function () {
      var
        list = [],
        comboList = [],
        modCombo,
        modComboKey = '';

      Y.log(['modifier bindings for', mod, this.mode]);

      modCombo = mod || 'no'; // to form 'noKey'

      Y.each(modCombo.split('+'), function (key) {
        comboList.push(key + 'Key');
      });
      modComboKey = comboList.join('+');

      Y.each(this.modalBindings[this.mode], function (binding, eventType) {
        var mb;

        if (binding[modComboKey]) {
          mb = binding[modComboKey];
          if (mb.b1 || mb.b2 || mb.b3) {
            // if (mb.b1) {
            if (mb.b1 && mb.b1.display) {
              list.push({
                event: eventType,
                button: 1,
                display: mb.b1.display
              });
            }
            // if (mb.b2) {
            if (mb.b2 && mb.b2.display) {
              list.push({
                event: eventType,
                button: 2,
                display: mb.b2.display
              });
            }
            // if (mb.b3) {
            if (mb.b3 && mb.b3.display) {
              list.push({
                event: eventType,
                button: 3,
                display: mb.b3.display
              });
            }
          }
          // else {
          else if (mb.display) {
            list.push({
              event: eventType,
              button: 0,
              display: mb.display
            });
          }
        }
      });

      this.layerStack.showMapHud(mod, this.listKeyboardModifiers(), list);

      this.hudActive = true;
    }); // set up this.hudHelpDelayTimer
  }, // showBindingsFor

  /**
   * Call layer stack's `hideIButton()` method and cancel the timer if it is
   * presently armed.
   *
   * @method hideIButton
   * @private
   */
  hideIButton: function () {
    if (this.iButtonDelayTimer) {
      this.iButtonDelayTimer.cancel();
    }
    this.layerStack.hideIButton();
    this.iButtonActive = false;
  },

  /**
   * List all possible keyboard modifier combinations for the selected UI mode.
   *
   * @method listKeyboardModifiers
   * @private
   */
  listKeyboardModifiers: function () {
    var
      list = [],
      seen = {};


    Y.each(Y.Object.keys(this.modalBindings[this.mode]).sort(), Y.bind(function (eventType) {
      Y.each(Y.Object.keys(this.modalBindings[this.mode][eventType]), function (mod) {
        var
          comboList = [],
          combo;

        if (mod !== 'noKey' && mod !== 'allKeys') {
          Y.each(mod.split('+'), function (key) {
            var m = key;
            m = m.replace(/Key/, '');
            m = m.replace(/^[a-z]/, function (c) {
              return c.toUpperCase();
            });
            comboList.push(m);
          });
          combo = comboList.join('+');

          if (!seen[combo]) {
            list.push(combo);
            seen[combo] = true;
          }
        }
      });
    }, this));
    return list;
  },

  // List all bindings for a mode, or for current mode if no argument is given.
  listBindings: function (arg) {
    var
      mode = arg || this.mode,
      list = [];

    Y.each(Y.Object.keys(this.modalBindings[mode]).sort(), Y.bind(function (eventType) {
      Y.each(this.modalBindings[mode][eventType], function (modifiedEventBindings, mod) {
        var b;

        Y.each([1, 2, 3], function (n) {
          var
            buttonKey = 'b' + n,
            b = {
              eventType: eventType,
              mod: mod
            };

          if (modifiedEventBindings[buttonKey]) {
            b.button = n.toString();
            b.desc = modifiedEventBindings[buttonKey].desc;
            b.altDesc = modifiedEventBindings[buttonKey].altDesc;
            b.halt = modifiedEventBindings[buttonKey].halt;
            b.method = modifiedEventBindings[buttonKey].method;
            b.emitter = modifiedEventBindings[buttonKey].emitter;
            b.subscriber = modifiedEventBindings[buttonKey].subscriber;
            b.target = modifiedEventBindings[buttonKey].target;
            list.push(b);
          }
        });

        if (!modifiedEventBindings.b1 && !modifiedEventBindings.b2 && !modifiedEventBindings.b3) {
          b = {
            eventType: eventType,
            mod: mod
          };
          b.button = 'any';
          b.desc = modifiedEventBindings.desc;
          b.altDesc = modifiedEventBindings.altDesc;
          b.halt = modifiedEventBindings.halt;
          b.method = modifiedEventBindings.method;
          b.emitter = modifiedEventBindings.emitter;
          b.subscriber = modifiedEventBindings.subscriber;
          b.target = modifiedEventBindings.target;
          list.push(b);
        }
      });
    }, this));
    return list;
  }
};

}, '@VERSION@', {
  requires: ['base', 'node', 'acmacs-base']
});
/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
