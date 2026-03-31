import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: localStorage.getItem('user') && localStorage.getItem('user') !== 'undefined' 
        ? JSON.parse(localStorage.getItem('user')) 
        : null,
      isAuthenticated: !!localStorage.getItem('token'),
      darkMode: false,
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            isAuthenticated: true,
          });
          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
      },
      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ darkMode: state.darkMode }), // Only persist darkMode
    }
  )
);
