import psycopg2
DB_CONFIG = {
    "dbname": "identix",
    "user": "postgres",
    "password": "123",
    "host": "localhost",
    "port": "5432"
}
try:
    conn = psycopg2.connect(**DB_CONFIG)
    print("Connected successfully")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
