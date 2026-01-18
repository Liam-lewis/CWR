import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, MapPin, FileText, Download, ExternalLink, Send, Check, Loader2, X } from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [emailGroups, setEmailGroups] = useState([]);
  const [showForward, setShowForward] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [forwarding, setForwarding] = useState(false);
  const [forwardMsg, setForwardMsg] = useState('');

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/report/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        } else {
          setError('Report not found');
        }
      } catch (err) {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch(`/api/email-groups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setEmailGroups(data);
        } catch (err) { console.error(err); }
    };

    fetchReport();
    fetchGroups();
  }, [id, token, navigate]);

  const handleForward = async () => {
      if (selectedGroups.length === 0) return;
      setForwarding(true);
      setForwardMsg('');
      try {
          const res = await fetch(`/api/report/${id}/forward`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ groupIds: selectedGroups })
          });
          const data = await res.json();
          if (res.ok) {
              setForwardMsg('Forwarded successfully!');
              setShowForward(false);
              setSelectedGroups([]);
              // Refresh report to show history
              const resRep = await fetch(`/api/report/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const dataRep = await resRep.json();
              setReport(dataRep);
          } else {
              setForwardMsg(data.error || 'Failed to forward');
          }
      } catch (err) {
          setForwardMsg('Error forwarding report');
      } finally {
          setForwarding(false);
      }
  };

  const toggleGroup = (groupId) => {
      setSelectedGroups(prev => 
          prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
      );
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold uppercase tracking-widest text-gray-400">Loading Report...</div>;
  if (error) return <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
    <p className="text-red-500 font-bold">{error}</p>
    <Link to="/admin" className="text-sm font-bold border-b border-black">Back to Dashboard</Link>
  </div>;

  const evidence = typeof report.evidence === 'string' ? JSON.parse(report.evidence) : report.evidence;
  const history = typeof report.forwardHistory === 'string' ? JSON.parse(report.forwardHistory || '[]') : (report.forwardHistory || []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-20">
      {/* Header */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-black tracking-tight uppercase">Hither Green Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowForward(!showForward)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all"
            >
                <Send className="h-3 w-3" /> Forward Report
            </button>
            <span className="font-mono text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">#{report.referenceNumber}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Forwarding Panel */}
        {showForward && (
            <div className="mb-12 p-8 bg-gray-50 rounded-3xl border border-gray-200 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest">Select Recipients</h3>
                    <button onClick={() => setShowForward(false)} className="text-gray-400 hover:text-black"><X className="h-5 w-5" /></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {emailGroups.map(group => (
                        <button 
                            key={group.id}
                            onClick={() => toggleGroup(group.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                selectedGroups.includes(group.id) ? 'border-black bg-white shadow-lg' : 'border-transparent bg-white/50 grayscale opacity-60'
                            }`}
                        >
                            <span className="font-bold text-sm">{group.name}</span>
                            {selectedGroups.includes(group.id) && <Check className="h-4 w-4" />}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={handleForward}
                    disabled={forwarding || selectedGroups.length === 0}
                    className="w-full py-4 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400"
                >
                    {forwarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {forwarding ? 'Sending...' : 'Send Forward'}
                </button>
                {forwardMsg && <p className="mt-4 text-center text-xs font-bold uppercase text-gray-400">{forwardMsg}</p>}
            </div>
        )}

        <div className="grid gap-12">
            
            {/* Forwarding History (Super Admin Only) */}
            {role === 'superadmin' && history.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Forwarding History</h3>
                    <div className="space-y-2">
                        {history.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                                <span className="text-gray-900">Sent to: {item.to}</span>
                                <span className="text-gray-400">{new Date(item.sentAt).toLocaleString()} by {item.sentBy}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Section */}
            <div className="grid md:grid-cols-2 gap-12 border-b border-gray-100 pb-12">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Nature of Incident</h3>
                        <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider rounded">
                            {report.type}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Timestamp</h3>
                        <div className="flex items-center gap-4 text-sm font-bold">
                            <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gray-400" /> {report.date}</div>
                            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-gray-400" /> {report.time}</div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Location</h3>
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold leading-tight">{report.location}</p>
                                {report.latitude && (
                                    <a 
                                        href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`} 
                                        target="_blank" 
                                        className="text-[10px] text-gray-400 font-bold border-b border-gray-200 mt-2 inline-block hover:text-black transition-colors"
                                    >
                                        View on Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Description</h3>
                <div className="bg-gray-50 p-8 rounded-2xl text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {report.description || "No description provided."}
                </div>
            </div>

            {/* Evidence Grid */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Evidence ({evidence.length})</h3>
                </div>
                
                {evidence.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {evidence.map((file, idx) => (
                            <div key={idx} className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                {file.match(/\.(mp4|mov|webm)$/i) ? (
                                    <video 
                                        src={`${apiUrl}/uploads/${file}`} 
                                        controls 
                                        className="w-full aspect-video object-cover"
                                    />
                                ) : (
                                    <img 
                                        src={`${apiUrl}/uploads/${file}`} 
                                        alt="Evidence" 
                                        className="w-full h-auto"
                                    />
                                )}
                                <div className="p-4 flex justify-between items-center bg-white border-t border-gray-100">
                                    <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]">{file}</span>
                                    <div className="flex gap-2">
                                        <a href={`${apiUrl}/uploads/${file}`} target="_blank" download className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <Download className="h-4 w-4 text-gray-500" />
                                        </a>
                                        <a href={`${apiUrl}/uploads/${file}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <ExternalLink className="h-4 w-4 text-gray-500" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 p-12 rounded-2xl flex flex-col items-center justify-center text-gray-300 gap-2 border border-dashed border-gray-200">
                        <FileText className="h-8 w-8" />
                        <span className="text-xs font-bold uppercase tracking-widest">No evidence supplied</span>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}
