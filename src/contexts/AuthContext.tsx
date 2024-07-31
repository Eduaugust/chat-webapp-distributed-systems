import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const login = (username: string) => setIsAuthenticated(username);
  const logout = () => setIsAuthenticated(false);

  const setConnect = (value: boolean) => {
    console.log(value)
    if (!value) {
      // If value is true, start a timer to set it to true after 5 seconds
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const id = setTimeout(() =>{console.log('ixi'); setIsServersConnected(false)}, 1000);
      setTimeoutId(id);
    } else {
      // If value is false, immediately set isServersConnected to false
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      console.log('setConnect')
      setIsServersConnected(true);
    }
  };

  // Clean up timeout if the component is unmounted
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isServersConnected, setConnect }}>
      {children}
    </AuthContext.Provider>
  );
};
