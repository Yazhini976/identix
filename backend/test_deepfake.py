import requests

def test_deepfake_endpoint():
    url = "http://localhost:8000/deepfake-check"
    try:
        response = requests.post(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    print("Testing Deepfake Detection Endpoint...")
    test_deepfake_endpoint()
