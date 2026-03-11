import os
import json
from app import app, db
from models import User

def test_workflow():
    with app.test_client() as client:
        with app.app_context():
            # Clean up test user if exists
            user = User.query.filter_by(email='test_dr_workflow@example.com').first()
            if user:
                db.session.delete(user)
                db.session.commit()
            
            print("1. Registering a new doctor...")
            res = client.post('/api/auth/register', json={
                'email': 'test_dr_workflow@example.com',
                'password': 'password123',
                'fullName': 'Dr. Test Workflow',
                'phone': '1234567890',
                'role': 'doctor',
                'licenseNumber': 'LIC123',
                'specialization': 'General'
            })
            print(f"Register status: {res.status_code}")
            user_data = res.get_json()['user']
            dr_id = user_data['id']
            print(f"Doctor isVerified: {user_data.get('isVerified')}")
            assert not user_data.get('isVerified')
            
            print("\n2. Trying to log in as unverified doctor...")
            res = client.post('/api/auth/login', json={
                'email': 'test_dr_workflow@example.com',
                'password': 'password123'
            })
            print(f"Login status: {res.status_code}")
            print(f"Error message: {res.get_json().get('error')}")
            assert res.status_code == 403
            
            print("\n3. Fetching pending doctors as admin...")
            res = client.get('/api/admin/doctors/pending')
            pending = res.get_json()
            print(f"Pending doctors count: {len(pending)}")
            assert any(d['id'] == dr_id for d in pending)
            
            print("\n4. Admin approves the doctor...")
            res = client.put(f'/api/admin/doctors/{dr_id}/verify')
            print(f"Approve status: {res.status_code}")
            assert res.status_code == 200
            
            print("\n5. Fetching pending doctors again...")
            res = client.get('/api/admin/doctors/pending')
            pending = res.get_json()
            print(f"Pending doctors count: {len(pending)}")
            assert not any(d['id'] == dr_id for d in pending)
            
            print("\n6. Trying to log in again as verified doctor...")
            res = client.post('/api/auth/login', json={
                'email': 'test_dr_workflow@example.com',
                'password': 'password123'
            })
            print(f"Login status: {res.status_code}")
            assert res.status_code == 200
            print("Login successful!")

if __name__ == '__main__':
    test_workflow()
