"""
Script to view all users in the database in table format
Run this script to see all registered users
"""
from app import app, db
from models import User, Prescription, Reminder

def print_table(headers, rows, title=""):
    """Print data in a formatted table"""
    if not rows:
        print(f"\n{title}")
        print("No data found.")
        return
    
    # Calculate column widths
    col_widths = [len(str(h)) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
    
    # Add padding
    col_widths = [w + 2 for w in col_widths]
    total_width = sum(col_widths) + len(headers) - 1
    
    # Print title
    if title:
        print(f"\n{title}")
        print("=" * total_width)
    
    # Print header
    header_row = " | ".join(str(h).ljust(col_widths[i]) for i, h in enumerate(headers))
    print(header_row)
    print("-" * total_width)
    
    # Print rows
    for row in rows:
        row_str = " | ".join(str(cell).ljust(col_widths[i]) for i, cell in enumerate(row))
        print(row_str)
    
    print("=" * total_width)
    print(f"Total: {len(rows)} rows\n")

def view_all_data():
    """Display all users, prescriptions, and reminders in table format"""
    with app.app_context():
        print("\n" + "="*100)
        print(" " * 30 + "DATABASE CONTENTS")
        print("="*100)
        
        # View all users in table format
        users = User.query.all()
        if users:
            user_rows = []
            for user in users:
                role_info = ""
                if user.role == 'patient' and user.medical_history:
                    role_info = user.medical_history[:30] + "..." if len(user.medical_history) > 30 else user.medical_history
                elif user.role == 'doctor':
                    role_info = f"License: {user.license_number or 'N/A'}, Spec: {user.specialization or 'N/A'}"
                elif user.role == 'pharmacist' and user.shop_details:
                    role_info = user.shop_details[:30] + "..." if len(user.shop_details) > 30 else user.shop_details
                else:
                    role_info = "-"
                
                created = user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else 'N/A'
                user_rows.append([
                    user.id,
                    user.full_name[:25],
                    user.email[:30],
                    user.phone[:15],
                    user.role.upper(),
                    role_info[:40],
                    created
                ])
            
            print_table(
                headers=["ID", "Name", "Email", "Phone", "Role", "Role Info", "Created"],
                rows=user_rows,
                title=f"📋 USERS TABLE ({len(users)} total)"
            )
        else:
            print("\n📋 USERS TABLE")
            print("No users found in database.\n")
        
        # View all prescriptions in table format
        prescriptions = Prescription.query.all()
        if prescriptions:
            presc_rows = []
            for presc in prescriptions:
                doctor = db.session.get(User, presc.doctor_id)
                doctor_name = doctor.full_name if doctor else 'Unknown'
                end_date = str(presc.end_date) if presc.end_date else 'Ongoing'
                presc_rows.append([
                    presc.id,
                    presc.patient_name[:20],
                    doctor_name[:20],
                    presc.medicine_name[:25],
                    presc.dose_frequency[:20],
                    presc.status,
                    str(presc.start_date),
                    end_date[:15]
                ])
            
            print_table(
                headers=["ID", "Patient", "Doctor", "Medicine", "Dosage", "Status", "Start Date", "End Date"],
                rows=presc_rows,
                title=f"💊 PRESCRIPTIONS TABLE ({len(prescriptions)} total)"
            )
        else:
            print("\n💊 PRESCRIPTIONS TABLE")
            print("No prescriptions found in database.\n")
        
        # View all reminders in table format
        reminders = Reminder.query.all()
        if reminders:
            reminder_rows = []
            for reminder in reminders:
                user = db.session.get(User, reminder.user_id)
                user_name = user.full_name if user else 'Unknown'
                time_str = str(reminder.time)[:5] if reminder.time else 'N/A'
                notes = reminder.notes[:25] + "..." if reminder.notes and len(reminder.notes) > 25 else (reminder.notes or "-")
                reminder_rows.append([
                    reminder.id,
                    user_name[:20],
                    reminder.medication_name[:25],
                    time_str,
                    reminder.frequency,
                    notes
                ])
            
            print_table(
                headers=["ID", "User", "Medication", "Time", "Frequency", "Notes"],
                rows=reminder_rows,
                title=f"⏰ REMINDERS TABLE ({len(reminders)} total)"
            )
        else:
            print("\n⏰ REMINDERS TABLE")
            print("No reminders found in database.\n")
        
        # Summary
        print("\n" + "="*100)
        print(" " * 40 + "SUMMARY")
        print("="*100)
        print(f"{'Total Users:':<20} {User.query.count()}")
        print(f"{'  - Patients:':<20} {User.query.filter_by(role='patient').count()}")
        print(f"{'  - Doctors:':<20} {User.query.filter_by(role='doctor').count()}")
        print(f"{'  - Pharmacists:':<20} {User.query.filter_by(role='pharmacist').count()}")
        print(f"{'  - Admins:':<20} {User.query.filter_by(role='admin').count()}")
        print(f"{'Total Prescriptions:':<20} {Prescription.query.count()}")
        print(f"{'Total Reminders:':<20} {Reminder.query.count()}")
        print("="*100 + "\n")

if __name__ == '__main__':
    view_all_data()

