from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta, date, time
import os
import sys

# Add the directory containing app.py to sys.path so Vercel can find models.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import db, User, Prescription, Reminder, InventoryItem
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func, case
import csv
import io
from flask import send_file

app = Flask(__name__)
# Get the directory where this script is located
basedir = os.path.abspath(os.path.dirname(__file__))

# If running on Vercel, use the /tmp directory because the rest of the filesystem is read-only
if os.environ.get('VERCEL') == '1':
    db_path = '/tmp/medication.db'
else:
    db_path = os.path.join(basedir, "medication.db")

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize database
db.init_app(app)
CORS(app)  # Enable CORS for frontend

# Create tables
with app.app_context():
    db.create_all()

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'fullName', 'phone', 'role']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User with this email already exists'}), 400
            
        if data['role'].lower() == 'admin':
            return jsonify({'error': 'Admin accounts cannot be registered. Please log in with the static admin credentials.'}), 403
        
        # Create user
        user = User(
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            full_name=data['fullName'],
            phone=data['phone'],
            role=data['role'].lower()
        )
        
        # Add role-specific fields
        if data['role'].lower() == 'patient':
            user.medical_history = data.get('medicalHistory', '')
        elif data['role'].lower() == 'doctor':
            user.license_number = data.get('licenseNumber', '')
            user.specialization = data.get('specialization', '')
            user.is_verified = False  # Doctors need admin approval
        elif data['role'].lower() == 'pharmacist':
            user.shop_details = data.get('shopDetails', '')
        
        db.session.add(user)
        db.session.commit()
        
        # Return user data (without password)
        user_data = {
            'id': user.id,
            'email': user.email,
            'fullName': user.full_name,
            'phone': user.phone,
            'role': user.role,
            'isVerified': user.is_verified,
            'medicalHistory': user.medical_history,
            'licenseNumber': user.license_number,
            'specialization': user.specialization,
            'shopDetails': user.shop_details
        }
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Root route to show basic API info instead of 404 on '/'
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Online Medication API',
        'endpoints': [
            '/api/auth/register',
            '/api/auth/login',
            '/api/users',
            '/api/prescriptions',
            '/api/reminders',
            '/api/health'
        ]
    }), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        if user.role == 'doctor':
            if user.is_rejected:
                return jsonify({'error': 'Your account has been rejected by the admin.'}), 403
            if not user.is_verified:
                return jsonify({'error': 'Your doctor account is pending admin verification.'}), 403
        
        # Return user data (without password)
        user_data = {
            'id': user.id,
            'email': user.email,
            'fullName': user.full_name,
            'phone': user.phone,
            'role': user.role,
            'isVerified': user.is_verified,
            'medicalHistory': user.medical_history,
            'licenseNumber': user.license_number,
            'specialization': user.specialization,
            'shopDetails': user.shop_details
        }
        
        return jsonify({
            'message': 'Login successful',
            'user': user_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Routes
@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users (useful for viewing registered users)"""
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        result = []
        for user in users:
            result.append({
                'id': user.id,
                'email': user.email,
                'fullName': user.full_name,
                'phone': user.phone,
                'role': user.role,
                'isVerified': user.is_verified,
                'medicalHistory': user.medical_history,
                'licenseNumber': user.license_number,
                'specialization': user.specialization,
                'shopDetails': user.shop_details,
                'createdAt': user.created_at.isoformat() if user.created_at else None
            })
        return jsonify({
            'count': len(result),
            'users': result
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        user_data = {
            'id': user.id,
            'email': user.email,
            'fullName': user.full_name,
            'phone': user.phone,
            'role': user.role,
            'isVerified': user.is_verified,
            'medicalHistory': user.medical_history,
            'licenseNumber': user.license_number,
            'specialization': user.specialization,
            'shopDetails': user.shop_details,
            'createdAt': user.created_at.isoformat() if user.created_at else None
        }
        return jsonify(user_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # Update allowed fields
        if 'fullName' in data:
            user.full_name = data['fullName']
        if 'phone' in data:
            user.phone = data['phone']
        if 'email' in data:
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Email already in use'}), 400
            user.email = data['email']
        if 'medicalHistory' in data:
            user.medical_history = data['medicalHistory']
        if 'licenseNumber' in data:
            user.license_number = data['licenseNumber']
        if 'specialization' in data:
            user.specialization = data['specialization']
        if 'shopDetails' in data:
            user.shop_details = data['shopDetails']
        
        db.session.commit()
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'fullName': user.full_name,
            'phone': user.phone,
            'role': user.role,
            'isVerified': user.is_verified,
            'medicalHistory': user.medical_history,
            'licenseNumber': user.license_number,
            'specialization': user.specialization,
            'shopDetails': user.shop_details
        }
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Admin pending doctor routes
@app.route('/api/admin/doctors/pending', methods=['GET'])
def get_pending_doctors():
    try:
        doctors = User.query.filter_by(role='doctor', is_verified=False, is_rejected=False).order_by(User.created_at.desc()).all()
        result = []
        for d_user in doctors:
            result.append({
                'id': d_user.id,
                'email': d_user.email,
                'fullName': d_user.full_name,
                'phone': d_user.phone,
                'licenseNumber': d_user.license_number,
                'specialization': d_user.specialization,
                'createdAt': d_user.created_at.isoformat() if d_user.created_at else None
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/doctors/<int:user_id>/verify', methods=['PUT'])
def verify_doctor(user_id):
    try:
        doctor = User.query.filter_by(id=user_id, role='doctor').first()
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
        
        doctor.is_verified = True
        db.session.commit()
        return jsonify({'message': 'Doctor verified successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/doctors/<int:user_id>/reject', methods=['DELETE'])
def reject_doctor(user_id):
    try:
        doctor = User.query.filter_by(id=user_id, role='doctor').first()
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
        
        doctor.is_rejected = True
        db.session.commit()
        return jsonify({'message': 'Doctor application rejected.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Prescription Routes
@app.route('/api/prescriptions', methods=['GET'])
def get_prescriptions():
    try:
        user_id = request.args.get('user_id', type=int)
        doctor_id = request.args.get('doctor_id', type=int)
        patient_id = request.args.get('patient_id', type=int)
        
        query = Prescription.query
        
        if user_id:
            # Get prescriptions for a specific user (as patient or doctor)
            query = query.filter(
                (Prescription.patient_id == user_id) | 
                (Prescription.doctor_id == user_id)
            )
        elif doctor_id:
            query = query.filter_by(doctor_id=doctor_id)
        elif patient_id:
            query = query.filter_by(patient_id=patient_id)
        
        # Status filter
        status = request.args.get('status')
        if status:
            query = query.filter_by(status=status)
        
        prescriptions = query.order_by(Prescription.created_at.desc()).all()
        
        result = []
        for presc in prescriptions:
            patient = User.query.get(presc.patient_id)
            doctor = User.query.get(presc.doctor_id)
            
            result.append({
                'id': presc.id,
                'patientName': presc.patient_name,
                'patientId': presc.patient_id,
                'doctorId': presc.doctor_id,
                'doctorName': doctor.full_name if doctor else 'Unknown Doctor',
                'medicineName': presc.medicine_name,
                'doseFrequency': presc.dose_frequency,
                'notesInstructions': presc.notes_instructions,
                'startDate': presc.start_date.isoformat() if presc.start_date else None,
                'startDate': presc.start_date.isoformat() if presc.start_date else None,
                'endDate': presc.end_date.isoformat() if presc.end_date else None,
                'quantity': presc.quantity,
                'status': presc.status,
                'createdAt': presc.created_at.isoformat() if presc.created_at else None
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions', methods=['POST'])
def create_prescription():
    try:
        data = request.get_json()
        
        required_fields = ['doctorId', 'patientName', 'medicineName', 'doseFrequency', 'startDate']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Find patient by explicit id first, then by name (patients only)
        # Find patient by explicit id only (patients only)
        patient = None
        if data.get('patientId'):
            # Ensure it is an integer
            try:
                p_id = int(data['patientId'])
                patient = User.query.filter_by(id=p_id, role='patient').first()
            except ValueError:
                 return jsonify({'error': 'Invalid Patient ID format'}), 400
            
            if not patient:
                return jsonify({'error': 'Patient not found for provided patientId'}), 404
        else:
             return jsonify({'error': 'Patient ID is required'}), 400
        
        patient_id = patient.id
        
        # Parse dates
        start_date = datetime.fromisoformat(data['startDate'].replace('Z', '+00:00'))
        end_date = None
        if data.get('endDate'):
            end_date = datetime.fromisoformat(data['endDate'].replace('Z', '+00:00'))
        
        prescription = Prescription(
            doctor_id=data['doctorId'],
            patient_id=patient_id,
            patient_name=patient.full_name,
            medicine_name=data['medicineName'],
            dose_frequency=data['doseFrequency'],
            quantity=data.get('quantity', 1),
            notes_instructions=data.get('notesInstructions', ''),
            start_date=start_date,
            end_date=end_date,
            status=data.get('status', 'Active')
        )
        
        # If patient exists in system, update their medical_history with the new medication
        if patient:
            # Append a simple entry; keep history additive
            entry = f"{datetime.utcnow().isoformat()} - {data['medicineName']} ({data['doseFrequency']})"
            if patient.medical_history:
                patient.medical_history = f"{patient.medical_history}\n{entry}"
            else:
                patient.medical_history = entry
        
        db.session.add(prescription)
        db.session.commit()
        
        doctor = User.query.get(data['doctorId'])
        
        result = {
            'id': prescription.id,
            'patientName': prescription.patient_name,
            'patientId': prescription.patient_id,
            'doctorId': prescription.doctor_id,
            'doctorName': doctor.full_name if doctor else 'Unknown Doctor',
            'medicineName': prescription.medicine_name,
            'doseFrequency': prescription.dose_frequency,
            'notesInstructions': prescription.notes_instructions,
            'startDate': prescription.start_date.isoformat() if prescription.start_date else None,
            'endDate': prescription.end_date.isoformat() if prescription.end_date else None,
            'quantity': prescription.quantity,
            'status': prescription.status,
            'createdAt': prescription.created_at.isoformat() if prescription.created_at else None
        }
        
        return jsonify({
            'message': 'Prescription created successfully',
            'prescription': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/<int:prescription_id>', methods=['PUT'])
def update_prescription(prescription_id):
    try:
        prescription = Prescription.query.get_or_404(prescription_id)
        data = request.get_json()
        
        # Optionally allow changing/affirming the patient; enforce existence
        if 'patientId' in data:
            patient = User.query.filter_by(id=data['patientId'], role='patient').first()
            if not patient:
                return jsonify({'error': 'Patient not found for provided patientId'}), 404
            prescription.patient_id = patient.id
            prescription.patient_name = patient.full_name
        elif 'patientName' in data:
            patient = User.query.filter_by(full_name=data['patientName'], role='patient').first()
            if not patient:
                return jsonify({'error': 'Patient not found for provided patientName'}), 404
            prescription.patient_id = patient.id
            prescription.patient_name = patient.full_name
        else:
            patient = User.query.filter_by(id=prescription.patient_id, role='patient').first()

        if 'medicineName' in data:
            prescription.medicine_name = data['medicineName']
        if 'doseFrequency' in data:
            prescription.dose_frequency = data['doseFrequency']
        if 'quantity' in data:
            prescription.quantity = data['quantity']
        if 'notesInstructions' in data:
            prescription.notes_instructions = data['notesInstructions']
        if 'startDate' in data:
            prescription.start_date = datetime.fromisoformat(data['startDate'].replace('Z', '+00:00'))
        if 'endDate' in data:
            if data['endDate']:
                prescription.end_date = datetime.fromisoformat(data['endDate'].replace('Z', '+00:00'))
            else:
                prescription.end_date = None
        if 'status' in data:
            prescription.status = data['status']
        
        db.session.commit()
        
        doctor = User.query.get(prescription.doctor_id)
        
        result = {
            'id': prescription.id,
            'patientName': prescription.patient_name,
            'patientId': prescription.patient_id,
            'doctorId': prescription.doctor_id,
            'doctorName': doctor.full_name if doctor else 'Unknown Doctor',
            'medicineName': prescription.medicine_name,
            'doseFrequency': prescription.dose_frequency,
            'notesInstructions': prescription.notes_instructions,
            'startDate': prescription.start_date.isoformat() if prescription.start_date else None,
            'endDate': prescription.end_date.isoformat() if prescription.end_date else None,
            'quantity': prescription.quantity,
            'status': prescription.status,
            'createdAt': prescription.created_at.isoformat() if prescription.created_at else None
        }
        
        return jsonify({
            'message': 'Prescription updated successfully',
            'prescription': result
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/<int:prescription_id>', methods=['DELETE'])
def delete_prescription(prescription_id):
    try:
        prescription = Prescription.query.get_or_404(prescription_id)
        db.session.delete(prescription)
        db.session.commit()
        
        return jsonify({'message': 'Prescription deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/<int:prescription_id>/dispense', methods=['POST'])
def dispense_prescription(prescription_id):
    try:
        prescription = Prescription.query.get_or_404(prescription_id)
        
        # Check if already dispensed
        if prescription.status in ['Dispensed', 'Completed']:
            return jsonify({'error': 'Prescription already dispensed'}), 400
            
        # Check inventory
        inventory_item = InventoryItem.query.filter(
            InventoryItem.drug_name.ilike(prescription.medicine_name),
            InventoryItem.quantity >= prescription.quantity
        ).first()

        # If no single batch has enough, we could implement complex logic, 
        # but for now let's just find ANY batch with enough stock or the largest batch
        if not inventory_item:
             # Try just matching name to give better error
            any_stock = InventoryItem.query.filter(InventoryItem.drug_name.ilike(prescription.medicine_name)).first()
            if not any_stock:
                return jsonify({'error': f'Drug {prescription.medicine_name} not found in inventory'}), 404
            return jsonify({'error': f'Insufficient stock for {prescription.medicine_name}. Required: {prescription.quantity}'}), 400
            
        # Deduct stock (ensure quantity doesn't go negative)
        if inventory_item.quantity < prescription.quantity:
            return jsonify({'error': f'Insufficient stock. Available: {inventory_item.quantity}, Required: {prescription.quantity}'}), 400
        
        inventory_item.quantity -= prescription.quantity
        
        # Update prescription status
        prescription.status = 'Dispensed'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Prescription dispensed successfully',
            'remainingStock': inventory_item.quantity,
            'prescriptionStatus': prescription.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete all prescriptions for a given patient (by patient_id)
@app.route('/api/prescriptions/by-patient/<int:patient_id>', methods=['DELETE'])
def delete_prescriptions_by_patient(patient_id):
    try:
        patient = User.query.filter_by(id=patient_id, role='patient').first()
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        deleted = Prescription.query.filter_by(patient_id=patient_id).delete()
        db.session.commit()
        
        return jsonify({
            'message': 'Prescriptions deleted successfully',
            'patientId': patient_id,
            'deletedCount': deleted
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Reminder Routes
@app.route('/api/reminders', methods=['GET'])
def get_reminders():
    try:
        user_id = request.args.get('user_id', type=int)
        
        if user_id:
            reminders = Reminder.query.filter_by(user_id=user_id).order_by(Reminder.time).all()
        else:
            reminders = Reminder.query.order_by(Reminder.time).all()
        
        result = []
        for reminder in reminders:
            result.append({
                'id': reminder.id,
                'userId': reminder.user_id,
                'medicationName': reminder.medication_name,
                'date': reminder.date.isoformat() if reminder.date else None,
                'time': reminder.time.strftime('%H:%M') if reminder.time else None,
                'frequency': reminder.frequency,
                'notes': reminder.notes,
                'createdAt': reminder.created_at.isoformat() if reminder.created_at else None
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reminders', methods=['POST'])
def create_reminder():
    try:
        data = request.get_json()
        
        required_fields = ['userId', 'medicationName', 'time', 'frequency']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse time (format: "HH:MM")
        time_str = data['time']
        try:
            time_obj = datetime.strptime(time_str, '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid time format. Use HH:MM'}), 400
        
        # Parse date if provided
        date_obj = None
        if data.get('date'):
            try:
                date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                pass  # Optional, or return error

        reminder = Reminder(
            user_id=data['userId'],
            medication_name=data['medicationName'],
            date=date_obj,
            time=time_obj,
            frequency=data['frequency'],
            notes=data.get('notes', '')
        )
        
        db.session.add(reminder)
        db.session.commit()
        
        result = {
            'id': reminder.id,
            'userId': reminder.user_id,
            'medicationName': reminder.medication_name,
            'date': reminder.date.isoformat() if reminder.date else None,
            'time': reminder.time.strftime('%H:%M') if reminder.time else None,
            'frequency': reminder.frequency,
            'notes': reminder.notes,
            'createdAt': reminder.created_at.isoformat() if reminder.created_at else None
        }
        
        return jsonify({
            'message': 'Reminder created successfully',
            'reminder': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reminders/<int:reminder_id>', methods=['PUT'])
def update_reminder(reminder_id):
    try:
        reminder = Reminder.query.get_or_404(reminder_id)
        data = request.get_json()
        
        if 'medicationName' in data:
            reminder.medication_name = data['medicationName']
        if 'date' in data:
            try:
                reminder.date = datetime.strptime(data['date'], '%Y-%m-%d').date() if data['date'] else None
            except ValueError:
                pass
        if 'time' in data:
            try:
                reminder.time = datetime.strptime(data['time'], '%H:%M').time()
            except ValueError:
                return jsonify({'error': 'Invalid time format. Use HH:MM'}), 400
        if 'frequency' in data:
            reminder.frequency = data['frequency']
        if 'notes' in data:
            reminder.notes = data['notes']
        
        db.session.commit()
        
        result = {
            'id': reminder.id,
            'userId': reminder.user_id,
            'medicationName': reminder.medication_name,
            'date': reminder.date.isoformat() if reminder.date else None,
            'time': reminder.time.strftime('%H:%M') if reminder.time else None,
            'frequency': reminder.frequency,
            'notes': reminder.notes,
            'createdAt': reminder.created_at.isoformat() if reminder.created_at else None
        }
        
        return jsonify({
            'message': 'Reminder updated successfully',
            'reminder': result
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reminders/<int:reminder_id>', methods=['DELETE'])
def delete_reminder(reminder_id):
    try:
        reminder = Reminder.query.get_or_404(reminder_id)
        db.session.delete(reminder)
        db.session.commit()
        
        return jsonify({'message': 'Reminder deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Inventory Routes
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    try:
        query = InventoryItem.query
        
        pharmacist_id = request.args.get('pharmacist_id', type=int)
        if pharmacist_id:
            query = query.filter_by(pharmacist_id=pharmacist_id)
            
        items = query.order_by(InventoryItem.drug_name).all()
        
        result = []
        for item in items:
            result.append({
                'id': item.id,
                'drugName': item.drug_name,
                'batchNumber': item.batch_number,
                'expiryDate': item.expiry_date.isoformat() if item.expiry_date else None,
                'quantity': item.quantity,
                'createdAt': item.created_at.isoformat()
            })
            
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventory', methods=['POST'])
def add_inventory_item():
    try:
        data = request.get_json()
        
        required = ['pharmacistId', 'drugName', 'batchNumber', 'expiryDate', 'quantity']
        for field in required:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
                
        # Parse date
        try:
            exp_date = datetime.strptime(data['expiryDate'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format (YYYY-MM-DD)'}), 400
            
        item = InventoryItem(
            pharmacist_id=data['pharmacistId'],
            drug_name=data['drugName'],
            batch_number=data['batchNumber'],
            expiry_date=exp_date,
            quantity=int(data['quantity'])
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({'message': 'Item added successfully', 'id': item.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventory/<int:item_id>', methods=['PUT'])
def update_inventory_item(item_id):
    try:
        item = InventoryItem.query.get_or_404(item_id)
        data = request.get_json()
        
        if 'quantity' in data:
            item.quantity = int(data['quantity'])
        if 'drugName' in data:
            item.drug_name = data['drugName']
        if 'expiryDate' in data:
            item.expiry_date = datetime.strptime(data['expiryDate'], '%Y-%m-%d').date()
            
        db.session.commit()
        return jsonify({'message': 'Item updated'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventory/<int:item_id>', methods=['DELETE'])
def delete_inventory_item(item_id):
    try:
        item = InventoryItem.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Analytics Routes
@app.route('/api/analytics', methods=['GET'])
def get_dashboard_stats():
    try:
        # Total Users
        total_users = User.query.count()
        patients_count = User.query.filter_by(role='patient').count()
        doctors_count = User.query.filter_by(role='doctor').count()
        pharmacists_count = User.query.filter_by(role='pharmacist').count()
        
        # Prescriptions
        total_prescriptions = Prescription.query.count()
        active_prescriptions = Prescription.query.filter_by(status='Active').count()
        
        # Inventory
        total_stock_value = 0 # Placeholder if we had price
        low_stock_items = InventoryItem.query.filter(InventoryItem.quantity < 10).count()
        
        return jsonify({
            'users': {
                'total': total_users,
                'patients': patients_count,
                'doctors': doctors_count,
                'pharmacists': pharmacists_count
            },
            'prescriptions': {
                'total': total_prescriptions,
                'active': active_prescriptions
            },
            'inventory': {
                'lowStock': low_stock_items
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/adherence', methods=['GET'])
def get_adherence_stats():
    try:
        # Mocking adherence based on prescription status distribution
        stats = db.session.query(
            Prescription.status, func.count(Prescription.id)
        ).group_by(Prescription.status).all()
        
        data = {status: count for status, count in stats}
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/patient-activity', methods=['GET'])
def get_patient_analytics():
    try:
        # 1. Prescription History (Recent 5) - Fixed to use correct field names
        recent_prescriptions = Prescription.query.order_by(Prescription.created_at.desc()).limit(5).all()
        history_data = []
        for p in recent_prescriptions:
            history_data.append({
                'name': p.medicine_name,
                'date': p.created_at.strftime('%Y-%m-%d') if p.created_at else (p.start_date.strftime('%Y-%m-%d') if p.start_date else 'N/A')
            })

        # 2. Graph Data (Prescriptions per week for last 4 weeks)
        today = datetime.now().date()
        graph_data = [0, 0, 0, 0] # Week 1 (oldest) to Week 4 (newest)
        
        # Fetch last 28 days using created_at
        start_date = today - timedelta(days=28)
        # Convert start_date to datetime for comparison
        start_datetime = datetime.combine(start_date, time(0, 0, 0))
        last_month_prescriptions = Prescription.query.filter(
            Prescription.created_at >= start_datetime
        ).all()
        
        for p in last_month_prescriptions:
            if p.created_at:
                presc_date = p.created_at.date() if isinstance(p.created_at, datetime) else p.created_at
                days_ago = (today - presc_date).days
                if days_ago < 7:
                    graph_data[3] += 1
                elif days_ago < 14:
                    graph_data[2] += 1
                elif days_ago < 21:
                    graph_data[1] += 1
                elif days_ago < 28:
                    graph_data[0] += 1
        
        # 3. Calculate missed remainder (missed doses based on reminders)
        # Get all reminders and check which ones have passed their time without being taken
        all_reminders = Reminder.query.all()
        missed_count = 0
        missed_details = []
        
        now = datetime.now()
        # Check reminders from the last 7 days
        seven_days_ago = now - timedelta(days=7)
        
        for reminder in all_reminders:
            # Parse reminder time
            if reminder.time:
                reminder_time = reminder.time if isinstance(reminder.time, time) else datetime.strptime(reminder.time, '%H:%M').time()
                
                # Check if reminder date has passed
                if reminder.date:
                    reminder_date = reminder.date if isinstance(reminder.date, date) else datetime.strptime(reminder.date, '%Y-%m-%d').date()
                    reminder_datetime = datetime.combine(reminder_date, reminder_time)
                    
                    # If reminder time has passed and it's within last 7 days, consider it missed
                    if reminder_datetime < now and reminder_datetime >= seven_days_ago:
                        missed_count += 1
                        missed_details.append({
                            'medication': reminder.medication_name,
                            'date': reminder_date.strftime('%Y-%m-%d'),
                            'time': reminder_time.strftime('%H:%M')
                        })
                else:
                    # Daily reminder - check if today's time has passed
                    today_reminder = datetime.combine(now.date(), reminder_time)
                    if today_reminder < now and today_reminder >= seven_days_ago:
                        missed_count += 1
                        missed_details.append({
                            'medication': reminder.medication_name,
                            'date': now.date().strftime('%Y-%m-%d'),
                            'time': reminder_time.strftime('%H:%M')
                        })
        
        # 4. Get new prescriptions (created in last 7 days)
        new_prescriptions = Prescription.query.filter(
            Prescription.created_at >= seven_days_ago
        ).order_by(Prescription.created_at.desc()).all()
        
        new_prescriptions_data = []
        for p in new_prescriptions:
            patient = User.query.get(p.patient_id) if p.patient_id else None
            doctor = User.query.get(p.doctor_id) if p.doctor_id else None
            new_prescriptions_data.append({
                'id': p.id,
                'medicineName': p.medicine_name,
                'patientName': p.patient_name,
                'doctorName': doctor.full_name if doctor else 'Unknown Doctor',
                'date': p.created_at.strftime('%Y-%m-%d') if p.created_at else 'N/A',
                'status': p.status
            })
        
        return jsonify({
            'history': history_data,
            'graphData': graph_data,
            'missedRemainder': {
                'count': missed_count,
                'details': missed_details[:10]  # Limit to 10 most recent
            },
            'newPrescriptions': new_prescriptions_data
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/doctors', methods=['GET'])
def get_doctor_analytics():
    try:
        # Top doctors by prescription count
        stats = db.session.query(
            User.full_name, func.count(Prescription.id)
        ).join(Prescription, User.id == Prescription.doctor_id)\
         .group_by(User.full_name)\
         .order_by(func.count(Prescription.id).desc())\
         .limit(5).all()
        
        data = [{'name': name, 'count': count} for name, count in stats]
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/pharmacy', methods=['GET'])
def get_pharmacy_insights():
    try:
        # Top selling drugs (by number of prescriptions dispensed approx. or just count of prescriptions made for them)
        top_drugs = db.session.query(
            Prescription.medicine_name, func.count(Prescription.id)
        ).group_by(Prescription.medicine_name)\
         .order_by(func.count(Prescription.id).desc())\
         .limit(5).all()
         
        # Expiring soon (next 30 days)
        # Note: SQLite date comparison might need specific format handling usually, but let's try standard
        # For simplicity in this demo, fetching all and filtering in python if needed, or using raw SQL
        # Using basic query
        
        inventory_stats = InventoryItem.query.all()
        today = datetime.now().date()
        expiring = [i for i in inventory_stats if i.expiry_date and (i.expiry_date - today).days <= 30 and (i.expiry_date - today).days >= 0]
        
        return jsonify({
            'topDrugs': [{'name': name, 'count': count} for name, count in top_drugs],
            'expiringCount': len(expiring),
            'expiringItems': [{'name': i.drug_name, 'date': i.expiry_date.isoformat()} for i in expiring[:5]]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/export', methods=['GET'])
def export_report():
    try:
        # Generate a CSV of all prescriptions
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerow(['ID', 'Patient', 'Doctor', 'Medicine', 'Frequency', 'Status', 'Date'])
        
        prescriptions = Prescription.query.all()
        for p in prescriptions:
            cw.writerow([
                p.id, 
                p.patient_name, 
                p.doctor.full_name if p.doctor else 'Unknown',
                p.medicine_name,
                p.dose_frequency,
                p.status,
                p.created_at.strftime('%Y-%m-%d')
            ])
            
        output = io.BytesIO()
        output.write(si.getvalue().encode('utf-8'))
        output.seek(0)
        
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'compliance_report_{datetime.now().strftime("%Y%m%d")}.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check route
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

