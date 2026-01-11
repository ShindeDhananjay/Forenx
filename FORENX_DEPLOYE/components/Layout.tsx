import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/dbService';
import { CaseRecord } from '../types';
import { 
  Fingerprint, 
  UploadCloud, 
  Users, 
  Clock, 
  FileText, 
  Menu,
  X,
  LayoutDashboard,
  Network,
  LogOut,
  Sun,
  Moon,
  Zap,
  ShieldCheck,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    logout, theme, toggleTheme, user, isAuthenticated, selectedCaseId, hasNewLinks, clearNewLinksNotification,
  } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [selectedCaseInfo, setSelectedCaseInfo] = useState<CaseRecord | null>(null);

  useEffect(() => {
    if (selectedCaseId) {
      const caseDetails = dbService.getAllCases().find(c => c.id === selectedCaseId);
      setSelectedCaseInfo(caseDetails || null);
    } else {
      setSelectedCaseInfo(null);
    }
  }, [selectedCaseId]);

  if (!isAuthenticated && location.pathname === '/login') {
    return <>{children}</>;
  }

  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Upload Case', path: '/upload', icon: <UploadCloud size={20} /> },
    { name: 'Link Analysis', path: '/link-analysis', icon: <Zap size={20} />, alert: hasNewLinks },
  ];

  const caseNavItems = [
    { name: 'AI Summary', subPath: 'summary', icon: <FileText size={20} /> },
    { name: 'Entities', subPath: 'entities', icon: <Users size={20} /> },
    { name: 'Timeline', subPath: 'timeline', icon: <Clock size={20} /> },
    { name: 'Link Graph', subPath: 'graph', icon: <Network size={20} /> },
  ];

  const handleLinkAnalysisClick = () => {
    setIsMobileMenuOpen(false);
    clearNewLinksNotification();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-300">
      
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="logo-animate flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-bold text-xl">
          <Fingerprint />
          <span>ForenX</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-500 dark:text-slate-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        flex flex-col shadow-xl md:shadow-none
      `}>
        <div className="logo-animate p-6 flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-bold text-2xl border-b border-slate-200 dark:border-slate-800">
          <Fingerprint size={32} />
          <span>ForenX</span>
        </div>

        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
           <p className="text-xs uppercase text-slate-400 font-bold tracking-wider">Logged in as</p>
           <p className="text-sm font-semibold truncate dark:text-slate-200 text-slate-700">{user || 'Guest'}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-4 pt-3 pb-2 text-xs uppercase text-slate-400 font-bold tracking-wider">Main Tools</p>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (item.name === 'Link Analysis') handleLinkAnalysisClick();
              }}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-semibold relative
                ${isActive
                  ? 'text-cyan-600 dark:text-cyan-400 bg-slate-100 dark:bg-cyan-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                }
              `}
            >
              {item.icon}
              <span>{item.name}</span>
              {item.alert && (
                <span className="absolute top-1/2 right-3 -translate-y-1/2 w-3 h-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pt-2 pb-4 border-t border-slate-200 dark:border-slate-800">
           <p className="px-4 pt-3 pb-2 text-xs uppercase text-slate-400 font-bold tracking-wider">Investigation</p>
          <nav className="space-y-1">
            <NavLink
              to={'/cases'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-semibold
                ${(isActive && !selectedCaseId) || (selectedCaseId && location.pathname.startsWith('/cases') && !location.pathname.includes('/', 7))
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                }
                ${!selectedCaseId ? 'text-cyan-600 dark:text-cyan-400' : ''}
              `}
            >
              <ShieldCheck size={20} />
              <span className={!selectedCaseId ? 'animate-text-glow font-bold' : ''}>
                {selectedCaseId ? 'Change Case' : 'Select Case'}
              </span>
            </NavLink>

            <hr className="mx-4 my-2 border-slate-200 dark:border-slate-800" />
            
            {selectedCaseInfo && (
              <div className="px-4 pt-1 pb-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Case</p>
                <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 truncate mt-1" title={selectedCaseInfo.caseNumber}>
                  {selectedCaseInfo.caseNumber}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={selectedCaseInfo.filename}>
                  {selectedCaseInfo.filename}
                </p>
              </div>
            )}
            
            {caseNavItems.map((item) => {
              const isDisabled = !selectedCaseId;

              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    title="Please select a case first to access this feature."
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={`/cases/${selectedCaseId}/${item.subPath}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-semibold
                    ${isActive
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-around">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-semibold"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-semibold"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
      
    </div>
  );
};

export default Layout;