require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const vitalRoutes = require('./routes/vital.routes');
const admissionRoutes = require('./routes/admission.routes');
const clinicalRoutes = require('./routes/clinical.routes');
const labRoutes = require('./routes/lab.routes');
const billingRoutes = require('./routes/billing.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const statsRoutes = require('./routes/stats.routes');
const queueRoutes = require('./routes/queue.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/lab-tests', labRoutes);
app.use('/api/bills', billingRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/queue', queueRoutes);

// Central error handler — catches anything thrown/rejected in async
// controllers that isn't already handled, so the API never leaks a stack
// trace or crashes the process on a bad request.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Hospital Management API listening on port ${PORT}`);
});

module.exports = app;
