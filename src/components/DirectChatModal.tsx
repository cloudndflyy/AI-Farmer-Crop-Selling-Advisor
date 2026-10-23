import React, { useState } from 'react';
import { MarketplaceItem, UserProfile, NegotiationOffer, DirectChatMessage } from '../types';

interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  productItem?: MarketplaceItem | null;
  offers: NegotiationOffer[];
  onSendOffer: (offerData: Omit<NegotiationOffer, 'id' | 'status' | 'date'>) => void;
  onAcceptOffer: (offerId: string) => void;
  onRejectOffer: (offerId: string) => void;
  onCounterOffer: (offerId: string, counterPrice: number, notes?: string) => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  productItem,
  offers,
  onSendOffer,
  onAcceptOffer,
  onRejectOffer,
  onCounterOffer,
}) => {
  if (!isOpen) return null;

  const otherPersonName = currentUser.role === 'buyer' 
    ? (productItem?.sellerName || 'Ramesh Patel (Farmer)')
    : 'Anand Agro Wholesalers (Buyer)';

  // Find existing offer for this item
  const currentOffer = offers.find(o => productItem ? o.productId === productItem.id : true);

  // Local state for messages
  const [messages, setMessages] = useState<DirectChatMessage[]>([
    {
      id: 'm1',
      threadId: 't1',
      senderId: currentUser.role === 'buyer' ? 'farmer-101' : currentUser.buyerId || 'buyer-1',
      senderName: otherPersonName,
      senderRole: currentUser.role === 'buyer' ? 'farmer' : 'buyer',
      text: currentUser.role === 'buyer'
        ? `Namaste! I am the farmer who grew ${productItem?.title || 'this produce'}. Feel free to ask about harvest grade, transportation, or send a direct wholesale offer.`
        : `Hello! I am interested in placing a bulk order for ${productItem?.title || 'your harvest'}. What is your best price per unit?`,
      timestamp: '10:15 AM'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showCounterFormForOfferId, setShowCounterFormForOfferId] = useState<string | null>(null);

  // Form states for Send Offer
  const [offeredPrice, setOfferedPrice] = useState<number>(productItem ? Math.round(productItem.price * 0.95) : 2200);
  const [offeredQuantity, setOfferedQuantity] = useState<number>(productItem?.minOrderQuantity || 10);
  const [offerNotes, setOfferNotes] = useState<string>('Requesting bulk discount for cash payment on delivery.');

  // Form state for Counter Offer
  const [counterPriceInput, setCounterPriceInput] = useState<number>(productItem?.price || 2350);
  const [counterNotesInput, setCounterNotesInput] = useState<string>('This is our lowest price given the organic grade.');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMsg: DirectChatMessage = {
      id: `m_${Date.now()}`,
      threadId: 't1',
      senderId: currentUser.email,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');

    // Simulate response after 1.2s if desired
    setTimeout(() => {
      const autoReply: DirectChatMessage = {
        id: `m_reply_${Date.now()}`,
        threadId: 't1',
        senderId: 'other-user',
        senderName: otherPersonName,
        senderRole: currentUser.role === 'buyer' ? 'farmer' : 'buyer',
        text: currentUser.role === 'buyer'
          ? `Thank you for your message! I have reviewed your request for ${productItem?.title || 'the produce'}. Let me know if you want to finalize the order.`
          : `Thanks for the details! We are reviewing the crop grade and logistics.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, autoReply]);
    }, 1200);
  };

  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productItem) return;

    onSendOffer({
      productId: productItem.id,
      productTitle: productItem.title,
      buyerName: currentUser.name,
      buyerId: currentUser.buyerId || 'buyer-1',
      sellerName: productItem.sellerName,
      sellerId: productItem.sellerId || 'farmer-1',
      originalPrice: productItem.price,
      offeredPrice: Number(offeredPrice),
      quantity: Number(offeredQuantity),
      unit: productItem.unit,
      totalAmount: Number(offeredPrice) * Number(offeredQuantity),
      notes: offerNotes
    });

    // Add offer card in chat
    const offerMsg: DirectChatMessage = {
      id: `m_offer_${Date.now()}`,
      threadId: 't1',
      senderId: currentUser.email,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: `Sent a official purchase offer: ₹${offeredPrice}/${productItem.unit} for ${offeredQuantity} ${productItem.unit}s (Total: ₹${(offeredPrice * offeredQuantity).toLocaleString('en-IN')})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      offerCard: {
        offerId: `off_${Date.now()}`,
        productTitle: productItem.title,
        offeredPrice: Number(offeredPrice),
        unit: productItem.unit,
        quantity: Number(offeredQuantity),
        status: 'Pending'
      }
    };

    setMessages(prev => [...prev, offerMsg]);
    setShowOfferForm(false);
  };

  const handleAcceptAction = (offerId: string) => {
    onAcceptOffer(offerId);
    const msg: DirectChatMessage = {
      id: `m_accept_${Date.now()}`,
      threadId: 't1',
      senderId: currentUser.email,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: `✅ ACCEPTED OFFER! Price agreed at ₹${currentOffer?.offeredPrice || offeredPrice}/${productItem?.unit || 'Quintal'}. Order has been created!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleRejectAction = (offerId: string) => {
    onRejectOffer(offerId);
    const msg: DirectChatMessage = {
      id: `m_reject_${Date.now()}`,
      threadId: 't1',
      senderId: currentUser.email,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: `❌ DECLINED OFFER. The price offer was below minimum reserve. Feel free to make another offer.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleCounterAction = (offerId: string) => {
    onCounterOffer(offerId, Number(counterPriceInput), counterNotesInput);
    const msg: DirectChatMessage = {
      id: `m_counter_${Date.now()}`,
      threadId: 't1',
      senderId: currentUser.email,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: `🔄 COUNTER OFFER: Proposed revised price ₹${counterPriceInput}/${productItem?.unit || 'Quintal'}. Notes: "${counterNotesInput}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, msg]);
    setShowCounterFormForOfferId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="glass-panel rounded-3xl max-w-xl w-full h-[85vh] flex flex-col slide-up shadow-2xl relative border border-outline-variant/30 overflow-hidden">
        {/* Top Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-extrabold text-sm">
              {otherPersonName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">{otherPersonName}</h3>
              <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Online • Direct Agri Messaging</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {productItem && currentUser.role === 'buyer' && (
              <button
                onClick={() => setShowOfferForm(!showOfferForm)}
                className="bg-primary hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">handshake</span>
                <span>Send Offer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-container cursor-pointer text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Product Banner info */}
        {productItem && (
          <div className="bg-primary/5 px-4 py-2 border-b border-primary/10 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">{productItem.title}</span>
              <span className="text-primary font-black">₹{productItem.price}/{productItem.unit}</span>
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium">Qty Available: {productItem.availableQuantity} {productItem.unit}s</span>
          </div>
        )}

        {/* Send Offer Form Popup */}
        {showOfferForm && productItem && (
          <form onSubmit={handleSubmitOffer} className="p-4 bg-emerald-50 border-b border-emerald-200 slide-up text-xs space-y-3">
            <div className="flex justify-between items-center font-bold text-emerald-900">
              <span>Send Official Wholesale Price Offer</span>
              <button type="button" onClick={() => setShowOfferForm(false)} className="text-emerald-700 hover:text-emerald-950 font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-emerald-800 mb-1">Your Offered Price (₹ per {productItem.unit})</label>
                <input
                  type="number"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-emerald-300 font-bold text-sm focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-emerald-800 mb-1">Quantity ({productItem.unit}s)</label>
                <input
                  type="number"
                  value={offeredQuantity}
                  onChange={(e) => setOfferedQuantity(Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-emerald-300 font-bold text-sm focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-emerald-800 mb-1">Offer Notes / Payment Terms</label>
              <input
                type="text"
                value={offerNotes}
                onChange={(e) => setOfferNotes(e.target.value)}
                placeholder="e.g. Immediate payment on truck loading"
                className="w-full p-2 bg-white rounded-lg border border-emerald-300 text-xs focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="font-extrabold text-emerald-950">
                Total Proposal: ₹{(offeredPrice * offeredQuantity).toLocaleString('en-IN')}
              </span>
              <button
                type="submit"
                className="bg-primary hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
              >
                Confirm & Submit Offer
              </button>
            </div>
          </form>
        )}

        {/* Counter Offer Form Popup */}
        {showCounterFormForOfferId && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 slide-up text-xs space-y-3">
            <div className="flex justify-between items-center font-bold text-amber-900">
              <span>Send Counter Offer to Buyer</span>
              <button type="button" onClick={() => setShowCounterFormForOfferId(null)} className="text-amber-700 font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-amber-800 mb-1">New Counter Price (₹)</label>
                <input
                  type="number"
                  value={counterPriceInput}
                  onChange={(e) => setCounterPriceInput(Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-amber-300 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-amber-800 mb-1">Counter Notes</label>
                <input
                  type="text"
                  value={counterNotesInput}
                  onChange={(e) => setCounterNotesInput(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-amber-300 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCounterAction(showCounterFormForOfferId)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-1.5 rounded-xl cursor-pointer"
              >
                Send Counter Price
              </button>
            </div>
          </div>
        )}

        {/* Active Negotiation Card Banner */}
        {currentOffer && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div>
              <span className="font-extrabold text-on-surface">Active Offer: ₹{currentOffer.offeredPrice}/{currentOffer.unit}</span>
              <span className="text-on-surface-variant ml-2 font-medium">({currentOffer.quantity} {currentOffer.unit}s • Total ₹{currentOffer.totalAmount.toLocaleString('en-IN')})</span>
              <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                currentOffer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                currentOffer.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                currentOffer.status === 'Countered' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {currentOffer.status}
              </span>
            </div>

            {/* Farmer Action Buttons if pending or countered */}
            {currentUser.role === 'farmer' && currentOffer.status === 'Pending' && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleAcceptAction(currentOffer.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  Accept
                </button>
                <button
                  onClick={() => setShowCounterFormForOfferId(currentOffer.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  Counter
                </button>
                <button
                  onClick={() => handleRejectAction(currentOffer.id)}
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-container-low/50">
          {messages.map((m) => {
            const isMe = m.senderId === currentUser.email || m.senderName === currentUser.name;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-on-surface-variant font-semibold">
                  <span>{m.senderName}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white text-on-surface border border-outline-variant/30 rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Render offer card if present */}
                  {m.offerCard && (
                    <div className="mt-3 p-3 rounded-xl bg-black/10 border border-white/20 text-xs space-y-2">
                      <div className="font-extrabold flex justify-between">
                        <span>Offered Price:</span>
                        <span>₹{m.offerCard.offeredPrice}/{m.offerCard.unit}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Quantity:</span>
                        <span>{m.offerCard.quantity} {m.offerCard.unit}s</span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-white/20 font-bold">
                        <span>Total:</span>
                        <span>₹{(m.offerCard.offeredPrice * m.offerCard.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-outline-variant/30 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your price inquiry or terms..."
            className="flex-1 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSendMessage}
            className="p-2.5 rounded-xl bg-primary hover:bg-emerald-700 text-white cursor-pointer transition-colors flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
