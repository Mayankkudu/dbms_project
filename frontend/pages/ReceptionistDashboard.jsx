import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, StatCard, EmptyState } from '../components/Common';
import { Modal, QuickActionCard } from '../components/Modal';
import { PatientSearch } from '../components/PatientSearch';
import { TodayAppointments } from '../components/TodayAppointments';
import { WaitingQueue } from '../components/WaitingQueue';
import { RecentActivity } from '../components/RecentActivity';
import BedCommandCenter from '../components/BedCommandCenter';
import api from '../services/api';

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState(null);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    api.get('/stats/summary').then(res => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <DashboardLayout title="Receptionist Front Desk">
      
      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 15, marginBottom: 25 }}>
        <StatCard label="Total Patients" value={stats?.totalPatients || 0} icon="👤" />
        <StatCard label="Today's Appts" value={stats?.todaysAppointments || 0} tone="success" icon="📅" />
        <StatCard label="Waiting Queue" value={stats?.waitingPatients || 0} tone="warning" icon="⏳" />
        <StatCard label="Available Beds" value={stats?.availableBeds || 0} tone="info" icon="🛏️" />
      </div>

      {/* Quick Actions */}
      <h3 style={{ marginBottom: 15 }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 15, marginBottom: 25 }}>
        <QuickActionCard label="Register Patient" icon="➕" onClick={() => setModalType('register')} />
        <QuickActionCard label="Search Patient" icon="🔍" onClick={() => setModalType('search')} />
        <QuickActionCard label="Add to Queue" icon="🎟️" onClick={() => setModalType('queue')} />
        <QuickActionCard label="Assign Bed" icon="🛏️" onClick={() => setModalType('admit')} />
      </div>

      {/* Main Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card title="Today's Appointments">
                <TodayAppointments />
            </Card>
            <Card title="Waiting Queue">
                <WaitingQueue />
            </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card title="Recent Activity">
                <RecentActivity />
            </Card>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <BedCommandCenter token={localStorage.getItem('token')} />
      </div>

      {/* Modals */}
      <Modal isOpen={modalType === 'search'} onClose={() => setModalType(null)} title="Search Patient">
        <PatientSearch onSelect={(p) => { alert('Selected ' + p.first_name); setModalType(null); }} />
      </Modal>

      <Modal isOpen={modalType === 'register'} onClose={() => setModalType(null)} title="Register Patient">
        <EmptyState message="Registration form rendered here" icon="📋" />
      </Modal>

      <Modal isOpen={modalType === 'queue'} onClose={() => setModalType(null)} title="Add to Queue">
        <EmptyState message="Add to queue form rendered here" icon="🎟️" />
      </Modal>

      <Modal isOpen={modalType === 'admit'} onClose={() => setModalType(null)} title="Assign Bed">
        <EmptyState message="Admission form rendered here" icon="🛏️" />
      </Modal>

    </DashboardLayout>
  );
}
