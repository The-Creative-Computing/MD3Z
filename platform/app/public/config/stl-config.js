/** @type {AppTypes.Config} */

/**
 * STL Viewer Configuration
 * Loads STL files from sessionStorage when user uploads them
 */

// Load STL files from sessionStorage if available
function loadSTLFilesFromSession() {
  const pendingSTLFiles = sessionStorage.getItem('pendingSTLFiles');
  
  if (!pendingSTLFiles) {
    return null;
  }

  try {
    const stlFiles = JSON.parse(pendingSTLFiles);
    sessionStorage.removeItem('pendingSTLFiles');
    
    console.log('Loading STL files from session:', stlFiles);
    
    return stlFiles;
  } catch (error) {
    console.error('Error loading STL files from session:', error);
    return null;
  }
}

// Initialize STL data source
const stlFiles = loadSTLFilesFromSession();
const hasSTLFiles = stlFiles && stlFiles.length > 0;

window.config = {
  name: 'M3DZ STL Viewer',
  routerBasename: '/',

  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement(
        'a',
        {
          target: '_self',
          rel: 'noopener noreferrer',
          className: 'flex items-center',
          href: '/',
          style: { textDecoration: 'none' },
        },
        React.createElement(
          'span',
          {
            style: {
              color: '#5ce6ac',
              fontSize: '24px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              fontFamily: 'Arial, sans-serif',
            },
          },
          'M3DZ'
        )
      );
    },
  },

  extensions: [],
  modes: [],

  showStudyList: !hasSTLFiles,
  maxNumberOfWebWorkers: 4,

  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,

  investigationalUseDialog: {
    option: 'never',
  },

  groupEnabledModesFirst: true,
  showErrorDetails: 'always',

  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    prefetch: 25,
  },

  // Default data source for STL files
  defaultDataSourceName: hasSTLFiles ? 'stl-local' : 'embedded',

  dataSources: [
    // STL Local Data Source
    {
      namespace: '@ohif/extension-stl-viewer.dataSourcesModule.stl',
      sourceName: 'stl-local',
      configuration: {
        friendlyName: 'Local STL Files',
        name: 'stl-local',
        stlFiles: stlFiles || [],
      },
    },
  ],

  defaultDataSource: hasSTLFiles ? 'stl-local' : undefined,

  // If we have STL files, prepare the study data
  ...(hasSTLFiles && {
    studyListFunctionsEnabled: false,
    preload: {
      studies: [
        {
          StudyInstanceUID: 'stl-study-' + Date.now(),
          StudyDate: new Date().toISOString().split('T')[0],
          StudyTime: new Date().toTimeString().split(' ')[0],
          PatientName: 'STL Models',
          PatientID: 'STL',
          series: stlFiles.map((file, index) => ({
            SeriesInstanceUID: `stl-series-${index}-${Date.now()}`,
            SeriesDescription: file.fileName,
            SeriesNumber: index + 1,
            Modality: 'STL',
            stlData: file.data,
            instances: [
              {
                SOPInstanceUID: `stl-instance-${index}-${Date.now()}`,
                SeriesInstanceUID: `stl-series-${index}-${Date.now()}`,
                StudyInstanceUID: 'stl-study-' + Date.now(),
                Modality: 'STL',
                stlData: file.data,
              },
            ],
          })),
        },
      ],
    },
  }),
};
