from app import app, db, User, Prescription, Reminder

def delete_specific_users():
    ids_to_delete = [5, 8]
    
    with app.app_context():
        for user_id in ids_to_delete:
            user = User.query.get(user_id)
            if user:
                print(f"Found user {user_id}: {user.full_name}")
                
                # Delete related prescriptions first (to be safe, though FK might handle it or be nullable)
                Prescription.query.filter_by(patient_id=user_id).delete()
                print(f"  - Deleted associated prescriptions")
                
                # Reminders cascade, but let's be synonymous
                Reminder.query.filter_by(user_id=user_id).delete()
                print(f"  - Deleted associated reminders")

                db.session.delete(user)
                try:
                    db.session.commit()
                    print(f"Successfully deleted user {user_id}")
                except Exception as e:
                    db.session.rollback()
                    print(f"Error deleting user {user_id}: {e}")
            else:
                print(f"User {user_id} not found")

if __name__ == "__main__":
    delete_specific_users()
