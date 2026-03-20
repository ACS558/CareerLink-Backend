# CareerLink Backend

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file with your configuration

3. Make sure MongoDB is running on your system

4. Start the server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- POST /api/auth/register/student
- POST /api/auth/register/recruiter
- POST /api/auth/register/admin
- POST /api/auth/register/alumni
- POST /api/auth/login

### Health Check

- GET /api/health
