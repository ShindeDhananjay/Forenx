import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../services/dbService';
import { CaseRecord } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { FolderOpen, CheckCircle, Clock, AlertTriangle, Search, FileText, ArrowRight, X, Trash2, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { generateSpeech, decode, decodeAudioData } from '../services/aiService';

// A short, pleasant chime sound encoded in base64 to play instantly on login
const LOGIN_CHIME_SOUND_BASE64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';


const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, critical: 0 });
  const [recentCases, setRecentCases] = useState<CaseRecord[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const loadData = () => {
    const s = dbService.getStats();
    setStats(s);
    setRecentCases(dbService.getAllCases().slice(0, 5)); // Show 5 most recent
  };

  const handleDelete = (caseId: string) => {
    const allCases = dbService.getAllCases();
    const caseToDelete = allCases.find(c => c.id === caseId);
    if (!caseToDelete) return;

    if (window.confirm(`Are you sure you want to permanently delete the case for "${caseToDelete.filename}"? This action cannot be undone.`)) {
      dbService.deleteCase(caseId);
      loadData();
    }
  };

  const playLoginChime = () => {
    try {
      const chime = new Audio(LOGIN_CHIME_SOUND_BASE64);
      chime.play();
    } catch (e) {
      console.error("Could not play login chime", e);
    }
  }

  useEffect(() => {
    // Play welcome message only once per session on successful login
    if (
      location.state && (location.state as any).showWelcome && user &&
      sessionStorage.getItem('welcomeMessagePlayed') !== 'true'
    ) {
      setShowWelcome(true);
      window.history.replaceState({}, document.title); // Clear state to prevent re-trigger on refresh
      
      // Play instant chime for immediate feedback
      playLoginChime();

      const playWelcomeMessage = async () => {
        try {
          const textToSpeak = `Welcome back, ${user}.`;
          const base64Audio = await generateSpeech(textToSpeak);
          
          if (base64Audio) {
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const ctx = audioContextRef.current;
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();
          }
        } catch (error) {
          console.error("Failed to play welcome message:", error);
        }
      };
      
      sessionStorage.setItem('welcomeMessagePlayed', 'true'); // Set flag immediately
      playWelcomeMessage();

      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [location, user]);
  
  useEffect(() => {
     loadData();
  }, [])

  return (
    <div className="space-y-8 relative">
      
      {showWelcome && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce md:animate-none transition-opacity duration-500">
          <div className="bg-white dark:bg-slate-800 border-l-4 border-cyan-500 shadow-xl rounded-r-lg p-6 flex items-start space-x-4 max-w-sm">
            <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-full">
              <CheckCircle className="text-cyan-600 dark:text-cyan-400" size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">Login Successful</h4>
              <p className="text-slate-500 dark:text-slate-300 text-sm mt-1">
                Welcome back, <span className="font-semibold text-cyan-600 dark:text-cyan-400">{user}</span>.
              </p>
            </div>
            <button onClick={() => setShowWelcome(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-2">Command Center</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of all forensic operations and active cases.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Cases" value={stats.total} icon={<FolderOpen />} color="bg-blue-500" />
        <StatCard title="Completed" value={stats.completed} icon={<CheckCircle />} color="bg-green-500" />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Clock />} color="bg-yellow-500" />
        <StatCard title="Critical Alerts" value={stats.critical} icon={<AlertTriangle />} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button onClick={() => navigate('/upload')} className="group flex items-center justify-between p-6 bg-cyan-600 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white/20 rounded-lg"><FileText size={24} /></div>
            <div className="text-left">
              <span className="block font-bold text-lg">New Analysis</span>
              <span className="text-cyan-100 text-sm">Upload evidence file</span>
            </div>
          </div>
          <ArrowRight className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
        </button>
        <button onClick={() => navigate('/cases')} className="group flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Briefcase size={24} /></div>
            <div className="text-left">
              <span className="block font-bold text-lg">View All Cases</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm">Browse and analyze</span>
            </div>
          </div>
          <ArrowRight className="text-slate-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white text-slate-900">Recent Cases</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Case ID</th>
                <th className="px-6 py-4 font-semibold">File Name</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Risk Score</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 dark:text-slate-300 text-slate-700">
              {recentCases.length > 0 ? recentCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">{c.caseNumber}</td>
                  <td className="px-6 py-4 font-medium">{c.filename}</td>
                  <td className="px-6 py-4 text-sm">{new Date(c.uploadDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                     <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${c.riskScore > 70 ? 'bg-red-500' : c.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                          style={{ width: `${c.riskScore}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold">{c.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      title="Delete Case"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                 <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No cases found. Upload a file to begin analysis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg bg-opacity-10 ${color}`}>
        {React.cloneElement(icon, { className: color.replace('bg-', 'text-') })}
      </div>
      <span className="text-3xl font-bold dark:text-white text-slate-800">{value}</span>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
  </div>
);


export default DashboardPage;