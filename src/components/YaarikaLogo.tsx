import React from 'react';
import brandLogoImg from '@/src/assets/images/regenerated_image_1791107582698.png';

interface YaarikaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const YaarikaLogo: React.FC<YaarikaLogoProps> = ({ 
  size = 'md', 
  className = '',
  onClick
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
    xl: 'w-24 h-24'
  }[size];

  return (
    <div 
      onClick={onClick}
      className={`relative rounded-full border-2 border-[#d4a341] bg-[#1d030c] shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-[#f5d78a] hover:shadow-amber-500/20 shrink-0 ${sizeClasses} ${className}`}
    >
      <img
        src={brandLogoImg}
        alt="Yaarika Collections YA Monogram"
        referrerPolicy="no-referrer"
        className="object-cover scale-110"
        style={{ width: '33px', height: '33px' }}
      />
    </div>
  );
};
