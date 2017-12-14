/*
  # license
  # license.
*/

// ======================================================================

var TOOLTIP_CANCEL = Y.publish('acmacs-tooltip-cancel', {broadcast: true}); // fired by widgets to tell tooltip to cancel

// ======================================================================

Y.namespace('ACMACS').Tooltip = Y.Base.create('acmacsTooltip', Y.Widget, [],
{
  initializer: function (config) {
    this.plug(Y.Plugin.WidgetAnim, {duration: this.get('show_hide_duration')});
  },

  destructor: function () {
    console.log('acmacsTooltip destructor');
  },

  bindUI: function () {
    Y.delegate('mouseenter', this.show_tooltip_after_delay, Y.one('body'), "[tooltip]", this);
    Y.delegate('mouseleave', this.hide_tooltip, Y.one('body'), "[tooltip]", this);
    Y.delegate('click', this.hide_tooltip, Y.one('body'), "[tooltip]", this);
    //Y.delegate('mouseout', this.hide_tooltip, Y.one('body'), "[tooltip]", this);
    Y.on(TOOLTIP_CANCEL.type, this.hide_tooltip, this);
  },

  // first set delay, then change tooltip content, order is necessary when mouse moved fast between elements having tooltips
  show_tooltip_after_delay: function (e) {
    if (this.timer) {
      this.hide_tooltip();
    }
    this.timer = Y.later(this.get('show_delay') * 1000, this, function () {
                            this.show_tooltip(e);
                          });
  },

  show_tooltip: function (e) {
    var target = e.currentTarget,
        target_node = target.getDOMNode(),
        client_height, node_xy, offset, text;
    //console.log('show_tooltip', target.getAttribute("tooltip"), target, target_node);
    if (target_node && target_node.offsetParent) { // target node not destroyed yet
      //this.get("contentBox").setContent(this.decode_html(target.getAttribute("tooltip")));
      try {
        offset = target.getAttribute("tooltip_offset").split(/ +/);
        if (offset.length !== 2) {
          offset = this.get('offset');
        }
        node_xy = target.getXY();
        client_height = target_node.clientHeight || target_node.offsetHeight || 10;
        this.get("contentBox").setContent(target.getAttribute("tooltip") || '');
        this.get('boundingBox').setStyles({left: node_xy[0] + parseInt(offset[0], 10), top: node_xy[1] + client_height + parseInt(offset[1], 10)});
      }
      catch (err) {
        console.error('Error showing tooltip', err);
      }
      this.show();
    }
  },

  hide_tooltip: function () {
    if (this.timer) {
      this.timer.cancel();
      this.timer = null;
    }
    this.hide();
  },

  tooltipable_node_destroyed: function (e) {
    console.log('tooltipable_node_destroyed', e);
  }

}, {
  ATTRS: {
    offset: {
      value: [10, 10]
    },
    show_delay: {               // delay upon target node hovering before tooltip is shown
      value: 1                  // seconds
    },
    show_hide_duration: { // show/hide animation duration
      value: 0.3
    },
    render: {
      value: true
    },
    visible: {
      value: false
    }
  }
});

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * js2-basic-offset: 2
 * End:
 */
