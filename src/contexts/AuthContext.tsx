import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean | string;
  login: (username: string) => void;
  logout: () => void;
  isServersConnected: boolean;
  setConnect: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | string>(false);
  const [isServersConnected, setIsServersConnected] = useState<boolean>(false);

  const login = (username: string) => setIsAuthenticated(username);
  const logout = () => setIsAuthenticated(false);

  const setConnect = (value: boolean) => setIsServersConnected(value);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isServersConnected, setConnect}}>
      {children}
    </AuthContext.Provider>
  );
};