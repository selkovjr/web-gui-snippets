YUI.add('point-array', function (Y) {
  Y.namespace('ACMACS');
  Y.ACMACS.pointArrayData = {
    styles: {
      styles: [
        { // three green circles
          show_label: true,
          outline_color: 'black',
          fill_color: '#00FF00',
          shape: 'circle',
          label_font: {},
          aspect: 1,
          rotation: 0,
          size: 2.5
        },
        { // straight rectangle
          show_label: true,
          outline_color: 'black',
          fill_color: [
            '#000000',
            0
          ],
          shape: 'box',
          label_font: {},
          aspect: 1,
          rotation: 0,
          size: 2.5
        },
        { // tilted rectangle
          show_label: true,
          outline_color: '#000000',
          fill_color: [
            '#000000',
            0
          ],
          shape: 'box',
          label_font: {},
          aspect: 1,
          rotation: 30,
          size: 2.5,
          label_position_y: 0.2,
          label_position_x: 0.06,
          label_position_type: 'tethered'
        },
        { // red triangle; it is a unit-size shape that will be scaled to point size by addPoint()
          show_label: true,
          outline_color: '#0000FF',
          fill_color: [
            'red',
            0.4
          ],
          shape: 'path',
          path: 'M -0.866 -0.5 L 0.866 -0.5 L 0 1 z',
          label_font: {},
          aspect: 1, // ignored by addPoint() when creating a path
          rotation: 10,
          size: 2.5
        },
        { // flat-sided star (simple polygon)
          show_label: true,
          outline_color: 'black',
          fill_color: [
            '#808000',
            0.8
          ],
          shape: 'star',
          star: {
            flatsided: true,
            rotation: 0,
            proportion: 0,
            rounded: 0,
            arg1: 0,
            arg2: 0.2,
            corners: 6
          },
          label_font: {},
          aspect: 1, // ignored by addPath() when creating a star
          rotation: 10,
          size: 6
        },
        { // star with Bezier arms
          show_label: true,
          outline_color: 'black',
          fill_color: [
            'blue',
            0.8
          ],
          shape: 'star',
          star: {
            rotation: 0,
            corners: 6,
            proportion: 0.6,
            rounded: 0.4,
            arg1: 0,
            arg2: 0.2
          },
          label_font: {},
          aspect: 1, // ignored by addPath()
          rotation: 10,
          size: 6
        }
      ],
      drawing_order: [[3, 4], [0, 1, 2], [5, 6, 7]],
      points: [
        0,
        0,
        0,
        1,
        2,
        3,
        4,
        5
      ]
    },
    altStyle: {
      styles: [
        { // three green circles
          show_label: true,
          outline_color: 'blue',
          fill_color: ['#8080FF', 0.6],
          shape: 'circle',
          label_font: {},
          aspect: 1,
          rotation: 0,
          size: 2.5
        },
        { // straight rectangle
          show_label: true,
          outline_color: 'black',
          fill_color: [
            '#000000',
            0
          ],
          shape: 'box',
          label_font: {},
          aspect: 1,
          rotation: 0,
          size: 2.5
        },
        { // tilted rectangle
          show_label: true,
          outline_color: '#000000',
          fill_color: [
            '#000000',
            0
          ],
          shape: 'box',
          label_font: {},
          aspect: 1,
          rotation: 30,
          size: 2.5
        },
        { // red triangle; it is a unit-size shape that will be scaled to point size by addPoint()
          show_label: true,
          outline_color: '#0000FF',
          fill_color: [
            'red',
            0.4
          ],
          shape: 'path',
          path: 'M -0.866 -0.5 L 0.866 -0.5 L 0 1 z',
          label_font: {},
          aspect: 1, // ignored by addPoint() when creating a path
          rotation: 10,
          size: 2.5
        },
        { // flat-sided star (simple polygon)
          show_label: true,
          outline_color: 'black',
          fill_color: [
            '#808000',
            0.8
          ],
          shape: 'star',
          star: {
            flatsided: true,
            rotation: 0,
            proportion: 0,
            rounded: 0,
            arg1: 0,
            arg2: 0.2,
            corners: 6
          },
          label_font: {},
          aspect: 1, // ignored by addPath() when creating a star
          rotation: 10,
          size: 6
        },
        { // star with Bezier arms
          show_label: true,
          outline_color: 'black',
          fill_color: [
            'blue',
            0.8
          ],
          shape: 'star',
          star: {
            rotation: 0,
            corners: 6,
            proportion: 0.6,
            rounded: 0.4,
            arg1: 0,
            arg2: 0.2
          },
          label_font: {},
          aspect: 1, // ignored by addPath()
          rotation: 10,
          size: 6
        }
      ],
      drawing_order: [[3, 4], [0, 1, 2], [5, 6, 7]],
      points: [
        0,
        0,
        0,
        1,
        2,
        3,
        4,
        5
      ]
    },
    show_labels: true,
    scale: {
      object_size_scale: 1,
      label_size_scale: 1
    },
    layout: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [0.5, 0.5],
      [0, 0.5],
      [0.5, 1],
      [1, 0.5]
    ],
    center: [
      0.41333613187425566,
      -0.33482258880452487
    ],
    diameter: 1.7738494665883855,
    title: {
      '0': {
        text: [
          'EU 3ags 2sr H <2.6716> [3:2]'
        ],
        style: {
          text: {
            color: '#0000ff',
            rotation: 0,
            font: {
              slant: 'normal',
              weight: 'bold',
              face: 'sans-serif'
            },
            size: 1
          },
          top_bottom_space: 10,
          border: {
            color: '#000080',
            width: 0.005
          },
          background: [
            '#e0e0ff',
            0.7490196078431373
          ],
          left_right_space: 10
        },
        offset: [
          20,
          20
        ]
      }
    },
    point_indices_per_page: {
      '0': null,
      '-1': []
    },
    version: 1,
    grid: {
      style: {},
      step: 1
    },
    background: {
      borderline_color: null,
      background_color: 16777215
    },
    viewport_size: [
      2,
      2
    ],
    border_space: 0,
    viewport_origin: [
      -0.5866638681257443,
      -1.3348225888045249
    ],
    transformation: [ [ 1, 0 ], [ 0, -1 ] ],
    point_info: [
      {
        label_full: 'A1 ::designation_raw',
        name: 'A1',
        type: 'designation_raw',
        label_short: 'A1',
        label_capitalized_short: 'A1',
        label_capitalized: 'A1 Designation_Raw'
      },
      {
        label_full: 'A2 ::designation_raw',
        name: 'A2',
        type: 'designation_raw',
        label_short: 'A2',
        label_capitalized_short: 'A2',
        label_capitalized: 'A2 Designation_Raw'
      },
      {
        label_full: 'A3 ::designation_raw',
        name: 'A3',
        type: 'designation_raw',
        label_short: 'A3',
        label_capitalized_short: 'A3',
        label_capitalized: 'A3 Designation_Raw'
      },
      {
        label_full: 'S1 ::designation_raw',
        name: 'S1',
        type: 'designation_raw',
        label_short: 'S1',
        label_capitalized_short: 'S1',
        label_capitalized: 'S1 Designation_Raw'
      },
      {
        label_full: 'S2 ::designation_raw',
        name: 'S2',
        type: 'designation_raw',
        label_short: 'S2',
        label_capitalized_short: 'S2',
        label_capitalized: 'S2 Designation_Raw'
      },
      {
        name: 'ad-hoc path',
        label_full: 'ad-hoc path'
      },
      {
        name: 'flat-sided star',
        label_full: 'flat-sided star'
      },
      {
        name: 'Bezier star',
        label_full: 'Bezier star'
      }
    ]
  };
});
