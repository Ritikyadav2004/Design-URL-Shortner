import React, { useState, useEffect } from 'react';
import { X, BarChart3, Globe, Users, Clock, RefreshCw, Loader2, ArrowUpRight } from 'lucide-react';

export default function AnalyticsModal({ shortCode, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    if (!shortCode) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/urls/${shortCode}/analytics`);
      if (!res.ok) throw new Error('Failed to load analytics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [shortCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 relative overflow-hidden border border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Link Telemetry & Analytics
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Short Code: <span className="text-teal-400 font-bold">{shortCode}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
          {loading && !data ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-2" />
              <p className="text-xs">Aggregating telemetry logs...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Users className="w-3.5 h-3.5 text-teal-400" /> Total Clicks
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {data.info.click_count || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> Top Source
                  </div>
                  <div className="text-sm font-bold text-slate-200 truncate">
                    {data.topReferrers[0]?.referrer || 'Direct'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Created
                  </div>
                  <div className="text-xs text-slate-300">
                    {new Date(data.info.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Destination URL */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-0.5">Target Destination:</span>
                <a
                  href={data.info.long_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 font-mono hover:underline inline-flex items-center gap-1 break-all"
                >
                  {data.info.long_url} <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>

              {/* Recent Click Logs Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Recent Click Events (Asynchronous Ingestion)
                </h4>
                {data.recentClicks && data.recentClicks.length > 0 ? (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/60 text-slate-400 text-[11px] font-semibold">
                        <tr>
                          <th className="p-2.5">Time</th>
                          <th className="p-2.5">Referrer</th>
                          <th className="p-2.5">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {data.recentClicks.map((click, i) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="p-2.5 font-mono text-slate-400 text-[11px]">
                              {new Date(click.clicked_at).toLocaleTimeString()}
                            </td>
                            <td className="p-2.5 truncate max-w-[150px]">
                              {click.referrer || 'Direct'}
                            </td>
                            <td className="p-2.5 font-mono text-slate-400 text-[11px]">
                              {click.ip_address}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500">
                    No clicks recorded yet. Click or test your short URL to see telemetry here!
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
