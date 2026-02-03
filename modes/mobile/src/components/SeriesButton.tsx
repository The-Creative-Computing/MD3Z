import React from 'react';
import { Icons } from '@ohif/ui-next';

interface SeriesButtonProps {
  onClick: () => void;
}

export const SeriesButton: React.FC<SeriesButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-primary-dark absolute left-4 top-20 z-10 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-primary-light/30 transition-all hover:border-primary-active hover:bg-primary-main/20"
      aria-label="Show series thumbnails"
    >
      <Icons.Series className="text-primary-active h-8 w-8" />
    </button>
  );
};
