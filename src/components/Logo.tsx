import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  stacked?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", showText = true, stacked = false }) => {
  const svgIcon = (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="reino-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7e22ce" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#d8b4fe" />
        </linearGradient>
        <mask id="cross-mask">
          <rect width="400" height="200" fill="white" />
          <path d="M 190 85 L 210 85 L 210 105 L 225 105 L 225 120 L 210 120 L 210 150 L 190 150 L 190 120 L 175 120 L 175 105 L 190 105 Z" fill="black" />
        </mask>
      </defs>
      
      {/* Crown with Cross Cutout */}
      <g mask="url(#cross-mask)">
        <path d="M 80 140 Q 200 110 320 140 L 340 60 L 270 95 L 200 40 L 130 95 L 60 60 Z" fill="url(#reino-grad)" />
      </g>
      
      <circle cx="200" cy="25" r="12" fill="url(#reino-grad)" />
      
      {/* Sparkles */}
      <path d="M 260 20 Q 280 20 280 0 Q 280 20 300 20 Q 280 20 280 40 Q 280 20 260 20 Z" fill="url(#reino-grad)" />
      <path d="M 300 50 Q 310 50 310 40 Q 310 50 320 50 Q 310 50 310 60 Q 310 50 300 50 Z" fill="url(#reino-grad)" />
      
      {/* Curve 1 */}
      <path d="M 100 160 Q 200 135 300 160" fill="none" stroke="url(#reino-grad)" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );

  if (!showText) return svgIcon;

  return (
    <div className={`flex ${stacked ? 'flex-col' : 'flex-row'} items-center ${stacked ? 'gap-1' : 'gap-2'}`}>
      {svgIcon}
      <div className={`flex flex-col ${stacked ? 'items-center' : 'items-start'}`}>
        <span className={`font-black tracking-widest primary-gradient-text ${stacked ? 'text-4xl mt-2' : 'text-xl'}`}>
          REINO
        </span>
        {stacked && (
          <svg viewBox="0 0 200 20" className="w-full h-3 mt-1">
            <path d="M 10 15 Q 100 5 190 15" fill="none" stroke="url(#reino-grad)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
