import React, { createContext, useContext, useState, useEffect } from 'react';
import API, { User, UserProfile } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile> & { name?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Failed to fetch user session:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await API.post('/auth/login', credentials);
    if (res.data.success) {
      localStorage.setItem('auth_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const register = async (data: any) => {
    const res = await API.post('/auth/register', data);
    if (res.data.success) {
      localStorage.setItem('auth_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile> & { name?: string }) => {
    const res = await API.put('/profile', data);
    if (res.data.success) {
      setUser(res.data.user);
    }
  };

  const deleteAccount = async () => {
    await API.delete('/profile');
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
        refreshUser: fetchCurrentUser
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
