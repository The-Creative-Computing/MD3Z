/**
 * Data Sources Module for STL files
 * Provides a data source that can load STL files from various sources
 */

function createSTLDataSource(configuration) {
  // Try to load STL files from sessionStorage
  let stlFiles = configuration.stlFiles || [];
  
  const pendingSTLFiles = sessionStorage.getItem('pendingSTLFiles');
  if (pendingSTLFiles) {
    try {
      stlFiles = JSON.parse(pendingSTLFiles);
      console.log('Loaded', stlFiles.length, 'STL files from sessionStorage');
      // Keep in sessionStorage for now, will clear after loading
    } catch (error) {
      console.error('Error loading STL files from sessionStorage:', error);
    }
  }

  return {
    initialize: async () => {
      console.log('STL Data Source initialized with', stlFiles.length, 'files');
    },

    query: {
      studies: {
        mapParams: () => {},
        search: async params => {
          // Create a study containing all STL files as series
          if (stlFiles.length === 0) {
            return [];
          }

          const studyInstanceUID = `stl-study-${Date.now()}`;

          const study = {
            studyInstanceUid: studyInstanceUID,
            StudyInstanceUID: studyInstanceUID,
            StudyDate: new Date().toISOString().split('T')[0],
            StudyTime: new Date().toTimeString().split(' ')[0],
            PatientName: 'STL Models',
            PatientID: 'STL',
            AccessionNumber: '',
            StudyDescription: 'STL 3D Models',
            Modality: 'STL',
            ModalitiesInStudy: 'STL',
            NumInstances: stlFiles.length,
          };

          return [study];
        },
      },
      series: {
        search: async params => {
          const { studyInstanceUid } = params;

          if (!studyInstanceUid || !studyInstanceUid.startsWith('stl-study')) {
            return [];
          }

          // Return all STL files as series
          return stlFiles.map((file, index) => ({
            SeriesInstanceUID: `stl-series-${index}-${Date.now()}`,
            StudyInstanceUID: studyInstanceUid,
            SeriesNumber: index + 1,
            SeriesDescription: file.fileName,
            Modality: 'STL',
            SeriesDate: new Date().toISOString().split('T')[0],
            SeriesTime: new Date().toTimeString().split(' ')[0],
            NumInstances: 1,
            instances: [
              {
                SOPInstanceUID: `stl-instance-${index}-${Date.now()}`,
                SeriesInstanceUID: `stl-series-${index}-${Date.now()}`,
                StudyInstanceUID: studyInstanceUid,
                Modality: 'STL',
                isSTL: true,
                stlData: base64ToArrayBuffer(file.data),
                metadata: {
                  SOPInstanceUID: `stl-instance-${index}-${Date.now()}`,
                  SeriesInstanceUID: `stl-series-${index}-${Date.now()}`,
                  StudyInstanceUID: studyInstanceUid,
                  Modality: 'STL',
                  SeriesDescription: file.fileName,
                  SeriesNumber: index + 1,
                },
              },
            ],
          }));
        },
      },
      instances: {
        search: params => {
          // Return instances for a specific series
          const { studyInstanceUid, seriesInstanceUid } = params;

          if (!seriesInstanceUid || !seriesInstanceUid.startsWith('stl-series')) {
            return [];
          }

          // Extract series index from UID
          const match = seriesInstanceUid.match(/stl-series-(\d+)/);
          if (!match) {
            return [];
          }

          const index = parseInt(match[1], 10);
          const file = stlFiles[index];

          if (!file) {
            return [];
          }

          return [
            {
              SOPInstanceUID: `stl-instance-${index}-${Date.now()}`,
              SeriesInstanceUID: seriesInstanceUid,
              StudyInstanceUID: studyInstanceUid,
              Modality: 'STL',
              isSTL: true,
              stlData: base64ToArrayBuffer(file.data),
              metadata: {
                SOPInstanceUID: `stl-instance-${index}-${Date.now()}`,
                SeriesInstanceUID: seriesInstanceUid,
                StudyInstanceUID: studyInstanceUid,
                Modality: 'STL',
                SeriesDescription: file.fileName,
                SeriesNumber: index + 1,
              },
            },
          ];
        },
      },
    },

    retrieve: {
      directURL: params => {
        // STL files are loaded directly from data
        return null;
      },
    },

    store: {
      dicom: async () => {
        throw new Error('STL files cannot be stored as DICOM');
      },
    },

    reject: {
      series: async () => {
        throw new Error('Reject not supported for STL files');
      },
    },

    getImageIdsForDisplaySet: displaySet => {
      // Return a synthetic image ID for STL
      return [`stl:${displaySet.SeriesInstanceUID}`];
    },

    getImageIdsForInstance: instance => {
      return [`stl:${instance.SOPInstanceUID}`];
    },

    getName: () => 'STL Local',

    getConfig: () => configuration,
  };
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function getDataSourcesModule() {
  return [
    {
      name: 'stl',
      type: 'webApi',
      createDataSource: createSTLDataSource,
    },
  ];
}
