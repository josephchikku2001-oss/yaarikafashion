import React from 'react';
import { MessageCircle } from 'lucide-react';
import { BOUTIQUE_INFO } from '../data/initialProducts';

export const FloatingWhatsApp: React.FC = () => {
  const handleClick = () => {
    const cleanNumber = BOUTIQUE_INFO.primaryPhone.replace(/[^0-9]/g, '');
    const message = 'Hello Yaarika Collections! I would like to chat with your boutique styling team about available sarees and co-ords.';
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center group">
      {/* Tooltip on hover */}
      <span className="mr-3 hidden md:inline-block bg-[#1a030c] text-amber-200 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-amber-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
        Chat with Boutique Stylist
      </span>

      <button
        onClick={handleClick}
        className="w-14 h-14 bg-[#25d366] hover:bg-[#20ba59] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white/80"
        aria-label="Direct WhatsApp Chat"
        title="WhatsApp: +91 9995592722"
      >
        <MessageCircle className="w-7 h-7 fill-current" />
        {/* Pulse beacon */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" />
      </button>
    </div>
  );
};
