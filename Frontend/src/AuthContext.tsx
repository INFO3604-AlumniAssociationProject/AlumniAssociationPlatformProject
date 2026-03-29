import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from './apiConfig';

export type UserRole = 'admin' | 'alumni';

const TOKEN_KEY = 'uwi_token';
const USER_KEY = 'uwi_user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function mapApiUser(apiUser: any): User {
  const name = apiUser.name || '';
  return {
    id: apiUser.userID,
    name,
    email: apiUser.email,
    role: apiUser.role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
  };
}

function authHeader(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const hydrateSession = async () => {
      const token = getAuthToken();
      if (!token) {
        localStorage.removeItem(USER_KEY);
        setUser(null);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/users/me`, {
          headers: authHeader(token),
        });

        if (!response.ok) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
          return;
        }

        const data = await response.json();
        const mappedUser = mapApiUser(data.user);
        setUser(mappedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
      } catch {
        // Keep cached user on temporary network issues.
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem(USER_KEY);
            setUser(null);
          }
        }
      }
    };

    hydrateSession();
  }, []);

  const login = async (email: string, password: string, expectedRole?: UserRole) => {
    const response = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (!data.token) {
      throw new Error('Authentication token missing from server response');
    }

    const mappedUser = mapApiUser(data.user);
    if (expectedRole && mappedUser.role !== expectedRole) {
      throw new Error(`This account is ${mappedUser.role}. Switch role and try again.`);
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    setUser(mappedUser);
  };

  const logout = async () => {
    const token = getAuthToken();
    try {
      await fetch(`${API_BASE}/users/logout`, {
        method: 'POST',
        headers: authHeader(token),
      });
    } catch {
      // Best-effort logout for network errors.
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
