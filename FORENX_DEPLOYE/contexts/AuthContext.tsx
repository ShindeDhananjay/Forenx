import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { dbService } from '../services/dbService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // Add isLoading to the context type
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
  isApiKeyModalOpen: boolean;
  openApiKeyModal: () => void;
  closeApiKeyModal: () => void;
  saveCustomApiKey: (key: string) => void;
  clearCustomApiKey: () => void;
  activeApiKeyType: 'default' | 'custom';
  isDefaultKeyMissing: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start in a loading state
  const [user, setUser] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [hasNewLinks, setHasNewLinks] = useState(false);
  const location = useLocation();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [activeApiKeyType, setActiveApiKeyType] = useState<'default' | 'custom'>('default');
  const [isDefaultKeyMissing, setIsDefaultKeyMissing] = useState(false);


  useEffect(() => {
    // Wrap initialization in a function to set loading state at the end
    const initializeApp = () => {
      dbService.initializeDatabase();
      
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      
      const authStatus = localStorage.getItem('auth');
      if (authStatus) {
          setIsAuthenticated(true);
          setUser('Admin Officer');
      }
      setHasNewLinks(dbService.getHasNewLinks());

      const defaultKey = process.env.API_KEY;
      const customKey = localStorage.getItem('custom_api_key');

      if (customKey) {
        setActiveApiKeyType('custom');
      }

      if (!defaultKey) {
        setIsDefaultKeyMissing(true);
        if (!customKey) {
          setIsApiKeyModalOpen(true);
        }
      }
      
      // Crucially, set loading to false after all checks are done
      setIsLoading(false);
    };

    initializeApp();
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

  const openApiKeyModal = () => setIsApiKeyModalOpen(true);
  const closeApiKeyModal = () => setIsApiKeyModalOpen(false);

  const saveCustomApiKey = (key: string) => {
    if (key) {
      localStorage.setItem('custom_api_key', key);
      setActiveApiKeyType('custom');
    }
  };
  
  const clearCustomApiKey = () => {
    localStorage.removeItem('custom_api_key');
    setActiveApiKeyType('default');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, isLoading, user, login, logout, theme, toggleTheme, selectedCaseId, clearCase, hasNewLinks, notifyNewLinksFound, clearNewLinksNotification,
      isApiKeyModalOpen, openApiKeyModal, closeApiKeyModal, saveCustomApiKey, clearCustomApiKey, activeApiKeyType,
      isDefaultKeyMissing
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
