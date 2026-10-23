export type ScreenView = 
  | 'landing'
  | 'onboarding'
  | 'farmer-dashboard'
  | 'marketplace'
  | 'price-prediction'
  | 'reports'
  | 'crops'
  | 'analytics'
  | 'orders'
  | 'products'
  | 'farmer-profile'
  | 'buyer-profile'
  | 'users'
  | 'chat';

export interface PricePredictionMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
}

export interface ModelMetricsComparison {
  hybrid: PricePredictionMetrics;
  lstm: PricePredictionMetrics;
  gru: PricePredictionMetrics;
  rnn: PricePredictionMetrics;
  ensemble?: PricePredictionMetrics;
}

export interface PricePoint {
  date: string;
  timestamp?: number;
  actualPrice?: number | null;
  forecastPrice?: number | null;
  predictedPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  hybridPrice?: number | null;
  lstmPrice?: number | null;
  gruPrice?: number | null;
  rnnPrice?: number | null;
  ensemblePrice?: number | null;
  isForecast?: boolean;
}

export interface PricePredictionResponse {
  crop: string;
  cropDisplayName: string;
  cropIcon: string;
  market: string;
  state: string;
  unit: string;
  forecastHorizon: number;
  forecastType: 'next_step' | 'recursive_multistep';
  latestDate: string;
  latestPrice: number;
  priceTrend: 'Increasing' | 'Decreasing' | 'Stable';
  trendPercentage: number;
  sevenDayTrend: 'Increasing' | 'Decreasing' | 'Stable';
  thirtyDayTrend: 'Increasing' | 'Decreasing' | 'Stable';
  historicalTrend: 'Increasing' | 'Decreasing' | 'Stable';
  predictedTrend: 'Increasing' | 'Decreasing' | 'Stable';
  hybrid_prediction: number[];
  lstm_prediction: number[];
  gru_prediction: number[];
  rnn_prediction: number[];
  ensemble_prediction: number[];
  forecastDates: string[];
  weights?: {
    lstm: number;
    gru: number;
    rnn: number;
    cropWeight?: number;
  };
  metrics: {
    validation: ModelMetricsComparison;
    test: ModelMetricsComparison;
  };
  expectedRange: {
    min: number;
    max: number;
  };
  confidenceLabel: string;
  aiInsight: string;
  bestModelKey: 'hybrid' | 'lstm' | 'gru' | 'rnn' | 'ensemble';
  chartData: PricePoint[];
  architectureSummary?: string;
  mode?: 'model' | 'demo';
  statusMessage?: string;
}

export type UserRole = 'farmer' | 'buyer';

export type Language = 'en' | 'hi' | 'gu' | 'mr' | 'pa';

export type CropCategory = 'Grains' | 'Fruits' | 'Vegetables' | 'Pulses' | 'Spices';

export type CropUnit = 'Kg' | 'Quintal' | 'Tonne';

export type BuyerType = 'Retailer' | 'Wholesaler' | 'Restaurant' | 'Exporter';

export interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerRole: string;
  rating: number;
  comment: string;
  date: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  sellerName: string;
  status: 'Pending' | 'In Transit' | 'Delivered';
  date: string;
}

export interface FarmerProfileData {
  farmerId: string;
  name: string;
  avatarUrl: string;
  farmName: string;
  village: string;
  district: string;
  state: string;
  experienceYears: number;
  verificationBadge: boolean;
  rating: number;
  reviewCount: number;
  productsListedCount: number;
  productsSoldCount: number;
  reviews: ReviewItem[];
  bio: string;
  soilType: string;
  totalAcreage: number;
}

export interface BuyerProfileData {
  buyerId: string;
  name: string;
  companyName: string;
  avatarUrl: string;
  buyerType: BuyerType;
  village: string;
  district: string;
  state: string;
  rating: number;
  orders: OrderItem[];
  wishlistIds: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'product_sold' | 'offer_received' | 'message_received' | 'order_placed' | 'general';
  read: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  language: Language;
  farmName?: string;
  companyName?: string;
  buyerType?: BuyerType;
  village?: string;
  district?: string;
  state?: string;
  location?: string;
  tier: string;
  avatarUrl: string;
  farmerId?: string;
  buyerId?: string;
  experienceYears?: number;
  bio?: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  cropName: string;
  variety?: string;
  category: CropCategory;
  sellerName: string;
  sellerId?: string;
  village: string;
  district: string;
  state: string;
  location: string;
  distance: string;
  trustScore: number;
  price: number; // Price in ₹
  oldPrice?: number;
  unit: CropUnit;
  grade: 'A+' | 'Grade A' | 'Grade B' | 'Grade C';
  aiCertified: boolean;
  isOrganic: boolean;
  status: 'Available' | 'Sold';
  harvestDate?: string;
  postedDate: string; // Indian date format e.g. 12/11/2026
  description?: string;
  isFeatured?: boolean;
  imageUrl: string;
  additionalImages?: string[];
  imageAlt?: string;
  availableQuantity: number;
  minOrderQuantity?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'irrigation' | 'ai-report' | 'fertilizer' | 'harvest' | 'market';
  statusColor: 'primary' | 'tertiary' | 'outline';
}

export interface CropField {
  id: string;
  name: string;
  cropType: string;
  acreage: number;
  healthScore: number;
  stage: string;
  daysToHarvest: number;
  lastWatered: string;
  soilMoisture: string;
  status: 'Healthy' | 'Needs Attention' | 'Harvest Ready';
  locationSector: string;
}

export interface MarketAdvisorResult {
  recommendedPrice: number;
  marketDemand: 'High' | 'Moderate' | 'Low' | string;
  priceCompetitiveness: 'Highly Competitive' | 'Fair' | 'Overpriced' | string;
  expectedProfit: number;
  confidenceScore: number;
  bestSellingTime: string;
  waitingRecommendation: string;
  riskLevel: 'Low' | 'Medium' | 'High' | string;
  cropAdvisor: {
    fertilizer: string;
    watering: string;
    harvestTime: string;
    storageTips: string;
  };
}

export interface ChatVisualCard {
  type?: 'price_forecast' | 'price_benchmark' | 'stat';
  crop: string;
  icon?: string;
  currentPrice?: number;
  expectedPrice?: number;
  priceDiff?: number;
  percentChange?: string;
  unit?: string;
  trend?: string;
  horizon?: number;
  market?: string;
  note?: string;
}

export interface ChatMandiTableRow {
  crop: string;
  icon?: string;
  price: number | string;
  unit: string;
  market?: string;
  trend?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  card?: ChatVisualCard;
  table?: ChatMandiTableRow[];
  suggestedActions?: string[];
  isError?: boolean;
  canRetry?: boolean;
  failedQuery?: string;
}

export interface NegotiationOffer {
  id: string;
  productId: string;
  productTitle: string;
  buyerName: string;
  buyerId?: string;
  sellerName?: string;
  sellerId?: string;
  originalPrice: number;
  offeredPrice: number;
  counterPrice?: number;
  quantity: number;
  unit: string;
  totalAmount: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Countered';
  notes?: string;
  date?: string;
  createdAt?: string;
  history?: Array<{
    sender: 'buyer' | 'farmer';
    action: 'offer' | 'counter' | 'accept' | 'reject';
    price: number;
    notes?: string;
    timestamp: string;
  }>;
}

export interface DirectChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'farmer';
  text: string;
  timestamp: string;
  offerCard?: {
    offerId: string;
    productTitle: string;
    offeredPrice: number;
    unit: string;
    quantity: number;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Countered';
  };
}

export interface ChatThread {
  id: string;
  productId?: string;
  productTitle?: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

export interface WeatherForecastDay {
  day: string;
  date: string;
  highTemp: number;
  lowTemp: number;
  condition: string;
  icon: string;
  rainProbability: number;
  humidity: number;
  windSpeed: number;
}

export interface LiveWeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  uvIndex: number;
  airQuality: string;
  forecast: WeatherForecastDay[];
}

