'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens } from '@pet-care/shared';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: AuthTokens) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,

      setTokens: (tokens: AuthTokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),

      clear: () => set({ accessToken: null, refreshToken: null }),

      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'pet-care-auth' },
  ),
);
