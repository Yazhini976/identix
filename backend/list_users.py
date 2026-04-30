import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "identix",
    "user": "postgres",
    "password": "123",
    "host": "localhost",
    "port": "5432"
}

def get_users():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, name, email FROM users LIMIT 5")
    users = cur.fetchall()
    cur.close()
    conn.close()
    return users

if __name__ == "__main__":
    users = get_users()
    for u in users:
        print(f"ID: {u['id']}, Name: {u['name']}, Email: {u['email']}")
