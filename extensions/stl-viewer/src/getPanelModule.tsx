import React from 'react';
import STLViewerPanel from './STLViewerPanel';

/**
 * Panel module for STL viewer
 * Provides a standalone 3D STL viewer panel
 */

export default function getPanelModule({ servicesManager, commandsManager }) {
  console.log('🎨 STL Panel Module being registered');
  
  return [
    {
      name: 'stl-viewer-panel',
      iconName: 'tool-3d-rotate',
      iconLabel: 'STL',
      label: 'STL 3D',
      component: STLViewerPanel,
    },
  ];
}
