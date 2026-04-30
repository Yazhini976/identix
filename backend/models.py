from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    id: str
    name: str
    age: int
    email: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    verification_status: str = "pending"
    face_image_path: Optional[str] = None
    id_file_path: Optional[str] = None
    liveness_status: str = "pending"
    trust_score: int = 75
