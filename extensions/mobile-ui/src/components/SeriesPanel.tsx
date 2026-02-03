import React from 'react';
import { Icons } from '@ohif/ui-next';

interface Series {
  SeriesInstanceUID: string;
  SeriesNumber: number;
  SeriesDescription: string;
  Modality: string;
  numImageFrames: number;
  thumbnailSrc?: string;
}

interface SeriesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series[];
  currentSeriesUID: string;
  onSeriesSelect: (seriesUID: string) => void;
}

export const SeriesPanel: React.FC<SeriesPanelProps> = ({
  isOpen,
  onClose,
  series,
  currentSeriesUID,
  onSeriesSelect,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="bg-primary-dark fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="border-primary-main sticky top-0 flex items-center justify-between border-b bg-black/50 px-4 py-4 backdrop-blur-sm">
          <h2 className="text-primary-light text-lg font-semibold">Series</h2>
          <button
            onClick={onClose}
            className="text-primary-light hover:text-primary-active flex h-8 w-8 items-center justify-center rounded transition-colors"
            aria-label="Close"
          >
            <Icons.Close className="h-5 w-5" />
          </button>
        </div>

        {/* Series Grid */}
        <div className="grid grid-cols-2 gap-3 p-4">
          {series.map(s => {
            const isActive = s.SeriesInstanceUID === currentSeriesUID;
            return (
              <button
                key={s.SeriesInstanceUID}
                onClick={() => {
                  onSeriesSelect(s.SeriesInstanceUID);
                  onClose();
                }}
                className={`group relative overflow-hidden rounded-lg transition-all ${
                  isActive
                    ? 'ring-primary-active ring-2 ring-offset-2 ring-offset-black'
                    : 'hover:ring-primary-light/50 hover:ring-2'
                }`}
              >
                {/* Thumbnail */}
                <div className="bg-primary-main aspect-square w-full">
                  {s.thumbnailSrc ? (
                    <img
                      src={s.thumbnailSrc}
                      alt={s.SeriesDescription}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icons.Series className="text-primary-light h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <div className="flex items-center gap-1">
                    <span className="bg-primary-main rounded px-1.5 py-0.5 text-xs font-bold text-white">
                      {s.Modality}
                    </span>
                    <span className="text-primary-light text-xs">
                      {s.SeriesDescription || 'Multiplanar'}
                    </span>
                  </div>
                  <div className="text-primary-light mt-1 flex items-center gap-1 text-xs">
                    <span>S:{s.SeriesNumber}</span>
                    <span>•</span>
                    <span>⚡ {s.numImageFrames}</span>
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="bg-primary-active absolute right-2 top-2 rounded-full p-1">
                    <Icons.Checked className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
