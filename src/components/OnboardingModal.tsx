import React, { useState } from 'react';
import { UserProfile, UserRole, Language, ScreenView } from '../types';
import { INITIAL_USER } from '../data/mockData';

interface OnboardingModalProps {
  user?: UserProfile | null;
  onLogin: (userData: UserProfile, targetDestination?: ScreenView) => void;
  onNavigate: (view: ScreenView) => void;
  intendedDestination?: ScreenView | null;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  user,
  onLogin,
  onNavigate,
  intendedDestination,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [email, setEmail] = useState(user?.email || 'badal.kr.8284@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'farmer');
  const [selectedLang, setSelectedLang] = useState<Language>(user?.language || 'en');
  const [fullName, setFullName] = useState(user?.name || 'Badal Kumar');

  const getDestinationName = (dest?: ScreenView | null) => {
    switch (dest) {
      case 'marketplace':
        return 'Marketplace';
      case 'price-prediction':
        return 'AI Price Prediction';
      case 'farmer-dashboard':
      case 'crops':
      case 'analytics':
      case 'orders':
      case 'products':
        return 'Farmer Console';
      case 'chat':
        return 'Chat & Negotiation';
      default:
        return null;
    }
  };

  const destinationLabel = getDestinationName(intendedDestination);

  // Explicit Login action
  const handleDirectLogin = (role: UserRole = selectedRole, customEmail?: string) => {
    const profile: UserProfile = {
      ...(user || INITIAL_USER),
      name: fullName || 'Verified User',
      email: customEmail || email || 'user@cloudagri.ai',
      role,
      language: selectedLang,
    };
    onLogin(profile, intendedDestination || undefined);
  };

  // Google Sign-In Action
  const handleGoogleSignIn = () => {
    const profile: UserProfile = {
      ...(user || INITIAL_USER),
      name: fullName || 'Badal Kumar',
      email: 'cloudly3011@gmail.com',
      role: selectedRole,
      language: selectedLang,
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDKZI321Adgv84YrUbIvzgBnWsYsdjsiewL343JJYRUgzH86LuOYDXY2DE4o4f2-9VgnBQSUL3q4cvN9zYtn7Fh5gCHpbWEtBMyWdqEfIVRodiJkmdR3iOdMq2LdJKHLXV6Qo-BeBNmiXLkKhzqyUDR5rDyNkFNE_nsKxt37mWzcS6ULUkKZkgCK3aTpiIKwqHCkvoOzH2gdVwWKD8lWFYdp40BP1J2lEBwk9XEssN_HIFJE3iWD5jB',
    };
    onLogin(profile, intendedDestination || undefined);
  };

  // Farmer ID Sign-In Action
  const handleFarmerIdSignIn = () => {
    const profile: UserProfile = {
      ...(user || INITIAL_USER),
      name: 'Badal Kumar',
      email: 'farmer.anand@cloudagri.ai',
      role: 'farmer',
      farmerId: 'FID-883920',
      farmName: 'Green Valley Agri Farm',
      language: selectedLang,
    };
    onLogin(profile, intendedDestination || undefined);
  };

  // Finish full registration
  const handleFinishRegistration = () => {
    const profile: UserProfile = {
      ...(user || INITIAL_USER),
      name: fullName || (selectedRole === 'farmer' ? 'Badal Kumar' : 'Verified Buyer'),
      email: email || 'user@cloudagri.ai',
      role: selectedRole,
      language: selectedLang,
    };
    onLogin(profile, intendedDestination || undefined);
  };

  return (
    <div className="bg-background min-h-screen text-on-surface font-sans antialiased relative overflow-x-hidden flex flex-col">
      {/* Background Image & Gradient */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-surface/90 to-surface-container/90 z-10"></div>
        <img
          className="w-full h-full object-cover z-0 filter blur-[2px]"
          alt="Aerial view of high-tech agricultural farm at sunrise"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw5E2rVCybshXHk5Er0OTMJO5Sq78Nds4_CDpAq_M_WZfsFaKZjXmVEWdq2-kox1NOFIYZD3DAqyBoVs9AXq7j-nJG35JBFgrKpnE1IEnH1xvCUDWP57K1XEYIKeaBY0YQT6uRJbpWG44sJYT6pUrnDytc8s9fFQp6ioVHi3ban_R5ar4RUt29YZLLYCsGdG2cRFaoXnYtEJNpMgP_eDrpyjahMVskF_0iKml4cCn1y4BNO8lyTmJm"
        />
      </div>

      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-10 h-16 glass-panel border-b border-white/30">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 cursor-pointer group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              spa
            </span>
          </div>
          <span className="font-extrabold text-xl text-primary tracking-tight">CloudAgri AI</span>
        </button>

        <button
          onClick={() => onNavigate('landing')}
          className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          <span>Home</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex items-center justify-center min-h-screen p-4 md:p-10 pt-24 my-auto">
        <div className="w-full max-w-md relative">
          {/* Intended Destination Notice Banner */}
          {destinationLabel && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 shadow-md text-amber-900 text-xs font-semibold flex items-center gap-2.5 slide-up">
              <span className="material-symbols-outlined text-amber-700 text-lg shrink-0">lock</span>
              <div>
                <strong className="block text-amber-950 font-extrabold">Login Required</strong>
                Sign in to proceed to <span className="underline font-bold">{destinationLabel}</span>.
              </div>
            </div>
          )}

          {/* Mode Switch Tabs (Log In vs Register) */}
          <div className="glass-panel rounded-2xl shadow-2xl p-6 sm:p-8 slide-up w-full">
            <div className="flex border-b border-outline-variant/30 mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 text-sm font-extrabold cursor-pointer border-b-2 transition-all ${
                  authMode === 'login'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setStep(1);
                }}
                className={`flex-1 py-3 text-sm font-extrabold cursor-pointer border-b-2 transition-all ${
                  authMode === 'register'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* TAB 1: LOG IN */}
            {authMode === 'login' && (
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-on-surface mb-1">Welcome Back</h1>
                  <p className="text-xs text-on-surface-variant">
                    {destinationLabel
                      ? `Log in to access ${destinationLabel}`
                      : 'Sign in to access your farm intelligence & marketplace'}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 border border-slate-300 rounded-xl py-3 px-4 hover:bg-slate-50 transition-colors text-xs font-bold cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <img
                      className="w-5 h-5 object-contain"
                      alt="Google icon"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMYd9_3VnkrPl9g6KtUuxYkmNgKd_1Y3-wbbugbdDHgRybD0mmR9o_6ndCLy6KoJgtce0Kslb1in47JMlP2s00MgrndkwWswhVGmF0tfCEpl0SMRRDKl92hx0dUTPzS0Vq1JNe_fz-5jHvtciH4y7UA3rRonMRv9RJ_mAdOaS47C7v9VVQMEIMyDHsBYSkpG1pPypt0xqEYqVBNkOiBMPAvV2A_YD78ABGs4fVoYsehFCKHbxZSgK7"
                    />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFarmerIdSignIn}
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 border border-slate-300 rounded-xl py-3 px-4 hover:bg-slate-50 transition-colors text-xs font-bold cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-emerald-700 text-base">id_card</span>
                    <span>Sign in with Farmer ID (FID-883920)</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px bg-outline-variant/60 flex-1"></div>
                  <span className="text-xs font-bold text-on-surface-variant">OR</span>
                  <div className="h-px bg-outline-variant/60 flex-1"></div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDirectLogin();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="login-email">
                      Email or Phone Number
                    </label>
                    <input
                      id="login-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="badal.kr.8284@gmail.com"
                      className="w-full bg-[#F3F4F6] border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow font-medium"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-on-surface" htmlFor="login-password">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => alert('Password reset link sent to registered phone/email.')}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F3F4F6] border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow font-medium"
                      required
                    />
                  </div>

                  {/* Role Selection for Login */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">Sign In As</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('farmer')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedRole === 'farmer'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">agriculture</span>
                        <span>Farmer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('buyer')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedRole === 'buyer'
                            ? 'bg-amber-50 border-amber-600 text-amber-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">storefront</span>
                        <span>Buyer</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-b from-primary to-[#00513b] text-white rounded-xl py-3 px-4 text-xs font-extrabold hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    <span>Log In to CloudAgri AI</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: REGISTER WIZARD */}
            {authMode === 'register' && (
              <div>
                {/* Step 1 of Register */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-black text-on-surface mb-1">Create Account</h2>
                      <p className="text-xs text-on-surface-variant">Step 1 of 3: Account Credentials</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Badal Kumar"
                        className="w-full bg-[#F3F4F6] border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Email or Phone</label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="farmer@example.com"
                        className="w-full bg-[#F3F4F6] border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#F3F4F6] border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full bg-primary text-white rounded-xl py-3 px-4 text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Next: Select Role</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                )}

                {/* Step 2 of Register: Role Selection */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-black text-on-surface mb-1">Select Your Role</h2>
                      <p className="text-xs text-on-surface-variant">Step 2 of 3: Farmer or Buyer</p>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('farmer')}
                        className={`w-full text-left bg-white border-2 ${
                          selectedRole === 'farmer' ? 'border-primary shadow-md' : 'border-outline-variant/60'
                        } hover:border-primary rounded-xl p-4 transition-all duration-300 flex items-center gap-4 cursor-pointer group`}
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            agriculture
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base text-on-surface font-semibold mb-0.5">I am a Farmer</h3>
                          <p className="text-xs text-on-surface-variant">Sell produce, access AI forecasts, and manage farm fields.</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('buyer')}
                        className={`w-full text-left bg-white border-2 ${
                          selectedRole === 'buyer' ? 'border-tertiary-container shadow-md' : 'border-outline-variant/60'
                        } hover:border-tertiary rounded-xl p-4 transition-all duration-300 flex items-center gap-4 cursor-pointer group`}
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            storefront
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base text-on-surface font-semibold mb-0.5">I am a Buyer</h3>
                          <p className="text-xs text-on-surface-variant">Browse produce, place bulk orders, negotiate with farmers.</p>
                        </div>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="py-3 px-4 border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-slate-50 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="flex-1 bg-primary text-white rounded-xl py-3 px-4 text-xs font-bold hover:bg-emerald-700 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Next: Language</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3 of Register: Language */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-black text-on-surface mb-1">Preferred Language</h2>
                      <p className="text-xs text-on-surface-variant">Step 3 of 3: Choose UI language</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { code: 'en' as Language, name: 'English', sub: 'English' },
                        { code: 'hi' as Language, name: 'हिंदी', sub: 'Hindi' },
                        { code: 'gu' as Language, name: 'ગુજરાતી', sub: 'Gujarati' },
                        { code: 'mr' as Language, name: 'मराठी', sub: 'Marathi' },
                        { code: 'pa' as Language, name: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
                      ].map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setSelectedLang(item.code)}
                          className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            selectedLang === item.code
                              ? 'border-primary bg-emerald-50 text-emerald-900 font-extrabold shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xs font-bold">{item.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{item.sub}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="py-3 px-4 border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-slate-50 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleFinishRegistration}
                        className="flex-1 bg-gradient-to-b from-primary to-[#00513b] text-white rounded-xl py-3 px-4 text-xs font-bold hover:shadow-lg hover:shadow-primary/20 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Complete Registration</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
