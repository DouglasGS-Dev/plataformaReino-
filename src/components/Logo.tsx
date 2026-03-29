import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  stacked?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = true, stacked = false }) => {
  const [hasError, setHasError] = React.useState(false);

  const customLogo = !hasError ? (
    <img 
      src="/file_000000009a1071f587f9c41986550a4b.png" 
      alt="REINO Logo" 
      className={`${className} object-contain drop-shadow-md`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  ) : (
    <div className={`${className} bg-primary-100 rounded-xl flex items-center justify-center text-primary font-bold text-xs`}>
      R
    </div>
  );

  if (!showText) return customLogo;

  return (
    <div className={`flex ${stacked ? 'flex-col' : 'flex-row'} items-center ${stacked ? 'gap-2' : 'gap-3'}`}>
      {customLogo}
      <div className={`flex flex-col ${stacked ? 'items-center' : 'items-start'}`}>
        <span className={`font-black tracking-widest primary-gradient-text ${stacked ? 'text-5xl mt-2' : 'text-2xl'}`}>
          REINO
        </span>
      </div>
    </div>
  );
}
