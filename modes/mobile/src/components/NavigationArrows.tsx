import React from 'react';
import { Icons } from '@ohif/ui-next';

interface NavigationArrowsProps {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const NavigationArrows: React.FC<NavigationArrowsProps> = ({
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) => {
  return (
    <>
      {/* Left Arrow */}
      {hasPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-2 top-1/2 z-10 flex h-16 w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-black/50 transition-all hover:bg-black/70 active:scale-95"
          aria-label="Previous series"
        >
          <Icons.ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Right Arrow */}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-2 top-1/2 z-10 flex h-16 w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-black/50 transition-all hover:bg-black/70 active:scale-95"
          aria-label="Next series"
        >
          <Icons.ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}
    </>
  );
};
