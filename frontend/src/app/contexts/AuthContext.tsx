import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI, tokenStorage, UserResponse } from '../utils/api';

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from token and fetch current user if a token exists.
  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenStorage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await userAPI.getMe();
        setUser(userData);
      } catch (error) {
        tokenStorage.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      tokenStorage.setTokens(response.access_token, response.refresh_token);
      const userData = await userAPI.getMe();
      setUser(userData);
    } catch (error) {
      tokenStorage.clearTokens();
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, full_name: string) => {
    setIsLoading(true);
    try {
      await authAPI.register(email, password, full_name);
      // After registration, require login to obtain tokens.
      setUser(null);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenStorage.clearTokens();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
