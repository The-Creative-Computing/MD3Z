import React from 'react';
import MobileViewportWrapper from './MobileViewportWrapper';

const Component = ({ children, ...props }) => {
  return <MobileViewportWrapper {...props}>{children}</MobileViewportWrapper>;
};

export default function getViewportModule() {
  return [
    {
      name: 'mobile-viewport-wrapper',
      component: Component,
    },
  ];
}
