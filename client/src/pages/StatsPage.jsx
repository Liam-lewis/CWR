import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowUpRight, ArrowDownRight, Home, ThumbsUp } from 'lucide-react';

export default function StatsPage() {
  const [stats, setStats] = useState({ total: 0, byMonth: [], trend: 0, recent: [] });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 5000);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/stats`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold">Updating community data...</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans py-12 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Success Header */}
        <div className="text-center mb-12">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-black mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">Report Submitted.</h1>
            <p className="text-gray-500 font-medium">Thank you for helping keep Hither Green safe.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Reports This Year</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tabular-nums">{stats.total}</span>
                    <span className="text-sm font-bold text-gray-400">Total Incidents</span>
                </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Monthly Trend</h3>
                <div className="flex items-center gap-3">
                     {stats.trend > 0 ? (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                        </div>
                     ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <ArrowDownRight className="h-5 w-5 text-green-600" />
                        </div>
                     )}
                    <span className="text-5xl font-black tabular-nums">
                        {Math.abs(stats.trend)}%
                    </span>
                </div>
            </div>
        </div>

        {/* Recent Feed */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Recent Community Activity</h3>
            <div className="space-y-4">
                {stats.recent && stats.recent.length > 0 ? (
                    stats.recent.map((report) => (
                        <div key={report.id} className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="h-2 w-2 rounded-full bg-black mt-1.5 flex-shrink-0"></div>
                            <div className="ml-4">
                                <h4 className="text-sm font-black text-gray-900 leading-none mb-1">{report.title}</h4>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    {new Date(report.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-sm font-medium">Listening for community reports...</p>
                )}
            </div>
        </div>

        {/* Sharing */}
        <div className="text-center space-y-6">
            <button 
                onClick={handleShare}
                className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white text-lg font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
            >
                {copied ? (
                    <><CheckCircle className="h-5 w-5" /> Link Copied!</>
                ) : (
                    <><ThumbsUp className="h-5 w-5" /> Helpful? …Share it!</>
                )}
            </button>
            
            {copied && (
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Copied to clipboard and ready to share.
                </p>
            )}

            <div className="pt-12">
                <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hover:text-black transition-colors">
                    Back to Home
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}