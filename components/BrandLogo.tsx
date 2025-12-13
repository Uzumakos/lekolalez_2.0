import React from 'react';
import { BookOpen } from 'lucide-react';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'dark', className = "h-10 w-auto", showText = true }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-brand-dark';
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <img 
            src="https://ik.imagekit.io/tche25kem/lekolalez.jpg" 
            alt="Lekol Alèz Logo" 
            className={`${className} object-contain relative z-10 rounded-md`}
            onError={(e) => {
                // Fallback logic: hide image and show icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
        />
        {/* Fallback Icon */}
        <div className="hidden h-10 w-10 bg-brand-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
           <BookOpen size={24} />
        </div>
      </div>
      
      {showText && (
        <span className={`text-2xl font-bold font-sans tracking-tight ${textColor}`}>
            LEKOL <span className="text-brand-blue">ALÈZ</span>
        </span>
      )}
    </div>
  );
};