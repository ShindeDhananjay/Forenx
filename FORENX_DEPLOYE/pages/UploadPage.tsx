import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { extractDataFromText } from '../services/aiService';
import { analysisService } from '../services/analysisService';
import { fileService } from '../services/fileService';
import { useAuth } from '../contexts/AuthContext';
import { UploadCloud, File, CheckCircle2, Loader2, FileText, Scan, AlertOctagon, Zap } from 'lucide-react';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifyNewLinksFound } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'reading' | 'analyzing' | 'complete'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | React.ReactNode>('');
  const [extractedCount, setExtractedCount] = useState({ entities: 0, events: 0, links: 0 });
  const [newLinksCount, setNewLinksCount] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile: File) => {
    setErrorMessage('');
    
    if (uploadedFile.size > 10 * 1024 * 1024) { 
      setErrorMessage("File is too large for browser analysis. Max 10MB.");
      setFile(null);
      return;
    }

    setFile(uploadedFile);
  };

  const startAnalysis = async () => {
    if (!file) return;
    setErrorMessage('');
    setNewLinksCount(0);

    try {
      setUploadState('reading');
      setStatusMessage(`Reading ${file.name}...`);
      
      const fileContent = await fileService.readFileContent(file);
      
      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error("No readable text found in file. Please upload a valid PDF or Text file.");
      }

      setUploadState('analyzing');
      setStatusMessage('AI Extracting Data & Relationships...');

      const { entities, timeline, links } = await extractDataFromText(file.name, fileContent);

      if (entities.length === 0 && timeline.length === 0) {
        throw new Error("AI could not identify any forensic data in this file.");
      }

      setExtractedCount({ entities: entities.length, events: timeline.length, links: links.length });
      const highRiskCount = entities.filter(e => e.relevance === 'High').length + timeline.filter(t => t.severity === 'High').length;
      const calculatedRiskScore = Math.min(99, Math.max(10, highRiskCount * 15));
      
      const newCase = {
        id: Math.random().toString(36).substr(2, 9),
        caseNumber: `CASE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        filename: file.name,
        uploadDate: new Date().toISOString(),
        status: 'Completed' as 'Completed',
        size: `${(file.size / 1024).toFixed(1)} KB`,
        riskScore: calculatedRiskScore,
        investigator: 'Current User'
      };

      // Important: Add case before running correlation analysis
      dbService.addCase(newCase);
      dbService.saveCaseData(newCase.id, { entities, timeline, links });

      // Run Cross-Case Correlation
      setStatusMessage('Analyzing cross-case correlations...');
      const newCorrelations = analysisService.analyzeCrossCaseSimilarities(newCase, { entities });
      if (newCorrelations.length > 0) {
          dbService.addCrossCaseLinks(newCorrelations);
          notifyNewLinksFound();
          setNewLinksCount(newCorrelations.length);
      }

      setUploadState('complete');
      setShowSuccessPopup(true);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Analysis Failed");
      setUploadState('idle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col justify-center items-center relative">
      
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 transform transition-all scale-100">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">Analysis Complete</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Extracted <span className="font-bold text-cyan-600">{extractedCount.entities} entities</span>, <span className="font-bold text-cyan-600">{extractedCount.events} events</span>, and <span className="font-bold text-cyan-600">{extractedCount.links} relationships</span>.
            </p>
            {newLinksCount > 0 && (
              <div className="bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-500/20 p-4 rounded-lg mb-6 flex items-center justify-center space-x-3 animate-pulse-fast">
                <Zap className="text-cyan-600 dark:text-cyan-400" />
                <p className="font-bold text-cyan-800 dark:text-cyan-300">
                  {newLinksCount} new cross-case link{newLinksCount > 1 ? 's' : ''} found!
                </p>
              </div>
            )}
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => navigate('/cases')} 
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg transition"
              >
                View Case Files
              </button>
              <button 
                onClick={() => {
                  setShowSuccessPopup(false);
                  setFile(null);
                  setUploadState('idle');
                }} 
                className="w-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-slate-900 mb-4 tracking-tight">
          Create New Case
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          Upload a forensic report (PDF, TXT, LOG). ForenX will extract key data and create a new case file.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        {uploadState === 'idle' ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 bg-white dark:bg-slate-900
              ${isDragging 
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-400/5' 
                : errorMessage 
                   ? 'border-red-400 bg-red-50 dark:border-red-500/50 dark:bg-red-900/10'
                   : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}
            `}
          >
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
              onChange={handleFileChange}
              accept=".pdf,.txt,.log,.xml"
            />
            
            <div className="relative z-10 flex flex-col items-center justify-center space-y-4 pointer-events-none">
              <div className={`p-4 rounded-full ${
                errorMessage ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                file ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 
                'bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400'
              }`}>
                {errorMessage ? <AlertOctagon size={40} /> : 
                 file ? <FileText size={40} /> : <UploadCloud size={40} />}
              </div>
              
              {errorMessage ? (
                 <div>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Analysis Failed</h3>
                    <p className="text-red-500 dark:text-red-300 mt-2">{errorMessage}</p>
                 </div>
              ) : file ? (
                <div>
                  <h3 className="text-xl font-semibold dark:text-white text-slate-900">{file.name}</h3>
                  <p className="text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      startAnalysis(); 
                    }}
                    className="mt-6 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all pointer-events-auto cursor-pointer"
                  >
                    Start Analysis
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold dark:text-white text-slate-900">
                    Drag & Drop File
                  </h3>
                  <p className="text-slate-500">
                    Supports PDF, TXT, LOG, XML
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 animate-pulse">
               <Scan size={100} className="text-cyan-500" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center space-x-3">
                {uploadState === 'complete' ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <Loader2 className="animate-spin text-cyan-500" size={24} />
                )}
                <span className="text-lg font-medium dark:text-white text-slate-900">
                  {statusMessage}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden relative z-10">
              <div 
                className={`h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)] ${uploadState === 'complete' ? 'bg-green-500 w-full' : 'bg-cyan-500 w-2/3 animate-pulse'}`}
              ></div>
            </div>
            
            <div className="mt-4 text-center text-slate-500 text-sm">
                Processing file content using browser-based extraction and AI...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;