import React, { useState } from 'react';
import { BuyerProfileData, BuyerType, MarketplaceItem, Language, UserProfile } from '../types';
import { t } from '../data/translations';

interface BuyerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyer: BuyerProfileData;
  user: UserProfile;
  lang: Language;
  wishlistItems: MarketplaceItem[];
  onUpdateBuyerType: (newType: BuyerType) => void;
  onSelectProduct?: (item: MarketplaceItem) => void;
}

export const BuyerProfileModal: React.FC<BuyerProfileModalProps> = ({
  isOpen,
  onClose,
  buyer,
  user,
  lang,
  wishlistItems,
  onUpdateBuyerType,
  onSelectProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'orders' | 'settings'>('wishlist');

  if (!isOpen) return null;

  const buyerTypes: { type: BuyerType; label: string; icon: string }[] = [
    { type: 'Retailer', label: t('retailer', lang), icon: 'store' },
    { type: 'Wholesaler', label: t('wholesaler', lang), icon: 'domain' },
    { type: 'Restaurant', label: t('restaurant', lang), icon: 'restaurant' },
    { type: 'Exporter', label: t('exporter', lang), icon: 'flight_takeoff' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-3xl w-full my-8 slide-up shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex justify-between items-start pb-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 material-symbols-outlined text-2xl">
              storefront
            </span>
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">{t('buyer_profile', lang)}</span>
              <h2 className="text-2xl font-extrabold text-on-surface">{user.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container cursor-pointer text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="py-4 border-b border-outline-variant/20 flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-amber-500"
          />

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="font-extrabold text-lg text-on-surface">{buyer.companyName || user.farmName || 'Agri Buyer Co.'}</span>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase">
                {buyer.buyerType}
              </span>
            </div>

            <p className="text-xs text-on-surface-variant font-medium flex items-center justify-center md:justify-start gap-1">
              <span className="material-symbols-outlined text-sm text-amber-600">location_on</span>
              {user.village || buyer.village}, {user.district || buyer.district}, {user.state || buyer.state}
            </p>

            {/* Metrics Pills */}
            <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start text-xs font-bold">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-700">favorite</span>
                <span>{wishlistItems.length} {t('my_wishlist', lang)}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-amber-600">shopping_bag</span>
                <span>{buyer.orders.length} {t('total_orders', lang)}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span>{buyer.rating.toFixed(1)} Buyer Trust Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/20 text-xs font-bold my-4">
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-2.5 px-4 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'wishlist'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('my_wishlist', lang)} ({wishlistItems.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-4 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'orders'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('purchase_history', lang)} ({buyer.orders.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-4 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Buyer Type & Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant space-y-2">
                  <span className="material-symbols-outlined text-4xl text-outline">favorite_border</span>
                  <p className="font-bold text-sm text-on-surface">{t('no_wishlist_items', lang)}</p>
                  <p className="text-xs">{t('browse_market_to_save', lang)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectProduct && onSelectProduct(item)}
                      className="p-3.5 rounded-2xl bg-white border border-outline-variant/30 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="text-[10px] font-bold text-amber-800 uppercase">{item.category}</span>
                        <h4 className="font-extrabold text-on-surface truncate group-hover:text-amber-800 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-on-surface-variant">{item.sellerName}</p>
                        <p className="font-black text-amber-900 text-sm mt-0.5">₹{item.price.toLocaleString('en-IN')} / {item.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {buyer.orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl bg-white border border-outline-variant/30 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-sm text-on-surface">{ord.productTitle}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-on-surface-variant">Order #{ord.id} • Seller: {ord.sellerName}</p>
                    <p className="text-on-surface-variant font-medium">Quantity: {ord.quantity} {ord.unit}s • Date: {ord.date}</p>
                  </div>

                  <div className="text-right font-black text-sm text-primary">
                    ₹{ord.totalPrice.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-extrabold text-sm text-on-surface mb-2">{t('buyer_type', lang)}</h4>
                <p className="text-on-surface-variant mb-3">Select your business classification to receive tailored bulk quotes & tax invoices.</p>

                <div className="grid grid-cols-2 gap-3">
                  {buyerTypes.map((bt) => (
                    <button
                      key={bt.type}
                      onClick={() => onUpdateBuyerType(bt.type)}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        buyer.buyerType === bt.type
                          ? 'border-2 border-amber-600 bg-amber-50/70 shadow-xs'
                          : 'border-outline-variant/30 bg-white hover:border-amber-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-amber-800">{bt.icon}</span>
                      <div>
                        <span className="font-extrabold text-on-surface block text-sm">{bt.label}</span>
                        <span className="text-[10px] text-on-surface-variant">Click to select</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
