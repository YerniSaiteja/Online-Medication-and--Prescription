from app import app, db
from models import InventoryItem

with app.app_context():
    # Only create tables that don't exist
    db.create_all()
    print("Database schema updated.")
