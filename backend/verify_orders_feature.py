import requests
import json
import sys
import os

# Base URL
BASE_URL = 'http://127.0.0.1:5000'

def test_orders_flow():
    print("Starting verification of Orders Flow...")
    
    # 1. Create a Doctor
    doctor_email = "verify_doc@test.com"
    doctor_data = {
        "email": doctor_email,
        "password": "password123",
        "fullName": "Dr. Verify",
        "phone": "1234567890",
        "role": "doctor"
    }
    
    # Register doctor (ignore error if exists)
    requests.post(f"{BASE_URL}/api/auth/register", json=doctor_data)
    
    # Login to get ID
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": doctor_email, "password": "password123"})
    if res.status_code != 200:
        print(f"Failed to login doctor: {res.text}")
        return False
    doctor_id = res.json()['user']['id']
    print(f"Doctor logged in. ID: {doctor_id}")

    # 2. Create a Patient
    patient_email = "verify_pat@test.com"
    patient_data = {
        "email": patient_email,
        "password": "password123",
        "fullName": "Patient Verify",
        "phone": "0987654321",
        "role": "patient"
    }
    
    # Register patient (ignore error if exists)
    requests.post(f"{BASE_URL}/api/auth/register", json=patient_data)
    
    # Login to get ID
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": patient_email, "password": "password123"})
    if res.status_code != 200:
        print(f"Failed to login patient: {res.text}")
        return False
    patient_id = res.json()['user']['id']
    print(f"Patient logged in. ID: {patient_id}")

    # 3. Create a Prescription
    prescription_data = {
        "doctorId": doctor_id,
        "patientName": "Patient Verify",
        "patientId": patient_id,
        "medicineName": "TestOrderMed 500mg",
        "doseFrequency": "Twice daily",
        "startDate": "2025-01-01T10:00:00Z",
        "status": "Active"
    }
    
    res = requests.post(f"{BASE_URL}/api/prescriptions", json=prescription_data)
    if res.status_code != 201:
        print(f"Failed to create prescription: {res.text}")
        return False
    print("Prescription created successfully.")

    # 4. Fetch Active Orders (Pharmacist View)
    # This is the key test: calling the API with ?status=Active
    res = requests.get(f"{BASE_URL}/api/prescriptions?status=Active")
    if res.status_code != 200:
        print(f"Failed to fetch prescriptions: {res.text}")
        return False
    
    orders = res.json()
    found = False
    for order in orders:
        if order['medicineName'] == "TestOrderMed 500mg" and order['patientId'] == patient_id:
            found = True
            print("SUCCESS: Found the newly created prescription in Active Orders!")
            break
            
    if not found:
        print("FAILURE: Did not find the prescription in the orders list.")
        # Debug: print what was found
        print(f"Found {len(orders)} orders but not the target.")
        return False

    return True

if __name__ == "__main__":
    if test_orders_flow():
        sys.exit(0)
    else:
        sys.exit(1)
