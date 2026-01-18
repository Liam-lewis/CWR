import { Routes, Route } from 'react-router-dom';
import SplashPage from './pages/SplashPage';
import ReportForm from './pages/ReportForm';
import StatsPage from './pages/StatsPage';
import AdminDashboard from './pages/AdminDashboard';
import SettingsPage from './pages/SettingsPage';
import ReportDetailPage from './pages/ReportDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/report" element={<ReportForm />} />
      <Route path="/submitted" element={<StatsPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/report/:id" element={<ReportDetailPage />} />
      <Route path="/admin/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;
