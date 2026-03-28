import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      case '4:5': return 'aspect-[4/5]';
      case '9:16': return 'aspect-[9/16]';
      default: return 'aspect-video';
    }
  };

  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(e => console.error("Play failed:", e));
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [currentIndex]);

  return (
    <div 
      className={`relative group overflow-hidden rounded-xl bg-slate-900 ${getAspectRatioClass(aspectRatio)}`}
      onClick={() => onExpand?.(currentIndex)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full"
        >
          {media[currentIndex].type === 'image' ? (
            <img
              src={media[currentIndex].url}
              alt={`Media ${currentIndex + 1}`}
              className={`w-full h-full ${media[currentIndex].objectFit === 'contain' ? 'object-contain' : 'object-cover'} cursor-pointer`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <video
              ref={videoRef}
              src={media[currentIndex].url}
              className={`w-full h-full ${media[currentIndex].objectFit === 'contain' ? 'object-contain' : 'object-cover'} cursor-pointer`}
              muted
              playsInline
              loop
              controls
            />
          )}
        </motion.div>
      </AnimatePresence>
      
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
                  i === currentIndex ? 'bg-primary w-3' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
