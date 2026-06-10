// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\context\AppContext.js
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const API_BASE_URL = 'http://localhost:5000/api';

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]); // Array of { id, message, type }

  useEffect(() => {
    // Restore authentication details from localStorage
    const savedToken = localStorage.getItem('cy_token');
    const savedUser = localStorage.getItem('cy_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        if (data && data.requiresVerification) {
          return { success: true, requiresVerification: true, email: data.email };
        }
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('cy_token', data.token);
      localStorage.setItem('cy_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      if (data.requiresVerification) {
        return { success: true, requiresVerification: true, email: data.email };
      }

      localStorage.setItem('cy_token', data.token);
      localStorage.setItem('cy_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome to The Courtyard, ${data.user.name}!`, 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      localStorage.setItem('cy_token', data.token);
      localStorage.setItem('cy_user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome to The Courtyard, ${data.user.name}!`, 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const resendVerification = async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification');
      }

      showToast(data.message || 'Verification code resent successfully', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const createPassword = async (password) => {
    if (!token) {
      showToast('Authentication required!', 'error');
      return { success: false };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/create-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create password');
      }

      // Update local user state
      const updatedUser = { ...user, hasCreatedPassword: true };
      localStorage.setItem('cy_user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      showToast(data.message || 'Password created successfully!', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      localStorage.setItem('cy_token', data.token);
      localStorage.setItem('cy_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch recovery request');
      }
      showToast(data.message, 'success');
      return { success: true, devResetUrl: data.devResetUrl };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed');
      }
      showToast(data.message, 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('cy_token');
    localStorage.removeItem('cy_user');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const buyMembership = async (tier) => {
    if (!token) {
      showToast('Please login to activate memberships!', 'error');
      return { success: false };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/memberships/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Membership upgrade failed');
      }

      localStorage.setItem('cy_user', JSON.stringify(data.user));
      setUser(data.user);
      showToast(`Upgraded to ${tier} Membership!`, 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        toasts,
        showToast,
        removeToast,
        login,
        signup,
        loginWithGoogle,
        forgotPassword,
        resetPassword,
        logout,
        buyMembership,
        verifyEmail,
        resendVerification,
        createPassword,
        API_BASE_URL
      }}
    >
      {children}

      {/* Floating Modern Toast Stack Container */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`cursor-pointer px-5 py-4 rounded-xl glass-panel shadow-2xl flex items-center gap-3 border transition-all duration-300 transform translate-y-0 scale-100 hover:scale-95 animate-bounce-short ${
              toast.type === 'success'
                ? 'border-neon-green/40 text-neon-green'
                : toast.type === 'error'
                ? 'border-red-500/40 text-red-400'
                : 'border-electric-blue/40 text-electric-blue'
            }`}
          >
            <div className="flex-1 text-sm font-semibold">{toast.message}</div>
            <button className="text-white/50 hover:text-white text-xs">✕</button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
