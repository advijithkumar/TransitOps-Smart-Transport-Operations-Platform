import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

export interface User {
  id: string;
  name: string;
  email: string;
  roleName: UserRole;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  activeRole: UserRole | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setActiveRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      activeRole: null,
      login: (accessToken, refreshToken, user) => set({
        accessToken,
        refreshToken,
        user,
        activeRole: user.roleName
      }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, activeRole: null }),
      setActiveRole: (role) => set({ activeRole: role }),
    }),
    {
      name: 'transitops-auth',
    }
  )
);
