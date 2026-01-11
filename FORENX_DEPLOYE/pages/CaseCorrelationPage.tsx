import React, { useEffect, useRef, useState } from 'react';
import { dbService } from '../services/dbService';
import { generateLinkAnalysisSummaryStream } from '../services/aiService';
import { CaseRecord, CrossCaseLink, Entity, AILink, EntityType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Zap, AlertTriangle, X, Loader2, User, Smartphone, Mail, MapPin, HardDrive, Share2 } from 'lucide-react';

// Interfaces for main graph
interface Node extends CaseRecord {
  radius: number;
  color: string;
}

interface MainLink {
  source: Node;
  target: Node;
  reason: string;
  evidence: string;
}

// Interfaces for mini-graph in modal
interface MiniNode extends Entity {
  x: number, y: number, color: string, radius: number
}
interface MiniLink { source: MiniNode, target: MiniNode }


const MiniGraph: React.FC<{caseData: {entities: Entity[], links: AILink[]}, highlightedValue: string, theme: 'dark'|'light'}> = ({ caseData, highlightedValue, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !caseData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 300 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);
    
    const nodes: MiniNode[] = caseData.entities.map((e, i) => ({
      ...e,
      x: 60 + (i % 3) * 80,
      y: 50 + Math.floor(i / 3) * 60,
      color: e.type === EntityType.PERSON ? '#ef4444' : e.type === EntityType.PHONE ? '#3b82f6' : e.type === EntityType.EMAIL ? '#10b981' : e.type === EntityType.DEVICE ? '#f97316' : '#64748b',
      radius: 6,
    }));
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const links: MiniLink[] = caseData.links.map(l => ({ source: nodeMap.get(l.source)!, target: nodeMap.get(l.target)! })).filter(l => l.source && l.target);
    
    const drawGraph = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const linkColor = theme === 'dark' ? '#475569' : '#cbd5e1';
        const textColor = theme === 'dark' ? '#94a3b8' : '#475569';

        ctx.strokeStyle = linkColor;
        ctx.lineWidth = 1;
        links.forEach(link => {
            ctx.beginPath();
            ctx.moveTo(link.source.x, link.source.y);
            ctx.lineTo(link.target.x, link.target.y);
            ctx.stroke();
        });

        nodes.forEach(node => {
            if (node.value === highlightedValue) {
                const glowRadius = node.radius + 7;
                const gradient = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, glowRadius);
                gradient.addColorStop(0, `${node.color}99`);
                gradient.addColorStop(1, `${node.color}00`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = textColor;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            const label = node.value.length > 15 ? node.value.substring(0, 13) + '...' : node.value;
            ctx.fillText(label, node.x, node.y + node.radius + 10);
        });
    };
    drawGraph();

  }, [caseData, highlightedValue, theme]);

  return <canvas ref={canvasRef} width={300} height={200} />;
};


const LinkAnalysisPage: React.FC = () => {
  const { theme } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<MainLink[]>([]);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [selectedLink, setSelectedLink] = useState<MainLink | null>(null);
  const [correlationSummary, setCorrelationSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const hoveredLinkRef = useRef<MainLink | null>(null);
  
  useEffect(() => {
    const allCases = dbService.getAllCases();
    const allLinks = dbService.getCrossCaseLinks();

    if (allCases.length > 0) {
      const loadedNodes: Node[] = allCases.map((c) => ({
        ...c, 
        radius: c.riskScore > 75 ? 25 : c.riskScore > 40 ? 20 : 15, 
        color: c.riskScore > 75 ? '#ef4444' : c.riskScore > 40 ? '#f59e0b' : '#22c55e' 
      }));

      const nodeMap = new Map(loadedNodes.map(n => [n.id, n]));
      const loadedLinks: MainLink[] = allLinks
        .map(link => ({ 
          source: nodeMap.get(link.sourceCaseId)!, 
          target: nodeMap.get(link.targetCaseId)!, 
          reason: link.reason, 
          evidence: link.evidence 
        }))
        .filter(l => l.source && l.target);
      
      setNodes(loadedNodes);
      setLinks(loadedLinks);
    }
  }, []);
  
  useEffect(() => {
    if (!selectedLink) return;

    const streamSummary = async () => {
      setIsSummaryLoading(true);
      setCorrelationSummary('');
      try {
        const caseAData = dbService.getCaseData(selectedLink.source.id);
        const caseBData = dbService.getCaseData(selectedLink.target.id);
        const sharedEvidence = { type: selectedLink.reason.replace('Shared ', ''), value: selectedLink.evidence };
        
        const stream = generateLinkAnalysisSummaryStream(selectedLink.source, caseAData, selectedLink.target, caseBData, sharedEvidence);

        for await (const chunk of stream) {
            setCorrelationSummary(prev => prev + chunk);
        }
      } catch (err) {
        setCorrelationSummary("Failed to generate AI summary. Please check your API key.");
      } finally {
        setIsSummaryLoading(false);
      }
    };
    
    streamSummary();
  }, [selectedLink]);

  // Effect to calculate node positions
  useEffect(() => {
    const calculatePositions = () => {
      const container = containerRef.current;
      if (!container || nodes.length === 0) {
        return;
      }

      const canvasWidth = container.clientWidth;
      const canvasHeight = container.clientHeight;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const horizontalRadius = Math.max(50, Math.min(canvasWidth / 2 - 60, 400));
      const verticalRadius = Math.max(50, Math.min(canvasHeight / 2 - 60, 250));

      const newPositions = new Map<string, { x: number, y: number }>();
      nodes.forEach((node, index) => {
        if (nodes.length === 1) {
          newPositions.set(node.id, { x: centerX, y: centerY });
          return;
        }
        const angle = (index / nodes.length) * 2 * Math.PI - (Math.PI / 2);
        const x = centerX + horizontalRadius * Math.cos(angle);
        const y = centerY + verticalRadius * Math.sin(angle);
        newPositions.set(node.id, { x, y });
      });
      setNodePositions(newPositions);
    };

    calculatePositions();
    window.addEventListener('resize', calculatePositions);
    return () => window.removeEventListener('resize', calculatePositions);
  }, [nodes]);

  // Effect to render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodePositions.size === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };

      let linkToHover = null;
      for (const link of links) {
        const sPos = nodePositions.get(link.source.id);
        const tPos = nodePositions.get(link.target.id);
        if (!sPos || !tPos) continue;

        const midPoint = { x: (sPos.x + tPos.x) / 2, y: (sPos.y + tPos.y) / 2 };
        const dist = Math.sqrt(Math.pow(mousePos.current.x - midPoint.x, 2) + Math.pow(mousePos.current.y - midPoint.y, 2));
        
        if (dist < 20) {
            linkToHover = link;
            break;
        }
      }
      hoveredLinkRef.current = linkToHover;
    };

    const handleCanvasClick = (event: MouseEvent) => {
        if (hoveredLinkRef.current) {
            setSelectedLink(hoveredLinkRef.current);
        }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick);

    let animationFrameId: number;
    const render = () => {
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const container = containerRef.current;
      if (!container) return;

      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const linkColor = theme === 'dark' ? 'rgba(71, 85, 105, 0.7)' : 'rgba(203, 213, 225, 0.7)';
      const textColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';
      const hoveredLink = hoveredLinkRef.current;
      
      canvas.style.cursor = hoveredLink ? 'pointer' : 'default';

      links.forEach(link => {
        const sPos = nodePositions.get(link.source.id);
        const tPos = nodePositions.get(link.target.id);
        if (!sPos || !tPos) return;

        const isHovered = hoveredLink === link;
        
        ctx.beginPath(); 
        ctx.moveTo(sPos.x, sPos.y); 
        ctx.lineTo(tPos.x, tPos.y);
        ctx.strokeStyle = isHovered ? '#06b6d4' : linkColor; 
        ctx.lineWidth = isHovered ? 4 : 2; 
        ctx.stroke();

        const mx = (sPos.x + tPos.x) / 2;
        const my = (sPos.y + tPos.y) / 2;
        
        // Pulsing red "ball" indicating an interactive link (pulse only on hover)
        const pulse = isHovered ? Math.abs(Math.sin(Date.now() / 150)) * 5 : 0;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); 
        ctx.arc(mx, my, 8 + pulse, 0, Math.PI * 2); 
        ctx.fill();

        // Always draw the animated arrow
        const bounceOffset = Math.abs(Math.sin(Date.now() / 250)) * 8;
        const arrowBaseY = my - 18 - bounceOffset;
        const arrowSize = 6;

        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(mx, arrowBaseY + arrowSize); // Tip pointing down
        ctx.lineTo(mx - arrowSize, arrowBaseY); // Top left
        ctx.lineTo(mx + arrowSize, arrowBaseY); // Top right
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0; // Reset shadow for other elements
      });


      nodes.forEach(node => {
        const pos = nodePositions.get(node.id);
        if (!pos) return;

        const isHoveredSourceOrTarget = hoveredLink && (hoveredLink.source.id === node.id || hoveredLink.target.id === node.id);
        const radius = node.radius * (isHoveredSourceOrTarget ? 1.2 : 1);

        ctx.shadowColor = node.color; 
        ctx.shadowBlur = isHoveredSourceOrTarget ? 30 : 15;
        ctx.beginPath(); 
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color; 
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = textColor; 
        ctx.font = 'bold 11px sans-serif'; 
        ctx.textAlign = 'center';
        const label = node.caseNumber.length > 15 ? node.caseNumber.substring(0, 13) + '...' : node.caseNumber;
        ctx.fillText(label, pos.x, pos.y + 4);
      });
      
      // Draw tooltip only on hover
      if (hoveredLink) {
        const text = `Investigate Link: ${hoveredLink.evidence}`;
        ctx.font = '12px sans-serif';
        const textMetrics = ctx.measureText(text);
        const tooltipWidth = textMetrics.width + 20;
        const tooltipHeight = 30;
        const tooltipX = mousePos.current.x + 15;
        const tooltipY = mousePos.current.y + 15;
        
        ctx.fillStyle = 'rgba(2, 6, 23, 0.8)'; // slate-950
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
        ctx.fill();

        ctx.fillStyle = '#e2e8f0'; // slate-200
        ctx.fillText(text, tooltipX + tooltipWidth / 2, tooltipY + tooltipHeight / 2 + 4);
      }


      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [nodePositions, links, theme]);

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case EntityType.PERSON: return <User size={14} />;
      case EntityType.PHONE: return <Smartphone size={14} />;
      case EntityType.EMAIL: return <Mail size={14} />;
      case EntityType.LOCATION: return <MapPin size={14} />;
      default: return <HardDrive size={14} />;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
       {selectedLink && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center">
                <Share2 className="mr-3 text-cyan-500"/>
                Link Analysis: {selectedLink.source.caseNumber} &harr; {selectedLink.target.caseNumber}
              </h3>
              <button onClick={() => setSelectedLink(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-2">Linked by {selectedLink.reason.replace('Shared ', '')}: <span className="font-mono text-cyan-600 dark:text-cyan-400">{selectedLink.evidence}</span></p>
                <div className="text-slate-700 dark:text-slate-300">
                  {isSummaryLoading && !correlationSummary ? <div className="flex items-center space-x-2"><Loader2 className="animate-spin" size={16}/><span>Generating AI Summary...</span></div> : <p>{correlationSummary}{isSummaryLoading && <span className="inline-block w-2 h-4 bg-slate-600 dark:bg-slate-300 ml-1 animate-pulse"></span>}</p>}
                </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 overflow-y-auto">
              {[selectedLink.source, selectedLink.target].map(caseNode => {
                const caseData = dbService.getCaseData(caseNode.id);
                return (
                  <div key={caseNode.id} className="bg-white dark:bg-slate-900 p-4">
                    <h4 className="font-bold text-lg">{caseNode.caseNumber}</h4>
                    <p className="text-sm text-slate-500">{caseNode.filename}</p>
                    <div className="my-4"><MiniGraph caseData={caseData} highlightedValue={selectedLink.evidence} theme={theme}/></div>
                    <h5 className="font-semibold text-sm mb-2">Key Entities</h5>
                    <div className="space-y-1 text-xs">
                      {caseData.entities.slice(0, 5).map(e => (
                        <div key={e.id} className={`flex items-center space-x-2 p-1.5 rounded ${e.value === selectedLink.evidence ? 'bg-cyan-100 dark:bg-cyan-900/40' : ''}`}>
                          <span className="text-cyan-600 dark:text-cyan-400">{getEntityIcon(e.type)}</span>
                          <span className="text-slate-600 dark:text-slate-300">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
       )}
       
       <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900 flex items-center">
            <Zap className="mr-3 text-cyan-500" />
            Link Analysis Graph
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Visualizing shared evidence across all cases. Hover over a link icon to see details and click to investigate.
          </p>
        </div>

      {nodes.length > 1 && links.length > 0 ? (
         <div ref={containerRef} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden relative shadow-inner">
           <canvas ref={canvasRef} className="w-full h-full block" />
           <div className="absolute top-4 right-4 flex flex-col gap-2 bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-lg text-xs backdrop-blur-sm">
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>High Risk</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Medium Risk</div>
              <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Low Risk</div>
           </div>
         </div>
       ) : (
         <div className="flex-1 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={32} />
            </div>
           <h3 className="text-2xl font-bold dark:text-white text-slate-900">No Links Found</h3>
           <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
             Upload more case files. The system will automatically detect and link cases that share common entities like phone numbers, emails, or devices.
           </p>
         </div>
       )}
    </div>
  );
};

export default LinkAnalysisPage;