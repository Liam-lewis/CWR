import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ChevronLeft, Shield, Mail, Edit2, Check, X, Settings } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('access'); // 'access' or 'emails'
  const [auth, setAuth] = useState({ token: null, role: null });
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' });
  const [userMsg, setUserMsg] = useState({ type: '', text: '' });
  
  const [emailGroups, setEmailGroups] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editEmails, setEditEmails] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'superadmin') {
        navigate('/admin');
        return;
    }
    setAuth({ token, role });
    fetchGroups(token);
  }, [navigate]);

  const fetchGroups = async (token) => {
      try {
          const res = await fetch(`/api/email-groups`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          setEmailGroups(data);
      } catch (err) { console.error(err); }
  };

  const handleUpdateGroup = async (id) => {
      try {
          const res = await fetch(`/api/email-groups/${id}`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${auth.token}`
              },
              body: JSON.stringify({ emails: editEmails })
          });
          if (res.ok) {
              setEditingGroup(null);
              fetchGroups(auth.token);
          }
      } catch (err) { console.error(err); }
  };

  const handleCreateUser = async (e) => {
      e.preventDefault();
      setUserMsg({ type: '', text: '' });
      try {
          const res = await fetch(`/api/users`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${auth.token}`
              },
              body: JSON.stringify(newUser)
          });
          const data = await res.json();
          if (res.ok) {
              setUserMsg({ type: 'success', text: 'User created successfully!' });
              setNewUser({ username: '', password: '', role: 'admin' });
          } else {
              setUserMsg({ type: 'error', text: data.error || 'Failed to create user' });
          }
      } catch (err) {
          setUserMsg({ type: 'error', text: 'Error creating user' });
      }
  };

  const tabs = [
    { id: 'access', label: 'Admin Access', icon: Shield },
    { id: 'emails', label: 'Email Groups', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-gray-100 bg-white z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to="/admin" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-xl font-black tracking-tight uppercase">Settings</h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                <Settings className="h-4 w-4" />
                <span>Super Admin</span>
            </div>
        </div>
      </nav>

      <div className="flex-1 flex max-w-6xl mx-auto w-full px-6 py-12 gap-12">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
            <div className="space-y-2 sticky top-24">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                            activeTab === tab.id 
                            ? 'bg-black text-white shadow-lg shadow-gray-200' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <tab.icon className="h-5 w-5" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </aside>

        {/* Mobile Tabs */}
        <div className="md:hidden flex gap-2 mb-8 overflow-x-auto pb-2">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        activeTab === tab.id 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-500'
                    }`}
                >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-xl">
            {activeTab === 'access' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tight">Admin Access</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">Create new administrator accounts to help manage reports and oversee community activity.</p>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-6 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Username</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. janesmith"
                                value={newUser.username} 
                                onChange={e => setNewUser({...newUser, username: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
                            <input 
                                type="password" 
                                required
                                placeholder="••••••••"
                                value={newUser.password} 
                                onChange={e => setNewUser({...newUser, password: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Role</label>
                            <select 
                                value={newUser.role} 
                                onChange={e => setNewUser({...newUser, role: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none"
                            >
                                <option value="admin">Regular Admin</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                        </div>
                        
                        <button type="submit" className="w-full py-4 px-4 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2">
                            <UserPlus className="h-4 w-4" /> Create Admin Account
                        </button>
                    </form>

                    {userMsg.text && (
                        <div className={`p-4 rounded-xl text-sm font-bold text-center ${userMsg.type === 'success' ? 'bg-black text-white' : 'bg-red-50 text-red-600'}`}>
                            {userMsg.text}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'emails' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tight">Email Groups</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">Manage the email lists that receive forwarded reports for different categories.</p>
                    </div>

                    <div className="space-y-4">
                        {emailGroups.map(group => (
                            <div key={group.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-black text-gray-900">{group.name}</h4>
                                    {editingGroup === group.id ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUpdateGroup(group.id)} className="p-2 bg-black text-white rounded-full transition-transform active:scale-90"><Check className="h-4 w-4" /></button>
                                            <button onClick={() => setEditingGroup(null)} className="p-2 bg-gray-200 text-gray-600 rounded-full transition-transform active:scale-90"><X className="h-4 w-4" /></button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => { setEditingGroup(group.id); setEditEmails(group.emails); }}
                                            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-1"
                                        >
                                            <Edit2 className="h-3 w-3" /> Edit
                                        </button>
                                    )}
                                </div>
                                
                                {editingGroup === group.id ? (
                                    <textarea 
                                        className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-black outline-none bg-white"
                                        rows="3"
                                        value={editEmails}
                                        onChange={e => setEditEmails(e.target.value)}
                                        placeholder="Enter emails separated by commas..."
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-gray-500 break-all leading-relaxed">
                                        {group.emails || "No emails configured."}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}
