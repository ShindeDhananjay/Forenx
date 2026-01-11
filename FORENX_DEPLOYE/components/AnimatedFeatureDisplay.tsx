import React, { useState, useEffect, useRef } from 'react';
import { Cpu, CheckCircle2, Network, Zap } from 'lucide-react';

const features = [
  {
    icon: <Cpu size={32} />,
    title: "Instantly Decode Evidence",
    description: "ForenX processes unstructured reports from PDFs and text logs, automatically extracting critical entities and events.",
  },
  {
    icon: <CheckCircle2 size={32} />,
    title: "Generate Actionable Intelligence",
    description: "Receive AI-powered executive summaries, risk assessments, and clear, actionable recommendations for next steps.",
  },
  {
    icon: <Network size={32} />,
    title: "Map Hidden Networks",
    description: "Visualize complex relationships between people, devices, and locations in an intuitive, interactive graph.",
  },
  {
    icon: <Zap size={32} />,
    title: "Reveal Cross-Case Connections",
    description: "Our AI automatically surfaces links between different cases that share common evidence, uncovering larger operations.",
  },
];

const AnimatedFeatureDisplay: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 5000); // Change feature every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reset animation when index changes
    const progressBar = progressBarRef.current;
    if (progressBar) {
      progressBar.classList.remove('animate-progress-bar-fill');
      void progressBar.offsetWidth; // Trigger reflow
      progressBar.classList.add('animate-progress-bar-fill');
    }
  }, [currentIndex]);

  const currentFeature = features[currentIndex];

  return (
    <div className="w-full min-h-[180px] bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
      {features.map((feature, index) => (
        <div
          key={index}
          className={`absolute inset-0 p-6 flex flex-col items-center justify-center text-center transition-opacity duration-500 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="text-cyan-400 bg-cyan-900/20 p-3 rounded-lg mb-4">
            {feature.icon}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
        </div>
      ))}
       <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-700/50">
        <div
          ref={progressBarRef}
          className="h-full bg-cyan-400 animate-progress-bar-fill"
          style={{ animationDuration: '5s', animationTimingFunction: 'linear' }}
        ></div>
      </div>
    </div>
  );
};

export default AnimatedFeatureDisplay;