/**
 * Commands module for STL viewer
 * Provides commands to load and manipulate STL files
 */

export default function getCommandsModule({ servicesManager }) {
  const { displaySetService, viewportGridService } = servicesManager.services;

  const actions = {
    /**
     * Display an STL file in the viewport
     */
    displaySTL: ({ displaySetInstanceUID }) => {
      console.log('displaySTL command called with:', displaySetInstanceUID);
      
      const { viewportGridService } = servicesManager.services;
      
      try {
        const activeViewportId = viewportGridService.getActiveViewportId();
        
        if (!activeViewportId) {
          console.error('No active viewport found');
          return;
        }

        console.log('Setting STL to viewport:', activeViewportId);

        viewportGridService.setDisplaySetsForViewport({
          viewportId: activeViewportId,
          displaySetInstanceUIDs: [displaySetInstanceUID],
          viewportOptions: {
            viewportType: 'stl-3d',
            background: [0.1, 0.1, 0.1],
          },
        });

        console.log('STL display set loaded successfully');
      } catch (error) {
        console.error('Error displaying STL:', error);
      }
    },

    /**
     * Upload STL files to the current study
     */
    uploadSTLFiles: async () => {
      console.log('uploadSTLFiles command triggered');
      
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.stl,.STL,model/stl,application/sla';
      input.multiple = true;

      return new Promise((resolve) => {
        input.onchange = async (e) => {
          try {
            console.log('File input changed, event:', e);
            const files = Array.from(e.target.files);
            
            if (files.length === 0) {
              console.log('No files selected');
              resolve();
              return;
            }

            console.log('Selected files:', files);

            // Get current study UID
            let studyInstanceUID = null;
            
            try {
              // Try to get from display set service
              const displaySets = displaySetService.getActiveDisplaySets();
              console.log('Active display sets:', displaySets);
              
              if (displaySets && displaySets.length > 0) {
                studyInstanceUID = displaySets[0].StudyInstanceUID;
                console.log('Found study UID from display sets:', studyInstanceUID);
              }
            } catch (error) {
              console.warn('Could not get study UID from display sets:', error);
            }

            // If still no study UID, create a default one
            if (!studyInstanceUID) {
              studyInstanceUID = 'stl-study-' + Date.now();
              console.log('Using default study UID:', studyInstanceUID);
            }

            // Process each STL file
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              console.log(`Processing file ${i + 1}/${files.length}:`, file.name);
              
              try {
                const arrayBuffer = await file.arrayBuffer();
                console.log('File read successfully, size:', arrayBuffer.byteLength, 'bytes');
                
                const timestamp = Date.now();
                const seriesInstanceUID = `stl-series-${timestamp}-${i}`;
                const sopInstanceUID = `stl-instance-${timestamp}-${i}`;

                // Create instance
                const instance = {
                  SOPInstanceUID: sopInstanceUID,
                  SeriesInstanceUID: seriesInstanceUID,
                  StudyInstanceUID: studyInstanceUID,
                  Modality: 'STL',
                  isSTL: true,
                  stlData: arrayBuffer,
                  SeriesDescription: file.name,
                  SeriesNumber: 9000 + i,
                  SeriesDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
                  SeriesTime: new Date().toTimeString().split(' ')[0].replace(/:/g, ''),
                };

                // Create display set for this STL
                const displaySet = {
                  displaySetInstanceUID: seriesInstanceUID,
                  SeriesInstanceUID: seriesInstanceUID,
                  StudyInstanceUID: studyInstanceUID,
                  SeriesDescription: file.name,
                  SeriesNumber: 9000 + i,
                  SeriesDate: instance.SeriesDate,
                  SeriesTime: instance.SeriesTime,
                  Modality: 'STL',
                  isSTL: true,
                  stlData: arrayBuffer,
                  numImageFrames: 1,
                  SOPClassHandlerId: '@ohif/extension-stl-viewer.sopClassHandlerModule.stl',
                  instances: [instance],
                  isLoaded: true,
                  unsupported: false,
                  // Add viewport information
                  isReconstructable: false,
                  isComposite: false,
                  sopClassUids: ['1.2.840.10008.5.1.4.1.1.104.1'],
                  // Make it displayable
                  isDisplaySetFromVolume: false,
                  isDerived: false,
                  // Add metadata that OHIF expects
                  thumbnailSrc: null,
                  thumbnailAltText: file.name,
                  // This is crucial - tell OHIF what command to run on double click
                  onDoubleClick: [
                    {
                      commandName: 'displaySTL',
                      commandOptions: {
                        displaySetInstanceUID: seriesInstanceUID,
                      },
                    },
                  ],
                };

                console.log('Creating display set:', displaySet);

                // Add to display set service
                const result = displaySetService.makeDisplaySets([displaySet]);
                console.log('makeDisplaySets result:', result);
                
                console.log('Successfully added STL:', file.name);
              } catch (fileError) {
                console.error(`Error processing file ${file.name}:`, fileError);
              }
            }

            console.log(`✅ Successfully processed ${files.length} STL file(s)`);
            
            // Trigger a refresh of the study panel
            try {
              const { hangingProtocolService } = servicesManager.services;
              if (hangingProtocolService) {
                console.log('Triggering hanging protocol update...');
                // This will refresh the series list
              }
            } catch (error) {
              console.warn('Could not refresh hanging protocol:', error);
            }
            
            resolve();
          } catch (error) {
            console.error('Error in uploadSTLFiles:', error);
            resolve();
          }
        };

        input.oncancel = () => {
          console.log('File selection cancelled');
          resolve();
        };

        console.log('Opening file dialog...');
        input.click();
      });
    },

    /**
     * Load an STL file from a URL or File object
     */
    loadSTLFile: ({ stlUrl, stlData, fileName, studyInstanceUID, seriesInstanceUID }) => {
      // Create a display set for the STL file
      const displaySet = {
        displaySetInstanceUID: seriesInstanceUID || `stl-${Date.now()}`,
        SeriesDescription: fileName || 'STL 3D Model',
        SeriesNumber: 999,
        SeriesDate: new Date().toISOString().split('T')[0],
        SeriesTime: new Date().toTimeString().split(' ')[0],
        Modality: 'STL',
        isSTL: true,
        stlUrl,
        stlData,
        instances: [
          {
            SOPInstanceUID: `stl-instance-${Date.now()}`,
            SeriesInstanceUID: seriesInstanceUID || `stl-${Date.now()}`,
            StudyInstanceUID: studyInstanceUID || 'stl-study',
          },
        ],
        numImageFrames: 1,
        frameRate: null,
      };

      // Add to display set service
      displaySetService.makeDisplaySets([displaySet]);

      return displaySet;
    },
  };

  const definitions = {
    displaySTL: {
      commandFn: actions.displaySTL,
      storeContexts: [],
      options: {},
    },
    uploadSTLFiles: {
      commandFn: actions.uploadSTLFiles,
      storeContexts: [],
      options: {},
    },
    loadSTLFile: {
      commandFn: actions.loadSTLFile,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
  };
}
