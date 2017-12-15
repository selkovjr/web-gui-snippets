/*global alert: false, document: false, window: false, self: false, YUI: false, XMLSerializer: false, SVGElement: false, SVGCircleElement: false, SVGEllipseElement: false, SVGRectElement: false */
YUI.add('widget-null', function (Y) {
  var test;

  Y.namespace('ACMACS');

  // This provides the test environment for the widget
  test = {
    init: true,

    setUp: function () {
      var
        widget,
        pointSizeSlider,
        displayHierarchy;

      displayHierarchy = function (e) {
        var text = '<table class="tree">',
            n = 5;
        widget.traverse(function (w, depth) {
          var
            mark = '';

          if (depth) {
            if (w.name.match(/Layer$/) && w.name !== 'acmacsInfoLayer') {
              if (w.get('visible')) {
                mark =  '*&#xA0;';
              }
              else {
                mark =  '&#xA0;&#xA0;';
              }
            }
            text += '<tr>' + '<td>&#xA0;</td>'.repeat(depth + 1) + Y.substitute(
              '<td colspan="{fill}">{mark}{name}</td></tr>',
              {
                fill: n - depth - 1,
                name: w.name,
                mark: mark
              }
            );
          }
          else {
            text += Y.substitute(
              '<tr><td colspan="{fill}">{name}</td></tr>',
              {
                fill: n,
                name: w.name
              }
            );
          }
        }, test);
        text += '</table>';
        Y.one('#composition').setContent(text);
      };


      // ---------------------------------------------------------------------

      Y.one('body').append(
        '<div style="position:absolute; top: 0; left: 1em" id="report">' +
        '  <table>' +
        '    <tr>' +
        '      <td>labelsVisible</td>' +
        '      <td>visibleLabelCount</td>' +
        '      <td>widget.get(\'selected\')</td>' +
        '      <td>map.get(\'selected\')</td>' +
        '      <td>map.selected</td>' +
        '      <td></td>' +
        '    </tr>' +
        '    <tr>' +
        '      <td id="labelsVisible"></td>' +
        '      <td id="visibleLabelCount"></td>' +
        '      <td id="widget-selected"></td>' +
        '      <td id="map-selected"></td>' +
        '      <td id="selected"></td>' +
        '    </tr>' +
        '  </table>' +
        '</div>'
      );

      Y.one('body').append(
        '<div style="position:absolute; top: 3em; left: 0" id="testbed"></div>'
      );

      Y.one('#testbed').setContent(
        '<table>' +
        '  <tr>' +
        '    <td rowspan="2" style="vertical-align: top"><div id="controls"></div></td>' +
        '    <td rowspan="2"><div id="widget"></div><div id="message"></div></td>' +
        '    <td rowspan="1">' +
        '      <svg id="report_viewport" xmlns="http://www.w3.org/2000/svg" version="1.1" width="100" height="100">' +
        '        <defs>' +
        '          <mask id="mask" x="0" y="0" width="100" height="100">' +
        '            <rect x="0" y="0" width="100" height="100" fill="#404040" />' +
        '            <svg id="vp-indicator-group" x="0" y="0" width="100" height="100" viewBox="0 0 100 100">' +
        '              <rect id="vp-indicator" x="0" y="0" width="100" height="100" fill="black" />' +
        '            </svg>' +
        '          </mask>' +
        '        </defs>' +
        '        <rect x="0" y="0" width="100" height="100" fill-opacity="0" stroke="black" />' +
        '        <svg id="bb-indicator-group" x="0" y="0" width="100" height="100" viewBox="0 0 100 100">' +
        '          <rect id="bb-indicator" x="0" y="0" width="50" height="50" fill-opacity="0" stroke="black" stroke-width="4" />' +
        '        </svg>' +
        '        <g x="0" y="0" width="100" height="100" mask="url(#mask)">' +
        '          <rect x="0" y="0" width="100" height="100" fill="black" />' +
        '        </g>' +
        '      </svg>' +
        '    </td>' +
        '  </tr>' +
        '  <tr>' +
        '    <td><div id="status"></div><div id="composition"></div></td>' +
        '  </tr>' +
        '  <tr>' +
        '    <td>' +
        '      <!-- canvas id="renderBuffer" /-->' +
        '      <svg id="monitor" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-2 -2 4 4">' +
        '        <defs>' +
        '          <marker id="Triangle"' +
        '            viewBox="0 0 10 10" refX="0" refY="5"' +
        '            markerUnits="strokeWidth"' +
        '            markerWidth="4" markerHeight="3"' +
        '            orient="auto">' +
        '            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />' +
        '          </marker>' +
        '        </defs>' +
        '        <g class="axes" transform="matrix(1 0 0 -1 0 0)">' +
        '          <line id="x-axis" x1="0" y1="0" x2="0.75" y2="0" stroke-width="0.05" stroke="crimson" marker-end="url(#Triangle)" />' +
        '          <line id="y-axis" x1="0" y1="0" x2="0.0" y2="0.75" stroke-width="0.05" stroke="olivedrab" marker-end="url(#Triangle)" />' +
        '        </g>' +
        '        <g class="plot" transform="matrix(1 0 0 -1 0 0)">' +
        '        </g>' +
        '      </svg>' +
        '    </td>' +
        '  </tr>' +
        '</table>'
      );

      // ------------------------------- C O N T R O L S -----------------------------------
      Y.one('#controls').append(
        '<div style="background-color: #ddd; padding: 0.5em">' +
        '  <div>' +
        '    <select id="data_selector">' +
        '      <option value="pointArrayData" selected="1">EU 3ags 2sr H &lt;2.6716&gt; [3:2]</option>' +
        '      <option value="bjorn6x5Data">EMC A(H5) Bjorn 20111108 turkey &lt;27.5415&gt; [6:5]</option>' +
        '      <option value="bird6x6Data">EU A(H3N2) 20110617 bird 6x6 &lt;6.3337&gt; [6:6]</option>' +
        '      <option value="melbBData">MELB B 20110913 turkey [38:10]</option>' +
        '      <option value="cdcH1N1Data">CDC A(H1N1) turkey (6 source tables) [303:31]</option>' +
        '      <option value="niidH3N2Data">NIID A_H3N2 guinea-pig 20130919 [12:7]</option>' +
        '      <option value="cnicBGuineaPigData">CNIC B 20131024-20131129 guinea-pig (3 source tables) [12:7]</option>' +
        '      <option value="cnicBTurkeyVicData">CNIC B turkey 20081023-20100525 Vic [4009:12]</option>' +
        '      <option value="circularTestData">Concentric Circles Test</option>' +
        '      <option value="procrustesData">Procrustes test</option>' +
        '      <option value="procrustesDataWithOverlap">Procrustes with coinciding lines</option>' +
        '      <option value="labelData">Label test</option>' +
        '    </select>' +
        '  </div>' +
        '  <div>' +
        '    <button id="load_data">Load data</button>' +
        '  </div>' +
        '  <div>' +
        '    <input id="chart_width" type="text" style="width: 4em" />' +
        '    <input id="chart_height" type="text" style="width: 4em" />' +
        '    <button id="set_size">Set chart size</button>' +
        '    <button id="unset_size" title="undefine in profile, unmasking the widegt default (300 x 300)">&#x21A9;</button>' +
        '  </div>' +
        '  <div>' +
        '  <div>' +
        '    <input id="shift_x" type="text" style="width: 4em" value="20" />' +
        '    <input id="shift_y" type="text" style="width: 4em" value="10" />' +
        '    <button id="shift">Shift</button>' +
        '  </div>' +
        '    <button id="show_viewport">Show viewport</button>' +
        '    <button id="get_state">Log state</button>' +
        '    <button id="get_style">Log style</button>' +
        '    <button id="set_style">Alternative style</button>' +
        '    <button id="get_svg">Get SVG</button>' +
        '    <button id="print">Print</button>' +
        '  </div>' +
        '</div>'
      );

      Y.one('#controls').append(
        '<div style="background-color: #eee; padding: 0.5em">' +
        '  <div>' +
        '    <span>' +
        '      <input id="labels_visible" type="checkbox" />' +
        '      <label for="labels_visible">Show label layer</label>' +
        '    </span>' +
        '    <span style="margin-left: 1.5em">' +
        '      <input id="label_mode" type="checkbox" />' +
        '      <label for="label_mode">Label editing mode</label>' +
        '    </span>' +
        '  </div>' +
        '  <button id="set_labels_on">labelsOn()</button>' +
        '  <button id="set_labels_off">labelsOff()</button>' +
        '  <div>' +
        '    <input id="connection_layer_visible" type="checkbox" />' +
        '    <label for="connection_layer_visible">Show connection layer</label>' +
        '  </div>' +
        '  <div>' +
        '    <input id="connection_lines_visible" type="checkbox" />' +
        '    <label for="connection_lines_visible">Show connection lines</label>' +
        '  </div>' +
        '  <div>' +
        '    <input id="error_lines_visible" type="checkbox" />' +
        '    <label for="error_lines_visible">Show error lines</label>' +
        '  </div>' +
        '  <div>' +
        '    <input id="procrustes_lines_visible" type="checkbox" />' +
        '    <label for="procrustes_lines_visible">Show procrustes lines</label>' +
        '  </div>' +
        '  <div>' +
        '    <input id="procrustes_threshold" type="text" style="width: 4em" />' +
        '    <button id="set_procrustes_threshold">Set min. procrustes distance</button>' +
        '    <button id="unset_procrustes_threshold" title="undefine in ATTRS, unmasking the profile or default">' +
        '      &#x21A9;</button>' +
        '  </div>' +
        '  <div>' +
        '    <input id="show_blobs" type="checkbox" />' +
        '    <label for="show_blobs">Show blobs</label>' +
        '    <button id="more_blobs">More blobs</button>' +
        '  </div>' +
        '</div>'
      );

      Y.one('#procrustes_threshold').set('value', Y.ACMACS.profile.get('procrustesDistanceThreshold'));

      Y.one('#controls').append(
        '<div style="background-color: #ddd; padding: 0.5em">' +
        '  <div>' +
        '    <input id="point_size_calibration" type="text" style="width: 4em" />' +
        '    <button id="set_point_size_calibration">Set point size calibration</button>' +
        '    <button id="unset_point_size_calibration" title="undefine in ATTRS, unmasking the profile or default">' +
        '      &#x21A9;</button>' +
        '  </div>' +
        '  <div>' +
        '    Point size <input id="point_scale" type="text" style="width: 4em" value="1.2" />' +
        '    <button id="point_scale_up">*</button>' +
        '    <button id="point_scale_down">/</button>' +
        '    <button id="point_scale_reset">&#x21A9;</button>' +
        '  </div>' +
        '  <div id="point_size_container"/>' +
        '  <div>' +
        '    <input id="label_size_calibration" type="text" style="width: 4em" />' +
        '    <button id="set_label_size_calibration">Set label size calibration</button>' +
        '    <button id="unset_label_size_calibration" title="undefine in profile, unmasking the widegt default (9)">' +
        '      &#x21A9;</button>' +
        '  </div>' +
        '  <div>' +
        '    Label size <input id="label_scale" type="text" style="width: 4em" value="1.2" />' +
        '    <button id="label_scale_up">*</button>' +
        '    <button id="label_scale_down">/</button>' +
        '    <button id="label_scale_reset">&#x21A9;</button>' +
        '  </div>' +
        '</div>'
      );

      Y.one('#point_size_calibration').set('value', Y.ACMACS.profile.get('pointSizeCalibration'));
      Y.one('#label_size_calibration').set('value', Y.ACMACS.profile.get('labelSizeCalibration'));

      Y.one('#controls').append(
        '<div style="background-color: #eee; padding: 0.5em">' +
        '  <div>' +
        '    <input id="points_to_select" type="text" style="width: 14em" />' +
        '    <button id="set_points_to_select">Select points:</button>' +
        '    <button id="clear_selection" disabled="1">&#x21A9;</button>' +
        '  </div>' +
        '</div>'
      );

      Y.one('#controls').append(
        '<div style="background-color: #ddd; padding: 0.5em">' +
        '  <div>Move point' +
        '    <select id="point_number" /> to ' +
        '    <input id="point_x" type="text" style="width: 4em" />' +
        '    <input id="point_y" type="text" style="width: 4em" />' +
        '    <button id="move_point">Go</button>' +
        '  </div>' +
        '</div>'
      );


      // ----------------------------- Control bindings ------------------------------------
      Y.one('#load_data').on('click', function () {
        if (test.init) {
          Y.one('#load_data').setContent('Reload');
          test.init = false;
        }
        test.loadData();
      });

      Y.one('#get_state').on('click', function () {
        Y.log(Y.JSON.stringify(test.widget.getState()));
        Y.log(test.widget.layerStack.map.pointList);
      });

      Y.one('#get_style').on('click', function () {
        Y.log(test.widget.get('style'));
      });

      Y.one('#get_svg').on('click', function () {
        var title = test.widget.get('data').title[0].text[0];
        Y.ACMACS.saveAs(new self.Blob([test.widget.getSVG()], {
          type: 'image/svg+xml;charset=' + document.characterSet
        }), title + '.svg');
      });

      Y.one('#print').on('click', function () {
        test.popup = window.open(null, null);
        if (!test.popup) {
          alert("enable popups");
          return;
        }

        test.popup.document.write(test.widget.getSVG());
      });

      Y.one('#set_style').on('click', function () {
        var style = test.widget.get('data').altStyle;
        Y.log(style);
        test.widget.set('style', style);
      });

      Y.one('#show_viewport').on('click', function () {
        var
          dataName = Y.one('#data_selector').get('value'),
          node,
          w,
          p,
          matrix,
          vp = test.widget.viewingTransformation.viewport,
          tvp = test.widget.viewingTransformation.transformedViewport,
          mvp = {}; // vieport monitor's viewport


        Y.one('#monitor').one('.plot').empty();
        Y.one('#monitor').all('.axis').remove();

        // Set the viewbox and the axes
        mvp.width = 4 * Math.max(vp.width, tvp.width);
        mvp.height = 4 * Math.max(vp.height, tvp.height);
        mvp.x = Math.min(vp.x, tvp.x) - mvp.width / 2;
        mvp.y = Math.min(vp.y, tvp.y) - mvp.height / 2;
        Y.one('#monitor').set('viewBox', mvp.x + ' ' + mvp.y + ' ' + mvp.width + ' ' + mvp.height);

        node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        node.setAttribute('x1', mvp.x);
        node.setAttribute('y1', 0);
        node.setAttribute('x2', mvp.x + mvp.width);
        node.setAttribute('y2', 0);
        node.setAttribute('stroke-width', mvp.width / 200);
        node.setAttribute('stroke-opacity', '0.2');
        node.setAttribute('stroke', 'black');
        node.setAttribute('class', 'axis');
        Y.one('#monitor').append(node);

        node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        node.setAttribute('x1', 0);
        node.setAttribute('y1', mvp.y);
        node.setAttribute('x2', 0);
        node.setAttribute('y2', mvp.y + mvp.height);
        node.setAttribute('stroke-width', mvp.width / 200);
        node.setAttribute('stroke-opacity', '0.2');
        node.setAttribute('stroke', 'black');
        node.setAttribute('class', 'axis');
        Y.one('#monitor').append(node);

        Y.one('#x-axis').set('x2', mvp.width / 4);
        Y.one('#x-axis').set('stroke-width', mvp.width / 200);

        Y.one('#y-axis').set('y2', mvp.width / 4);
        Y.one('#y-axis').set('stroke-width', mvp.width / 200);

        w = test.widget.layerStack.trueVisibleWorld();

        // red outline
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', Y.substitute(
          'M {tlX},{tlY} L {trX},{trY} L {brX},{brY} L {blX},{blY} L {tlX},{tlY}',
          {
            tlX: w.tl.x,
            tlY: w.tl.y,
            trX: w.tr.x,
            trY: w.tr.y,
            brX: w.br.x,
            brY: w.br.y,
            blX: w.bl.x,
            blY: w.bl.y
          }
        ));
        node.setAttribute('fill-opacity', 0.1);
        node.setAttribute('fill', 'red');
        node.setAttribute('stroke', 'red');
        node.setAttribute('stroke-width', mvp.width / 200);
        Y.one('#monitor').one('.plot').append(node);

        // blue outline for grid-aligned viewport
        node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', Y.substitute(
          'M {tlX},{tlY} L {trX},{trY} L {brX},{brY} L {blX},{blY} L {tlX},{tlY}',
          {
            tlX: w.gtl.x,
            tlY: w.gtl.y,
            trX: w.gtr.x,
            trY: w.gtr.y,
            brX: w.gbr.x,
            brY: w.gbr.y,
            blX: w.gbl.x,
            blY: w.gbl.y
          }
        ));
        node.setAttribute('fill', 'none');
        node.setAttribute('stroke', 'blue');
        node.setAttribute('stroke-width', mvp.width / 200);
        Y.one('#monitor').one('.plot').append(node);

        // Original viewport
        node = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        node.setAttribute('x', vp.x);
        node.setAttribute('y', vp.y);
        node.setAttribute('width', vp.width);
        node.setAttribute('height', vp.height);
        node.setAttribute('fill-opacity', '0.2');
        node.setAttribute('fill', 'blue');
        node.setAttribute('class', 'original');
        Y.one('#monitor').one('.plot').append(node);

        // Transformed viewport
        matrix = test.widget.transformation();
        node = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        node.setAttribute('x', tvp.x);
        node.setAttribute('y', tvp.y);
        node.setAttribute('width', tvp.width);
        node.setAttribute('height', tvp.height);
        node.setAttribute('fill-opacity', '0.2');
        node.setAttribute('fill', 'green');
        node.setAttribute('class', 'transformed');
        node.setAttribute('transform',
         'matrix(' +
           matrix.a + ',' +
           matrix.b + ',' +
           matrix.c + ',' +
           matrix.d + ',' +
           matrix.e + ',' +
           matrix.f +
         ')'
        );
        Y.one('#monitor').one('.plot').append(node);

        matrix = test.widget.orientation();
        Y.one('.axes').setAttribute('transform',
         'matrix(' +
           matrix.a + ',' +
           matrix.b + ',' +
           matrix.c + ',' +
           matrix.d + ',' +
           matrix.e + ',' +
           matrix.f +
         ')'
        );

        p = test.widget.layerStack.trueWorldPoint(0, 0);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('cx', p.x);
        node.setAttribute('cy', p.y);
        node.setAttribute('r', mvp.width / 50);
        node.setAttribute('fill', 'black');
        Y.one('#monitor').one('.plot').append(node);

        p = test.widget.layerStack.trueWorldPoint(0, test.widget.get('chartSize').y);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('cx', p.x);
        node.setAttribute('cy', p.y);
        node.setAttribute('r', mvp.width / 100);
        node.setAttribute('fill', 'red');
        Y.one('#monitor').one('.plot').append(node);

        p = test.widget.layerStack.trueWorldPoint(test.widget.get('chartSize').x, test.widget.get('chartSize').y);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('cx', p.x);
        node.setAttribute('cy', p.y);
        node.setAttribute('r', mvp.width / 100);
        node.setAttribute('fill', 'red');
        Y.one('#monitor').one('.plot').append(node);

        p = test.widget.layerStack.trueWorldPoint(test.widget.get('chartSize').x, 0);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('cx', p.x);
        node.setAttribute('cy', p.y);
        node.setAttribute('r', mvp.width / 100);
        node.setAttribute('fill', 'red');
        Y.one('#monitor').one('.plot').append(node);

        Y.each(Y.ACMACS[dataName].layout, function (o) {
          var
            p = test.widget.layerStack.shadow.svgPoint(o[0], o[1]),
            node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

          node.setAttribute('cx', p.x);
          node.setAttribute('cy', p.y);
          node.setAttribute('r', mvp.width / 100);
          node.setAttribute('fill', 'green');
          Y.one('#monitor').one('.plot').append(node);
        });

        test.reportLabelVisibilityState();
      });

      Y.one('#labels_visible').on('change', function () {
        test.widget.set('labelsVisible', Y.one('#labels_visible').get('checked'));
        test.reportLabelVisibilityState();
      });

      Y.one('#connection_layer_visible').on('change', function () {
        test.widget.set('connectionsLayerVisible', Y.one('#connection_layer_visible').get('checked'));
      });

      Y.one('#connection_lines_visible').on('change', function () {
        var visible = Y.one('#connection_lines_visible').get('checked');
        if (visible && !test.widget.layerStack.connections) {
          test.widget.set('connectionsLayerVisible', true);
          Y.one('#connection_layer_visible').set('checked', true);
        }
        // test.widget.set('connectionsMax', 20);
        test.widget.set('renderConnectionLines', visible);
      });

      Y.one('#error_lines_visible').on('change', function () {
        var visible = Y.one('#error_lines_visible').get('checked');
        if (visible && !test.widget.layerStack.connections) {
          test.widget.set('connectionsLayerVisible', true);
          Y.one('#connection_layer_visible').set('checked', true);
        }
        // test.widget.set('connectionsMax', 20);
        test.widget.set('renderErrorLines', visible);
      });

      Y.one('#procrustes_lines_visible').on('change', function () {
        var visible = Y.one('#procrustes_lines_visible').get('checked');
        if (visible && !test.widget.layerStack.procrustes) {
          test.widget.set('procrustesLayerVisible', true);
        }
        test.widget.set('renderProcrustesLines', visible);
      });

      Y.one('#set_procrustes_threshold').on('click', function () {
        test.widget.set('procrustesDistanceThreshold', Y.one('#procrustes_threshold').get('value'));
      });
      Y.one('#procrustes_threshold').on('key', function () {
        test.widget.set('procrustesDistanceThreshold', Y.one('#procrustes_threshold').get('value'));
      }, 'enter');
      Y.one('#unset_procrustes_threshold').on('click', function () {
        test.widget.set('procrustesDistanceThreshold', null);
      });

      Y.one('#set_labels_on').on('click', function () {
        test.widget.labelsOn();
      });
      Y.one('#set_labels_off').on('click', function () {
        test.widget.labelsOff();
      });

      Y.one('#show_blobs').on('change', function () {
        var
          visible = Y.one('#show_blobs').get('checked'),
          blobRadii = 30,
          contour = [],
          index,
          alpha;

        if (visible) {
          for (index = 0; index < blobRadii; index += 1) {
            alpha = index * 2 * Math.PI / blobRadii + Math.PI / 2;
            contour[index] = 8 -
              1.3 * Math.sin(alpha) +
              1.5 * Math.sin(3 * alpha) +
              2 * Math.sin(5 * alpha) -
              0.5 * Math.sin(6 * alpha) +
              0.5 * Math.sin(9 * alpha) +
              3.5 * Math.cos(2 * alpha) -
              1.8 * Math.cos(4 * alpha) -
              0.5 * Math.cos(8 * alpha);
            contour[index] /= 60;
          }

          test.widget.showBlobs([
            null,
            {
              contour: [0.2, 0.21, 0.3, 0.16, 0.06, 0.08, 0.04, 0.12],
              smooth: 0.7
            },
            null,
            {
              contour: [0.02, 0.025, 0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.08, 0.085, 0.09, 0.095, 0.1],
              smooth: 0.1
            },
            null,
            {
              contour: contour,
              smooth: 0.5
            }
          ]);
        }
        else {
          test.widget.hideBlobs();
        }
        Y.log('widget.blobsVisible() -> ' + test.widget.blobsVisible());
      });

      Y.one('#more_blobs').on('click', function () {
        var
          blobRadii = 30,
          contour = [],
          index,
          alpha;

        for (index = 0; index < blobRadii; index += 1) {
          alpha = index * 2 * Math.PI / blobRadii + Math.PI / 2;
          contour[index] = 8 -
            1.3 * Math.sin(alpha) +
            1.5 * Math.sin(3 * alpha) +
            2 * Math.sin(5 * alpha) -
            0.5 * Math.sin(6 * alpha) +
            0.5 * Math.sin(9 * alpha) +
            3.5 * Math.cos(2 * alpha) -
            1.8 * Math.cos(4 * alpha) -
            0.5 * Math.cos(8 * alpha);
          contour[index] /= 60;
        }

        test.widget.showBlobs([
          null,
          null,
          {
            contour: [0.02, 0.025, 0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.08, 0.085, 0.09, 0.095, 0.1],
            smooth: 0.1
          },
          null,
          null,
          {
            contour: [0.2, 0.21, 0.3, 0.16, 0.06, 0.08, 0.04, 0.12],
            smooth: 0.7
          },
          {
            contour: contour,
            smooth: 0.5
          }
        ]);
      });

      Y.one('#label_mode').on('change', function () {
        if (test.widget.layerStack.labels && test.widget.setModalBindings !== undefined) {
          if (Y.one('#label_mode').get('checked')) {
            test.widget.setModalBindings('labels');
            Y.one('#label_mode').set('checked', true);
          }
          else {
            test.widget.setModalBindings('navigation');
            Y.one('#label_mode').set('checked', false);
          }
        }
      });

      Y.one('#shift').on('click', function () {
        test.widget.layerStack.shift(Y.one('#shift_x').get('value'), Y.one('#shift_y').get('value'));
      });
      Y.one('#shift_x').on('key', function () {
        test.widget.layerStack.shift(Y.one('#shift_x').get('value'), Y.one('#shift_y').get('value'));
      }, 'enter');
      Y.one('#shift_y').on('key', function () {
        test.widget.layerStack.shift(Y.one('#shift_x').get('value'), Y.one('#shift_y').get('value'));
      }, 'enter');

      Y.one('#set_size').on('click', function () {
        test.setChartSize();
      });
      Y.one('#chart_width').on('key', function () {
        test.setChartSize();
      }, 'enter');
      Y.one('#chart_height').on('key', function () {
        test.setChartSize();
      }, 'enter');
      Y.one('#unset_size').on('click', function () {
        test.widget.set('chartSize', null);
      });


      Y.one('#set_point_size_calibration').on('click', function () {
        test.widget.set('pointSizeCalibration', Y.one('#point_size_calibration').get('value'));
      });
      Y.one('#point_size_calibration').on('key', function () {
        test.widget.set('pointSizeCalibration', Y.one('#point_size_calibration').get('value'));
      }, 'enter');
      Y.one('#unset_point_size_calibration').on('click', function () {
        test.widget.set('pointSizeCalibration', null);
      });

      Y.one('#point_scale_up').on('click', function () {
        test.widget.scalePoints(parseFloat(Y.one('#point_scale').get('value')));
      });
      Y.one('#point_scale').on('key', function () {
        test.widget.set(
          'pointScale',
          test.widget.attributeOrProfileSetting('pointScale') * parseFloat(Y.one('#point_scale').get('value'))
        );
      }, 'enter');
      Y.one('#point_scale_down').on('click', function () {
        test.widget.scalePoints(1 / parseFloat(Y.one('#point_scale').get('value')));
      });
      Y.one('#point_scale_reset').on('click', function () {
        test.widget.set('pointScale', null);
      });

      pointSizeSlider = new Y.Slider({
        axis        : 'x',
        min         : -100,
        max         : 100,
        value       : 0
      });
      pointSizeSlider.render('#point_size_container');
      pointSizeSlider.on('valueChange', function (e) {
        Y.log(e.newVal);
      });

      Y.one('#set_label_size_calibration').on('click', function () {
        test.widget.set('labelSizeCalibration', parseFloat(Y.one('#label_size_calibration').get('value')));
      });
      Y.one('#label_size_calibration').on('key', function () {
        test.widget.set('labelSizeCalibration', parseFloat(Y.one('#label_size_calibration').get('value')));
      }, 'enter');
      Y.one('#unset_label_size_calibration').on('click', function () {
        test.widget.set('labelSizeCalibration', null);
      });

      Y.one('#label_scale_up').on('click', function () {
        test.widget.set(
          'labelScale',
          test.widget.attributeOrProfileSetting('labelScale') * parseFloat(Y.one('#label_scale').get('value'))
        );
      });
      Y.one('#label_scale').on('key', function () {
        test.widget.set(
          'labelScale',
          test.widget.attributeOrProfileSetting('labelScale') * parseFloat(Y.one('#label_scale').get('value'))
        );
      }, 'enter');
      Y.one('#label_scale_down').on('click', function () {
        test.widget.set(
          'labelScale',
          test.widget.attributeOrProfileSetting('labelScale') / parseFloat(Y.one('#label_scale').get('value'))
        );
      });
      Y.one('#label_scale_reset').on('click', function () {
        test.widget.set('labelScale', null);
      });
      Y.one('#data_selector').on('change', function () {
        Y.one('#load_data').setContent('Load data');
        test.init = true;
      });

      Y.one('#set_points_to_select').on('click', function () {
        var list = Y.one('#points_to_select').get('value').split(/\s*[, ]\s*/);
        test.widget.selectPoints(list, 'replace');
      });

      Y.one('#points_to_select').on('key', function () {
        var list = Y.one('#points_to_select').get('value').split(/\s*[, ]\s*/);
        test.widget.selectPoints(list, 'replace');
      }, 'enter');

      Y.one('#clear_selection').on('click', function () {
        test.widget.clearSelection();
      });

      Y.one('#point_number').on('change', function (e) {
        Y.log('change');
      });

      Y.one('#point_x').on('key', function () {
        test.movePoint();
      }, 'enter');
      Y.one('#point_y').on('key', function () {
        test.movePoint();
      }, 'enter');
      Y.one('#move_point').on('click', function () {
        test.movePoint();
      });


      Y.augment(Y.ACMACS.MapWidget, Y.ACMACS.MapWidgetInteractivity);
      widget =  new Y.ACMACS.MapWidget({
        render: '#widget',
        chartSize: {x: 600, y: 400},
        background: 'gradient',
        menu: true
      });

      Y.one('#chart_width').set('value', widget.get('chartSize').x);
      Y.one('#chart_height').set('value', widget.get('chartSize').y);

      widget.set('labelsVisible', false);

      // widget.showBindingsFor('ctrl');

      test.widget = widget;

      test.widget.layerStack.after('chartSizeChange', function () {
        Y.one('#chart_width').set('value', test.widget.layerStack.get('width'));
        Y.one('#chart_height').set('value', test.widget.layerStack.get('height'));
      });

      test.widget.after('labelsVisibleChange', function (e) {
        Y.one('#labels_visible').set('checked', e.newVal);
      });

      test.widget.on('point-hit', function (e) {
        var
          message = '';

        Y.each(e.targetList, function (item, index) {
          var
           delim = ', ',
           p = item.pointObject;

          if (index === e.targetList.length - 1) {
            delim = '';
          }
          message += item.pointObject.index + ': ' + item.label + ' [object{x: ' + p.x + ', y: ' + p.y + '}, node{X: ' + p.pointDOMNode.X + ', Y: ' + p.pointDOMNode.Y + '}]' + delim;
        });
        Y.one('#message').setContent(message);
      });

      test.widget.on('point-abandoned', function (e) {
        Y.log(['point-abandoned', e]);
      });

      test.widget.on('point-clicked', function (e) {
        Y.log(['point-clicked', e]);
        var message = 'click - ';
        Y.each(e.targetList, function (item, index) {
          var delim = ', ';

          if (index === e.targetList.length - 1) {
            delim = '';
          }
          message += item.pointObject.index + ': ' + item.label + delim;
        });
        Y.one('#message').setContent(message);
      });

      test.widget.on('pointer-over-canvas', function (e) {
        Y.one('#message').setContent(e.message);
      });

      test.widget.on('label-clicked', function (e) {
        Y.log(['label-clicked', e, e.label]);
      });

      test.widget.on('pointStyleChange', function (e) {
        Y.log(['pointStyleChange', e]);
        Y.log(test.widget.get('style'));
      });

      test.widget.on('viewportChange', function (e) {
        Y.log(['viewportChange', e]);
        test.reportTransformations();
      });

      test.widget.on('orientationChange', function (e) {
        Y.log(['orientationChange', e]);
        Y.log(test.widget.orientation());
        test.reportTransformations();
      });

      test.widget.on('stateChange', function (e) {
        Y.log(['stateChange', e.attrName, e.newVal]);
      });

      test.widget.on('selectedChange', function (e) {
        var list;
        if (e.newVal) {
          Y.one('#clear_selection').set('disabled', false);
          list = test.widget.listSelectedPoints();
          Y.one('#points_to_select').set('value', list.join(', '));
          Y.one('#status').setContent('selected: ' + e.newVal);
        }
        else {
          Y.one('#clear_selection').set('disabled', true);
          Y.one('#points_to_select').set('value', '');
          Y.one('#status').setContent('');
        }
      });

      test.widget.after('selectedChange', function (e) {
        test.reportLabelVisibilityState();
      });

      test.widget.on('dataChange', function (e) {
        var pval = 'null',
            aname = 'undefined';
        Y.log(['dataChange', e]);

        if (e.prevVal) {
          pval = e.prevVal.title[0].text[0];
        }
        if (e.subAttrName) {
          aname = e.subAttrName;
        }

        if (e.newVal === e.prevVal) {
          Y.log('subAttrName: ' + aname + '; newVal === prevVal');
        }
        else {
          Y.log('previous and new values are not equal');
          if (e.prevVal && e.newVal) {
            if (e.newVal.layout === e.prevVal.layout) {
              Y.log('the layout property is the same in newVal and prevVal');
            }
            else {
              Y.log('e.newVal.layout !== e.prevVal.layout');
            }

            if (e.newVal.point_info === e.prevVal.point_info) {
              Y.log('the point_info property is the same in newVal and prevVal');
            }
            else {
              Y.log('e.newVal.point_info !== e.prevVal.point_info');
            }

            if (e.newVal.point_info[0] === e.prevVal.point_info[0]) {
              Y.log('the point_info\'s 0th element is the same in newVal and prevVal');
            }
            else {
              Y.log('e.newVal.point_info[0] !== e.prevVal.point_info[0]');
            }
          }
          Y.log('subAttrName: ' + aname + '; newVal: "' + e.newVal.title[0].text[0] + '"; prevVal: "' + pval + '"');
          if (e.prevVal && e.newVal) {
            Y.log([e.prevVal.layout, e.newVal.layout]);
          }
        }
      });

      displayHierarchy();
      test.widget.layerStack.on('layersChange', displayHierarchy);
    },

    setChartSize: function () {
      Y.ACMACS.profile.set('chartSize', {
        x: parseInt(Y.one('#chart_width').get('value'), 10),
        y: parseInt(Y.one('#chart_height').get('value'), 10)
      });
    },

    loadData: function () {
      var
        dataName = Y.one('#data_selector').get('value'),
        data = Y.ACMACS[dataName];

      Y.one('#show_blobs').getDOMNode().checked = false;
      Y.log([dataName, data]);
      test.widget.set('data', data);
      Y.some(Y.ACMACS[dataName].layout, function (p, i) {
        var option, node;
        if (i >= 100) {
          return true;
        }
        option = Y.Node.create('<option value="' + i + '">' + i + '</option>');
        if (i === 0) {
          option.set('selected', true);
        }
        Y.one('#point_number').appendChild(option);

        // Place point markers in the shadow group
        // node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        // node.setAttribute('cx', p[0]);
        // node.setAttribute('cy', p[1]);
        // node.setAttribute('r', '0.04');
        // node.setAttribute('fill', 'red');
        // test.widget.layerStack.shadow.worldGroup.append(node);
      });
      //test.displayPointCoords();
      test.reportLabelVisibilityState();
    },

    displayPointCoords: function () {
      var
        i = Y.one('#point_number').get('value'),
        node = this.widget.layerStack.map.pointList[i].pointDOMNode;
      Y.one('#point_x').set('value', parseFloat(node.getAttribute('pointX')).toFixed(3));
      Y.one('#point_y').set('value', parseFloat(node.getAttribute('pointY')).toFixed(3));
    },

    movePoint: function () {
      var i = Y.one('#point_number').get('value'),
          point = this.widget.layerStack.map.pointList[i],
          x = parseFloat(Y.one('#point_x').get('value')),
          y = parseFloat(Y.one('#point_y').get('value'));
      this.widget.get('data').layout[i] = [x, y];
      this.widget.plot();
    },

    reportTransformations: function () {
      var bb = test.widget.layerStack.displayBoundingBox(),
          tl, br,
          offsetX, offsetY,
          viewportWidth = test.widget.layerStack.get('width'),
          viewportHeight = test.widget.layerStack.get('height'),
          t = test.widget.get('transformation');

      // Update the vieport indicator. First, calculate the union of the
      // viewport and the bounding box.
      tl = {
        x: Math.min(bb.x, 0),
        y: Math.min(bb.y, 0)
      };

      br = {
        x: Math.max(
          bb.x + bb.width,
          viewportWidth
        ),
        y: Math.max(
          bb.y + bb.height,
          viewportHeight
        )
      };

      // There seems to be a bug in vieBox code. It leads to incorrect results
      // when the negative co-ordinates are given for the top left corner.
      offsetX = tl.x < 0 ? -tl.x : 0;
      offsetY = tl.y < 0 ? -tl.y : 0;
      Y.Node.getDOMNode(Y.one('#vp-indicator-group')).setAttribute('viewBox', [tl.x + offsetX, tl.y + offsetY, br.x + offsetX, br.y + offsetY].join(' '));
      Y.Node.getDOMNode(Y.one('#bb-indicator-group')).setAttribute('viewBox', [tl.x + offsetX, tl.y + offsetY, br.x + offsetX, br.y + offsetY].join(' '));

      Y.Node.getDOMNode(Y.one('#vp-indicator')).setAttribute('x', offsetX);
      Y.Node.getDOMNode(Y.one('#vp-indicator')).setAttribute('y', offsetY);
      Y.Node.getDOMNode(Y.one('#vp-indicator')).setAttribute('width', viewportWidth);
      Y.Node.getDOMNode(Y.one('#vp-indicator')).setAttribute('height', viewportHeight);

      Y.Node.getDOMNode(Y.one('#bb-indicator')).setAttribute('x', bb.x + offsetX);
      Y.Node.getDOMNode(Y.one('#bb-indicator')).setAttribute('y', bb.y + offsetY);
      Y.Node.getDOMNode(Y.one('#bb-indicator')).setAttribute('width', bb.width);
      Y.Node.getDOMNode(Y.one('#bb-indicator')).setAttribute('height', bb.height);

      // Adjust stroke-width to approximately 1px
      Y.Node.getDOMNode(Y.one('#bb-indicator')).setAttribute(
        'stroke-width',
        0.75 * (br.x - tl.x) / 100
      );
    },

    reportLabelVisibilityState: function () {
      var
        labelsVisible = Y.one('#labelsVisible'),
        visibleLabelCount = Y.one('#visibleLabelCount'),
        widgetSelected = Y.one('#widget-selected'),
        mapSelected = Y.one('#map-selected'),
        selected = Y.one('#selected');

      labelsVisible.setContent((test.widget.get('labelsVisible') || 'null').toString());
      visibleLabelCount.setContent(test.widget.layerStack.map.visibleLabelCount().toString());
      widgetSelected.setContent(test.widget.get('selected').toString());
      mapSelected.setContent(test.widget.layerStack.map.get('selected').toString());
      selected.setContent(test.widget.layerStack.map.selected.toString());
    }
  };

  document.test = Y.ACMACS.WidgetTests = test;
}, '@VERSION@', {requires: ['acmacs-map', 'substitute']});
