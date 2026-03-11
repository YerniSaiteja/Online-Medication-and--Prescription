import sqlite3
import os

# Database file path
db_path = os.path.join(os.path.dirname(__file__), 'medication.db')

def add_date_column():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(reminders)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'date' not in columns:
            print("Adding 'date' column to reminders table...")
            # Add date column (allowing NULLs for backward compatibility)
            cursor.execute("ALTER TABLE reminders ADD COLUMN date DATE")
            conn.commit()
            print("Column added successfully.")
        else:
            print("'date' column already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_date_column()
