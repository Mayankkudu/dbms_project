# Smart Hospital Management System

A full-stack, database-driven hospital management system built from an
Enhanced ER model — React frontend, Express/Node backend, MySQL/MariaDB
database with views, stored procedures, and triggers, and a transparent
rule-based clinical alert system.

## Architecture

```
React (frontend) → REST API (Express) → Business logic (services) → MySQL
                                              ↓
                              Rule-based risk scoring (DB trigger)
                                              ↓
                          Optional AI explanation layer (Claude API)
```

See `database/schema.sql` for the full EER-to-relational mapping and
normalization notes, and `database/triggers.sql` for the risk-scoring logic.

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ or MariaDB 10.6+
- (Optional) An Anthropic API key, only if you want the AI explanation layer

## 1. Database setup

Start your MySQL/MariaDB server, then run the SQL files **in this order**:

```bash
cd database
mysql -u root -p < schema.sql
mysql -u root -p < constraints.sql
mysql -u root -p < triggers.sql
mysql -u root -p < procedures.sql
mysql -u root -p < views.sql
mysql -u root -p < seed.sql
```

### Create a dedicated app database user

The default `root` account on most MySQL/MariaDB installs uses socket
authentication and **cannot log in over TCP**, which is what the Node
backend needs. Create an app-specific user instead:

```sql
CREATE USER 'hospital_app'@'%' IDENTIFIED BY 'choose_a_password';
GRANT ALL PRIVILEGES ON hospital_db.* TO 'hospital_app'@'%';
FLUSH PRIVILEGES;
```

(This is also just better practice than running the app as `root`.)

**Gotcha to avoid:** create this user with exactly one `@host` entry. If
`hospital_app`@`localhost` and `hospital_app`@`%` both exist (e.g. from
an earlier attempt with a different password), MySQL matches the more
specific `localhost` entry first — even when your app connects via
`127.0.0.1` — so it can silently authenticate against the *wrong*
password and fail. If you've experimented with this user before, clean
up first:

```sql
DROP USER IF EXISTS 'hospital_app'@'localhost';
DROP USER IF EXISTS 'hospital_app'@'%';
-- then re-run the CREATE USER above
```

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `DB_USER` / `DB_PASSWORD` to the app user you just
created, and set `JWT_SECRET` to a long random string. Leave
`AI_EXPLANATION_ENABLED=false` unless you have an Anthropic API key — the
system works fully without it (see "AI layer" below).

```bash
npm start
```

The API runs on `http://localhost:4000` by default. Check it's up:

```bash
curl http://localhost:4000/api/health
# {"status":"ok"}
```

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`. Open it
in a browser and sign in.

For a production build instead of the dev server:

```bash
npm run build
npm run preview
```

## Demo accounts

All seeded accounts use the password `password123`.

| Role | Username |
|---|---|
| Admin | `admin` |
| Doctor (Cardiology) | `dr.mehta` |
| Doctor (General Medicine) | `dr.rao` |
| Nurse | `nurse.priya` |
| Receptionist | `reception1` |
| Ward Boy | `wardboy1` |
| Pharmacist | `pharmacist1` |
| Lab Technician | `labtech1` |
| Patient | `rahul.sharma` |

These are demo credentials for local development only — never reuse them
in a real deployment.

## Demo workflow (matches the seeded data)

The seed data already includes one patient, **Rahul Sharma**, whose
three vital records progress **normal → borderline → critical**, so the
alert system is visible immediately without you doing anything:

1. Log in as `dr.mehta` — you'll see an open critical alert for Rahul
   Sharma with the explainability strip showing which vitals triggered it
2. Acknowledge the alert
3. Log in as `nurse.priya` and record a new vital for any patient — try
   an SpO2 below 92 or a heart rate above 110 to trigger a fresh alert
4. Log in as `reception1` to register a new patient, book an appointment,
   or admit a patient to a bed
5. Log in as `labtech1` to enter a report for the pending CBC test
6. Log in as `pharmacist1` to mark a prescription item dispensed
7. Log in as `rahul.sharma` (the patient) to see the full picture from
   the patient's side — vitals, prescriptions, lab results, bills
8. Log in as `admin` for the analytics dashboard and full audit log

## AI explanation layer

The clinical risk **score** is always computed deterministically by a
database trigger (`trg_vital_before_insert` in `triggers.sql`) — this
never depends on AI and is fully explainable on its own. If you set
`ANTHROPIC_API_KEY` and `AI_EXPLANATION_ENABLED=true` in the backend
`.env`, the `/api/vitals/alerts/:id/explain` endpoint will additionally
call the Claude API to rephrase the same underlying reasons in plainer
language. If the key is missing or the call fails for any reason, the
system falls back to the deterministic explanation automatically.

## Project structure

```
hospital-system/
├── database/       schema, constraints, triggers, procedures, views, seed, sample queries
├── backend/        Express API (controllers, services, routes, middleware)
└── frontend/       React app (8 role-based dashboards)
```

## Notes

- All thresholds used in the vital risk scoring are demo/educational
  values, clearly labeled as such in the UI — this is a decision-support
  demo, not a real medical diagnostic tool.
- Role-based access control is enforced on the backend (JWT + middleware),
  not just hidden in the UI — a patient token calling a doctor-only
  endpoint gets a `403` regardless of what the frontend renders.
