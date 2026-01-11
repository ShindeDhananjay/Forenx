import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { Search, Filter, User, Smartphone, Mail, MapPin, HardDrive } from 'lucide-react';
import { EntityType, Entity } from '../types';

const EntitiesPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<EntityType | 'All'>('All');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [caseInfo, setCaseInfo] = useState<{ filename: string } | null>(null);

  useEffect(() => {
    if (caseId) {
      const caseData = dbService.getCaseData(caseId);
      const allCases = dbService.getAllCases();
      const currentCase = allCases.find(c => c.id === caseId);

      setEntities(caseData.entities);
      if (currentCase) {
        setCaseInfo({ filename: currentCase.filename });
      }
    }
  }, [caseId]);

  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
      const matchesSearch = entity.value.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (entity.metadata && Object.values(entity.metadata).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesFilter = activeFilter === 'All' || entity.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, activeFilter, entities]);

  const getIcon = (type: EntityType) => {
    switch (type) {
      case EntityType.PERSON: return <User size={18} />;
      case EntityType.PHONE: return <Smartphone size={18} />;
      case EntityType.EMAIL: return <Mail size={18} />;
      case EntityType.LOCATION: return <MapPin size={18} />;
      default: return <HardDrive size={18} />;
    }
  };

  const getRelevanceColor = (rel: string) => {
    switch (rel) {
      case 'High': return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20';
      case 'Low': return 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-400/10 dark:border-slate-400/20';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900">Extracted Entities</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Objects of interest from: <span className="font-semibold text-cyan-600 dark:text-cyan-400">{caseInfo?.filename || '...'}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
          <Search className="text-slate-400 ml-2" size={18} />
          <input 
            type="text" 
            placeholder="Search entities..." 
            className="bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-200 placeholder-slate-400 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', ...Object.values(EntityType)].map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type as EntityType | 'All')}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${activeFilter === type 
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}
            `}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Value / Name</th>
                <th className="px-6 py-4 font-semibold">Relevance</th>
                <th className="px-6 py-4 font-semibold">Last Seen</th>
                <th className="px-6 py-4 font-semibold">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredEntities.length > 0 ? (
                filteredEntities.map((entity) => (
                  <tr key={entity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400">
                        {getIcon(entity.type)}
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{entity.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                      {entity.value}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getRelevanceColor(entity.relevance)}`}>
                        {entity.relevance}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                      {entity.lastSeen || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500 text-sm font-mono">
                      {entity.metadata ? JSON.stringify(entity.metadata).replace(/[{""}]/g, '').replace(/:/g, ': ') : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter size={32} className="opacity-50" />
                      <p>No entities found for this case.</p>
                    </div>
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

export default EntitiesPage;