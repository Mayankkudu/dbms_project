import api from './api';

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
};

export const patientApi = {
  getProfile: (id) => api.get(`/patients/${id}`),
  updateProfile: (id, data) => api.put(`/patients/${id}`, data),
  getHistory: (id) => api.get(`/patients/${id}/history`),
  search: (params) => api.get('/patients/search', { params }),
  register: (data) => api.post('/patients/register', data),
};

export const vitalApi = {
  create: (data) => api.post('/vitals', data),
  listForPatient: (patientId) => api.get(`/vitals/patient/${patientId}`),
  listOpenAlerts: () => api.get('/vitals/alerts/open'),
  explainAlert: (alertId) => api.get(`/vitals/alerts/${alertId}/explain`),
  acknowledgeAlert: (alertId) => api.post(`/vitals/alerts/${alertId}/acknowledge`),
};

export const admissionApi = {
  admit: (data) => api.post('/admissions', data),
  discharge: (admissionId) => api.post(`/admissions/${admissionId}/discharge`),
  availableBeds: () => api.get('/admissions/beds/available'),
  occupancySummary: () => api.get('/admissions/beds/occupancy'),
};

export const clinicalApi = {
  createDiagnosis: (data) => api.post('/clinical/diagnoses', data),
  createPrescription: (data) => api.post('/clinical/prescriptions', data),
  pendingDispensing: () => api.get('/clinical/pharmacy/pending'),
  updateDispensedStatus: (itemId, status) => api.patch(`/clinical/pharmacy/items/${itemId}`, { status }),
};

export const labApi = {
  orderTest: (data) => api.post('/lab-tests', data),
  listPending: () => api.get('/lab-tests/pending'),
  submitReport: (labTestId, data) => api.post(`/lab-tests/${labTestId}/report`, data),
};

export const billingApi = {
  createBill: (data) => api.post('/bills', data),
  getBill: (billId) => api.get(`/bills/${billId}`),
  listForPatient: (patientId) => api.get(`/bills/patient/${patientId}`),
  pay: (billId, data) => api.post(`/bills/${billId}/payments`, data),
};

export const appointmentApi = {
  listDoctors: () => api.get('/appointments/doctors'),
  book: (data) => api.post('/appointments', data),
  listForPatient: (patientId) => api.get(`/appointments/patient/${patientId}`),
  listForDoctor: (doctorId) => api.get(`/appointments/doctor/${doctorId || ''}`),
  updateStatus: (appointmentId, status) => api.patch(`/appointments/${appointmentId}/status`, { status }),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const adminApi = {
  analytics: () => api.get('/admin/analytics'),
  auditLogs: (limit) => api.get('/admin/audit-logs', { params: { limit } }),
};
