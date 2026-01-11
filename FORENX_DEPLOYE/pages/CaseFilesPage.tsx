import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { CaseRecord } from '../types';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, ShieldCheck, Briefcase, Info, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CaseFilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDemoBanner, setShowDemoBanner] = useState(
    localStorage.getItem('forenx_demo_banner_dismissed') !== 'true'
  );

  const demoFiles = [
    "Alpha Report.pdf",
    "Bravo Image.zip",
    "Charlie Financials.csv",
    "Delta Logs.txt",
  ];

  const handleDismissBanner = () => {
    setShowDemoBanner(false);
    localStorage.setItem('forenx_demo_banner_dismissed', 'true');
  };

  const loadCases = () => {
    let allCases = dbService.getAllCases();
    if (searchTerm) {
      allCases = allCases.filter(c => 
        c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setCases(allCases);
  };

  useEffect(() => {
    loadCases();
  }, [searchTerm]);

  const handleAnalyze = (caseId: string) => {
    // Just navigate. The AuthContext useEffect will sync the selectedCaseId from the URL.
    navigate(`/cases/${caseId}/summary`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const allCases = dbService.getAllCases();
    const caseToDelete = allCases.find(c => c.id === id);
    if (!caseToDelete) return;
    
    if (window.confirm(`Are you sure you want to permanently delete the case for "${caseToDelete.filename}"? This action cannot be undone.`)) {
      dbService.deleteCase(id);
      loadCases();
    }
  };
  
  return (
    <div className="space-y-6">
      {showDemoBanner && (
        <div className="relative bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-500/20 p-6 rounded-xl">
          <button 
            onClick={handleDismissBanner}
            className="absolute top-3 right-3 p-1 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-start space-x-4">
            <Info className="text-cyan-600 dark:text-cyan-400 mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-bold text-cyan-800 dark:text-cyan-200">Demo Cases Loaded</h3>
              <p className="text-cyan-700 dark:text-cyan-300 mt-1 text-sm">
                This instance is pre-loaded with the following UFDRs for testing and demonstration. Feel free to analyze them or upload your own.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-slate-600 dark:text-slate-400">
                {demoFiles.map(file => (
                  <span key={file}>{file}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900">Case Investigation</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Browse, manage, and analyze all uploaded cases.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
          <Search className="text-slate-400 ml-2" size={18} />
          <input 
            type="text" 
            placeholder="Search by filename or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-200 placeholder-slate-400 w-full md:w-64"
          />
        </div>
      </div>

      {cases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg dark:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start">
                  <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{c.caseNumber}</div>
                   <button 
                      onClick={(e) => handleDelete(c.id, e)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Delete Case"
                    >
                      <Trash2 size={16} />
                    </button>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">{c.filename}</h3>
                <p className="text-xs text-slate-400 mt-1">Uploaded: {new Date(c.uploadDate).toLocaleDateString()}</p>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Risk Score: {c.riskScore}</span>
                   <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${c.riskScore > 75 ? 'bg-red-500' : c.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${c.riskScore}%` }}
                      ></div>
                    </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4">
                 <button 
                    onClick={() => handleAnalyze(c.id)}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
                  >
                    <ShieldCheck size={18} />
                    <span>Analyze Case</span>
                  </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="col-span-full">
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-16">
            <Briefcase size={40} className="opacity-50 text-slate-400" />
            <h3 className="text-xl font-semibold mt-4 dark:text-white">No Cases Found</h3>
            <p className="text-slate-500 mt-1">
              Your search for "{searchTerm}" did not match any cases.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseFilesPage;