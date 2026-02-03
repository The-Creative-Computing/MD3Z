import React, { useState, useEffect, useCallback } from 'react';
import { Enums, utilities as csUtils } from '@cornerstonejs/core';
import {
  MobileHeader,
  SeriesButton,
  ImageSliderSimple,
  SeriesPanel,
} from './components';
import './mobile-viewer.css';

export const MobileViewerLayout = ({ servicesManager, commandsManager }) => {
  const [seriesPanelOpen, setSeriesPanelOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('WindowLevel');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(1);
  const [availableSeries, setAvailableSeries] = useState([]);
  const [currentSeriesUID, setCurrentSeriesUID] = useState('');
  const [activeViewportId, setActiveViewportId] = useState(null);
  const [viewportElement, setViewportElement] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const {
    cornerstoneViewportService,
    displaySetService,
    hangingProtocolService,
    viewportGridService,
    cineService,
  } = servicesManager?.services || {};

  // Update image info function
  const forceUpdateImageInfo = useCallback(() => {
    if (!cornerstoneViewportService || !activeViewportId || !displaySetService) {
      return;
    }

    const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
    if (!viewport) return;

    try {
      const imageIndex = viewport.getCurrentImageIdIndex ? viewport.getCurrentImageIdIndex() : 0;
      let numberOfSlices = 1;

      if (viewport.getNumberOfSlices) {
        numberOfSlices = viewport.getNumberOfSlices();
      }

      const displaySetUIDs = viewport.displaySetInstanceUIDs;
      if (displaySetUIDs && displaySetUIDs.length > 0) {
        const displaySetUID = displaySetUIDs[0];
        setCurrentSeriesUID(displaySetUID);

        const ds = displaySetService.getDisplaySetByUID(displaySetUID);
        if (ds) {
          numberOfSlices = ds.numImageFrames || ds.instances?.length || ds.images?.length || numberOfSlices;
        }
      }

      setCurrentImageIndex(imageIndex);
      setTotalImages(numberOfSlices);
    } catch (error) {
      console.error('Error updating image info:', error);
    }
  }, [cornerstoneViewportService, activeViewportId, displaySetService]);

  // Initialize viewport and series
  useEffect(() => {
    if (!cornerstoneViewportService || !displaySetService || !viewportGridService) {
      return;
    }

    const activeId = viewportGridService.getActiveViewportId();
    setActiveViewportId(activeId);

    const viewport = cornerstoneViewportService.getCornerstoneViewport(activeId);
    if (viewport?.element) {
      setViewportElement(viewport.element);
    }

    const displaySets = displaySetService.getActiveDisplaySets();
    setAvailableSeries(displaySets);

    // Force updates with multiple delays to ensure initialization
    setTimeout(() => forceUpdateImageInfo(), 300);
    setTimeout(() => forceUpdateImageInfo(), 800);
    setTimeout(() => forceUpdateImageInfo(), 1500);
  }, [cornerstoneViewportService, displaySetService, viewportGridService, forceUpdateImageInfo]);

  // Listen to viewport changes
  useEffect(() => {
    if (!viewportElement) {
      return;
    }

    const handleStackNewImage = () => {
      forceUpdateImageInfo();
    };

    const handleImageRendered = () => {
      forceUpdateImageInfo();
    };

    viewportElement.addEventListener(Enums.Events.STACK_NEW_IMAGE, handleStackNewImage);
    viewportElement.addEventListener(Enums.Events.IMAGE_RENDERED, handleImageRendered);

    // Force update when element is first set
    setTimeout(() => forceUpdateImageInfo(), 100);

    return () => {
      viewportElement.removeEventListener(Enums.Events.STACK_NEW_IMAGE, handleStackNewImage);
      viewportElement.removeEventListener(Enums.Events.IMAGE_RENDERED, handleImageRendered);
    };
  }, [viewportElement, forceUpdateImageInfo]);

  const handleImageChange = (index) => {
    // Get fresh viewport element every time
    if (!cornerstoneViewportService || !activeViewportId) {
      console.error('No service or viewport ID');
      return;
    }

    const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
    if (!viewport || !viewport.element) {
      console.error('No viewport or element');
      return;
    }

    if (cineService?.getState().isCineEnabled) {
      cineService.stopClip(viewport.element, { viewportId: activeViewportId });
      cineService.setCine({ id: activeViewportId, isPlaying: false });
    }

    try {
      csUtils.jumpToSlice(viewport.element, {
        imageIndex: index,
        debounceLoading: false,
      });
    } catch (error) {
      console.error('Error in jumpToSlice:', error);
    }
  };

  const handleToolClick = (toolName, commandName) => {
    setActiveTool(toolName);
    if (commandName && commandsManager) {
      commandsManager.runCommand(commandName, { toolName });
    }
  };

  const handleWindowLevelClick = () => handleToolClick('WindowLevel', 'setToolActive');

  const handleSnapshotClick = () => {
    if (commandsManager) {
      commandsManager.runCommand('showDownloadViewportModal');
    }
  };

  const handleSeriesSelect = (seriesUID) => {
    setLoadingMessage('Loading series...');

    if (!commandsManager || !hangingProtocolService || !activeViewportId) {
      setLoadingMessage('ERROR: Missing services');
      setTimeout(() => setLoadingMessage(''), 2000);
      return;
    }

    try {
      const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
        activeViewportId,
        seriesUID,
        false
      );

      commandsManager.runCommand('setDisplaySetsForViewports', {
        viewportsToUpdate: updatedViewports,
      });

      setLoadingMessage('Series loaded ✓');

      setTimeout(() => {
        forceUpdateImageInfo();
        setLoadingMessage('');
      }, 1000);
    } catch (error) {
      console.error('Error changing series:', error);
      setLoadingMessage('Trying fallback...');

      try {
        commandsManager.runCommand('setDisplaySetsForViewports', {
          viewportsToUpdate: [
            {
              viewportId: activeViewportId,
              displaySetInstanceUIDs: [seriesUID],
            },
          ],
        });

        setLoadingMessage('Series loaded (fallback) ✓');
        setTimeout(() => {
          forceUpdateImageInfo();
          setLoadingMessage('');
        }, 1000);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setLoadingMessage('ERROR: Could not load series');
        setTimeout(() => setLoadingMessage(''), 3000);
      }
    }
  };

  const currentIndex = availableSeries.findIndex(
    s => s.displaySetInstanceUID === currentSeriesUID
  );

  return (
    <div className="pointer-events-auto">
      {/* Loading message */}
      {loadingMessage && (
        <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/90 px-6 py-4 text-center text-white shadow-2xl">
          <div className="text-lg font-bold">{loadingMessage}</div>
        </div>
      )}

      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-20">
        <MobileHeader
          onSeriesClick={() => setSeriesPanelOpen(true)}
          onWindowLevelClick={handleWindowLevelClick}
          onSnapshotClick={handleSnapshotClick}
          activeToolId={activeTool}
        />
      </div>

      {/* Series Button */}
      <SeriesButton onClick={() => setSeriesPanelOpen(true)} />

      {/* Image Slider */}
      <ImageSliderSimple
        currentImageIndex={currentImageIndex}
        totalImages={Math.max(totalImages, 1)}
        onImageChange={handleImageChange}
      />

      {/* Series Panel */}
      <SeriesPanel
        isOpen={seriesPanelOpen}
        onClose={() => setSeriesPanelOpen(false)}
        series={availableSeries.map(ds => ({
          SeriesInstanceUID: ds.displaySetInstanceUID,
          SeriesNumber: ds.SeriesNumber || 0,
          SeriesDescription: ds.SeriesDescription || '',
          Modality: ds.Modality || 'CT',
          numImageFrames: ds.numImageFrames || ds.instances?.length || 1,
          thumbnailSrc: ds.thumbnailSrc,
        }))}
        currentSeriesUID={currentSeriesUID}
        onSeriesSelect={handleSeriesSelect}
      />
    </div>
  );
};
