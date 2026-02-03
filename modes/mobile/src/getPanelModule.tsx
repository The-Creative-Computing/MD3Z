import React from 'react';
import { MobileViewerLayout } from './MobileViewerLayout';

function MobileOverlayPanel({ servicesManager, commandsManager }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <MobileViewerLayout
        servicesManager={servicesManager}
        commandsManager={commandsManager}
      />
    </div>
  );
}

export default function getPanelModule() {
  return [
    {
      name: 'mobile-overlay',
      iconName: 'info',
      iconLabel: 'Mobile UI',
      label: 'Mobile UI',
      component: MobileOverlayPanel,
    },
  ];
}
