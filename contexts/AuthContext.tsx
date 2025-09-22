import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const authTimestamp = localStorage.getItem('authTimestamp');
    
    if (authStatus === 'true' && authTimestamp) {
      const timestamp = parseInt(authTimestamp);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (now - timestamp < oneHour) {
        setIsAuthenticated(true);
      } else {
        // Session expired
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
      }
    }
  }, []);

  const login = (pin: string): boolean => {
    const correctPin = '1256';
    if (pin === correctPin) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authTimestamp', Date.now().toString());
      
      // Auto-logout after 1 hour
      setTimeout(() => {
        logout();
      }, 60 * 60 * 1000);
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTimestamp');
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
