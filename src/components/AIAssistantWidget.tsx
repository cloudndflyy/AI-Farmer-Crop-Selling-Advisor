import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  MarketplaceItem,
  CropField,
  ActivityLog,
  Language,
  ChatMessage,
  ScreenView,
} from '../types';
import { t } from '../data/translations';
import { FormattedAIMessage } from './FormattedAIMessage';

interface AIAssistantWidgetProps {
  user?: UserProfile | null;
  marketplaceItems: MarketplaceItem[];
  cropFields?: CropField[];
  activities?: ActivityLog[];
  lang: Language;
  currentView?: ScreenView;
  onNavigate?: (view: ScreenView) => void;
  activeContext?: {
    crop?: string;
    market?: string;
    todayPrice?: number;
    expectedPrice?: number;
    priceDiff?: number;
    forecastHorizon?: number;
    trend?: string;
  };
  isAuthenticated?: boolean;
  onRequireLogin?: (dest: ScreenView) => void;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  user,
  marketplaceItems,
  cropFields = [],
  activities = [],
  lang = 'en',
  currentView = 'landing',
  onNavigate,
  activeContext,
  isAuthenticated = false,
  onRequireLogin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: t('ai_welcome', lang),
      timestamp: 'Just now',
      suggestedActions: [
        t('chip_today_mandi', lang),
        t('chip_predict_onion', lang),
        t('chip_compare_prices', lang),
        t('chip_find_buyers', lang),
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update initial message if language changes and only 1 message exists
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'msg-welcome') {
        return [
          {
            id: 'msg-welcome',
            sender: 'ai',
            text: t('ai_welcome', lang),
            timestamp: 'Just now',
            suggestedActions: [
              t('chip_today_mandi', lang),
              t('chip_predict_onion', lang),
              t('chip_compare_prices', lang),
              t('chip_find_buyers', lang),
            ],
          },
        ];
      }
      return prev;
    });
  }, [lang]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    if (!isAuthenticated) {
      if (onRequireLogin) {
        onRequireLogin('chat');
      } else if (onNavigate) {
        onNavigate('onboarding');
      }
      return;
    }

    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      // Build comprehensive context
      const websiteContext = {
        activeView: currentView,
        activeCrop: activeContext?.crop || 'Onion',
        activeMarket: activeContext?.market || 'Ahmedabad APMC Mandi',
        todayPrice: activeContext?.todayPrice || 1800,
        expectedPrice: activeContext?.expectedPrice || 2380,
        priceDiff: activeContext?.priceDiff !== undefined ? activeContext?.priceDiff : 580,
        forecastHorizon: activeContext?.forecastHorizon || 7,
        trend: activeContext?.trend || 'May Increase',
        items: marketplaceItems.map((item) => ({
          title: item.title,
          cropName: item.cropName,
          price: item.price,
          unit: item.unit,
          sellerName: item.sellerName,
          location: `${item.village}, ${item.district}, ${item.state}`,
          availableQuantity: item.availableQuantity,
          grade: item.grade,
        })),
        user: {
          name: user?.name || 'Verified User',
          role: user?.role || 'farmer',
          village: user?.village || 'Anand',
          district: user?.district || 'Anand',
          state: user?.state || 'Gujarat',
        },
        fieldsCount: cropFields.length,
      };

      // Conversation memory: send previous turns
      const history = messages
        .filter((m) => !m.isError)
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
          websiteContext,
          language: lang,
        }),
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await res.json();

      if (data.isError) {
        const friendlyErrorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: t('ai_error_friendly', lang),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          canRetry: true,
          failedQuery: query,
        };
        setMessages((prev) => [...prev, friendlyErrorMsg]);
        return;
      }

      const replyText = data.reply || t('ai_error_friendly', lang);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        card: data.card,
        table: data.table,
        suggestedActions: data.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('AI assistant widget error:', error);
      // Clean, farmer-friendly error with retry button - zero technical jargon
      const friendlyErrorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: t('ai_error_friendly', lang),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        canRetry: true,
        failedQuery: query,
      };
      setMessages((prev) => [...prev, friendlyErrorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'ai',
        text: t('ai_welcome', lang),
        timestamp: 'Just now',
        suggestedActions: [
          t('chip_today_mandi', lang),
          t('chip_predict_onion', lang),
          t('chip_compare_prices', lang),
          t('chip_find_buyers', lang),
        ],
      },
    ]);
  };

  // Specific 5 Quick Actions requested by user specification
  const quickActions = [
    {
      label: t('chip_today_mandi', lang),
      icon: 'storefront',
      query: lang === 'hi' ? 'आज का मंडी भाव क्या है?' : lang === 'gu' ? 'આજનો મંડી ભાવ શું છે?' : "What is today's wheat mandi price?",
    },
    {
      label: t('chip_predict_onion', lang),
      icon: 'insights',
      query: lang === 'hi' ? 'प्याज़ का अपेक्षित भाव और AI पूर्वानुमान क्या है?' : lang === 'gu' ? 'ડુંગળીનો અંદાજિત ભાવ અને AI આગાહી શું છે?' : 'What is the expected onion price?',
    },
    {
      label: t('chip_compare_prices', lang),
      icon: 'compare_arrows',
      query: lang === 'hi' ? 'सभी प्रमुख फ़सलों के आज के मंडी भावों की तुलना करें' : lang === 'gu' ? 'મુખ્ય પાકોના મંડી ભાવોની સરખામણી કરો' : "Compare today's mandi rates for major crops",
    },
    {
      label: t('chip_find_buyers', lang),
      icon: 'groups',
      query: lang === 'hi' ? 'मार्केटप्लेस पर खरीदार कैसे खोजें और सीधे बेचें?' : lang === 'gu' ? 'માર્કેટપ્લેસ પર ખરીદદારો કેવી રીતે શોધવા?' : 'How do I find buyers and sell produce directly?',
    },
    {
      label: t('chip_my_crops', lang),
      icon: 'inventory_2',
      query: lang === 'hi' ? 'मेरी सूचीबद्ध फ़सलें और उपलब्ध स्टॉक दिखाएं' : lang === 'gu' ? 'મારા લિસ્ટેડ પાક અને સ્ટોક બતાવો' : 'Show my listed crops and prices',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Chat Drawer Dialog */}
      {isOpen && (
        <div className="w-[360px] sm:w-[440px] h-[590px] max-h-[85vh] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 mb-4">
          {/* Header (CloudAgri Green with crisp white typography and high contrast icons) */}
          <div className="px-4 py-3.5 bg-[#006c49] text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
                <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-[#006c49]"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5 leading-snug">
                  <span>{t('ai_assistant_title', lang)}</span>
                </h3>
                <p className="text-[11px] text-emerald-100 font-medium truncate max-w-[220px]">
                  {t('ai_assistant_subtitle', lang)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                title={t('clear_chat', lang)}
                aria-label={t('clear_chat', lang)}
              >
                <span className="material-symbols-outlined text-[19px]">delete_sweep</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Chat"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages Container (Clean #F8FAFC neutral background, high contrast, zero dark mode inversion) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8FAFC] scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs transition-all ${
                    msg.sender === 'user'
                      ? 'bg-[#ECFDF5] text-[#1F2937] border border-[#A7F3D0] rounded-br-xs font-medium'
                      : 'bg-[#FFFFFF] text-[#1F2937] border border-[#E5E7EB] rounded-bl-xs shadow-xs'
                  }`}
                >
                  {/* AI Branding Tag: Small CloudAgri green accent only */}
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#006c49] mb-2 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
                      <span>CLOUDAGRI AI</span>
                    </div>
                  )}

                  {/* Render Message Body */}
                  {msg.sender === 'ai' ? (
                    <FormattedAIMessage
                      message={msg}
                      onNavigate={(view) => {
                        if (onNavigate) {
                          onNavigate(view);
                          setIsOpen(false);
                        }
                      }}
                      onActionClick={(actionQuery) => handleSendMessage(actionQuery)}
                      onRetry={(query) => handleSendMessage(query || msg.failedQuery)}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-[#1F2937]">{msg.text}</p>
                  )}

                  {/* Timestamp with strong readable contrast */}
                  <span
                    className={`text-[10px] block text-right mt-2 font-medium ${
                      msg.sender === 'user' ? 'text-[#065F46]' : 'text-[#6B7280]'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Smooth Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-[#FFFFFF] text-[#1F2937] rounded-2xl rounded-bl-xs p-3.5 text-xs border border-[#E5E7EB] shadow-xs flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#006c49] animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#006c49] animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-[#006c49] animate-bounce"></span>
                  </div>
                  <span className="text-xs font-semibold text-[#4B5563]">
                    {t('ai_thinking', lang)}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (Neutral, clean, readable #F1F5F9 pills with #374151 text & #D1D5DB border) */}
          <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#E5E7EB] flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(action.query)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#F1F5F9] hover:bg-[#E8F5EF] hover:text-[#006c49] hover:border-[#A7F3D0] text-[#374151] text-[11px] font-semibold border border-[#D1D5DB] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[13px] text-[#006c49]">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Fixed Input Box at Bottom (Crisp white bg, #D1D5DB border, #1F2937 text, CloudAgri green button) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#FFFFFF] border-t border-[#E5E7EB] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('type_message_placeholder', lang)}
              disabled={isTyping}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] text-xs font-medium text-[#1F2937] placeholder:text-[#6B7280]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-[#006c49] hover:bg-[#005237] text-white flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shadow-xs shrink-0"
              aria-label="Send Message"
            >
              <span className="material-symbols-outlined text-[19px]">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <button
        onClick={() => {
          if (!isAuthenticated) {
            if (onRequireLogin) {
              onRequireLogin('chat');
            } else if (onNavigate) {
              onNavigate('onboarding');
            }
            return;
          }
          setIsOpen(!isOpen);
        }}
        className="relative group flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#006c49] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/30"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <span className="material-symbols-outlined text-[24px]">smart_toy</span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#006c49] animate-ping"></span>
        </div>
        <span className="font-bold text-xs tracking-wide hidden sm:inline">
          {t('ai_assistant_title', lang)}
        </span>
      </button>
    </div>
  );
};
