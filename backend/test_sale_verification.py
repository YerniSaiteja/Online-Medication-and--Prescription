import requests
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:5000/api'

def run_test():
    print("Starting verification test for Sales Feature...")
    
    # 1. Register a Pharmacist
    pharmacist_email = f"pharm_test_{datetime.now().timestamp()}@example.com"
    r = requests.post(f'{BASE_URL}/auth/register', json={
        'email': pharmacist_email, 'password': 'pass', 'fullName': 'Test Pharm', 'phone': '123', 'role': 'pharmacist'
    })
    pharm_id = r.json().get('user', {}).get('id')
    print(f"Registered Pharmacist ID: {pharm_id}")
    
    # 2. Add Inventory
    drug_name = f"TestDrug_{int(datetime.now().timestamp())}"
    r = requests.post(f'{BASE_URL}/inventory', json={
        'pharmacistId': pharm_id,
        'drugName': drug_name,
        'batchNumber': 'B123',
        'expiryDate': '2030-01-01',
        'quantity': 100
    })
    if r.status_code != 201:
        print(f"Failed to add inventory: {r.text}")
        return
    print(f"Added Inventory: {drug_name} (Qty: 100)")
    
    # 3. Register a Doctor
    doctor_email = f"doc_test_{datetime.now().timestamp()}@example.com"
    r = requests.post(f'{BASE_URL}/auth/register', json={
        'email': doctor_email, 'password': 'pass', 'fullName': 'Dr Test', 'phone': '123', 'role': 'doctor'
    })
    doctor_id = r.json().get('user', {}).get('id')

    # 4. Register a Patient
    patient_email = f"pat_test_{datetime.now().timestamp()}@example.com"
    r = requests.post(f'{BASE_URL}/auth/register', json={
        'email': patient_email, 'password': 'pass', 'fullName': 'Pat Test', 'phone': '123', 'role': 'patient'
    })
    patient_id = r.json().get('user', {}).get('id')
    
    # 5. Create Prescription
    r = requests.post(f'{BASE_URL}/prescriptions', json={
        'doctorId': doctor_id,
        'patientName': 'Pat Test',
        'patientId': patient_id, # Optional but precise
        'medicineName': drug_name,
        'doseFrequency': '1 daily',
        'startDate': '2025-01-01',
        'quantity': 10
    })
    if r.status_code != 201:
        print(f"Failed to create prescription: {r.text}")
        return
    presc_id = r.json()['prescription']['id']
    presc_qty = r.json()['prescription'].get('quantity')
    print(f"Created Prescription ID: {presc_id} for {drug_name} Qty: {presc_qty} (Should be 10)")
    
    if presc_qty != 10:
        print("ERROR: Prescription quantity not saved correctly!")
        return

    # 6. Sell / Dispense
    r = requests.post(f'{BASE_URL}/prescriptions/{presc_id}/dispense')
    if r.status_code != 200:
        print(f"Failed to dispense: {r.text}")
        return
    print("Dispensed successfully.")
    
    # 7. Verify Inventory Reduced
    r = requests.get(f'{BASE_URL}/inventory?pharmacist_id={pharm_id}')
    items = r.json()
    target_item = next((i for i in items if i['drugName'] == drug_name), None)
    
    if target_item and target_item['quantity'] == 90:
        print(f"SUCCESS: Inventory reduced to 90.")
    else:
        print(f"FAILURE: Inventory quantity is {target_item['quantity'] if target_item else 'None'} (Expected 90)")

    # 8. Verify Prescription Status
    r = requests.get(f'{BASE_URL}/prescriptions?doctor_id={doctor_id}')
    prescs = r.json()
    target_presc = next((p for p in prescs if p['id'] == presc_id), None)
    if target_presc and target_presc['status'] == 'Dispensed':
        print("SUCCESS: Prescription status updated to 'Dispensed'.")
    else:
        print(f"FAILURE: Prescription status is {target_presc['status'] if target_presc else 'None'}")

if __name__ == "__main__":
    run_test()
