import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, ScreenView, UserRole, Language } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  intendedDestination: ScreenView | null;
  setIntendedDestination: (dest: ScreenView | null) => void;
  login: (userData: UserProfile, targetDestination?: ScreenView, onCompleteNav?: (dest: ScreenView) => void) => ScreenView;
  logout: (onCompleteNav?: () => void) => void;
  updateUser: (updated: Partial<UserProfile>) => void;
  requireAuth: (targetDestination?: ScreenView) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'cloudagri_auth_session';

export const AuthProvider: React.FC<{
  children: ReactNode;
  onNavigate?: (view: ScreenView) => void;
}> = ({ children, onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [intendedDestination, setIntendedDestination] = useState<ScreenView | null>(null);

  // Initialize strictly from explicit stored session; NO automatic or default user login!
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isAuthenticated === true && parsed.user) {
          setIsAuthenticated(true);
          setUser(parsed.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (e) {
      console.error('Failed to parse auth session from localStorage:', e);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Explicit Login action
  const login = (
    userData: UserProfile,
    targetDestination?: ScreenView,
    onCompleteNav?: (dest: ScreenView) => void
  ): ScreenView => {
    const sessionData = {
      isAuthenticated: true,
      user: userData,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to save auth session to localStorage:', e);
    }

    setIsAuthenticated(true);
    setUser(userData);

    const destination = targetDestination || intendedDestination;
    setIntendedDestination(null);

    const resolvedDestination: ScreenView =
      destination && destination !== 'landing' && destination !== 'onboarding'
        ? destination
        : userData.role === 'farmer'
        ? 'farmer-dashboard'
        : 'marketplace';

    if (onCompleteNav) {
      onCompleteNav(resolvedDestination);
    } else if (onNavigate) {
      onNavigate(resolvedDestination);
    }

    return resolvedDestination;
  };

  // Explicit Logout action ONLY
  const logout = (onCompleteNav?: () => void) => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear auth session from localStorage:', e);
    }
    setIsAuthenticated(false);
    setUser(null);
    setIntendedDestination(null);

    if (onCompleteNav) {
      onCompleteNav();
    } else if (onNavigate) {
      onNavigate('landing');
    }
  };

  // Update authenticated user profile details
  const updateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updated };
      try {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ isAuthenticated: true, user: nextUser, timestamp: Date.now() })
        );
      } catch (e) {
        console.error('Failed to update auth session in localStorage:', e);
      }
      return nextUser;
    });
  };

  // Helper to check authentication and prompt login if not authenticated
  const requireAuth = (targetDestination?: ScreenView): boolean => {
    if (isAuthenticated) {
      return true;
    }
    if (targetDestination) {
      setIntendedDestination(targetDestination);
    }
    onNavigate('onboarding');
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        intendedDestination,
        setIntendedDestination,
        login,
        logout,
        updateUser,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
