import { createContext, useContext, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Lazy initialization reads localStorage only once on initial mount
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ironbulk_user');
    return saved ? JSON.parse(saved) : null;
  });

  const saveSession = (authResponse) => {
    const { token, username, dailyCalorieTarget, dailyProteinTarget } = authResponse;
    const userData = { username, dailyCalorieTarget, dailyProteinTarget };
    localStorage.setItem('ironbulk_token', token);
    localStorage.setItem('ironbulk_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (username, password) => {
    const { data } = await axiosClient.post('/auth/login', { username, password });
    saveSession(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await axiosClient.post('/auth/register', payload);
    saveSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('ironbulk_token');
    localStorage.removeItem('ironbulk_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);