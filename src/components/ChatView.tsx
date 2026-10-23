import React, { useState, useEffect } from 'react';
import { ScreenView, UserProfile, MarketplaceItem, NegotiationOffer, DirectChatMessage } from '../types';

export interface ChatThread {
  id: string;
  participantName: string;
  participantRole: 'buyer' | 'farmer';
  participantAvatar?: string;
  productTitle: string;
  productId: string;
  unit: string;
  pricePerUnit: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  offerId?: string;
  messages: DirectChatMessage[];
}

interface ChatViewProps {
  user: UserProfile;
  offers: NegotiationOffer[];
  marketplaceItems: MarketplaceItem[];
  selectedProduct?: MarketplaceItem | null;
  selectedOffer?: NegotiationOffer | null;
  onNavigate: (view: ScreenView) => void;
  onSendOffer: (offerData: Omit<NegotiationOffer, 'id' | 'status' | 'createdAt'>) => void;
  onAcceptOffer: (offerId: string) => void;
  onRejectOffer: (offerId: string) => void;
  onCounterOffer: (offerId: string, counterPrice: number, notes?: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  user,
  offers,
  marketplaceItems,
  selectedProduct,
  selectedOffer,
  onNavigate,
  onSendOffer,
  onAcceptOffer,
  onRejectOffer,
  onCounterOffer,
}) => {
  // 1. Loading and Error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [invalidRedirectMessage, setInvalidRedirectMessage] = useState<string | null>(null);

  // Initial threads construction
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'thread-101',
      participantName: 'Gujarat Flour Mills Co.',
      participantRole: 'buyer',
      productTitle: 'Sharbati Wheat (Golden Grain)',
      productId: 'm-1',
      unit: 'Quintal',
      pricePerUnit: 2450,
      lastMessage: 'Namaste! We submitted a bulk purchase offer of ₹2,350/Quintal for 100 Quintals.',
      lastMessageTime: '10:30 AM',
      unreadCount: 1,
      offerId: 'off-101',
      messages: [
        {
          id: 'msg-1',
          threadId: 'thread-101',
          senderId: 'buyer-gujarat',
          senderName: 'Gujarat Flour Mills Co.',
          senderRole: 'buyer',
          text: 'Namaste Badal ji! We are interested in ordering 100 Quintals of Sharbati Wheat.',
          timestamp: '10:15 AM',
        },
        {
          id: 'msg-2',
          threadId: 'thread-101',
          senderId: 'buyer-gujarat',
          senderName: 'Gujarat Flour Mills Co.',
          senderRole: 'buyer',
          text: 'We submitted a formal offer of ₹2,350/Quintal with instant cash settlement on arrival.',
          timestamp: '10:30 AM',
          offerCard: {
            offerId: 'off-101',
            productTitle: 'Sharbati Wheat (Golden Grain)',
            offeredPrice: 2350,
            unit: 'Quintal',
            quantity: 100,
            status: 'Pending',
          },
        },
      ],
    },
    {
      id: 'thread-102',
      participantName: 'Kandla Agro Exporters',
      participantRole: 'buyer',
      productTitle: 'Organic Basmati Rice (1121)',
      productId: 'm-2',
      unit: 'Quintal',
      pricePerUnit: 6800,
      lastMessage: 'Please confirm if phytosanitary export certificate can be provided with shipment.',
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
      offerId: 'off-102',
      messages: [
        {
          id: 'msg-201',
          threadId: 'thread-102',
          senderId: 'buyer-kandla',
          senderName: 'Kandla Agro Exporters',
          senderRole: 'buyer',
          text: 'Hello! We need 50 Quintals of 1121 Basmati Rice for Middle East export consignment.',
          timestamp: 'Yesterday 4:00 PM',
        },
        {
          id: 'msg-202',
          threadId: 'thread-102',
          senderId: 'buyer-kandla',
          senderName: 'Kandla Agro Exporters',
          senderRole: 'buyer',
          text: 'Please confirm if phytosanitary export certificate can be provided with shipment.',
          timestamp: 'Yesterday 4:20 PM',
          offerCard: {
            offerId: 'off-102',
            productTitle: 'Organic Basmati Rice (1121)',
            offeredPrice: 6600,
            unit: 'Quintal',
            quantity: 50,
            status: 'Pending',
          },
        },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string | null>('thread-101');
  const [inputMessage, setInputMessage] = useState<string>('');

  // Counter & Offer Form State
  const [showOfferForm, setShowOfferForm] = useState<boolean>(false);
  const [offerPriceInput, setOfferPriceInput] = useState<number>(2300);
  const [offerQtyInput, setOfferQtyInput] = useState<number>(20);
  const [offerNotesInput, setOfferNotesInput] = useState<string>('Standard wholesale bulk order terms.');

  // Handle initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Handle selected product or selected offer prop to pick or create matching thread
  useEffect(() => {
    if (selectedProduct) {
      const match = threads.find((t) => t.productId === selectedProduct.id);
      if (match) {
        setActiveThreadId(match.id);
      } else {
        // Create new thread for this product
        const newThreadId = `thread-${Date.now()}`;
        const newThread: ChatThread = {
          id: newThreadId,
          participantName: user.role === 'buyer' ? selectedProduct.sellerName : 'Interested Direct Buyer',
          participantRole: user.role === 'buyer' ? 'farmer' : 'buyer',
          productTitle: selectedProduct.title,
          productId: selectedProduct.id,
          unit: selectedProduct.unit,
          pricePerUnit: selectedProduct.price,
          lastMessage: `Inquiry regarding ${selectedProduct.title}`,
          lastMessageTime: 'Just now',
          unreadCount: 0,
          messages: [
            {
              id: `msg-${Date.now()}`,
              threadId: newThreadId,
              senderId: 'system',
              senderName: 'CloudAgri Escrow System',
              senderRole: 'farmer',
              text: `Conversation initialized for ${selectedProduct.title}. Ask questions or send direct wholesale offers below.`,
              timestamp: 'Just now',
            },
          ],
        };
        setThreads((prev) => [newThread, ...prev]);
        setActiveThreadId(newThreadId);
      }
    }
  }, [selectedProduct]);

  // Check for invalid activeThreadId (redirect to Chat List safely)
  useEffect(() => {
    if (activeThreadId && !threads.some((t) => t.id === activeThreadId)) {
      setActiveThreadId(null);
      setInvalidRedirectMessage('The requested conversation was not found or was closed. Redirected to Chat List.');
      const timeout = setTimeout(() => setInvalidRedirectMessage(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [activeThreadId, threads]);

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const matchedOffer = activeThread?.offerId
    ? offers.find((o) => o.id === activeThread.offerId)
    : offers.find((o) => o.productId === activeThread?.productId);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeThreadId) return;

    const newMsg: DirectChatMessage = {
      id: `msg-${Date.now()}`,
      threadId: activeThreadId,
      senderId: user.email,
      senderName: user.name,
      senderRole: user.role,
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            lastMessage: inputMessage.trim(),
            lastMessageTime: 'Just now',
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    setInputMessage('');

    // Simulate auto response after 1 second
    setTimeout(() => {
      const replyMsg: DirectChatMessage = {
        id: `reply-${Date.now()}`,
        threadId: activeThreadId,
        senderId: 'participant-bot',
        senderName: activeThread?.participantName || 'Buyer/Seller',
        senderRole: user.role === 'farmer' ? 'buyer' : 'farmer',
        text:
          user.role === 'farmer'
            ? 'Thank you for the update! We are coordinating transport dispatch with our logistics partner.'
            : 'Namaste! I have received your message. Let me verify the crop moisture percentage and respond shortly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              lastMessage: replyMsg.text,
              lastMessageTime: 'Just now',
              messages: [...t.messages, replyMsg],
            };
          }
          return t;
        })
      );
    }, 1200);
  };

  const handleCreateOfferInChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;

    onSendOffer({
      productId: activeThread.productId,
      productTitle: activeThread.productTitle,
      buyerName: user.name,
      buyerId: user.buyerId || 'buyer-1',
      sellerName: activeThread.participantName,
      sellerId: 'farmer-1',
      originalPrice: activeThread.pricePerUnit,
      offeredPrice: offerPriceInput,
      quantity: offerQtyInput,
      unit: activeThread.unit,
      totalAmount: offerPriceInput * offerQtyInput,
      notes: offerNotesInput,
    });

    const offerCardMsg: DirectChatMessage = {
      id: `offer-msg-${Date.now()}`,
      threadId: activeThread.id,
      senderId: user.email,
      senderName: user.name,
      senderRole: user.role,
      text: `Submitted official purchase offer: ₹${offerPriceInput}/${activeThread.unit} for ${offerQtyInput} ${activeThread.unit}s (Total: ₹${(offerPriceInput * offerQtyInput).toLocaleString('en-IN')})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      offerCard: {
        offerId: `off-${Date.now()}`,
        productTitle: activeThread.productTitle,
        offeredPrice: offerPriceInput,
        unit: activeThread.unit,
        quantity: offerQtyInput,
        status: 'Pending',
      },
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            lastMessage: `Submitted official offer: ₹${offerPriceInput}/${activeThread.unit}`,
            lastMessageTime: 'Just now',
            messages: [...t.messages, offerCardMsg],
          };
        }
        return t;
      })
    );

    setShowOfferForm(false);
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.productTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ----------------------------------------------------
  // STATE 1: LOADING STATE
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6">
        <div className="glass-card p-10 rounded-3xl max-w-md w-full text-center space-y-4 border border-outline-variant/30 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary animate-spin">
            <span className="material-symbols-outlined text-3xl">sync</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Connecting to Agro Chat & Escrow Server...</h2>
          <p className="text-xs text-on-surface-variant font-medium">
            Fetching encrypted buyer negotiations, mandi offers, and verified deal threads.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 2: ERROR STATE
  // ----------------------------------------------------
  if (error) {
    return (
      <div className="pt-20 min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6">
        <div className="glass-card p-8 rounded-3xl max-w-md w-full text-center space-y-4 border border-red-200 bg-red-50/20 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
          </div>
          <h2 className="text-xl font-bold text-red-900">Communication Error Occurred</h2>
          <p className="text-xs text-on-surface-variant">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              setTimeout(() => setLoading(false), 300);
            }}
            className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-xs shadow-md hover:bg-emerald-700 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN CHAT PAGE INTERFACE
  // ----------------------------------------------------
  return (
    <div className="pt-16 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 flex flex-wrap justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('farmer-dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
            title="Back to Console"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AgriDirect Buyer & Farmer Messaging</span>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                End-to-End Escrow
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Real-time produce negotiations, price counter-offers, and transportation tracking.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('marketplace')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">storefront</span>
            <span>Marketplace</span>
          </button>
          <button
            onClick={() => {
              setError('Simulated network timeout test. Use Retry to recover.');
            }}
            className="px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer flex items-center gap-1"
            title="Test Error Recovery State"
          >
            <span className="material-symbols-outlined text-sm">bug_report</span>
          </button>
        </div>
      </div>

      {/* Invalid Redirect Toast Alert */}
      {invalidRedirectMessage && (
        <div className="bg-amber-500/10 border-b border-amber-300 px-6 py-2.5 text-xs text-amber-900 dark:text-amber-200 font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
            <span>{invalidRedirectMessage}</span>
          </span>
          <button onClick={() => setInvalidRedirectMessage(null)} className="text-amber-700 hover:text-amber-900 text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-120px)] overflow-hidden">
        {/* LEFT COLUMN: CHAT LIST STATE */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${
            activeThreadId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buyers, farmers or crops..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 px-1">
              <span>ACTIVE THREADS ({filteredThreads.length})</span>
              <span className="text-emerald-700 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => setActiveThreadId(null)}>
                All Conversations
              </span>
            </div>
          </div>

          {/* Thread List Items OR Empty State */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {/* ---------------------------------------------------- */}
            {/* STATE 4: EMPTY STATE IF NO THREADS EXIST */}
            {/* ---------------------------------------------------- */}
            {threads.length === 0 ? (
              <div className="p-8 text-center space-y-4 my-auto">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">No Conversations Yet</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You do not have any active message threads. Start chatting by reviewing produce listings or incoming buyer offers.
                </p>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                No conversation matching "{searchQuery}".
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full p-3.5 rounded-2xl text-left cursor-pointer transition-all flex items-start gap-3 border ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-l-emerald-600 border-y border-r border-emerald-300 dark:border-emerald-800 shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center text-sm border border-emerald-200 dark:border-emerald-800">
                        {thread.participantName.charAt(0)}
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute bottom-0 right-0 shadow-xs" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`text-xs truncate ${thread.unreadCount > 0 ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                          {thread.participantName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium shrink-0 ml-2">{thread.lastMessageTime}</span>
                      </div>

                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate mb-1 flex items-center gap-1">
                        <span>🌾</span>
                        <span className="truncate">{thread.productTitle}</span>
                      </div>

                      <p className={`text-[11px] truncate ${thread.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>
                        {thread.lastMessage}
                      </p>
                    </div>

                    {thread.unreadCount > 0 && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-xs mt-1">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION STATE OR UNSELECTED STATE */}
        <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 ${activeThreadId ? 'flex' : 'hidden md:flex'}`}>
          {/* ---------------------------------------------------- */}
          {/* STATE 3: ACTIVE CONVERSATION STATE */}
          {/* ---------------------------------------------------- */}
          {activeThread ? (
            <>
              {/* Sticky Buyer Profile Header */}
              <div className="sticky top-0 z-20 p-3.5 md:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveThreadId(null)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center text-sm border border-emerald-300 dark:border-emerald-800">
                      {activeThread.participantName.charAt(0)}
                    </div>
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute bottom-0 right-0 shadow-xs" title="Online now" />
                  </div>

                  <div>
                    <h3 className="font-black text-sm md:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{activeThread.participantName}</span>
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base" title="Verified Mandi Trader">
                        verified
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                      <span>•</span>
                      <span className="truncate">Mandi Verified Buyer</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Product Summary Badge */}
                  <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-bold">
                    <span>🌾</span>
                    <span className="truncate max-w-[140px]">{activeThread.productTitle}</span>
                    <span className="text-emerald-700 dark:text-emerald-400">₹{activeThread.pricePerUnit}/{activeThread.unit}</span>
                  </div>

                  <button
                    onClick={() => setShowOfferForm(!showOfferForm)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">handshake</span>
                    <span>Make Offer</span>
                  </button>
                </div>
              </div>

              {/* Offer Form Popdown Panel */}
              {showOfferForm && (
                <form
                  onSubmit={handleCreateOfferInChat}
                  className="bg-emerald-50 dark:bg-emerald-950/60 p-4 border-b border-emerald-200 dark:border-emerald-800 space-y-3 slide-down text-xs shadow-md"
                >
                  <div className="font-extrabold text-emerald-900 dark:text-emerald-200 flex justify-between items-center text-sm">
                    <span>Send Wholesale Counter Offer for {activeThread.productTitle}</span>
                    <button type="button" onClick={() => setShowOfferForm(false)} className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer">
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase mb-1">
                        Offered Price per {activeThread.unit} (₹)
                      </label>
                      <input
                        type="number"
                        value={offerPriceInput}
                        onChange={(e) => setOfferPriceInput(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase mb-1">
                        Quantity ({activeThread.unit}s)
                      </label>
                      <input
                        type="number"
                        value={offerQtyInput}
                        onChange={(e) => setOfferQtyInput(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase mb-1">Offer Notes / Terms</label>
                    <input
                      type="text"
                      value={offerNotesInput}
                      onChange={(e) => setOfferNotesInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs"
                  >
                    Submit Offer (Total: ₹{(offerPriceInput * offerQtyInput).toLocaleString('en-IN')})
                  </button>
                </form>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/50">
                {activeThread.messages.map((msg) => {
                  const isMe = msg.senderId === user.email || msg.senderRole === user.role;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="text-[11px] text-slate-500 font-semibold mb-1 px-1 flex items-center gap-1.5">
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-md md:max-w-lg p-4 rounded-2xl text-xs sm:text-sm space-y-2 shadow-sm ${
                          isMe
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-50 border border-emerald-200 dark:border-emerald-700 rounded-tr-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                        }`}
                      >
                        <p className="leading-relaxed font-medium">{msg.text}</p>

                        {/* Embedded Offer Card in Message if present */}
                        {msg.offerCard && (
                          <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 mt-2 space-y-2.5 text-slate-900 dark:text-white shadow-xs">
                            <div className="flex justify-between items-center font-extrabold text-xs">
                              <span className="text-emerald-800 dark:text-emerald-300">Offer: ₹{msg.offerCard.offeredPrice}/{msg.offerCard.unit}</span>
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                                {msg.offerCard.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                              Quantity: <strong className="text-slate-900 dark:text-white">{msg.offerCard.quantity} {msg.offerCard.unit}s</strong> • Total: <strong className="text-emerald-700 dark:text-emerald-400">₹{(msg.offerCard.offeredPrice * msg.offerCard.quantity).toLocaleString('en-IN')}</strong>
                            </p>

                            {matchedOffer && matchedOffer.status === 'Pending' && user.role === 'farmer' && (
                              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                                <button
                                  onClick={() => onAcceptOffer(matchedOffer.id)}
                                  className="flex-1 min-w-[80px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
                                >
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => onRejectOffer(matchedOffer.id)}
                                  className="flex-1 min-w-[80px] py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                                >
                                  <span className="material-symbols-outlined text-sm">cancel</span>
                                  <span>Reject</span>
                                </button>
                                <button
                                  onClick={() => setShowOfferForm(true)}
                                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                                >
                                  <span className="material-symbols-outlined text-sm">tune</span>
                                  <span>Counter</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sticky Message Input Controls */}
              <div className="sticky bottom-0 z-20 p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 shadow-md">
                <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-xs">
                  <button type="button" className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" title="Attach Document / Photo">
                    <span className="material-symbols-outlined text-lg">attach_file</span>
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type message regarding price, grade, logistics or delivery date..."
                    className="flex-1 px-2 py-1.5 bg-transparent border-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />

                  <button type="button" className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" title="Add Emoji">
                    <span className="material-symbols-outlined text-lg">sentiment_satisfied</span>
                  </button>

                  <button type="button" className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" title="Voice Note">
                    <span className="material-symbols-outlined text-lg">mic</span>
                  </button>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
                >
                  <span className="hidden sm:inline">Send</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </>
          ) : (
            /* Unselected State in Right Column when no thread is open */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
                <span className="material-symbols-outlined text-3xl">chat</span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Select a Conversation Thread</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                Choose a conversation from the left menu to view messages, review wholesale offers, or start negotiating directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
