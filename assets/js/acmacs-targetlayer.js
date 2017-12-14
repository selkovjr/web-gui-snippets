/*
  # license
  # license.
*/
// ======================================================================

// ----------------------------------------------------------------------------
// Y.ACMACS.TargetLayer
// ----------------------------------------------------------------------------

// The base functionality of a stackable map layer
//
//

// This module is based on `Y.Widget` and it includes everything that is needed
// to host a basic SVG canvas. The purpose of this canvas is to receive pointer
// events in the area occupied by the layer stack and to render the HUD devices:
// the navigation aid and the help screen.

// Y.ACMACS.TargetLayer shares no behaviour with other layers, but it replicates
// their common geometry and is rendered on the top of the layer stack.

// Catching pointer events in a special target is a way to avoid uncertainties
// about the way hit-testing is done in various browsers, and to simulate event
// transparency without worrying about `pointer-events` support (Safari broke
// it after 5.0)

/*global Y: false, document: false */
var code = {
  // ## Prototype properties
  prototypeProperties: {
    // * Parameters affecting appearance or behaviour
    'default': {
      hudFillColor: 'navy',
      hudFillOpacity: 0.3
    },

    // * Setting `CONTENT_TEMPLATE` to `null` disposes of Widget's two-box
    // rendering model. Content box and bounding box become the same.
    CONTENT_TEMPLATE: null,

    /**
     * Base64-encoded i-button image
     *
     * ```bash
     * base64 -i /System/Library/WidgetResources/ibutton/black_i.png
     * ```
     *
     * @property {String} iButtonImage
     * @for ACMACS.MapWidget
     * @private
     */
    iButtonImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAA' +
      'By6+R8AAAABGdBTUEAANjr9RwUqgAAACBjSFJNAABtmAAAbZgAAAAAAABtmAAAAAAAAG2YAA' +
      'AAAAAAbZhH+0sNAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAh0lEQVQoka2SQQ2EQAxF3ycIGA' +
      'lYwAEOkMJaQMFmnYCClYAFHAwOugeGw2YK2SHbpOnh97XNT2VmlEZVTHiQpCMbSVHS8y+b6g' +
      'utAVpgzRQz+0ogAAtgQPR6vPMG4HV1ngeNaRvA9CsE0Kc6l0BdqhvwyNQTIyK7EW8gZD0OBL' +
      'vd3dlg3fm9Dzp4W4DzAvOMAAAAAElFTkSuQmCC',

    /**
     * Base64-encoded i-button rollie image
     *
     * ```bash
     * base64 -i /System/Library/WidgetResources/ibutton/black_rollie.png
     * ```
     *
     * @property {String} iButtonRollieImage
     * @for ACMACS.MapWidget
     * @private
     */
    iButtonRollieImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAN' +
      'CAYAAABy6+R8AAAABGdBTUEAANjr9RwUqgAAACBjSFJNAABtmAAAbZgAAAAAAABtmAAAAAAA' +
      'AG2YAAAAAAAAbZhH+0sNAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAf0lEQVQokZ3SwQ2DMAyF' +
      '4a9BnYGdesxaWYE52IAZcmKRAkovQWorWgUsPfng/+lJtpVS7ELEgIxn7QPiB1fhHgkryoHW' +
      'Ou/fTekH/K1UefFPwlFiDHig01Zd5eXGlF35Vrd0b0yCJWA+YYA5YDppmgJGbI2GDeO1O13+' +
      'iLO/9wJ1/4rShvI67wAAAABJRU5ErkJggg==',

    initializer: function () {
      this.listeners = [];
    },

    destructor: function () {
      this.bBoxIndicator.remove().destroy(true);
      this.bBoxIndicatorGroup.remove().destroy(true);
      this.viewportIndicator.remove().destroy(true);
      this.viewportIndicatorGroup.remove().destroy(true);
      this.hud.remove().destroy(true);

      Y.each(this.groupDOMNode.childNodes, function (node) {
        node.parentNode.removeChild(node);
      });
      this.canvas.remove().destroy(true);

      this.pickupPoint = undefined;

      this.bBoxIndicator = undefined;
      this.bBoxIndicatorGroup = undefined;
      this.viewportIndicator = undefined;
      this.viewportIndicatorGroup = undefined;
      this.mapHudFrame = undefined;
      this.mapHud = undefined;
      this.hud = undefined;
      this.hudFillRectangle = undefined;
      this.hudMaskRectangle = undefined;
      this.canvas = undefined;
      this.baseGroup = undefined;
      this.defs = undefined;

      this.canvasDOMNode = undefined;
      this.groupDOMNode = undefined;
      this.defsDOMNode = undefined;
      this.defsDOMNode = undefined;

      this.iButton = undefined;
      this.iButtonImage = undefined;

      Y.each(this.listeners, function (handle) {
        handle.detach();
      });
      this.listeners = undefined;

      // Y.ACMACS.WidgetTreeNode properties
      this.parent = undefined;
      this.rootWidget = undefined;
    },

    // This is almost a copy of the base layer's `renderUI()` method, except it
    // includes an HUD device to display the viewport position.
    renderUI: function () {
      var
        width = parseInt(this.get('width'), 10),
        height = parseInt(this.get('height'), 10),
        mapHudWidth = Math.min(width, height) - 32,
        maskId = Y.guid(),
        iButtonWidth = new Y.PNGDecoder(
          // the offset of 22 strips the 'data uri' part
          this.iButtonImage.substr(22)
        ).width;

      if (mapHudWidth > 400) {
        mapHudWidth = 400;
      }

      this.canvas = Y.Node.create(Y.substitute(
        '<svg' +
        ' xmlns="http://www.w3.org/2000/svg"' +
        ' version="1.1"' +
        ' width="{width}"' +
        ' height="{height}"' +
        '>' +
        // This svg node provides offset from the top left corner of the parent canvas
        '  <svg class="acmacs-hud" x="{offsetX}" y="{offsetY}" width="{mapHudWidth}" height="{mapHudHeight}" viewBox="0 0 400 400">' +
        '    <g class="acmacs-map-hud" x="0" y="0">' + // applies the mask
        '      <rect x="0" y="0" width="400" height="400" fill="{fill}" fill-opacity="{opacity}" />' +
        '      <g class="acmacs-map-hud-frame"/>' +
        '    </g>' +
        '  </svg>' +
        '  <svg class="acmacs-layerstack-hud" x="20" y="20">' + // provides offset from the top left corner of the parent canvas
        '    <defs>' +
        '      <mask id="{maskId}">' +
        '        <rect x="0" y="0" width="110" height="110" fill="{maskOpacity}" />' + // the fill colour determines mask opacity
        '        <svg class="acmacs-vp-indicator-parent" x="5" y="5" width="100" height="100" viewBox="0 0 100 100">' +
        '          <rect class="acmacs-vp-indicator" x="0" y="0" width="40" height="40" fill="black" />' + // black cuts the hole in the mask
        '        </svg>' +
        '      </mask>' +
        '    </defs>' +
        '    <svg class="acmacs-bb-indicator-group" x="5" y="5" width="100" height="100" viewBox="0 0 100 100">' + // offsets the viewBox by 5 pixels
        '      <rect class="acmacs-bb-indicator" x="0" y="0" width="60" height="60" fill-opacity="0" stroke="#8080b0" stroke-width="1.5" />' +
        '    </svg>' +
        '    <g x="0" y="0" width="110" height="110" mask="url(#{maskId})">' + // applies the mask
        '      <rect class="acmacs-hud-fill" x="0" y="0" width="110" height="110" fill="{fill}" />' + // provides mask colour
        '    </g>' +
        '  </svg>' +
        '  <g class="basegroup"></g>' +
        '</svg>',
        {
          width: width,
          height: height,
          offsetX: (width - mapHudWidth) / 2,
          offsetY: (height - mapHudWidth) / 2,
          mapHudWidth: mapHudWidth,
          mapHudHeight: mapHudWidth,
          maskId: maskId,
          fill: this.attributeOrProfileSetting('hudFillColor'),
          opacity: this.attributeOrProfileSetting('hudFillOpacity'),
          maskOpacity: Y.ACMACS.opacity2Color(
            this.attributeOrProfileSetting('hudFillOpacity')
          )
        }
      ));


      this.mapHud = this.canvas.one('.acmacs-map-hud');
      this.mapHudFrame = Y.Node.getDOMNode(this.canvas.one('.acmacs-map-hud-frame'));
      this.hud = this.canvas.one('.acmacs-layerstack-hud');
      this.viewportIndicator = this.hud.one('.acmacs-vp-indicator');
      this.viewportIndicatorGroup = this.hud.one('.acmacs-vp-indicator-parent');
      this.bBoxIndicator = this.hud.one('.acmacs-bb-indicator');
      this.bBoxIndicatorGroup = this.hud.one('.acmacs-bb-indicator-group');
      this.hudFillRectangle = this.hud.one('.acmacs-hud-fill');
      this.hudMaskRectangle = this.canvas.one('#' + maskId).one('rect');

      this.canvasDOMNode = Y.Node.getDOMNode(this.canvas);

      this.defs = this.canvas.one('defs');
      this.defsDOMNode = Y.Node.getDOMNode(this.defs);
      this.baseGroup = this.canvas.one('.basegroup');
      this.groupDOMNode = Y.Node.getDOMNode(this.baseGroup);

      this.get('contentBox').append(this.canvas);

      this.iButton = Y.Node.create(
        '<div class="acmacs-ibutton"><img src="' +
          this.iButtonImage +
        '" /></div>'
      );
      this.iButton.setStyles({
        width: this.iButtonWidth + 'px',
        opacity: 0.01
      });

      this.iButtonRollie = Y.Node.create(
        '<div class="acmacs-ibutton"><img src="' +
          this.iButtonRollieImage +
        '" /></div>'
      );
      this.iButtonRollie.setStyles({
        width: this.iButtonWidth + 'px',
        opacity: 0.01,
        zIndex: 10
      });

      /*
       * The i-button sticks to the corner of widget, moving with the menu
       * as it opens.
       */

      /* The i-button is always at the corner of the map. */
      this.get('contentBox').append(this.iButtonRollie);
      this.get('contentBox').append(this.iButton);
      return this;
    },


    bindUI: function () {
      this.listeners.push(this.iButtonRollie.on('mousedown',
        Y.bind(function (e) {
          e.halt();
          this.parent.parent.infoLayer.get('contentBox').setStyle('zIndex', 10);
          this.parent.parent.infoLayer.show();
        }, this)
      ));
      this.listeners.push(this.iButtonRollie.on('mouseenter',
        Y.bind(function (e) {
          this.iButton.transition({
            duration: 0.3,
            opacity: 1
          });
          this.iButtonRollie.transition({
            duration: 0.3,
            opacity: 0.2
          });
        }, this)
      ));
      this.listeners.push(this.iButtonRollie.on('mouseleave',
        Y.bind(function (e) {
          this.iButton.transition({
            duration: 0.3,
            opacity: 0
          });
          this.iButtonRollie.transition({
            duration: 0.3,
            opacity: 0.01
          });
        }, this)
      ));
    },


    hudRow: function (x, y, button, mod, legend) {
      var
        iconWidth = 40,
        iconHeight = 60,
        rowOffset = 10,
        mouseButtonGraphic,
        gHudRow,
        gMouseIcon,
        gMouseOutline,
        gMouseButton,
        gKbMod,
        tLegend,
        node,
        offset,
        lineSpacing = 16;

      gHudRow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gHudRow.setAttribute('class', 'acmacs-map-hud-row');
      gHudRow.setAttribute('transform', Y.substitute('matrix(1 0 0 1 {x} {y})', {x: x, y: y}));

      gMouseIcon = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gMouseIcon.setAttribute('class', 'mouse-icon');
      gMouseIcon.setAttribute('transform', Y.substitute(
        'matrix({mouseIconWidth} 0 0 {mouseIconHeight} {rowOffset} {rowOffset})',
        {
          rowOffset: rowOffset,
          mouseIconWidth: iconWidth,
          mouseIconHeight: iconHeight
        }
      ));

      gMouseOutline = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gMouseOutline.setAttribute('class', 'mouse-outline');

      node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      node.setAttribute('d',
        'M 0.45,0.1' +
        'S 0.1,0.1 0.1,0.4' +
        'L 0.1,0.5' +
        'C 0.1,0.5 0.1,0.9 0.45,0.9' +
        'L 0.55,0.9' +
        'S 0.9, 0.9 0.9,0.5' +
        'L 0.9,0.4' +
        'C 0.9,0.4 0.9,0.1 0.55,0.1' +
        'L 0.45,0.1'
      );
      gMouseOutline.appendChild(node);
      gMouseIcon.appendChild(gMouseOutline);

      if (button === 0) {
        gMouseButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gMouseButton.setAttribute('class', 'mouse-button-0');
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.1,0.4 L0.9,0.4');
        gMouseButton.appendChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.38,0.4 L0.38,0.11');
        gMouseButton.appendChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.62,0.4 L0.62,0.11');
        gMouseButton.appendChild(node);
        gMouseIcon.appendChild(gMouseButton);
      }
      else if (button === 1) {
        gMouseButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gMouseButton.setAttribute('class', 'mouse-button-1');
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.1,0.4 L0.9,0.4');
        gMouseButton.appendChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.62,0.4 L0.62,0.11');
        gMouseButton.appendChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-button-depressed');
        node.setAttribute('d',
          'M 0.38,0.4' +
          'L 0.38,0.11' +
          'C 0.38,0.11 0.1,0.13 0.11,0.4' +
          'L 0.38,0.4'
        );
        gMouseButton.appendChild(node);
        gMouseIcon.appendChild(gMouseButton);
      }
      else if (button === 2) {
        mouseButtonGraphic =
        gMouseButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gMouseButton.setAttribute('class', 'mouse-button-2');
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.1,0.4 L0.9,0.4');
        gMouseButton.appendChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-button-depressed');
        node.setAttribute('d',
          'M 0.38,0.4' +
          'L 0.38,0.11' +
          'S 0.38,0.11, 0.45,0.1' +
          'C 0.55,0.1 0.62,0.1 0.62,0.11' +
          'L 0.62,0.11' +
          'L 0.62,0.4' +
          'L 0.38,0.4'
        );
        gMouseButton.appendChild(node);
        gMouseIcon.appendChild(gMouseButton);
      }
      else if (button === 3) {
        gMouseButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gMouseButton.setAttribute('class', 'mouse-button-3');
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.1,0.4 L0.9,0.4');
        gMouseButton.appendChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.38,0.4 L0.38,0.11');
        gMouseButton.appendChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-button-depressed');
        node.setAttribute('d',
          'M 0.62,0.4' +
          'L 0.62,0.11' +
          'C 0.62,0.11 0.9,0.13 0.89,0.4' +
          'L 0.62,0.4'
        );
        gMouseButton.appendChild(node);
        gMouseIcon.appendChild(gMouseButton);
      }
      else if (button === 'wheel') {
        gMouseButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gMouseButton.setAttribute('class', 'mouse-wheel');
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-outline');
        node.setAttribute('d', 'M0.1,0.4 L0.9,0.4');
        gMouseButton.appendChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('class', 'mouse-button-depressed');
        node.setAttribute('d',
          'M 0.5,0.23' +
          'S 0.4,0.23 0.4,0.28' +
          'L 0.4,0.5' +
          'S 0.4,0.55 0.5,0.55' +
          'C 0.5,0.55 0.6,0.55 0.6,0.5' +
          'L 0.6,0.28' +
          'S 0.6,0.23 0.5,0.23'
        );
        gMouseButton.appendChild(node);
        gMouseIcon.appendChild(gMouseButton);
      }

      gHudRow.appendChild(gMouseIcon);

      // Display keyboard modifier
      if (mod) {
        gKbMod = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gKbMod.setAttribute('class', 'keyboard-modifier');
        gKbMod.setAttribute('transform', Y.substitute(
          'matrix(1 0 0 1 {x} {y})',
          {
            x: rowOffset + iconWidth / 2,
            y: rowOffset + iconHeight + 10
          }
        ));
        node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        Y.one(node).setContent(mod);
        gKbMod.appendChild(node);
        gHudRow.appendChild(gKbMod);
      }

      // Display the legend
      tLegend = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tLegend.setAttribute('class', 'hud-legend');
      tLegend.setAttribute('transform', Y.substitute(
        'matrix(1 0 0 1 {x} {y})',
        {
          x: rowOffset + iconWidth + 10,
          y: rowOffset + 5
        }
      ));

      offset = 0;
      Y.each(legend.split('\\n'), function (chunk) {
        node = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        node.setAttribute('x', '0');
        node.setAttribute('dy', lineSpacing + 'px');
        Y.one(node).setContent(chunk);
        tLegend.appendChild(node);
        offset += lineSpacing;
      });

      gHudRow.appendChild(tLegend);

      this.mapHudFrame.appendChild(gHudRow);
    }, // hudRow()

    renderHudContent: function (mod, modList, bindingData) {
      var
        ucMod = mod,
        rowSpacing = 72,
        lineSpacing = 16,
        offset = 0,
        g,
        text,
        node,
        row,
        col,
        modString = '';

      Y.one(this.mapHudFrame).empty();

      if (mod) {
        ucMod = ucMod.replace(/^[a-z]/, function (m) {
          return m.toUpperCase();
        });
        ucMod = ucMod.replace(/\+[a-z]/, function (m) {
          return m.toUpperCase();
        });
      }

      Y.each(bindingData, Y.bind(function (binding) {
        var button = binding.button;

        if (binding.event === 'mousewheel') {
          button = 'wheel';
        }

        this.hudRow(6, offset, button, ucMod, binding.display);

        offset += rowSpacing;
      }, this));

      // Display the list of modifiers
      text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'keyboard-modifier-list-caption');
      text.setAttribute('transform', Y.substitute('matrix(1 0 0 1 {x} {y})', {x: 30, y: 400 - 80}));

      node = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      node.setAttribute('x', '35');
      node.setAttribute('y', '0');
      Y.one(node).setContent('Press and hold any of the these modifiers');
      text.appendChild(node);

      node = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      node.setAttribute('x', '35');
      node.setAttribute('dy', lineSpacing + 'px');
      Y.one(node).setContent('to find out about the actions bound to them:');
      text.appendChild(node);
      this.mapHudFrame.appendChild(text);

      text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'keyboard-modifier-list');
      text.setAttribute('transform', Y.substitute('matrix(1 0 0 1 {x} {y})', {x: 30, y: 400 - 40}));

      modString = Y.Array.filter(
        // Exclude the current modifier from the list
        modList,
        function (o) {
          if (o === ucMod) {
            return false;
          }
          else {
            return true;
          }
        }
      ).join(', ');

      node = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      node.setAttribute('x', '35');
      node.setAttribute('y', '0');
      Y.one(node).setContent(modString);
      text.appendChild(node);

      this.mapHudFrame.appendChild(text);
    }, // renderHudContent()

    // Assuming the HUD has been rendered with the target layer's renderUI()`
    // method, and its `width` antd `height` attributes have been updated,
    // this mehtod recentres and resizes the HUD.
    updateHudDimensions: function () {
      var
        width = parseInt(this.get('width'), 10),
        height = parseInt(this.get('height'), 10),
        mapHudWidth = Math.min(width, height) - 32,
        hud = this.canvas.one('.acmacs-hud');

      if (mapHudWidth > 400) {
        mapHudWidth = 400;
      }

      this.canvas.setAttrs({width: width, height: height});
      hud.set('x', (width - mapHudWidth) / 2);
      hud.set('y', (height - mapHudWidth) / 2);
      hud.set('width', mapHudWidth);
      hud.set('height', mapHudWidth);

      return this;
    }
  },
  staticProperies: {}
};

Y.namespace('ACMACS').TargetLayer = Y.Base.create(
  'acmacsTargetLayer',
  Y.Widget,
  [Y.WidgetStack], // extensions
  code.prototypeProperties,
  code.staticProperties
);

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * End:
 */
