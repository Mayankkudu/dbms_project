import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import WardBoyDashboard from './pages/WardBoyDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import LabDashboard from './pages/LabDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminList from './pages/AdminList';
import { ROLE_HOME } from './utils/roles';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/patient/dashboard" element={
            <ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard /></ProtectedRoute>
          } />
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>
          } />
          <Route path="/nurse/dashboard" element={
            <ProtectedRoute allowedRoles={['NURSE']}><NurseDashboard /></ProtectedRoute>
          } />
          <Route path="/receptionist/dashboard" element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST']}><ReceptionistDashboard /></ProtectedRoute>
          } />
          <Route path="/wardboy/dashboard" element={
            <ProtectedRoute allowedRoles={['WARD_BOY']}><WardBoyDashboard /></ProtectedRoute>
          } />
          <Route path="/pharmacist/dashboard" element={
            <ProtectedRoute allowedRoles={['PHARMACIST']}><PharmacistDashboard /></ProtectedRoute>
          } />
          <Route path="/lab/dashboard" element={
            <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}><LabDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/list/:type" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminList /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
