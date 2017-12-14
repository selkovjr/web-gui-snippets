YUI.add('transformation-components', function(Y) {
/*global SVGMatrix: false, Y: false */

/**
 * Methods to extract component transformations from an `SVGMatrix`
 *
 * @module acmacs-base
 * @submodule transformation-components
 */

// ----------------------------------------------------------------------
// SVGMatrix methods
// ----------------------------------------------------------------------

/**
 This function determines whether or not this transformation will change
 the sense of rotation.

 @method chirality
 @for SVGMatrix
 @return {Number}
   * `1`: transformation preserves chirality
   * `-1`: transformation reverses chirality
   * `undefined`: transformation is degenerate
 */
SVGMatrix.prototype.chirality = function () {

  // The look-up table compiled from the observations of the sense of rotation
  // over all possible combinations of the signs of the matrix coefficients.
  var chiralityTable = [
    [ // -1
      [ // -1, -1
        [ // -1, -1, -1
          1,         // -1
          1,         //  0
          1          //  1
        ],
        [ // -1, -1,  0
          -1,        // -1
          undefined, //  0
          1          //  1
        ],
        [ // -1, -1,  1
          -1,        // -1
          -1,        //  0
          -1         //  1
        ]
      ],
      [ // -1,  0
        [ // -1,  0, -1
          -1,        // -1
          undefined, //  0
          1          //  1
        ],
        [ // -1,  0,  0
          -1,        // -1
          undefined, //  0
          1          //  1
        ],
        [ // -1,  0,  1
          -1,        // -1
          undefined, //  0
          1          //  1
        ]
      ],
      [ // -1,  1
        [ // -1,  1, -1
          -1,        // -1
          -1,        //  0
          -1         //  1
        ],
        [ // -1,  1,  0
          -1,        // -1
          undefined, //  0
          1          //  1
        ],
        [ // -1,  1,  1
          1,         // -1
          1,         //  0
          1          //  1
        ]
      ]
    ],
    [ // 0
      [ // 0, -1
        [ // 0, -1, -1
          1,         // -1
          1,         //  0
          1          //  1
        ],
        [ // 0, -1,  0
          undefined, // -1
          undefined, //  0
          undefined  //  1
        ],
        [ // 0, -1,  1
          -1,        // -1
          -1,        //  0
          -1         //  1
        ]
      ],
      [ // 0,  0
        [ // 0,  0, -1
          undefined, // -1
          undefined, //  0
          undefined  //  1
        ],
        [ // 0,  0,  1
          undefined, // -1
          undefined, //  0
          undefined  //  1
        ],
        [ // 0,  0,  0
          undefined, // -1
          undefined, //  0
          undefined  //  1
        ]
      ],
      [ // 0,  1
        [ // 0,  1, -1
          -1,        // -1
          -1,        //  0
          -1         //  1
        ],
        [ // 0,  1,  0
          undefined, // -1
          undefined, //  0
          undefined  //  1
        ],
        [ // 0,  1,  1
          1,         // -1
          1,         //  0
          1          //  1
        ]
      ]
    ],
    [ // 1
      [ // 1, -1
        [ // 1, -1, -1
          1,         // -1
          1,         //  0
          1          //  1
        ],
        [ // 1, -1,  0
          1,         // -1
          undefined, //  0
          -1         //  1
        ],
        [ // 1, -1,  1
          -1,        // -1
          -1,        //  0
          -1         //  1
        ]
      ],
      [ // 1,  0
        [ // 1,  0, -1
          1,         // -1
          undefined, //  0
          -1         //  1
        ],
        [ // 1,  0,  0
          1,         // -1
          undefined, //  0
          -1         //  1
        ],
        [ // 1,  0,  1
          1,         // -1
          undefined, //  0
          -1         //  1
        ]
      ],
      [ // 1,  1
        [ // 1,  1, -1
          -1,        // -1
          -1,        //  0
          -1         //  1
        ],
        [ // 1,  1,  0
          1,         // -1
          undefined, //  0
          -1         //  1
        ],
        [ // 1,  1,  1
          1,         // -1
          1,         //  0
          1          //  1
        ]
      ]
    ]
  ],

  // The adjusted sign function mapping its argument's sign into a set of array
  // indexes:
  //     [-1, 0, -1] -> [0, 1, 2]
  //
  sign = function (x) {
    if (x === undefined) {
      return x;
    }
    if (x < 0) {
      return 0; // -1
    }
    if (x > 0) {
      return 2; //  1
    }
    return 1;   //  0
  };

  // The chirality was initially tabulated using the flipped view, so now it
  // needs to be inverted.
  return -chiralityTable[sign(this.a)][sign(this.b)][sign(this.c)][sign(this.d)];
};


/**
 This function extracts the rotational component of the transformation matrix.

 @method rotation
 @for SVGMatrix
 @return {Number} The angle of rotation in radians
 */
SVGMatrix.prototype.rotation = function () {
  return Math.atan2(this.b, this.d);
};

}, '@VERSION@', {});
