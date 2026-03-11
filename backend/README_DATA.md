# How to Add Data to the Database

There are several ways to add data to your Online Medication database:

## Method 1: Using the Seed Script (Easiest - Recommended for Testing)

The `seed_data.py` script will populate your database with sample data including users, prescriptions, and reminders.

**Steps:**
1. Make sure your Flask server is running (or the database file exists)
2. Run the seed script:
   ```bash
   cd backend
   python seed_data.py
   ```

This will create:
- 2 sample patients
- 2 sample doctors
- 1 pharmacist
- 1 admin
- 4 sample prescriptions
- 8 sample medication reminders

**Test Login Credentials:**
- Patient: `john.doe@example.com` / `password123`
- Doctor: `dr.smith@example.com` / `password123`
- Admin: `admin@example.com` / `admin123`

## Method 2: Using API Endpoints (For Production/Real Data)

### Register a New User

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securepassword",
  "fullName": "New User",
  "phone": "+1234567890",
  "role": "patient",
  "medicalHistory": "No known allergies"
}
```

### Create a Prescription

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

### Create a Reminder

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

## Method 3: Using Python Script (Custom Data)

You can create your own Python script to add custom data:

```python
from app import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    # Create a new user
    new_user = User(
        email='custom@example.com',
        password_hash=generate_password_hash('mypassword'),
        full_name='Custom User',
        phone='+1234567890',
        role='patient',
        medical_history='Custom medical history'
    )
    
    db.session.add(new_user)
    db.session.commit()
    print(f"Created user: {new_user.email}")
```

## Method 4: Using Database Browser Tools

You can use SQLite browser tools like:
- **DB Browser for SQLite** (https://sqlitebrowser.org/)
- **SQLiteStudio** (https://sqlitestudio.pl/)

1. Open `backend/medication.db` in the tool
2. Navigate to the tables (users, prescriptions, reminders)
3. Add data directly through the GUI

**Note:** Be careful with password hashes - use the API or Python scripts to create users so passwords are properly hashed.

## Method 5: Using Frontend (Once Integrated)

Once you integrate the frontend with the backend API, users can:
- Register through the signup form
- Doctors can create prescriptions through the doctor dashboard
- Patients can create reminders through the patient dashboard

## Viewing Data

### Using Python:
```python
from app import app, db
from models import User, Prescription, Reminder

with app.app_context():
    # View all users
    users = User.query.all()
    for user in users:
        print(f"{user.full_name} ({user.email}) - {user.role}")
    
    # View all prescriptions
    prescriptions = Prescription.query.all()
    for presc in prescriptions:
        print(f"{presc.medicine_name} for {presc.patient_name}")
```

### Using API:
```bash
# Get all users
GET http://localhost:5000/api/users/1

# Get all prescriptions
GET http://localhost:5000/api/prescriptions

# Get all reminders
GET http://localhost:5000/api/reminders
```

## Important Notes

1. **Passwords**: Always use the API or Python scripts with `generate_password_hash()` - never insert plain text passwords
2. **Dates**: Use ISO format (YYYY-MM-DD) for dates
3. **Times**: Use 24-hour format (HH:MM) for reminder times
4. **Foreign Keys**: Make sure doctor_id and patient_id exist in the users table before creating prescriptions
5. **Database Location**: The database file is created at `backend/medication.db`

