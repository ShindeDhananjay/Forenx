import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { EntityType, Entity } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Node extends Entity {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  color: string;
}

interface Link {
  source: Node;
  target: Node;
}

const GraphPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (caseId) {
      const data = dbService.getCaseData(caseId);
      if (data.entities.length > 0) {
        setHasData(true);
        
        const centerX = 400;
        const centerY = 300;
        const radius = 220;
        
        const loadedNodes: Node[] = data.entities.map((e, index) => {
          const angle = (index / data.entities.length) * 2 * Math.PI;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          return {
            ...e,
            x: x, 
            y: y,
            baseX: x,
            baseY: y,
            radius: e.relevance === 'High' ? 20 : 12,
            color: e.type === EntityType.PERSON ? '#ef4444' : e.type === EntityType.PHONE ? '#3b82f6' : e.type === EntityType.EMAIL ? '#10b981' : e.type === EntityType.DEVICE ? '#f97316' : '#64748b'
          };
        });

        const nodeMap = new Map(loadedNodes.map(n => [n.id, n]));
        const loadedLinks: Link[] = data.links
          .map(link => ({
            source: nodeMap.get(link.source),
            target: nodeMap.get(link.target),
          }))
          .filter(l => l.source && l.target) as Link[];
        
        setNodes(loadedNodes);
        setLinks(loadedLinks);
      }
    }
  }, [caseId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !hasData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!ctx) return;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const linkColor = theme === 'dark' ? '#475569' : '#cbd5e1';
      const textColor = theme === 'dark' ? '#cbd5e1' : '#1e293b';

      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;
      const scaleX = canvasWidth / 800;
      const scaleY = canvasHeight / 600;

      ctx.strokeStyle = linkColor;
      ctx.lineWidth = 1;
      links.forEach(link => {
        ctx.beginPath();
        const sX = link.source.baseX * scaleX;
        const sY = link.source.baseY * scaleY;
        const tX = link.target.baseX * scaleX;
        const tY = link.target.baseY * scaleY;
        ctx.moveTo(sX, sY);
        ctx.lineTo(tX, tY);
        ctx.stroke();
      });

      nodes.forEach((node) => {
        const x = node.baseX * scaleX;
        const y = node.baseY * scaleY;

        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(x, y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        ctx.shadowBlur = 0;

        ctx.fillStyle = textColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        
        const label = node.value.length > 20 ? node.value.substring(0, 18) + '...' : node.value;
        ctx.fillText(label, x, y + node.radius + 15);
      });
    };

    render(); // Initial draw
    window.addEventListener('resize', render);

    return () => {
      window.removeEventListener('resize', render);
    };
  }, [nodes, links, hasData, theme]);

  if (!hasData) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold dark:text-white text-slate-900">No Graph Data</h2>
        <p className="text-slate-500 mt-2">No relationships were identified in this case file.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900">AI Link Analysis</h2>
          <p className="text-slate-500 text-sm">Visualizing AI-identified relationships between entities.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Person</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Phone</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Email</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>Device</div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden relative shadow-inner">
         <canvas 
           ref={canvasRef} 
           className="w-full h-full block"
         />
         <div className="absolute bottom-4 right-4 bg-slate-200 dark:bg-slate-800/80 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300">
           AI-Generated Relationship Graph
         </div>
      </div>
    </div>
  );
};

export default GraphPage;