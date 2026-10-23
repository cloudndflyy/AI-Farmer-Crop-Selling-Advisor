import React, { useState } from 'react';
import { ScreenView, UserRole, UserProfile, Language, NotificationItem } from '../types';
import { t } from '../data/translations';

interface TopNavBarProps {
  currentView: ScreenView;
  onNavigate: (view: ScreenView) => void;
  user?: UserProfile | null;
  onRoleChange: (role: UserRole) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLanguageChange: (lang: Language) => void;
  notifications: NotificationItem[];
  onMarkAllNotificationsRead: () => void;
  onSimulateNotification: (type: NotificationItem['type']) => void;
  onOpenFarmerProfile: () => void;
  onOpenBuyerProfile: () => void;
  isAuthenticated?: boolean;
  onSignOut?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onNavigate,
  user,
  onRoleChange,
  searchQuery,
  onSearchChange,
  onLanguageChange,
  notifications,
  onMarkAllNotificationsRead,
  onSimulateNotification,
  onOpenFarmerProfile,
  onOpenBuyerProfile,
  isAuthenticated = false,
  onSignOut,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const lang = user?.language || 'en';
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 h-16 bg-surface/90 dark:bg-inverse-surface/90 backdrop-blur-md shadow-xs border-b border-outline-variant/20 transition-all duration-300">
      {/* Brand Logo & Search */}
      <div className="flex items-center gap-4 md:gap-8">
        <button
          onClick={() => {
            // Clicking CloudAgri AI logo navigates to Home and NEVER logs out!
            onNavigate('landing');
          }}
          className="flex items-center gap-2 cursor-pointer group text-left"
          title="CloudAgri AI Home"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              spa
            </span>
          </div>
          <span className="font-bold text-xl md:text-2xl text-primary dark:text-primary-fixed-dim tracking-tight">
            CloudAgri <span className="text-primary-container">AI</span>
          </span>
        </button>

        {/* Search Bar - Visible on desktop */}
        {currentView !== 'landing' && currentView !== 'onboarding' && (
          <div className="relative hidden lg:block w-60 xl:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                currentView === 'marketplace'
                  ? t('search_placeholder_market', lang)
                  : t('search_placeholder_console', lang)
              }
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-medium transition-shadow"
            />
          </div>
        )}
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
        <button
          onClick={() => onNavigate('marketplace')}
          className={`font-bold text-xs lg:text-sm transition-colors cursor-pointer py-1 ${
            currentView === 'marketplace'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-extrabold'
              : 'text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400'
          }`}
        >
          {t('marketplace', lang)}
        </button>
        <button
          onClick={() => onNavigate('price-prediction')}
          className={`font-bold text-xs lg:text-sm transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentView === 'price-prediction'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-extrabold'
              : 'text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
          <span>{t('ai_price_prediction', lang) || 'AI Price Prediction'}</span>
        </button>
        <button
          onClick={() => onNavigate('farmer-dashboard')}
          className={`font-bold text-xs lg:text-sm transition-colors cursor-pointer py-1 ${
            currentView === 'farmer-dashboard' || currentView === 'crops'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-extrabold'
              : 'text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400'
          }`}
        >
          {t('console', lang)}
        </button>
        <button
          onClick={() => onNavigate('chat')}
          className={`font-bold text-xs lg:text-sm transition-colors cursor-pointer py-1 flex items-center gap-1 ${
            currentView === 'chat'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 font-extrabold'
              : 'text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">chat</span>
          <span>Chat</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Global Language Switcher Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-container-high hover:bg-outline-variant/30 text-on-surface font-bold text-xs cursor-pointer transition-all border border-outline-variant/30"
            title="Switch Language (भाषा चुनें / ભાષા શોધો)"
          >
            <span className="material-symbols-outlined text-sm text-primary">language</span>
            <span className="uppercase">{lang}</span>
            <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-44 glass-panel rounded-2xl shadow-xl p-2 z-50 slide-up border border-outline-variant/30">
              <button
                onClick={() => {
                  onLanguageChange('en');
                  setShowLangMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between ${
                  lang === 'en' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>English</span>
                {lang === 'en' && <span className="material-symbols-outlined text-xs">check</span>}
              </button>

              <button
                onClick={() => {
                  onLanguageChange('hi');
                  setShowLangMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between ${
                  lang === 'hi' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>हिंदी (Hindi)</span>
                {lang === 'hi' && <span className="material-symbols-outlined text-xs">check</span>}
              </button>

              <button
                onClick={() => {
                  onLanguageChange('gu');
                  setShowLangMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between ${
                  lang === 'gu' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>ગુજરાતી (Gujarati)</span>
                {lang === 'gu' && <span className="material-symbols-outlined text-xs">check</span>}
              </button>

              <button
                onClick={() => {
                  onLanguageChange('mr');
                  setShowLangMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between ${
                  lang === 'mr' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>मराठी (Marathi)</span>
                {lang === 'mr' && <span className="material-symbols-outlined text-xs">check</span>}
              </button>

              <button
                onClick={() => {
                  onLanguageChange('pa');
                  setShowLangMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between ${
                  lang === 'pa' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>ਪੰਜਾਬੀ (Punjabi)</span>
                {lang === 'pa' && <span className="material-symbols-outlined text-xs">check</span>}
              </button>
            </div>
          )}
        </div>

        {/* Guest Authentication vs Logged-In User Controls */}
        {!isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('onboarding')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1F2937',
                border: '1px solid #D1D5DB',
                borderRadius: '10px',
              }}
              className="font-extrabold text-xs md:text-sm px-4 py-2 hover:bg-[#F3F4F6] transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-[0.98]"
            >
              Log In
            </button>
            <button
              onClick={() => onNavigate('onboarding')}
              className="bg-primary hover:bg-emerald-700 text-white font-extrabold text-xs md:text-sm px-4 py-2 rounded-[10px] flex items-center justify-center transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        ) : user ? (
          <>
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer text-on-surface-variant relative"
                title={t('notifications', lang)}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-surface">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 glass-panel rounded-2xl shadow-2xl p-4 z-50 slide-up border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-on-surface">{t('notifications', lang)}</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-xs text-primary font-bold hover:underline cursor-pointer"
                    >
                      {t('mark_all_read', lang)}
                    </button>
                  </div>

                  {/* Simulation triggers as per request */}
                  <div className="mb-3 p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      {t('simulate_notification', lang)}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => onSimulateNotification('product_sold')}
                        className="px-2 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        + Product Sold
                      </button>
                      <button
                        onClick={() => onSimulateNotification('offer_received')}
                        className="px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        + Offer Received
                      </button>
                      <button
                        onClick={() => onSimulateNotification('message_received')}
                        className="px-2 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        + Message
                      </button>
                      <button
                        onClick={() => onSimulateNotification('order_placed')}
                        className="px-2 py-1 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        + Order Placed
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-on-surface-variant text-center py-4">{t('no_notifications', lang)}</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            !n.read ? 'bg-primary/5 border-primary/20 font-medium' : 'bg-white border-outline-variant/20 text-on-surface-variant'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-extrabold text-on-surface flex items-center gap-1.5">
                              {n.type === 'product_sold' && <span className="material-symbols-outlined text-emerald-600 text-sm">sell</span>}
                              {n.type === 'offer_received' && <span className="material-symbols-outlined text-amber-600 text-sm">local_offer</span>}
                              {n.type === 'message_received' && <span className="material-symbols-outlined text-blue-600 text-sm">chat</span>}
                              {n.type === 'order_placed' && <span className="material-symbols-outlined text-purple-600 text-sm">shopping_cart</span>}
                              {n.title}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">{n.time}</span>
                          </div>
                          <p className="text-[11px] leading-snug">{n.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <button
              onClick={() => {
                const nextRole = user.role === 'farmer' ? 'buyer' : 'farmer';
                onRoleChange(nextRole);
                if (nextRole === 'buyer') {
                  onNavigate('marketplace');
                } else {
                  onNavigate('farmer-dashboard');
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary-container font-extrabold text-xs hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">swap_horiz</span>
              <span>{user.role === 'farmer' ? t('farmer_mode', lang) : t('buyer_mode', lang)}</span>
            </button>

            {/* User Avatar / Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-0.5 rounded-full border-2 border-primary-container cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl shadow-xl p-4 z-50 slide-up border border-outline-variant/30">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-outline-variant/20">
                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-sm text-on-surface leading-tight truncate">{user.name}</h5>
                      <p className="text-xs text-on-surface-variant truncate">{user.farmName || user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {user.tier}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        onOpenFarmerProfile();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-container-high flex items-center gap-2 text-on-surface cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">agriculture</span>
                      <span>{t('farmer_profile', lang)}</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenBuyerProfile();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-container-high flex items-center gap-2 text-on-surface cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-sm text-amber-600">storefront</span>
                      <span>{t('buyer_profile', lang)}</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('onboarding');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-container-high flex items-center gap-2 text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">badge</span>
                      <span>{t('onboarding_account', lang)}</span>
                    </button>

                    <div className="pt-2 mt-2 border-t border-outline-variant/20">
                      <button
                        onClick={() => {
                          if (onSignOut) {
                            onSignOut();
                          } else {
                            onNavigate('landing');
                          }
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-bold"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>{t('sign_out', lang)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-surface glass-panel border-b border-outline-variant/30 p-4 space-y-3 z-40 slide-up">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search_placeholder_market', lang)}
            className="w-full px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm mb-2"
          />
          <div className="grid grid-cols-2 gap-2 text-sm font-bold">
            <button
              onClick={() => {
                onNavigate('marketplace');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-surface-container text-left"
            >
              {t('marketplace', lang)}
            </button>
            <button
              onClick={() => {
                onNavigate('price-prediction');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-surface-container text-left flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600">trending_up</span>
              <span>{t('ai_price_prediction', lang) || 'AI Price Prediction'}</span>
            </button>
            <button
              onClick={() => {
                onNavigate('farmer-dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-surface-container text-left"
            >
              {t('console', lang)}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => {
                  onOpenFarmerProfile();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-surface-container text-left text-primary"
              >
                {t('farmer_profile', lang)}
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onNavigate('onboarding');
                  setMobileMenuOpen(false);
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid #D1D5DB',
                  borderRadius: '10px',
                }}
                className="flex-1 py-2.5 font-extrabold text-xs text-center hover:bg-[#F3F4F6] cursor-pointer shadow-xs"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  onNavigate('onboarding');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 rounded-[10px] bg-primary text-white font-extrabold text-xs text-center hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                Get Started
              </button>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  const nextRole = user?.role === 'farmer' ? 'buyer' : 'farmer';
                  onRoleChange(nextRole);
                  onNavigate(nextRole === 'buyer' ? 'marketplace' : 'farmer-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-primary-container text-on-primary-container font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                Switch to {user?.role === 'farmer' ? t('buyer_mode', lang) : t('farmer_mode', lang)}
              </button>
              <button
                onClick={() => {
                  if (onSignOut) onSignOut();
                  else onNavigate('landing');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>{t('sign_out', lang)}</span>
              </button>
            </div>
          ) : null}
        </div>
      )}
    </header>
  );
};
