import React from 'react';
import { ScreenView, UserRole } from '../types';

interface LandingViewProps {
  onNavigate: (view: ScreenView) => void;
  isAuthenticated?: boolean;
  userRole?: UserRole;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, isAuthenticated = true, userRole = 'farmer' }) => {
  return (
    <div className="min-h-screen bg-surface text-on-background font-sans flex flex-col relative overflow-x-hidden pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center px-4 md:px-10 py-16 pt-20 overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/80 to-transparent"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Glass Card */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 glass-panel p-8 md:p-10 rounded-3xl slide-up">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="font-bold text-xs uppercase tracking-widest">Next-Gen Agronomy</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl text-on-surface font-extrabold max-w-2xl leading-tight">
              The Future of Farming is <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-emerald-500">
                Intelligent
              </span>
            </h1>

            <p className="text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Empower your agribusiness with precision AI. Optimize crop yields, analyze complex weather patterns in
              real-time, and connect directly with enterprise buyers through a seamless platform.
            </p>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2 w-full sm:w-auto">
              {isAuthenticated ? (
                <button
                  onClick={() => onNavigate(userRole === 'farmer' ? 'farmer-dashboard' : 'marketplace')}
                  className="bg-primary hover:bg-emerald-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl flex items-center justify-center space-x-2 w-full sm:w-auto cursor-pointer shadow-md hover:shadow-lg transition-all"
                >
                  <span>Go to {userRole === 'farmer' ? 'Farmer Console' : 'Marketplace'}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('onboarding')}
                  className="bg-primary hover:bg-emerald-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl flex items-center justify-center space-x-2 w-full sm:w-auto cursor-pointer shadow-md hover:shadow-lg transition-all"
                >
                  <span>Get Started Free</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              )}
              <button
                onClick={() => onNavigate('marketplace')}
                className="border-2 border-primary text-primary hover:bg-primary/5 font-semibold text-base px-8 py-3.5 rounded-xl flex items-center justify-center space-x-2 w-full sm:w-auto cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined">storefront</span>
                <span>Explore Marketplace</span>
              </button>
            </div>
          </div>

          {/* Right Stats Column */}
          <div className="lg:col-span-5 relative flex flex-col gap-5 justify-center pl-0 lg:pl-8">
            <div className="glass-card rounded-2xl p-6 flex items-center space-x-5 transform hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[30px]">group</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-on-surface mb-0.5">10k+</h3>
                <p className="text-sm text-on-surface-variant font-medium">Active Farmers Daily</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex items-center space-x-5 transform hover:-translate-y-1 transition-transform lg:ml-8">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-blue-600 text-[30px]">agriculture</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-on-surface mb-0.5">5M+</h3>
                <p className="text-sm text-on-surface-variant font-medium">Tons Harvested Analyzed</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex items-center space-x-5 transform hover:-translate-y-1 transition-transform lg:ml-4 border-l-4 border-l-primary">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[30px]">psychology</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-primary mb-0.5">8.48%</h3>
                <p className="text-sm text-on-surface-variant font-medium">Test Split MAPE (LSTM Model)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-10 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-bold text-xs uppercase tracking-wider mb-2 block">Our Platform</span>
            <h2 className="text-3xl md:text-5xl text-on-surface font-extrabold mb-4">Unrivaled Capabilities</h2>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
              Comprehensive tools designed to optimize yield and streamline operations from seed to sale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-outline-variant/30 flex flex-col relative overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-emerald-50 text-primary rounded-2xl flex items-center justify-center mb-6 shrink-0 border border-emerald-100">
                <span className="material-symbols-outlined text-[28px]">psychology</span>
              </div>
              <h3 className="text-2xl text-on-surface font-bold mb-3">Crop & Yield Advisory</h3>
              <p className="text-sm md:text-base text-on-surface-variant flex-grow leading-relaxed">
                Leverage generative AI to receive real-time crop growth forecasts, precision fertilizer schedules,
                and hyper-local soil management insights.
              </p>
              <button
                onClick={() => onNavigate('farmer-dashboard')}
                className="mt-6 font-semibold text-sm text-primary flex items-center group-hover:text-emerald-700 cursor-pointer"
              >
                <span>Explore advisory</span>
                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-outline-variant/30 flex flex-col relative overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-emerald-50 text-primary rounded-2xl flex items-center justify-center mb-6 shrink-0 border border-emerald-100">
                <span className="material-symbols-outlined text-[28px]">handshake</span>
              </div>
              <h3 className="text-2xl text-on-surface font-bold mb-3">Direct Marketplace</h3>
              <p className="text-sm md:text-base text-on-surface-variant flex-grow leading-relaxed">
                Bypass traditional middlemen. Connect directly with enterprise buyers, negotiate contracts securely,
                and manage logistics all within the platform.
              </p>
              <button
                onClick={() => onNavigate('marketplace')}
                className="mt-6 font-semibold text-sm text-primary flex items-center group-hover:text-emerald-700 cursor-pointer"
              >
                <span>Explore marketplace</span>
                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-outline-variant/30 flex flex-col relative overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shrink-0 border border-blue-100">
                <span className="material-symbols-outlined text-[28px]">cloud</span>
              </div>
              <h3 className="text-2xl text-on-surface font-bold mb-3">Weather Intelligence</h3>
              <p className="text-sm md:text-base text-on-surface-variant flex-grow leading-relaxed">
                Hyper-local, AI-driven weather forecasting. Anticipate micro-climate shifts to optimize planting,
                irrigation, and harvesting schedules precisely.
              </p>
              <button
                onClick={() => onNavigate('farmer-dashboard')}
                className="mt-6 font-semibold text-sm text-primary flex items-center group-hover:text-emerald-700 cursor-pointer"
              >
                <span>View Console</span>
                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-6 md:px-10 border-t border-outline-variant/20 bg-white mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="col-span-1 md:col-span-6 flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  spa
                </span>
              </div>
              <div className="font-bold text-xl text-on-surface tracking-tight">
                CloudAgri <span className="text-primary">AI</span>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
              High-Tech Harvest Systems. Bringing enterprise AI to modern agriculture.
            </p>
          </div>

          <div className="col-span-1 md:col-span-3 flex flex-col space-y-2">
            <h4 className="font-bold text-on-surface uppercase tracking-wider text-xs mb-2">Platform</h4>
            <button onClick={() => onNavigate('price-prediction')} className="text-left text-sm text-on-surface-variant hover:text-primary cursor-pointer">
              AI Price Prediction
            </button>
            <button onClick={() => onNavigate('marketplace')} className="text-left text-sm text-on-surface-variant hover:text-primary cursor-pointer">
              Marketplace
            </button>
            <button onClick={() => onNavigate('farmer-dashboard')} className="text-left text-sm text-on-surface-variant hover:text-primary cursor-pointer">
              Farmer Console
            </button>
          </div>

          <div className="col-span-1 md:col-span-3 flex flex-col space-y-2">
            <h4 className="font-bold text-on-surface uppercase tracking-wider text-xs mb-2">Legal</h4>
            <span className="text-sm text-on-surface-variant cursor-pointer hover:text-primary">Privacy Policy</span>
            <span className="text-sm text-on-surface-variant cursor-pointer hover:text-primary">Terms of Service</span>
            <span className="text-sm text-on-surface-variant cursor-pointer hover:text-primary">Cookie Policy</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center text-xs text-on-surface-variant">
          <p>© 2026 CloudAgri AI Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
