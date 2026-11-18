import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User, UserRole, LoginRequest, RegisterRequest } from '@/types/auth.types';
import { authService } from '@/services/auth.service';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<{ user_id: string }>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('propvault_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getCurrentUser();
      const userData = (response.data as User) || (response as unknown as User);
      setUser(userData);
    } catch {
      localStorage.removeItem('propvault_access_token');
      localStorage.removeItem('propvault_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        await refreshUser();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<{ user_id: string }> => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      const userId = response.data?.user_id || (response as unknown as { user_id: string }).user_id;
      return { user_id: userId };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const hasRole = useCallback(
    (requiredRole: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const userRoles = user.roles || [];
      if (Array.isArray(requiredRole)) {
        return requiredRole.some((r) => userRoles.includes(r));
      }
      return userRoles.includes(requiredRole);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      hasRole,
      refreshUser,
    }),
    [user, isLoading, hasRole, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
