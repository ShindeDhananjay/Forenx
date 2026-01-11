import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, X, Save, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';

const ApiKeyModal: React.FC = () => {
  const { closeApiKeyModal, saveCustomApiKey, clearCustomApiKey, activeApiKeyType, isDefaultKeyMissing } = useAuth();
  const [currentKey, setCurrentKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('custom_api_key');
    if (storedKey) {
      setCurrentKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    saveCustomApiKey(currentKey);
    closeApiKeyModal();
  };

  const handleClear = () => {
    clearCustomApiKey();
    setCurrentKey(''); // Clear input field as well
    closeApiKeyModal();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center">
            <KeyRound className="mr-3 text-cyan-500"/>
            API Key Configuration
          </h3>
          <button onClick={closeApiKeyModal} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {isDefaultKeyMissing && (
            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-red-800 dark:text-red-200">
                  Default API Key Missing
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  The application's pre-configured API key was not found. Please provide your own Gemini API key below to enable AI features. You can get one from{' '}
                  <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-red-500">Google AI Studio</a>.
                </p>
              </div>
            </div>
          )}

          <div className={`flex items-start space-x-3 p-3 rounded-lg border ${
            activeApiKeyType === 'custom' 
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30' 
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30'
          }`}>
            {activeApiKeyType === 'custom' 
              ? <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" />
              : <ShieldCheck className="text-green-500 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Currently using: {activeApiKeyType === 'custom' ? 'Custom API Key' : 'Default API Key'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeApiKeyType === 'custom' 
                  ? 'The key you entered is being used for all AI services.' 
                  : 'The default, pre-configured API key is active.'}
              </p>
            </div>
          </div>
          
          <div>
            <label htmlFor="apiKeyInput" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enter Custom API Key</label>
            <input 
              id="apiKeyInput"
              type="password"
              value={currentKey}
              onChange={(e) => setCurrentKey(e.target.value)}
              placeholder="Paste your Gemini API key here..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
             <p className="text-xs text-slate-400 mt-2">
               This is stored only in your browser's local storage and is useful if the default key fails during a presentation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
           <button 
            onClick={handleClear}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            <Trash2 size={16} />
            <span>Use Default Key</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={!currentKey}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-cyan-600 hover:bg-cyan-500 transition disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>Save & Use Custom Key</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
