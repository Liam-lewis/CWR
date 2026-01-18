import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ChevronLeft, Shield, Mail, Edit2, Check, X } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState({ token: null, role: null });
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' });
  const [userMsg, setUserMsg] = useState({ type: '', text: '' });
  
  const [groups, setUsers] = useState([]); // reused state name from previous file but we'll use actual groups
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

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-black tracking-tight uppercase">Admin Settings</h1>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="space-y-12">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">User Management</h3>
                </div>
                
                <form onSubmit={handleCreateUser} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Username</label>
                        <input 
                            type="text" 
                            required
                            value={newUser.username} 
                            onChange={e => setNewUser({...newUser, username: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                        />
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
                        <input 
                            type="password" 
                            required
                            value={newUser.password} 
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Role</label>
                        <select 
                            value={newUser.role} 
                            onChange={e => setNewUser({...newUser, role: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none"
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
                    <div className={`mt-6 p-4 rounded-xl text-sm font-bold text-center ${userMsg.type === 'success' ? 'bg-black text-white' : 'bg-red-50 text-red-600'}`}>
                        {userMsg.text}
                    </div>
                )}
            </div>

            {/* Email Groups Section */}
            <div className="space-y-6 pt-12 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Email Forwarding Groups</h3>
                </div>

                <div className="space-y-4">
                    {emailGroups.map(group => (
                        <div key={group.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-black text-gray-900">{group.name}</h4>
                                {editingGroup === group.id ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateGroup(group.id)} className="p-2 bg-black text-white rounded-full"><Check className="h-4 w-4" /></button>
                                        <button onClick={() => setEditingGroup(null)} className="p-2 bg-gray-200 text-gray-600 rounded-full"><X className="h-4 w-4" /></button>
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
                                    className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-black"
                                    value={editEmails}
                                    onChange={e => setEditEmails(e.target.value)}
                                    placeholder="Enter emails separated by commas..."
                                />
                            ) : (
                                <p className="text-sm font-medium text-gray-500 break-all">{group.emails}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}