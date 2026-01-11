import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { TimelineEvent } from '../types';
import { MessageSquare, Phone, MapPin, Smartphone, Cpu } from 'lucide-react';

const TimelinePage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (caseId) {
      const data = dbService.getCaseData(caseId);
      // Sort timeline events by date (most recent first) with robust date handling
      const sortedTimeline = [...data.timeline].sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        
        // Treat invalid dates as "older" so they are pushed to the bottom of the timeline
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateB.getTime() - dateA.getTime();
      });
      setTimeline(sortedTimeline);
    }
  }, [caseId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'SMS': return <MessageSquare size={16} />;
      case 'CALL': return <Phone size={16} />;
      case 'LOCATION': return <MapPin size={16} />;
      case 'APP_USAGE': return <Smartphone size={16} />;
      default: return <Cpu size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SMS': return 'bg-blue-500';
      case 'CALL': return 'bg-green-500';
      case 'LOCATION': return 'bg-red-500';
      case 'APP_USAGE': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No Date Provided';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // The AI might return a relative or descriptive time string
        // which is not machine-parsable but is still useful context.
        return dateString;
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error(`Failed to format date string "${dateString}":`, error);
      // Fallback to the original string if any unexpected error occurs
      return dateString;
    }
  };

  if (timeline.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold dark:text-white text-slate-900">No Timeline Data</h2>
        <p className="text-slate-500 mt-2">No events were extracted for this case.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white text-slate-900">Event Timeline</h2>
        <button className="text-sm bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg transition border border-slate-200 dark:border-slate-700">
          Export CSV
        </button>
      </div>

      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 space-y-8 pb-10">
        {timeline.map((event) => (
          <div key={event.id} className="relative pl-8 md:pl-12 group">
            <div className={`
              absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 
              ${getTypeColor(event.type)} shadow-sm dark:shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-125
            `}></div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:border-cyan-500/30 transition-all shadow-sm group-hover:shadow-md dark:shadow-none">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <div className="flex items-center space-x-2 mb-1 md:mb-0">
                  <span className={`p-1.5 rounded-md bg-opacity-10 dark:bg-opacity-20 ${getTypeColor(event.type).replace('bg-', 'text-').replace('500', '600')} ${getTypeColor(event.type).replace('bg-', 'bg-')}`}>
                    {getIcon(event.type)}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide">{event.type}</span>
                </div>
                <time className="text-xs font-mono text-slate-500">{formatDate(event.timestamp)}</time>
              </div>
              
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {event.description}
              </p>
              
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">Source: <span className="text-slate-400 font-medium">{event.source}</span></span>
                {event.severity === 'High' && (
                  <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/10 px-2 py-0.5 rounded border border-red-200 dark:border-red-400/20">
                    High Relevance
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelinePage;