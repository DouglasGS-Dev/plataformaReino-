import React from 'react';
import { Church } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  stacked?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = true, stacked = false }) => {
  const [hasError, setHasError] = React.useState(false);

  const logoIcon = !hasError ? (
    <img 
      src="/app-logo.jpg" 
      alt="REINO Logo" 
      className={`${className} object-cover rounded-2xl shadow-md border border-primary/20 transition-transform hover:scale-105`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  ) : (
    <div className={`${className} bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20`}>
      <Church className="w-2/3 h-2/3" />
    </div>
  );

  if (!showText) return logoIcon;

  return (
    <div className={`flex ${stacked ? 'flex-col' : 'flex-row'} items-center ${stacked ? 'gap-3' : 'gap-4'}`}>
      {logoIcon}
      <div className={`flex flex-col ${stacked ? 'items-center' : 'items-start'}`}>
        <span className={`font-black tracking-tighter primary-gradient-text leading-none ${stacked ? 'text-5xl mt-2' : 'text-3xl'}`}>
          REINO
        </span>
        {!stacked && (
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground/60 -mt-1">
            Plataforma Cristã
          </span>
        )}
      </div>
    </div>
  );
}
