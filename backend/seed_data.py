"""
Script to seed the database with sample data
Run this script to populate the database with initial test data
"""
from app import app, db
from models import User, Prescription, Reminder
from werkzeug.security import generate_password_hash
from datetime import datetime, date, timedelta

def seed_database():
    """Add sample data to the database"""
    with app.app_context():
        # Clear existing data (optional - comment out if you want to keep existing data)
        print("Clearing existing data...")
        Reminder.query.delete()
        Prescription.query.delete()
        User.query.delete()
        db.session.commit()
        
        print("Creating sample users...")
        
        # Create sample patients
        patient1 = User(
            email='john.doe@example.com',
            password_hash=generate_password_hash('passwor123'),
            full_name='John Doe',
            phone='+1234567890',
            role='patient',
            medical_history='Hypertension (2020 - Present)\nAllergic to Penicillin\nPrevious Surgery: Appendectomy (2018)'
        )
        
        patient2 = User(
            email='jane.smith@example.com',
            password_hash=generate_password_hash('password123'),
            full_name='Jane Smith',
            phone='+1234567891',
            role='patient',
            medical_history='Diabetes Type 2\nNo known allergies'
        )
        
        # Create sample doctors
        doctor1 = User(
            email='drsita@gmail.com',
            password_hash=generate_password_hash('sita122'),
            full_name='Dr. Michael Smith',
            phone='+1234567892',
            role='doctor',
            license_number='MD-12345',
            specialization='Cardiology'
        )
        
        doctor2 = User(
            email='dr.johnson@example.com',
            password_hash=generate_password_hash('password123'),
            full_name='Dr. Sarah Johnson',
            phone='+1234567893',
            role='doctor',
            license_number='MD-67890',
            specialization='General Medicine'
        )
        
        # Create sample pharmacist
        pharmacist1 = User(
            email='pharmacist@example.com',
            password_hash=generate_password_hash('password123'),
            full_name='Robert Williams',
            phone='+1234567894',
            role='pharmacist',
            shop_details='MediCare Pharmacy\n123 Main Street\nCity, State 12345'
        )
        
        # Create admin user
        admin1 = User(
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),
            full_name='Admin User',
            phone='+1234567895',
            role='admin'
        )
        
        # Add all users to session
        db.session.add_all([patient1, patient2, doctor1, doctor2, pharmacist1, admin1])
        db.session.commit()
        
        print(f"Created {User.query.count()} users")
        
        # Create sample prescriptions
        print("Creating sample prescriptions...")
        
        prescription1 = Prescription(
            doctor_id=doctor1.id,
            patient_id=patient1.id,
            patient_name='John Doe',
            medicine_name='Paracetamol 500mg',
            dose_frequency='1 tablet; 3x/day',
            notes_instructions='Take after meals with water. Store in a cool, dry place.',
            start_date=date.today() - timedelta(days=2),
            end_date=date.today() + timedelta(days=3),
            status='Active'
        )
        
        prescription2 = Prescription(
            doctor_id=doctor2.id,
            patient_id=patient1.id,
            patient_name='John Doe',
            medicine_name='Amoxicillin 250mg',
            dose_frequency='1 capsule; 2 times daily',
            notes_instructions='Complete the full course. Take with food to avoid stomach upset.',
            start_date=date.today() - timedelta(days=5),
            end_date=date.today() + timedelta(days=2),
            status='Active'
        )
        
        prescription3 = Prescription(
            doctor_id=doctor1.id,
            patient_id=patient2.id,
            patient_name='Jane Smith',
            medicine_name='Vitamin D3',
            dose_frequency='1 tablet; once daily',
            notes_instructions='Take with breakfast. Continue for 30 days.',
            start_date=date.today() - timedelta(days=7),
            end_date=date.today() + timedelta(days=23),
            status='Active'
        )
        
        prescription4 = Prescription(
            doctor_id=doctor2.id,
            patient_id=patient2.id,
            patient_name='Jane Smith',
            medicine_name='Metformin 500mg',
            dose_frequency='1 tablet; twice daily',
            notes_instructions='Take with meals. Monitor blood sugar levels.',
            start_date=date.today() - timedelta(days=30),
            end_date=None,
            status='Active'
        )
        
        db.session.add_all([prescription1, prescription2, prescription3, prescription4])
        db.session.commit()
        
        print(f"Created {Prescription.query.count()} prescriptions")
        
        # Create sample reminders
        print("Creating sample reminders...")
        
        reminder1 = Reminder(
            user_id=patient1.id,
            medication_name='Paracetamol 500mg',
            time=datetime.strptime('09:00', '%H:%M').time(),
            frequency='daily',
            notes='Take after breakfast'
        )
        
        reminder2 = Reminder(
            user_id=patient1.id,
            medication_name='Paracetamol 500mg',
            time=datetime.strptime('14:00', '%H:%M').time(),
            frequency='daily',
            notes='Take after lunch'
        )
        
        reminder3 = Reminder(
            user_id=patient1.id,
            medication_name='Paracetamol 500mg',
            time=datetime.strptime('20:00', '%H:%M').time(),
            frequency='daily',
            notes='Take after dinner'
        )
        
        reminder4 = Reminder(
            user_id=patient1.id,
            medication_name='Amoxicillin 250mg',
            time=datetime.strptime('08:00', '%H:%M').time(),
            frequency='daily',
            notes='Take with breakfast'
        )
        
        reminder5 = Reminder(
            user_id=patient1.id,
            medication_name='Amoxicillin 250mg',
            time=datetime.strptime('20:00', '%H:%M').time(),
            frequency='daily',
            notes='Take with dinner'
        )
        
        reminder6 = Reminder(
            user_id=patient2.id,
            medication_name='Vitamin D3',
            time=datetime.strptime('09:00', '%H:%M').time(),
            frequency='daily',
            notes='Take with breakfast'
        )
        
        reminder7 = Reminder(
            user_id=patient2.id,
            medication_name='Metformin 500mg',
            time=datetime.strptime('08:00', '%H:%M').time(),
            frequency='daily',
            notes='Take with breakfast'
        )
        
        reminder8 = Reminder(
            user_id=patient2.id,
            medication_name='Metformin 500mg',
            time=datetime.strptime('20:00', '%H:%M').time(),
            frequency='daily',
            notes='Take with dinner'
        )
        
        db.session.add_all([reminder1, reminder2, reminder3, reminder4, reminder5, reminder6, reminder7, reminder8])
        db.session.commit()
        
        print(f"Created {Reminder.query.count()} reminders")
        
        print("\n" + "="*50)
        print("Database seeded successfully!")
        print("="*50)
        print("\nSample Users Created:")
        print(f"  - Patients: {User.query.filter_by(role='patient').count()}")
        print(f"  - Doctors: {User.query.filter_by(role='doctor').count()}")
        print(f"  - Pharmacists: {User.query.filter_by(role='pharmacist').count()}")
        print(f"  - Admins: {User.query.filter_by(role='admin').count()}")
        print(f"\nTotal Prescriptions: {Prescription.query.count()}")
        print(f"Total Reminders: {Reminder.query.count()}")
        print("\n" + "="*50)
        print("\nTest Login Credentials:")
        print("  Patient: john.doe@example.com / password123")
        print("  Doctor: dr.smith@example.com / password123")
        print("  Admin: admin@example.com / admin123")
        print("="*50)

if __name__ == '__main__':
    seed_database()

