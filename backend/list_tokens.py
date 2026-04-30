import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "identix",
    "user": "postgres",
    "password": "123",
    "host": "localhost",
    "port": "5432"
}

def list_tokens():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM sharing_tokens")
            tokens = cursor.fetchall()
            print("Current Verification Tokens:")
            for t in tokens:
                print(f"Token: {t['token']} | User: {t['user_id']} | Fields: {t['fields']} | Expiry: {t['expiry']}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_tokens()
