import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from 'lucide-react';
import type { PropertyMedia } from '@/types/property.types';
import { cn } from '@/lib/utils';

export interface ImageGalleryProps {
  media?: PropertyMedia[];
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ media = [], className }) => {
  const images = media.map((m) => m.url).filter(Boolean);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          'aspect-[16/9] sm:aspect-[21/9] rounded-2xl bg-[#F3EBD8] border border-[#D8C9A7] flex flex-col items-center justify-center text-[#494431] gap-2',
          className
        )}
      >
        <ImageOff className="w-10 h-10 text-[#494431]/70" />
        <p className="text-sm font-serif font-semibold text-[#373124]">No property photos uploaded yet</p>
      </div>
    );
  }

  const prevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Image Display */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-[#171715] border border-[#D8C9A7] group">
        <img
          src={images[activeIndex]}
          alt={`Property image ${activeIndex + 1}`}
          className="w-full h-full object-cover object-center transition-opacity duration-300"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#171715]/75 hover:bg-[#171715] text-[#F8F4E9] flex items-center justify-center backdrop-blur-xs transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#171715]/75 hover:bg-[#171715] text-[#F8F4E9] flex items-center justify-center backdrop-blur-xs transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter & Fullscreen trigger */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#171715]/80 text-[#F8F4E9] text-xs font-medium backdrop-blur-xs">
            {activeIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="p-2 rounded-full bg-[#171715]/80 hover:bg-[#171715] text-[#C3A66B] backdrop-blur-xs transition-colors"
            aria-label="View full screen lightbox"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all',
                activeIndex === idx
                  ? 'border-[#C3A66B] ring-2 ring-[#494431]/30'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#171715]/95 flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[#F8F4E9]">
            <span className="text-sm font-serif">
              Photograph {activeIndex + 1} of {images.length}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 text-[#F8F4E9]"
              aria-label="Close full view"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center max-h-[80vh] my-4">
            <img
              src={images[activeIndex]}
              alt={`Full view image ${activeIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-xl"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="thumb"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  'w-16 h-12 rounded-lg object-cover cursor-pointer border-2',
                  activeIndex === idx ? 'border-[#C3A66B] scale-105' : 'border-transparent opacity-60'
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
