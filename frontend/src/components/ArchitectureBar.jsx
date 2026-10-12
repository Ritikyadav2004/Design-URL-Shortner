import React from 'react';
import { Network, Server, Database, Cpu, HardDrive } from 'lucide-react';

export default function ArchitectureBar({ activeNode, lastTelemetry }) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 mb-8 border border-slate-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-teal-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Live Distributed Topology Flow
          </h3>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Last Request Latency: <span className="text-teal-400 font-bold">{lastTelemetry?.latency ? `${lastTelemetry.latency}ms` : 'Ready'}</span>
        </div>
      </div>

      {/* Architecture Flow Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Node 1: Nginx */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-300">Nginx Load Balancer</span>
            <Network className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-mono text-slate-400">
            Port: <span className="text-sky-300">80</span> | Round-Robin
          </div>
        </div>

        {/* Node 2: Backend Replica */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-teal-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-300">Routed Worker</span>
            <Server className="w-4 h-4 text-teal-400" />
          </div>
          <div className="font-mono text-slate-400">
            Active: <span className="text-teal-300 font-bold">{activeNode || 'api-1 / api-2'}</span>
          </div>
        </div>

        {/* Node 3: Redis Cache */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-300">Redis Cache-Aside</span>
            <Cpu className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono flex items-center justify-between">
            <span className="text-slate-400">Status:</span>
            {lastTelemetry?.cacheStatus ? (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                lastTelemetry.cacheStatus === 'CACHE_HIT' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {lastTelemetry.cacheStatus}
              </span>
            ) : (
              <span className="text-slate-500">LRU + TTL</span>
            )}
          </div>
        </div>

        {/* Node 4: PostgreSQL KGS */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-300">PostgreSQL KGS</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-mono text-slate-400">
            Keys: <span className="text-indigo-300">7-Char Base62 ACID</span>
          </div>
        </div>
      </div>
    </div>
  );
}
