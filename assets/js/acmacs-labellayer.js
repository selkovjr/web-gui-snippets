/*
  # license
  # license.
*/
// ======================================================================

// _Stackable label layer_
//

// This module extends `Y.ACMACS.LayerWidget` with label-specific functionality.
//

/*global Y: false, document: false */
var code = {
  prototypeProperties: {
    monolithic: false, // labels can be moved

    // The metric coefficient used in the calculation of label sizes.
    // Because the label layer does not get transformed, the scale coefficient
    // is set once in setDeviceDimensions().
    scale: null,

    // The label layer does not do its own transformations except for
    // translation; other transformations on the layer stack make labels follow
    // points.
    can: {
      pan: true
    },

    // This destructor is needed because the `pickupPoint` property created in
    // `this.pointerMoveStart` masks the property of the prototype which
    // remains undefiend during this object's lifecycle.
    destructor: function () {
      this.pickupPoint = undefined;
    },

    // <a name="updateLabelSize">
    // ### updateLabelSize()

    // Recalculate and update label sizes to reflect changes in the widget's
    // or in profile settings.
    //
    updateLabelSize: function () {
      var
        labelScale = this.attributeOrProfileSetting('labelScale'),
        mapLayer = this.parent.map,
        mapPoint;

      Y.each(this.groupDOMNode.childNodes, Y.bind(function (labelDOMNode) {
        var
          newSize = labelScale,
          dy = labelDOMNode.getAttribute('dy');

        if (labelDOMNode.index !== undefined) {
          mapPoint = mapLayer.pointList[labelDOMNode.index];
          if (mapPoint) {
            if (labelDOMNode.abstractSize !== undefined) {
              // Abstract size is the size specified in map data.
              newSize *= labelDOMNode.abstractSize;
            }

            // Apply the scale factor specific for this device
            newSize *= this.attributeOrProfileSetting('labelSizeCalibration') * this.onePixel;
            labelDOMNode.setAttribute('font-size', newSize);

            // Touching dy must be done because it is specified in ems and so becomes invalid after font-size change.
            if (dy) {
              labelDOMNode.setAttribute('dy', dy);
            }
            mapPoint.updateLeader();
          } // mapPoint exists
        } // labelDOMNode.index
      }, this));
    }, // updateLabelSize()


    // <a name="updateLabelText">
    // ### updateLabelText()

    // Replace label text with that corresponding to the new label type.
    updateLabelText: function () {
      Y.log('updateLabelText');
      var
        labelType = this.attributeOrProfileSetting('labelType'),
        mapLayer = this.parent.map,
        data = mapLayer.data, // a streamlined version of widget data stored in map.plot()
        mapPoint;

      Y.each(this.groupDOMNode.childNodes, Y.bind(function (node) {
        // An indicator of it being a map point, rather than some stray text
        if (node.index !== undefined) {
          mapPoint = mapLayer.pointList[node.index];
          if (mapPoint) {
            node.firstChild.nodeValue = data.pointInfo[node.index][labelType] || '';
            mapPoint.updateLeader();
          }
        }
      }, this));
    }, // updateLabelText()


    // <a name="drag_and_drop">
    // ### Point translation (drag-and-drop)

    // Translating a point or a set of points is similar to translating a view.
    // The same pointer events are needed to initiate it and to carry it out,
    // although the `mousedown` event needs a modifier. The transformation itself
    // is exactly the same as in view translation; the only difference is that it
    // is applied to a group node that is created to wrap the selected nodes and
    // serves as a target for this operation (`this.operationGroupDOMNode`), while
    // during view translation, the operation is applied to the base group node
    // (`this.groupDOMNode`). The selected nodes are temporarily reparented from
    // the base group to the operation group.

    // <a name="pointerMoveStart">
    // ### pointerMoveStart()

    // This method initialises the drag-and-drop action on a modified `mousedown`
    // event. If followed by mousemove events, the location it saves in
    // `this.pickupPoint` is used to calculate the amount of translation of the
    // affected point or a set of points. In the absence of subsequent
    // `mousemove` events, it has no effect.

    pointerMoveStart: function (e) {
      // Reparent this point's label and label leader to operation group.
      var reparent = Y.bind(function reparent(mapPoint) {
        if (mapPoint.textNode) {
          mapPoint.textNode.remove();
          this.operationGroupDOMNode.appendChild(mapPoint.textDOMNode);
        }
        if (mapPoint.leaderNode) {
          mapPoint.leaderNode.remove();
          this.operationGroupDOMNode.appendChild(mapPoint.leaderDOMNode);
        }
      }, this);

      // Remember where the action started, to allow `pointerMoveDrag()` to
      // calculate the amount of translation. The pick-up point is defined in
      // world co-ordinates.
      this.pickupPoint = this.worldPoint(e.x, e.y);

      this.operationGroupDOMNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.operationGroupDOMNode.setAttribute('class', 'opgroup');
      this.operationGroupDOMNode.setAttribute('transform', this.groupDOMNode.getAttribute('transform'));
      this.canvas.append(Y.one(this.operationGroupDOMNode));

      if (this.rootWidget.get('labelsVisible')) {
        if (this.parent.map.get('selected')) {
          // If any points are selected, they must all be moved. In anticipation of the move,
          // reparent the labels of all selected points to operation group.
          Y.each(this.parent.map.pointList, function (p) {
            if (p.selected) {
              // Reparent this point's label to operation group.
              reparent(p);
            }
          });
        }
        else {
          // This is a single-point operation, so only the point that was the
          // event target needs re-parenting.
          reparent(this.parent.map.pointList[Y.Node.getDOMNode(e.target).index]);
        }
      }
    },


    // <a name="pointerMoveDrag">
    // ### pointerMoveDrag()

    // Applies translation to the SVG node that received the modified `mousedown`
    // event. Implemented in the prototype, `Y.ACMACS.LayerWidget`.


    // <a name="pointerMoveCancel">
    // ### pointerMoveCancel()

    // Cleans up the state after a drag-and-drop operation has been cancelled
    // (mouse released outside the viewport). Implemented in the prototype,
    // `Y.ACMACS.LayerWidget`.


    // <a name="pointerStopDrag">
    // ### pointerStopDrag()

    // Reparent the labels to base group, adjusting their resultant coordinates.
    // This method will be called on `mouseup` event.
    pointerStopDrag: function () {
      var t;

      if (this.rootWidget.get('labelsVisible')) {
        t = this.groupDOMNode.getCTM().inverse().multiply(this.operationGroupDOMNode.getCTM());
        Y.each(this.operationGroupDOMNode.childNodes, Y.bind(function (node) {
          // Reparent the node from operation group back to base group.
          Y.one(node).remove();
          this.groupDOMNode.appendChild(node);

          // Translate the selected node to new co-ordinates, which are determined
          // from the transformation on the operation group.
          //
          // SVG nodes do not have a `translate()` method; to keep the layer code
          // better organised, the method implementing translation of an ACMACS map
          // point,
          // [`translatePreservingTilt()`](svg-methods.html#translatePreservingTilt),
          // has been added as a DOM extension.
          node.translatePreservingTilt(t.e, t.f);
        }, this));
      }

      Y.one(this.operationGroupDOMNode).remove(true);
    },


    // <a name="touch">
    // ### touch()

    // Scale labels by a negligible amount. This is a hack needed to force
    // Chrome to do the initial rendering of the lables. It is not clear what
    // events trigger label rendering in Chrome, but this is one way to force it.
    touch: function () {
      // There is no economy to be made; all labels must be touched.
      Y.each(this.groupDOMNode.childNodes, function (node) {
        // And the scale of 1 is no good. There must be a real change. Doing and
        // immediately undoing the change does not help either.
        if (node.tagName === 'text') {
          node.scale(1.001);
        }
      });
    }
  },
  staticProperties: {
  }
};

Y.namespace('ACMACS').LabelLayer = Y.Base.create(
  'acmacsLabelLayer',
  Y.ACMACS.LayerWidget,
  [],
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
