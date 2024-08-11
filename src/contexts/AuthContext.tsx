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

// Verificacao de autenticidade
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | string>(false);
  const [isServersConnected, setIsServersConnected] = useState<boolean>(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const login = (username: string) => setIsAuthenticated(username);
  const logout = () => setIsAuthenticated(false);

  const setConnect = (value: boolean) => {
    if (!value) {
      // If value is false, start a timer to set it to false after 5 seconds
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const id = setTimeout(() =>{setIsServersConnected(false)}, 1000);
      setTimeoutId(id);
    } else {
      // If value is true, immediately set isServersConnected to true
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
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
