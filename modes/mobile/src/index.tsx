import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToolbarService, utils } from '@ohif/core';
import { id } from './id';
import { MobileViewerLayout } from './MobileViewerLayout';

const { TOOLBAR_SECTIONS } = ToolbarService;
const { structuredCloneWithFunctions } = utils;

let mobileUIRoot = null;

/**
 * MOBILE MODE - Modo simplificado para dispositivos móviles
 *
 * Características:
 * - Solo visualización de imágenes (sin herramientas de medición/anotación)
 * - Layout fijo 1x1 (una sola vista)
 * - Sin paneles laterales
 * - Controles mínimos: Zoom, Pan, WindowLevel
 * - Sin overlays complejos
 */

export const NON_IMAGE_MODALITIES = ['ECG', 'SEG', 'RTSTRUCT', 'RTPLAN', 'PR', 'SR'];

export const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocol: '@ohif/extension-default.hangingProtocolModule.default',
  wsiSopClassHandler:
    '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
};

export const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

export const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

export const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

export const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
};

export const sopClassHandlers = [
  dicomvideo.sopClassHandler,
  ohif.sopClassHandler,
  ohif.wsiSopClassHandler,
  dicompdf.sopClassHandler,
];

export function isValidMode({ modalities }) {
  const modalities_list = modalities.split('\\');

  return {
    valid: !!modalities_list.find(modality => NON_IMAGE_MODALITIES.indexOf(modality) === -1),
    description: `Mobile mode: simplified viewer for touch devices`,
  };
}

export function onModeEnter({
  servicesManager,
  extensionManager,
  commandsManager,
  panelService,
}: withAppTypes) {
  const { customizationService } = servicesManager.services;

  // Deshabilitar paneles laterales para vista móvil simplificada
  customizationService.setCustomizations({
    'leftPanel.hidePanel': { $set: true },
    'rightPanel.hidePanel': { $set: true },
    'panelSegmentation.disableEditing': { $set: true },
  });

  // Renderizar el UI móvil como overlay
  setTimeout(() => {
    try {
      // Crear contenedor para el UI móvil
      let container = document.getElementById('mobile-ui-overlay');
      if (!container) {
        container = document.createElement('div');
        container.id = 'mobile-ui-overlay';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.right = '0';
        container.style.bottom = '0';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
      }

      // Renderizar el componente React
      if (!mobileUIRoot) {
        mobileUIRoot = ReactDOM.createRoot(container);
      }

      mobileUIRoot.render(
        React.createElement(MobileViewerLayout, {
          servicesManager,
          commandsManager,
        })
      );
    } catch (error) {
      console.error('Error rendering mobile UI:', error);
    }
  }, 100);
}

export function onModeExit({ servicesManager }: withAppTypes) {
  const { toolGroupService, syncGroupService, cornerstoneViewportService } = servicesManager.services;

  // Limpiar el UI móvil
  if (mobileUIRoot) {
    mobileUIRoot.unmount();
    mobileUIRoot = null;
  }

  const container = document.getElementById('mobile-ui-overlay');
  if (container) {
    container.remove();
  }

  toolGroupService.destroy();
  syncGroupService.destroy();
  cornerstoneViewportService.destroy();
}

// Toolbar simplificada para móviles - sin toolbar principal
export const toolbarSections = {
  [TOOLBAR_SECTIONS.primary]: [],

  // Sin viewport actions en móviles para simplicidad
  [TOOLBAR_SECTIONS.viewportActionMenu.topRight]: [],
  [TOOLBAR_SECTIONS.viewportActionMenu.bottomLeft]: [],
  [TOOLBAR_SECTIONS.viewportActionMenu.topLeft]: [],
  [TOOLBAR_SECTIONS.viewportActionMenu.bottomMiddle]: [],
};

// Toolbar buttons mínimos - usar IDs de botones existentes de las extensiones
export const toolbarButtons = [];

// Layout móvil - solo 1 viewport, sin paneles laterales
export const mobileLayout = {
  id: ohif.layout,
  props: {
    leftPanels: [], // Sin panel de thumbnails
    leftPanelResizable: false,
    leftPanelDefaultClosed: true,
    rightPanels: [], // Sin paneles laterales
    rightPanelClosed: true,
    rightPanelResizable: false,
    viewports: [
      {
        namespace: cornerstone.viewport,
        displaySetsToDisplay: [
          ohif.sopClassHandler,
          dicomvideo.sopClassHandler,
          ohif.wsiSopClassHandler,
        ],
      },
      {
        namespace: dicompdf.viewport,
        displaySetsToDisplay: [dicompdf.sopClassHandler],
      },
    ],
  },
};

export function layoutTemplate() {
  return structuredCloneWithFunctions(this.layoutInstance);
}

export const mobileRoute = {
  path: 'mobile',
  layoutTemplate,
  layoutInstance: mobileLayout,
};

export const modeInstance = {
  id,
  routeName: 'mobile',
  hide: false,
  displayName: 'Mobile Viewer',
  toolbarSections,
  toolbarButtons,

  /**
   * Lifecycle hooks
   */
  onModeEnter,
  onModeExit,

  validationTags: {
    study: [],
    series: [],
  },

  isValidMode,
  routes: [mobileRoute],
  extensions: extensionDependencies,
  hangingProtocol: 'default',
  sopClassHandlers,
  nonModeModalities: NON_IMAGE_MODALITIES,
};

/**
 * Factory para crear instancias del modo
 */
export function modeFactory({ modeConfiguration }) {
  let instance = this.modeInstance;
  if (modeConfiguration) {
    // Permitir personalización del modo
    instance = { ...instance, ...modeConfiguration };
  }
  return instance;
}

export const mode = {
  id,
  modeFactory,
  modeInstance,
  extensionDependencies,
};

export default mode;
