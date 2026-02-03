import React, { useState, useEffect } from 'react';
import { useAppConfig } from '@ohif/ui';
import {
  MobileHeader,
  SeriesButton,
  NavigationArrows,
  ImageSlider,
  SeriesPanel,
} from './components';
import './mobile-viewer.css';

const MobileViewportWrapper = ({ children, servicesManager }) => {
  const [seriesPanelOpen, setSeriesPanelOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string>('WindowLevel');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(1);
  const [availableSeries, setAvailableSeries] = useState<any[]>([]);
  const [currentSeriesUID, setCurrentSeriesUID] = useState<string>('');

  // Get services
  const { cornerstoneViewportService, displaySetService, commandsManager } =
    servicesManager?.services || {};

  useEffect(() => {
    if (!displaySetService) return;

    // Get all available display sets (series)
    const displaySets = displaySetService.getActiveDisplaySets();
    setAvailableSeries(displaySets);

    // Subscribe to viewport changes to update image index
    const updateViewportInfo = () => {
      try {
        const viewports = cornerstoneViewportService?.getViewports();
        if (viewports && viewports.length > 0) {
          const viewport = viewports[0];
          const displaySetInstanceUIDs = viewport.displaySetInstanceUIDs;

          if (displaySetInstanceUIDs && displaySetInstanceUIDs.length > 0) {
            const displaySetUID = displaySetInstanceUIDs[0];
            setCurrentSeriesUID(displaySetUID);

            const ds = displaySetService.getDisplaySetByUID(displaySetUID);
            if (ds) {
              setTotalImages(ds.numImageFrames || 1);
              // Get current image index from viewport
              const imageIndex = viewport.getCurrentImageIdIndex?.() || 0;
              setCurrentImageIndex(imageIndex);
            }
          }
        }
      } catch (error) {
        console.error('Error updating viewport info:', error);
      }
    };

    updateViewportInfo();

    // Subscribe to viewport changes
    const unsubscribe = cornerstoneViewportService?.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      updateViewportInfo
    );

    return () => {
      unsubscribe?.();
    };
  }, [cornerstoneViewportService, displaySetService]);

  const handleToolClick = (toolName: string, commandName?: string) => {
    setActiveTool(toolName);

    if (commandName && commandsManager) {
      commandsManager.runCommand(commandName, { toolName });
    }
  };

  const handleZoomClick = () => {
    handleToolClick('Zoom', 'setToolActive');
  };

  const handlePanClick = () => {
    handleToolClick('Pan', 'setToolActive');
  };

  const handleWindowLevelClick = () => {
    handleToolClick('WindowLevel', 'setToolActive');
  };

  const handleSnapshotClick = () => {
    if (commandsManager) {
      commandsManager.runCommand('showDownloadViewportModal');
    }
  };

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);

    if (cornerstoneViewportService) {
      try {
        const viewports = cornerstoneViewportService.getViewports();
        if (viewports && viewports.length > 0) {
          const viewport = viewports[0];
          viewport.setImageIdIndex?.(index);
        }
      } catch (error) {
        console.error('Error changing image:', error);
      }
    }
  };

  const handleSeriesSelect = (seriesUID: string) => {
    if (commandsManager) {
      commandsManager.runCommand('displaySets.setDisplaySetsForViewport', {
        viewportIndex: 0,
        displaySetInstanceUIDs: [seriesUID],
      });
    }
  };

  const handlePreviousSeries = () => {
    const currentIndex = availableSeries.findIndex(
      s => s.displaySetInstanceUID === currentSeriesUID
    );
    if (currentIndex > 0) {
      handleSeriesSelect(availableSeries[currentIndex - 1].displaySetInstanceUID);
    }
  };

  const handleNextSeries = () => {
    const currentIndex = availableSeries.findIndex(
      s => s.displaySetInstanceUID === currentSeriesUID
    );
    if (currentIndex < availableSeries.length - 1) {
      handleSeriesSelect(availableSeries[currentIndex + 1].displaySetInstanceUID);
    }
  };

  const currentIndex = availableSeries.findIndex(
    s => s.displaySetInstanceUID === currentSeriesUID
  );

  return (
    <div className="mobile-viewport-container relative">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-20">
        <MobileHeader
          onSeriesClick={() => setSeriesPanelOpen(true)}
          onZoomClick={handleZoomClick}
          onPanClick={handlePanClick}
          onWindowLevelClick={handleWindowLevelClick}
          onSnapshotClick={handleSnapshotClick}
          activeToolId={activeTool}
        />
      </div>

      {/* Series Button */}
      <SeriesButton onClick={() => setSeriesPanelOpen(true)} />

      {/* Navigation Arrows */}
      {availableSeries.length > 1 && (
        <NavigationArrows
          onPrevious={handlePreviousSeries}
          onNext={handleNextSeries}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < availableSeries.length - 1}
        />
      )}

      {/* Main Viewport Content */}
      <div className="h-full w-full">{children}</div>

      {/* Image Slider */}
      {totalImages > 1 && (
        <ImageSlider
          currentImageIndex={currentImageIndex}
          totalImages={totalImages}
          onImageChange={handleImageChange}
        />
      )}

      {/* Series Panel */}
      <SeriesPanel
        isOpen={seriesPanelOpen}
        onClose={() => setSeriesPanelOpen(false)}
        series={availableSeries.map(ds => ({
          SeriesInstanceUID: ds.displaySetInstanceUID,
          SeriesNumber: ds.SeriesNumber || 0,
          SeriesDescription: ds.SeriesDescription || '',
          Modality: ds.Modality || 'CT',
          numImageFrames: ds.numImageFrames || 1,
          thumbnailSrc: ds.thumbnailSrc,
        }))}
        currentSeriesUID={currentSeriesUID}
        onSeriesSelect={handleSeriesSelect}
      />
    </div>
  );
};

export default MobileViewportWrapper;
