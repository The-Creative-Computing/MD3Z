/** @type {AppTypes.Config} */

/**
 * POC DICOM Viewer Configuration
 * 
 * This configuration enables:
 * - Local DICOM file upload (drag & drop)
 * - Remote DICOM files via URLs (DICOMweb and DICOM JSON)
 * - MPR (Multiplanar Reconstruction) view for volumetric data
 * 
 * Usage:
 * - Start server with: APP_CONFIG=config/poc-dicom.js yarn dev
 * - Or access via: http://localhost:3000?configUrl=config/poc-dicom.js
 */

// Detectar si estamos en producción o desarrollo local
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isDevelopment = !isProduction;

// Detectar si estamos en GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');

// Base path - GitHub Pages usa /MD3Z/, desarrollo usa /
const routerBasename = isGitHubPages ? '/MD3Z/' : '/';

// URLs para archivos DICOMweb embebidos
const dicomwebBaseUrl = isDevelopment
  ? 'http://localhost:5001/dicomweb'
  : `${window.location.origin}${routerBasename}dicomweb`;

window.config = {
  name: 'M3DZ DICOM Viewer',
  routerBasename: routerBasename,
  
  // Custom branding - Replace OHIF logo with M3DZ
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
              color: '#5acce6',
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
  
  // Extensions loaded by default (empty = all available)
  extensions: [],
  
  // Modes available (empty = all available)
  modes: [],
  
  // Show study list on the home page
  showStudyList: true,
  
  // Web Worker configuration
  maxNumberOfWebWorkers: 4,
  
  // UI Configuration
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  
  // Volume viewport strict Z spacing (important for MPR)
  strictZSpacingForVolumeViewport: true,
  
  // Group enabled modes first in the UI
  groupEnabledModesFirst: true,
  
  // Error display mode: 'always', 'dev', or 'production'
  showErrorDetails: 'always',
  
  // Request limits for performance optimization
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    prefetch: 25,
  },
  
  // Enable DICOM upload component for local file drag & drop
  customizationService: {
    // Enable the Cornerstone DICOM upload component
    dicomUploadComponent:
      '@ohif/extension-cornerstone.customizationModule.cornerstoneDicomUploadComponent',
  },
  
  // Default data source - using embedded static files
  // Options: 'embedded' (static files), 'ohif-demo' (AWS), 'dicomlocal' (drag & drop)
  defaultDataSourceName: 'embedded',
  
  // Data Sources Configuration
  dataSources: [
    // ===== EMBEDDED STATIC FILES (DEFAULT) =====
    // Static DICOMweb files served from local HTTP server
    // In development: python3 -m http.server 5000 (in platform/app/public)
    // In production: files are in /dicomweb/ directory
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'embedded',
      configuration: {
        friendlyName: 'Embedded DICOM Files',
        name: 'embedded',
        wadoUriRoot: dicomwebBaseUrl,
        qidoRoot: dicomwebBaseUrl,
        wadoRoot: dicomwebBaseUrl,
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video',
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
        omitQuotationForMultipartRequest: true,
      },
    },
    
    // ===== LOCAL FILE UPLOAD =====
    // Enables drag & drop of DICOM files from local file system
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'Local DICOM Files',
      },
    },
    
    // ===== DICOM JSON =====
    // For loading DICOM studies defined in JSON files
    // Usage: ?StudyInstanceUIDs=...&dicomjsonurl=URL_TO_JSON
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'DICOM JSON',
        name: 'json',
      },
    },
    
    // ===== DICOMWEB PROXY =====
    // Allows loading from any DICOMweb server via URL parameter
    // Usage: ?StudyInstanceUIDs=...&dicomwebproxy=URL_TO_DICOMWEB_SERVER
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomwebproxy',
      sourceName: 'dicomwebproxy',
      configuration: {
        friendlyName: 'DICOMweb Proxy',
        name: 'dicomwebproxy',
      },
    },
    
    // ===== AWS S3 OHIF Demo Server =====
    // Public demo server with sample studies for testing
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'ohif-demo',
      configuration: {
        friendlyName: 'OHIF Demo Server (AWS)',
        name: 'aws',
        wadoUriRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        qidoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        wadoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video',
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
        omitQuotationForMultipartRequest: true,
      },
    },
    
    // ===== LOCAL DICOMWEB SERVER =====
    // For development with a local DICOMweb server (e.g., Orthanc, DCM4CHEE)
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'local-orthanc',
      configuration: {
        friendlyName: 'Local Orthanc Server',
        name: 'orthanc',
        wadoUriRoot: 'http://localhost:8042/dicom-web',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: true,
        supportsReject: false,
        dicomUploadEnabled: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
  
  // HTTP Error handler
  httpErrorHandler: error => {
    console.warn('HTTP Error:', error.status, error.message);
  },
  
  // Hotkeys configuration
  hotkeys: [
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['right'],
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Viewport',
      keys: ['left'],
    },
    {
      commandName: 'rotateViewportCW',
      label: 'Rotate Clockwise',
      keys: ['r'],
    },
    {
      commandName: 'rotateViewportCCW',
      label: 'Rotate Counter-clockwise',
      keys: ['e'],
    },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Horizontal',
      keys: ['h'],
    },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Vertical',
      keys: ['v'],
    },
    {
      commandName: 'toggleCine',
      label: 'Toggle Cine',
      keys: ['space'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Zoom' },
      label: 'Zoom',
      keys: ['z'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Pan' },
      label: 'Pan',
      keys: ['p'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'WindowLevel' },
      label: 'Window Level',
      keys: ['w'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Length' },
      label: 'Length',
      keys: ['l'],
    },
    {
      commandName: 'resetViewport',
      label: 'Reset Viewport',
      keys: ['escape'],
    },
  ],
};
