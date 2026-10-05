import React from 'react';
import { X, Trash2, MessageCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { BOUTIQUE_INFO } from '../data/initialProducts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleConsolidatedWhatsAppOrder = () => {
    if (items.length === 0) return;

    let message = `Hello Yaarika Collections! I would like to place an order for the following items:\n\n`;
    items.forEach((item, idx) => {
      message += `${idx + 1}. ${item.product.name} (Code: ${item.product.code}) - Qty: ${item.quantity} × ₹${item.product.price.toLocaleString('en-IN')}\n`;
    });
    message += `\nTotal Payable: ₹${totalAmount.toLocaleString('en-IN')}\nShipping: FREE (All Kerala Free Shipping)\n\nPlease share payment details and delivery address confirmation.`;

    const cleanNumber = BOUTIQUE_INFO.primaryPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 md:p-6 bg-[#380718] text-white flex items-center justify-between border-b border-amber-900/40">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              <h2 className="font-serif-luxury text-xl font-semibold tracking-wide text-[#f5d78a]">
                Shopping Bag ({items.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-stone-300 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Note */}
          <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-2 border-b border-emerald-100 flex items-center justify-between font-medium">
            <span>✨ ALL KERALA FREE SHIPPING INCLUDED</span>
            <span className="font-mono text-[11px] font-bold">2-3 DAYS</span>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <ShoppingBag className="w-12 h-12 text-stone-300 mb-3" />
                <p className="font-serif-luxury text-lg text-stone-800">Your shopping bag is empty</p>
                <p className="text-xs text-stone-400 mt-1 max-w-xs">
                  Discover our traditional Kasavu handlooms, Kanjeevaram silks, and festive co-ords.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 bg-[#380718] text-[#f5d78a] px-4 py-2 rounded-full text-xs font-semibold shadow hover:bg-[#520d26]"
                >
                  Explore Boutique
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.product.id}
                  className="flex gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/70 relative group"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover object-top rounded-lg bg-stone-200 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#a46d23] font-bold">
                          {item.product.code}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-stone-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-serif-luxury font-semibold text-sm text-stone-900 line-clamp-1 mt-0.5">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1">
                        {item.product.fabric}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-sm text-stone-900 tabular-nums">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>

                      {/* Quantity stepper */}
                      <div className="flex items-center border border-stone-300 rounded bg-white text-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & WhatsApp Checkout */}
          {items.length > 0 && (
            <div className="p-4 md:p-6 bg-stone-50 border-t border-stone-200 space-y-4">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium tabular-nums">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Shipping</span>
                  <span className="font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="tabular-nums">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleConsolidatedWhatsAppOrder}
                  className="w-full bg-[#128c3e] hover:bg-[#0e7433] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer text-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>CHECKOUT VIA WHATSAPP DESK</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span>Direct order desk confirmation</span>
                  <button
                    onClick={onClearCart}
                    className="text-stone-400 hover:text-rose-600 underline"
                  >
                    Clear Bag
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
