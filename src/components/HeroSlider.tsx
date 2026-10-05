import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { BOUTIQUE_INFO } from '../data/initialProducts';
import { HeroSlideItem, INITIAL_HERO_SLIDES } from '../data/initialSlides';

interface HeroSliderProps {
  onExploreCategory: (category: any) => void;
  slides?: HeroSlideItem[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ onExploreCategory, slides = INITIAL_HERO_SLIDES }) => {
  const activeSlides = slides.length > 0 ? slides : INITIAL_HERO_SLIDES;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const current = activeSlides[currentIndex] || activeSlides[0];

  const handleWhatsAppInquiry = () => {
    const text = `Hello Yaarika Collections! I am interested in exploring the ${current.title} featured in your boutique.`;
    const cleanNumber = BOUTIQUE_INFO.primaryPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#faf6ef] to-[#f4ede0] border-b border-amber-900/10">
      
      {/* Slider Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Zone (Screenshot 15) */}
          <div className="lg:col-span-6 space-y-5 text-left z-10">
            
            {/* Tag / Kicker */}
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold tracking-[0.25em] text-[#a46d23] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#d4a341]" />
              <span>{current.tag || 'HERITAGE COLLECTION'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.12] text-[#2c0512]">
              {current.title}
            </h1>

            {/* Subtitle */}
            <p className="text-stone-600 text-sm sm:text-base md:text-lg max-w-xl font-normal leading-relaxed">
              {current.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onExploreCategory(current.actionCategory || 'All')}
                className="bg-[#2e0513] hover:bg-[#46091e] text-[#f5d78a] border border-[#d4a341]/60 px-6 py-3 rounded-full text-xs md:text-sm font-bold tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>

              <button
                onClick={handleWhatsAppInquiry}
                className="bg-[#fbf4de] hover:bg-[#f6ebd0] text-[#128c3e] border border-[#dfc88c] px-5 py-3 rounded-full text-xs md:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>Order On WhatsApp</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="pt-4 flex items-center gap-4 text-xs text-stone-500 font-medium">
              <span>✦ Authentic Weaves</span>
              <span className="text-amber-800/30">|</span>
              <span>✦ Dispatch in 24-48 Hours</span>
              <span className="text-amber-800/30">|</span>
              <span>✦ Custom Sizing Assistance</span>
            </div>

          </div>

          {/* Right Image Frame with Carousel presentation (Screenshot 15) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#dfc88c] bg-[#faf3e0] aspect-[4/3] group">
              
              <img
                src={current.image}
                alt={current.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Gradient Scrim for subtle boutique elegance */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent pointer-events-none" />

              {/* Badge on Image */}
              <div className="absolute top-4 left-4 bg-[#2a0411]/90 backdrop-blur-md text-[#f5d78a] border border-[#d4a341]/50 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase">
                {current.tag}
              </div>

              {/* Monogram stamp watermark */}
              <div className="absolute bottom-4 right-4 text-white/90 text-right">
                <span className="font-serif-luxury text-sm tracking-widest text-[#f5d78a]">YAARIKA BOUTIQUE</span>
                <p className="text-[10px] text-stone-200">Handcrafted Kerala Elegance</p>
              </div>

            </div>

            {/* Slide Navigation Circles (Screenshot 15) */}
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#fcf7ec] hover:bg-[#f5edd5] text-stone-800 shadow-xl border border-[#dfc88c] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#fcf7ec] hover:bg-[#f5edd5] text-stone-800 shadow-xl border border-[#dfc88c] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6 stroke-[2.5]" />
            </button>

          </div>

        </div>

        {/* Carousel indicators */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {activeSlides.map((_, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'w-8 bg-[#380718]'
                  : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>

    </section>
  );
};
