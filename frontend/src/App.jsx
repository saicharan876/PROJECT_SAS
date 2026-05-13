import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CVBuilder from './pages/CVBuilder';
import ATSChecker from './pages/ATSChecker';
import AssignmentSolver from './pages/AssignmentSolver';
import ScholarshipFinder from './pages/ScholarshipFinder';
import ContestTracker from './pages/ContestTracker';
import SmartTodo from './pages/SmartTodo';
import './index.css';

const ProtectedLayout = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="page-layout">
      <Sidebar />
      <main className="page-content"><Outlet /></main>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cv-builder" element={<CVBuilder />} />
            <Route path="/ats-checker" element={<ATSChecker />} />
            <Route path="/assignments" element={<AssignmentSolver />} />
            <Route path="/scholarships" element={<ScholarshipFinder />} />
            <Route path="/contests" element={<ContestTracker />} />
            <Route path="/tasks" element={<SmartTodo />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
