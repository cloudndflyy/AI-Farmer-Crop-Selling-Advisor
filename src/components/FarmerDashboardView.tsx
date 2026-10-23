import React, { useState } from 'react';
import { ScreenView, UserProfile, ActivityLog, CropField, MarketplaceItem, Language, NegotiationOffer } from '../types';
import { FarmerProductModal } from './FarmerProductModal';
import { t } from '../data/translations';

interface FarmerDashboardViewProps {
  user: UserProfile;
  onNavigate: (view: ScreenView) => void;
  activities: ActivityLog[];
  cropFields: CropField[];
  marketplaceItems: MarketplaceItem[];
  offers?: NegotiationOffer[];
  onOpenLiveWeather?: () => void;
  onOpenChat?: (item?: MarketplaceItem) => void;
  onAcceptOffer?: (offerId: string) => void;
  onRejectOffer?: (offerId: string) => void;
  onCounterOffer?: (offerId: string, price: number, notes?: string) => void;
  onWaterField: (fieldId: string) => void;
  onSaveProduct: (itemData: Omit<MarketplaceItem, 'id' | 'postedDate' | 'trustScore'>) => void;
  onUpdateProduct: (id: string, updated: Partial<MarketplaceItem>) => void;
  onDeleteProduct: (id: string) => void;
  onToggleProductStatus: (id: string) => void;
  lang?: Language;
  onSignOut?: () => void;
}

export const FarmerDashboardView: React.FC<FarmerDashboardViewProps> = ({
  user,
  onNavigate,
  activities,
  cropFields,
  marketplaceItems,
  offers = [],
  onOpenLiveWeather,
  onOpenChat,
  onAcceptOffer,
  onRejectOffer,
  onCounterOffer,
  onWaterField,
  onSaveProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleProductStatus,
  lang = 'en',
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'crops' | 'products' | 'analytics' | 'orders'>('dashboard');
  const [chartYear, setChartYear] = useState<'2026' | '2025'>('2026');
  const [analyticsMetric, setAnalyticsMetric] = useState<'revenue' | 'orders' | 'visitors' | 'growth'>('revenue');

  // Product management modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);

  const [counterInputId, setCounterInputId] = useState<string | null>(null);
  const [counterPriceVal, setCounterPriceVal] = useState<number>(2300);

  const handleOpenAddProduct = () => {
    setEditingItem(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: MarketplaceItem) => {
    setEditingItem(item);
    setIsProductModalOpen(true);
  };

  // Calculate analytics
  const totalRevenue = 284500;
  const totalOrdersCount = 14;
  const totalQuintalsSold = 185;
  const totalVisitorsCount = 1420;

  return (
    <div className="flex pt-16 min-h-screen bg-background text-on-background font-sans antialiased">
      {/* SideNavBar (Desktop Console Sidebar) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 p-4 border-r border-outline-variant/30 bg-surface-container-low dark:bg-inverse-surface shadow-md z-40">
        <div className="mb-6 px-2 mt-2">
          <h2 className="text-xl font-bold text-primary dark:text-primary-fixed-dim mb-0.5">{t('farmer_console', lang)}</h2>
          <p className="text-xs text-[#D1D5DB] font-medium">{user.village}, {user.district}, {user.state}</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs cursor-pointer transition-all ${
              activeTab === 'dashboard'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-[#D1D5DB] hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-inherit">dashboard</span>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('crops')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs cursor-pointer transition-all ${
              activeTab === 'crops'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-[#D1D5DB] hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-inherit">eco</span>
            <span>Crops ({cropFields.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs cursor-pointer transition-all ${
              activeTab === 'products'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-[#D1D5DB] hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-inherit">storefront</span>
            <span>{t('my_marketplace_produce', lang)} ({marketplaceItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs cursor-pointer transition-all ${
              activeTab === 'analytics'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-[#D1D5DB] hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-inherit">monitoring</span>
            <span>Yield & Revenue Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs cursor-pointer transition-all ${
              activeTab === 'orders'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-[#D1D5DB] hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-inherit">shopping_cart</span>
            <span>Offers & Sales ({offers.length})</span>
          </button>

          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-[#D1D5DB] hover:bg-emerald-900/40 hover:text-white cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-inherit">chat</span>
            <span>Messages & Direct Chat</span>
          </button>

          <button
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-[#D1D5DB] hover:bg-emerald-900/40 hover:text-white cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-inherit">open_in_new</span>
            <span>Buyer Marketplace View</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-outline-variant/30 pt-4">
          <button
            onClick={handleOpenAddProduct}
            className="w-full bg-gradient-to-r from-primary to-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>Add New Produce Listing</span>
          </button>

          <div className="flex flex-col gap-1 text-xs text-on-surface-variant">
            <button
              onClick={() => onNavigate('price-prediction')}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container-high rounded-lg cursor-pointer text-left text-primary font-medium"
            >
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>AI Price Prediction</span>
            </button>
            <button
              onClick={() => {
                if (onSignOut) {
                  onSignOut();
                } else {
                  onNavigate('landing');
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer text-left"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 lg:ml-64 p-4 md:p-10 bg-surface-bright min-h-[calc(100vh-4rem)] flex flex-col justify-between">
        <div>
          {/* Welcome Header */}
          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-on-background mb-1 tracking-tight">
                Namaste, {user.name}!
              </h1>
              <p className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span>{user.farmName} ({user.village}, {user.state}) • Harvest Season Healthy</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onOpenLiveWeather}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm text-amber-600">wb_sunny</span>
                <span>Live Weather Station</span>
              </button>

              <button
                onClick={handleOpenAddProduct}
                className="bg-primary hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>List Produce</span>
              </button>
            </div>
          </header>

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Bento Grid Top Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Weather Widget */}
                <div 
                  onClick={onOpenLiveWeather}
                  className="glass-card rounded-[24px] p-6 flex flex-col justify-between h-48 hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-amber-500"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Live Weather (Anand)</span>
                    <span className="material-symbols-outlined text-amber-500 text-3xl group-hover:scale-110 transition-transform">
                      partly_cloudy_day
                    </span>
                  </div>
                  <div>
                    <div className="text-4xl font-extrabold text-on-background">31°C</div>
                    <div className="text-xs text-on-surface-variant mt-1 font-medium flex items-center justify-between">
                      <span>Humidity 58% • Wind 11 km/h</span>
                      <span className="text-primary font-bold text-[10px] flex items-center">
                        5-Day Forecast <span className="material-symbols-outlined text-xs">chevron_right</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Crop Health Widget */}
                <div className="glass-card rounded-[24px] p-6 flex flex-col justify-between h-48 relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className="absolute inset-0 bg-primary/5 rounded-[24px]"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Crop Health Index</span>
                    <span className="material-symbols-outlined text-primary text-3xl">health_and_safety</span>
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl font-extrabold text-primary">96%</div>
                    <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm text-primary">trending_up</span> Sharbati Wheat Optimal
                    </div>
                  </div>
                </div>

                {/* Active Listings Counter */}
                <div
                  onClick={() => setActiveTab('products')}
                  className="glass-card rounded-[24px] p-6 flex flex-col justify-between h-48 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">My Marketplace Produce</span>
                    <span className="material-symbols-outlined text-tertiary text-3xl group-hover:scale-110 transition-transform">
                      storefront
                    </span>
                  </div>
                  <div>
                    <div className="text-4xl font-extrabold text-on-background">
                      {marketplaceItems.length} <span className="text-xl font-bold text-on-surface-variant">listed</span>
                    </div>
                    <div className="text-xs text-primary mt-1 font-bold flex items-center gap-1">
                      <span>Manage & Add Produce</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </div>
                  </div>
                </div>

                {/* Mandi Price Widget */}
                <div className="glass-card rounded-[24px] p-6 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mandi Rate (Wheat)</span>
                    <span className="material-symbols-outlined text-primary text-3xl">trending_up</span>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-on-background mb-1">₹2,250 / Quintal</div>
                    <div className="inline-flex items-center gap-1 bg-primary-container/20 text-primary px-3 py-1 rounded-full font-bold text-xs">
                      +₹50 Today in Gujarat Mandi
                    </div>
                  </div>
                </div>
              </div>

              {/* Prominent AI Price Prediction Card */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-[24px] p-6 md:p-7 mb-8 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-500/30">
                <div className="space-y-3 z-10 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      AI Price Prediction
                    </span>
                    <span className="text-xs text-emerald-200/80 font-medium">
                      Ahmedabad Onion APMC Mandi
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white">
                      Deep Learning Forecast: ₹2,773 / Quintal
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      LSTM + GRU + RNN ensemble models project an <span className="text-emerald-400 font-bold">Increasing (+3.8%)</span> trend over the next 7 days with high model validation confidence (R² = 0.912).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="bg-white/10 px-3 py-1 rounded-xl">
                      <span className="text-slate-300">7-Day Trend:</span>{' '}
                      <span className="text-emerald-400 font-bold">↑ Increasing</span>
                    </div>
                    <div className="bg-white/10 px-3 py-1 rounded-xl">
                      <span className="text-slate-300">Confidence:</span>{' '}
                      <span className="text-teal-300 font-bold">High (Validation R² 0.912)</span>
                    </div>
                    <div className="bg-white/10 px-3 py-1 rounded-xl">
                      <span className="text-slate-300">Expected Range:</span>{' '}
                      <span className="text-white font-bold">₹2,680 – ₹2,860/Q</span>
                    </div>
                  </div>
                </div>

                <div className="z-10 shrink-0">
                  <button
                    onClick={() => onNavigate('price-prediction')}
                    className="w-full md:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs md:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>View Detailed Forecast</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Lower Section Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* Activities (Left Column) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  {/* Recent Activities Timeline */}
                  <div className="glass-card rounded-[24px] p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-on-background mb-4">Recent Farm Operations</h3>
                    <div className="relative border-l-2 border-outline-variant/40 ml-3 pl-6 flex flex-col gap-6">
                      {activities.map((act) => (
                        <div key={act.id} className="relative">
                          <div
                            className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-surface ${
                              act.type === 'irrigation'
                                ? 'bg-primary'
                                : act.type === 'ai-report'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          ></div>
                          <div className="text-xs font-bold text-primary mb-0.5">{act.timestamp}</div>
                          <div className="text-sm font-bold text-on-background">{act.title}</div>
                          <div className="text-xs text-on-surface-variant">{act.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Analytics Chart (Right Column) */}
                <div className="lg:col-span-2 glass-card rounded-[24px] p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-on-background">Yield Projection & Sales Revenue</h3>
                      <p className="text-xs text-on-surface-variant">Harvest Yield (Quintals) & Mandi Income in ₹</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChartYear(chartYear === '2026' ? '2025' : '2026')}
                        className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-semibold cursor-pointer hover:bg-surface-container-highest"
                      >
                        Season: {chartYear}
                      </button>
                    </div>
                  </div>

                  {/* SVG Chart Area */}
                  <div className="flex-1 relative min-h-[300px] w-full rounded-2xl bg-surface-container-low overflow-hidden flex items-end p-6 border border-outline-variant/20">
                    <div className="absolute inset-0 grid grid-cols-1 grid-rows-4 opacity-10">
                      <div className="border-b border-on-surface"></div>
                      <div className="border-b border-on-surface"></div>
                      <div className="border-b border-on-surface"></div>
                      <div></div>
                    </div>

                    <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d="M0,80 Q20,70 40,50 T80,30 T100,20"
                        fill="none"
                        stroke="rgba(0, 108, 73, 0.3)"
                        strokeDasharray="2 2"
                        strokeWidth="2"
                      />
                      <path
                        d="M0,90 Q15,80 30,60 T60,40 T80,20 T100,10"
                        fill="none"
                        stroke="#006c49"
                        strokeWidth="3.5"
                        className="drop-shadow-sm"
                      />
                    </svg>

                    <div className="absolute right-[10%] top-[12%] z-20 bg-surface px-3 py-2 rounded-xl shadow-md border border-outline-variant/30 text-center">
                      <div className="text-xs font-bold text-primary">+18.4% Revenue Growth</div>
                      <div className="text-[10px] text-on-surface-variant">Est. ₹3,45,000 Direct Sales</div>
                    </div>

                    <div className="relative z-20 w-full flex justify-between text-[11px] font-semibold text-on-surface-variant pt-2">
                      <span>Rabi</span>
                      <span>Kharif</span>
                      <span>Zaid</span>
                      <span>Jul</span>
                      <span>Aug</span>
                      <span>Oct</span>
                      <span>Nov</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MY LISTED PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6 mb-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    <span>Farmer Product Listings Console</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-on-surface">Manage Your Crop Products</h2>
                  <p className="text-xs text-on-surface-variant">
                    Create, edit, delete, or mark products as Sold / Available for direct buyers.
                  </p>
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="bg-gradient-to-r from-primary to-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  <span>+ Add New Product Listing</span>
                </button>
              </div>

              {marketplaceItems.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-3 text-outline">add_shopping_cart</span>
                  <h3 className="text-lg font-bold text-on-surface mb-1">No products listed yet</h3>
                  <p className="text-xs max-w-md mx-auto mb-4">
                    List your harvested crops directly on the marketplace to connect with wholesale buyers and get fair Mandi prices.
                  </p>
                  <button
                    onClick={handleOpenAddProduct}
                    className="bg-primary text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Add Your First Crop Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden"
                    >
                      <div>
                        {/* Image & Status Badge */}
                        <div className="relative mb-3 rounded-xl overflow-hidden h-44 bg-surface-container-low">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          <span
                            className={`absolute top-2 left-2 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs ${
                              item.status === 'Available' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.isOrganic && (
                            <span className="absolute top-2 right-2 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">eco</span> Organic
                            </span>
                          )}
                        </div>

                        {/* Crop Info */}
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-primary uppercase">{item.category}</span>
                          <span className="text-xs font-semibold text-on-surface-variant">{item.grade} Grade</span>
                        </div>

                        <h3 className="font-extrabold text-lg text-on-surface mb-1">{item.title}</h3>
                        <p className="text-xs text-on-surface-variant font-medium mb-3">
                          📍 {item.village}, {item.district}, {item.state}
                        </p>

                        {/* Specs Grid */}
                        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5 text-xs mb-4">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Direct Mandi Price:</span>
                            <span className="font-black text-primary text-sm">₹{item.price.toLocaleString('en-IN')} / {item.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Available Supply:</span>
                            <span className="font-bold text-on-surface">{item.availableQuantity} {item.unit}s</span>
                          </div>
                          {item.harvestDate && (
                            <div className="flex justify-between">
                              <span className="text-on-surface-variant">Harvest Date:</span>
                              <span className="font-semibold text-on-surface">{item.harvestDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CRUD Actions Bar */}
                      <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onToggleProductStatus(item.id)}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center ${
                            item.status === 'Available'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {item.status === 'Available' ? 'Mark Sold' : 'Mark Available'}
                        </button>

                        <button
                          onClick={() => handleOpenEditProduct(item)}
                          className="py-2 px-3 bg-surface-container-high hover:bg-outline-variant/30 text-on-surface rounded-xl font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
                          title="Edit Product"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${item.title}?`)) {
                              onDeleteProduct(item.id);
                            }
                          }}
                          className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs cursor-pointer transition-colors flex items-center"
                          title="Delete Product"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CROPS MANAGER */}
          {activeTab === 'crops' && (
            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">Field & Crop Management</h2>
                  <p className="text-xs text-on-surface-variant">Monitor acreage, irrigation status, and soil moisture.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cropFields.map((field) => (
                  <div key={field.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-base text-on-surface">{field.name}</h3>
                          <span className="text-xs text-primary font-semibold">{field.cropType} • {field.acreage} Acres</span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            field.status === 'Healthy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {field.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-on-surface-variant mb-4">
                        <div className="flex justify-between">
                          <span>Health Score:</span>
                          <span className="font-bold text-on-surface">{field.healthScore}%</span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${field.healthScore}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between pt-1">
                          <span>Stage:</span>
                          <span className="font-semibold text-on-surface">{field.stage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Days to Harvest:</span>
                          <span className="font-semibold text-on-surface">{field.daysToHarvest} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Soil Moisture:</span>
                          <span className="font-semibold text-on-surface">{field.soilMoisture}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onWaterField(field.id)}
                      className="w-full py-2 bg-surface-container-high hover:bg-primary/10 hover:text-primary text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">water_drop</span>
                      <span>Trigger Irrigation Cycle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROFESSIONAL ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 mb-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
                <div>
                  <h2 className="text-2xl font-extrabold text-on-surface">Yield & Business Analytics Console</h2>
                  <p className="text-xs text-on-surface-variant">Real-time breakdown of Mandi sales, buyer visits, and monthly revenue growth.</p>
                </div>

                <div className="flex bg-surface-container-high p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setAnalyticsMetric('revenue')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${analyticsMetric === 'revenue' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'}`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setAnalyticsMetric('orders')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${analyticsMetric === 'orders' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'}`}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setAnalyticsMetric('visitors')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${analyticsMetric === 'visitors' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'}`}
                  >
                    Visitors
                  </button>
                </div>
              </div>

              {/* 5 Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-600">
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant">Total Revenue</span>
                  <div className="text-2xl font-black text-emerald-800 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-1">
                    <span className="material-symbols-outlined text-xs">trending_up</span> +18.4% Monthly
                  </span>
                </div>

                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-600">
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant">Total Orders</span>
                  <div className="text-2xl font-black text-blue-900 mt-1">{totalOrdersCount}</div>
                  <span className="text-[10px] text-blue-700 font-bold mt-1 block">12 Delivered • 2 Active</span>
                </div>

                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant">Total Volume Sold</span>
                  <div className="text-2xl font-black text-amber-900 mt-1">{totalQuintalsSold} <span className="text-xs font-bold">Quintals</span></div>
                  <span className="text-[10px] text-amber-700 font-bold mt-1 block">Wheat & Basmati Rice</span>
                </div>

                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-purple-600">
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant">Listing Views / Visitors</span>
                  <div className="text-2xl font-black text-purple-900 mt-1">{totalVisitorsCount}</div>
                  <span className="text-[10px] text-purple-700 font-bold mt-1 block">From 18 Wholesaler Accounts</span>
                </div>

                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-teal-600">
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant">Products Listed</span>
                  <div className="text-2xl font-black text-teal-900 mt-1">{marketplaceItems.length}</div>
                  <span className="text-[10px] text-teal-700 font-bold mt-1 block">Active on Marketplace</span>
                </div>
              </div>

              {/* Chart & Growth Section */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-lg text-on-surface">Monthly Harvest & Revenue Performance Curve</h3>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">FY 2026 Active Season</span>
                </div>

                <div className="h-64 w-full bg-surface-container-low rounded-xl p-4 relative flex items-end justify-between border border-outline-variant/20 overflow-hidden">
                  {/* Visual Bar Columns */}
                  {[
                    { month: 'Apr', val: 45, rev: '₹42,000' },
                    { month: 'May', val: 60, rev: '₹58,000' },
                    { month: 'Jun', val: 75, rev: '₹72,000' },
                    { month: 'Jul', val: 90, rev: '₹89,000' },
                    { month: 'Aug', val: 100, rev: '₹1,12,000' },
                  ].map((m, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.rev}
                      </div>
                      <div
                        className="w-8 sm:w-12 bg-gradient-to-t from-emerald-800 to-primary rounded-t-xl transition-all group-hover:bg-emerald-600 shadow-xs"
                        style={{ height: `${m.val}%` }}
                      ></div>
                      <span className="text-xs font-bold text-on-surface-variant">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NEGOTIATIONS, ORDERS & SALES */}
          {activeTab === 'orders' && (
            <div className="space-y-8 mb-12">
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-on-surface">Negotiations, Mandis & Wholesale Orders</h2>
                  <p className="text-xs text-on-surface-variant">Review buyer offers, accept terms, send counter-offers, or open direct real-time chat.</p>
                </div>
              </div>

              {/* Section 1: Incoming Buyer Offers */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 space-y-4">
                <h3 className="font-extrabold text-base text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">handshake</span>
                  <span>Incoming Buyer Price Offers & Negotiations ({offers.length})</span>
                </h3>

                {offers.length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant text-xs">
                    No active buyer offers currently. Keep your product prices competitive to attract offers!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.map((off) => (
                      <div
                        key={off.id}
                        className="p-4 rounded-2xl bg-white border border-outline-variant/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-sm text-on-surface">{off.productTitle}</span>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${
                              off.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                              off.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              off.status === 'Countered' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {off.status}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant font-medium">
                            Buyer: <strong className="text-on-surface">{off.buyerName}</strong> • Quantity: {off.quantity} {off.unit}s
                          </p>
                          <div className="flex items-baseline gap-2 mt-1 text-xs">
                            <span>Original Listed: ₹{off.originalPrice}/{off.unit}</span>
                            <span>➔</span>
                            <span className="font-black text-primary text-sm">Buyer Offer: ₹{off.offeredPrice}/{off.unit}</span>
                            <span className="text-on-surface-variant font-bold">(Total: ₹{off.totalAmount.toLocaleString('en-IN')})</span>
                          </div>
                          {off.notes && <p className="text-[11px] text-on-surface-variant italic mt-1">"{off.notes}"</p>}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
                          {off.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => onAcceptOffer && onAcceptOffer(off.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                              >
                                Accept Offer
                              </button>

                              {counterInputId === off.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={counterPriceVal}
                                    onChange={(e) => setCounterPriceVal(Number(e.target.value))}
                                    className="w-20 p-1 border rounded-lg text-xs font-bold"
                                  />
                                  <button
                                    onClick={() => {
                                      if (onCounterOffer) onCounterOffer(off.id, counterPriceVal);
                                      setCounterInputId(null);
                                    }}
                                    className="px-2 py-1 bg-amber-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                                  >
                                    Send
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCounterPriceVal(off.offeredPrice + 100);
                                    setCounterInputId(off.id);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                                >
                                  Counter
                                </button>
                              )}

                              <button
                                onClick={() => onRejectOffer && onRejectOffer(off.id)}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              const matchItem = marketplaceItems.find(i => i.id === off.productId);
                              if (onOpenChat) onOpenChat(matchItem);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-outline-variant/30 text-on-surface font-bold text-xs cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Confirmed Orders History */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/30 space-y-4">
                <h3 className="font-extrabold text-base text-on-surface">Confirmed Bulk Sales & Transit Orders</h3>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white border border-outline-variant/30 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-extrabold text-sm text-on-surface mb-0.5">Order #ORD-9912 • Sharbati Wheat Bulk</div>
                      <p className="text-on-surface-variant font-medium">Buyer: Gujarat Flour Mills Co. • 100 Quintals @ ₹2,200/Quintal</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">In Transit</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-outline-variant/30 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-extrabold text-sm text-on-surface mb-0.5">Order #ORD-8841 • Organic Jyoti Potato</div>
                      <p className="text-on-surface-variant font-medium">Buyer: Mumbai Fresh Retailers • 50 Quintals @ ₹1,400/Quintal</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">Delivered</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal for Add / Edit Product */}
        <FarmerProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          user={user}
          editingItem={editingItem}
          onSaveProduct={onSaveProduct}
          onUpdateProduct={onUpdateProduct}
        />

        {/* Console Footer */}
        <footer className="w-full py-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant mt-8">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">CloudAgri AI</span>
            <span>© 2026 High-Tech Harvest Systems India.</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => onNavigate('price-prediction')} className="hover:text-primary cursor-pointer">AI Price Prediction</button>
            <button onClick={() => onNavigate('marketplace')} className="hover:text-primary cursor-pointer">Marketplace</button>
            <button onClick={() => onNavigate('farmer-dashboard')} className="hover:text-primary cursor-pointer">Farmer Support</button>
          </div>
        </footer>
      </main>
    </div>
  );
};

