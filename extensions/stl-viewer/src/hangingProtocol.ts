/**
 * Hanging protocol for STL 3D models
 */

const hangingProtocol = {
  id: 'stl-viewer',
  name: 'STL 3D Model Viewer',
  protocolMatchingRules: [
    {
      attribute: 'Modality',
      constraint: {
        equals: 'STL',
      },
      required: false, // Changed to false to be more flexible
    },
  ],
  displaySetSelectors: {
    stlDisplaySet: {
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: {
            equals: 'STL',
          },
          required: false, // Changed to false
        },
        {
          attribute: 'isSTL',
          constraint: {
            equals: true,
          },
          required: false,
        },
      ],
    },
  },
  stages: [
    {
      id: 'stl-default',
      name: 'STL 3D View',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportOptions: {
            viewportId: 'stl-viewport',
            viewportType: 'stl-3d',
            background: [0.1, 0.1, 0.1],
            orientation: 'axial',
          },
          displaySets: [
            {
              id: 'stlDisplaySet',
            },
          ],
        },
      ],
    },
  ],
};

export default hangingProtocol;
