import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ArchitectureBar from './components/ArchitectureBar';
import UrlShortener from './components/UrlShortener';
import AnalyticsModal from './components/AnalyticsModal';
import { Layers, ShieldCheck, Zap, Database, Cpu, GitFork } from 'lucide-react';

export default function App() {
  const [activeNode, setActiveNode] = useState('API-Replica-1');
  const [lastTelemetry, setLastTelemetry] = useState(null);
  const [selectedAnalyticsCode, setSelectedAnalyticsCode] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden bg-mesh-glow">
      {/* Top Navbar */}
      <Navbar activeNode={activeNode} setActiveNode={setActiveNode} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Live Architecture Topology Inspector */}
        <ArchitectureBar activeNode={activeNode} lastTelemetry={lastTelemetry} />

        {/* URL Shortener Main Playground */}
        <UrlShortener
          onSelectAnalytics={(code) => setSelectedAnalyticsCode(code)}
          setLastTelemetry={setLastTelemetry}
        />

        {/* System Design Highlights Grid */}
        <section className="mt-16 pt-12 border-t border-slate-800/80">
          <div className="text-center mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              System Design Blueprint Under The Hood
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Exact implementations of the distributed interview requirements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-3">
                <Database className="w-5 h-5 text-teal-400" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Key Generation Service (KGS)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eliminates hash collisions. Uses PostgreSQL row-level locks with <code className="text-teal-300 font-mono">FOR UPDATE SKIP LOCKED</code> to safely allocate pre-generated 7-character Base62 keys.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Redis Cache-Aside Pattern</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Delivers sub-millisecond redirect lookups (<code className="text-indigo-300 font-mono">&lt;1ms</code>). Caches hot URLs with LRU & TTL eviction, offloading 90%+ traffic from PostgreSQL.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-3">
                <GitFork className="w-5 h-5 text-sky-400" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Nginx Layer-7 Load Balancer</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Horizontal scaling across Docker container replicas using Round-Robin. Provides high availability and zero-downtime failover.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Analytics Modal */}
      {selectedAnalyticsCode && (
        <AnalyticsModal
          shortCode={selectedAnalyticsCode}
          onClose={() => setSelectedAnalyticsCode(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Built for System Design Showcase & Interview Portfolio</p>
      </footer>
    </div>
  );
}
