import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'roxiler_token';
const USER_KEY = 'roxiler_user';

/**
 * Authentication Context Provider
 * 
 * Centralized owner of application authentication state.
 * 
 * SECURITY NOTE ON TOKEN STORAGE:
 * In this SPA, we store the JWT in `localStorage` for cross-tab persistence.
 * While convenient for client-side architectures, `localStorage` is accessible to 
 * JavaScript and could be read if an XSS vulnerability is introduced.
 * True security is enforced by the Express backend (`authenticateToken` & `requireRole`).
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    const cachedUser = localStorage.getItem(USER_KEY);
    try {
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Hydrate session on app boot using GET /api/auth/me
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const freshUser = await authService.getProfile();
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      } catch (error) {
        console.warn('Session restoration failed or token expired:', error.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();

    // Listen to global 401 unauthorized events from Axios interceptor
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('roxiler:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('roxiler:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  // Login action
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const { user: loggedInUser, token: receivedToken } = data;

    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));

    setToken(receivedToken);
    setUser(loggedInUser);

    return loggedInUser;
  };

  // Signup action
  const signup = async (signupData) => {
    const data = await authService.signup(signupData);
    const { user: registeredUser, token: receivedToken } = data;

    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(USER_KEY, JSON.stringify(registeredUser));

    setToken(receivedToken);
    setUser(registeredUser);

    return registeredUser;
  };

  // Register Store & Owner action (Entry Point A)
  const registerStore = async (registerData) => {
    const data = await authService.registerStore(registerData);
    const { user: registeredUser, token: receivedToken } = data;

    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(USER_KEY, JSON.stringify(registeredUser));

    setToken(receivedToken);
    setUser(registeredUser);

    return data;
  };

  // Update profile in state
  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    signup,
    registerStore,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
