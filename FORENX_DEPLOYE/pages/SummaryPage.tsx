import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateForensicSummary, ApiKeyError } from '../services/aiService';
import { dbService } from '../services/dbService';
import { AnalysisSummary } from '../types';
import { ShieldAlert, CheckCircle, FileOutput, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';

const SummaryPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalysisSummary | null>(null);
  const [error, setError] = useState<string | React.ReactNode | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      if (!caseId) {
        setLoading(false);
        return;
      }

      const caseData = dbService.getCaseData(caseId);
      
      if (caseData.entities.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const result = await generateForensicSummary(caseData.entities, caseData.timeline);
        setData(result);
      } catch (err: any) {
        if (err instanceof ApiKeyError) {
          setError(err.message);
        } else {
          setError("Failed to generate AI summary.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [caseId]);

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 animate-pulse">Generating AI Summary...</h2>
        <p className="text-slate-500 mt-2">Correlating entities and timeline events for this case</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl">
        <AlertTriangle className="mx-auto w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-800 dark:text-red-300">Analysis Failed</h2>
        <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
      </div>
    );
  }

  if (!data) {
     return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold dark:text-white text-slate-900">No Summary Available</h2>
        <p className="text-slate-500 mt-2">AI could not generate a summary for this case.</p>
      </div>
    );
  }

  // Determine risk color
  const riskColor = data.riskScore > 75 ? 'text-red-500' : data.riskScore > 40 ? 'text-yellow-500' : 'text-green-500';
  const riskBg = data.riskScore > 75 ? 'bg-red-500' : data.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-6 max-w-6xl mx-auto print:max-w-none print:p-0">
      {/* Header with Risk Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:block print:space-y-4">
        <div className="md:col-span-3">
          <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-2">Executive Investigation Summary</h1>
          <p className="text-slate-500 dark:text-slate-400">AI-generated forensic report based on parsed artifacts.</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-sm print:border print:border-slate-300">
          <div className={`absolute top-0 left-0 w-full h-1 ${riskBg} opacity-50`}></div>
          <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">Risk Score</span>
          <div className={`text-4xl font-black ${riskColor}`}>
            {data.riskScore}/100
          </div>
          <span className={`text-sm font-bold mt-1 px-2 py-0.5 rounded ${riskBg} bg-opacity-10 ${riskColor} border border-opacity-20`}>
            {data.riskLevel}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:space-y-4">
        
        {/* Left Col: Main Summary */}
        <div className="lg:col-span-2 space-y-6 print:space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-lg print:border print:border-slate-300 print:shadow-none">
            <h3 className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mb-4 flex items-center">
              <ShieldAlert className="mr-2" size={20} /> Case Analysis
            </h3>
            <div className="prose prose-slate dark:prose-invert max-w-none dark:text-slate-300 text-slate-600 leading-relaxed">
               <p className="whitespace-pre-line">{data.summaryText}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-lg print:border print:border-slate-300 print:shadow-none">
             <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center">
              <AlertTriangle className="mr-2" size={20} /> Key Findings
            </h3>
            <ul className="space-y-3">
              {data.keyFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="mt-1.5 min-w-[6px] h-1.5 rounded-full bg-yellow-500 mr-3"></div>
                  <span className="text-slate-700 dark:text-slate-300">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col: Recommendations & Actions */}
        <div className="space-y-6 print:space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-lg print:border print:border-slate-300 print:shadow-none">
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4 flex items-center">
              <Lightbulb className="mr-2" size={20} /> Recommendations
            </h3>
            <ul className="space-y-3">
               {data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800/50 print:border-slate-300">
                  <CheckCircle className="min-w-[16px] text-green-500 mr-3 mt-0.5" size={16} />
                  <span className="text-slate-600 dark:text-slate-300 text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 print:hidden">
            <h4 className="text-slate-900 dark:text-white font-semibold mb-3">Export Report</h4>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExportPDF}
                className="flex items-center justify-center space-x-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white py-2 px-4 rounded-lg transition text-sm shadow-sm border border-slate-200 dark:border-transparent"
              >
                <FileOutput size={16} />
                <span>PDF</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white py-2 px-4 rounded-lg transition text-sm shadow-sm border border-slate-200 dark:border-transparent">
                <FileOutput size={16} />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;