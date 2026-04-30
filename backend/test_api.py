import requests

def test_registration():
    url = "http://localhost:8000/register"
    data = {
        "name": "Test User",
        "age": 25,
        "email": "test@example.com",
        "password": "password123",
        "phone": "1234567890",
        "dob": "1999-01-01",
        "address": "123 Test St, Test City"
    }
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            user_id = response.json().get("id")
            print(f"Registration successful for ID: {user_id}")
            
            # Now try to fetch the user
            get_url = f"http://localhost:8000/user/{user_id}"
            get_response = requests.get(get_url)
            print(f"GET Status Code: {get_response.status_code}")
            print(f"GET Response: {get_response.json()}")
            # Now try to login
            login_url = "http://localhost:8000/login"
            login_data = {
                "email": "test@example.com",
                "password": "password123"
            }
            login_res = requests.post(login_url, json=login_data)
            print(f"Login Status Code: {login_res.status_code}")
            print(f"Login Response: {login_res.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_registration()
