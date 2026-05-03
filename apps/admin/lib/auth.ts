'use client';
import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  storeId: string | null;
}

export const AuthContext = createContext<{
  user: AuthUser | null;
  loading: boolean;
  refresh: () => void;
}>({ user: null, loading: true, refresh: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}
