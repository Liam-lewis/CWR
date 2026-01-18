import { useState, useEffect } from 'react';
import { Search, LogOut, Download, FileText, UserPlus, Shield, FileSpreadsheet, Map as MapIcon, List, Settings as SettingsIcon, Filter, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState({ token: null, role: null });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
        setAuth({ token, role });
        fetchReports(token);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setAuth({ token: data.token, role: data.role });
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        fetchReports(data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Check server.');
    }
  };

  const handleLogout = () => {
    setAuth({ token: null, role: null });
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const fetchReports = async (token, query = '') => {
    setLoading(true);
    try {
      const url = query ? `/api/reports?q=${query}` : `/api/reports`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else if (res.status === 401 || res.status === 403) {
          handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports(auth.token, search);
  };

  const handleExportCSV = () => {
    if (!reports.length) return;
    
    // Create CSV content safely
    const headers = ['ID', 'Reference', 'Type', 'Location', 'Date', 'Time', 'Description', 'Evidence Count', 'Latitude', 'Longitude'];
    const rows = reports.map(r => {
        const safeLoc = r.location ? `"${r.location.replace(/"/g, '""')}"` : '""';
        const safeDesc = r.description ? `"${r.description.replace(/"/g, '""')}"` : '""';
        let evCount = 0;
        try {
            const ev = typeof r.evidence === 'string' ? JSON.parse(r.evidence) : r.evidence;
            evCount = ev ? ev.length : 0;
        } catch(e) { evCount = 0; }
        
        return [
            r.id,
            r.referenceNumber,
            r.type,
            safeLoc,
            r.date,
            r.time,
            safeDesc,
            evCount,
            r.latitude || '',
            r.longitude || ''
        ];
    });
    
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `community_reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!auth.token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4">
        <div className="max-w-sm w-full space-y-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-black rounded-xl mx-auto mb-6"></div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admin Access</h2>
            <p className="mt-2 text-gray-500">Enter your credentials to continue.</p>
          </div>
          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <div className="space-y-4">
              <input
                type="text"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-gray-50"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              />
              <input
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-gray-50"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <button type="submit" className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all shadow-lg shadow-gray-200">
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Top Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-black rounded-lg"></div>
             <span className="text-xl font-black tracking-tight uppercase hidden md:inline">Hither Green Dashboard</span>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 hidden sm:inline mr-2">
                {auth.role}
            </span>
            {auth.role === 'superadmin' && (
                <Link to="/admin/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                    <SettingsIcon className="h-5 w-5" />
                </Link>
            )}
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                <LogOut className="h-5 w-5" />
            </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="px-6 py-8 max-w-[1800px] mx-auto">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-12">
            <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                    type="text"
                    placeholder="Search reports..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-black transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </form>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                    >
                        <List className="h-4 w-4" /> List
                    </button>
                    <button 
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                    >
                        <MapIcon className="h-4 w-4" /> Map
                    </button>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-black hover:text-white hover:border-black transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <FileSpreadsheet className="h-4 w-4" /> Export
                </button>
            </div>
        </div>
        
        {loading ? (
           <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>
        ) : (
          <>
            {viewMode === 'map' ? (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 h-[700px] overflow-hidden relative z-0">
                    <MapContainer center={[51.4517, -0.0003]} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; CARTO'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        {reports.map(report => (
                            report.latitude && report.longitude ? (
                                <Marker key={report.id} position={[report.latitude, report.longitude]}>
                                    <Popup>
                                        <div className="min-w-[200px] font-sans">
                                            <p className="font-bold text-black text-xs mb-1">#{report.referenceNumber}</p>
                                            <h3 className="font-bold text-sm mb-1">{report.type}</h3>
                                            <p className="text-xs text-gray-500 mb-2">{report.location}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ) : null
                        ))}
                    </MapContainer>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Incident Identity</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Location</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 w-1/3">Summary</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Evidence</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-[10px] text-gray-400 mb-1">{report.referenceNumber}</div>
                                            <div className="text-xs font-bold text-gray-900">{report.date}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{report.time}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded">
                                                {report.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 max-w-[200px] truncate">{report.location}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-500 line-clamp-2 max-w-md leading-relaxed">
                                                {report.description || <span className="italic text-gray-300">No details provided</span>}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                let evidence = [];
                                                try { evidence = typeof report.evidence === 'string' ? JSON.parse(report.evidence) : report.evidence; } catch (e) { evidence = []; }
                                                return evidence && evidence.length > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-3 w-3 text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-900">{evidence.length} Items</span>
                                                    </div>
                                                ) : <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">None</span>;
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link 
                                                    to={`/admin/report/${report.id}`}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-sm"
                                                >
                                                    Open <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {reports.length === 0 && !loading && (
                 <div className="text-center py-20">
                    <p className="text-gray-400 font-medium">No reports found.</p>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}