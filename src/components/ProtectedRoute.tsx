import React from 'react';
import { ScreenView } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  view: ScreenView;
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  onNavigate: (view: ScreenView) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  view,
  title,
  description,
  icon,
  children,
  onNavigate,
}) => {
  const { isAuthenticated, isLoading, setIntendedDestination } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-surface px-4">
        <div className="text-center p-8 rounded-2xl bg-white border border-outline-variant/30 shadow-md max-w-sm w-full">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <h3 className="font-extrabold text-base text-on-surface">Checking Authentication</h3>
          <p className="text-xs text-on-surface-variant mt-1">Verifying your secure session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-surface px-4 sm:px-6">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-outline-variant/30 shadow-2xl p-6 sm:p-10 text-center slide-up">
          {/* Security Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-6">
            <span className="material-symbols-outlined text-[16px] text-amber-700">lock</span>
            <span>Authentication Required</span>
          </div>

          {/* Feature Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5 shadow-xs">
            <span className="material-symbols-outlined text-3xl">{icon}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mb-2">
            Access {title}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-md mx-auto">
            {description}
          </p>

          {/* Value Props Box */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 mb-8 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
              <span>Direct access to verified Mandi rates and AI models</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
              <span>Encrypted farmer-to-buyer negotiation & communication</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
              <span>Saved preferences, notifications, and profile intelligence</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setIntendedDestination(view);
                onNavigate('onboarding');
              }}
              style={{
                backgroundColor: '#006c49',
                color: '#FFFFFF',
                borderRadius: '12px',
              }}
              className="w-full py-3.5 px-6 font-bold text-sm hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Log In to Continue to {title}</span>
            </button>

            <button
              onClick={() => {
                setIntendedDestination(view);
                onNavigate('onboarding');
              }}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1F2937',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
              }}
              className="w-full py-3.5 px-6 font-bold text-sm hover:bg-[#F3F4F6] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Create Free Account</span>
            </button>

            <button
              onClick={() => onNavigate('landing')}
              className="w-full py-2.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
