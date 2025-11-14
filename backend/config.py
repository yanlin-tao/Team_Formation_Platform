import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "34.172.159.62"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "admin"),
    "password": os.getenv("DB_PASSWORD", "CS411sqlmaster@"),
    "database": os.getenv("DB_NAME", "CS411-teamup"),
    "charset": "utf8mb4",
    "collation": "utf8mb4_unicode_ci",
}

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


def get_db_config():
    return DB_CONFIG.copy()


def validate_config():
    required_vars = ["DB_HOST", "DB_USER", "DB_NAME"]
    missing = []

    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)

    if missing:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing)}"
        )

    return True
