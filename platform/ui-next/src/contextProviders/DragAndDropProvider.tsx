import React from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Detectar dispositivo táctil
const isTouchDevice =
  typeof window !== `undefined` &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

/**
 * DragAndDropProvider con soporte para dispositivos táctiles y desktop
 * Usa HTML5Backend por defecto (compatible con ambos)
 */
function DragAndDropProvider({ children }) {
  // Por ahora usar HTML5Backend que funciona en ambos
  // TouchBackend se puede añadir más adelante si se necesita
  const backend = HTML5Backend;
  const opts = {};

  console.log('Device type:', isTouchDevice ? 'Touch Device' : 'Desktop');

  return (
    <DndProvider
      backend={backend}
      options={opts}
    >
      {children}
    </DndProvider>
  );
}

DragAndDropProvider.propTypes = {
  children: PropTypes.any,
};

export default DragAndDropProvider;
