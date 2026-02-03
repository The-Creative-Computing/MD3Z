import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ImageSliderProps {
  currentImageIndex: number;
  totalImages: number;
  onImageChange: (index: number) => void;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  currentImageIndex,
  totalImages,
  onImageChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calcular posición del thumb basado en currentImageIndex
  const thumbPosition = totalImages > 1
    ? (currentImageIndex / (totalImages - 1)) * 100
    : 0;

  const updateImageFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current || totalImages <= 1) return;

    const rect = containerRef.current.getBoundingClientRect();
    const thumbWidth = 128; // w-32 = 128px
    const availableWidth = rect.width - thumbWidth;

    // Posición relativa dentro del contenedor
    let relativeX = clientX - rect.left - (thumbWidth / 2);
    relativeX = Math.max(0, Math.min(relativeX, availableWidth));

    // Convertir a índice
    const percentage = relativeX / availableWidth;
    const newIndex = Math.round(percentage * (totalImages - 1));

    // Actualizar si cambió
    if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < totalImages) {
      onImageChange(newIndex);
    }
  }, [totalImages, currentImageIndex, onImageChange]);

  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true);
    updateImageFromPosition(clientX);
  }, [updateImageFromPosition]);

  const handleMove = useCallback((clientX: number) => {
    if (isDragging) {
      updateImageFromPosition(clientX);
    }
  }, [isDragging, updateImageFromPosition]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length > 0) {
      console.log('Touch start at:', e.touches[0].clientX);
      handleStart(e.touches[0].clientX);
    }
  };

  // Global event listeners para drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.touches.length > 0) {
        console.log('Touch move at:', e.touches[0].clientX);
        handleMove(e.touches[0].clientX);
      }
    };

    if (isDragging) {
      console.log('Dragging started, attaching listeners');
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);

      return () => {
        console.log('Dragging ended, removing listeners');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);
      };
    }
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent pb-6 pt-8">
      <div className="px-4">
        {/* Contenedor del slider */}
        <div
          ref={containerRef}
          className="relative h-20 w-full"
          style={{ touchAction: 'none' }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          {/* Barra de fondo (track) */}
          <div className="absolute left-16 right-16 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary-dark">
            {/* Barra de progreso */}
            <div
              className="bg-primary-main h-full rounded-full"
              style={{ width: `${thumbPosition}%` }}
            />
          </div>

          {/* Thumb (cuadro con número) */}
          <div
            className="bg-primary-main pointer-events-none absolute top-0 flex h-20 w-32 items-center justify-center rounded-lg shadow-lg"
            style={{
              left: `calc(${thumbPosition}% - 64px)`,
              transform: isDragging ? 'scale(1.1)' : 'scale(1)',
              transition: isDragging ? 'transform 0.1s' : 'left 0.1s, transform 0.1s',
            }}
          >
            <span className="text-4xl font-bold text-white">
              {currentImageIndex + 1}
            </span>
          </div>
        </div>

        {/* Labels */}
        <div className="mt-2 flex justify-between px-16 text-xs text-gray-400">
          <span>1</span>
          <span className="text-primary-light">{totalImages} images</span>
          <span>{totalImages}</span>
        </div>
      </div>
    </div>
  );
};
