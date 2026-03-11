from app import app, db
import json
from datetime import datetime

def test_enforcement():
    client = app.test_client()
    
    # payload base
    payload = {
        'doctorId': 2, # Assuming ID 2 is doctor
        'patientName': 'Satis', # Only for schema requirement, shouldn't be used for lookup
        'medicineName': 'TestMeds',
        'doseFrequency': '1x daily',
        'startDate': datetime.now().isoformat(),
        'quantity': 10
    }
    
    print("Test 1: Missing patientId")
    res = client.post('/api/prescriptions', json=payload)
    print(f"Status: {res.status_code}, Response: {res.json}")
    if res.status_code == 400 and 'Patient ID is required' in res.json.get('error', ''):
        print("PASS")
    else:
        print("FAIL")
        
    print("\nTest 2: Invalid format patientId")
    payload_invalid = payload.copy()
    payload_invalid['patientId'] = "abc"
    res = client.post('/api/prescriptions', json=payload_invalid)
    print(f"Status: {res.status_code}, Response: {res.json}")
    if res.status_code == 400 and 'Invalid Patient ID format' in res.json.get('error', ''):
        print("PASS")
    else:
        print("FAIL")

    print("\nTest 3: Non-existent patientId")
    payload_missing = payload.copy()
    payload_missing['patientId'] = 99999
    res = client.post('/api/prescriptions', json=payload_missing)
    print(f"Status: {res.status_code}, Response: {res.json}")
    if res.status_code == 404 and 'Patient not found' in res.json.get('error', ''):
        print("PASS")
    else:
        print("FAIL")

    print("\nTest 4: Valid patientId (ID 1)")
    payload_valid = payload.copy()
    payload_valid['patientId'] = 1 # Assuming ID 1 is patient
    res = client.post('/api/prescriptions', json=payload_valid)
    print(f"Status: {res.status_code}, Response: {res.json}")
    if res.status_code == 201:
        print("PASS")
    else:
        print(f"FAIL - {res.json}")

if __name__ == "__main__":
    with app.app_context():
        test_enforcement()
