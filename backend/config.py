"""
Configuration module for TeamUp UIUC backend
Loads configuration from environment variables or .env file
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '34.172.159.62'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'team001_db'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

# API Configuration
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', 8000))

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

# JWT Configuration (for future authentication)
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Logging Configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

def get_db_config():
    """Get database configuration dictionary"""
    return DB_CONFIG.copy()

def validate_config():
    """Validate that required configuration is present"""
    required_vars = ['DB_HOST', 'DB_USER', 'DB_NAME']
    missing = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    return True

