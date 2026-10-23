import React, { useState } from 'react';
import { MarketplaceItem, UserProfile, Language } from '../types';
import { ProductDetailModal } from './ProductDetailModal';
import { FarmerProductModal } from './FarmerProductModal';
import { t } from '../data/translations';

interface MarketplaceViewProps {
  user: UserProfile;
  items: MarketplaceItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSaveProduct: (itemData: Omit<MarketplaceItem, 'id' | 'postedDate' | 'trustScore'>) => void;
  onUpdateProduct?: (id: string, updated: Partial<MarketplaceItem>) => void;
  lang?: Language;
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
  onOpenFarmerProfile?: (farmerId?: string) => void;
  onOpenChat?: (item?: MarketplaceItem) => void;
  onNavigate?: (view: any) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  user,
  items,
  searchQuery,
  onSearchChange,
  onSaveProduct,
  onUpdateProduct,
  lang = 'en',
  wishlistIds = [],
  onToggleWishlist,
  onOpenFarmerProfile,
  onOpenChat,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [onlyOrganic, setOnlyOrganic] = useState<boolean>(false);
  const [onlyAiCertified, setOnlyAiCertified] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'trust'>('newest');
  const [statusFilter, setStatusFilter] = useState<'Available' | 'All' | 'Sold'>('Available');

  const [detailModalItem, setDetailModalItem] = useState<MarketplaceItem | null>(null);
  const [activeItemForOrder, setActiveItemForOrder] = useState<MarketplaceItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);

  // Filter listings
  const filteredItems = items.filter((item) => {
    // Status match
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;

    // Search match
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cropName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesGrade = selectedGrade === 'All' || item.grade === selectedGrade;
    const matchesState = selectedState === 'All' || item.state === selectedState || item.location.includes(selectedState);
    const matchesOrganic = !onlyOrganic || item.isOrganic;
    const matchesAi = !onlyAiCertified || item.aiCertified;

    return matchesSearch && matchesCategory && matchesGrade && matchesState && matchesOrganic && matchesAi;
  });

  // Sort listings
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'trust') return b.trustScore - a.trustScore;
    return b.id.localeCompare(a.id); // Default newest
  });

  const featuredItems = items.filter((item) => item.isFeatured && item.status === 'Available');

  const handleConfirmOrder = () => {
    if (!activeItemForOrder) return;
    const totalCost = (activeItemForOrder.price * orderQuantity).toLocaleString('en-IN');
    setOrderSuccessMsg(
      `Purchase Order Confirmed! ${orderQuantity} ${activeItemForOrder.unit} of ${activeItemForOrder.title} (Total: ₹${totalCost}) reserved with ${activeItemForOrder.sellerName}.`
    );
    setActiveItemForOrder(null);
  };

  return (
    <div className="pt-20 min-h-screen bg-background text-on-surface font-sans antialiased pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Marketplace Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-bold mb-2">
              <span className="material-symbols-outlined text-sm">storefront</span>
              <span>{t('direct_marketplace_tag', lang)}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface">{t('agri_marketplace', lang)}</h1>
            <p className="text-sm text-on-surface-variant">{t('browse_produce_sub', lang)}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('search_placeholder_market', lang)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>

            {/* Add Crop Product Button */}
            {user.role === 'farmer' && (
              <button
                onClick={() => setAddProductModalOpen(true)}
                className="bg-gradient-to-r from-primary to-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>{t('add_new_listing', lang)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Order Success Toast */}
        {orderSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex justify-between items-center slide-up">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-700 text-2xl">check_circle</span>
              <p className="text-sm font-semibold">{orderSuccessMsg}</p>
            </div>
            <button
              onClick={() => setOrderSuccessMsg(null)}
              className="text-emerald-800 hover:text-emerald-950 font-bold text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar Filters */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                <h3 className="font-bold text-base text-on-surface">{t('filters_and_search', lang)}</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedGrade('All');
                    setSelectedState('All');
                    setOnlyOrganic(false);
                    setOnlyAiCertified(false);
                    setStatusFilter('Available');
                    onSearchChange('');
                  }}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  {t('clear_all', lang)}
                </button>
              </div>

              {/* Status Filter */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                  {t('availability_status', lang)}
                </h4>
                <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-xl text-xs font-bold text-center">
                  <button
                    onClick={() => setStatusFilter('Available')}
                    className={`py-1.5 rounded-lg cursor-pointer transition-colors ${
                      statusFilter === 'Available' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t('available', lang)}
                  </button>
                  <button
                    onClick={() => setStatusFilter('All')}
                    className={`py-1.5 rounded-lg cursor-pointer transition-colors ${
                      statusFilter === 'All' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t('all', lang)}
                  </button>
                  <button
                    onClick={() => setStatusFilter('Sold')}
                    className={`py-1.5 rounded-lg cursor-pointer transition-colors ${
                      statusFilter === 'Sold' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t('sold', lang)}
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">{t('crop_category', lang)}</h4>
                <div className="space-y-2 text-xs">
                  {['All', 'Grains', 'Fruits', 'Vegetables', 'Pulses', 'Spices'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2.5 cursor-pointer text-on-surface font-medium">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="accent-primary w-4 h-4"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* State Filter */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">{t('state_region', lang)}</h4>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full bg-white border border-outline-variant/50 rounded-xl p-2.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="All">All Indian States</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                </select>
              </div>

              {/* Quality Grade */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">{t('quality_grade', lang)}</h4>
                <div className="space-y-2 text-xs">
                  {['All', 'A+', 'Grade A', 'Grade B'].map((grade) => (
                    <label key={grade} className="flex items-center gap-2.5 cursor-pointer text-on-surface font-medium">
                      <input
                        type="radio"
                        name="grade"
                        checked={selectedGrade === grade}
                        onChange={() => setSelectedGrade(grade)}
                        className="accent-primary w-4 h-4"
                      />
                      <span>{grade}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-outline-variant/20 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-700 text-sm">eco</span>
                    {t('organic_certified_only', lang)}
                  </span>
                  <input
                    type="checkbox"
                    checked={onlyOrganic}
                    onChange={(e) => setOnlyOrganic(e.target.checked)}
                    className="accent-primary w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-sm">verified</span>
                    {t('ai_certified_only', lang)}
                  </span>
                  <input
                    type="checkbox"
                    checked={onlyAiCertified}
                    onChange={(e) => setOnlyAiCertified(e.target.checked)}
                    className="accent-primary w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </aside>

          {/* Main Listings Grid Area */}
          <div className="lg:col-span-9 space-y-8">
            {/* AI Price Intelligence Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-slate-900/90 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-emerald-300 text-xl">insights</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Market Intelligence</span>
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Deep Learning</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Ahmedabad Mandi Onion baseline at <strong className="text-white">₹1,800 / Quintal</strong> (Historical APMC Dataset). Compare listed farm prices against AI fair value.
                  </p>
                </div>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('price-prediction')}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>AI Price Forecast</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>

            {/* AI Recommended / Featured Section */}
            {selectedCategory === 'All' && !searchQuery && statusFilter === 'Available' && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-amber-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                  <h2 className="text-xl font-bold text-on-surface">{t('ai_recommended', lang)}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredItems.map((item) => {
                    const isSaved = wishlistIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="glass-card rounded-2xl p-5 border border-amber-300/40 ai-glow relative overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-all cursor-pointer group"
                        onClick={() => setDetailModalItem(item)}
                      >
                        <div className="flex gap-4">
                          <div className="relative shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.imageAlt || item.title}
                              className="w-28 h-28 rounded-xl object-cover shadow-xs"
                            />
                            {/* Wishlist Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleWishlist) onToggleWishlist(item.id);
                              }}
                              className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer"
                              title="Save to Wishlist"
                            >
                              <span
                                className="material-symbols-outlined text-base block"
                                style={{
                                  fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
                                  color: isSaved ? '#ef4444' : '#ffffff',
                                }}
                              >
                                favorite
                              </span>
                            </button>
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {item.grade}
                              </span>
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                {item.trustScore}% Trust
                              </span>
                            </div>

                            <h3 className="text-lg font-extrabold text-on-surface leading-tight mb-1 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenFarmerProfile) onOpenFarmerProfile(item.sellerId);
                              }}
                              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">person</span>
                              <span>{item.sellerName}</span>
                            </button>

                            <p className="text-[11px] text-on-surface-variant mb-2">{item.location} • {item.distance}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                          <div>
                            <span className="text-2xl font-black text-primary">₹{item.price.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-on-surface-variant"> / {item.unit}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveItemForOrder(item);
                              setOrderQuantity(item.minOrderQuantity || 10);
                            }}
                            className="bg-primary hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                          >
                            {t('request_bulk_quote', lang)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* All Listings Grid */}
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-on-surface">Available Crops ({sortedItems.length})</h2>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant font-bold">{t('sort_by', lang)}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-outline-variant/50 rounded-xl px-3 py-1.5 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="newest">{t('newest', lang)}</option>
                    <option value="price-asc">{t('price_low_high', lang)}</option>
                    <option value="price-desc">{t('price_high_low', lang)}</option>
                    <option value="trust">{t('trust_score_high', lang)}</option>
                  </select>
                </div>
              </div>

              {sortedItems.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 text-outline">search_off</span>
                  <p className="font-bold text-base text-on-surface mb-1">No crops match your current filters</p>
                  <p className="text-xs">Try clearing search filters or checking back as new harvests are published by farmers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedItems.map((item) => {
                    const isSaved = wishlistIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setDetailModalItem(item)}
                        className="bg-white rounded-2xl p-4 border border-outline-variant/30 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <div>
                          <div className="relative mb-3 rounded-xl overflow-hidden h-40">
                            <img
                              src={item.imageUrl}
                              alt={item.imageAlt || item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full">
                              {item.grade}
                            </span>
                            {item.aiCertified && (
                              <span className="absolute top-2 left-14 text-[10px] font-bold text-emerald-950 bg-emerald-200/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">verified</span> AI
                              </span>
                            )}

                            {/* Wishlist Heart Icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleWishlist) onToggleWishlist(item.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer"
                            >
                              <span
                                className="material-symbols-outlined text-sm block"
                                style={{
                                  fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
                                  color: isSaved ? '#ef4444' : '#ffffff',
                                }}
                              >
                                favorite
                              </span>
                            </button>

                            {item.status === 'Sold' && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                <span className="text-xs font-black uppercase tracking-wider text-white bg-red-600 px-3 py-1 rounded-full">
                                  {t('sold_out', lang)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[11px] font-semibold text-primary uppercase">{item.category}</span>
                            <span className="text-[11px] font-semibold text-on-surface-variant">{item.distance}</span>
                          </div>

                          <h3 className="font-bold text-base text-on-surface mb-1 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenFarmerProfile) onOpenFarmerProfile(item.sellerId);
                            }}
                            className="text-xs text-primary font-bold hover:underline block mb-1 cursor-pointer"
                          >
                            {item.sellerName}
                          </button>

                          <p className="text-[11px] text-on-surface-variant mb-3">{item.location}</p>

                          {/* AI Price Prediction Badge & Fair Market Value Insight for Onion/Vegetable listings */}
                          {item.title.toLowerCase().includes('onion') && (
                            <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                              <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-emerald-600">psychology</span>
                                  <span>AI Mandi Value</span>
                                </span>
                                <span className="text-emerald-700 dark:text-emerald-300 font-black">₹1,800/Q</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[11px]">
                                <span className="text-emerald-800 dark:text-emerald-400">
                                  {item.price <= 25 ? '🟢 Fair Market Price' : '🟡 Quality Premium'}
                                </span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  ~₹18 / Kg
                                </span>
                              </div>
                              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 leading-snug">
                                Aligned with Ahmedabad Mandi historical dataset baseline (LSTM model).
                              </p>
                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('price-prediction');
                                  }}
                                  className="mt-1.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>View 7-day detailed forecast</span>
                                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                          <div>
                            {item.oldPrice && (
                              <span className="text-xs text-on-surface-variant line-through mr-1">
                                ₹{item.oldPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                            <span className="text-xl font-black text-on-surface">₹{item.price.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-on-surface-variant"> / {item.unit}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.status === 'Available') {
                                setActiveItemForOrder(item);
                                setOrderQuantity(item.minOrderQuantity || 10);
                              }
                            }}
                            disabled={item.status === 'Sold'}
                            className={`font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs ${
                              item.status === 'Available'
                                ? 'bg-primary hover:bg-emerald-700 text-white'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {item.status === 'Available' ? t('order', lang) : t('sold', lang)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={detailModalItem}
        onClose={() => setDetailModalItem(null)}
        onOrderClick={(item) => {
          setActiveItemForOrder(item);
          setOrderQuantity(item.minOrderQuantity || 10);
        }}
        onOpenChat={onOpenChat}
      />

      {/* Add Product Modal for Farmers */}
      <FarmerProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        user={user}
        onSaveProduct={(data) => {
          onSaveProduct(data);
          setAddProductModalOpen(false);
        }}
      />

      {/* Purchase Order Modal */}
      {activeItemForOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-md w-full slide-up shadow-2xl relative space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-outline-variant/20">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Direct APMC Contract</span>
                <h3 className="text-xl font-extrabold text-on-surface">Reserve Produce Order</h3>
              </div>
              <button
                onClick={() => setActiveItemForOrder(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
                <img src={activeItemForOrder.imageUrl} alt={activeItemForOrder.title} className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <h4 className="font-extrabold text-on-surface">{activeItemForOrder.title}</h4>
                  <p className="text-on-surface-variant">Seller: {activeItemForOrder.sellerName}</p>
                  <p className="font-bold text-primary">₹{activeItemForOrder.price.toLocaleString('en-IN')} / {activeItemForOrder.unit}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Order Quantity ({activeItemForOrder.unit}s)
                </label>
                <input
                  type="number"
                  min={activeItemForOrder.minOrderQuantity || 1}
                  max={activeItemForOrder.availableQuantity || 1000}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <div className="flex justify-between font-extrabold text-sm text-on-surface">
                  <span>Total Mandi Value:</span>
                  <span className="text-primary text-base">₹{(activeItemForOrder.price * orderQuantity).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant">Includes escrow guarantee & AI quality verification badge.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveItemForOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 font-bold text-xs text-on-surface hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
