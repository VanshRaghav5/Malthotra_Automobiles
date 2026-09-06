import { create } from 'zustand';
import type { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInitialized: boolean;
  setUser: (user: Profile | null) => void;
  setToken: (token: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  signout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isAdmin: false,
  isInitialized: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    set({ token });
  },

  setInitialized: (isInitialized) => set({ isInitialized }),

  signout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false, isInitialized: true });
  },
}));
