import React from 'react';
import { Icons } from '@ohif/ui-next';

interface MobileHeaderProps {
  onSeriesClick: () => void;
  onZoomClick: () => void;
  onPanClick: () => void;
  onWindowLevelClick: () => void;
  onSnapshotClick: () => void;
  activeToolId?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onSeriesClick,
  onZoomClick,
  onPanClick,
  onWindowLevelClick,
  onSnapshotClick,
  activeToolId,
}) => {
  const toolButtonClass = (toolId: string) =>
    `flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
      activeToolId === toolId
        ? 'bg-primary-main text-white'
        : 'bg-primary-dark text-primary-light hover:bg-primary-main/20'
    }`;

  return (
    <div className="bg-primary-dark flex items-center justify-between px-4 py-3">
      {/* Left Side - Back button and Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex h-10 w-10 items-center justify-center"
        >
          <Icons.ChevronLeft className="text-primary-active h-6 w-6" />
        </button>
        <h1 className="text-primary-active text-2xl font-bold">M3DZ</h1>
      </div>

      {/* Right Side - Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Zoom Button */}
        <button
          onClick={onZoomClick}
          className={toolButtonClass('Zoom')}
          aria-label="Zoom"
        >
          <Icons.ToolZoom className="h-5 w-5" />
        </button>

        {/* Pan Button */}
        <button
          onClick={onPanClick}
          className={toolButtonClass('Pan')}
          aria-label="Pan"
        >
          <Icons.ToolMove className="h-5 w-5" />
        </button>

        {/* Window Level Button */}
        <button
          onClick={onWindowLevelClick}
          className={toolButtonClass('WindowLevel')}
          aria-label="Window Level"
        >
          <Icons.ToolWindowLevel className="h-5 w-5" />
        </button>

        {/* Snapshot Button */}
        <button
          onClick={onSnapshotClick}
          className="bg-primary-active flex h-12 w-12 items-center justify-center rounded-lg hover:bg-primary-active/80"
          aria-label="Take Snapshot"
        >
          <Icons.ToolCapture className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
};
