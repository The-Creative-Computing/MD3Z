import React from 'react';
import STLViewport from './STLViewport';

/**
 * Viewport module that provides the STL 3D viewer component
 */
export default function getViewportModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'stl-3d',
      component: props => <STLViewport {...props} servicesManager={servicesManager} />,
    },
  ];
}
