from app import app, db
from models import User, Prescription, Reminder, InventoryItem

def truncate_database():
    """Delete all data from the database"""
    with app.app_context():
        print("Truncating database...")
        # Delete in order of dependencies (though cascade might handle it, explicit is safer/clearer)
        try:
            # Delete child tables first
            Prescription.query.delete()
            Reminder.query.delete()
            InventoryItem.query.delete()
            
            # Delete parent table
            User.query.delete()
            
            db.session.commit()
            print("Database truncated successfully. All data removed.")
        except Exception as e:
            db.session.rollback()
            print(f"Error truncating database: {e}")

if __name__ == '__main__':
    truncate_database()
