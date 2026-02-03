/**
 * SOP Class Handler for STL files
 * Treats STL files as a displayable modality
 */

const SOPClassHandlerId = '@ohif/extension-stl-viewer.sopClassHandlerModule.stl';

function _getDisplaySetsFromSeries(instances, servicesManager, extensionManager) {
  // Filter for STL instances
  const stlInstances = instances.filter(instance => {
    return instance.Modality === 'STL' || instance.isSTL;
  });

  if (!stlInstances.length) {
    return [];
  }

  // Group by SeriesInstanceUID
  const seriesMap = new Map();

  stlInstances.forEach(instance => {
    const seriesUID = instance.SeriesInstanceUID;
    if (!seriesMap.has(seriesUID)) {
      seriesMap.set(seriesUID, []);
    }
    seriesMap.get(seriesUID).push(instance);
  });

  // Create display sets
  const displaySets = [];

  seriesMap.forEach((seriesInstances, seriesUID) => {
    const firstInstance = seriesInstances[0];

    displaySets.push({
      displaySetInstanceUID: seriesUID,
      SeriesDescription: firstInstance.SeriesDescription || 'STL 3D Model',
      SeriesNumber: firstInstance.SeriesNumber || 999,
      SeriesDate: firstInstance.SeriesDate || new Date().toISOString().split('T')[0],
      SeriesTime: firstInstance.SeriesTime || new Date().toTimeString().split(' ')[0],
      SOPClassHandlerId,
      SeriesInstanceUID: seriesUID,
      StudyInstanceUID: firstInstance.StudyInstanceUID,
      Modality: 'STL',
      isSTL: true,
      stlUrl: firstInstance.stlUrl,
      stlData: firstInstance.stlData,
      instances: seriesInstances,
      numImageFrames: 1,
      frameRate: null,
    });
  });

  return displaySets;
}

function getSopClassHandlerModule({ servicesManager, commandsManager }) {
  return [
    {
      name: 'stl',
      sopClassUids: [],
      getDisplaySetsFromSeries: instances => {
        return _getDisplaySetsFromSeries(instances, servicesManager, null);
      },
      // Add viewport getter
      getDisplaySetOptions: (displaySet) => {
        return {
          voi: {
            windowWidth: 400,
            windowCenter: 40,
          },
          voiInverted: false,
        };
      },
      // Specify what to do on double click
      onDoubleClick: ({ displaySetInstanceUID }) => {
        console.log('STL onDoubleClick triggered for:', displaySetInstanceUID);
        
        if (commandsManager) {
          commandsManager.runCommand('displaySTL', {
            displaySetInstanceUID,
          });
        }
      },
    },
  ];
}

export default getSopClassHandlerModule;
