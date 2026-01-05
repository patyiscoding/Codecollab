"""
Authentication utilities for CodeCollab MVP.
Handles user management, password hashing, and JWT tokens.
"""
from datetime import datetime, timedelta
from typing import Optional
import uuid
import hashlib
import secrets

from jose import JWTError, jwt
from pydantic import BaseModel

# Security configuration
SECRET_KEY = "codecollab-secret-key-change-in-production-gcp-deployment-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours


class User(BaseModel):
    """User model"""
    id: str
    username: str
    password_hash: str
    created_at: float


class UserPublic(BaseModel):
    """Public user info (without password)"""
    id: str
    username: str
    created_at: float


class UserCreate(BaseModel):
    """User registration request"""
    username: str
    password: str


class UserLogin(BaseModel):
    """User login request"""
    username: str
    password: str


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """JWT token payload"""
    username: Optional[str] = None


class UserStore:
    """In-memory user storage (MVP)"""
    
    def __init__(self):
        self.users: dict[str, User] = {}
        self.username_to_id: dict[str, str] = {}
    
    def create_user(self, username: str, password: str) -> User:
        """Create a new user"""
        if username in self.username_to_id:
            raise ValueError("Username already exists")
        
        user_id = str(uuid.uuid4())
        # Simple password hashing: SHA256(password + salt)
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest() + ':' + salt
        user = User(
            id=user_id,
            username=username,
            password_hash=password_hash,
            created_at=datetime.now().timestamp()
        )
        
        self.users[user_id] = user
        self.username_to_id[username] = user_id
        return user
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        user_id = self.username_to_id.get(username)
        if user_id is None:
            return None
        return self.users.get(user_id)
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(user_id)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            stored_hash, salt = hashed_password.split(':')
            computed_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
            return computed_hash == stored_hash
        except:
            return False
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user"""
        user = self.get_user_by_username(username)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[TokenData]:
    """Decode and verify a JWT access token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return TokenData(username=username)
    except JWTError:
        return None

