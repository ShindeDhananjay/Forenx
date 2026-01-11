import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dbService } from '../services/dbService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: () => void;
  logout: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  selectedCaseId: string | null;
  clearCase: () => void;
  hasNewLinks: boolean;
  notifyNewLinksFound: () => void;
  clearNewLinksNotification: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [hasNewLinks, setHasNewLinks] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Run database seeding for demo purposes on first load
    dbService.initializeDatabase();
    
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    
    // Check for existing auth and notifications on initial load
    const authStatus = localStorage.getItem('auth');
    if (authStatus) {
        setIsAuthenticated(true);
        setUser('Admin Officer');
    }
    setHasNewLinks(dbService.getHasNewLinks());
  }, []);

  // Sync selectedCaseId with the URL to keep state consistent across navigation and reloads.
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const caseIdFromUrl = (pathParts[1] === 'cases' && pathParts[2]) ? pathParts[2] : null;
    setSelectedCaseId(caseIdFromUrl);
  }, [location.pathname]);

  const login = () => {
    setIsAuthenticated(true);
    setUser('Admin Officer');
    localStorage.setItem('auth', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth');
    sessionStorage.removeItem('welcomeMessagePlayed'); // Clear session flag on logout
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const clearCase = () => {
    setSelectedCaseId(null);
  };
  
  const notifyNewLinksFound = () => {
    setHasNewLinks(true);
    dbService.setHasNewLinks(true);
  }

  const clearNewLinksNotification = () => {
    setHasNewLinks(false);
    dbService.setHasNewLinks(false);
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, user, login, logout, theme, toggleTheme, selectedCaseId, clearCase, hasNewLinks, notifyNewLinksFound, clearNewLinksNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);