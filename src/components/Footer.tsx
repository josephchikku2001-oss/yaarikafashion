import React from 'react';
import { Truck, ShieldCheck } from 'lucide-react';
import { BOUTIQUE_INFO } from '../data/initialProducts';
import { YaarikaLogo } from './YaarikaLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#290513] text-stone-300 pt-10 pb-8 border-t border-[#46091e] select-none text-center">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-6">
        
        {/* Brand & Monogram */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <YaarikaLogo size="md" />

          <div>
            <h3 className="font-serif-luxury text-2xl md:text-3xl font-bold text-[#f5d78a] tracking-wide">
              {BOUTIQUE_INFO.name}
            </h3>
            <div className="text-[10px] tracking-[0.28em] text-[#e0b769] font-semibold uppercase mt-0.5">
              {BOUTIQUE_INFO.tagline}
            </div>
          </div>

          <p className="text-stone-300/80 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            {BOUTIQUE_INFO.description}
          </p>
        </div>

        {/* Heritage Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-amber-200/90 border-t border-b border-[#46091e]/80 py-4">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>{BOUTIQUE_INFO.shippingPolicy}</span>
          </div>

          <span className="text-[#d4a341]/40">•</span>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{BOUTIQUE_INFO.qualityBadge}</span>
          </div>

          <span className="text-[#d4a341]/40">•</span>

          <span className="text-[#f5d78a] font-medium">Authentic Kasavu Certified</span>
        </div>

        {/* Bottom Copyright */}
        <div className="text-xs text-stone-400 pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {BOUTIQUE_INFO.copyrightYear} <span className="text-[#f5d78a] font-semibold">{BOUTIQUE_INFO.name}</span>. All Rights Reserved.
          </div>
          <div className="text-[11px] text-amber-200/70 font-medium">
            {BOUTIQUE_INFO.location}
          </div>
        </div>

      </div>
    </footer>
  );
};
