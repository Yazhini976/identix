import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import os
from dotenv import load_dotenv

load_dotenv()

# Support DATABASE_URL (provided by Render) or individual env vars (local dev)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render provides postgres:// but psycopg2 needs postgresql://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    DB_CONFIG = None  # Will use DATABASE_URL directly
else:
    DB_CONFIG = {
        "dbname": os.getenv("DB_NAME", "identix"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "123"),
        "host": os.getenv("DB_HOST", "localhost"),
        "port": os.getenv("DB_PORT", "5432")
    }


def get_connection():
    """Returns a PostgreSQL connection."""
    try:
        if DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL)
        else:
            conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        raise

@contextmanager
def get_db():
    """Context manager for PostgreSQL database connections."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initialises the PostgreSQL database and performs migrations."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            # 1. Create users table if it doesn't exist
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id                  TEXT PRIMARY KEY,
                    name                TEXT NOT NULL,
                    age                 INTEGER NOT NULL,
                    verification_status TEXT NOT NULL DEFAULT 'pending',
                    face_image_path     TEXT,
                    id_file_path        TEXT,
                    liveness_status     TEXT NOT NULL DEFAULT 'pending',
                    trust_score         INTEGER NOT NULL DEFAULT 75
                )
                """
            )

            # Migrate: check if columns exist using information_schema
            cursor.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
            )
            existing_cols = [row[0] for row in cursor.fetchall()]
            
            if "liveness_status" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN liveness_status TEXT NOT NULL DEFAULT 'pending'")
            if "trust_score" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN trust_score INTEGER NOT NULL DEFAULT 75")
            if "email" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN email TEXT UNIQUE")
            if "password" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN password TEXT")
            if "phone" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT")
            if "dob" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN dob TEXT")
            if "address" not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN address TEXT")

            # 2. Create verification_records table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS verification_records (
                    id           SERIAL PRIMARY KEY,
                    user_id      TEXT NOT NULL,
                    timestamp    TEXT NOT NULL,
                    trust_score  INTEGER NOT NULL,
                    confidence   REAL NOT NULL,
                    record_hash  TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
                """
            )

            # 3. Create sharing_tokens table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS sharing_tokens (
                    token        TEXT PRIMARY KEY,
                    user_id      TEXT NOT NULL,
                    fields       TEXT NOT NULL, -- JSON string or comma-separated
                    expiry       TIMESTAMP NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
                """
            )

            conn.commit()
    print("PostgreSQL Database initialized successfully.")

if __name__ == "__main__":
    init_db()
