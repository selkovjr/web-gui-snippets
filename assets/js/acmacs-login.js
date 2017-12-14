/*
  # license
  # license.
*/

/*jslint plusplus: false, nomen: false */
/*global document: false, window: false */

// ======================================================================

var TEXT = Y.ACMACS.TEXT.acmacs_login;

var LoginPanel2_m =
{
  initializer: function () {
    this.set('zIndex', 2000);
    // this.plug(Y.Plugin.WidgetAnim, {duration: this.get('duration')});
    this.listeners = [];
  },

  destructor: function () {
    this.username.destroy();
    this.password.destroy();
  },

  renderUI : function () {
    this.get('contentBox').append('<div class="yui3-acmacsloginpanel2-header">' +
                                  '<img class="yui3-acmacsloginpanel2-logo" src="/s/img/logo.png" />' +
                                  '<form><fieldset><ul>' +
                                  '<li name="report_problems" class="yui3-acmacsloginpanel2-link"><a href="" name="report_problems">' + TEXT.report_problems + '</a></li>' +
                                  '<li name="register" class="yui3-acmacsloginpanel2-link"><a href="" name="register">' + TEXT.sign_up + '</a></li>' +
                                  '<li name="username" class="yui3-acmacsloginpanel2-credentials" />' +
                                  '<li name="password" class="yui3-acmacsloginpanel2-credentials" />' +
                                  '<li name="submit"><button type="submit" name="login" class="submit" tabindex="3">' + TEXT.sign_in + '</button></li>' +
                                  '<li name="forgot_password" class="yui3-acmacsloginpanel2-link"><a href="" name="forgot_password">' + TEXT.forgot_password + '</a></li>' +
                                  '</ul></fieldset></form></div>' +
                                  '<div class="yui3-acmacsloginpanel2-body"><table><tr><td name="text">' + Y.ACMACS.TEXT.introduction.text + '</td><td name="figure"><img src="s/img/antigenic-map.jpg" />' + Y.ACMACS.TEXT.introduction.figure + '</td></tr></table></div>'
                                 );
    this.username = new Y.CHERRY.InputWithHelpMessage({render: this.get('contentBox').one('li[name="username"]'), empty_value: 'Username'});
    this.username.input().setAttrs({name: 'username', autocomplete: 'on'});
    this.password = new Y.CHERRY.InputWithHelpMessage({render: this.get('contentBox').one('li[name="password"]'), empty_value: 'Password'});
    this.password.input().setAttrs({name: 'password', type: 'password', autocomplete: 'on'});
  },

  bindUI: function () {
    this.listeners.push(this.after('visibleChange', this.shown_hidden, this));

    this.listeners.push(this.get('contentBox').one('button[name="login"]').on('click', function (e) {
      e.halt();
      this.get('loginCallback')(this.get_credentials());
      this.clear_credentials();
    }, this));
    this.listeners.push(this.username.input().on('keydown', function (e) {
      if (e.which === 13) {
        e.halt();
        this.password.focus();
      }
    }, this));

    // No esc nor cancel possible
    this.listeners.push(this.get("boundingBox").on('keydown', function (e) {
      if (e.which === 27) {
        e.halt();
      }
    }, this));

    this.listeners.push(this.get('contentBox').one('a[name="register"]').on('click', function (e) {
      e.halt();
      Y.ACMACS.events.REQUEST_REGISTRATION.fire({attached_to: e.currentTarget});
    }, this));
    this.listeners.push(this.get('contentBox').one('a[name="report_problems"]').on('click', function (e) {
      e.halt();
      Y.ACMACS.events.REPORT_PROBLEM.fire({attached_to: e.currentTarget});
    }, this));
    this.listeners.push(this.get('contentBox').one('a[name="forgot_password"]').on('click', function (e) {
      e.halt();
      Y.ACMACS.events.FORGOT_PASSWORD.fire({attached_to: e.currentTarget});
    }, this));
  },

  shown_hidden: function (e) {
    if (e.newVal === true && e.prevVal === false) { // shown
      console.log(this.constructor.NAME, 'shown');
      this.get('maskNode').addClass(this.getClassName('mask')).setStyle('opacity', 1.0);
      this.username.focus();
      this.warn_about_ie();
    }
  },

  get_credentials: function () {
    return {user: this.username.value(), password: this.password.value()};
  },

  clear_credentials: function () {
    this.username.reset();
    this.password.reset();
  },

  show_login_failure: function (message) {
    var msg = new Y.CHERRY.ErrorMessage({
      message: message || TEXT.login_failed,
      hide_interval: 2000,
      attached_to: this.username.get('contentBox'),
      attached_to_triangle: false,
      attached_to_offset_top: 23,
      attached_to_offset_left: 20,
      callback_on_hiding: Y.bind(function (dialog) {
        dialog.destroy();
        this.username.focus();
      }, this),
      destroy_on_hiding: false
    });
    msg.show();
    this.username.focus();
  },

  show_communication_failure: function () {
    this.show_login_failure(TEXT.communication_failure);
  },

  warn_about_ie: function () {
    if (Y.UA.ie > 0) {
      alert('Internet Explorer is not supported! Please use Google Chrome, Safari or Firefox for AcmacsWeb.');
    }
  }

};

// ======================================================================

var LoginPanel2_s =
{
  ATTRS: {
    loginCallback: {
      value: function () {
        console.log('loginCallback is not set');
      }
    },
    modal: { // this attribute is somehow ignored unless passed to the constructor
      value: true
    },
    render: {
      value: true
    },
    visible: {
      value: false
    },
    buttons: {
      value: []
    }
  }
};

Y.namespace('ACMACS').LoginPanel2 = Y.Base.create('acmacsLoginPanel2', Y.Panel, [], LoginPanel2_m, LoginPanel2_s);

// ======================================================================

Y.namespace('ACMACS').LoginPanel = Y.Base.create('acmacsLoginPanel', Y.Panel, [],
{
  initializer: function () {
    this.set('zIndex', 2000);
    this.plug(Y.Plugin.WidgetAnim, {duration: this.get('duration')});
    this.listeners = [];
  },

  // destructor: function () {
  // },

  renderUI : function () {
    this.setStdModContent(Y.WidgetStdMod.HEADER, '<h1>' + TEXT.title + '</h1>');
    this.setStdModContent(
      Y.WidgetStdMod.BODY,
      '<form id="acmacs-login-form">' +
        '<fieldset><table><tr>' +
        '<td><label>' + TEXT.username + '</label></td>' +
        '<td><input type="text" name="username" autocomplete="on" /></td>' +
        '<td><button type="submit" name="login" class="submit" tabindex="3">' + TEXT.sign_in + '</button></td>' +
        '</tr><tr>' +
        '<td><label>' + TEXT.password + '</label></td>' +
        '<td><input type="password" name="password" autocomplete="on" /></td>' +
        '<td class="' + this.getClassName('links') + '">' +
        '<a href="" name="register">' + TEXT.sign_up + '</a><br />' +
        '<a href="" name="report_problems">' + TEXT.report_problems + '</a><br />' +
        '<a href="" name="forgot_password">' + TEXT.forgot_password + '</a>' +
        '</td>' +
        '</tr></table>' +
        '</fieldset></form>');
  },

  bindUI: function () {
    var body = this.getStdModNode(Y.WidgetStdMod.BODY);
    this.listeners.push(this.after('visibleChange', this.shown_hidden, this));
    this.listeners.push(body.one('button[name="login"]').on('click', function (e) {
      e.halt();
      this.submit();
    }, this));

    this.listeners.push(body.one('input[name="username"]').on('keydown', function (e) {
      if (e.which === 13) {
        e.halt();
        body.one('input[name="password"]').focus();
      }
    }, this));

    // No esc nor cancel possible
    this.listeners.push(this.get("boundingBox").on('keydown', function (e) {
      if (e.which === 27) {
        e.halt();
      }
    }, this));

    // avoid focusing boundingBox div
    this.listeners.push(this.get("boundingBox").on('focus', function (e) {
      if (e.target === this.get("boundingBox")) {
        this.focus_username();
      }
    }, this));

    this.listeners.push(body.one('a[name="register"]').on('click', function (e) {
      e.halt();
      Y.ACMACS.events.REQUEST_REGISTRATION.fire({attached_to: e.currentTarget});
    }, this));
    this.listeners.push(body.one('a[name="report_problems"]').on('click', function (e) {
      e.halt();
      Y.ACMACS.events.REPORT_PROBLEM.fire({attached_to: e.currentTarget});
    }, this));
    this.listeners.push(body.one('a[name="forgot_password"]').on('click', function (e) {
      e.halt();
      Y.ACMACS.events.FORGOT_PASSWORD.fire({attached_to: e.currentTarget});
    }, this));
  },

  focus_username: function () {
    this.get('contentBox').one('input[name="username"]').focus();
  },

  username_field: function () {
    return this.get('contentBox').one('input[name="username"]');
  },

  password_field: function () {
    return this.get('contentBox').one('input[name="password"]');
  },

  shown_hidden: function (e) {
    if (e.newVal === true && e.prevVal === false) { // shown
      this.get('maskNode').setStyles({opacity: 0.7, background: '#E0FFE0'}); // background-color does not work in firefox
      var bb = this.get("boundingBox");
      bb.setStyles({left: window.pageXOffset + ((parseInt(window.outerWidth, 10) - parseInt(bb.getComputedStyle('width'), 10)) / 2) + 'px',
                    top: (window.pageYOffset + 100) + 'px',
                    position: 'absolute',
                    'z-index': this.get('zIndex')
                   });
      this.focus_username();
      this.warn_about_ie();
    }
  },

  show_login_failure: function () {
    var node = this.get("boundingBox"),
        left = node.getComputedStyle('left');
    (new Y.Anim({node: node, from: {left: (parseInt(left, 10) - 10) + 'px'}, to: {left: left}, iterations: 3, duration: 0.1})).run();
    this.focus_username();
  },

  show_communication_failure: function () {
    var node = this.get("boundingBox"),
        top = node.getComputedStyle('top');
    (new Y.Anim({node: node, from: {top: (parseInt(top, 10) - 10) + 'px'}, to: {top: top}, iterations: 3, duration: 0.1})).run();
    this.focus_username();
  },

  // called on submit button click or enter pressed
  submit: function () {
    this.get('loginCallback')(this.get_credentials());
    this.clear_credentials();
  },

  get_credentials: function () {
    return {user: this.username_field().get('value'), password: this.password_field().get('value')};
  },

  clear_credentials: function () {
    this.username_field().set('value', '');
    this.password_field().set('value', '');
  },

  warn_about_ie: function () {
    if (Y.UA.ie > 0) {
      alert('Internet Explorer is not supported! Please use Google Chrome, Safari or Firefox for AcmacsWeb.');
    }
  }

}, {
  ATTRS: {
    loginCallback: {
      value: function () {
        console.log('loginCallback is not set');
      }
    },
    duration: { // show/hide animation duration
      value: 0.5
    },
    modal: { // this attribute is somehow ignored unless passed to the constructor
      value: true
    },
    render: {
      value: true
    },
    visible: {
      value: false
    },
    buttons: {
      value: []
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
