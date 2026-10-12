import React, { useState } from 'react';
import { Link2, Copy, Check, ExternalLink, QrCode, ArrowRight, Loader2, Sparkles, BarChart3, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';

export default function UrlShortener({ onSelectAnalytics, setLastTelemetry }) {
  const [longUrl, setLongUrl] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdUrl, setCreatedUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [recentLinks, setRecentLinks] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) return;

    setLoading(true);
    setError('');

    let expiresAt = null;
    if (expiresIn === '1h') {
      expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    } else if (expiresIn === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (expiresIn === '7d') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const startTime = performance.now();

    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl, expiresAt }),
      });

      const latency = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      // Telemetry update
      const serverId = res.headers.get('X-Server-Id') || 'api-replica';
      setLastTelemetry({
        latency,
        node: serverId,
        cacheStatus: 'PRE-WARMED'
      });

      setCreatedUrl(data);
      setRecentLinks(prev => [data, ...prev.slice(0, 4)]);
      setLongUrl('');

      // Confetti celebration animation!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Shortener Hero Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> High-Throughput URL Shortener
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Shorten links with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">Zero Collisions</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Backed by PostgreSQL Key Generation Service (KGS) and distributed Redis LRU/TTL caching.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
          <div className="relative flex flex-col sm:flex-row gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-700/80 shadow-inner focus-within:border-teal-500 transition-colors">
            <div className="relative flex-1 flex items-center pl-3">
              <Link2 className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Paste your long URL here (e.g. https://example.com/very/long/url)..."
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none py-2"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/25 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Shortening...
                </>
              ) : (
                <>
                  Shorten <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Optional Expiration Selector */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Optional Link TTL Expiration:</span>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value="">Never Expires (Permanent)</option>
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
              {error}
            </div>
          )}
        </form>

        {/* Generated URL Success Result Box */}
        {createdUrl && (
          <div className="max-w-2xl mx-auto mt-6 p-4 rounded-2xl bg-slate-900/90 border border-teal-500/40 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="truncate w-full text-left">
                <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block">
                  Generated Short Link:
                </span>
                <a
                  href={createdUrl.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base sm:text-lg font-mono font-bold text-white hover:text-teal-300 transition-colors inline-flex items-center gap-1.5 truncate max-w-full"
                >
                  {createdUrl.shortUrl} <ExternalLink className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                </a>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  Target: {createdUrl.longUrl}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>

                <button
                  onClick={() => setShowQr(!showQr)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                  title="Toggle QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectAnalytics(createdUrl.shortCode)}
                  className="px-3 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Analytics
                </button>
              </div>
            </div>

            {/* QR Code Reveal */}
            {showQr && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col items-center justify-center">
                <div className="p-3 bg-white rounded-xl shadow-md">
                  <QRCodeSVG value={createdUrl.shortUrl} size={130} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Scan to test instant 302 redirection</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Links History */}
      {recentLinks.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Recently Created Links In This Session
          </h3>
          <div className="space-y-2">
            {recentLinks.map((item) => (
              <div key={item.shortCode} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="truncate">
                  <a href={item.shortUrl} target="_blank" rel="noreferrer" className="font-mono font-bold text-teal-400 hover:underline">
                    {item.shortUrl}
                  </a>
                  <span className="text-slate-500 mx-2">→</span>
                  <span className="text-slate-400 truncate">{item.longUrl}</span>
                </div>
                <button
                  onClick={() => onSelectAnalytics(item.shortCode)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 flex-shrink-0"
                >
                  <BarChart3 className="w-3 h-3 text-teal-400" /> Stats
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
