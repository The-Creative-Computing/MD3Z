import React, { useRef, useState, useCallback } from 'react';

interface ImageSliderSimpleProps {
  currentImageIndex: number;
  totalImages: number;
  onImageChange: (index: number) => void;
}

export const ImageSliderSimple: React.FC<ImageSliderSimpleProps> = ({
  currentImageIndex,
  totalImages,
  onImageChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return currentImageIndex;

    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const value = Math.round(percentage * (totalImages - 1));

    return value;
  }, [totalImages, currentImageIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    const value = calculateValue(touch.clientX);
    onImageChange(value);
  }, [calculateValue, onImageChange]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging) return;

    const touch = e.touches[0];
    const value = calculateValue(touch.clientX);
    onImageChange(value);
  }, [isDragging, calculateValue, onImageChange]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    const value = calculateValue(e.clientX);
    onImageChange(value);
  }, [calculateValue, onImageChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const value = calculateValue(e.clientX);
    onImageChange(value);
  }, [isDragging, calculateValue, onImageChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const thumbPosition = totalImages > 1
    ? (currentImageIndex / (totalImages - 1)) * 100
    : 0;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent pb-8 pt-8"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="px-6">
        {/* Custom slider track */}
        <div
          ref={trackRef}
          className="relative h-12 cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          style={{ touchAction: 'none' }}
        >
          {/* Track */}
          <div
            className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-green-900"
          />

          {/* Progress */}
          <div
            className="absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-green-700"
            style={{ width: `${thumbPosition}%` }}
          />

          {/* Thumb */}
          <div
            className="absolute top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-3 border-white bg-green-500 shadow-lg transition-transform"
            style={{
              left: `${thumbPosition}%`,
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
            }}
          />
        </div>

        <div className="mt-2 text-center text-sm text-white">
          Image {currentImageIndex + 1} of {totalImages}
        </div>
      </div>
    </div>
  );
};
