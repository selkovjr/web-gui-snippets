YUI.add('procrustes', function (Y) {
  Y.namespace('ACMACS');
  Y.ACMACS.procrustesData = {
    styles: {
      styles: [
        {
          show_label: true,
          outline_color: '#000000',
          fill_color: '#00ff00',
          shape: 'circle',
          label_font: {},
          aspect: 1,
          rotation: 0,
          size: 1
        },
        {
          show_label: true,
          outline_color: '#000000',
          fill_color: ['#000000', 0],
          shape: 'circle',
          label_font: {},
          aspect: 1,
          rotation: 0,
          size: 1.5
        },
        {
          show_label: true,
          outline_color: '#000000',
          fill_color: ['#000000', 0],
          shape: 'box',
          label_font: {},
          aspect: 1,
          rotation: 0,
          size: 1.5
        }
      ],
      procrustes_lines_styles: [
        {
          color: '#000000',
          width: 1,
          arrow_length: 1,
          arrow_width: 1
        },
        {
          color: '#0000c0',
          width: 2,
          arrow_length: 1.2,
          arrow_width: 1
        }
      ],
      procrustes_lines: [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0
      ],
      points: [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        2,
        2,
        2,
        2,
        2
      ],
      drawing_order: [
        [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        [
          8,
          9,
          10,
          11,
          12
        ]
      ]
    },
    show_labels: true,
    scale: {
      object_size_scale: 1,
      label_size_scale: 1
    },
    layout: [
      [
        0.858928315647753,
        0.4398490597404806
      ],
      [
        -0.4005120402306946,
        1.254594414113721
      ],
      [
        -1.2547648770242865,
        -1.4281517513619957
      ],
      [
        -1.2547648770242865,
        -1.4281517513619957
      ],
      [
        0.8589282932322725,
        0.4398490261639541
      ],
      [
        -0.8028332715652138,
        1.5148602817832477
      ],
      [
        2.9938883781433105,
        0.5723007917404175
      ],
      [
        -1.2547648770242865,
        -1.4281517513619957
      ],
      [
        -1.5305099249768637,
        1.9856020494658777
      ],
      [
        0.14874388930767005,
        0.8992748941130357
      ],
      [
        2.7315051555633545,
        0.7420395612716675
      ],
      [
        -1.2547648770242865,
        -1.4281517513619957
      ],
      [
        0.6525200233861347,
        0.5733767513219674
      ]
    ],
    center: [
      0.43951384166211316,
      0.880780171716165
    ],
    diameter: [
      6,
      6
    ],
    title: {
      0: {
        text: [
          'NIBSC A(H5N1) 48886 20121023 horse <103.2715> [8:5]'
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
            width: 1
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
    number_of_antigens: 8,
    point_indices_per_page: {
      '0': null,
      '-1': []
    },
    version: 1,
    grid: {
      style: {},
      step: 1
    },
    procrustes: {
      common_points: {
        0: 0,
        1: 1,
        4: 4,
        5: 5,
        6: 6,
        8: 8,
        9: 9,
        10: 10,
        12: 12
      },
      layout: [
        [
          0.9577898774686227,
          0.8387969903303008
        ],
        [
          -0.4867640514248853,
          1.243212081723351
        ],
        [
          0.9597024640300901,
          3.6596693420585504
        ],
        [
          0.9597024640300901,
          3.6596693420585504
        ],
        [
          0.9578746915995444,
          0.8393135049354133
        ],
        [
          -0.9475919861887224,
          1.3739928636312728
        ],
        [
          3.1240878299634995,
          // 0.23101515284743868
          null
        ],
        [
          0.9597024640300901,
          3.6596693420585504
        ],
        [
          -1.7821288045863612,
          1.607971024261984
        ],
        [
          0.14308205421400533,
          1.0662865246208737
        ],
        [
          2.823249230358953,
          0.3157373727845181
        ],
        [
          0.9597024640300901,
          3.6596693420585504
        ],
        [
          0.7210599771030666,
          0.9054213145792164
        ]
      ]
    },
    background: {
      borderline_color: null,
      background_color: 16777215
    },
    viewport_size: [
      6,
      6
    ],
    border_space: 0,
    viewport_origin: [
      -2.560486158337887,
      -2.119219828283835
    ],
    transformation: [
      [
        1,
        0
      ],
      [
        0,
        1
      ]
    ],
    point_info: [
      {
        label_full: 'A(H5N1)/HUMAN/VIETNAM/1194/2004 ::RG-14 *NIB ::VERO1/E3',
        lab_id: 'NIBSC#29080',
        label_lab_id: '29080',
        location_name: 'VIETNAM',
        location_country: 'VIETNAM',
        reassortant: 'RG-14 *NIB',
        isolation_number: '1194',
        location_latitude: '21.03',
        label_short: 'A/VIETNAM/1194/2004',
        location_longitude: '105.84',
        location_continent: 'ASIA',
        passage: 'VERO1/E3',
        virus_type: 'A(H5N1)',
        host: 'HUMAN',
        year: '2004',
        label_capitalized_short: 'A/Vietnam/1194/2004',
        label_capitalized: 'A(H5N1)/Human/Vietnam/1194/2004 Rg-14 *Nib Vero1/E3'
      },
      {
        label_full: 'A(H5N1)/TURKEY/TURKEY/1/2005 ::RG-23 *NIB ::VERO1/E3',
        lab_id: 'NIBSC#32140',
        label_lab_id: '32140',
        location_name: 'TURKEY',
        location_country: 'TURKEY',
        reassortant: 'RG-23 *NIB',
        isolation_number: '1',
        location_latitude: '39.93',
        label_short: 'A/TURKEY/TURKEY/1/2005',
        location_longitude: '32.85',
        location_continent: 'MIDDLE-EAST',
        passage: 'VERO1/E3',
        virus_type: 'A(H5N1)',
        host: 'TURKEY',
        year: '2005',
        label_capitalized_short: 'A/Turkey/Turkey/1/2005',
        label_capitalized: 'A(H5N1)/Turkey/Turkey/1/2005 Rg-23 *Nib Vero1/E3'
      },
      {
        label_full: 'A(H5N1)/DUCK/SINGAPORE/F119/1997 ::E1/X1/E1',
        lab_id: 'NIBSC#33710',
        label_lab_id: '33710',
        location_name: 'SINGAPORE',
        location_country: 'SINGAPORE',
        few_titers: '1',
        isolation_number: 'F119',
        location_latitude: '1.3',
        label_short: 'A/DUCK/SINGAPORE/F119/1997',
        location_longitude: '103.85',
        location_continent: 'ASIA',
        passage: 'E1/X1/E1',
        virus_type: 'A(H5N1)',
        host: 'DUCK',
        year: '1997',
        label_capitalized_short: 'A/Duck/Singapore/F119/1997',
        label_capitalized: 'A(H5N1)/Duck/Singapore/F119/1997 E1/X1/E1'
      },
      {
        label_full: 'A(H5N1)/HUMAN/ANHUI/1/2005 ::IBCDCRG-5 ::VERO1/E4',
        lab_id: 'NIBSC#33890',
        label_lab_id: '33890',
        location_name: 'ANHUI',
        location_country: 'CHINA',
        few_titers: '1',
        reassortant: 'IBCDCRG-5',
        isolation_number: '1',
        location_latitude: '31.85',
        label_short: 'A/ANHUI/1/2005',
        location_longitude: '117.28',
        location_continent: 'ASIA',
        passage: 'VERO1/E4',
        virus_type: 'A(H5N1)',
        host: 'HUMAN',
        year: '2005',
        label_capitalized_short: 'A/Anhui/1/2005',
        label_capitalized: 'A(H5N1)/Human/Anhui/1/2005 Ibcdcrg-5 Vero1/E4'
      },
      {
        label_full: 'A(H5N1)/HUMAN/CAMBODIA/R0405050/2007 ::RG-88 *NIB ::VERO1/E2',
        lab_id: 'NIBSC#29850',
        label_lab_id: '29850',
        location_name: 'CAMBODIA',
        location_country: 'CAMBODIA',
        reassortant: 'RG-88 *NIB',
        isolation_number: 'R0405050',
        location_latitude: '11.57',
        label_short: 'A/CAMBODIA/R0405050/2007',
        location_longitude: '104.92',
        location_continent: 'ASIA',
        passage: 'VERO1/E2',
        virus_type: 'A(H5N1)',
        host: 'HUMAN',
        year: '2007',
        label_capitalized_short: 'A/Cambodia/R0405050/2007',
        label_capitalized: 'A(H5N1)/Human/Cambodia/R0405050/2007 Rg-88 *Nib Vero1/E2'
      },
      {
        label_full: 'A(H5N1)/HUMAN/HONG KONG/213/2003 ::RG-12 *NIB ::VERO1/E3',
        lab_id: 'NIBSC#30400',
        label_lab_id: '30400',
        location_name: 'HONG KONG',
        location_country: 'CHINA',
        reassortant: 'RG-12 *NIB',
        isolation_number: '213',
        location_latitude: '22.27',
        label_short: 'A/HONG KONG/213/2003',
        location_longitude: '114.14',
        location_continent: 'ASIA',
        passage: 'VERO1/E3',
        virus_type: 'A(H5N1)',
        host: 'HUMAN',
        year: '2003',
        label_capitalized_short: 'A/Hong Kong/213/2003',
        label_capitalized: 'A(H5N1)/Human/Hong Kong/213/2003 Rg-12 *Nib Vero1/E3'
      },
      {
        label_full: 'A(H5N1)/TERN/SOUTH AFRICA/UNKNOWN/1961 ::E?X?/E3',
        lab_id: 'NIBSC#BII/10/11',
        label_lab_id: 'BII/10/11',
        location_name: 'SOUTH AFRICA',
        location_country: 'SOUTH AFRICA',
        isolation_number: 'UNKNOWN',
        location_latitude: '-25.73',
        label_short: 'A/TERN/SOUTH AFRICA/UNKNOWN/1961',
        location_longitude: '28.22',
        location_continent: 'AFRICA',
        passage: 'E?X?/E3',
        virus_type: 'A(H5N1)',
        host: 'TERN',
        year: '1961',
        label_capitalized_short: 'A/Tern/South Africa/Unknown/1961',
        label_capitalized: 'A(H5N1)/Tern/South Africa/Unknown/1961 E?X?/E3'
      },
      {
        label_full: 'A(H5N1)/HUMAN/INDONESIA/5/2005 ::E2/MK1/E2',
        lab_id: 'NIBSC#BII/11/11',
        label_lab_id: 'BII/11/11',
        location_name: 'INDONESIA',
        location_country: 'INDONESIA',
        few_titers: '1',
        isolation_number: '5',
        location_latitude: '-6.18',
        label_short: 'A/INDONESIA/5/2005',
        location_longitude: '106.83',
        location_continent: 'ASIA',
        passage: 'E2/MK1/E2',
        virus_type: 'A(H5N1)',
        host: 'HUMAN',
        year: '2005',
        label_capitalized_short: 'A/Indonesia/5/2005',
        label_capitalized: 'A(H5N1)/Human/Indonesia/5/2005 E2/Mk1/E2'
      },
      {
        label_full: 'A(H5N1)/DUCK/HUNAN/795/2002 ::F0051-11D ::FERRET',
        label_lab_id: 'A/DUCK/HUNAN/795/2002',
        location_name: 'HUNAN',
        location_country: 'CHINA',
        serum_id: 'F0051-11D',
        location_latitude: '28.2',
        label_short: 'A/DUCK/HUNAN/795/2002',
        location_longitude: '112.97',
        serum_species: 'FERRET',
        virus_type: 'A(H5N1)',
        isolation_number: '795',
        host: 'DUCK',
        location_continent: 'ASIA',
        year: '2002',
        label_capitalized_short: 'A/Duck/Hunan/795/2002',
        label_capitalized: 'A(H5N1)/Duck/Hunan/795/2002 F0051-11D Ferret'
      },
      {
        label_full: 'A(H5N1)/DUCK/HUNAN/795/2002 ::F0052-11D ::FERRET',
        label_lab_id: 'A/DUCK/HUNAN/795/2002',
        location_name: 'HUNAN',
        location_country: 'CHINA',
        serum_id: 'F0052-11D',
        location_latitude: '28.2',
        label_short: 'A/DUCK/HUNAN/795/2002',
        location_longitude: '112.97',
        serum_species: 'FERRET',
        virus_type: 'A(H5N1)',
        isolation_number: '795',
        host: 'DUCK',
        location_continent: 'ASIA',
        year: '2002',
        label_capitalized_short: 'A/Duck/Hunan/795/2002',
        label_capitalized: 'A(H5N1)/Duck/Hunan/795/2002 F0052-11D Ferret'
      },
      {
        label_full: 'A(H5N1)/COMMON MAGPIE/HONG KONG/5052/2007 ::F0056-11D ::FERRET',
        label_lab_id: 'A/COMMON MAGPIE/HONG KONG/5052/2007',
        location_name: 'HONG KONG',
        location_country: 'CHINA',
        serum_id: 'F0056-11D',
        location_latitude: '22.27',
        label_short: 'A/COMMON MAGPIE/HONG KONG/5052/2007',
        location_longitude: '114.14',
        serum_species: 'FERRET',
        virus_type: 'A(H5N1)',
        isolation_number: '5052',
        host: 'COMMON MAGPIE',
        location_continent: 'ASIA',
        year: '2007',
        label_capitalized_short: 'A/Common Magpie/Hong Kong/5052/2007',
        label_capitalized: 'A(H5N1)/Common Magpie/Hong Kong/5052/2007 F0056-11D Ferret'
      },
      {
        label_full: 'A(H5N1)/JAPANESE WHITE-EYE/HONG KONG/1038/2006 ::F0053-11D ::FERRET',
        label_lab_id: 'A/JAPANESE WHITE-EYE/HONG KONG/1038/2006',
        location_name: 'HONG KONG',
        location_country: 'CHINA',
        few_titers: '1',
        serum_id: 'F0053-11D',
        location_latitude: '22.27',
        label_short: 'A/JAPANESE WHITE-EYE/HONG KONG/1038/2006',
        location_longitude: '114.14',
        serum_species: 'FERRET',
        virus_type: 'A(H5N1)',
        isolation_number: '1038',
        host: 'JAPANESE WHITE-EYE',
        location_continent: 'ASIA',
        year: '2006',
        label_capitalized_short: 'A/Japanese White-Eye/Hong Kong/1038/2006',
        label_capitalized: 'A(H5N1)/Japanese White-Eye/Hong Kong/1038/2006 F0053-11D Ferret'
      },
      {
        label_full: 'A(H5N1)/JAPANESE WHITE-EYE/HONG KONG/1038/2006 ::F0054-11D ::FERRET',
        label_lab_id: 'A/JAPANESE WHITE-EYE/HONG KONG/1038/2006',
        location_name: 'HONG KONG',
        location_country: 'CHINA',
        serum_id: 'F0054-11D',
        location_latitude: '22.27',
        label_short: 'A/JAPANESE WHITE-EYE/HONG KONG/1038/2006',
        location_longitude: '114.14',
        serum_species: 'FERRET',
        virus_type: 'A(H5N1)',
        isolation_number: '1038',
        host: 'JAPANESE WHITE-EYE',
        location_continent: 'ASIA',
        year: '2006',
        label_capitalized_short: 'A/Japanese White-Eye/Hong Kong/1038/2006',
        label_capitalized: 'A(H5N1)/Japanese White-Eye/Hong Kong/1038/2006 F0054-11D Ferret'
      }
    ]
  };
});
