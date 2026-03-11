# Online Medication Backend API

Flask backend with SQLite database for the Online Medication and Prescription Management System.

## Features

- User authentication (registration and login)
- User management with role-based access (Admin, Patient, Doctor, Pharmacist)
- Prescription management (create, read, update, delete)
- Medication reminders management
- User profile management

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users

- `GET /api/users/<user_id>` - Get user details
- `PUT /api/users/<user_id>` - Update user profile

### Prescriptions

- `GET /api/prescriptions` - Get prescriptions (supports query params: `user_id`, `doctor_id`, `patient_id`)
- `POST /api/prescriptions` - Create a new prescription
- `PUT /api/prescriptions/<prescription_id>` - Update a prescription
- `DELETE /api/prescriptions/<prescription_id>` - Delete a prescription

### Reminders

- `GET /api/reminders` - Get reminders (supports query param: `user_id`)
- `POST /api/reminders` - Create a new reminder
- `PUT /api/reminders/<reminder_id>` - Update a reminder
- `DELETE /api/reminders/<reminder_id>` - Delete a reminder

### Health Check

- `GET /api/health` - Check API status

## Database

The SQLite database file (`medication.db`) will be created automatically in the `backend` directory when you first run the application.

## Example API Requests

### Register User

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "patient",
  "medicalHistory": "Hypertension"
}
```

### Login

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123"
}
```

### Create Prescription

```bash
POST http://localhost:5000/api/prescriptions
Content-Type: application/json

{
  "doctorId": 1,
  "patientName": "John Doe",
  "medicineName": "Paracetamol 500mg",
  "doseFrequency": "1 tablet; 3x/day",
  "notesInstructions": "Take after meals",
  "startDate": "2024-04-24",
  "endDate": "2024-04-29",
  "status": "Active"
}
```

### Create Reminder

```bash
POST http://localhost:5000/api/reminders
Content-Type: application/json

{
  "userId": 1,
  "medicationName": "Paracetamol 500mg",
  "time": "09:00",
  "frequency": "daily",
  "notes": "Take with breakfast"
}
```

## CORS

CORS is enabled to allow requests from the frontend. Make sure your frontend is configured to make requests to `http://localhost:5000`.

## Notes

- Passwords are hashed using Werkzeug's password hashing
- All dates should be in ISO format (YYYY-MM-DD)
- Time for reminders should be in HH:MM format (24-hour)
- The database is SQLite, suitable for development. For production, consider using PostgreSQL or MySQL.

