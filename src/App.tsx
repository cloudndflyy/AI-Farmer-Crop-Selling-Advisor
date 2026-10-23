import React, { useState, useEffect } from 'react';
import {
  ScreenView,
  UserProfile,
  UserRole,
  ActivityLog,
  CropField,
  MarketplaceItem,
  Language,
  FarmerProfileData,
  BuyerProfileData,
  NotificationItem,
  BuyerType,
  NegotiationOffer,
} from './types';
import {
  MARKETPLACE_ITEMS,
  RECENT_ACTIVITIES,
  CROP_FIELDS,
  INITIAL_FARMER_PROFILE,
  INITIAL_BUYER_PROFILE,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TopNavBar } from './components/TopNavBar';
import { LandingView } from './components/LandingView';
import { OnboardingModal } from './components/OnboardingModal';
import { FarmerDashboardView } from './components/FarmerDashboardView';
import { MarketplaceView } from './components/MarketplaceView';
import { PricePredictionView } from './components/PricePredictionView';
import { FarmerProfileModal } from './components/FarmerProfileModal';
import { BuyerProfileModal } from './components/BuyerProfileModal';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { LiveWeatherModal } from './components/LiveWeatherModal';
import { DirectChatModal } from './components/DirectChatModal';
import { ChatView } from './components/ChatView';

function MainApp() {
  const {
    isAuthenticated,
    user,
    updateUser,
    login,
    logout,
    intendedDestination,
    setIntendedDestination,
    requireAuth,
  } = useAuth();

  const [currentView, setCurrentView] = useState<ScreenView>('landing');

  // Map URL pathname to ScreenView
  const getPathView = (): ScreenView => {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    if (path === '/marketplace') return 'marketplace';
    if (path === '/price-prediction' || path === '/ai-price-prediction') return 'price-prediction';
    if (path === '/console' || path === '/farmer-console' || path === '/farmer-dashboard') return 'farmer-dashboard';
    if (path === '/chat') return 'chat';
    if (path === '/crops') return 'crops';
    if (path === '/analytics') return 'analytics';
    if (path === '/orders') return 'orders';
    if (path === '/products') return 'products';
    if (path === '/onboarding' || path === '/login') return 'onboarding';
    return 'landing';
  };

  // Synchronize on mount and handle popstate (browser back/forward)
  useEffect(() => {
    const initialView = getPathView();
    if (initialView !== 'landing') {
      setCurrentView(initialView);
    }

    const handlePopState = () => {
      const view = getPathView();
      setCurrentView(view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL on view changes
  const handleNavigate = (view: ScreenView) => {
    setCurrentView(view);
    const viewToPath: Record<ScreenView, string> = {
      landing: '/',
      onboarding: '/onboarding',
      'farmer-dashboard': '/console',
      marketplace: '/marketplace',
      'price-prediction': '/price-prediction',
      chat: '/chat',
      crops: '/crops',
      analytics: '/analytics',
      orders: '/orders',
      products: '/products',
      reports: '/console',
      'farmer-profile': '/console',
      'buyer-profile': '/marketplace',
      users: '/console',
    };
    const targetPath = viewToPath[view] || '/';
    if (window.location.pathname !== targetPath) {
      try {
        window.history.pushState(null, '', targetPath);
      } catch (e) {
        // Fallback for sandboxed iframes
      }
    }
  };

  // Intercept authentication requirements from child widgets
  const handleRequireLogin = (dest: ScreenView) => {
    setIntendedDestination(dest);
    handleNavigate('onboarding');
  };

  const [activities, setActivities] = useState<ActivityLog[]>(RECENT_ACTIVITIES);
  const [cropFields, setCropFields] = useState<CropField[]>(CROP_FIELDS);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(MARKETPLACE_ITEMS);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Weather & Direct Chat Modals State
  const [liveWeatherModalOpen, setLiveWeatherModalOpen] = useState<boolean>(false);
  const [chatModalOpen, setChatModalOpen] = useState<boolean>(false);
  const [selectedChatProduct, setSelectedChatProduct] = useState<MarketplaceItem | null>(null);

  // Offers & Negotiation State
  const [offers, setOffers] = useState<NegotiationOffer[]>([
    {
      id: 'off-101',
      productId: 'm-1',
      productTitle: 'Sharbati Wheat (Golden Grain)',
      buyerName: 'Gujarat Flour Mills Co.',
      originalPrice: 2450,
      offeredPrice: 2350,
      quantity: 100,
      unit: 'Quintal',
      totalAmount: 235000,
      status: 'Pending',
      createdAt: 'Today, 10:30 AM',
      notes: 'Requesting discount for bulk 100 Quintal purchase with instant payment.',
    },
    {
      id: 'off-102',
      productId: 'm-2',
      productTitle: 'Organic Basmati Rice (1121)',
      buyerName: 'Kandla Agro Exporters',
      originalPrice: 6800,
      offeredPrice: 6600,
      quantity: 50,
      unit: 'Quintal',
      totalAmount: 330000,
      status: 'Pending',
      createdAt: 'Yesterday',
      notes: 'Need phytosanitary export laboratory certificate included.',
    },
  ]);

  // Profiles & Notifications & Wishlist State
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfileData>(INITIAL_FARMER_PROFILE);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfileData>(INITIAL_BUYER_PROFILE);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [wishlistIds, setWishlistIds] = useState<string[]>(INITIAL_BUYER_PROFILE.wishlistIds);

  const [farmerProfileModalOpen, setFarmerProfileModalOpen] = useState<boolean>(false);
  const [buyerProfileModalOpen, setBuyerProfileModalOpen] = useState<boolean>(false);

  // Active Crop Prediction Telemetry Context for Global AI Assistant
  const [predictedCropContext, setPredictedCropContext] = useState({
    crop: 'Onion (Nashik Red / Local)',
    market: 'Ahmedabad APMC Mandi, Gujarat',
    todayPrice: 1800,
    expectedPrice: 2150,
    priceDiff: 350,
    forecastHorizon: 7,
    trend: '↑ May Increase',
  });

  const handleOpenChatForProduct = (item?: MarketplaceItem) => {
    if (!requireAuth('chat')) return;
    if (item) {
      setSelectedChatProduct(item);
    } else {
      setSelectedChatProduct(marketplaceItems[0] || null);
    }
    handleNavigate('chat');
  };

  const handleAcceptOffer = (offerId: string) => {
    if (!requireAuth('farmer-dashboard')) return;
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'Accepted' as const } : o))
    );
    const matched = offers.find((o) => o.id === offerId);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Negotiation Offer Accepted!',
        description: `You accepted ${matched?.buyerName}'s offer of ₹${matched?.offeredPrice}/${matched?.unit}.`,
        time: 'Just now',
        type: 'offer_received',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleRejectOffer = (offerId: string) => {
    if (!requireAuth('farmer-dashboard')) return;
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'Rejected' as const } : o))
    );
  };

  const handleCounterOffer = (offerId: string, counterPrice: number, notes?: string) => {
    if (!requireAuth('farmer-dashboard')) return;
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'Countered' as const,
              counterPrice,
              notes: notes || `Farmer counter offer set to ₹${counterPrice}`,
            }
          : o
      )
    );
  };

  const handleSendNewBuyerOffer = (offerData: Omit<NegotiationOffer, 'id' | 'status' | 'createdAt'>) => {
    if (!requireAuth('chat')) return;
    const newOff: NegotiationOffer = {
      ...offerData,
      id: `off-${Date.now()}`,
      status: 'Pending',
      createdAt: 'Just now',
    };
    setOffers((prev) => [newOff, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Counter Offer Submitted',
        description: `Your offer of ₹${offerData.offeredPrice}/${offerData.unit} was submitted to ${offerData.productTitle} seller.`,
        time: 'Just now',
        type: 'offer_received',
        read: false,
      },
      ...prev,
    ]);
  };

  const lang = user?.language || 'en';

  const handleLanguageChange = (newLang: Language) => {
    if (user) {
      updateUser({ language: newLang });
    }
  };

  const handleRoleChange = (role: UserRole) => {
    if (user) {
      updateUser({ role });
    }
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    if (!requireAuth('marketplace')) return;
    if (wishlistIds.includes(productId)) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
    } else {
      setWishlistIds((prev) => [...prev, productId]);
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Item Saved to Wishlist',
        description: 'You saved a new produce listing to your buyer wishlist.',
        time: 'Just now',
        type: 'general',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSimulateNotification = (type: NotificationItem['type']) => {
    if (!isAuthenticated) return;
    let title = 'New Notification';
    let description = 'System update received.';

    if (type === 'product_sold') {
      title = 'Product Sold Alert';
      description = `Your listing 'Sharbati Wheat (50 Quintals)' was sold for ₹1,22,500 to Gujarat Food Traders.`;
    } else if (type === 'offer_received') {
      title = 'New Bulk Offer Received';
      description = `Kandla Exports offered ₹2,480/Quintal for 100 Quintals of Organic Wheat.`;
    } else if (type === 'message_received') {
      title = 'Message Received from Buyer';
      description = `Rajesh Shah: "Please share transport tracking code for invoice #INV-8839."`;
    } else if (type === 'order_placed') {
      title = 'Purchase Order Placed';
      description = `Order #ORD-${Math.floor(100 + Math.random() * 900)} successfully placed with Escrow Guarantee.`;
    }

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      description,
      time: 'Just now',
      type,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleAddFarmerReview = (farmerId: string, rating: number, comment: string) => {
    if (!requireAuth('marketplace')) return;
    const newRev = {
      id: `rev-${Date.now()}`,
      reviewerName: user?.name || 'Verified Buyer',
      reviewerRole: user?.buyerType ? `${user.buyerType} Buyer` : 'Direct Agri Buyer',
      rating,
      comment,
      date: 'Just now',
    };

    setFarmerProfile((prev) => {
      const updatedReviews = [newRev, ...prev.reviews];
      const avgRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
      return {
        ...prev,
        reviews: updatedReviews,
        rating: Number(avgRating.toFixed(1)),
        reviewCount: updatedReviews.length,
      };
    });
  };

  const handleUpdateBuyerType = (newType: BuyerType) => {
    setBuyerProfile((prev) => ({ ...prev, buyerType: newType }));
    if (user) {
      updateUser({ buyerType: newType });
    }
  };

  // Farmer Product Management CRUD
  const handleSaveProduct = (newItem: Omit<MarketplaceItem, 'id' | 'postedDate' | 'trustScore'>) => {
    if (!requireAuth('marketplace')) return;
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    const created: MarketplaceItem = {
      ...newItem,
      id: `m-${Date.now()}`,
      postedDate: dateStr,
      trustScore: 98,
      sellerId: user?.farmerId || 'FID-883920',
    };
    setMarketplaceItems((prev) => [created, ...prev]);

    setFarmerProfile((prev) => ({
      ...prev,
      productsListedCount: prev.productsListedCount + 1,
    }));

    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      title: 'New Crop Listing Published',
      description: `Listed ${newItem.title} (${newItem.availableQuantity} ${newItem.unit}) @ ₹${newItem.price}/${newItem.unit}.`,
      type: 'market',
      statusColor: 'primary',
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleUpdateProduct = (id: string, updated: Partial<MarketplaceItem>) => {
    if (!requireAuth('marketplace')) return;
    setMarketplaceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteProduct = (id: string) => {
    if (!requireAuth('marketplace')) return;
    setMarketplaceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleProductStatus = (id: string) => {
    if (!requireAuth('marketplace')) return;
    setMarketplaceItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'Available' ? 'Sold' : 'Available';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleWaterField = (fieldId: string) => {
    if (!requireAuth('farmer-dashboard')) return;
    setCropFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            lastWatered: 'Just now',
            soilMoisture: '78% Optimal',
            status: 'Healthy',
          };
        }
        return f;
      })
    );

    const targetField = cropFields.find((f) => f.id === fieldId);
    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      title: 'Automated Irrigation Cycle',
      description: `Watering sequence executed for ${targetField?.name || 'Selected Field'}.`,
      type: 'irrigation',
      statusColor: 'primary',
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const wishlistProducts = marketplaceItems.filter((m) => wishlistIds.includes(m.id));
  const farmerProductsList = marketplaceItems.filter(
    (m) =>
      m.sellerId === (farmerProfile.farmerId || user?.farmerId) ||
      m.sellerName.includes(farmerProfile.name || user?.name || '')
  );

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header Navigation (Always visible except in dedicated full-page onboarding) */}
      {currentView !== 'onboarding' && (
        <TopNavBar
          currentView={currentView}
          onNavigate={handleNavigate}
          user={user}
          onRoleChange={handleRoleChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLanguageChange={handleLanguageChange}
          notifications={notifications}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onSimulateNotification={handleSimulateNotification}
          onOpenFarmerProfile={() => {
            if (requireAuth('farmer-dashboard')) setFarmerProfileModalOpen(true);
          }}
          onOpenBuyerProfile={() => {
            if (requireAuth('marketplace')) setBuyerProfileModalOpen(true);
          }}
          isAuthenticated={isAuthenticated}
          onSignOut={() => {
            logout();
            handleNavigate('landing');
          }}
        />
      )}

      {/* 1. PUBLIC MARKETING & HERO LANDING PAGE */}
      {currentView === 'landing' && (
        <LandingView
          onNavigate={handleNavigate}
          isAuthenticated={isAuthenticated}
          userRole={user?.role || 'farmer'}
        />
      )}

      {/* 2. AUTHENTICATION & ONBOARDING PORTAL */}
      {currentView === 'onboarding' && (
        <OnboardingModal
          user={user}
          onLogin={(userData, targetDest) => {
            const finalDest = login(userData, targetDest);
            handleNavigate(finalDest);
          }}
          onNavigate={handleNavigate}
          intendedDestination={intendedDestination}
        />
      )}

      {/* 3. PROTECTED: FARMER CONSOLE & IOT DASHBOARD */}
      {(currentView === 'farmer-dashboard' ||
        currentView === 'crops' ||
        currentView === 'analytics' ||
        currentView === 'orders' ||
        currentView === 'products' ||
        currentView === 'reports') && (
        <ProtectedRoute
          view="farmer-dashboard"
          title="Farmer Console"
          description="Access smart farm IoT sensors, automated irrigation controls, live crop health, and incoming negotiation offers."
          icon="agriculture"
          onNavigate={handleNavigate}
        >
          {user && (
            <FarmerDashboardView
              user={user}
              onNavigate={handleNavigate}
              activities={activities}
              cropFields={cropFields}
              marketplaceItems={marketplaceItems}
              offers={offers}
              onOpenLiveWeather={() => setLiveWeatherModalOpen(true)}
              onOpenChat={handleOpenChatForProduct}
              onAcceptOffer={handleAcceptOffer}
              onRejectOffer={handleRejectOffer}
              onCounterOffer={handleCounterOffer}
              onWaterField={handleWaterField}
              onSaveProduct={handleSaveProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onToggleProductStatus={handleToggleProductStatus}
              lang={lang}
              onSignOut={() => {
                logout();
                handleNavigate('landing');
              }}
            />
          )}
        </ProtectedRoute>
      )}

      {/* 4. PROTECTED: DIRECT PRODUCE MARKETPLACE */}
      {currentView === 'marketplace' && (
        <ProtectedRoute
          view="marketplace"
          title="Produce Marketplace"
          description="Explore verified agricultural produce listings, connect directly with farmers, and execute fair trade contracts."
          icon="storefront"
          onNavigate={handleNavigate}
        >
          {user && (
            <MarketplaceView
              user={user}
              items={marketplaceItems}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSaveProduct={handleSaveProduct}
              onUpdateProduct={handleUpdateProduct}
              lang={lang}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              onOpenFarmerProfile={() => setFarmerProfileModalOpen(true)}
              onOpenChat={handleOpenChatForProduct}
              onNavigate={handleNavigate}
            />
          )}
        </ProtectedRoute>
      )}

      {/* 5. PROTECTED: DEEP LEARNING AI PRICE PREDICTION */}
      {currentView === 'price-prediction' && (
        <ProtectedRoute
          view="price-prediction"
          title="AI Price Prediction Engine"
          description="View recursive multi-step price forecasts powered by LSTM, GRU, RNN, and live APMC Mandi arrivals."
          icon="trending_up"
          onNavigate={handleNavigate}
        >
          <PricePredictionView
            onNavigate={handleNavigate}
            lang={lang}
            onCropContextChange={setPredictedCropContext}
          />
        </ProtectedRoute>
      )}

      {/* 6. PROTECTED: LIVE CHAT & NEGOTIATION */}
      {currentView === 'chat' && (
        <ProtectedRoute
          view="chat"
          title="Direct Chat & Negotiation"
          description="Engage in secure real-time messaging, counter-offer proposals, and transaction agreements."
          icon="chat"
          onNavigate={handleNavigate}
        >
          {user && (
            <ChatView
              user={user}
              offers={offers}
              marketplaceItems={marketplaceItems}
              selectedProduct={selectedChatProduct}
              onNavigate={handleNavigate}
              onSendOffer={handleSendNewBuyerOffer}
              onAcceptOffer={handleAcceptOffer}
              onRejectOffer={handleRejectOffer}
              onCounterOffer={handleCounterOffer}
            />
          )}
        </ProtectedRoute>
      )}

      {/* Live Regional Weather Station Modal (Protected) */}
      {isAuthenticated && (
        <LiveWeatherModal
          isOpen={liveWeatherModalOpen}
          onClose={() => setLiveWeatherModalOpen(false)}
        />
      )}

      {/* Direct Buyer-Farmer Chat & Negotiation Modal (Protected) */}
      {isAuthenticated && user && (
        <DirectChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          user={user}
          product={selectedChatProduct}
          onSendOffer={handleSendNewBuyerOffer}
        />
      )}

      {/* Farmer Profile Modal (Protected) */}
      {isAuthenticated && user && (
        <FarmerProfileModal
          isOpen={farmerProfileModalOpen}
          onClose={() => setFarmerProfileModalOpen(false)}
          farmer={farmerProfile}
          farmerProducts={farmerProductsList}
          user={user}
          lang={lang}
          onAddReview={handleAddFarmerReview}
        />
      )}

      {/* Buyer Profile Modal (Protected) */}
      {isAuthenticated && user && (
        <BuyerProfileModal
          isOpen={buyerProfileModalOpen}
          onClose={() => setBuyerProfileModalOpen(false)}
          buyer={buyerProfile}
          user={user}
          lang={lang}
          wishlistItems={wishlistProducts}
          onUpdateBuyerType={handleUpdateBuyerType}
        />
      )}

      {/* Floating Global AI Assistant */}
      <AIAssistantWidget
        user={user}
        marketplaceItems={marketplaceItems}
        cropFields={cropFields}
        activities={activities}
        lang={lang}
        currentView={currentView}
        onNavigate={handleNavigate}
        activeContext={predictedCropContext}
        isAuthenticated={isAuthenticated}
        onRequireLogin={handleRequireLogin}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider onNavigate={() => {}}>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
