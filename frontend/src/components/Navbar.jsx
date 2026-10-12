import React, { useState, useEffect } from 'react';
import { Server, Database, Zap, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({ activeNode, setActiveNode }) {
  const [health, setHealth] = useState({ status: 'CHECKING', serverId: 'N/A' });

  // Poll health every 5 seconds to show live Nginx round-robin switching!
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/health');
        const data = await res.json();
        const duration = Math.round(performance.now() - start);
        
        setHealth({
          status: data.status,
          serverId: data.serverId || 'API-Replica',
          latency: duration,
          services: data.services
        });
        if (setActiveNode) setActiveNode(data.serverId);
      } catch (err) {
        setHealth({ status: 'DOWN', serverId: 'Offline' });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 4000);
    return () => clearInterval(interval);
  }, [setActiveNode]);

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">ScaleURL</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                System Design Showcase
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Distributed TinyURL clone with Nginx LB, KGS & Redis Cache
            </p>
          </div>
        </div>

        {/* Live Cluster Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Active Replica Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/60 text-xs">
            <Server className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="text-slate-400 hidden md:inline">Routed By Nginx:</span>
            <span className="font-mono font-semibold text-teal-300">
              {health.serverId}
            </span>
          </div>

          {/* Cluster Health Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            health.status === 'UP' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${health.status === 'UP' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
            <span>{health.status === 'UP' ? 'Cluster Healthy' : 'Cluster Offline'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
