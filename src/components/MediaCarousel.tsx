import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { PostMedia } from '../types';

interface MediaCarouselProps {
  media: PostMedia[];
  aspectRatio?: "1:1" | "4:5" | "16:9" | "9:16";
  onExpand?: (index: number) => void;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, aspectRatio = "16:9", onExpand }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  if (!media || media.length === 0) return null;

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  return (
    <div 
      className={`relative group overflow-hidden rounded-xl bg-slate-100 aspect-${aspectRatio}`}
      onClick={() => onExpand?.(currentIndex)}
    >
      <motion.img
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        src={media[currentIndex].url}
        alt={`Media ${currentIndex + 1}`}
        className="w-full h-full object-cover cursor-pointer"
        referrerPolicy="no-referrer"
      />
      
      {media.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {media.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'bg-indigo-600 w-3' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
