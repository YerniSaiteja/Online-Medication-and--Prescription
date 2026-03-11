import sqlite3
import os

# Database file path
db_path = os.path.join(os.path.dirname(__file__), 'medication.db')

def add_quantity_column():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(prescriptions)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'quantity' not in columns:
            print("Adding 'quantity' column to prescriptions table...")
            # Add quantity column (default 1 for existing records)
            cursor.execute("ALTER TABLE prescriptions ADD COLUMN quantity INTEGER DEFAULT 1")
            conn.commit()
            print("Column added successfully.")
        else:
            print("'quantity' column already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_quantity_column()
