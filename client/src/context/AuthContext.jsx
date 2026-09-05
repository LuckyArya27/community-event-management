import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../services/auth';
import { setToken, removeToken } from '../services/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const me = await authApi.getMe();
        setUser(me);
      } catch (error) {
        if (error.status === 401) {
          removeToken();
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  async function login(username, password) {
    const { token } = await authApi.login(username, password);
    setToken(token);
    
    const user = await authApi.getMe();
    setUser(user);
    return user;
  }

  async function register(payload) {
    const { token } = await authApi.register(payload);
    setToken(token);

    const user = await authApi.getMe();
    setUser(user);
    return user;
  }

  async function updateUser() {
    const user = await authApi.getMe();
    setUser(user);
    return user;
  }

  function logout() {
    removeToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register,updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
