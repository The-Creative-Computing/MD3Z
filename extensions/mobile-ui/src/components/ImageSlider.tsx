import React from 'react';

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
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent pb-4 pt-8">
      <div className="flex items-center gap-4 px-4">
        {/* Image Number Display */}
        <div className="bg-primary-main flex h-20 w-32 flex-shrink-0 items-center justify-center rounded-lg">
          <span className="text-4xl font-bold text-white">
            {currentImageIndex + 1}
          </span>
        </div>

        {/* Slider */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={totalImages - 1}
            value={currentImageIndex}
            onChange={handleSliderChange}
            className="slider-mobile w-full"
            style={{
              background: `linear-gradient(to right, #4F9FD9 0%, #4F9FD9 ${
                (currentImageIndex / (totalImages - 1)) * 100
              }%, #2C3E50 ${(currentImageIndex / (totalImages - 1)) * 100}%, #2C3E50 100%)`,
            }}
          />
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>1</span>
            <span className="text-primary-light">{totalImages} images</span>
            <span>{totalImages}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
