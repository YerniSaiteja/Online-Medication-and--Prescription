from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, patient, doctor, pharmacist
    
    # Role-specific fields
    medical_history = db.Column(db.Text, nullable=True)  # For patients
    license_number = db.Column(db.String(100), nullable=True)  # For doctors
    specialization = db.Column(db.String(200), nullable=True)  # For doctors
    shop_details = db.Column(db.Text, nullable=True)  # For pharmacists
    
    # Verification (mostly for doctors)
    is_verified = db.Column(db.Boolean, default=True)
    is_rejected = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    prescriptions_as_doctor = db.relationship('Prescription', foreign_keys='Prescription.doctor_id', backref='doctor', lazy='dynamic')
    prescriptions_as_patient = db.relationship('Prescription', foreign_keys='Prescription.patient_id', backref='patient', lazy='dynamic')
    reminders = db.relationship('Reminder', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'

class Prescription(db.Model):
    __tablename__ = 'prescriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable if patient doesn't exist in system
    patient_name = db.Column(db.String(200), nullable=False)  # Store patient name even if not in system
    
    medicine_name = db.Column(db.String(200), nullable=False)
    dose_frequency = db.Column(db.String(200), nullable=False)  # e.g., "1 tablet; 3x/day"
    quantity = db.Column(db.Integer, default=1) # Quantity to dispense
    notes_instructions = db.Column(db.Text, nullable=True)
    
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default='Active')  # Active, Completed, Cancelled
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Prescription {self.medicine_name} for {self.patient_name}>'

class Reminder(db.Model):
    __tablename__ = 'reminders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    medication_name = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=True)  # Specific date for reminder
    time = db.Column(db.Time, nullable=False)  # Time of day for reminder
    frequency = db.Column(db.String(50), nullable=False)  # daily, weekly, custom
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Reminder {self.medication_name} at {self.time}>'

class InventoryItem(db.Model):
    __tablename__ = 'inventory'
    
    id = db.Column(db.Integer, primary_key=True)
    pharmacist_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    drug_name = db.Column(db.String(200), nullable=False)
    batch_number = db.Column(db.String(100), nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    quantity = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<InventoryItem {self.drug_name} Batch:{self.batch_number}>'

