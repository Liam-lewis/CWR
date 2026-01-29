import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import MapPicker from '../components/MapPicker';
import { Search, Calendar, Clock, ChevronLeft, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReportForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    time: '',
    date: '',
    description: ''
  });
  
  const [pinPosition, setPinPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 51.4517, lng: -0.0003 });
  
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({ loading: false, message: '', error: false });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].slice(0, 5)
    }));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = { lat: latitude, lng: longitude };
          setPinPosition(pos);
          setMapCenter(pos);
        },
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMapClick = async (latlng) => {
    setPinPosition(latlng);
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
        const data = await res.json();
        if (data && data.address) {
            const street = data.address.road || data.address.pedestrian || data.address.suburb || '';
            const postcode = data.address.postcode || '';
            const locationName = street ? `${street}, ${postcode}` : data.display_name.split(',')[0];
            setFormData(prev => ({ ...prev, location: locationName }));
        } else {
             setFormData(prev => ({ ...prev, location: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}` }));
        }
    } catch (error) {
        setFormData(prev => ({ ...prev, location: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}` }));
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.location) return;
    setIsSearching(true);
    try {
      const query = encodeURIComponent(formData.location);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setPinPosition(newPos);
        setMapCenter(newPos);
      } else {
        setStatus({ loading: false, message: 'Location not found.', error: true });
        setTimeout(() => setStatus({ ...status, message: '' }), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: 'Submitting...', error: false });

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (pinPosition) {
        data.append('latitude', pinPosition.lat);
        data.append('longitude', pinPosition.lng);
    }
    files.forEach(file => data.append('evidence', file));

    try {
      const response = await fetch(`/api/report`, {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        navigate('/submitted');
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit report');
      }
    } catch (error) {
      setStatus({ loading: false, message: 'Error: ' + error.message, error: true });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <nav className="border-b border-gray-100 relative bg-white z-40 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Link to="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-black tracking-tight uppercase">New Report</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
          
        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: The Basics */}
            <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">01. The Basics</h2>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold block">Incident Type</label>
                        <select
                            name="type"
                            required
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none"
                        >
                            <option value="">Select Type...</option>
                            <option value="vandalism">Vandalism / Graffiti</option>
                            <option value="noise">Excessive Noise</option>
                            <option value="littering">Littering / Fly-tipping</option>
                            <option value="harassment">Harassment / Intimidation</option>
                            <option value="drugs">Drug Related Activity</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold block">Date</label>
                            <button
                                type="button"
                                onClick={() => document.getElementById('date-input').showPicker()}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-left font-medium flex justify-between items-center hover:bg-gray-100"
                            >
                                <span className="truncate">
                                {(() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                                    if (formData.date === today) return 'Today';
                                    if (formData.date === yesterday) return 'Yesterday';
                                    return formData.date;
                                })()}
                                </span>
                                <Calendar className="h-4 w-4 text-gray-400" />
                            </button>
                            <input id="date-input" type="date" name="date" required value={formData.date} onChange={handleChange} className="hidden" />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-bold block">Time</label>
                             <button
                                type="button"
                                onClick={() => document.getElementById('time-input').showPicker()}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-left font-medium flex justify-between items-center hover:bg-gray-100"
                            >
                                <span>{formData.time}</span>
                                <Clock className="h-4 w-4 text-gray-400" />
                            </button>
                            <input id="time-input" type="time" name="time" required value={formData.time} onChange={handleChange} className="hidden" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Location */}
            <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">02. Location</h2>
                <div className="space-y-2">
                     <div className="flex gap-2">
                        <input
                            type="text"
                            name="location"
                            required
                            placeholder="Search street name..."
                            value={formData.location}
                            onChange={handleChange}
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddressSearch(); } }}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all placeholder:text-gray-400"
                        />
                        <button 
                            type="button" 
                            onClick={handleAddressSearch}
                            disabled={isSearching}
                            className="bg-black text-white px-5 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                        >
                            {isSearching ? '...' : <Search className="h-5 w-5" />}
                        </button>
                     </div>
                     <MapPicker position={pinPosition} mapCenter={mapCenter} onLocationSelect={handleMapClick} />
                </div>
            </div>

            {/* Section 3: Details */}
            <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">03. Details</h2>
                
                <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what happened..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all placeholder:text-gray-400 resize-none"
                ></textarea>

                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer relative bg-gray-50/50 group">
                    <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                             <Upload className="h-5 w-5 text-black" />
                        </div>
                        <p className="font-bold text-gray-900">Tap to upload evidence</p>
                        <p className="text-xs text-gray-400">Photos or Videos (Max 10MB)</p>
                        {files.length > 0 && (
                            <div className="mt-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                                {files.length} files selected
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="pt-4 pb-8">
              <button
                type="submit"
                disabled={status.loading}
                className={`w-full py-4 rounded-xl text-lg font-bold text-white transition-all transform hover:-translate-y-1 ${
                    status.loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black shadow-xl shadow-gray-200'
                }`}
              >
                {status.loading ? 'Submitting...' : 'Submit Report'}
              </button>
              
              {status.message && (
                  <p className={`mt-4 text-center font-bold text-sm ${status.error ? 'text-red-500' : 'text-green-600'}`}>
                      {status.message}
                  </p>
              )}
            </div>

        </form>
      </div>
    </div>
  )
}