import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TuteeListPage from './pages/TuteeListPage';
import TutorListPage from './pages/TutorListPage';
import SchedulePage from './pages/SchedulePage';
import TuteeProfilePage from './pages/TuteeProfilePage';
import TutorProfilePage from './pages/TutorProfilePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tutees" element={<TuteeListPage />} />
        <Route path="/tutors" element={<TutorListPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/tutee/:id" element={<TuteeProfilePage />} />
        <Route path="/tutor/:id" element={<TutorProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

export default App;