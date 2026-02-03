/**
 * STL Viewer Extension
 * Provides 3D visualization of STL mesh files
 */

import { id } from './id';
import getViewportModule from './getViewportModule';
import getCommandsModule from './getCommandsModule';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import getDataSourcesModule from './getDataSourcesModule';
import getToolbarModule from './getToolbarModule';
import getPanelModule from './getPanelModule';

export default {
  id,

  /**
   * Viewport module provides the 3D STL viewport component
   */
  getViewportModule,

  /**
   * Commands module provides commands to load and manipulate STL files
   */
  getCommandsModule,

  /**
   * SOP Class Handler to treat STL files as a displayable modality
   */
  getSopClassHandlerModule,

  /**
   * Data sources module for loading STL files
   */
  getDataSourcesModule,

  /**
   * Toolbar module for uploading STL files
   */
  getToolbarModule,

  /**
   * Panel module for STL viewer
   */
  getPanelModule,
};
