import requests
import json
import uuid

BASE_URL = "http://localhost:8000"

def run_full_flow():
    # 1. Register User
    email = f"test_{uuid.uuid4().hex[:4]}@example.com"
    print(f"1. Registering user with email: {email}")
    reg_data = {
        "name": "Verification Tester",
        "age": 30,
        "email": email,
        "password": "securepassword",
        "phone": "9876543210",
        "dob": "1994-05-15",
        "address": "456 Verify Lane, Trust City"
    }
    reg_resp = requests.post(f"{BASE_URL}/register", data=reg_data)
    if reg_resp.status_code != 200:
        print(f"Registration failed: {reg_resp.text}")
        return
    
    user_id = reg_resp.json()["id"]
    print(f"User registered with ID: {user_id}")

    # 2. Generate Sharing Token
    print(f"\n2. Generating sharing token for user {user_id}")
    fields = ["name:verify", "email:mask", "status"]
    share_resp = requests.post(f"{BASE_URL}/generate-share-token", json={
        "user_id": user_id,
        "fields": fields
    })
    if share_resp.status_code != 200:
        print(f"Token generation failed: {share_resp.text}")
        return
    
    token = share_resp.json()["token"]
    print(f"Token generated: {token}")

    # 3. Verify Token
    print(f"\n3. Verifying token: {token}")
    # We expect name to match
    verify_resp = requests.post(f"{BASE_URL}/verify-token", json={
        "token": token,
        "expected_name": "Verification Tester"
    })
    
    if verify_resp.status_code == 200:
        print("Verification Successful!")
        print(json.dumps(verify_resp.json(), indent=2))
    else:
        print(f"Verification Failed: {verify_resp.text}")

if __name__ == "__main__":
    run_full_flow()
