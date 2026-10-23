import React, { useState, useEffect } from 'react';
import { PricePredictionResponse, Language } from '../types';
import { generateDeterministicPrediction } from '../utils/pricePredictionEngine';
import { SUPPORTED_CROPS, getCropConfig } from '../data/cropDatasets';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface PricePredictionViewProps {
  onNavigate: (view: any) => void;
  lang: Language;
  onCropContextChange?: (ctx: {
    crop: string;
    market: string;
    todayPrice: number;
    expectedPrice: number;
    priceDiff: number;
    forecastHorizon: number;
    trend: string;
  }) => void;
}

export const PricePredictionView: React.FC<PricePredictionViewProps> = ({ onNavigate, onCropContextChange }) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('onion');
  const [horizon, setHorizon] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [predictionData, setPredictionData] = useState<PricePredictionResponse | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<'30' | '90' | '180' | 'all'>('90');
  const [activeMetricTab, setActiveMetricTab] = useState<'validation' | 'test'>('test');
  const [isTechDetailsOpen, setIsTechDetailsOpen] = useState<boolean>(false);
  const [showMultiModelLines, setShowMultiModelLines] = useState<boolean>(false);

  const activeCropConfig = getCropConfig(selectedCrop);

  const fetchPrediction = async (cropId: string, forecastHorizon: number) => {
    setLoading(true);
    setError(null);

    const targetConfig = getCropConfig(cropId);
    const loadingSteps = [
      `Loading recent Mandi observations for ${targetConfig.displayName}...`,
      'Executing Hybrid Model inference (LSTM + GRU + RNN + Crop Context)...',
      `Finalizing ${forecastHorizon === 1 ? 'next-step' : 'recursive ' + forecastHorizon + '-day'} price forecast...`,
    ];

    let stepIndex = 0;
    setLoadingStep(loadingSteps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < loadingSteps.length) {
        setLoadingStep(loadingSteps[stepIndex]);
      }
    }, 200);

    try {
      const res = await fetch('/api/price-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: cropId.toLowerCase(),
          horizon: forecastHorizon,
        }),
      });

      if (res.ok) {
        const data: PricePredictionResponse = await res.json();
        setPredictionData(data);
        setIsDemoMode(data.mode === 'demo');
        setError(null);
        return;
      }
      throw new Error('Backend response not OK, executing local hybrid model pipeline');
    } catch (err: any) {
      console.warn('Backend prediction endpoint unavailable, running client-side Hybrid model pipeline:', err);
      try {
        const localData = generateDeterministicPrediction({
          crop: cropId.toLowerCase(),
          horizon: forecastHorizon,
          mode: 'demo',
        });
        setPredictionData(localData);
        setIsDemoMode(true);
        setError(null);
      } catch (clientErr: any) {
        console.error('Critical failure running hybrid model:', clientErr);
        setError('Price prediction is temporarily unavailable. Please try again.');
      }
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  // Re-fetch forecast when crop or horizon changes
  useEffect(() => {
    fetchPrediction(selectedCrop, horizon);
  }, [selectedCrop, horizon]);

  // Sync predicted crop context to parent app/assistant
  useEffect(() => {
    if (predictionData && onCropContextChange) {
      const expPrice =
        predictionData.hybrid_prediction?.[predictionData.hybrid_prediction.length - 1] ??
        predictionData.latestPrice;
      const diff = expPrice - predictionData.latestPrice;
      onCropContextChange({
        crop: predictionData.cropDisplayName || predictionData.crop,
        market: predictionData.market,
        todayPrice: predictionData.latestPrice,
        expectedPrice: expPrice,
        priceDiff: diff,
        forecastHorizon: horizon,
        trend: `${diff >= 0 ? '↑' : '↓'} ${predictionData.priceTrend}`,
      });
    }
  }, [predictionData, horizon, onCropContextChange]);

  const handleCropSelect = (cropId: string) => {
    if (cropId === selectedCrop) return;
    setSelectedCrop(cropId);
  };

  const handlePredictClick = () => {
    fetchPrediction(selectedCrop, horizon);
  };

  // Filter chart data based on time range selection
  const getFilteredChartData = () => {
    if (!predictionData?.chartData) return [];
    const parseTs = (d: any) => {
      if (typeof d.timestamp === 'number' && !isNaN(d.timestamp)) return d.timestamp;
      if (d.date) {
        if (d.date.includes('-')) {
          const parts = d.date.split('-');
          return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        if (d.date.includes('/')) {
          const parts = d.date.split('/');
          return Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
      return 0;
    };
    const sorted = [...predictionData.chartData].sort((a, b) => parseTs(a) - parseTs(b));
    let result = sorted;
    if (chartTimeRange === '30') {
      result = sorted.slice(Math.max(0, sorted.length - 30 - horizon));
    } else if (chartTimeRange === '90') {
      result = sorted.slice(Math.max(0, sorted.length - 90 - horizon));
    } else if (chartTimeRange === '180') {
      result = sorted.slice(Math.max(0, sorted.length - 180 - horizon));
    }
    return result.sort((a, b) => parseTs(a) - parseTs(b));
  };

  const filteredChartData = getFilteredChartData();

  // Price calculations for primary farmer-facing view (STRICTLY FROM HYBRID MODEL)
  const currentPrice = predictionData?.latestPrice || activeCropConfig.latestObservation.price;
  const expectedPrice =
    predictionData?.hybrid_prediction?.[predictionData.hybrid_prediction.length - 1] ??
    predictionData?.ensemble_prediction?.[predictionData.ensemble_prediction.length - 1] ??
    currentPrice;

  const priceDiff = expectedPrice - currentPrice;
  const percentChange = ((Math.abs(priceDiff) / (currentPrice || 1)) * 100).toFixed(1);
  const isPositive = priceDiff > 0;
  const isNegative = priceDiff < 0;
  const formattedDiff = `${isPositive ? '+' : isNegative ? '-' : ''}₹${Math.abs(priceDiff).toLocaleString('en-IN')}`;
  const trendText = isPositive ? 'May Increase' : isNegative ? 'May Decrease' : 'May Remain Stable';
  const trendIcon = isPositive ? '↑' : isNegative ? '↓' : '→';

  const retailRate = (((currentPrice) * (activeCropConfig.retailMultiplier || 1.35)) / 100).toFixed(1);

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface pt-20 md:pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-7">
      {/* 1. HEADER SECTION (AI Price Forecast · Crop + Mandi) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full dark:bg-emerald-900/50 dark:text-emerald-300">
              AI Price Forecast
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              {predictionData?.market || activeCropConfig.primaryMarket}
            </span>
            {isDemoMode && (
              <span className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                Demo Mode • {predictionData?.cropDisplayName || activeCropConfig.displayName} Mandi Dataset
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-on-surface flex flex-wrap items-center gap-2">
            <span>AI Price Forecast</span>
            <span className="text-emerald-600 font-bold text-xl md:text-2xl">
              · {predictionData?.cropDisplayName || activeCropConfig.displayName}
            </span>
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant mt-1 font-medium">
            AI price predictions and trend forecasts for {predictionData?.market || activeCropConfig.primaryMarket}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('marketplace')}
            className="px-4 py-2 text-xs md:text-sm font-semibold rounded-xl border border-outline-variant/40 hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">storefront</span>
            <span>View Marketplace</span>
          </button>
          <button
            onClick={() => onNavigate('farmer-dashboard')}
            className="px-4 py-2 text-xs md:text-sm font-semibold rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>
            <span>Farmer Console</span>
          </button>
        </div>
      </div>

      {/* 2. CROP SELECTION & MANDI & FORECAST PERIOD CONTROLS */}
      <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 shadow-xs space-y-4">
        {/* CROP SELECTOR (SUPPORTED CROPS: Onion, Potato, Soyabean, Tomato, Tur) */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-sm">agriculture</span>
              <span>Select Agricultural Crop</span>
            </label>
            <span className="text-xs text-on-surface-variant font-medium">
              Choose from supported crops in the comparative benchmark
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {SUPPORTED_CROPS.map((crop) => {
              const isSelected = selectedCrop.toLowerCase() === crop.id.toLowerCase();
              return (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => handleCropSelect(crop.id)}
                  className={`p-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/40 font-bold'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 font-medium'
                  }`}
                >
                  <span className="text-2xl shrink-0">{crop.icon}</span>
                  <div className="min-w-0">
                    <span className="text-xs md:text-sm font-bold block truncate">
                      {crop.name}
                    </span>
                    <span
                      className={`text-[10px] block truncate ${
                        isSelected ? 'text-emerald-100' : 'text-on-surface-variant'
                      }`}
                    >
                      {crop.variety}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CROP DETAILS & MARKET INFO ROW */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant/20">
              <span className="text-xl">{predictionData?.cropIcon || activeCropConfig.icon}</span>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Active Crop</span>
                <span className="text-xs md:text-sm font-bold text-on-surface">
                  {predictionData?.cropDisplayName || activeCropConfig.displayName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-emerald-600 text-lg">location_on</span>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Market Location</span>
                <span className="text-xs md:text-sm font-bold text-on-surface">
                  {predictionData?.market || activeCropConfig.primaryMarket}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-emerald-600 text-lg">calendar_today</span>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Latest Observation</span>
                <span className="text-xs md:text-sm font-bold text-on-surface">
                  {predictionData?.latestDate
                    ? (predictionData.latestDate.includes('-')
                        ? (() => {
                            const [y, m, d] = predictionData.latestDate.split('-');
                            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                            return `${d} ${months[Number(m) - 1] || ''} ${y}`;
                          })()
                        : predictionData.latestDate)
                    : (activeCropConfig.latestObservation.rawDate || activeCropConfig.latestObservation.date)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePredictClick}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs md:text-sm shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="truncate max-w-[200px]">{loadingStep || 'Updating Forecast...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">auto_graph</span>
                <span>Update Forecast</span>
              </>
            )}
          </button>
        </div>

        {/* FORECAST HORIZON SELECTION */}
        <div className="pt-3 border-t border-outline-variant/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              How far ahead would you like to see the price?
            </label>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              {horizon === 1 ? 'Next Price Prediction (1-Step)' : `Multi-Day Recursive Forecast (${horizon} Days)`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[1, 3, 7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setHorizon(days)}
                className={`py-2.5 px-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer text-center ${
                  horizon === days
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/40'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30'
                }`}
              >
                <span>{days} {days === 1 ? 'Day' : 'Days'}</span>
                <span className="block text-[10px] opacity-80 font-normal">
                  {days === 1 ? '1-Step Next Price' : 'Recursive'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-6 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-red-600">error_outline</span>
          <h3 className="text-base font-bold text-red-800 dark:text-red-300">
            Price prediction is temporarily unavailable. Please try again.
          </h3>
          <p className="text-xs text-red-700 dark:text-red-400 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={handlePredictClick}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Retry Prediction
          </button>
        </div>
      )}

      {/* 3. FOUR MAIN FARMER-FACING CARDS (STRICTLY FROM HYBRID MODEL, ZERO JARGON) */}
      {predictionData && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* CARD 1: Today's Market Price */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Today's Market Price
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">storefront</span>
                </span>
              </div>
              <div className="text-3xl md:text-4xl font-black text-on-surface tracking-tight">
                ₹{currentPrice.toLocaleString('en-IN')}
                <span className="text-sm font-normal text-on-surface-variant ml-1">/ Quintal</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant flex items-center justify-between">
              <span className="truncate max-w-[130px]">{predictionData.market}</span>
              <span className="font-semibold text-on-surface">
                ~₹{retailRate}/kg retail
              </span>
            </div>
          </div>

          {/* CARD 2: EXPECTED MARKET PRICE (HERO ELEMENT - HIGH CONTRAST, CLEAN WHITE/LIGHT BG) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                  <span>✨</span>
                  <span>AI Price Forecast</span>
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-base">auto_graph</span>
                </span>
              </div>

              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block mt-1">
                Expected Market Price
              </span>

              <div className="my-2">
                <div className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight flex items-baseline gap-1">
                  <span>₹{expectedPrice.toLocaleString('en-IN')}</span>
                  <span className="text-sm md:text-base font-semibold text-slate-600 dark:text-slate-400">
                    / Quintal
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/60">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {isPositive
                  ? "Expected to be higher than today's market price"
                  : isNegative
                  ? "Expected to be lower than today's market price"
                  : "Expected to be close to today's market price"}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                AI forecast for the selected period ({horizon} {horizon === 1 ? 'day' : 'days'})
              </span>
            </div>
          </div>

          {/* CARD 3: Expected Change */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Expected Change
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">price_change</span>
                </span>
              </div>
              <div
                className={`text-3xl md:text-4xl font-black tracking-tight ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isNegative
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {formattedDiff}
                <span className="text-sm font-normal text-on-surface-variant ml-1">/ Quintal</span>
              </div>
              <div
                className={`text-base font-extrabold mt-1 ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isNegative
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600'
                }`}
              >
                {isPositive ? `+${percentChange}%` : isNegative ? `-${percentChange}%` : '0%'}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant flex items-center justify-between">
              <span>Compared to today's price</span>
              <span className="font-semibold text-on-surface">Mandi modal</span>
            </div>
          </div>

          {/* CARD 4: Price Trend */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Price Trend
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">trending_up</span>
                </span>
              </div>
              <div
                className={`text-2xl md:text-3xl font-black flex items-center gap-1.5 ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isNegative
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <span>{trendIcon}</span>
                <span className="text-xl md:text-2xl">{trendText}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant flex items-center justify-between">
              <span>Forecast window</span>
              <span className="font-semibold text-on-surface">
                Next {horizon} {horizon === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. DYNAMIC PRICE CHART (Past Market Price & Hybrid Forecast) */}
      {predictionData && !error && (
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">show_chart</span>
                <span>{predictionData.cropDisplayName || activeCropConfig.displayName} Price Trend</span>
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Past market prices and AI forecast ({predictionData.unit}) · {predictionData.market}
              </p>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/20 self-start">
              {[
                { key: '30', label: 'Last 30 Days' },
                { key: '90', label: 'Last 90 Days' },
                { key: '180', label: 'Last 180 Days' },
                { key: 'all', label: 'All History' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setChartTimeRange(tab.key as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    chartTimeRange === tab.key
                      ? 'bg-emerald-600 text-white'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Recharts Graph */}
          <div className="w-full h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickMargin={8}
                  tickFormatter={(val: string) => {
                    if (!val) return '';
                    if (val.includes('-')) {
                      const parts = val.split('-');
                      if (parts.length === 3) {
                        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        const m = parseInt(parts[1], 10) - 1;
                        return `${parts[2]} ${months[m] || ''} '${parts[0].slice(2)}`;
                      }
                    }
                    return val;
                  }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      let formattedLabel = label;
                      if (label && label.includes('-')) {
                        const parts = label.split('-');
                        if (parts.length === 3) {
                          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                          const m = parseInt(parts[1], 10) - 1;
                          formattedLabel = `${parts[2]} ${months[m] || ''} ${parts[0]}`;
                        }
                      }
                      return (
                        <div className="bg-surface-container-highest/95 backdrop-blur-md p-3.5 rounded-xl border border-outline-variant/40 shadow-lg text-xs space-y-1.5">
                          <p className="font-bold text-on-surface">{formattedLabel}</p>
                          {payload.map((item: any) => (
                            <div key={item.dataKey} className="flex justify-between gap-4">
                              <span style={{ color: item.color }} className="font-medium">
                                {item.name}:
                              </span>
                              <span className="font-bold text-on-surface">
                                ₹{Number(item.value).toLocaleString('en-IN')} / Q
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />

                {/* Actual Market Price */}
                <Line
                  type="monotone"
                  dataKey="actualPrice"
                  name="Actual Market Price"
                  stroke="#64748b"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />

                {/* AI Forecast (Hybrid Model) */}
                <Line
                  type="monotone"
                  dataKey="hybridPrice"
                  name="AI Forecast (Hybrid Model)"
                  stroke="#10b981"
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. AI MARKET INSIGHT & DECISION SUPPORT NOTE */}
      {predictionData && !error && (
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">psychology</span>
            <h3 className="text-base md:text-lg font-bold text-on-surface">
              AI Market Insight
            </h3>
          </div>

          <p className="text-sm md:text-base text-on-surface leading-relaxed font-medium">
            "Based on sequential market observations for {predictionData.cropDisplayName} at {predictionData.market}, the AI model projects prices{' '}
            {isPositive ? 'to move higher' : isNegative ? 'to soften' : 'to remain relatively steady'}{' '}
            during the next {horizon} {horizon === 1 ? 'day' : 'days'}."
          </p>

          <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant flex items-start gap-2.5">
            <span className="material-symbols-outlined text-base text-primary shrink-0 mt-0.5">info</span>
            <p className="leading-relaxed">
              AI price forecasts are estimates based on historical APMC mandi trading patterns and serve as decision-support guidance for farmers and buyers.
            </p>
          </div>
        </div>
      )}

      {/* 6. COLLAPSIBLE TECHNICAL MODEL DETAILS (FOR FACULTY & PROJECT EVALUATION) */}
      {predictionData && !error && (
        <div className="border border-outline-variant/30 rounded-2xl bg-surface-container-low overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setIsTechDetailsOpen(!isTechDetailsOpen)}
            className="w-full p-5 md:p-6 flex items-center justify-between text-left hover:bg-surface-container/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-xl">biotech</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span>Technical Model Details & 4-Model Comparison</span>
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    For Project Evaluation
                  </span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Comparative performance of LSTM, GRU, Simple RNN, and the Final Deployed Hybrid Model
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="text-xs font-semibold hidden sm:inline">
                {isTechDetailsOpen ? 'Hide Technical Details' : 'Show Technical Details'}
              </span>
              <span
                className={`material-symbols-outlined transition-transform duration-200 ${
                  isTechDetailsOpen ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </div>
          </button>

          {isTechDetailsOpen && (
            <div className="p-6 pt-4 border-t border-outline-variant/20 space-y-6">
              {/* 4 MODEL ARCHITECTURAL COMPARISON CARDS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-base">compare_arrows</span>
                    <span>Model Comparison Breakdown ({predictionData.cropDisplayName})</span>
                  </h4>
                  <span className="text-xs text-on-surface-variant">
                    Out-of-Sample Test Metrics (c2ompare.ipynb Benchmark)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. LSTM CARD */}
                  <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-xs relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        1. LSTM
                      </span>
                      <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-md">
                        Recurrent Component
                      </span>
                    </div>
                    <div className="text-2xl font-black text-on-surface">
                      ₹{predictionData.lstm_prediction[predictionData.lstm_prediction.length - 1]?.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-on-surface-variant ml-1">/ Quintal</span>
                    </div>
                    <div className="mt-3 text-xs text-on-surface-variant space-y-1.5 pt-3 border-t border-outline-variant/20">
                      <div className="flex justify-between">
                        <span>MAE:</span>
                        <span className="font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].lstm.mae}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>RMSE:</span>
                        <span className="font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].lstm.rmse}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>MAPE:</span>
                        <span className="font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].lstm.mape}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>R² Score:</span>
                        <span className="font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].lstm.r2}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. GRU CARD */}
                  <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-xs relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        2. GRU
                      </span>
                      <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-md">
                        Recurrent Component
                      </span>
                    </div>
                    <div className="text-2xl font-black text-on-surface">
                      ₹{predictionData.gru_prediction[predictionData.gru_prediction.length - 1]?.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-on-surface-variant ml-1">/ Quintal</span>
                    </div>
                    <div className="mt-3 text-xs text-on-surface-variant space-y-1.5 pt-3 border-t border-outline-variant/20">
                      <div className="flex justify-between">
                        <span>MAE:</span>
                        <span className="font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].gru.mae}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>RMSE:</span>
                        <span className="font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].gru.rmse}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>MAPE:</span>
                        <span className="font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].gru.mape}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>R² Score:</span>
                        <span className="font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].gru.r2}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. SIMPLE RNN CARD */}
                  <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-xs relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        3. Simple RNN
                      </span>
                      <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md">
                        Recurrent Component
                      </span>
                    </div>
                    <div className="text-2xl font-black text-on-surface">
                      ₹{predictionData.rnn_prediction[predictionData.rnn_prediction.length - 1]?.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-on-surface-variant ml-1">/ Quintal</span>
                    </div>
                    <div className="mt-3 text-xs text-on-surface-variant space-y-1.5 pt-3 border-t border-outline-variant/20">
                      <div className="flex justify-between">
                        <span>MAE:</span>
                        <span className="font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].rnn.mae}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>RMSE:</span>
                        <span className="font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].rnn.rmse}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>MAPE:</span>
                        <span className="font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].rnn.mape}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>R² Score:</span>
                        <span className="font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].rnn.r2}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. FINAL HYBRID MODEL (DEPLOYED MODEL) */}
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl p-5 border-2 border-emerald-500 shadow-md relative ring-2 ring-emerald-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                        <span>4. HYBRID MODEL</span>
                      </span>
                      <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                        Final Model
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                      ₹{predictionData.hybrid_prediction[predictionData.hybrid_prediction.length - 1]?.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-emerald-700 dark:text-emerald-300 ml-1">/ Quintal</span>
                    </div>
                    <div className="mt-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                      <div className="flex justify-between">
                        <span className="font-bold">MAE:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          ₹{predictionData.metrics[activeMetricTab].hybrid.mae}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>RMSE:</span>
                        <span className="font-semibold">
                          ₹{predictionData.metrics[activeMetricTab].hybrid.rmse}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">MAPE:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          {predictionData.metrics[activeMetricTab].hybrid.mape}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">R² Score:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          {predictionData.metrics[activeMetricTab].hybrid.r2}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {predictionData.weights && (
                  <div className="mt-3 text-xs text-on-surface-variant flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-container">
                    <span className="font-semibold text-on-surface">Hybrid Architecture Head Weighting:</span>
                    <span>
                      LSTM: {(predictionData.weights.lstm * 100).toFixed(0)}% · GRU: {(predictionData.weights.gru * 100).toFixed(0)}% · RNN: {(predictionData.weights.rnn * 100).toFixed(0)}% · Crop Context: {((predictionData.weights.cropWeight || 0.1) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* 4-MODEL EVALUATION METRICS TABLE */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-base">assessment</span>
                    <span>Empirical Performance Comparison for {predictionData.cropDisplayName}</span>
                  </h4>

                  <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/20 self-start">
                    <button
                      type="button"
                      onClick={() => setActiveMetricTab('validation')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeMetricTab === 'validation'
                          ? 'bg-primary text-white'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Validation Split (15%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMetricTab('test')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeMetricTab === 'test'
                          ? 'bg-primary text-white'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Out-of-Sample Test Split (15%)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                  <table className="w-full text-left text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-4">Architecture</th>
                        <th className="py-2.5 px-4">MAE (₹/Quintal)</th>
                        <th className="py-2.5 px-4">RMSE (₹/Quintal)</th>
                        <th className="py-2.5 px-4">MAPE (%)</th>
                        <th className="py-2.5 px-4">R² Score</th>
                        <th className="py-2.5 px-4 text-right">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {/* LSTM */}
                      <tr className="hover:bg-surface-container/40 transition-colors">
                        <td className="py-3 px-4 font-bold flex items-center gap-2 text-on-surface">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span>LSTM (64 Units)</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].lstm.mae}
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].lstm.rmse}
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].lstm.mape}%
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].lstm.r2}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-on-surface-variant">
                          Recurrent Component
                        </td>
                      </tr>

                      {/* GRU */}
                      <tr className="hover:bg-surface-container/40 transition-colors">
                        <td className="py-3 px-4 font-bold flex items-center gap-2 text-on-surface">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                          <span>GRU (64 Units)</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].gru.mae}
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].gru.rmse}
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].gru.mape}%
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].gru.r2}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-on-surface-variant">
                          Recurrent Component
                        </td>
                      </tr>

                      {/* Simple RNN */}
                      <tr className="hover:bg-surface-container/40 transition-colors">
                        <td className="py-3 px-4 font-bold flex items-center gap-2 text-on-surface">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span>Simple RNN (64 Units)</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].rnn.mae}
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          ₹{predictionData.metrics[activeMetricTab].rnn.rmse}
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].rnn.mape}%
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface">
                          {predictionData.metrics[activeMetricTab].rnn.r2}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-on-surface-variant">
                          Recurrent Component
                        </td>
                      </tr>

                      {/* HYBRID MODEL (WINNER / SELECTED MODEL) */}
                      <tr className="bg-emerald-50/70 dark:bg-emerald-950/30 font-bold border-l-4 border-l-emerald-600">
                        <td className="py-3 px-4 flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          <span>HYBRID MODEL (LSTM + GRU + RNN + Crop Context)</span>
                        </td>
                        <td className="py-3 px-4 text-emerald-900 dark:text-emerald-200 font-extrabold">
                          ₹{predictionData.metrics[activeMetricTab].hybrid.mae}
                        </td>
                        <td className="py-3 px-4 text-emerald-900 dark:text-emerald-200 font-extrabold">
                          ₹{predictionData.metrics[activeMetricTab].hybrid.rmse}
                        </td>
                        <td className="py-3 px-4 text-emerald-900 dark:text-emerald-200 font-extrabold">
                          {predictionData.metrics[activeMetricTab].hybrid.mape}%
                        </td>
                        <td className="py-3 px-4 text-emerald-900 dark:text-emerald-200 font-extrabold">
                          {predictionData.metrics[activeMetricTab].hybrid.r2}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                            ⭐ Final Deployed Model (Best Overall)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-on-surface-variant italic">
                  * Note: Evaluation metrics (MAE, RMSE, MAPE, R²) are evaluated on 1-step out-of-sample test splits from the comparative study in c2ompare.ipynb. Multi-day forecasts (3, 7, 14, 30 days) use autoregressive recursive multi-step forecasting where each predicted step slides into the sequential input window.
                </p>
              </div>

              {/* MULTI-MODEL FORECAST LINE COMPARISON */}
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Multi-Model Forecast Comparison
                    </h5>
                    <p className="text-[11px] text-on-surface-variant">
                      Inspect individual LSTM, GRU, Simple RNN, and Hybrid Model forecast lines on the graph
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMultiModelLines(!showMultiModelLines)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      showMultiModelLines
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-high text-on-surface border border-outline-variant/30'
                    }`}
                  >
                    {showMultiModelLines ? 'Hide Model Lines' : 'Show All 4 Model Lines'}
                  </button>
                </div>

                {showMultiModelLines && (
                  <div className="w-full h-64 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(val: string) => {
                            if (!val) return '';
                            if (val.includes('-')) {
                              const parts = val.split('-');
                              if (parts.length === 3) {
                                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                const m = parseInt(parts[1], 10) - 1;
                                return `${parts[2]} ${months[m] || ''}`;
                              }
                            }
                            return val;
                          }}
                        />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="actualPrice" name="Actual Price" stroke="#64748b" strokeWidth={1.5} dot={false} connectNulls={false} />
                        <Line type="monotone" dataKey="lstmPrice" name="LSTM Branch" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={false} />
                        <Line type="monotone" dataKey="gruPrice" name="GRU Branch" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls={false} />
                        <Line type="monotone" dataKey="rnnPrice" name="Simple RNN Branch" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls={false} />
                        <Line type="monotone" dataKey="hybridPrice" name="HYBRID MODEL (Final)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* HYBRID MODEL ARCHITECTURE PIPELINE */}
              <div className="space-y-3 pt-2 border-t border-outline-variant/20">
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">account_tree</span>
                  <span>Hybrid Neural Network Pipeline Architecture</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center mb-1.5">
                      1
                    </span>
                    <span className="font-bold text-xs text-on-surface">Mandi Time-Series</span>
                    <span className="text-[10px] text-on-surface-variant mt-1">
                      Historical APMC Modal Prices ({predictionData.cropDisplayName})
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center mb-1.5">
                      2
                    </span>
                    <span className="font-bold text-xs text-on-surface">30-Obs Sliding Window</span>
                    <span className="text-[10px] text-on-surface-variant mt-1">
                      MinMax Scaled Input Sequence [batch, 30, 1]
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center mb-1.5">
                      3
                    </span>
                    <span className="font-bold text-xs text-on-surface">Parallel Recurrent Heads</span>
                    <span className="text-[10px] text-on-surface-variant mt-1">
                      LSTM (64) + GRU (64) + Simple RNN (64)
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center mb-1.5">
                      4
                    </span>
                    <span className="font-bold text-xs text-on-surface">Crop Context Fusion</span>
                    <span className="text-[10px] text-on-surface-variant mt-1">
                      Concatenation + Crop Embedding Layer
                    </span>
                  </div>

                  {/* Step 5 */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/50 flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-1.5">
                      5
                    </span>
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">Final Hybrid Forecast</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                      Inverse Scaling to Modal ₹/Quintal
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
