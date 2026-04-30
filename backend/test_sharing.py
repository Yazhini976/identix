import requests
import json

BASE_URL = "http://localhost:8000"

def test_selective_sharing():
    user_id = "b6f560cf"
    fields = ["email:verify", "phone:mask", "address:disclose", "name:verify", "dob:disclose"]
    
    # 1. Generate Token
    print(f"Generating token for user {user_id} with fields {fields}...")
    resp = requests.post(f"{BASE_URL}/generate-share-token", json={
        "user_id": user_id,
        "fields": fields
    })
    if resp.status_code != 200:
        print(f"Failed to generate token: {resp.text}")
        return
    
    token_data = resp.json()
    token = token_data["token"]
    print(f"Token generated: {token}")
    
    # 2. Verify Token (No expected values)
    print("\nVerifying token (No expected values)...")
    resp = requests.post(f"{BASE_URL}/verify-token", json={"token": token})
    print(json.dumps(resp.json(), indent=2))
    
    # 3. Verify Token (With expected values)
    print("\nVerifying token (With expected values)...")
    resp = requests.post(f"{BASE_URL}/verify-token", json={
        "token": token,
        "expected_email": "fulltest@example.com",
        "expected_mobile": "9876543210",
        "expected_name": "Full Test"
    })
    print(json.dumps(resp.json(), indent=2))

    # 4. Test wrong expected value
    print("\nVerifying token (With WRONG expected email)...")
    resp = requests.post(f"{BASE_URL}/verify-token", json={
        "token": token,
        "expected_email": "wrong@example.com"
    })
    print(json.dumps(resp.json(), indent=2))

if __name__ == "__main__":
    test_selective_sharing()
