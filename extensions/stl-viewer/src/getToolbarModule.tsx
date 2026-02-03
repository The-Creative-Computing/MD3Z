/**
 * Toolbar module for STL viewer
 * Provides a button to upload STL files into the current study
 */

export default function getToolbarModule({ servicesManager, commandsManager }) {
  return [
    {
      name: 'upload-stl',
      defaultComponent: null,
    },
  ];
}
