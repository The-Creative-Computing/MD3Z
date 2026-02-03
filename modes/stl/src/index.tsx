/**
 * STL Mode
 * Mode for viewing 3D STL models
 */

import { hotkeys } from '@ohif/core';
import toolbarButtons from './toolbarButtons';
import { id } from './id';
import initToolGroups from './initToolGroups';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocol: '@ohif/extension-stl-viewer.hangingProtocolModule.stl-viewer',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
};

const stl = {
  viewport: '@ohif/extension-stl-viewer.viewportModule.stl-3d',
};

const Mode = {
  id,
  routeName: 'stl',
  displayName: 'STL 3D Viewer',
  
  onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
    const { measurementService, toolbarService, toolGroupService, customizationService } =
      servicesManager.services;

    // Initialize tool groups
    initToolGroups(extensionManager, toolGroupService, commandsManager);

    // Set up toolbar
    toolbarService.init(extensionManager);
    toolbarService.addButtons(toolbarButtons);

    // Create primary toolbar sections
    toolbarService.createButtonSection('primary', [
      'MeasurementTools',
      'Zoom',
      'WindowLevel',
      'Pan',
      'Capture',
      'Layout',
      'MPR',
      'Crosshairs',
      'MoreTools',
    ]);

    // Customize for STL viewing
    customizationService.setModeCustomization({
      id: 'stl-customization',
      studyBrowser: {
        enabled: true,
        collapsed: false,
      },
    });
  },

  onModeExit: ({ servicesManager }) => {
    const { toolGroupService, measurementService, toolbarService } = servicesManager.services;

    toolbarService.reset();
    measurementService.clearMeasurements();
    toolGroupService.destroy();
  },

  validationTags: {
    study: [],
    series: [],
  },

  isValidMode: ({ modalities }) => {
    // Accept any modality for STL mode
    return true;
  },

  routes: [
    {
      path: 'stl',
      layoutTemplate: () => {
        return {
          id: ohif.layout,
          props: {
            leftPanels: [ohif.leftPanel],
            rightPanels: [],
            viewports: [
              {
                namespace: stl.viewport,
                displaySetsToDisplay: [ohif.sopClassHandler],
              },
            ],
          },
        };
      },
    },
  ],

  extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/extension-stl-viewer',
  ],

  hangingProtocols: ['@ohif/extension-stl-viewer.hangingProtocolModule.stl-viewer'],

  sopClassHandlers: ['@ohif/extension-stl-viewer.sopClassHandlerModule.stl'],

  hotkeys: [...hotkeys.defaults.hotkeyBindings],
};

export default Mode;
