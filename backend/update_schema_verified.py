import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'medication.db')

def update_schema():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_verified' not in columns:
            print("Adding is_verified column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 1")
            conn.commit()
            print("Successfully added is_verified column.")
        else:
            print("is_verified column already exists.")
            
    except Exception as e:
        print(f"Error updating schema: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    update_schema()
