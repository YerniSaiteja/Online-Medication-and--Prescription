import os
import json
from app import app, db
from models import User

def test_rejection_workflow():
    with app.test_client() as client:
        with app.app_context():
            # Clean up test user if exists
            user = User.query.filter_by(email='test_dr_reject@example.com').first()
            if user:
                db.session.delete(user)
                db.session.commit()
            
            print("1. Registering a new doctor...")
            res = client.post('/api/auth/register', json={
                'email': 'test_dr_reject@example.com',
                'password': 'password123',
                'fullName': 'Dr. Test Reject',
                'phone': '1234567890',
                'role': 'doctor',
                'licenseNumber': 'LIC-REJ',
                'specialization': 'General'
            })
            print(f"Register status: {res.status_code}")
            user_data = res.get_json()['user']
            dr_id = user_data['id']
            
            print("\n2. Admin rejects the doctor...")
            res = client.delete(f'/api/admin/doctors/{dr_id}/reject')
            print(f"Reject status: {res.status_code}")
            assert res.status_code == 200
            
            print("\n3. Trying to log in as rejected doctor...")
            res = client.post('/api/auth/login', json={
                'email': 'test_dr_reject@example.com',
                'password': 'password123'
            })
            print(f"Login status: {res.status_code}")
            print(f"Error message: {res.get_json().get('error')}")
            assert res.status_code == 403
            assert 'rejected by the admin' in res.get_json().get('error')
            
            print("\n4. Confirm account still exists but is rejected...")
            user = User.query.get(dr_id)
            print(f"User exists: {user is not None}")
            print(f"User is_rejected: {user.is_rejected}")
            assert user is not None
            assert user.is_rejected == True
            
            print("\nAll tests passed!")

if __name__ == '__main__':
    test_rejection_workflow()
